import Foundation
import React
import UIKit

#if canImport(heresdk)
import heresdk
#endif

/// Turn-by-turn guidance driven by the HERE SDK's `VisualNavigator`.
///
/// iOS counterpart of `android/.../heremap/HereNavigationModule.kt`. The SDK
/// owns all the navigation logic — map matching, maneuver timing, speed
/// warnings, camera following and route rendering. This module only binds a
/// navigator to the mounted map, feeds it locations from either
/// `LocationSimulator` or the device, and forwards its callbacks to JS.
///
/// The class is itself the delegate for every navigator callback: the SDK holds
/// its delegates weakly, and React keeps this module alive for the app's
/// lifetime, so there is no chance of a delegate being collected mid-trip.
@objc(HereNavigationModule)
class HereNavigationModule: RCTEventEmitter {

    /// Events emitted to JS. Keep in sync with `src/here/HereNavigation.js`.
    private enum Event {
        static let maneuver = "onManeuver"
        static let routeProgress = "onRouteProgress"
        static let speedLimit = "onSpeedLimit"
        static let speedWarning = "onSpeedWarning"
        static let routeDeviation = "onRouteDeviation"
        static let destinationReached = "onDestinationReached"
        static let voiceGuidance = "onVoiceGuidance"
        static let location = "onNavigationLocation"

        static let all = [
            maneuver, routeProgress, speedLimit, speedWarning,
            routeDeviation, destinationReached, voiceGuidance, location,
        ]
    }

    /// The live instance, so `HereSdkModule` can tear navigation down before
    /// disposing the engine and the map view can detach the navigator.
    private(set) static var shared: HereNavigationModule?

    /// Where the navigator's location fixes come from.
    private enum LocationSource { case simulated, device }

    private var hasJsListeners = false
    /// Guards against re-emitting onManeuver for every progress tick.
    private var lastManeuverIndex: Int32 = -1
    /// Remembered so a reroute restarts the simulation at the same pace.
    private var simulationSpeedFactor: Double = 1.0

#if canImport(heresdk)
    private var visualNavigator: VisualNavigator?
    private var locationSimulator: LocationSimulator?
    private var locationEngine: LocationEngine?
    private weak var boundView: HereMapView?
#endif

    override init() {
        super.init()
        Self.shared = self
    }

    override func invalidate() {
        releaseForShutdown()
        Self.shared = nil
        super.invalidate()
    }

    // MARK: - RCTEventEmitter

    override func supportedEvents() -> [String]! { Event.all }
    override static func requiresMainQueueSetup() -> Bool { true }
    override func startObserving() { hasJsListeners = true }
    override func stopObserving() { hasJsListeners = false }

    private func emit(_ name: String, _ payload: [String: Any]) {
        guard hasJsListeners else { return }
        sendEvent(withName: name, body: payload)
    }

    // MARK: - Guided navigation

    /// Starts guidance along a route from `HereRoutingModule`. Pass nil for
    /// `routeId` to use the most recent one.
    @objc(startNavigation:options:resolver:rejecter:)
    func startNavigation(
        _ routeId: NSString?,
        options: NSDictionary?,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
#if canImport(heresdk)
        onMain(reject) {
            guard HereSdkModule.isReady() else {
                throw HereNavigationError.notInitialised
            }
            guard let route = HereRouteStore.shared.get(routeId as String?) else {
                throw HereNavigationError.noRoute(routeId as String?)
            }

            let navigator = try self.ensureNavigator()
            self.applyGuidanceOptions(navigator, options)
            self.lastManeuverIndex = -1
            navigator.route = route

            self.attachToMap(navigator)

            let simulate = (options?["simulate"] as? Bool) ?? true
            try self.startLocationSource(
                navigator: navigator,
                route: route,
                source: simulate ? .simulated : .device,
                speedFactor: (options?["speedFactor"] as? NSNumber)?.doubleValue ?? 1.0
            )

            resolve([
                "started": true,
                "simulated": simulate,
                "distanceMeters": Double(route.lengthInMeters),
                "durationSeconds": route.duration,
            ])
        }
#else
        reject("SDK_MISSING", "HERE SDK is not embedded in the Xcode project", nil)
#endif
    }

