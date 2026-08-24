import Foundation
import React

#if canImport(heresdk)
import heresdk
#endif

/// Point-to-point routing on the HERE SDK routing engines.
///
/// Requests go out online first and fall back to the on-device map cache when
/// the network is what failed — see `HEREOfflineRouting`. The resolved payload
/// carries `offline` so the trip screen can say the route has no live traffic.
///
/// iOS counterpart of `android/.../heremap/HereRoutingModule.kt`: same method
/// names, same resolved shape, so `src/here/HereRouting.js` is platform-neutral.
/// Built on the unified `RoutingOptions` + `TransportSpecification` API.
@objc(HereRoutingModule)
class HereRoutingModule: NSObject {

    /// HERE's reference consumption figures for a mid-size EV, used when the
    /// caller supplies no model. Keys are km/h, values kWh/m.
    private static let defaultFreeFlowSpeedTable: [Int32: Double] =
        [0: 0.239, 27: 0.239, 60: 0.196, 90: 0.238]
    private static let defaultTrafficSpeedTable: [Int32: Double] =
        [0: 0.349, 27: 0.319, 60: 0.244, 90: 0.256]

    // MARK: - Public API

    @objc(calculateCarRoute:originLng:destLat:destLng:options:resolver:rejecter:)
    func calculateCarRoute(
        _ originLat: Double, originLng: Double, destLat: Double, destLng: Double,
        options: NSDictionary?,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
#if canImport(heresdk)
        calculate(
            originLat, originLng, destLat, destLng,
            routingOptions: buildRoutingOptions(
                mode: .car,
                options: options,
                vehicle: options?["vehicle"] as? NSDictionary
            ),
            resolve: resolve, reject: reject
        )
#else
        reject("SDK_MISSING", "HERE SDK is not embedded in the Xcode project", nil)
#endif
    }

    /// `truckOptions` carries the dimensions the shipment form collects —
    /// weights in kilograms, dimensions in centimetres — plus the shared
    /// `routeOptions` / `avoid` blocks.
    @objc(calculateTruckRoute:originLng:destLat:destLng:truckOptions:resolver:rejecter:)
    func calculateTruckRoute(
        _ originLat: Double, originLng: Double, destLat: Double, destLng: Double,
        truckOptions: NSDictionary?,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
#if canImport(heresdk)
        calculate(
            originLat, originLng, destLat, destLng,
            routingOptions: buildRoutingOptions(
                mode: .truck, options: truckOptions, vehicle: truckOptions
            ),
            resolve: resolve, reject: reject
        )
#else
        reject("SDK_MISSING", "HERE SDK is not embedded in the Xcode project", nil)
#endif
    }

    /// Electric-vehicle route, with charging stops when the battery cannot
    /// cover the distance.
    @objc(calculateEVRoute:originLng:destLat:destLng:evOptions:resolver:rejecter:)
    func calculateEVRoute(
        _ originLat: Double, originLng: Double, destLat: Double, destLng: Double,
        evOptions: NSDictionary?,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
#if canImport(heresdk)
        let isTruck = (evOptions?["transportMode"] as? String)?.lowercased() == "truck"
        calculate(
            originLat, originLng, destLat, destLng,
            routingOptions: buildRoutingOptions(
                mode: isTruck ? .truck : .car,
                options: evOptions,
                vehicle: (evOptions?["vehicle"] as? NSDictionary) ?? evOptions,
                ev: evOptions ?? NSDictionary()
            ),
            resolve: resolve, reject: reject
        )
#else
        reject("SDK_MISSING", "HERE SDK is not embedded in the Xcode project", nil)
#endif
    }

    @objc(releaseRoute:resolver:rejecter:)
    func releaseRoute(
        _ routeId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
#if canImport(heresdk)
        HereRouteStore.shared.remove(routeId)
#endif
        resolve(true)
    }

#if canImport(heresdk)

    // MARK: - Request plumbing

