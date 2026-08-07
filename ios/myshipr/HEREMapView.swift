import UIKit
import React
#if canImport(heresdk)
import heresdk
#endif

class HereMapView: UIView {

#if canImport(heresdk)
    private let mapView = MapView()

    // Polyline
    private var routePolylineObject: MapPolyline?
    private var allMapPolylines: [MapPolyline] = []
    // Raw coords kept for trimPolyline
    private var currentPolylineCoords: [[Double]] = []

    // ── Native-controlled marker size ───────────────────────────────────────
    // On-screen pixel size for every JS-supplied marker image (source /
    // destination pins and the navigation truck). The rasterised PNG is scaled
    // to this on the native side, so the marker size is decided here — NOT by
    // whatever resolution the PNG happened to be captured at. Tune this single
    // value to make markers bigger / smaller (kept in sync with Android's
    // HereMapView.MARKER_IMAGE_SIZE_PX).
    private static let markerImageSizePx: CGFloat = 100

    // Markers
    private var sourceMarker:      MapMarker?
    private var destinationMarker: MapMarker?
    private var navigationMarker:  MapMarker?
    private var genericMarkers:    [MapMarker] = []

    // Current-location marker. We use HERE's built-in LocationIndicator with the
    // NAVIGATION style so the marker looks IDENTICAL to Android (which uses the
    // same LocationIndicator/NAVIGATION arrow). `locationMarker`/`locationBearing`
    // are retained for the legacy custom-dot path but are no longer used by
    // showCurrentLocation.
    private var locationIndicator: LocationIndicator?
    private var locationMarker: MapMarker?
    private var locationBearing: Double = -999

    // Navigation state
    private var isNavigating = false

    // Optional JS-provided PNG bytes for the live vehicle marker (rasterised
    // from the user-selected SVG icon). When nil we fall back to the drawn arrow.
    private var navigationIconData: Data?
    // On-screen size (px) JS requested for the navigation truck marker.
    private var navigationIconSize: CGFloat?

    // ── Realtime navigation (Google-Maps-style smooth follow) ───────────────
    // Mirrors Android's NavigationMarkerManager + PolylineManager.syncAnimatedTrim:
    // a CADisplayLink interpolates the truck between GPS points every frame, and
    // each frame grows a grey "passed" polyline overlay so the traveled part of
    // the route trims smoothly behind the marker — no whole-route redraw, no
    // camera refight.
    private var navDisplayLink: CADisplayLink?
    private var navAnimFrom = GeoCoordinates(latitude: 0, longitude: 0)
    private var navAnimTo   = GeoCoordinates(latitude: 0, longitude: 0)
    private var navAnimStart: CFTimeInterval = 0
    private var navAnimDuration: CFTimeInterval = 0.18
    private var navCurrentCoord = GeoCoordinates(latitude: 0, longitude: 0)
    private var navSegmentIndex = -1

    // ── Navigation camera follow (Google-Maps-style heading-up) ─────────────
    // 1:1 port of Android's NavigationCameraManager: the camera is centered on
    // the truck and rotated to the travel bearing, so the billboarded marker
    // (which points forward/up in its image) always faces the moving direction.
    // Bearing, zoom and tilt are smoothed frame-to-frame and the move is run as
    // an animated flyTo so the heading the marker faces tracks the route
    // accurately instead of snapping on every GPS tick.
    private var navCamLastUpdate: CFTimeInterval = 0
    private var navCamLastBearing: Double = 0
    private var navCamLastZoom: Double = 16.6
    private var navCamHasState = false

    private static let navCamMinUpdateInterval: CFTimeInterval = 0.033   // ~30 fps
    private static let navCamBearingSmoothing = 0.3
    private static let navCamZoomSmoothing = 0.18
    private static let navCamMinBearingDelta = 0.75
    private static let navCamMaxSpeedMps = 38.0

    // Full route geometry (set by drawRoutePolyline) used to build the passed path.
    private var navRouteCoords: [GeoCoordinates] = []
    // Grey overlay drawn over the consumed part of the route.
    private var navPassedPolyline: MapPolyline?
    private var navPassedPath: [GeoCoordinates] = []
    private var navPassedLastRouteIndex = -1
    private var navLastRenderedSplit: GeoCoordinates?

    // Scene-load gating: HERE's mapScene.loadScene is async. Any draw/marker/camera
    // call that arrives before the scene is ready (e.g. the route preview that fires
    // right after the screen mounts) must be queued and replayed once it loads,
    // otherwise the SDK silently drops it and nothing renders.
    private var isSceneLoaded = false
    private var pendingSceneOps: [() -> Void] = []

    // ── Map styling ────────────────────────────────────────────────────────
    // Scheme currently applied, and the feature set (3D buildings, traffic…)
    // that must be re-applied after every scene load because loadScene resets it.
    private var currentScheme: MapScheme = .normalDay
    private var enabledFeatures: [String: String] = [:]

    // Side of the square hit-test box used when picking an embedded POI.
    private static let poiPickBoxPx: Double = 48

#else
    private let placeholderView: UIView = {
        let view = UIView()
        view.backgroundColor = .systemGray5
        let label = UILabel()
        label.text = "HERE SDK not available"
        label.textColor = .darkGray
        label.textAlignment = .center
        label.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(label)
        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
        return view
    }()
#endif

    // MARK: - Init

    override init(frame: CGRect) {
        super.init(frame: frame)
        HereMapView.register(self)
#if canImport(heresdk)
        addSubview(mapView)
        mapView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            mapView.topAnchor.constraint(equalTo: topAnchor),
            mapView.bottomAnchor.constraint(equalTo: bottomAnchor),
            mapView.leadingAnchor.constraint(equalTo: leadingAnchor),
            mapView.trailingAnchor.constraint(equalTo: trailingAnchor)
        ])
        loadMap()
#else
        addSubview(placeholderView)
        placeholderView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            placeholderView.topAnchor.constraint(equalTo: topAnchor),
            placeholderView.bottomAnchor.constraint(equalTo: bottomAnchor),
            placeholderView.leadingAnchor.constraint(equalTo: leadingAnchor),
            placeholderView.trailingAnchor.constraint(equalTo: trailingAnchor)
        ])
