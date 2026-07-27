package com.myshipr.heremap

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.here.sdk.core.GeoCoordinates
import com.here.sdk.core.engine.SDKNativeEngine
import com.here.sdk.routing.AvoidanceOptions
import com.here.sdk.routing.BatterySpecifications
import com.here.sdk.routing.ElectricVehicleOptions
import com.here.sdk.routing.OptimizationMode
import com.here.sdk.routing.RoadFeatures
import com.here.sdk.routing.RouteOptions
import com.here.sdk.routing.RoutingEngine
import com.here.sdk.routing.RoutingOptions
import com.here.sdk.routing.TrafficOptimizationMode
import com.here.sdk.routing.Waypoint
import com.here.sdk.routing.WaypointType
import com.here.sdk.transport.HazardousMaterial
import com.here.sdk.transport.PedestrianSpecification
import com.here.sdk.transport.ScooterSpecification
import com.here.sdk.transport.TransportMode
import com.here.sdk.transport.TransportSpecification
import com.here.sdk.transport.TruckType
import com.here.sdk.transport.TunnelCategory
import com.here.sdk.transport.VehicleSpecification
import java.util.Date

/**
 * Online routing backed by the HERE SDK Explore `RoutingEngine` — the
 * replacement for the `router.hereapi.com/v8/routes` REST calls.
 *
 * Covers every transport mode the Explore edition supports (car, truck,
 * pedestrian, scooter, bicycle, bus, taxi, plus the electric variants of car
 * and truck) as well as tolls, alternatives and waypoint-order optimisation —
 * the last of which also replaces the `findsequence2` REST helper.
 */
object HereRoutingService {

    private const val TAG = "HereRoutingService"

    @Volatile
    private var engine: RoutingEngine? = null

    private fun routingEngine(): RoutingEngine {
        engine?.let { return it }
        synchronized(this) {
            engine?.let { return it }
            if (SDKNativeEngine.getSharedInstance() == null) {
                throw IllegalStateException(
                    "HERE SDK is not initialised — call HereMapModule.initSDK() first"
                )
            }
            return RoutingEngine().also { engine = it }
        }
    }

    /**
     * Calculates one or more routes and resolves them as
     * `{ routes: [...] }` (see [HereSdkSerialization.route] for a route's shape).
     *
     * Options:
     * ```
     * {
     *   origin:        { lat, lng } | { latitude, longitude },
     *   destination:   { lat, lng },
     *   waypoints:     [{ lat, lng, passThrough? }],
     *   transportMode: 'truck' | 'car' | 'pedestrian' | 'scooter' | 'bicycle' |
     *                  'bus' | 'privateBus' | 'taxi',
     *   isElectric:    Boolean,          // EV routing for car / truck
     *   vehicle:       { grossWeight, currentWeight, height, width, length,
     *                    axleCount, trailerCount, weightPerAxle, truckType,
     *                    tunnelCategory, hazardousMaterials, payloadCapacity },
     *   ev:            { totalCapacityKwh, initialChargeKwh, targetChargeKwh,
     *                    ensureReachability },
     *   routeOptions:  { alternatives, optimizationMode, enableTolls,
     *                    optimizeWaypointsOrder, departureTime, arrivalTime,
     *                    trafficOptimizationMode },
     *   avoid:         { features: ['tollRoad', 'ferry', ...] },
     *   walkSpeedMps:  Double            // pedestrian only
     * }
     * ```
     */
    fun calculateRoute(options: ReadableMap, promise: Promise) {
        try {
            val waypoints = buildWaypoints(options)
            if (waypoints.size < 2) {
                promise.reject("INVALID_ARGS", "origin and destination are required")
                return
            }

            routingEngine().calculateRoute(
                waypoints,
                buildRoutingOptions(options)
            ) { error, routes ->
                if (error != null) {
                    Log.w(TAG, "calculateRoute failed: $error")
                    promise.reject("ROUTE_ERROR", "Route calculation failed: $error")
                    return@calculateRoute
                }
                if (routes.isNullOrEmpty()) {
                    promise.reject("ROUTE_ERROR", "No route found")
                    return@calculateRoute
                }

                val serialized = Arguments.createArray()
                routes.forEach { serialized.pushMap(HereSdkSerialization.route(it)) }
                promise.resolve(Arguments.createMap().apply { putArray("routes", serialized) })
            }
        } catch (e: Exception) {
            Log.e(TAG, "calculateRoute failed: ${e.message}")
            promise.reject("ROUTE_ERROR", e.message ?: "Unknown routing error", e)
        }
    }

    // -------------------------------------------------------------------------
    // Waypoints
    // -------------------------------------------------------------------------