    /// Swaps the route guidance is following without restarting the session —
    /// the reroute primitive. A running simulation is restarted on the new
    /// route; a device feed keeps running untouched.
    @objc(setRoute:resolver:rejecter:)
    func setRoute(
        _ routeId: NSString?,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
#if canImport(heresdk)
        onMain(reject) {
            guard let navigator = self.visualNavigator else {
                throw HereNavigationError.notRunning
            }
            guard let route = HereRouteStore.shared.get(routeId as String?) else {
                throw HereNavigationError.noRoute(routeId as String?)
            }

            let wasSimulating = self.locationSimulator != nil
            self.lastManeuverIndex = -1
            navigator.route = route

            if wasSimulating {
                try self.startLocationSource(
                    navigator: navigator, route: route,
                    source: .simulated, speedFactor: self.simulationSpeedFactor
                )
            }
            resolve(true)
        }
#else
        reject("SDK_MISSING", "HERE SDK is not embedded in the Xcode project", nil)
#endif
    }

    @objc(stopNavigation:rejecter:)
    func stopNavigation(
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
#if canImport(heresdk)
        onMain(reject) {
            self.teardown()
            resolve(true)
        }
#else
        resolve(false)
#endif
    }

    // MARK: - Tracking (free driving, no route)

    /// Route-less tracking: the map follows the vehicle and speed events keep
    /// firing, but there are no maneuvers. Always uses device positioning —
    /// there is no route to simulate along.
    @objc(startTracking:resolver:rejecter:)
    func startTracking(
        _ options: NSDictionary?,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
#if canImport(heresdk)
        onMain(reject) {
            guard HereSdkModule.isReady() else { throw HereNavigationError.notInitialised }

            let navigator = try self.ensureNavigator()
            self.lastManeuverIndex = -1
            // A nil route is what switches the navigator into tracking mode.
            navigator.route = nil

            self.attachToMap(navigator)
            try self.startLocationSource(
                navigator: navigator, route: nil, source: .device, speedFactor: 1.0
            )
            resolve(true)
        }
#else
        reject("SDK_MISSING", "HERE SDK is not embedded in the Xcode project", nil)
#endif
    }

    @objc(stopTracking:rejecter:)
    func stopTracking(
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        stopNavigation(resolver: resolve, rejecter: reject)
    }

    // MARK: - Simulation

    /// Drives the navigator along a route with synthetic fixes — the way to
    /// exercise guidance without leaving your desk.
    @objc(startSimulation:options:resolver:rejecter:)
    func startSimulation(
        _ routeId: NSString?,
        options: NSDictionary?,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
#if canImport(heresdk)
        onMain(reject) {
            guard HereSdkModule.isReady() else { throw HereNavigationError.notInitialised }

            let navigator = try self.ensureNavigator()
            guard let route = HereRouteStore.shared.get(routeId as String?) ?? navigator.route else {
                throw HereNavigationError.noRoute(routeId as String?)
            }
            if navigator.route == nil { navigator.route = route }

            try self.startLocationSource(
                navigator: navigator, route: route, source: .simulated,
                speedFactor: (options?["speedFactor"] as? NSNumber)?.doubleValue ?? 1.0
            )
            resolve(true)
        }
#else
        reject("SDK_MISSING", "HERE SDK is not embedded in the Xcode project", nil)
#endif
    }

    @objc(stopSimulation:rejecter:)
    func stopSimulation(
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
#if canImport(heresdk)
        onMain(reject) {
            self.stopLocationSources()
            resolve(true)
        }
#else
        resolve(false)
#endif
    }

#if canImport(heresdk)

    // MARK: - Navigator setup

    private func ensureNavigator() throws -> VisualNavigator {
        if let existing = visualNavigator { return existing }
        let navigator = try VisualNavigator()
        attachDelegates(navigator)
        visualNavigator = navigator
        return navigator
    }