#endif
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    deinit {
#if canImport(heresdk)
        // Navigation renders into this map — it has to let go before the view
        // goes away.
        HereNavigationModule.shared?.onMapViewDestroyed(self)
#endif
        HereMapView.unregister(self)
    }

    // MARK: - Instance registry
    //
    // Modules address the map by React tag, but the app only ever shows one at
    // a time, so "most recently mounted, still alive" is the right default —
    // and it is what HereNavigationModule renders into. Mirrors Android's
    // HereMapViewManager.resolveViewOrActive.

    private static var activeRef: WeakMapViewRef?

    private static func register(_ view: HereMapView) {
        activeRef = WeakMapViewRef(view)
    }

    private static func unregister(_ view: HereMapView) {
        if activeRef?.value === view { activeRef = nil }
    }

    /// The map a tag-less call should act on, or nil when none is mounted.
    static func activeInstance() -> HereMapView? { activeRef?.value }

    // MARK: - Event props (wired up in HereMapViewManager.m)

    @objc var onMapTap: RCTDirectEventBlock?
    @objc var onMapLongPress: RCTDirectEventBlock?
    @objc var onPoiTap: RCTDirectEventBlock?
    @objc var onMapError: RCTDirectEventBlock?

    // MARK: - Camera props
    //
    // Applied once both coordinates have arrived: React sets props one at a
    // time, so acting on the first would centre the map on (lat, 0).

    @objc var centerLat: NSNumber? { didSet { applyInitialCameraIfReady() } }
    @objc var centerLng: NSNumber? { didSet { applyInitialCameraIfReady() } }
    @objc var zoomLevel: NSNumber? { didSet { applyInitialCameraIfReady() } }

    private var hasAppliedInitialCamera = false

    private func applyInitialCameraIfReady() {
#if canImport(heresdk)
        guard !hasAppliedInitialCamera,
              let lat = centerLat?.doubleValue,
              let lng = centerLng?.doubleValue,
              lat != 0 || lng != 0
        else { return }
        hasAppliedInitialCamera = true
        setCenter(lat: lat, lng: lng, zoom: zoomLevel?.doubleValue ?? 14)
#endif
    }

    /// Map style, e.g. "normalDay", "satellite", "logisticsDay".
    @objc var mapScheme: NSString? {
        didSet {
#if canImport(heresdk)
            if let value = mapScheme as String?, !value.isEmpty {
                _ = setMapScheme(value)
            }
#endif
        }
    }

    /// Turns on HERE's extruded-building (3D) rendering.
    @objc var buildings3D: Bool = false {
        didSet {
#if canImport(heresdk)
            set3DBuildingsEnabled(buildings3D)
#endif
        }
    }