    private func calculate(
        _ originLat: Double, _ originLng: Double, _ destLat: Double, _ destLng: Double,
        routingOptions: RoutingOptions,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        guard HereSdkModule.isReady() else {
            reject("HERE_ROUTE_ERROR", "HERE SDK is not initialised — call HereSdk.initialize() first", nil)
            return
        }

        let waypoints = [
            Waypoint(coordinates: GeoCoordinates(latitude: originLat, longitude: originLng)),
            Waypoint(coordinates: GeoCoordinates(latitude: destLat, longitude: destLng)),
        ]

        HEREOfflineRouting.calculate(waypoints: waypoints, options: routingOptions) { error, routes, isOffline in
            if let error = error {
                reject("HERE_ROUTE_ERROR",
                       HEREOfflineRouting.message(for: error, wasOffline: isOffline), nil)
                return
            }
            guard let routes = routes, let best = routes.first else {
                reject("HERE_ROUTE_ERROR",
                       HEREOfflineRouting.message(for: .noRouteFound, wasOffline: isOffline), nil)
                return
            }
            resolve(Self.serialize(route: best, allRoutes: routes, isOffline: isOffline))
        }
    }

    // MARK: - Response

    /// `{ routeId, distanceMeters, durationSeconds, polyline[], maneuvers[],
    ///    routeHandle, tolls, boundingBox, offline }` — the Android shape plus
    ///    `offline`, which Android never sets because it has no fallback yet.
    private static func serialize(route: Route, allRoutes: [Route], isOffline: Bool) -> [String: Any] {
        let duration = route.duration
        let trafficDelay = route.trafficDelay

        var payload: [String: Any] = [
            "routeId": HereRouteStore.shared.put(route),
            "distanceMeters": Double(route.lengthInMeters),
            "durationSeconds": duration,
            "trafficDelaySeconds": trafficDelay,
            "baseDurationSeconds": duration - trafficDelay,
            "transportMode": String(describing: route.requestedTransportMode),
            "alternativeCount": max(0, allRoutes.count - 1),
            // Calculated from cached map data: no live traffic in the ETA, and
            // the route handle and alternatives were not available.
            "offline": isOffline,
            "routeHandle": route.routeHandle?.handle ?? NSNull(),
            "polyline": polyline(route),
            "maneuvers": maneuvers(route),
            "tolls": tolls(route),
        ]
        if let kwh = route.consumptionInKilowattHours { payload["consumptionKwh"] = kwh }

        let box = route.boundingBox
        payload["boundingBox"] = [
            "northEast": ["lat": box.northEastCorner.latitude, "lng": box.northEastCorner.longitude],
            "southWest": ["lat": box.southWestCorner.latitude, "lng": box.southWestCorner.longitude],
        ]
        return payload
    }

    /// Each vertex carries both key styles so it can go straight to the map or
    /// to screens that use the geolocation naming.
    private static func polyline(_ route: Route) -> [[String: Double]] {
        route.geometry.vertices.map {
            ["lat": $0.latitude, "lng": $0.longitude,
             "latitude": $0.latitude, "longitude": $0.longitude]
        }
    }

    /// Every section's maneuvers flattened into one turn-by-turn list.
    private static func maneuvers(_ route: Route) -> [[String: Any]] {
        route.sections.flatMap { section in
            section.maneuvers.map { HereSerialization.maneuver($0) }
        }
    }

    /// `{ total, currency, items }`, priced with the cheapest single-journey
    /// fare per booth — season passes would inflate a one-way total.
    private static func tolls(_ route: Route) -> [String: Any] {
        var total = 0.0
        var currency: String?
        var priced = false
        var items: [[String: Any]] = []

        for section in route.sections {
            for toll in section.tolls {
                let singles = toll.fares.filter { $0.pass == nil }
                let cheapest = (singles.isEmpty ? toll.fares : singles)
                    .min(by: { $0.price < $1.price })

                items.append([
                    "tollSystem": toll.tollSystems.first ?? NSNull(),
                    "countryCode": toll.countryCode,
                    "price": cheapest.map { $0.price as Any } ?? NSNull(),
                    "currency": cheapest.map { $0.currency as Any } ?? NSNull(),
                ])

                if let cheapest = cheapest {
                    total += cheapest.price
                    if currency == nil { currency = cheapest.currency }
                    priced = true
                }
            }
        }

        // Null rather than 0 when nothing is priced — "free" and "unknown" must
        // not look the same in the UI.
        return [
            "total": priced ? total : NSNull(),
            "currency": currency ?? NSNull(),
            "items": items,
        ]
    }

    // MARK: - Options