    /// Binds the navigator to the mounted map so the SDK draws the route, the
    /// maneuver arrows and the location indicator, and follows the vehicle.
    /// Navigation still runs (and still emits events) with no map mounted —
    /// that is the headless case — so a missing view is not an error.
    private func attachToMap(_ navigator: VisualNavigator) {
        guard let view = HereMapView.activeInstance() else {
            NSLog("[HereNavigationModule] no HereMapView mounted — navigating without rendering")
            return
        }
        if boundView !== view {
            navigator.stopRendering()
            navigator.startRendering(mapView: view.hereMapView)
            boundView = view
        }
    }

    private func applyGuidanceOptions(_ navigator: VisualNavigator, _ options: NSDictionary?) {
        var notifications = ManeuverNotificationOptions()
        notifications.language = Self.language(options?["language"] as? String)
        notifications.unitSystem = Self.unitSystem(options?["unitSystem"] as? String)
        navigator.maneuverNotificationOptions = notifications

        // Dropping the delegate is what actually silences guidance; the options
        // above only shape the text.
        let voiceGuidance = (options?["voiceGuidance"] as? Bool) ?? true
        navigator.eventTextDelegate = voiceGuidance ? self : nil
    }

    private static func language(_ raw: String?) -> LanguageCode {
        guard let raw = raw?.replacingOccurrences(of: "-", with: "_").uppercased() else {
            return .enUs
        }
        switch raw {
        case "EN_GB": return .enGb
        case "DE_DE": return .deDe
        case "ES_ES": return .esEs
        case "FR_FR": return .frFr
        case "IT_IT": return .itIt
        case "NL_NL": return .nlNl
        case "PT_PT": return .ptPt
        case "PL_PL": return .plPl
        case "HI_IN": return .hiIn
        default: return .enUs
        }
    }

    private static func unitSystem(_ raw: String?) -> UnitSystem {
        switch raw?.lowercased() {
        case "imperialus", "imperial_us", "imperial": return .imperialUs
        case "imperialuk", "imperial_uk": return .imperialUk
        default: return .metric
        }
    }

    /// Wires every navigator callback to a JS event.
    private func attachDelegates(_ navigator: VisualNavigator) {
        navigator.routeProgressDelegate = self
        navigator.navigableLocationDelegate = self
        navigator.speedLimitDelegate = self
        navigator.speedWarningDelegate = self
        navigator.routeDeviationDelegate = self
        navigator.destinationReachedDelegate = self
        navigator.eventTextDelegate = self
    }

    // MARK: - Location sources

    private func startLocationSource(
        navigator: VisualNavigator,
        route: Route?,
        source: LocationSource,
        speedFactor: Double
    ) throws {
        stopLocationSources()

        switch source {
        case .simulated:
            guard let route = route else { throw HereNavigationError.noRouteToSimulate }
            simulationSpeedFactor = min(max(speedFactor, 0.1), 20.0)
            var options = LocationSimulatorOptions()
            options.speedFactor = simulationSpeedFactor
            options.notificationInterval = 0.5

            let simulator = try LocationSimulator(route: route, options: options)
            // The navigator is itself a LocationDelegate, so simulated fixes go
            // straight into map matching.
            simulator.delegate = navigator
            simulator.start()
            locationSimulator = simulator

        case .device:
            let engine = try locationEngine ?? LocationEngine()
            locationEngine = engine
            engine.addLocationDelegate(locationDelegate: navigator)
            let status = engine.start(locationAccuracy: .navigation)
            guard status == .engineStarted || status == .alreadyStarted else {
                engine.removeLocationDelegate(locationDelegate: navigator)
                throw HereNavigationError.positioningFailed(String(describing: status))
            }
        }
    }

    private func stopLocationSources() {
        locationSimulator?.stop()
        locationSimulator = nil

        if let engine = locationEngine {
            if let navigator = visualNavigator {
                engine.removeLocationDelegate(locationDelegate: navigator)
            }
            engine.stop()
        }
    }

    // MARK: - Teardown

    private func teardown() {
        stopLocationSources()
        if let navigator = visualNavigator {
            navigator.route = nil
            navigator.stopRendering()
        }
        boundView = nil
        lastManeuverIndex = -1
    }