#if canImport(heresdk)

    /// The HERE surface, for `VisualNavigator.startRendering(mapView:)`.
    var hereMapView: MapView { mapView }

    /// Resolves once the scene is renderable, optionally switching scheme
    /// first — the "tell me when the map is usable" hook. Completing with nil
    /// means success; a string is the SDK's error text.
    func awaitMapReady(scheme: String?, completion: @escaping (String?) -> Void) {
        if let scheme = scheme, !scheme.isEmpty, !setMapScheme(scheme) {
            completion("Unknown map scheme: \(scheme)")
            return
        }
        whenSceneReady { completion(nil) }
    }

    /// Centres the map without animating — the plain "go here" camera call.
    func setCenter(lat: Double, lng: Double, zoom: Double) {
        moveCamera(lat: lat, lng: lng, zoom: zoom, animate: false)
    }

    /// Draws route geometry calculated elsewhere — the vertices returned by
    /// `HereRoutingModule`, or a stored route resolved from `HereRouteStore`.
    /// Replaces whatever was drawn before, so `clearRoute` removes it either way.
    func drawRouteGeometry(coords: [[Double]], color: UIColor?, widthPixels: Double) {
        drawRoutePolyline(coords: coords, color: color, widthPixels: widthPixels)
    }

    // MARK: - Map Load

    private func loadMap() {
        attachGestureDelegates()
        mapView.mapScene.loadScene(mapScheme: currentScheme) { [weak self] error in
            guard let self = self else { return }
            guard error == nil else {
                let message = String(describing: error)
                print("[HereMapView] Map load error: \(message)")
                // Tell JS, so a dead map says why instead of showing a blank
                // rectangle (see <HereMapView>'s onMapError handling).
                self.onMapError?(["code": "MAP_SCENE_FAILED", "message": message])
                return
            }
            // Force map labels (place / city / road names) to English so the map
            // reads the same on every device regardless of the phone's system
            // language — otherwise iOS falls back to the device locale and shows
            // e.g. Hindi. Kept in sync with Android's MapView.setPrimaryLanguage.
            MapView.primaryLanguage = LanguageCode.enUs

            let distance = MapMeasure(kind: .distanceInMeters, value: 5000)
            self.mapView.camera.lookAt(
                point: GeoCoordinates(latitude: 28.4595, longitude: 77.0266),
                zoom: distance
            )

            // Move the HERE watermark/logo to the vertical-centre of the map's
            // right edge (kept in sync with Android's setWatermarkLocation). The
            // anchor (1.0, 0.5) is the right edge mid-height; the negative-x
            // offset pulls the logo inward so it isn't clipped off-screen.
           self.mapView.setWatermarkLocation(
              anchor: Anchor2D(horizontal: 1.0, vertical: 0.8),
            offset: Point2D(x: -65, y: 0)
           )

            // Loading a scene clears the feature set, so restore it.
            if !self.enabledFeatures.isEmpty {
                self.mapView.mapScene.enableFeatures(self.enabledFeatures)
            }

            // Scene is ready — flush any operations queued while it was loading
            // (in FIFO order so a queued clear → draw stays consistent).
            self.isSceneLoaded = true
            let ops = self.pendingSceneOps
            self.pendingSceneOps.removeAll()
            ops.forEach { $0() }
        }
    }

    // MARK: - Map styling — the schemes the Explore edition ships with

    /// Switches the map style. Accepts the `MapScheme` names in any case and
    /// hyphen/underscore form, e.g. "satellite", "hybridDay", "LOGISTICS_NIGHT".
    /// Returns false when the name matches no scheme (the map is left as-is).
    func setMapScheme(_ name: String) -> Bool {
        guard let scheme = HereMapView.parseMapScheme(name) else {
            print("[HereMapView] unknown map scheme '\(name)'")
            return false
        }
        guard scheme != currentScheme else { return true }

        currentScheme = scheme
        // The initial loadScene may still be running; queue behind it.
        whenSceneReady { [weak self] in
            guard let self = self else { return }
            self.mapView.mapScene.loadScene(mapScheme: scheme) { error in
                if let error = error {
                    print("[HereMapView] Scene load error: \(error)")
                    return
                }
                MapView.primaryLanguage = LanguageCode.enUs
                if !self.enabledFeatures.isEmpty {
                    self.mapView.mapScene.enableFeatures(self.enabledFeatures)
                }
            }
        }
        return true
    }

    func getMapScheme() -> String { String(describing: currentScheme) }

    /// "hybrid_day" / "HYBRID-DAY" / "hybridDay" / "SATELLITE" all resolve by
    /// comparing on letters/digits only, case-insensitively.
    private static func parseMapScheme(_ name: String) -> MapScheme? {
        let target = name.filter { $0.isLetter || $0.isNumber }.lowercased()
        guard !target.isEmpty else { return nil }
        return MapScheme.allCases.first { String(describing: $0).lowercased() == target }
    }

    /// Toggles map features. `enable` maps a `MapFeatures` key to a
    /// `MapFeatureModes` value; `disable` is a plain list of feature keys.
    /// `MapFeatures.extrudedBuildings` is what turns on 3D building rendering.
    func setMapFeatures(enable: [String: String], disable: [String]) {
        disable.forEach { enabledFeatures.removeValue(forKey: $0) }
        enable.forEach { enabledFeatures[$0.key] = $0.value }

        // Before the scene is ready there is nothing to toggle — the recorded
        // set is applied by loadScene instead.
        guard isSceneLoaded else { return }

        if !disable.isEmpty { mapView.mapScene.disableFeatures(disable) }
        if !enable.isEmpty { mapView.mapScene.enableFeatures(enable) }
    }

    /// Convenience toggle for 3D buildings + the shadows that sell the effect.
    func set3DBuildingsEnabled(_ enabled: Bool) {
        if enabled {
            setMapFeatures(
                enable: [
                    MapFeatures.extrudedBuildings: MapFeatureModes.extrudedBuildingsAll,
                    MapFeatures.shadows: MapFeatureModes.shadowsAll
                ],
                disable: []
            )
        } else {
            setMapFeatures(
                enable: [:],
                disable: [MapFeatures.extrudedBuildings, MapFeatures.shadows]
            )
        }
    }

    // MARK: - Map interaction — tap / long-press, including embedded POIs

    private func attachGestureDelegates() {
        mapView.gestures.tapDelegate = self
        mapView.gestures.longPressDelegate = self
        // While guidance runs, the navigator re-applies its follow camera on
        // every location fix — which silently undoes any pan, pinch or rotate
        // the driver makes. This delegate reports that they have taken the
        // camera over so the navigator can let go of it; the re-centre button
        // hands it back. It observes gestures rather than handling them, so the
        // map's own default pan/zoom behaviour is untouched.
        mapView.gestures.mapInteractionDelegate = self
    }

    /// Picks the embedded (carto) POI under a screen point. HERE returns these
    /// as a lightweight `PickedPlace`; JS can hand the name/category back to the
    /// search engine for full details.
    fileprivate func pickPlace(at origin: Point2D, completion: @escaping (PickedPlace?) -> Void) {
        // A 1px hit test almost never lands on the POI icon itself, so probe a
        // small box around the finger.
        let size = HereMapView.poiPickBoxPx
        let area = Rectangle2D(
            origin: Point2D(x: origin.x - size / 2, y: origin.y - size / 2),
            size: Size2D(width: size, height: size)
        )
        let filter = MapScene.MapPickFilter(filter: [.mapContent])
        mapView.pick(filter: filter, inside: area) { result in
            completion(result?.mapContent?.pickedPlaces.first)
        }
    }

    fileprivate func geoCoordinates(at origin: Point2D) -> GeoCoordinates? {
        mapView.viewToGeoCoordinates(viewCoordinates: origin)
    }

    /// Runs `block` immediately if the map scene has finished loading, otherwise
    /// queues it to run (in order) once `loadScene` completes.
    private func whenSceneReady(_ block: @escaping () -> Void) {
        if isSceneLoaded {
            block()
        } else {
            pendingSceneOps.append(block)
        }
    }

    // MARK: - Camera

    func moveCamera(lat: Double, lng: Double, zoom: Double? = nil, distanceMeters: Double? = nil,
                    bearing: Double = 0, tilt: Double = 0,
                    animate: Bool = false, animationDurationMs: Double = 800) {
        whenSceneReady { [weak self] in
            guard let self = self else { return }
            // A zoom level frames the route the way the JS camera-fit expects;
            // a distance is the legacy fallback for callers that don't send zoom.
            let measure: MapMeasure
            if let zoom = zoom {
                measure = MapMeasure(kind: .zoomLevel, value: zoom)
            } else {
                measure = MapMeasure(kind: .distanceInMeters, value: distanceMeters ?? 1000)
            }
            // Honor the orientation JS sends so the compass reset (bearing 0) and
            // any heading-up framing actually rotate the map (parity with Android).
            let orientation = GeoOrientationUpdate(bearing: bearing, tilt: tilt)
            if animate && animationDurationMs > 0 {
                let target = GeoCoordinatesUpdate(latitude: lat, longitude: lng)
                let animation = MapCameraAnimationFactory.flyTo(
                    target: target,
                    orientation: orientation,
                    zoom: measure,
                    bowFactor: 0.0,
                    duration: animationDurationMs / 1000.0
                )
                self.mapView.camera.startAnimation(animation)
            } else {
                self.mapView.camera.lookAt(
                    point: GeoCoordinates(latitude: lat, longitude: lng),
                    orientation: orientation,
                    zoom: measure
                )
            }
        }
    }

    /// Returns the live camera orientation/position so JS can drive the compass
    /// button (show it when the map is rotated, rotate the needle to match).
    func cameraState() -> [String: Double] {
        let state = mapView.camera.state
        return [
            "lat": state.targetCoordinates.latitude,
            "lng": state.targetCoordinates.longitude,
            "bearing": state.orientationAtTarget.bearing,
            "tilt": state.orientationAtTarget.tilt,
            "distanceMeters": state.distanceToTargetInMeters,
        ]
    }

    /// Animates the map back to a north-up (bearing 0, tilt 0) orientation while
    /// keeping the current target and zoom — the compass reset-to-north action.
    func resetNorth() {
        whenSceneReady { [weak self] in
            guard let self = self else { return }
            let state = self.mapView.camera.state
            let target = GeoCoordinatesUpdate(
                latitude: state.targetCoordinates.latitude,
                longitude: state.targetCoordinates.longitude
            )
            let measure = MapMeasure(kind: .distanceInMeters, value: state.distanceToTargetInMeters)
            let orientation = GeoOrientationUpdate(bearing: 0.0, tilt: 0.0)
            let animation = MapCameraAnimationFactory.flyTo(
                target: target,
                orientation: orientation,
                zoom: measure,
                bowFactor: 0.0,
                duration: 0.4
            )
            self.mapView.camera.startAnimation(animation)
        }
    }

    /// Smoothly follows the truck during navigation: the camera is centered on
    /// `lat/lng` and rotated to `bearing`, so the billboarded marker always
    /// faces the moving direction. Speed drives the zoom/tilt, bearing & zoom
    /// are smoothed, and the move is animated (flyTo) unless `forceInstant`.
    /// Port of Android's NavigationCameraManager.update (CENTER mode).
    func updateNavigationCamera(lat: Double, lng: Double, bearing: Double,
                                speedMps: Double? = nil,
                                animationDurationMs: Double = 220,
                                forceInstant: Bool = false) {
        guard lat.isFinite, lng.isFinite else { return }

        let now = CACurrentMediaTime()
        if !forceInstant && (now - navCamLastUpdate) < Self.navCamMinUpdateInterval { return }

        let safeSpeed = min(max(speedMps ?? 0, 0), Self.navCamMaxSpeedMps)

        let targetBearing = normalizeNavBearing(bearing)
        let smoothedBearing: Double = (navCamHasState && !forceInstant)
            ? interpolateNavBearing(navCamLastBearing, targetBearing, Self.navCamBearingSmoothing)
            : targetBearing

        let desiredZoom = zoomForSpeed(safeSpeed)
        let desiredTilt = tiltForSpeed(safeSpeed)
        let zoom: Double = (navCamHasState && !forceInstant)
            ? navCamLastZoom + (desiredZoom - navCamLastZoom) * Self.navCamZoomSmoothing
            : desiredZoom

        let measure = MapMeasure(kind: .zoomLevel, value: zoom)
        let orientation = GeoOrientationUpdate(bearing: smoothedBearing, tilt: desiredTilt)

        if forceInstant || animationDurationMs <= 0 {
            mapView.camera.lookAt(
                point: GeoCoordinates(latitude: lat, longitude: lng),
                orientation: orientation,
                zoom: measure
            )
        } else {
            let target = GeoCoordinatesUpdate(latitude: lat, longitude: lng)
            let animation = MapCameraAnimationFactory.flyTo(
                target: target,
                orientation: orientation,
                zoom: measure,
                bowFactor: 0.0,
                duration: animationDurationMs / 1000.0
            )
            mapView.camera.startAnimation(animation)
        }

        navCamLastUpdate = now
        navCamLastBearing = smoothedBearing
        navCamLastZoom = zoom
        navCamHasState = true
    }

    func resetNavigationCamera() {
        isNavigating = false
        // Drop the follow-camera smoothing state so the next navigation start
        // snaps cleanly to the first heading instead of easing from a stale one.
        navCamHasState = false
        navCamLastUpdate = 0
        navCamLastBearing = 0
        navCamLastZoom = 16.6
        // Zoom back out to a north-up overview.
        if let navMarker = navigationMarker {
            let distance = MapMeasure(kind: .distanceInMeters, value: 5000)
            let northUp = GeoOrientationUpdate(bearing: 0.0, tilt: 0.0)
            mapView.camera.lookAt(point: navMarker.coordinates, orientation: northUp, zoom: distance)
        }
    }

    // ── Navigation camera helpers (ported from Android NavigationCameraManager) ──

    /// Wraps a bearing into [0, 360) and suppresses sub-threshold jitter so the
    /// camera (and therefore the direction the marker faces) doesn't wobble when
    /// the truck is essentially going straight.
    private func normalizeNavBearing(_ value: Double) -> Double {
        var out = value.truncatingRemainder(dividingBy: 360.0)
        if out < 0 { out += 360.0 }
        if navCamHasState && abs(out - navCamLastBearing) < Self.navCamMinBearingDelta {
            return navCamLastBearing
        }
        return out
    }

    /// Shortest-arc interpolation between two bearings (handles the 359°→0° wrap).
    private func interpolateNavBearing(_ from: Double, _ to: Double, _ t: Double) -> Double {
        var diff = to - from
        if diff > 180 { diff -= 360 }
        if diff < -180 { diff += 360 }
        var result = (from + diff * t).truncatingRemainder(dividingBy: 360.0)
        if result < 0 { result += 360.0 }
        return result
    }

    private func zoomForSpeed(_ speedMps: Double) -> Double {
        switch speedMps {
        case ..<2.0:  return 17.2
        case ..<6.0:  return 16.8
        case ..<12.0: return 16.3
        case ..<20.0: return 15.8
        default:      return 15.2
        }
    }

    private func tiltForSpeed(_ speedMps: Double) -> Double {
        switch speedMps {
        case ..<2.0: return 46.0
        case ..<8.0: return 52.0
        default:     return 58.0
        }
    }

    // MARK: - Navigation State

    func startNavigation() {
        isNavigating = true
        print("[HereMapView] Navigation started")
    }

    func stopNavigation() {
        isNavigating = false
        removeNavigationMarker()
        resetNavigationCamera()
        print("[HereMapView] Navigation stopped")
    }

    // MARK: - Polyline

    func drawRoutePolyline(coords: [[Double]],
                           color: UIColor? = nil,
                           widthPixels: Double = 10.0) {
        whenSceneReady { [weak self] in
            guard let self = self else { return }
            self.clearPolylinesRaw()
            self.currentPolylineCoords = coords

            let geoCoords = coords.compactMap { pair -> GeoCoordinates? in
                guard pair.count >= 2 else { return nil }
                return GeoCoordinates(latitude: pair[0], longitude: pair[1])
            }

            guard geoCoords.count >= 2,
                  let geoPolyline = try? GeoPolyline(vertices: geoCoords) else {
                print("[HereMapView] drawRoutePolyline: invalid coords (count=\(geoCoords.count))")
                return
            }

            let lineColor = color ?? UIColor(red: 0.25, green: 0.47, blue: 1.0, alpha: 1.0)
            let mapPolyline: MapPolyline
            do {
                let lineWidth = try MapMeasureDependentRenderSize(
                    sizeUnit: RenderSize.Unit.pixels,
                    size: widthPixels
                )
                let representation = try MapPolyline.SolidRepresentation(
                    lineWidth: lineWidth,
                    color: lineColor,
                    capShape: LineCap.round
                )
                mapPolyline = try MapPolyline(
                    geometry: geoPolyline,
                    representation: representation
                )
            } catch {
                print("[HereMapView] drawRoutePolyline: failed to build polyline — \(error)")
                return
            }
            self.mapView.mapScene.addMapPolyline(mapPolyline)
            self.allMapPolylines.append(mapPolyline)
            self.routePolylineObject = mapPolyline
            // Capture the full route for the navigation passed-overlay and reset
            // any in-progress trim (the route just changed / was redrawn).
            self.navRouteCoords = geoCoords
            self.resetPassedPath()
            self.fitCameraToPolyline(coords: geoCoords)
        }
    }

    /// Called during navigation progress. Previously this cleared and redrew the
    /// whole polyline AND refit the camera every frame — which stuttered and
    /// fought the navigation camera. Now the trim is purely visual and driven by
    /// the marker animation (`syncPassedPolyline`); here we only advance the
    /// segment floor so progress never moves backwards on GPS jitter.
    func trimPolyline(upToIndex: Int) {
        guard upToIndex >= 0 else { return }
        if upToIndex > navSegmentIndex { navSegmentIndex = upToIndex }
    }

    func clearPolylines() {
        whenSceneReady { [weak self] in self?.clearPolylinesRaw() }
    }

    /// Synchronous polyline removal — safe only once the scene is loaded.
    /// Used internally by `drawRoutePolyline` (already inside a scene-ready block).
    private func clearPolylinesRaw() {
        for p in allMapPolylines { mapView.mapScene.removeMapPolyline(p) }
        allMapPolylines.removeAll()
        routePolylineObject = nil
        currentPolylineCoords = []
        // The navigation passed-overlay is tracked separately from
        // allMapPolylines — tear it down here too so it never lingers.
        navRouteCoords = []
        resetPassedPath()
    }

    private func fitCameraToPolyline(coords: [GeoCoordinates]) {
        guard !coords.isEmpty else { return }
        var minLat = coords[0].latitude,  maxLat = coords[0].latitude
        var minLng = coords[0].longitude, maxLng = coords[0].longitude
        for c in coords {
            minLat = min(minLat, c.latitude);  maxLat = max(maxLat, c.latitude)
            minLng = min(minLng, c.longitude); maxLng = max(maxLng, c.longitude)
        }
        let sw = GeoCoordinates(latitude: minLat, longitude: minLng)
        let ne = GeoCoordinates(latitude: maxLat, longitude: maxLng)
        let box = GeoBox(southWestCorner: sw, northEastCorner: ne)
        let origin  = Point2D(x: Double(bounds.width * 0.1), y: Double(bounds.height * 0.15))
        let size    = Size2D(width: Double(bounds.width * 0.8), height: Double(bounds.height * 0.7))
        let viewRect = Rectangle2D(origin: origin, size: size)
        let orientation = GeoOrientationUpdate(bearing: 0.0, tilt: 0.0)
        mapView.camera.lookAt(area: box, orientation: orientation, viewRectangle: viewRect)
    }

    // MARK: - Markers

    func setSourceMarker(lat: Double, lng: Double) {
        whenSceneReady { [weak self] in
            guard let self = self else { return }
            self.replaceMarker(&self.sourceMarker,
                          with: self.makeMarker(lat: lat, lng: lng,
                                           color: UIColor(red: 0.13, green: 0.77, blue: 0.37, alpha: 1),
                                           label: "A"))
        }
    }

    func setDestinationMarker(lat: Double, lng: Double) {
        whenSceneReady { [weak self] in
            guard let self = self else { return }
            self.replaceMarker(&self.destinationMarker,
                          with: self.makeMarker(lat: lat, lng: lng,
                                           color: UIColor(red: 0.93, green: 0.26, blue: 0.26, alpha: 1),
                                           label: "B"))
        }
    }

    func addGenericMarker(lat: Double, lng: Double) {
        whenSceneReady { [weak self] in
            guard let self = self else { return }
            let marker = self.makeMarker(lat: lat, lng: lng,
                                    color: UIColor(red: 0.6, green: 0.2, blue: 0.9, alpha: 1),
                                    label: "•")
            self.mapView.mapScene.addMapMarker(marker)
            self.genericMarkers.append(marker)
        }
    }

    /// Generic colored pin — used by the JS `addMarker({ lat, lng, color })` bridge.
    func addColoredMarker(lat: Double, lng: Double, color: UIColor, label: String = "•") {
        whenSceneReady { [weak self] in
            guard let self = self else { return }
            let marker = self.makeMarker(lat: lat, lng: lng, color: color, label: label)
            self.mapView.mapScene.addMapMarker(marker)
            self.genericMarkers.append(marker)
        }
    }

    /// Image pin from JS-supplied PNG bytes (the rasterised SVG marker). The
    /// teardrop is anchored at its bottom-centre tip so it points at the coord.
    func addImageMarker(lat: Double, lng: Double, pngData: Data, sizePx: CGFloat? = nil) {
        whenSceneReady { [weak self] in
            guard let self = self else { return }
            let target = sizePx ?? HereMapView.markerImageSizePx
            let mapImage = MapImage(pixelData: self.scaledMarkerPng(pngData, maxDimension: target), imageFormat: ImageFormat.png)
            let anchor   = Anchor2D(horizontal: 0.5, vertical: 1.0)
            let marker   = MapMarker(
                at: GeoCoordinates(latitude: lat, longitude: lng),
                image: mapImage,
                anchor: anchor
            )
            self.mapView.mapScene.addMapMarker(marker)
            self.genericMarkers.append(marker)
        }
    }

    func clearMarkers() {
        whenSceneReady { [weak self] in
            guard let self = self else { return }
            [self.sourceMarker, self.destinationMarker].compactMap { $0 }.forEach {
                self.mapView.mapScene.removeMapMarker($0)
            }
            self.sourceMarker      = nil
            self.destinationMarker = nil
            self.genericMarkers.forEach { self.mapView.mapScene.removeMapMarker($0) }
            self.genericMarkers.removeAll()
        }
    }

    // MARK: - Location Dot

    func showCurrentLocation(lat: Double, lng: Double, bearing: Double = 0) {
        whenSceneReady { [weak self] in
            guard let self = self else { return }
            let heading = bearing.isFinite ? bearing : 0
            // Use HERE's built-in NAVIGATION LocationIndicator (same as Android)
            // so the current-location marker is identical across platforms.
            if self.locationIndicator == nil {
                let indicator = LocationIndicator()
                indicator.locationIndicatorStyle = .navigation
                indicator.enable(for: self.mapView)
                self.locationIndicator = indicator
            } else {
                self.locationIndicator?.locationIndicatorStyle = .navigation
            }
            let location = Location(
                coordinates: GeoCoordinates(latitude: lat, longitude: lng),
                bearingInDegrees: heading
            )
            self.locationIndicator?.updateLocation(location)
        }
    }

    func hideCurrentLocation() {
        locationIndicator?.disable()
        locationIndicator = nil
        // Legacy custom-dot cleanup (kept for safety in case an old path added one).
        if let loc = locationMarker {
            mapView.mapScene.removeMapMarker(loc)
            locationMarker = nil
        }
        locationBearing = -999
    }

    // MARK: - Navigation Marker (live GPS)

    func updateNavigationMarker(lat: Double, lng: Double, bearing: Double,
                                iconPngData: Data? = nil, sizePx: CGFloat? = nil,
                                segmentIndex: Int = -1, animationDurationMs: Double = 180) {
        // Detect whether the JS-supplied icon (or its on-screen size) changed
        // since the last call. The first GPS updates can arrive before the JS
        // marker rasteriser has produced the vehicle PNG, so the icon shows up
        // only on a later call. When it does we must REBUILD the marker image,
        // not just move it — otherwise it stays stuck on the fallback arrow it
        // was first created with (matches Android's icon-swap in
        // NavigationMarkerManager).
        var iconChanged = false
        if let data = iconPngData, data != navigationIconData {
            navigationIconData = data
            iconChanged = true
        }
        if let sizePx = sizePx, sizePx != navigationIconSize {
            navigationIconSize = sizePx
            iconChanged = true
        }

        if segmentIndex >= 0 { navSegmentIndex = max(navSegmentIndex, segmentIndex) }
        let target = GeoCoordinates(latitude: lat, longitude: lng)

        // First placement, or the icon just changed → (re)create the marker and
        // snap to the target instantly (no animation for this frame).
        if navigationMarker == nil || iconChanged {
            stopNavDisplayLink()
            if let existing = navigationMarker { mapView.mapScene.removeMapMarker(existing) }
            let marker = makeNavigationMarker(lat: lat, lng: lng)
            mapView.mapScene.addMapMarker(marker)
            navigationMarker = marker
            navCurrentCoord = target
            syncPassedPolyline(split: target)
            return
        }

        // Steady state → animate the truck from where it is now to the new GPS
        // point over `animationDurationMs`, driving the passed-polyline trim each
        // frame (Google-Maps-style smooth follow). The camera is followed
        // separately via updateNavigationCamera so we don't fight it here.
        navAnimFrom = navCurrentCoord
        navAnimTo = target
        navAnimStart = CACurrentMediaTime()
        navAnimDuration = max(0.05, animationDurationMs / 1000.0)
        startNavDisplayLink()
    }

    func removeNavigationMarker() {
        stopNavDisplayLink()
        if let marker = navigationMarker {
            mapView.mapScene.removeMapMarker(marker)
            navigationMarker = nil
        }
        resetPassedPath()
        navSegmentIndex = -1
    }

    // MARK: - Navigation smooth-follow internals

    private func startNavDisplayLink() {
        if navDisplayLink != nil { return }
        let link = CADisplayLink(target: self, selector: #selector(navTick))
        link.add(to: .main, forMode: .common)
        navDisplayLink = link
    }

    private func stopNavDisplayLink() {
        navDisplayLink?.invalidate()
        navDisplayLink = nil
    }

    @objc private func navTick() {
        let now = CACurrentMediaTime()
        let t = min(1.0, max(0.0, (now - navAnimStart) / navAnimDuration))
        let lat = navAnimFrom.latitude  + (navAnimTo.latitude  - navAnimFrom.latitude)  * t
        let lng = navAnimFrom.longitude + (navAnimTo.longitude - navAnimFrom.longitude) * t
        let coord = GeoCoordinates(latitude: lat, longitude: lng)
        navCurrentCoord = coord
        navigationMarker?.coordinates = coord
        syncPassedPolyline(split: coord)
        if t >= 1.0 { stopNavDisplayLink() }
    }

    /// Grows the grey "passed" overlay so it ends exactly at the marker's current
    /// (animated) position. 1:1 port of Android PolylineManager.updatePassedPath
    /// + swapPassedPolyline. Skips redundant rebuilds while the split barely moves
    /// (jitter guard) to keep the per-frame cost down on long routes.
    private func syncPassedPolyline(split: GeoCoordinates) {
        guard navRouteCoords.count >= 2, navSegmentIndex >= 0 else { return }

        // Jitter guard: only rebuild when the split moved enough or a segment was crossed.
        if let last = navLastRenderedSplit,
           navPassedLastRouteIndex >= navSegmentIndex,
           Self.approxMeters(last, split) < 0.5 {
            return
        }

        let idx = min(max(navSegmentIndex, 0), navRouteCoords.count - 2)

        if navPassedPath.isEmpty {
            navPassedPath.append(navRouteCoords[0])
            navPassedLastRouteIndex = 0
        }
        if idx > navPassedLastRouteIndex {
            for i in (navPassedLastRouteIndex + 1)...idx {
                navPassedPath.append(navRouteCoords[i])
            }
            navPassedLastRouteIndex = idx
        }
        if navPassedPath.count == 1 {
            navPassedPath.append(split)
        } else {
            navPassedPath[navPassedPath.count - 1] = split
        }
        guard navPassedPath.count >= 2 else { return }

        swapPassedPolyline(navPassedPath)
        navLastRenderedSplit = split
    }

    private func swapPassedPolyline(_ coords: [GeoCoordinates]) {
        guard coords.count >= 2, let geoPolyline = try? GeoPolyline(vertices: coords) else { return }
        let passedWidth = 16.0 + 6.0   // route width + Android's PASSED_WIDTH_EXTRA
        let grey = UIColor(red: 0.91, green: 0.91, blue: 0.93, alpha: 1.0)
        do {
            let lineWidth = try MapMeasureDependentRenderSize(sizeUnit: RenderSize.Unit.pixels, size: passedWidth)
            let representation = try MapPolyline.SolidRepresentation(
                lineWidth: lineWidth, color: grey, capShape: LineCap.round
            )
            let polyline = try MapPolyline(geometry: geoPolyline, representation: representation)
            if let old = navPassedPolyline { mapView.mapScene.removeMapPolyline(old) }
            mapView.mapScene.addMapPolyline(polyline)
            navPassedPolyline = polyline
        } catch {
            // ignore a single failed frame
        }
    }

    private func resetPassedPath() {
        if let old = navPassedPolyline { mapView.mapScene.removeMapPolyline(old) }
        navPassedPolyline = nil
        navPassedPath.removeAll()
        navPassedLastRouteIndex = -1
        navLastRenderedSplit = nil
    }

    /// Cheap great-circle distance (metres) for the jitter guard.
    private static func approxMeters(_ a: GeoCoordinates, _ b: GeoCoordinates) -> Double {
        let dLat = (b.latitude - a.latitude) * 111_320.0
        let dLng = (b.longitude - a.longitude) * 111_320.0 * cos(a.latitude * .pi / 180.0)
        return (dLat * dLat + dLng * dLng).squareRoot()
    }

    // MARK: - Clear All

    func clearAll() {
        clearPolylines()
        clearMarkers()
        removeNavigationMarker()
        hideCurrentLocation()
    }

    // MARK: - Marker Helpers

    /// Resizes a JS-supplied PNG so the marker renders at a fixed on-screen size,
    /// preserving aspect ratio and giving the native side full control over size.
    ///
    /// [maxDimension] is the size JS sends (the same value Android uses). This is a
    /// 1:1 port of Android's `HereMapView.scaleToMarkerSize`: the longest side is
    /// scaled to exactly `maxDimension` PIXELS — NO `UIScreen.scale` division. HERE
    /// renders `MapImage(pixelData:)` at the same 1px-on-screen ratio on both
    /// platforms, so handing iOS the identical target pixel size makes the marker
    /// the same on-screen size as Android on every device density.
    private func scaledMarkerPng(
        _ data: Data,
        maxDimension: CGFloat = HereMapView.markerImageSizePx
    ) -> Data {
        guard let image = UIImage(data: data), let cg = image.cgImage else { return data }
        let w = CGFloat(cg.width)
        let h = CGFloat(cg.height)
        let maxDim = max(w, h)
        guard maxDim > 0, maxDim != maxDimension else { return data }
        let factor = maxDimension / maxDim             // scale to exactly target px (like Android)
        let newSize = CGSize(width: max(1, w * factor), height: max(1, h * factor))
        // scale 1.0 → output PNG pixel size equals the point size we draw into,
        // so the rendered PNG is exactly `newSize` pixels.
        UIGraphicsBeginImageContextWithOptions(newSize, false, 1.0)
        image.draw(in: CGRect(origin: .zero, size: newSize))
        let resized = UIGraphicsGetImageFromCurrentImageContext()
        UIGraphicsEndImageContext()
        return resized?.pngData() ?? data
    }

    private func replaceMarker(_ slot: inout MapMarker?, with newMarker: MapMarker) {
        if let old = slot { mapView.mapScene.removeMapMarker(old) }
        mapView.mapScene.addMapMarker(newMarker)
        slot = newMarker
    }

    private func makeMarker(lat: Double, lng: Double, color: UIColor, label: String) -> MapMarker {
        let image    = drawPinImage(color: color, label: label)
        let mapImage = MapImage(pixelData: image.pngData()!, imageFormat: ImageFormat.png)
        let anchor   = Anchor2D(horizontal: 0.5, vertical: 1.0) // pin tip at bottom-centre
        return MapMarker(
            at: GeoCoordinates(latitude: lat, longitude: lng),
            image: mapImage,
            anchor: anchor
        )
    }

    private func makeNavigationMarker(lat: Double, lng: Double) -> MapMarker {
        // Prefer the JS-supplied icon (teardrop pin, bottom-anchored); otherwise
        // fall back to the drawn directional arrow (centre-anchored).
        let mapImage: MapImage
        let anchor: Anchor2D
        if let data = navigationIconData {
            let target = navigationIconSize ?? HereMapView.markerImageSizePx
            mapImage = MapImage(pixelData: scaledMarkerPng(data, maxDimension: target), imageFormat: ImageFormat.png)
            anchor   = Anchor2D(horizontal: 0.5, vertical: 1.0)
        } else {
            let image = drawNavArrowImage()
            mapImage = MapImage(pixelData: image.pngData()!, imageFormat: ImageFormat.png)
            anchor   = Anchor2D(horizontal: 0.5, vertical: 0.5)
        }
        return MapMarker(
            at: GeoCoordinates(latitude: lat, longitude: lng),
            image: mapImage,
            anchor: anchor
        )
    }

    // Draws a teardrop pin with a single letter label — no asset files needed
    private func drawPinImage(color: UIColor, label: String) -> UIImage {
        let size = CGSize(width: 36, height: 48)
        UIGraphicsBeginImageContextWithOptions(size, false, 0)
        defer { UIGraphicsEndImageContext() }
        let ctx = UIGraphicsGetCurrentContext()!
        ctx.setShadow(offset: CGSize(width: 0, height: 2), blur: 4,
                      color: UIColor.black.withAlphaComponent(0.4).cgColor)
        let cx: CGFloat = 18, cy: CGFloat = 18, r: CGFloat = 16
        let pinPath = UIBezierPath()
        pinPath.addArc(withCenter: CGPoint(x: cx, y: cy), radius: r,
                       startAngle: 0, endAngle: .pi, clockwise: false)
        pinPath.addArc(withCenter: CGPoint(x: cx, y: cy), radius: r,
                       startAngle: .pi, endAngle: 2 * .pi, clockwise: false)
        pinPath.addLine(to: CGPoint(x: cx, y: size.height - 4))
        pinPath.close()
        color.setFill()
        pinPath.fill()
        ctx.setShadow(offset: .zero, blur: 0, color: nil)
        let attrs: [NSAttributedString.Key: Any] = [
            .font: UIFont.boldSystemFont(ofSize: 14),
            .foregroundColor: UIColor.white
        ]
        let str = NSString(string: label)
        let strSize = str.size(withAttributes: attrs)
        str.draw(at: CGPoint(x: cx - strSize.width / 2, y: cy - strSize.height / 2),
                 withAttributes: attrs)
        return UIGraphicsGetImageFromCurrentImageContext()!
    }

    // Draws an arrow/truck circle for the live position
    private func drawNavArrowImage() -> UIImage {
        let size = CGSize(width: 40, height: 40)
        UIGraphicsBeginImageContextWithOptions(size, false, 0)
        defer { UIGraphicsEndImageContext() }
        let ctx = UIGraphicsGetCurrentContext()!
        ctx.setShadow(offset: CGSize(width: 0, height: 2), blur: 4,
                      color: UIColor.black.withAlphaComponent(0.5).cgColor)
        UIBezierPath(ovalIn: CGRect(x: 2, y: 2, width: 36, height: 36)).do {
            UIColor(red: 0.25, green: 0.47, blue: 1.0, alpha: 1.0).setFill()
            $0.fill()
        }
        ctx.setShadow(offset: .zero, blur: 0, color: nil)
        let arrow = UIBezierPath()
        arrow.move(to:    CGPoint(x: 20, y: 8))
        arrow.addLine(to: CGPoint(x: 28, y: 28))
        arrow.addLine(to: CGPoint(x: 20, y: 23))
        arrow.addLine(to: CGPoint(x: 12, y: 28))
        arrow.close()
        UIColor.white.setFill()
        arrow.fill()
        return UIGraphicsGetImageFromCurrentImageContext()!
    }

    // Draws a blue "current location" dot with a white ring plus a direction
    // beam fanning out toward `bearing` (0 = up/north, clockwise) — the
    // Google-Maps-style "which way you're facing" indicator.
    private func drawLocationDotImage(bearing: Double = 0) -> UIImage {
        let size = CGSize(width: 48, height: 48)
        UIGraphicsBeginImageContextWithOptions(size, false, 0)
        defer { UIGraphicsEndImageContext() }
        let ctx = UIGraphicsGetCurrentContext()!
        let center = CGPoint(x: size.width / 2, y: size.height / 2)

        // ── Direction beam (rotated to the heading) ──────────────────────────
        ctx.saveGState()
        ctx.translateBy(x: center.x, y: center.y)
        ctx.rotate(by: CGFloat(bearing) * .pi / 180.0)
        ctx.translateBy(x: -center.x, y: -center.y)
        let beam = UIBezierPath()
        beam.move(to: center)
        // A ~50° wedge opening upward (north before rotation).
        beam.addArc(withCenter: center, radius: 22,
                    startAngle: -(.pi / 2) - 0.44,
                    endAngle: -(.pi / 2) + 0.44,
                    clockwise: true)
        beam.close()
        UIColor(red: 0.10, green: 0.46, blue: 0.94, alpha: 0.30).setFill()
        beam.fill()
        ctx.restoreGState()

        // ── White ring + blue dot (heading-independent, drawn on top) ────────
        ctx.setShadow(offset: CGSize(width: 0, height: 1), blur: 3,
                      color: UIColor.black.withAlphaComponent(0.4).cgColor)
        UIBezierPath(ovalIn: CGRect(x: center.x - 9, y: center.y - 9, width: 18, height: 18)).do {
            UIColor.white.setFill()
            $0.fill()
        }
        ctx.setShadow(offset: .zero, blur: 0, color: nil)
        UIBezierPath(ovalIn: CGRect(x: center.x - 6, y: center.y - 6, width: 12, height: 12)).do {
            UIColor(red: 0.10, green: 0.46, blue: 0.94, alpha: 1.0).setFill()
            $0.fill()
        }
        return UIGraphicsGetImageFromCurrentImageContext()!
    }

#endif
}

