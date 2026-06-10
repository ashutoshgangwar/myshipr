import UIKit
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

    // Location dot (blue circle)
    private var locationMarker: MapMarker?

    // Navigation state
    private var isNavigating = false

    // Optional JS-provided PNG bytes for the live vehicle marker (rasterised
    // from the user-selected SVG icon). When nil we fall back to the drawn arrow.
    private var navigationIconData: Data?
    // On-screen size (px) JS requested for the navigation truck marker.
    private var navigationIconSize: CGFloat?

    // Scene-load gating: HERE's mapScene.loadScene is async. Any draw/marker/camera
    // call that arrives before the scene is ready (e.g. the route preview that fires
    // right after the screen mounts) must be queued and replayed once it loads,
    // otherwise the SDK silently drops it and nothing renders.
    private var isSceneLoaded = false
    private var pendingSceneOps: [() -> Void] = []

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

#if canImport(heresdk)

    // MARK: - Map Load

    private func loadMap() {
        mapView.mapScene.loadScene(mapScheme: .normalDay) { [weak self] error in
            guard let self = self else { return }
            guard error == nil else {
                print("[HereMapView] Map load error: \(String(describing: error))")
                return
            }
            let distance = MapMeasure(kind: .distanceInMeters, value: 5000)
            self.mapView.camera.lookAt(
                point: GeoCoordinates(latitude: 28.4595, longitude: 77.0266),
                zoom: distance
            )

            // Scene is ready — flush any operations queued while it was loading
            // (in FIFO order so a queued clear → draw stays consistent).
            self.isSceneLoaded = true
            let ops = self.pendingSceneOps
            self.pendingSceneOps.removeAll()
            ops.forEach { $0() }
        }
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

    func moveCamera(lat: Double, lng: Double, zoom: Double? = nil, distanceMeters: Double? = nil) {
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
            self.mapView.camera.lookAt(
                point: GeoCoordinates(latitude: lat, longitude: lng),
                zoom: measure
            )
        }
    }

    /// Tilt + head camera to follow the nav arrow during navigation
    func updateNavigationCamera(lat: Double, lng: Double, bearing: Double) {
        let coord = GeoCoordinates(latitude: lat, longitude: lng)
        // Smooth follow: keep tilt for navigation perspective
        let distance = MapMeasure(kind: .distanceInMeters, value: 300)
        let orientation = GeoOrientationUpdate(bearing: bearing, tilt: 45.0)
        mapView.camera.lookAt(
            point: coord,
            orientation: orientation,
            zoom: distance
        )
    }

    func resetNavigationCamera() {
        isNavigating = false
        // Zoom back out to overview
        if let navMarker = navigationMarker {
            let distance = MapMeasure(kind: .distanceInMeters, value: 5000)
            mapView.camera.lookAt(point: navMarker.coordinates, zoom: distance)
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
            self.fitCameraToPolyline(coords: geoCoords)
        }
    }

    /// Removes already-driven segments (called during navigation progress)
    func trimPolyline(upToIndex: Int) {
        guard upToIndex > 0, upToIndex < currentPolylineCoords.count else { return }
        let remaining = Array(currentPolylineCoords[upToIndex...])
        drawRoutePolyline(coords: remaining)
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

    func showCurrentLocation(lat: Double, lng: Double) {
        whenSceneReady { [weak self] in
            guard let self = self else { return }
            let coord = GeoCoordinates(latitude: lat, longitude: lng)
            if let existing = self.locationMarker {
                existing.coordinates = coord
                return
            }
            let image    = self.drawLocationDotImage()
            let mapImage = MapImage(pixelData: image.pngData()!, imageFormat: ImageFormat.png)
            let anchor   = Anchor2D(horizontal: 0.5, vertical: 0.5)
            let marker   = MapMarker(at: coord, image: mapImage, anchor: anchor)
            self.mapView.mapScene.addMapMarker(marker)
            self.locationMarker = marker
        }
    }

    func hideCurrentLocation() {
        if let loc = locationMarker {
            mapView.mapScene.removeMapMarker(loc)
            locationMarker = nil
        }
    }

    // MARK: - Navigation Marker (live GPS)

    func updateNavigationMarker(lat: Double, lng: Double, bearing: Double, iconPngData: Data? = nil, sizePx: CGFloat? = nil) {
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
        let coord = GeoCoordinates(latitude: lat, longitude: lng)
        if let existing = navigationMarker, !iconChanged {
            existing.coordinates = coord
            // Bearing rotation: if your HERE SDK version supports it via
            // MapMarker orientation, apply here. Otherwise re-draw the image.
        } else {
            // First placement, or the JS icon just arrived/changed → (re)create
            // the marker so the new image is actually rendered.
            if let existing = navigationMarker {
                mapView.mapScene.removeMapMarker(existing)
            }
            let marker = makeNavigationMarker(lat: lat, lng: lng)
            mapView.mapScene.addMapMarker(marker)
            navigationMarker = marker
        }
        // Follow the marker while navigating
        if isNavigating {
            let distance = MapMeasure(kind: .distanceInMeters, value: 300)
            mapView.camera.lookAt(point: coord, zoom: distance)
        }
    }

    func removeNavigationMarker() {
        if let marker = navigationMarker {
            mapView.mapScene.removeMapMarker(marker)
            navigationMarker = nil
        }
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

    // Draws a blue "current location" dot with a white ring (Google-Maps style)
    private func drawLocationDotImage() -> UIImage {
        let size = CGSize(width: 24, height: 24)
        UIGraphicsBeginImageContextWithOptions(size, false, 0)
        defer { UIGraphicsEndImageContext() }
        let ctx = UIGraphicsGetCurrentContext()!
        // white outer ring with soft shadow
        ctx.setShadow(offset: CGSize(width: 0, height: 1), blur: 3,
                      color: UIColor.black.withAlphaComponent(0.4).cgColor)
        UIBezierPath(ovalIn: CGRect(x: 2, y: 2, width: 20, height: 20)).do {
            UIColor.white.setFill()
            $0.fill()
        }
        ctx.setShadow(offset: .zero, blur: 0, color: nil)
        // blue inner dot
        UIBezierPath(ovalIn: CGRect(x: 5, y: 5, width: 14, height: 14)).do {
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