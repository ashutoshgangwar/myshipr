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

    /// The one online engine. `HEREOfflineRouting` and `HereRoutingModule`
    /// share it rather than each standing up their own.
    static func routingEngine() throws -> RoutingEngine {
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

        // Online first, then the on-device map data — a driver in a dead spot
        // still gets a route. See `HEREOfflineRouting`.
        HEREOfflineRouting.calculate(
            waypoints: waypoints,
            options: buildRoutingOptions(options)
        ) { error, routes, isOffline in
            if let error = error {
                reject("ROUTE_ERROR", HEREOfflineRouting.message(for: error, wasOffline: isOffline))
                return
            }
            guard let routes = routes, !routes.isEmpty else {
                reject("ROUTE_ERROR", HEREOfflineRouting.message(for: .noRouteFound, wasOffline: isOffline))
                return
            }
            resolve([
                "routes": routes.map { HERESerialization.route($0) },
                // Lets the UI say the route came from cached map data: no live
                // traffic, no tolls priced against today's tariffs.
                "offline": isOffline,
            ])
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

#if canImport(heresdk)
/// Routing that still answers with the radio off.
///
/// `RoutingEngine` is a REST client in disguise: with no connection it fails
/// with `.offline` (or a timeout / unreachable variant) and the driver reads
/// "Route calculation failed" at exactly the moment a route matters most — a
/// dead spot on the interstate, a warehouse basement, a border crossing.
/// `OfflineRoutingEngine` answers the same question from map data already on
/// the device: the regions the map view cached while the truck was online.
///
/// Every routing call goes through `calculate`, which tries online first so a
/// connected driver still gets live traffic, tolls and alternatives, and only
/// falls back when the failure was about connectivity. A rejected waypoint or
/// a genuinely impossible route is returned as-is — retrying those offline
/// would swap a precise message for a vague one.
///
/// Android has no equivalent yet; `HereRoutingService.kt` is still online-only.
enum HEREOfflineRouting {

    private static var offlineEngine: OfflineRoutingEngine?
    private static let engineLock = NSLock()

    /// Whether a failure is worth retrying against on-device map data.
    ///
    /// `authenticationFailed` is in the list because token refresh is itself a
    /// network call: with no connection the SDK often reports the failed
    /// refresh rather than the missing connection.
    static func isConnectivityFailure(_ error: RoutingError) -> Bool {
        switch error {
        case .offline, .serverUnreachable, .timedOut, .httpError,
             .proxyServerUnreachable, .proxyAuthenticationFailed,
             .authenticationFailed:
            return true
        default:
            return false
        }
    }

    /// Built once, lazily — the constructor needs the shared engine, which only
    /// exists after `HereSdk.initialize()`. `nil` means offline routing is not
    /// available at all, and the caller reports the original online failure.
    static func engineIfAvailable() -> OfflineRoutingEngine? {
        engineLock.lock()
        defer { engineLock.unlock() }

        if let offlineEngine = offlineEngine { return offlineEngine }
        guard let sdk = SDKNativeEngine.sharedInstance else { return nil }

        do {
            let created = try OfflineRoutingEngine(sdk)
            offlineEngine = created
            return created
        } catch {
            NSLog("[HEREOfflineRouting] offline routing unavailable: \(error)")
            return nil
        }
    }

    /// The same request with its online-only parts stripped.
    ///
    /// A route handle is minted server-side and traffic optimisation needs a
    /// live feed, so leaving either switched on makes the offline engine reject
    /// a request it could otherwise answer. Alternatives go too: they cost
    /// extra passes over the cache for a choice nobody asked for.
    static func offlineOptions(_ options: RoutingOptions) -> RoutingOptions {
        var offline = options
        offline.routeOptions.enableRouteHandle = false
        offline.routeOptions.trafficOptimizationMode = .disabled
        offline.routeOptions.alternatives = 0
        return offline
    }

    /// Calculates a route, falling back to on-device map data when the network
    /// is what failed.
    ///
    /// `isOffline` in the completion says which engine answered, so callers can
    /// tell the driver the route carries no live traffic. `completion` runs on
    /// an SDK thread, not the main thread.
    static func calculate(
        waypoints: [Waypoint],
        options: RoutingOptions,
        completion: @escaping (_ error: RoutingError?,
                               _ routes: [Route]?,
                               _ isOffline: Bool) -> Void
    ) {
        // Already told to stay off the network: don't spend a timeout proving it.
        if SDKNativeEngine.sharedInstance?.isOfflineMode == true {
            calculateOffline(waypoints: waypoints, options: options,
                             onlineError: nil, completion: completion)
            return
        }

        let online: RoutingEngine
        do {
            online = try HERERoutingService.routingEngine()
        } catch {
            NSLog("[HEREOfflineRouting] online engine unavailable: \(error)")
            calculateOffline(waypoints: waypoints, options: options,
                             onlineError: nil, completion: completion)
            return
        }

        online.calculateRoute(with: waypoints, options: options) { error, routes in
            guard let error = error else {
                completion(nil, routes, false)
                return
            }
            guard isConnectivityFailure(error) else {
                completion(error, nil, false)
                return
            }
            NSLog("[HEREOfflineRouting] online routing failed (\(error)) — trying on-device map data")
            calculateOffline(waypoints: waypoints, options: options,
                             onlineError: error, completion: completion)
        }
    }

    /// `onlineError` is what the network attempt reported, reused when there is
    /// no offline engine to fall back to so the driver sees the real cause
    /// rather than a made-up one.
    private static func calculateOffline(
        waypoints: [Waypoint],
        options: RoutingOptions,
        onlineError: RoutingError?,
        completion: @escaping (RoutingError?, [Route]?, Bool) -> Void
    ) {
        guard let engine = engineIfAvailable() else {
            completion(onlineError ?? .offline, nil, false)
            return
        }

        engine.calculateRoute(with: waypoints, options: offlineOptions(options)) { error, routes in
            if let error = error {
                completion(error, nil, true)
                return
            }
            guard let routes = routes, !routes.isEmpty else {
                completion(.noRouteFound, nil, true)
                return
            }
            completion(nil, routes, true)
        }
    }

    /// A message that tells the driver what to do about it.
    ///
    /// Offline, "no route found" almost never means no road exists — it means
    /// this stretch of map was never cached — so it gets its own wording
    /// instead of the router's, which would read as if the destination were
    /// unreachable.
    static func message(for error: RoutingError, wasOffline: Bool) -> String {
        guard wasOffline else {
            return error == .noRouteFound
                ? "No route found"
                : "Route calculation failed: \(error)"
        }

        switch error {
        case .noRouteFound, .couldNotMatchOrigin, .couldNotMatchDestination:
            return "No offline route available — the map data for this area is not "
                + "on this device. Reconnect, or open the area once while online "
                + "so it is cached for the trip."
        case .routeLengthLimitExceeded:
            return "This route is too long to calculate offline. Reconnect to plan it."
        default:
            return "Offline route calculation failed: \(error)"
        }
    }
}
#endif
