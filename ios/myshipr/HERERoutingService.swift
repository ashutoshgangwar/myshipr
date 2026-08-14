import Foundation
import UIKit

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

    // MARK: - Traffic on the route

    /// Live congestion along a route, as colour.
    ///
    /// A route drawn in one flat blue says nothing about what the driver is
    /// about to hit. `calculateTrafficOnRoute` answers that: it returns the same
    /// route split into *spans*, each carrying a jam factor — HERE's 0 (free) to
    /// 10 (blocked) congestion scale — which `trafficColor(forJamFactor:)`
    /// buckets into the three states the trip screen shows: free flowing stays
    /// the ordinary route blue, slow turns yellow, heavy turns red.
    ///
    /// Two consumers, one scale, so both readings agree: the preview polyline,
    /// drawn from `trafficSegments`, and the navigator's own route rendering,
    /// which colours itself once handed a `TrafficOnRoute` and the palette from
    /// `navigatorTrafficColors()`.
    ///
    /// Keep in sync with Android's `TrafficRouteColoring.kt`.

    /// Free-flowing — the same blue the plain route is drawn in.
    static let trafficColorFree = UIColor(red: 0.145, green: 0.388, blue: 0.922, alpha: 1) // #2563EB
    /// Moving, but below the road's normal speed.
    static let trafficColorSlow = UIColor(red: 0.961, green: 0.620, blue: 0.043, alpha: 1) // #F59E0B
    /// Queuing or stationary.
    static let trafficColorHeavy = UIColor(red: 0.937, green: 0.267, blue: 0.267, alpha: 1) // #EF4444
    /// The road is closed or completely blocked.
    static let trafficColorBlocked = UIColor(red: 0.600, green: 0.106, blue: 0.106, alpha: 1) // #991B1B

    // HERE's jam factor: 0-3 free, 4-7 slow, 8-9 queuing, 10 stationary/blocked.
    private static let jamSlow = 4.0
    private static let jamHeavy = 8.0
    private static let jamBlocked = 10.0

    /// Where a jam factor lands on the three-state scale above.
    static func trafficColor(forJamFactor jamFactor: Double) -> UIColor {
        switch jamFactor {
        case jamBlocked...: return trafficColorBlocked
        case jamHeavy...: return trafficColorHeavy
        case jamSlow...: return trafficColorSlow
        default: return trafficColorFree
        }
    }

    /// The same palette for the navigator's own route rendering. The SDK only
    /// recolours the congested parts — free-flowing road keeps the navigator's
    /// route colour — so there is no "free" entry to give it here.
    static func navigatorTrafficColors() -> TrafficOnRouteColors {
        TrafficOnRouteColors(
            slow: trafficColorSlow,
            stationary: trafficColorHeavy,
            blocking: trafficColorBlocked
        )
    }

    /// Asks the routing service what traffic looks like on `route` right now.
    ///
    /// Traffic is a live figure, so this is a network call: it is fired off once
    /// the route is already on screen rather than being waited for, and a failure
    /// simply leaves the plain blue line — never an error the driver has to read.
    ///
    /// `lastTraveledSectionIndex` and `traveledDistanceOnLastSectionInMeters`
    /// tell the service how far along the route the truck already is, so a
    /// refresh mid-trip costs only the part still to drive. Both are 0 for a
    /// preview. `completion` runs on an SDK thread, not the main thread.
    static func trafficOnRoute(
        _ route: Route,
        lastTraveledSectionIndex: Int32 = 0,
        traveledDistanceOnLastSectionInMeters: Int32 = 0,
        completion: @escaping (TrafficOnRoute?) -> Void
    ) {
        do {
            _ = try routingEngine().calculateTrafficOnRoute(
                route: route,
                lastTraveledSectionIndex: lastTraveledSectionIndex,
                traveledDistanceOnLastSectionInMeters: traveledDistanceOnLastSectionInMeters
            ) { error, traffic in
                if let error = error {
                    NSLog("[HERERoutingService] traffic on route unavailable: \(error)")
                    completion(nil)
                    return
                }
                completion(traffic)
            }
        } catch {
            NSLog("[HERERoutingService] traffic on route request failed: \(error)")
            completion(nil)
        }
    }

    /// Cuts `traffic` into the coloured runs to draw, merging neighbouring spans
    /// that share a colour so a quiet motorway is one polyline rather than
    /// hundreds. An empty result means "leave the plain line alone".
    static func trafficSegments(_ traffic: TrafficOnRoute) -> [HERETrafficSegment] {
        var segments: [HERETrafficSegment] = []
        for section in traffic.trafficSections where section.geometry.count >= 2 {
            segments += sectionTrafficSegments(section.geometry, section.trafficSpans)
        }
        return segments
    }

    /// A span marks where it *starts* along the section's geometry
    /// (`trafficSectionPolylineOffset`); it runs until the next one begins, or to
    /// the end of the section for the last. Consecutive runs share their boundary
    /// vertex, so the colours butt up against each other instead of leaving a
    /// hairline gap.
    private static func sectionTrafficSegments(
        _ geometry: [GeoCoordinates],
        _ spans: [TrafficOnSpan]
    ) -> [HERETrafficSegment] {
        let lastIndex = geometry.count - 1
        let starts = spans
            .map { (min(max(Int($0.trafficSectionPolylineOffset), 0), lastIndex),
                    trafficColor(forJamFactor: $0.jamFactor)) }
            .sorted { $0.0 < $1.0 }

        // No span data for this section: it is all free-flowing as far as we know.
        guard let first = starts.first else {
            return [HERETrafficSegment(coordinates: geometry, color: trafficColorFree)]
        }

        var out: [HERETrafficSegment] = []
        var runStart = first.0
        var runColor = first.1

        // Geometry ahead of the first span is unmeasured — draw it plain.
        if runStart > 0 {
            out.append(HERETrafficSegment(
                coordinates: Array(geometry[0...runStart]), color: trafficColorFree
            ))
        }

        for (offset, color) in starts.dropFirst() {
            if color == runColor { continue }
            if offset > runStart {
                out.append(HERETrafficSegment(
                    coordinates: Array(geometry[runStart...offset]), color: runColor
                ))
                runStart = offset
            }
            runColor = color
        }
        if lastIndex > runStart {
            out.append(HERETrafficSegment(
                coordinates: Array(geometry[runStart...lastIndex]), color: runColor
            ))
        }
        return out
    }

#endif
}

#if canImport(heresdk)
/// A run of route geometry that shares one congestion colour.
struct HERETrafficSegment {
    let coordinates: [GeoCoordinates]
    let color: UIColor
}
#endif
