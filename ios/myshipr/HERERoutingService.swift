import Foundation

#if canImport(heresdk)
import heresdk
#endif

/// Online routing via the HERE SDK Explore `RoutingEngine` — the replacement
/// for the `router.hereapi.com/v8/routes` REST calls.
///
/// Covers every transport mode the Explore edition supports (car, truck,
/// pedestrian, scooter, bicycle, bus, taxi, plus the electric variants of car
/// and truck), as well as tolls, alternatives and waypoint-order optimisation —
/// the last of which also replaces the `findsequence2` REST helper.
///
/// Keep in sync with Android's `HereRoutingService.kt`.
@objcMembers
class HERERoutingService: NSObject {

#if canImport(heresdk)

    private static var engine: RoutingEngine?

    private static func routingEngine() throws -> RoutingEngine {
        if let engine = engine { return engine }
        let created = try RoutingEngine()
        engine = created
        return created
    }

    /// Calculates one or more routes and resolves `{ routes: [...] }`.
    /// See `HereRoutingService.calculateRoute` on Android for the option shape.
    static func calculateRoute(
        _ options: [String: Any],
        resolve: @escaping (Any?) -> Void,
        reject: @escaping (String, String) -> Void
    ) {
        let waypoints = buildWaypoints(options)
        guard waypoints.count >= 2 else {
            reject("INVALID_ARGS", "origin and destination are required")
            return
        }

        do {
            try routingEngine().calculateRoute(
                with: waypoints,
                options: buildRoutingOptions(options)
            ) { error, routes in
                if let error = error {
                    reject("ROUTE_ERROR", "Route calculation failed: \(error)")
                    return
                }
                guard let routes = routes, !routes.isEmpty else {
                    reject("ROUTE_ERROR", "No route found")
                    return
                }
                resolve(["routes": routes.map { HERESerialization.route($0) }])
            }
        } catch {
            reject("ROUTE_ERROR", "Route calculation failed: \(error)")
        }
    }

    // MARK: - Waypoints

    private static func buildWaypoints(_ options: [String: Any]) -> [Waypoint] {
        var waypoints: [Waypoint] = []

        if let origin = HEREOptions.coordinatePair(options["origin"]) {
            waypoints.append(Waypoint(coordinates: GeoCoordinates(latitude: origin.lat,
                                                                  longitude: origin.lng)))
        }

        for stop in (options["waypoints"] as? [[String: Any]]) ?? [] {
            guard let coords = HEREOptions.coordinatePair(stop) else { continue }
            var waypoint = Waypoint(coordinates: GeoCoordinates(latitude: coords.lat,
                                                                longitude: coords.lng))
            // Pass-through waypoints shape the route without counting as a stop,
            // so they are never reordered by waypoint optimisation.
            if HEREOptions.bool(stop["passThrough"]) == true {
                waypoint.type = .passThrough
            }
            waypoints.append(waypoint)
        }

        if let destination = HEREOptions.coordinatePair(options["destination"]) {
            waypoints.append(Waypoint(coordinates: GeoCoordinates(latitude: destination.lat,
                                                                  longitude: destination.lng)))
        }

        return waypoints
    }

    // MARK: - Options

    private static func buildRoutingOptions(_ options: [String: Any]) -> RoutingOptions {
        let mode = transportMode(HEREOptions.string(options["transportMode"]))
        var routingOptions = RoutingOptions()

        routingOptions.transportSpecification = buildTransportSpecification(mode, options)
        routingOptions.routeOptions = buildRouteOptions(options["routeOptions"] as? [String: Any])
        routingOptions.avoidanceOptions = buildAvoidanceOptions(options["avoid"] as? [String: Any])

        if HEREOptions.bool(options["isElectric"]) == true, mode == .car || mode == .truck {
            routingOptions.evOptions = buildElectricVehicleOptions(options["ev"] as? [String: Any])
        }

        return routingOptions
    }

    private static func transportMode(_ raw: String?) -> TransportMode {
        switch (raw ?? "truck").lowercased() {
        case "car": return .car
        case "pedestrian", "walk", "walking": return .pedestrian
        case "scooter": return .scooter
        case "bicycle", "bike": return .bicycle
        case "bus": return .bus
        case "privatebus": return .privateBus
        case "taxi": return .taxi
        default: return .truck
        }
    }

    private static func buildTransportSpecification(
        _ mode: TransportMode,
        _ options: [String: Any]
    ) -> TransportSpecification {
        var specification = TransportSpecification()
        specification.transportMode = mode

        switch mode {
        case .pedestrian:
            var pedestrian = PedestrianSpecification()
            if let speed = HEREOptions.double(options["walkSpeedMps"]) {
                pedestrian.walkingSpeedInMetersPerSecond = speed
            }
            specification.pedestrianSpecification = pedestrian
        case .scooter:
            var scooter = ScooterSpecification()
            if let allow = HEREOptions.bool(options["allowHighway"]) {
                scooter.allowScooterOnHighway = allow
            }
            specification.scooterSpecification = scooter
        case .bicycle:
            break // no vehicle dimensions apply
        default:
            specification.vehicleSpecification =
                buildVehicleSpecification(options["vehicle"] as? [String: Any])
        }

        return specification
    }