    /// Called by `HereMapView` immediately before its surface goes away.
    func onMapViewDestroyed(_ view: HereMapView) {
        guard boundView === view else { return }
        visualNavigator?.stopRendering()
        boundView = nil
    }

    /// Full release, before the engine is disposed and when the bridge dies.
    func releaseForShutdown() {
        let work = {
            self.teardown()
            self.locationEngine = nil
            self.visualNavigator = nil
        }
        Thread.isMainThread ? work() : DispatchQueue.main.sync(execute: work)
    }

    // MARK: - Bridge helpers

    /// Runs `block` on the main thread — every VisualNavigator, MapView and
    /// LocationSimulator call has to be there — and rejects on a throw.
    private func onMain(
        _ reject: @escaping RCTPromiseRejectBlock,
        _ block: @escaping () throws -> Void
    ) {
        DispatchQueue.main.async {
            do {
                try block()
            } catch {
                reject("HERE_NAVIGATION_ERROR", error.localizedDescription, error)
            }
        }
    }
#else
    func releaseForShutdown() {}
#endif
}

// MARK: - Errors

enum HereNavigationError: LocalizedError {
    case notInitialised
    case notRunning
    case noRoute(String?)
    case noRouteToSimulate
    case positioningFailed(String)

    var errorDescription: String? {
        switch self {
        case .notInitialised:
            return "HERE SDK is not initialised — call HereSdk.initialize() first"
        case .notRunning:
            return "Navigation is not running"
        case .noRoute(let id):
            return "No route for id '\(id ?? "<latest>")' — calculate one first"
        case .noRouteToSimulate:
            return "Simulation needs a route"
        case .positioningFailed(let status):
            return "Device positioning could not start: \(status)"
        }
    }
}

// MARK: - Navigator delegates

#if canImport(heresdk)
extension HereNavigationModule: RouteProgressDelegate {
    func onRouteProgressUpdated(_ routeProgress: RouteProgress) {
        emit(Event.routeProgress, HereSerialization.routeProgress(routeProgress))
        emitManeuverIfChanged(routeProgress)
    }

    /// Route progress fires several times a second; the maneuver only changes
    /// at a turn, so JS gets one event per turn rather than one per tick.
    private func emitManeuverIfChanged(_ progress: RouteProgress) {
        guard let next = progress.maneuverProgress.first,
              next.maneuverIndex != lastManeuverIndex,
              let maneuver = visualNavigator?.getManeuver(index: next.maneuverIndex)
        else { return }

        lastManeuverIndex = next.maneuverIndex
        emit(Event.maneuver, HereSerialization.maneuver(
            maneuver,
            index: Int(next.maneuverIndex),
            distanceMeters: Double(next.remainingDistanceInMeters),
            durationSeconds: next.remainingDuration
        ))
    }
}

extension HereNavigationModule: NavigableLocationDelegate {
    func onNavigableLocationUpdated(_ navigableLocation: NavigableLocation) {
        emit(Event.location, HereSerialization.navigableLocation(navigableLocation))
    }
}

extension HereNavigationModule: SpeedLimitDelegate {
    func onSpeedLimitUpdated(_ speedLimit: SpeedLimit) {
        emit(Event.speedLimit, HereSerialization.speedLimit(speedLimit))
    }
}

extension HereNavigationModule: SpeedWarningDelegate {
    func onSpeedWarningStatusChanged(_ status: SpeedWarningStatus) {
        emit(Event.speedWarning, HereSerialization.speedWarning(status))
    }
}

extension HereNavigationModule: RouteDeviationDelegate {
    func onRouteDeviation(_ routeDeviation: RouteDeviation) {
        emit(Event.routeDeviation, HereSerialization.routeDeviation(routeDeviation))
    }
}

extension HereNavigationModule: DestinationReachedDelegate {
    func onDestinationReached() {
        emit(Event.destinationReached, [:])
    }
}

extension HereNavigationModule: EventTextDelegate {
    func onEventTextUpdated(_ eventText: EventText) {
        emit(Event.voiceGuidance, HereSerialization.eventText(eventText))
    }
}
#endif