// MARK: - UIColor hex parsing (for colors passed from JS as "#RRGGBB")
extension UIColor {
    convenience init?(hexString: String) {
        var hex = hexString.trimmingCharacters(in: .whitespacesAndNewlines)
        if hex.hasPrefix("#") { hex.removeFirst() }
        guard hex.count == 6 || hex.count == 8,
              let value = UInt64(hex, radix: 16) else { return nil }
        let r, g, b, a: CGFloat
        if hex.count == 8 {
            r = CGFloat((value >> 24) & 0xFF) / 255.0
            g = CGFloat((value >> 16) & 0xFF) / 255.0
            b = CGFloat((value >> 8)  & 0xFF) / 255.0
            a = CGFloat(value & 0xFF) / 255.0
        } else {
            r = CGFloat((value >> 16) & 0xFF) / 255.0
            g = CGFloat((value >> 8)  & 0xFF) / 255.0
            b = CGFloat(value & 0xFF) / 255.0
            a = 1.0
        }
        self.init(red: r, green: g, blue: b, alpha: a)
    }
}

// MARK: - UIBezierPath convenience (avoids `let _ =` noise)
private extension UIBezierPath {
    @discardableResult
    func `do`(_ block: (UIBezierPath) -> Void) -> UIBezierPath {
        block(self)
        return self
    }
}
// MARK: - Gesture delegates
//
// Emits onMapTap / onMapLongPress, and additionally onPoiTap when the tap lands
// on one of HERE's embedded map POIs.