    private func buildRoutingOptions(
        mode: TransportMode,
        options: NSDictionary?,
        vehicle: NSDictionary?,
        ev: NSDictionary? = nil
    ) -> RoutingOptions {
        var routing = RoutingOptions()
        routing.transportSpecification = TransportSpecification(
            transportMode: mode,
            vehicleSpecification: buildVehicleSpecification(vehicle)
        )
        routing.routeOptions = buildRouteOptions(options?["routeOptions"] as? NSDictionary)
        routing.avoidanceOptions = buildAvoidanceOptions(options?["avoid"] as? NSDictionary)
        if let ev = ev { routing.evOptions = buildElectricVehicleOptions(ev) }
        return routing
    }

    /// The route handle is requested by default so the returned `routeHandle`
    /// can later refresh or re-import the route.
    private func buildRouteOptions(_ dict: NSDictionary?) -> RouteOptions {
        var route = RouteOptions()
        route.enableTolls = true
        route.enableRouteHandle = true

        guard let dict = dict else { return route }
        if let alternatives = Self.int32(dict["alternatives"]) { route.alternatives = alternatives }
        if let tolls = dict["enableTolls"] as? Bool { route.enableTolls = tolls }
        if let handle = dict["enableRouteHandle"] as? Bool { route.enableRouteHandle = handle }
        if let mode = (dict["optimizationMode"] as? String)?.lowercased() {
            route.optimizationMode = (mode == "shortest") ? .shortest : .fastest
        }
        return route
    }

    /// Weights in kilograms, dimensions in centimetres.
    private func buildVehicleSpecification(_ dict: NSDictionary?) -> VehicleSpecification {
        var spec = VehicleSpecification()
        guard let dict = dict else { return spec }

        let gross = Self.int32(dict["grossWeight"])
        spec.grossWeightInKilograms = gross
        // The router needs a laden weight; forms usually capture only the gross
        // figure, so fall back to it rather than routing unladen.
        spec.currentWeightInKilograms = Self.int32(dict["currentWeight"]) ?? gross

        spec.weightPerAxleInKilograms = Self.int32(dict["weightPerAxle"])
        spec.heightInCentimeters = Self.int32(dict["height"])
        spec.widthInCentimeters = Self.int32(dict["width"])
        spec.lengthInCentimeters = Self.int32(dict["length"])
        spec.axleCount = Self.int32(dict["axleCount"])
        spec.trailerCount = Self.int32(dict["trailerCount"])
        spec.trailerAxleCount = Self.int32(dict["trailerAxleCount"])
        spec.payloadCapacityInKilograms = Self.int32(dict["payloadCapacity"])
        if let light = dict["isTruckLight"] as? Bool { spec.isTruckLight = light }

        switch (dict["truckType"] as? String)?.lowercased() {
        case "tractor": spec.truckCategory = .tractor
        case "straight": spec.truckCategory = .straight
        default: break
        }

        switch (dict["tunnelCategory"] as? String)?.uppercased() {
        case "B": spec.tunnelCategory = .b
        case "C": spec.tunnelCategory = .c
        case "D": spec.tunnelCategory = .d
        case "E": spec.tunnelCategory = .e
        default: break
        }

        if let materials = dict["hazardousMaterials"] as? [String] {
            spec.hazardousMaterials = materials.compactMap(Self.hazardousMaterial)
        }
        return spec
    }

    private static func hazardousMaterial(_ raw: String) -> HazardousMaterial? {
        switch raw.lowercased() {
        case "explosive": return .explosive
        case "gas": return .gas
        case "flammable": return .flammable
        case "combustible": return .combustible
        case "organic": return .organic
        case "poison": return .poison
        case "radioactive": return .radioactive
        case "corrosive": return .corrosive
        case "poisonousinhalation", "poisonous_inhalation": return .poisonousInhalation
        case "harmfultowater", "harmful_to_water": return .harmfulToWater
        case "other": return .other
        default: return nil
        }
    }

    private func buildAvoidanceOptions(_ dict: NSDictionary?) -> AvoidanceOptions {
        var avoidance = AvoidanceOptions()
        guard let features = dict?["features"] as? [String] else { return avoidance }
        avoidance.roadFeatures = features.compactMap { raw in
            switch raw.lowercased() {
            case "tollroad", "tolls": return RoadFeatures.tollRoad
            case "ferry": return RoadFeatures.ferry
            case "tunnel": return RoadFeatures.tunnel
            case "dirtroad": return RoadFeatures.dirtRoad
            case "highway", "controlledaccesshighway": return RoadFeatures.controlledAccessHighway
            case "carshuttletrain": return RoadFeatures.carShuttleTrain
            case "seasonalclosure": return RoadFeatures.seasonalClosure
            case "uturns": return RoadFeatures.uTurns
            default: return nil
            }
        }
        return avoidance
    }