    private fun buildWaypoints(options: ReadableMap): List<Waypoint> {
        val waypoints = mutableListOf<Waypoint>()

        coordinates(options.getMap("origin"))?.let { waypoints.add(Waypoint(it)) }

        options.getArray("waypoints")?.let { stops ->
            for (i in 0 until stops.size()) {
                val stop = stops.getMap(i) ?: continue
                val coords = coordinates(stop) ?: continue
                waypoints.add(Waypoint(coords).apply {
                    // Pass-through waypoints shape the route without counting as
                    // a stop, so they are never reordered by waypoint optimisation.
                    if (stop.getBooleanOrNull("passThrough") == true) {
                        type = WaypointType.PASS_THROUGH
                    }
                })
            }
        }

        coordinates(options.getMap("destination"))?.let { waypoints.add(Waypoint(it)) }

        return waypoints
    }

    /** Accepts `{lat,lng}`, `{latitude,longitude}` or a place's `access[0]`. */
    private fun coordinates(map: ReadableMap?): GeoCoordinates? {
        if (map == null) return null

        map.getArray("access")?.let { access ->
            if (access.size() > 0) {
                access.getMap(0)?.let { point ->
                    val lat = point.getDoubleOrNull("lat") ?: point.getDoubleOrNull("latitude")
                    val lng = point.getDoubleOrNull("lng") ?: point.getDoubleOrNull("longitude")
                    if (lat != null && lng != null) return GeoCoordinates(lat, lng)
                }
            }
        }

        val lat = map.getDoubleOrNull("lat") ?: map.getDoubleOrNull("latitude") ?: return null
        val lng = map.getDoubleOrNull("lng") ?: map.getDoubleOrNull("longitude") ?: return null
        return GeoCoordinates(lat, lng)
    }

    // -------------------------------------------------------------------------
    // Options
    // -------------------------------------------------------------------------

    private fun buildRoutingOptions(options: ReadableMap): RoutingOptions {
        val mode = transportMode(options.getStringOrNull("transportMode"))
        val isElectric = options.getBooleanOrNull("isElectric") == true

        return RoutingOptions().apply {
            transportSpecification = buildTransportSpecification(mode, options)
            routeOptions = buildRouteOptions(options.getMap("routeOptions"))
            avoidanceOptions = buildAvoidanceOptions(options.getMap("avoid"))
            if (isElectric && (mode == TransportMode.CAR || mode == TransportMode.TRUCK)) {
                evOptions = buildElectricVehicleOptions(options.getMap("ev"))
            }
        }
    }

    private fun transportMode(raw: String?): TransportMode = when (raw?.lowercase()) {
        null, "", "truck" -> TransportMode.TRUCK
        "car" -> TransportMode.CAR
        "pedestrian", "walk", "walking" -> TransportMode.PEDESTRIAN
        "scooter" -> TransportMode.SCOOTER
        "bicycle", "bike" -> TransportMode.BICYCLE
        "bus" -> TransportMode.BUS
        "privatebus" -> TransportMode.PRIVATE_BUS
        "taxi" -> TransportMode.TAXI
        else -> {
            Log.w(TAG, "unknown transportMode '$raw', falling back to TRUCK")
            TransportMode.TRUCK
        }
    }

    private fun buildTransportSpecification(
        mode: TransportMode,
        options: ReadableMap
    ): TransportSpecification = TransportSpecification().apply {
        transportMode = mode

        when (mode) {
            TransportMode.PEDESTRIAN -> {
                pedestrianSpecification = PedestrianSpecification().apply {
                    options.getDoubleOrNull("walkSpeedMps")?.let {
                        walkingSpeedInMetersPerSecond = it
                    }
                }
            }
            TransportMode.SCOOTER -> {
                scooterSpecification = ScooterSpecification().apply {
                    options.getBooleanOrNull("allowHighway")?.let {
                        allowScooterOnHighway = it
                    }
                }
            }
            TransportMode.BICYCLE -> Unit // no vehicle dimensions apply
            else -> {
                vehicleSpecification = buildVehicleSpecification(options.getMap("vehicle"))
            }
        }
    }

    /**
     * Weights are kilograms and dimensions centimetres — the same units the
     * truck-details form already collects for the REST router.
     */
    private fun buildVehicleSpecification(vehicle: ReadableMap?): VehicleSpecification =
        VehicleSpecification().apply {
            if (vehicle == null) return@apply

            val gross = vehicle.getNumberOrNull("grossWeight")
            gross?.let { grossWeightInKilograms = it }
            // The router needs a current weight; the form often only captures the
            // gross figure, so mirror the REST helper and fall back to it.
            currentWeightInKilograms = vehicle.getNumberOrNull("currentWeight") ?: gross

            vehicle.getNumberOrNull("height")?.let { heightInCentimeters = it }
            vehicle.getNumberOrNull("width")?.let { widthInCentimeters = it }
            vehicle.getNumberOrNull("length")?.let { lengthInCentimeters = it }
            vehicle.getNumberOrNull("axleCount")?.let { axleCount = it }
            vehicle.getNumberOrNull("trailerCount")?.let { trailerCount = it }
            vehicle.getNumberOrNull("trailerAxleCount")?.let { trailerAxleCount = it }
            vehicle.getNumberOrNull("weightPerAxle")?.let { weightPerAxleInKilograms = it }
            vehicle.getNumberOrNull("payloadCapacity")?.let { payloadCapacityInKilograms = it }
            vehicle.getBooleanOrNull("isTruckLight")?.let { isTruckLight = it }

            when (vehicle.getStringOrNull("truckType")?.lowercase()) {
                "tractor" -> truckType = TruckType.TRACTOR
                "straight" -> truckType = TruckType.STRAIGHT
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
                hazardousMaterials = readStrings(materials).mapNotNull { hazardousMaterial(it) }
            }
        }