    /// Weights are kilograms and dimensions centimetres — the same units the
    /// truck-details form already collects for the REST router.
    private static func buildVehicleSpecification(_ vehicle: [String: Any]?) -> VehicleSpecification {
        var specification = VehicleSpecification()
        guard let vehicle = vehicle else { return specification }

        let gross = HEREOptions.int32(vehicle["grossWeight"])
        specification.grossWeightInKilograms = gross
        // The router needs a current weight; the form often only captures the
        // gross figure, so mirror the REST helper and fall back to it.
        specification.currentWeightInKilograms =
            HEREOptions.int32(vehicle["currentWeight"]) ?? gross

        specification.heightInCentimeters = HEREOptions.int32(vehicle["height"])
        specification.widthInCentimeters = HEREOptions.int32(vehicle["width"])
        specification.lengthInCentimeters = HEREOptions.int32(vehicle["length"])
        specification.axleCount = HEREOptions.int32(vehicle["axleCount"])
        specification.trailerCount = HEREOptions.int32(vehicle["trailerCount"])
        specification.trailerAxleCount = HEREOptions.int32(vehicle["trailerAxleCount"])
        specification.weightPerAxleInKilograms = HEREOptions.int32(vehicle["weightPerAxle"])
        specification.payloadCapacityInKilograms = HEREOptions.int32(vehicle["payloadCapacity"])

        if let light = HEREOptions.bool(vehicle["isTruckLight"]) {
            specification.isTruckLight = light
        }

        switch HEREOptions.string(vehicle["truckType"])?.lowercased() {
        case "tractor": specification.truckCategory = .tractor
        case "straight": specification.truckCategory = .straight
        default: break
        }

        switch HEREOptions.string(vehicle["tunnelCategory"])?.uppercased() {
        case "B": specification.tunnelCategory = .b
        case "C": specification.tunnelCategory = .c
        case "D": specification.tunnelCategory = .d
        case "E": specification.tunnelCategory = .e
        default: break
        }

        specification.hazardousMaterials = HEREOptions
            .strings(vehicle["hazardousMaterials"])
            .compactMap { hazardousMaterial($0) }

        return specification
    }

    private static func hazardousMaterial(_ raw: String) -> HazardousMaterial? {
        let normalized = raw.lowercased().replacingOccurrences(of: "_", with: "")
        return HazardousMaterial.allCases.first {
            String(describing: $0).lowercased() == normalized
        }
    }

    private static func buildRouteOptions(_ options: [String: Any]?) -> RouteOptions {
        var routeOptions = RouteOptions()
        // Tolls come back on the route itself, which is what replaced the
        // separate `tolls[summaries]=total` REST request.
        routeOptions.enableTolls = true

        guard let options = options else { return routeOptions }

        if let alternatives = HEREOptions.int32(options["alternatives"]) {
            routeOptions.alternatives = alternatives
        }
        if let enableTolls = HEREOptions.bool(options["enableTolls"]) {
            routeOptions.enableTolls = enableTolls
        }
        if let enableRouteHandle = HEREOptions.bool(options["enableRouteHandle"]) {
            routeOptions.enableRouteHandle = enableRouteHandle
        }
        if let optimizeOrder = HEREOptions.bool(options["optimizeWaypointsOrder"]) {
            routeOptions.optimizeWaypointsOrder = optimizeOrder
        }
        if let departure = HEREOptions.double(options["departureTime"]) {
            routeOptions.departureTime = Date(timeIntervalSince1970: departure / 1000)
        }
        if let arrival = HEREOptions.double(options["arrivalTime"]) {
            routeOptions.arrivalTime = Date(timeIntervalSince1970: arrival / 1000)
        }
        if HEREOptions.string(options["optimizationMode"])?.lowercased() == "shortest" {
            routeOptions.optimizationMode = .shortest
        }
        switch HEREOptions.string(options["trafficOptimizationMode"])?.lowercased() {
        case "disabled": routeOptions.trafficOptimizationMode = .disabled
        case "longtermclosuresonly": routeOptions.trafficOptimizationMode = .longTermClosuresOnly
        default: break
        }

        return routeOptions
    }

    private static func buildAvoidanceOptions(_ avoid: [String: Any]?) -> AvoidanceOptions {
        var options = AvoidanceOptions()
        guard let avoid = avoid else { return options }
        options.roadFeatures = HEREOptions.strings(avoid["features"]).compactMap { roadFeature($0) }
        return options
    }

    private static func roadFeature(_ raw: String) -> RoadFeatures? {
        switch raw.lowercased() {
        case "tollroad", "tolls": return .tollRoad
        case "ferry": return .ferry
        case "tunnel": return .tunnel
        case "dirtroad": return .dirtRoad
        case "highway", "controlledaccesshighway": return .controlledAccessHighway
        case "carshuttletrain": return .carShuttleTrain
        case "seasonalclosure": return .seasonalClosure
        case "uturns": return .uTurns
        default: return nil
        }
    }

    private static func buildElectricVehicleOptions(_ ev: [String: Any]?) -> ElectricVehicleOptions {
        var options = ElectricVehicleOptions()
        var battery = BatterySpecifications()

        if let ev = ev {
            if let reachability = HEREOptions.bool(ev["ensureReachability"]) {
                options.ensureReachability = reachability
            }
            if let capacity = HEREOptions.double(ev["totalCapacityKwh"]) {
                battery.totalCapacityInKilowattHours = capacity
            }
            if let initial = HEREOptions.double(ev["initialChargeKwh"]) {
                battery.initialChargeInKilowattHours = initial
            }
            if let target = HEREOptions.double(ev["targetChargeKwh"]) {
                battery.targetChargeInKilowattHours = target
            }
            if let minAtDestination = HEREOptions.double(ev["minChargeAtDestinationKwh"]) {
                battery.minChargeAtDestinationInKilowattHours = minAtDestination
            }
        }

        options.batterySpecifications = battery
        return options
    }

#endif
}
