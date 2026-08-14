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

    /// Driving-view camera defaults. The SDK's own default follows the vehicle
    /// but derives tilt and zoom from speed, so a real drive that starts parked
    /// opens flat and far out — nothing like the tilted road-ahead view a
    /// simulated run at 6× shows. These pin it instead.
    private enum CameraDefaults {
        /// Tilt and the principal point together decide whether the horizon
        /// falls inside the viewport: the top edge sits roughly 40° above the
        /// camera axis at this anchor, so anything past ~50° of tilt aims the
        /// top of the screen beyond the horizon and the scene's sky band shows
        /// as a blue-grey wash across the top of the map. Keep tilt + that
        /// offset under 90°; if a sliver of sky still shows on a taller screen,
        /// lower the tilt rather than the anchor.
        static let tilt = 45.0
        static let distance = 350.0
        /// Vehicle sits about two-thirds down the screen, so the road ahead
        /// fills the frame — the "looking up the road" framing drivers expect.
        static let principalY = 0.68
        /// Guard rails for the zoom controls: closer than ~50 m clips through
        /// the vehicle, further than ~5 km stops being a driving view.
        static let minDistance = 50.0
        static let maxDistance = 5000.0
    }

    private var hasJsListeners = false
    /// Says the maneuvers out loud; the SDK only writes them.
    private var speaker: HereSpeaker?
    /// Guards against re-emitting onManeuver for every progress tick.
    private var lastManeuverIndex: Int32 = -1
    /// The route guidance is currently following, as a concrete id.
    ///
    /// Guidance outlives the screen that started it — the driver can leave the
    /// trip screen and watch the same session in a floating map — so JS needs a
    /// way to ask what is running rather than remember it across unmounts.
    private var currentRouteId: String?
    /// Remembered so a reroute restarts the simulation at the same pace.
    private var simulationSpeedFactor: Double = 1.0

    /// The live driving-camera settings. Kept here rather than read back off the
    /// behavior so a zoom step preserves the tilt and framing, and so the same
    /// view is restored when guidance is handed a new navigator.
    private var cameraTilt = CameraDefaults.tilt
    private var cameraDistance = CameraDefaults.distance
    private var cameraPrincipalY = CameraDefaults.principalY
    private var cameraBearing: Double?
    private var cameraMode = "fixed"

    // ── Traffic on the route ────────────────────────────────────────────────
    // The navigator draws the route itself during guidance, so the preview's
    // coloured polylines are gone by then. Handing it a TrafficOnRoute is what
    // makes it paint the same story: the congested stretches in yellow and red,
    // everything flowing left in the route's own colour.

    /// How often the congestion colouring on the route is refreshed while
    /// guidance runs. Traffic is a live figure but not a fast-moving one, and
    /// each refresh is a network request, so a minute keeps the colours honest
    /// without putting the driver's data plan to work.
    private static let trafficRefreshInterval: TimeInterval = 60

    private var trafficRefreshTimer: Timer?
    /// How far along the route the truck already is, so a refresh only prices the rest.
    private var lastTraveledSectionIndex: Int32 = 0
    private var traveledDistanceOnLastSectionInMeters: Int32 = 0

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
            self.currentRouteId = HereRouteStore.shared.resolveId(routeId as String?)
            self.startTrafficOnRoute(navigator, route)

            self.attachToMap(navigator, options?["mapViewTag"] as? NSNumber)
            self.readCameraOptions(options?["camera"] as? NSDictionary)
            self.applyCameraBehavior(navigator)

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
            self.currentRouteId = HereRouteStore.shared.resolveId(routeId as String?)
            // A reroute is a different road ahead, so the congestion the driver
            // was shown no longer applies — ask again for the new way round.
            self.startTrafficOnRoute(navigator, route)

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

    // MARK: - Map binding

    /// Hands a *running* session's rendering to another mounted `HereMapView`,
    /// without restarting guidance.
    ///
    /// The driver leaving the trip screen does not end the trip: the same
    /// session carries on inside the floating map on Home, and comes back to
    /// the full screen when they return to it. Only the surface it draws into
    /// changes, so the route, the maneuver arrows and the vehicle all continue
    /// from where they were — restarting navigation instead would re-announce
    /// the first turn and lose the progress.
    ///
    /// Options: `{ mapViewTag?, camera? }` — `camera` is folded in exactly as
    /// `startNavigation` does, so the caller can re-assert `{mode: 'fixed'}`
    /// after the driver had panned the previous map away from the vehicle.
    ///
    /// Resolves true when a map took the rendering, false when none is mounted
    /// (guidance keeps running headless).
    @objc(attachToMapView:resolver:rejecter:)
    func attachToMapView(
        _ options: NSDictionary?,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
#if canImport(heresdk)
        onMain(reject) {
            guard let navigator = self.visualNavigator else {
                throw HereNavigationError.notRunning
            }
            self.attachToMap(navigator, options?["mapViewTag"] as? NSNumber)
            self.readCameraOptions(options?["camera"] as? NSDictionary)
            self.applyCameraBehavior(navigator)
            resolve(self.boundView != nil)
        }
#else
        resolve(false)
#endif
    }

    /// What the navigator is doing right now — the "is a trip still running?"
    /// question a screen has to ask on mount, since guidance survives it.
    ///
    /// `{ running, navigating, rendering, routeId }`: `running` is a live
    /// navigator (guided or tracking), `navigating` narrows that to one
    /// following a route, and `rendering` says whether a map is currently
    /// showing it.
    @objc(getSessionState:rejecter:)
    func getSessionState(
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
#if canImport(heresdk)
        onMain(reject) {
            let navigating = self.visualNavigator?.route != nil
            var state: [String: Any] = [
                "running": self.visualNavigator != nil,
                "navigating": navigating,
                "rendering": self.boundView != nil,
            ]
            if navigating, let routeId = self.currentRouteId {
                state["routeId"] = routeId
            }
            resolve(state)
        }
#else
        resolve(["running": false, "navigating": false, "rendering": false])
#endif
    }

    /// Mutes or unmutes spoken guidance mid-trip. The `onVoiceGuidance` events
    /// keep arriving either way, so the on-screen instruction stays live while
    /// the cab is quiet.
    @objc(setSpeechEnabled:resolver:rejecter:)
    func setSpeechEnabled(
        _ enabled: Bool,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
#if canImport(heresdk)
        onMain(reject) {
            if enabled {
                self.ensureSpeaker().enabled = true
            } else {
                self.speaker?.enabled = false
            }
            resolve(enabled)
        }
#else
        resolve(false)
#endif
    }

    /// Retunes the camera while guidance is running — what the zoom controls and
    /// the re-centre button call. Takes the same block `startNavigation` accepts
    /// under `camera`.
    @objc(setCameraBehavior:resolver:rejecter:)
    func setCameraBehavior(
        _ camera: NSDictionary?,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
#if canImport(heresdk)
        onMain(reject) {
            self.readCameraOptions(camera)
            if let navigator = self.visualNavigator {
                self.applyCameraBehavior(navigator)
            }
            resolve(self.cameraState())
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
            self.currentRouteId = nil
            // No route means nothing to colour by congestion.
            self.stopTrafficOnRoute()

            self.attachToMap(navigator, options?["mapViewTag"] as? NSNumber)
            self.readCameraOptions(options?["camera"] as? NSDictionary)
            self.applyCameraBehavior(navigator)
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

    /// Binds the navigator to a mounted map so the SDK draws the route, the
    /// maneuver arrows and the location indicator, and follows the vehicle.
    /// Navigation still runs (and still emits events) with no map mounted —
    /// that is the headless case — so a missing view is not an error.
    ///
    /// `mapViewTag` picks which map when more than one is on screen; without it
    /// the most recently mounted one takes the rendering.
    private func attachToMap(_ navigator: VisualNavigator, _ mapViewTag: NSNumber? = nil) {
        guard let view = HereMapView.resolveInstance(tag: mapViewTag) else {
            NSLog("[HereNavigationModule] no HereMapView mounted — navigating without rendering")
            return
        }
        if boundView !== view {
            navigator.stopRendering()
            navigator.startRendering(mapView: view.hereMapView)
            boundView = view
        }
    }

    /// Pins the camera to a driving view instead of leaving it on the SDK's
    /// speed-derived default.
    ///
    /// `mode` picks what follows the vehicle:
    ///   - `fixed`   — constant tilt and distance (the default here)
    ///   - `dynamic` — the SDK varies tilt/zoom with speed
    ///   - `free`    — nobody follows; the map keeps whatever the user's pan,
    ///                 pinch and rotate gestures leave it at
    private func applyCameraBehavior(_ navigator: VisualNavigator) {
        let principalPoint = Anchor2D(horizontal: 0.5, vertical: cameraPrincipalY)
        switch cameraMode {
        case "free":
            navigator.cameraBehavior = nil
        case "dynamic":
            let behavior = DynamicCameraBehavior()
            behavior.normalizedPrincipalPoint = principalPoint
            navigator.cameraBehavior = behavior
        default:
            let behavior = FixedCameraBehavior()
            behavior.normalizedPrincipalPoint = principalPoint
            behavior.cameraTiltInDegrees = cameraTilt
            // A nil bearing means "point where the vehicle is heading", which
            // is what makes the road run up the screen.
            behavior.cameraBearingInDegrees = cameraBearing
            behavior.zoom = MapMeasure(kind: .distanceInMeters, value: cameraDistance)
            navigator.cameraBehavior = behavior
        }
    }

    /// The driver panned, pinched or rotated the map the navigator is drawing
    /// into. Hand them the camera — otherwise the next location fix snaps it
    /// straight back and the gesture looks broken. `setCameraBehavior` with
    /// `mode: 'fixed'` (the re-centre button) takes it back.
    func onUserTookCamera(_ view: HereMapView) {
        guard view === boundView, cameraMode != "free" else { return }
        cameraMode = "free"
        DispatchQueue.main.async {
            if let navigator = self.visualNavigator {
                self.applyCameraBehavior(navigator)
            }
        }
    }

    /// Folds a camera options block into the remembered settings. Absent keys
    /// keep their current value, so a zoom step can send `distanceMeters` alone
    /// without flattening the tilt.
    private func readCameraOptions(_ camera: NSDictionary?) {
        guard let camera = camera else { return }
        if let mode = camera["mode"] as? String { cameraMode = mode }
        if let tilt = (camera["tiltDegrees"] as? NSNumber)?.doubleValue {
            cameraTilt = tilt
        }
        if let distance = (camera["distanceMeters"] as? NSNumber)?.doubleValue {
            cameraDistance = min(
                max(distance, CameraDefaults.minDistance), CameraDefaults.maxDistance
            )
        }
        if let principalY = (camera["principalPointY"] as? NSNumber)?.doubleValue {
            cameraPrincipalY = min(max(principalY, 0.0), 1.0)
        }
        // Absent leaves the current setting; an explicit null means heading-up.
        if camera["bearingDegrees"] != nil {
            cameraBearing = (camera["bearingDegrees"] as? NSNumber)?.doubleValue
        }
    }

    /// The settings actually in force, so JS need not mirror the clamping.
    private func cameraState() -> [String: Any] {
        [
            "mode": cameraMode,
            "tiltDegrees": cameraTilt,
            "distanceMeters": cameraDistance,
            "principalPointY": cameraPrincipalY,
            "bearingDegrees": cameraBearing as Any,
        ]
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

        // The SDK writes the instruction but never says it, so speaking is a
        // separate switch: a screen that wants to run its own TTS off the
        // onVoiceGuidance event can keep the text and silence this one.
        let speak = (options?["speak"] as? Bool) ?? true
        if voiceGuidance && speak {
            let speaker = ensureSpeaker()
            speaker.setLanguage(options?["language"] as? String)
            speaker.enabled = true
        } else {
            self.speaker?.enabled = false
        }
    }

    private func ensureSpeaker() -> HereSpeaker {
        if let existing = speaker { return existing }
        let created = HereSpeaker()
        speaker = created
        return created
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

    // MARK: - Traffic on the route

    /// Turns on congestion colouring for the route the navigator draws, and keeps
    /// it current for the rest of the trip.
    ///
    /// The palette is `HERERoutingService`'s, so guidance and the trip preview
    /// read the same: slow stretches yellow, heavy ones red, blocked road darker
    /// still — and anything flowing left in the navigator's own route colour.
    /// Only the traffic entries of the palette are replaced, so the route-progress
    /// colours the navigator already has (day or night) are left as they were.
    private func startTrafficOnRoute(_ navigator: VisualNavigator, _ route: Route) {
        // A new route: nothing of it has been driven yet.
        lastTraveledSectionIndex = 0
        traveledDistanceOnLastSectionInMeters = 0

        let colors = navigator.colors
        colors.trafficOnRouteColors = HERERoutingService.navigatorTrafficColors()
        navigator.colors = colors
        navigator.isTrafficOnRouteVisible = true

        requestTrafficOnRoute(navigator, route)

        trafficRefreshTimer?.invalidate()
        trafficRefreshTimer = Timer.scheduledTimer(
            withTimeInterval: Self.trafficRefreshInterval, repeats: true
        ) { [weak self] _ in
            guard let self = self,
                  let navigator = self.visualNavigator,
                  let route = navigator.route
            else { return }
            self.requestTrafficOnRoute(navigator, route)
        }
    }

    /// Asks for traffic on `route` and hands the answer to the navigator.
    ///
    /// The response comes back on an SDK thread and the navigator is main-thread
    /// only, so it is hopped across — and dropped if guidance has moved to
    /// another route (a reroute) or stopped while the request was in flight.
    private func requestTrafficOnRoute(_ navigator: VisualNavigator, _ route: Route) {
        HERERoutingService.trafficOnRoute(
            route,
            lastTraveledSectionIndex: lastTraveledSectionIndex,
            traveledDistanceOnLastSectionInMeters: traveledDistanceOnLastSectionInMeters
        ) { [weak self, weak navigator] traffic in
            guard let traffic = traffic else { return }
            DispatchQueue.main.async {
                guard let self = self, let navigator = navigator,
                      self.visualNavigator === navigator, navigator.route === route
                else { return }
                navigator.trafficOnRoute = traffic
            }
        }
    }

    /// Banks how far along the route the truck is, from the progress the
    /// navigator already emits, so the next refresh only asks about the road
    /// still ahead.
    ///
    /// `sectionProgress` holds one entry per section still to drive — the first
    /// is the section being driven now, the last the whole route — so its length
    /// is what says which section that is.
    fileprivate func trackTraveledDistance(_ progress: RouteProgress) {
        guard let sections = visualNavigator?.route?.sections, !sections.isEmpty,
              let currentSection = progress.sectionProgress.first
        else { return }

        let index = min(max(sections.count - progress.sectionProgress.count, 0), sections.count - 1)
        lastTraveledSectionIndex = Int32(index)
        traveledDistanceOnLastSectionInMeters = Int32(max(
            Int(sections[index].lengthInMeters) - Int(currentSection.remainingDistanceInMeters), 0
        ))
    }

    private func stopTrafficOnRoute() {
        trafficRefreshTimer?.invalidate()
        trafficRefreshTimer = nil
        lastTraveledSectionIndex = 0
        traveledDistanceOnLastSectionInMeters = 0
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

            // HERE Positioning refuses to start until the app declares that
            // HERE's privacy notice is covered by its own — see
            // confirmPrivacyNotice(). Declare it before the first start.
            var confirmation = confirmPrivacyNotice(engine)
            var status = engine.start(locationAccuracy: .navigation)

            // The declaration is forwarded to the SDK's positioning client,
            // which does not exist until a start has built it — so the first one
            // can be dropped on a cold engine. Declare again and retry.
            if status == .privacyNoticeUnconfirmed {
                confirmation = confirmPrivacyNotice(engine)
                status = engine.start(locationAccuracy: .navigation)
                if status == .privacyNoticeUnconfirmed {
                    engine.removeLocationDelegate(locationDelegate: navigator)
                    throw HereNavigationError.positioningFailed(
                        "HERE Positioning rejected the privacy-notice confirmation "
                            + "(\(confirmation)). Check that the HERE credentials are "
                            + "licensed for positioning."
                    )
                }
            }

            guard Self.isPositioningStarted(status) else {
                engine.removeLocationDelegate(locationDelegate: navigator)
                throw HereNavigationError.positioningFailed(String(describing: status))
            }
        }
    }

    /// Whether a `LocationEngine.start` result means positioning is running.
    ///
    /// Three of the enum's cases mean success, not one: `.engineStarted` for a
    /// cold start, `.alreadyStarted` when a feed is up, and a bare `.ok` — which
    /// is what a start returns once the privacy-notice confirmation has been
    /// accepted. Everything else is a genuine failure.
    private static func isPositioningStarted(_ status: LocationEngineStatus) -> Bool {
        status == .engineStarted || status == .alreadyStarted || status == .ok
    }

    /// Declares to the SDK that this app's own privacy notice covers HERE's.
    ///
    /// HERE Positioning is a data-collecting service, so the SDK will not start
    /// it until the app states that it has told its users — until then every
    /// `start()` answers `.privacyNoticeUnconfirmed`. This is a one-off
    /// declaration by the app, not a consent dialog for the driver.
    ///
    /// The obligation behind it is real: MyShipr's privacy notice has to
    /// actually include the HERE positioning disclosure for this call to be
    /// truthful. `.pending` means the SDK is still writing the confirmation,
    /// which is fine — the retry that follows picks it up.
    private func confirmPrivacyNotice(_ engine: LocationEngine) -> ConfirmationStatus {
        let status = engine.confirmHEREPrivacyNoticeInclusion()
        if status != .ok && status != .pending {
            NSLog("[HereNavigationModule] privacy-notice confirmation returned \(status)")
        }
        return status
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
        stopTrafficOnRoute()
        // Cut off any half-spoken instruction — guidance for a trip that just
        // ended is worse than silence.
        speaker?.stop()
        if let navigator = visualNavigator {
            navigator.route = nil
            navigator.stopRendering()
        }
        boundView = nil
        lastManeuverIndex = -1
        currentRouteId = nil
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
            self.speaker = nil
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
        trackTraveledDistance(routeProgress)
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
        speaker?.speak(eventText.text)
        emit(Event.voiceGuidance, HereSerialization.eventText(eventText))
    }
}
#endif
