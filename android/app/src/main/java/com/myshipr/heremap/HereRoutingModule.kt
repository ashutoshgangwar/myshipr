package com.myshipr.heremap

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.here.sdk.core.GeoCoordinates
import com.here.sdk.routing.AvoidanceOptions
import com.here.sdk.routing.BatterySpecifications
import com.here.sdk.routing.CalculateRouteCallback
import com.here.sdk.routing.ElectricVehicleOptions
import com.here.sdk.routing.EmpiricalConsumptionModel
import com.here.sdk.routing.OptimizationMode
import com.here.sdk.routing.RoadFeatures
import com.here.sdk.routing.Route
import com.here.sdk.routing.RouteOptions
import com.here.sdk.routing.RoutingError
import com.here.sdk.routing.RoutingOptions
import com.here.sdk.routing.Waypoint
import com.here.sdk.transport.HazardousMaterial
import com.here.sdk.transport.TransportMode
import com.here.sdk.transport.TransportSpecification
import com.here.sdk.transport.TruckCategory
import com.here.sdk.transport.TunnelCategory
import com.here.sdk.transport.VehicleSpecification

/**
 * Point-to-point routing on top of the HERE SDK `RoutingEngine`.
 *
 * Each method resolves a JS-friendly summary of the best route and keeps the
 * native [Route] in [RouteStore], so navigation can be started later with just
 * the returned `routeId`.
 *
 * Built on the unified `RoutingOptions` + `TransportSpecification` API — the
 * per-mode `CarOptions`/`TruckOptions`/`EV*Options` classes are deprecated as of
 * SDK 4.27.
 *
 * JS side: `src/here/HereRouting.js`.
 */