    private func buildElectricVehicleOptions(_ ev: NSDictionary) -> ElectricVehicleOptions {
        var options = ElectricVehicleOptions()
        options.ensureReachability = (ev["ensureReachability"] as? Bool) ?? true
        options.batterySpecifications = buildBatterySpecifications(ev["battery"] as? NSDictionary)
        // The router rejects an EV request with no consumption model, so one is
        // always supplied — HERE's reference figures when the caller has none.
        options.empiricalConsumptionModel =
            buildConsumptionModel(ev["consumption"] as? NSDictionary)
        return options
    }

    private func buildBatterySpecifications(_ dict: NSDictionary?) -> BatterySpecifications {
        var battery = BatterySpecifications()
        let capacity = Self.double(dict?["totalCapacityKwh"]) ?? 80.0
        battery.totalCapacityInKilowattHours = capacity
        battery.initialChargeInKilowattHours = Self.double(dict?["initialChargeKwh"]) ?? (capacity * 0.9)
        battery.targetChargeInKilowattHours = Self.double(dict?["targetChargeKwh"]) ?? (capacity * 0.9)
        if let v = Self.double(dict?["minChargeAtChargingStationKwh"]) {
            battery.minChargeAtChargingStationInKilowattHours = v
        }
        if let v = Self.double(dict?["minChargeAtDestinationKwh"]) {
            battery.minChargeAtDestinationInKilowattHours = v
        }
        return battery
    }

    private func buildConsumptionModel(_ dict: NSDictionary?) -> EmpiricalConsumptionModel {
        var model = EmpiricalConsumptionModel()
        model.ascentConsumptionInWattHoursPerMeter = Self.double(dict?["ascentWhPerMeter"]) ?? 9.0
        model.descentRecoveryInWattHoursPerMeter = Self.double(dict?["descentWhPerMeter"]) ?? 4.3
        model.auxiliaryConsumptionInWattHoursPerSecond =
            Self.double(dict?["auxiliaryWhPerSecond"]) ?? 1.8
        model.freeFlowSpeedTable =
            Self.speedTable(dict?["freeFlowSpeedTable"]) ?? Self.defaultFreeFlowSpeedTable
        model.trafficSpeedTable =
            Self.speedTable(dict?["trafficSpeedTable"]) ?? Self.defaultTrafficSpeedTable
        return model
    }

    /// `{ "0": 0.239, "90": 0.238 }` → `[0: 0.239, 90: 0.238]` (km/h → kWh/m).
    private static func speedTable(_ raw: Any?) -> [Int32: Double]? {
        guard let dict = raw as? NSDictionary else { return nil }
        var table: [Int32: Double] = [:]
        for (key, value) in dict {
            guard let speed = Int32(String(describing: key)),
                  let consumption = double(value) else { continue }
            table[speed] = consumption
        }
        return table.isEmpty ? nil : table
    }

    // MARK: - Coercion

    /// Truck details arrive from the form as strings ("7500"); accept either.
    /// A blank or non-numeric field means "not supplied" and yields nil — never
    /// a trap. Mirrors Android's `getNumberOrNull`.
    private static func int32(_ value: Any?) -> Int32? {
        Self.clampedInt32(double(value))
    }

    private static func double(_ value: Any?) -> Double? {
        if let number = value as? NSNumber { return number.doubleValue }
        if let text = value as? String {
            return Double(text.trimmingCharacters(in: .whitespaces))
        }
        return nil
    }

    /// `Int32(someDouble)` traps on NaN, infinity and anything outside Int32's
    /// range — and the truck-details form hands us "" for every field the driver
    /// left blank. Every Double→Int32 conversion goes through here.
    private static func clampedInt32(_ value: Double?) -> Int32? {
        guard let value = value, value.isFinite else { return nil }
        return Int32(min(max(value.rounded(.towardZero), Double(Int32.min)), Double(Int32.max)))
    }
#endif

    @objc static func requiresMainQueueSetup() -> Bool { false }
}