    private fun hazardousMaterial(raw: String): HazardousMaterial? = try {
        HazardousMaterial.valueOf(raw.uppercase())
    } catch (e: IllegalArgumentException) {
        Log.w(TAG, "unknown hazardous material '$raw'")
        null
    }

    private fun buildRouteOptions(routeOptions: ReadableMap?): RouteOptions = RouteOptions().apply {
        // Tolls come back on the route itself, which is what replaced the
        // separate `tolls[summaries]=total` REST request.
        enableTolls = true

        if (routeOptions == null) return@apply

        routeOptions.getIntOrNull("alternatives")?.let { alternatives = it }
        routeOptions.getBooleanOrNull("enableTolls")?.let { enableTolls = it }
        routeOptions.getBooleanOrNull("enableRouteHandle")?.let { enableRouteHandle = it }
        routeOptions.getBooleanOrNull("optimizeWaypointsOrder")?.let { optimizeWaypointsOrder = it }
        routeOptions.getDoubleOrNull("departureTime")?.let { departureTime = Date(it.toLong()) }
        routeOptions.getDoubleOrNull("arrivalTime")?.let { arrivalTime = Date(it.toLong()) }

        routeOptions.getStringOrNull("optimizationMode")?.let { raw ->
            optimizationMode = when (raw.lowercase()) {
                "shortest" -> OptimizationMode.SHORTEST
                else -> OptimizationMode.FASTEST
            }
        }

        routeOptions.getStringOrNull("trafficOptimizationMode")?.let { raw ->
            trafficOptimizationMode = when (raw.lowercase()) {
                "disabled" -> TrafficOptimizationMode.DISABLED
                "longtermclosuresonly" -> TrafficOptimizationMode.LONG_TERM_CLOSURES_ONLY
                else -> TrafficOptimizationMode.TIME_DEPENDENT
            }
        }
    }

    private fun buildAvoidanceOptions(avoid: ReadableMap?): AvoidanceOptions =
        AvoidanceOptions().apply {
            val features = avoid?.getArray("features") ?: return@apply
            roadFeatures = readStrings(features).mapNotNull { roadFeature(it) }
        }

    private fun roadFeature(raw: String): RoadFeatures? = when (raw.lowercase()) {
        "tollroad", "tolls" -> RoadFeatures.TOLL_ROAD
        "ferry" -> RoadFeatures.FERRY
        "tunnel" -> RoadFeatures.TUNNEL
        "dirtroad" -> RoadFeatures.DIRT_ROAD
        "highway", "controlledaccesshighway" -> RoadFeatures.CONTROLLED_ACCESS_HIGHWAY
        "carshuttletrain" -> RoadFeatures.CAR_SHUTTLE_TRAIN
        "seasonalclosure" -> RoadFeatures.SEASONAL_CLOSURE
        "uturns" -> RoadFeatures.U_TURNS
        else -> {
            Log.w(TAG, "unknown road feature to avoid: '$raw'")
            null
        }
    }

    private fun buildElectricVehicleOptions(ev: ReadableMap?): ElectricVehicleOptions =
        ElectricVehicleOptions().apply {
            ev?.getBooleanOrNull("ensureReachability")?.let { ensureReachability = it }
            batterySpecifications = BatterySpecifications().apply {
                ev?.getDoubleOrNull("totalCapacityKwh")?.let { totalCapacityInKilowattHours = it }
                ev?.getDoubleOrNull("initialChargeKwh")?.let { initialChargeInKilowattHours = it }
                ev?.getDoubleOrNull("targetChargeKwh")?.let { targetChargeInKilowattHours = it }
                ev?.getDoubleOrNull("minChargeAtDestinationKwh")?.let {
                    minChargeAtDestinationInKilowattHours = it
                }
            }
        }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private fun readStrings(array: ReadableArray): List<String> =
        (0 until array.size()).mapNotNull { array.getString(it) }
}

/**
 * Truck details arrive from the form as strings ("7500"); the SDK wants boxed
 * Integers. Accepts either representation and drops anything unparseable.
 */
internal fun ReadableMap.getNumberOrNull(key: String): Int? {
    if (!hasKey(key) || isNull(key)) return null
    return try {
        when (getType(key)) {
            com.facebook.react.bridge.ReadableType.Number -> getDouble(key).toInt()
            com.facebook.react.bridge.ReadableType.String ->
                getString(key)?.trim()?.takeIf { it.isNotEmpty() }?.toDoubleOrNull()?.toInt()
            else -> null
        }
    } catch (e: Exception) {
        null
    }
}