class HereRoutingModule(
    reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "HereRoutingModule"
        const val MODULE_NAME = "HereRoutingModule"

        // HERE's reference consumption figures for a mid-size EV, used when the
        // caller supplies no model of its own. Keys are km/h, values kWh/m.
        private val DEFAULT_FREE_FLOW_SPEED_TABLE =
            mapOf(0 to 0.239, 27 to 0.239, 60 to 0.196, 90 to 0.238)
        private val DEFAULT_TRAFFIC_SPEED_TABLE =
            mapOf(0 to 0.349, 27 to 0.319, 60 to 0.244, 90 to 0.256)
    }

    override fun getName(): String = MODULE_NAME

    // -------------------------------------------------------------------------
    // Public JS API
    // -------------------------------------------------------------------------

    /**
     * Car route. `options` is the shared block:
     * `{ vehicle?: {…}, routeOptions?: {…}, avoid?: { features: [...] } }`.
     */
    @ReactMethod
    fun calculateCarRoute(
        originLat: Double,
        originLng: Double,
        destLat: Double,
        destLng: Double,
        options: ReadableMap?,
        promise: Promise
    ) = calculate(promise) { callback ->
        HereRoutingService.routingEngine().calculateRoute(
            waypoints(originLat, originLng, destLat, destLng),
            routingOptions(TransportMode.CAR, options, options?.getMap("vehicle")),
            callback
        )
    }

    /**
     * Truck route. `truckOptions` carries the dimensions the shipment form
     * collects — weights in kilograms, dimensions in centimetres — alongside the
     * shared `routeOptions` / `avoid` blocks:
     * ```
     * { grossWeight, currentWeight, weightPerAxle, height, width, length,
     *   axleCount, trailerCount, trailerAxleCount, payloadCapacity,
     *   isTruckLight, truckType: 'tractor' | 'straight',
     *   tunnelCategory: 'B' | 'C' | 'D' | 'E', hazardousMaterials: [...],
     *   routeOptions: {...}, avoid: {...} }
     * ```
     */
    @ReactMethod
    fun calculateTruckRoute(
        originLat: Double,
        originLng: Double,
        destLat: Double,
        destLng: Double,
        truckOptions: ReadableMap?,
        promise: Promise
    ) = calculate(promise) { callback ->
        HereRoutingService.routingEngine().calculateRoute(
            waypoints(originLat, originLng, destLat, destLng),
            routingOptions(TransportMode.TRUCK, truckOptions, truckOptions),
            callback
        )
    }

    /**
     * Electric-vehicle route, including charging stops when the battery cannot
     * cover the distance.
     * ```
     * { transportMode: 'car' | 'truck',      // default 'car'
     *   ensureReachability: Boolean,          // default true
     *   vehicle: {…},                         // dimensions, as above
     *   battery: { totalCapacityKwh, initialChargeKwh, targetChargeKwh,
     *              minChargeAtChargingStationKwh, minChargeAtDestinationKwh },
     *   consumption: { ascentWhPerMeter, descentWhPerMeter, auxiliaryWhPerSecond,
     *                  freeFlowSpeedTable, trafficSpeedTable },
     *   routeOptions: {...}, avoid: {...} }
     * ```
     */
    @ReactMethod
    fun calculateEVRoute(
        originLat: Double,
        originLng: Double,
        destLat: Double,
        destLng: Double,
        evOptions: ReadableMap?,
        promise: Promise
    ) = calculate(promise) { callback ->
        val isTruck = evOptions?.getStringOrNull("transportMode")
            ?.equals("truck", ignoreCase = true) == true
        val mode = if (isTruck) TransportMode.TRUCK else TransportMode.CAR

        HereRoutingService.routingEngine().calculateRoute(
            waypoints(originLat, originLng, destLat, destLng),
            routingOptions(
                mode = mode,
                options = evOptions,
                vehicle = evOptions?.getMap("vehicle") ?: evOptions,
                ev = evOptions ?: Arguments.createMap()
            ),
            callback
        )
    }

    /** Drops a stored route once JS is done with it. */
    @ReactMethod
    fun releaseRoute(routeId: String, promise: Promise) {
        RouteStore.remove(routeId)
        promise.resolve(true)
    }

    // -------------------------------------------------------------------------
    // Request plumbing
    // -------------------------------------------------------------------------

    /**
     * Shared error handling: a missing SDK engine or a bad argument rejects
     * synchronously, a routing failure rejects from the callback, and success
     * resolves the serialised route.
     */
    private fun calculate(promise: Promise, request: (CalculateRouteCallback) -> Unit) {
        val callback = CalculateRouteCallback { error: RoutingError?, routes: List<Route>? ->
            when {
                error != null -> {
                    Log.w(TAG, "route calculation failed: $error")
                    promise.reject("HERE_ROUTE_ERROR", "Route calculation failed: $error")
                }
                routes.isNullOrEmpty() ->
                    promise.reject("HERE_ROUTE_ERROR", "No route found")
                else ->
                    promise.resolve(serializeRoute(routes.first(), routes))
            }
        }

        try {
            HereSdkModule.requireEngine()
            request(callback)
        } catch (e: Exception) {
            Log.e(TAG, "route request failed: ${e.message}", e)
            promise.reject("HERE_ROUTE_ERROR", e.message ?: "Route request failed", e)
        }
    }

    private fun waypoints(
        originLat: Double,
        originLng: Double,
        destLat: Double,
        destLng: Double
    ): List<Waypoint> = listOf(
        Waypoint(GeoCoordinates(originLat, originLng)),
        Waypoint(GeoCoordinates(destLat, destLng))
    )

    // -------------------------------------------------------------------------
    // Response
    // -------------------------------------------------------------------------

    /**
     * Emits the flat shape JS works with:
     * `{ routeId, distanceMeters, durationSeconds, polyline[], maneuvers[],
     *    routeHandle, alternativeCount, boundingBox }`.
     *
     * Each polyline vertex carries both `{lat,lng}` and `{latitude,longitude}`
     * so it can be handed straight to the map view or to screens that use the
     * geolocation naming.
     */
    private fun serializeRoute(route: Route, allRoutes: List<Route>): WritableMap {
        val durationSeconds = route.duration.seconds.toDouble()
        val trafficDelaySeconds = route.trafficDelay.seconds.toDouble()

        return Arguments.createMap().apply {
            putString("routeId", RouteStore.put(route))
            putDouble("distanceMeters", route.lengthInMeters.toDouble())
            putDouble("durationSeconds", durationSeconds)
            putDouble("trafficDelaySeconds", trafficDelaySeconds)
            putDouble("baseDurationSeconds", durationSeconds - trafficDelaySeconds)
            putString("transportMode", route.requestedTransportMode?.name)
            putInt("alternativeCount", (allRoutes.size - 1).coerceAtLeast(0))
            route.consumptionInKilowattHours?.let { putDouble("consumptionKwh", it) }
            // Null unless routeOptions.enableRouteHandle stayed on — it is the
            // token for refreshing or re-importing this exact route later.
            putString("routeHandle", route.routeHandle?.handle)
            putMap("boundingBox", HereSdkSerialization.geoBox(route.boundingBox))
            putMap("tolls", tolls(route))
            putArray("polyline", polyline(route))
            putArray("maneuvers", maneuvers(route))
        }
    }

    /**
     * `{ total, currency, items: [{ tollSystem, countryCode, price, currency }] }`.
     *
     * One entry per toll booth, priced with its cheapest single-journey fare —
     * season passes and return tickets would otherwise inflate the total for a
     * one-way trip.
     */
    private fun tolls(route: Route): WritableMap {
        var total = 0.0
        var currency: String? = null
        var priced = false
        val items = Arguments.createArray()

        route.sections?.forEach { section ->
            section.tolls?.forEach { toll ->
                val singleFares = toll.fares?.filter { it.pass == null }.orEmpty()
                val cheapest = (singleFares.ifEmpty { toll.fares.orEmpty() })
                    .minByOrNull { it.price }

                items.pushMap(Arguments.createMap().apply {
                    putString("tollSystem", toll.tollSystems?.firstOrNull())
                    putString("countryCode", toll.countryCode)
                    if (cheapest != null) {
                        putDouble("price", cheapest.price)
                        putString("currency", cheapest.currency)
                    } else {
                        putNull("price")
                        putNull("currency")
                    }
                })

                if (cheapest != null) {
                    total += cheapest.price
                    if (currency == null) currency = cheapest.currency
                    priced = true
                }
            }
        }

        return Arguments.createMap().apply {
            // Null rather than 0 when the route has no priced tolls at all —
            // "free" and "unknown" must not look the same in the UI.
            if (priced) putDouble("total", total) else putNull("total")
            putString("currency", currency)
            putArray("items", items)
        }
    }

    private fun polyline(route: Route): WritableArray {
        val array = Arguments.createArray()
        route.geometry?.vertices?.forEach { vertex ->
            array.pushMap(Arguments.createMap().apply {
                putDouble("lat", vertex.latitude)
                putDouble("lng", vertex.longitude)
                putDouble("latitude", vertex.latitude)
                putDouble("longitude", vertex.longitude)
            })
        }
        return array
    }

    /** Every section's maneuvers flattened into one turn-by-turn list. */
    private fun maneuvers(route: Route): WritableArray {
        val array = Arguments.createArray()
        route.sections?.forEach { section ->
            section.maneuvers?.forEach { array.pushMap(HereSdkSerialization.maneuverToMap(it)) }
        }
        return array
    }

    // -------------------------------------------------------------------------
    // Options
    // -------------------------------------------------------------------------

    private fun routingOptions(
        mode: TransportMode,
        options: ReadableMap?,
        vehicle: ReadableMap?,
        ev: ReadableMap? = null
    ): RoutingOptions = RoutingOptions().apply {
        transportSpecification = TransportSpecification().apply {
            transportMode = mode
            vehicleSpecification = buildVehicleSpecification(vehicle)
        }
        routeOptions = buildRouteOptions(options?.getMap("routeOptions"))
        avoidanceOptions = buildAvoidanceOptions(options?.getMap("avoid"))
        if (ev != null) evOptions = buildElectricVehicleOptions(ev)
    }

    /**
     * Shared `routeOptions` block. The route handle is requested by default so
     * the returned `routeHandle` can later refresh or re-import the route.
     */
    private fun buildRouteOptions(routeOptions: ReadableMap?): RouteOptions = RouteOptions().apply {
        enableTolls = true
        enableRouteHandle = true

        if (routeOptions == null) return@apply
        routeOptions.getIntOrNull("alternatives")?.let { alternatives = it }
        routeOptions.getBooleanOrNull("enableTolls")?.let { enableTolls = it }
        routeOptions.getBooleanOrNull("enableRouteHandle")?.let { enableRouteHandle = it }
        routeOptions.getStringOrNull("optimizationMode")?.let { raw ->
            optimizationMode = when (raw.lowercase()) {
                "shortest" -> OptimizationMode.SHORTEST
                else -> OptimizationMode.FASTEST
            }
        }
    }

    /** Weights in kilograms, dimensions in centimetres. */
    private fun buildVehicleSpecification(vehicle: ReadableMap?): VehicleSpecification =
        VehicleSpecification().apply {
            if (vehicle == null) return@apply

            val gross = vehicle.getNumberOrNull("grossWeight")
            gross?.let { grossWeightInKilograms = it }
            // The router needs a laden weight; forms usually only capture the
            // gross figure, so fall back to it rather than routing unladen.
            currentWeightInKilograms = vehicle.getNumberOrNull("currentWeight") ?: gross

            vehicle.getNumberOrNull("weightPerAxle")?.let { weightPerAxleInKilograms = it }
            vehicle.getNumberOrNull("height")?.let { heightInCentimeters = it }
            vehicle.getNumberOrNull("width")?.let { widthInCentimeters = it }
            vehicle.getNumberOrNull("length")?.let { lengthInCentimeters = it }
            vehicle.getNumberOrNull("axleCount")?.let { axleCount = it }
            vehicle.getNumberOrNull("trailerCount")?.let { trailerCount = it }
            vehicle.getNumberOrNull("trailerAxleCount")?.let { trailerAxleCount = it }
            vehicle.getNumberOrNull("payloadCapacity")?.let { payloadCapacityInKilograms = it }
            vehicle.getBooleanOrNull("isTruckLight")?.let { isTruckLight = it }

            when (vehicle.getStringOrNull("truckType")?.lowercase()) {
                "tractor" -> truckCategory = TruckCategory.TRACTOR
                "straight" -> truckCategory = TruckCategory.STRAIGHT
                else -> Unit
            }

            when (vehicle.getStringOrNull("tunnelCategory")?.uppercase()) {
                "B" -> tunnelCategory = TunnelCategory.B
                "C" -> tunnelCategory = TunnelCategory.C
                "D" -> tunnelCategory = TunnelCategory.D
                "E" -> tunnelCategory = TunnelCategory.E
                else -> Unit
            }

            vehicle.getArray("hazardousMaterials")?.let { materials ->
                hazardousMaterials = (0 until materials.size()).mapNotNull { index ->
                    val raw = materials.getString(index) ?: return@mapNotNull null
                    try {
                        HazardousMaterial.valueOf(raw.uppercase())
                    } catch (e: IllegalArgumentException) {
                        Log.w(TAG, "unknown hazardous material '$raw'")
                        null
                    }
                }
            }
        }

    private fun buildAvoidanceOptions(avoid: ReadableMap?): AvoidanceOptions =
        AvoidanceOptions().apply {
            val features = avoid?.getArray("features") ?: return@apply
            roadFeatures = (0 until features.size()).mapNotNull { index ->
                when (features.getString(index)?.lowercase()) {
                    "tollroad", "tolls" -> RoadFeatures.TOLL_ROAD
                    "ferry" -> RoadFeatures.FERRY
                    "tunnel" -> RoadFeatures.TUNNEL
                    "dirtroad" -> RoadFeatures.DIRT_ROAD
                    "highway", "controlledaccesshighway" -> RoadFeatures.CONTROLLED_ACCESS_HIGHWAY
                    "carshuttletrain" -> RoadFeatures.CAR_SHUTTLE_TRAIN
                    "seasonalclosure" -> RoadFeatures.SEASONAL_CLOSURE
                    "uturns" -> RoadFeatures.U_TURNS
                    else -> null
                }
            }
        }

    private fun buildElectricVehicleOptions(ev: ReadableMap): ElectricVehicleOptions =
        ElectricVehicleOptions().apply {
            ensureReachability = ev.getBooleanOrNull("ensureReachability") ?: true
            batterySpecifications = buildBatterySpecifications(ev.getMap("battery"))
            // The router rejects an EV request with no consumption model, so one
            // is always supplied — HERE's reference figures when the caller has
            // none of its own.
            empiricalConsumptionModel = buildConsumptionModel(ev.getMap("consumption"))
        }

    private fun buildBatterySpecifications(battery: ReadableMap?): BatterySpecifications =
        BatterySpecifications().apply {
            totalCapacityInKilowattHours =
                battery?.getDoubleOrNull("totalCapacityKwh") ?: 80.0
            initialChargeInKilowattHours =
                battery?.getDoubleOrNull("initialChargeKwh") ?: (totalCapacityInKilowattHours * 0.9)
            targetChargeInKilowattHours =
                battery?.getDoubleOrNull("targetChargeKwh") ?: (totalCapacityInKilowattHours * 0.9)
            battery?.getDoubleOrNull("minChargeAtChargingStationKwh")?.let {
                minChargeAtChargingStationInKilowattHours = it
            }
            battery?.getDoubleOrNull("minChargeAtDestinationKwh")?.let {
                minChargeAtDestinationInKilowattHours = it
            }
        }

    private fun buildConsumptionModel(consumption: ReadableMap?): EmpiricalConsumptionModel =
        EmpiricalConsumptionModel().apply {
            ascentConsumptionInWattHoursPerMeter =
                consumption?.getDoubleOrNull("ascentWhPerMeter") ?: 9.0
            descentRecoveryInWattHoursPerMeter =
                consumption?.getDoubleOrNull("descentWhPerMeter") ?: 4.3
            auxiliaryConsumptionInWattHoursPerSecond =
                consumption?.getDoubleOrNull("auxiliaryWhPerSecond") ?: 1.8
            freeFlowSpeedTable =
                speedTable(consumption, "freeFlowSpeedTable") ?: DEFAULT_FREE_FLOW_SPEED_TABLE
            trafficSpeedTable =
                speedTable(consumption, "trafficSpeedTable") ?: DEFAULT_TRAFFIC_SPEED_TABLE
        }

    /** `{ "0": 0.239, "90": 0.238 }` → `{0: 0.239, 90: 0.238}` (km/h → kWh/m). */
    private fun speedTable(consumption: ReadableMap?, key: String): Map<Int, Double>? {
        val table = consumption?.getMap(key) ?: return null
        val parsed = mutableMapOf<Int, Double>()
        val iterator = table.keySetIterator()
        while (iterator.hasNextKey()) {
            val speedKey = iterator.nextKey()
            val speed = speedKey.toIntOrNull() ?: continue
            parsed[speed] = table.getDouble(speedKey)
        }
        return parsed.takeIf { it.isNotEmpty() }
    }
}