#if canImport(heresdk)

extension HereMapView: TapDelegate {
    func onTap(origin: Point2D) {
        if let coords = geoCoordinates(at: origin) {
            onMapTap?([
                "latitude": coords.latitude,
                "longitude": coords.longitude,
                "x": origin.x,
                "y": origin.y
            ])
        }

        guard onPoiTap != nil else { return }
        pickPlace(at: origin) { [weak self] picked in
            guard let self = self, let picked = picked else { return }
            self.onPoiTap?([
                "name": picked.name,
                "categoryId": picked.placeCategoryId,
                "latitude": picked.coordinates.latitude,
                "longitude": picked.coordinates.longitude,
                "x": origin.x,
                "y": origin.y
            ])
        }
    }
}

extension HereMapView: LongPressDelegate {
    func onLongPress(state: GestureState, origin: Point2D) {
        guard state == .begin, let coords = geoCoordinates(at: origin) else { return }
        onMapLongPress?([
            "latitude": coords.latitude,
            "longitude": coords.longitude,
            "x": origin.x,
            "y": origin.y
        ])
    }
}

extension HereMapView: MapInteractionDelegate {
    func onMapInteraction(gestureType: GestureType, mapInteractionState: MapInteractionState) {
        guard mapInteractionState == .begin else { return }
        switch gestureType {
        case .pan, .pinchRotate, .twoFingerPan, .doubleTap:
            HereNavigationModule.shared?.onUserTookCamera(self)
        default:
            break
        }
    }
}

#endif

/// Weak box for the active-map registry: the registry must never be the reason
/// a dropped map view stays alive.
final class WeakMapViewRef {
    weak var value: HereMapView?
    init(_ value: HereMapView) { self.value = value }
}
