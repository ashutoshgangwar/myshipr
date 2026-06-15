import Foundation
import React
import UIKit

#if canImport(heresdk)
import heresdk
#endif

typealias RCTPromiseResolveBlock = (Any?) -> Void
typealias RCTPromiseRejectBlock  = (String?, String?, Error?) -> Void

@objc(HereMapModule)
class HereMapModule: NSObject {

    private var sdkInitialized = false

    // MARK: - SDK Init

    @objc(initSDK:secret:resolver:rejecter:)
    func initSDK(
        _ accessKeyId: String,
        secret accessKeySecret: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
#if canImport(heresdk)
        if sdkInitialized {
            resolve(true)
            return
        }
        let authMode = AuthenticationMode.withKeySecret(
          
            accessKeyId: accessKeyId,
            accessKeySecret: accessKeySecret
        )
        let options = SDKOptions(authenticationMode: authMode)
        do {
            try SDKNativeEngine.makeSharedInstance(options: options)
            sdkInitialized = true
            print("✅ HERE SDK Initialized")
            resolve(true)
        } catch {
            reject("INIT_ERROR", "Failed to initialize HERE SDK", error)
        }
#else
        reject("SDK_MISSING", "HERE SDK not embedded in Xcode project.", nil)
#endif
    }

    // MARK: - Map Camera

    /// moveCamera({ lat, lng, distanceMeters? | zoom? })
    @objc(moveCamera:options:resolver:rejecter:)
    func moveCamera(
        _ viewTag: NSNumber,
        options: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard
            let lat = Self.double(options["lat"] ?? options["latitude"]),
            let lng = Self.double(options["lng"] ?? options["longitude"])
        else {
            reject("BAD_ARGS", "moveCamera requires lat and lng", nil)
            return
        }
        // Honor `zoom` (a zoom level) when provided — the JS camera-fit helper
        // sends a computed zoom so the whole source→destination route frames
        // in view. Fall back to `distanceMeters` only when no zoom is given.
        let zoom = Self.double(options["zoom"])
        let distance = Self.double(options["distanceMeters"])
        // bearing/tilt let JS rotate the map (e.g. the compass reset-to-north
        // sends bearing 0); animate + animationDuration ease the move.
        let bearing = Self.double(options["bearing"]) ?? 0.0
        let tilt = Self.double(options["tilt"]) ?? 0.0
        let animate = (options["animate"] as? NSNumber)?.boolValue ?? false
        let animationMs = Self.double(options["animationDuration"]) ?? 800.0
        DispatchQueue.main.async {
            self.findHereMapView()?.moveCamera(
                lat: lat, lng: lng, zoom: zoom, distanceMeters: distance,
                bearing: bearing, tilt: tilt, animate: animate, animationDurationMs: animationMs
            )
            resolve(nil)
        }
    }

    /// getCameraState — returns { lat, lng, bearing, tilt, distanceMeters } so the
    /// JS layer can drive the compass button.
    @objc(getCameraState:resolver:rejecter:)
    func getCameraState(
        _ viewTag: NSNumber,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.main.async {
            guard let mapView = self.findHereMapView() else {
                reject("NO_MAP", "HereMapView not found", nil)
                return
            }
            resolve(mapView.cameraState())
        }
    }

    /// resetNorth — animates the map back to a north-up orientation.
    @objc(resetNorth:resolver:rejecter:)
    func resetNorth(
        _ viewTag: NSNumber,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.main.async {
            self.findHereMapView()?.resetNorth()
            resolve(nil)
        }
    }

    // MARK: - Markers
    //
    //  addMarker({ lat, lng, color?, type? })
    //    type: 'source' | 'destination' | 'generic' (optional)

    @objc(addMarker:options:resolver:rejecter:)
    func addMarker(
        _ viewTag: NSNumber,
        options: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard
            let lat = Self.double(options["lat"] ?? options["latitude"]),
            let lng = Self.double(options["lng"] ?? options["longitude"])
        else {
            reject("BAD_ARGS", "addMarker requires lat and lng", nil)
            return
        }
        let type  = options["type"] as? String
        let color = (options["color"] as? String).flatMap { UIColor(hexString: $0) }
        let imageData = Self.dataFromBase64(options["image"] as? String)
        // Optional on-screen size (px) the JS side wants this marker drawn at.
        let markerSize = (options["markerSize"] as? NSNumber).map { CGFloat(truncating: $0) }
        DispatchQueue.main.async {
            guard let mapView = self.findHereMapView() else {
                reject("NO_MAP", "HereMapView not found", nil)
                return
            }
            // JS-supplied marker image takes precedence over the native pins.
            if let imageData = imageData {
                mapView.addImageMarker(lat: lat, lng: lng, pngData: imageData, sizePx: markerSize)
                resolve(nil)
                return
            }
            switch type {
            case "source":
                mapView.setSourceMarker(lat: lat, lng: lng)
            case "destination":
                mapView.setDestinationMarker(lat: lat, lng: lng)
            default:
                if let color = color {
                    mapView.addColoredMarker(lat: lat, lng: lng, color: color)
                } else {
                    mapView.addGenericMarker(lat: lat, lng: lng)
                }
            }
            resolve(nil)
        }
    }

    @objc(clearMarkers:resolver:rejecter:)
    func clearMarkers(
        _ viewTag: NSNumber,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.main.async {
            self.findHereMapView()?.clearMarkers()
            resolve(nil)
        }
    }

    // MARK: - Location Dot

    /// showCurrentLocation({ lat, lng, bearing? })
    @objc(showCurrentLocation:options:resolver:rejecter:)
    func showCurrentLocation(
        _ viewTag: NSNumber,
        options: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard
            let lat = Self.double(options["lat"] ?? options["latitude"]),
            let lng = Self.double(options["lng"] ?? options["longitude"])
        else {
            reject("BAD_ARGS", "showCurrentLocation requires lat and lng", nil)
            return
        }
        let bearing = Self.double(options["bearing"]) ?? 0.0
        DispatchQueue.main.async {
            self.findHereMapView()?.showCurrentLocation(lat: lat, lng: lng, bearing: bearing)
            resolve(nil)
        }
    }

    @objc(hideCurrentLocation:resolver:rejecter:)
    func hideCurrentLocation(
        _ viewTag: NSNumber,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.main.async {
            self.findHereMapView()?.hideCurrentLocation()
            resolve(nil)
        }
    }

    // MARK: - Route

    /// drawRoute({ originLat, originLng, destLat, destLng }) — straight-line fallback.
    @objc(drawRoute:options:resolver:rejecter:)
    func drawRoute(
        _ viewTag: NSNumber,
        options: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard
            let oLat = Self.double(options["originLat"]),
            let oLng = Self.double(options["originLng"]),
            let dLat = Self.double(options["destLat"]),
            let dLng = Self.double(options["destLng"])
        else {
            reject("BAD_ARGS", "drawRoute requires originLat/originLng/destLat/destLng", nil)
            return
        }
        DispatchQueue.main.async {
            guard let mapView = self.findHereMapView() else {
                reject("NO_MAP", "HereMapView not found", nil)
                return
            }
            mapView.drawRoutePolyline(coords: [[oLat, oLng], [dLat, dLng]])
            resolve(nil)
        }
    }

    @objc(clearRoute:resolver:rejecter:)
    func clearRoute(
        _ viewTag: NSNumber,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.main.async {
            self.findHereMapView()?.clearPolylines()
            resolve(nil)
        }
    }

    /// calculateRoute — routing is done by the JS layer via the HERE REST API on iOS.
    @objc(calculateRoute:options:resolver:rejecter:)
    func calculateRoute(
        _ viewTag: NSNumber,
        options: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        reject("NOT_IMPLEMENTED", "calculateRoute is handled by the JS layer on iOS", nil)
    }

    // MARK: - Navigation

    @objc(startNavigation:options:resolver:rejecter:)
    func startNavigation(
        _ viewTag: NSNumber,
        options: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.main.async {
            guard let mapView = self.findHereMapView() else {
                reject("NO_MAP", "HereMapView not found", nil)
                return
            }
            mapView.startNavigation()
            resolve(nil)
        }
    }

    @objc(stopNavigation:resolver:rejecter:)
    func stopNavigation(
        _ viewTag: NSNumber,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.main.async {
            self.findHereMapView()?.stopNavigation()
            resolve(nil)
        }
    }

    @objc(simulateNavigation:options:resolver:rejecter:)
    func simulateNavigation(
        _ viewTag: NSNumber,
        options: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.main.async {
            guard let mapView = self.findHereMapView() else {
                reject("NO_MAP", "HereMapView not found", nil)
                return
            }
            mapView.startNavigation() // simulation shares the same visual flow on iOS
            resolve(nil)
        }
    }

    // MARK: - Navigation Marker (live GPS — fire & forget)

    /// updateNavigationMarker({ lat, lng, bearing? })
    @objc(updateNavigationMarker:options:)
    func updateNavigationMarker(_ viewTag: NSNumber, options: NSDictionary) {
        guard
            let lat = Self.double(options["lat"] ?? options["latitude"]),
            let lng = Self.double(options["lng"] ?? options["longitude"])
        else { return }
        let bearing = Self.double(options["bearing"]) ?? 0.0
        let iconData = Self.dataFromBase64(options["iconImage"] as? String)
        let markerSize = (options["markerSize"] as? NSNumber).map { CGFloat(truncating: $0) }
        // Segment index + animation duration drive the native smooth-follow
        // animation and the grey "passed" polyline overlay (parity with Android).
        let segmentIndex = Int(Self.double(options["segmentIndex"]) ?? -1)
        let animationMs = Self.double(options["animationDuration"]) ?? 180.0
        DispatchQueue.main.async {
            self.findHereMapView()?.updateNavigationMarker(
                lat: lat, lng: lng, bearing: bearing, iconPngData: iconData, sizePx: markerSize,
                segmentIndex: segmentIndex, animationDurationMs: animationMs
            )
        }
    }

    @objc(removeNavigationMarker:)
    func removeNavigationMarker(_ viewTag: NSNumber) {
        DispatchQueue.main.async {
            self.findHereMapView()?.removeNavigationMarker()
        }
    }

    // MARK: - Navigation Camera

    /// updateNavigationCamera({ lat, lng, bearing? })
    @objc(updateNavigationCamera:options:resolver:rejecter:)
    func updateNavigationCamera(
        _ viewTag: NSNumber,
        options: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard
            let lat = Self.double(options["lat"] ?? options["latitude"]),
            let lng = Self.double(options["lng"] ?? options["longitude"])
        else {
            reject("BAD_ARGS", "updateNavigationCamera requires lat and lng", nil)
            return
        }
        let bearing = Self.double(options["bearing"]) ?? 0.0
        // Speed drives the follow-camera zoom/tilt; animationDuration + forceInstant
        // let the JS layer snap the camera on nav start / re-center and animate it
        // smoothly otherwise (parity with Android's NavigationCameraManager).
        let speedMps = Self.double(options["speedMps"])
        let animationMs = Self.double(options["animationDuration"]) ?? 220.0
        let forceInstant = (options["forceInstant"] as? NSNumber)?.boolValue ?? false
        DispatchQueue.main.async {
            self.findHereMapView()?.updateNavigationCamera(
                lat: lat, lng: lng, bearing: bearing,
                speedMps: speedMps, animationDurationMs: animationMs, forceInstant: forceInstant
            )
            resolve(nil)
        }
    }

    @objc(resetNavigationCamera:resolver:rejecter:)
    func resetNavigationCamera(
        _ viewTag: NSNumber,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.main.async {
            self.findHereMapView()?.resetNavigationCamera()
            resolve(nil)
        }
    }

    // MARK: - Polyline

    /// drawPolyline({ coordinates: [{ latitude, longitude } | [lat, lng]], color?, width? })
    @objc(drawPolyline:options:resolver:rejecter:)
    func drawPolyline(
        _ viewTag: NSNumber,
        options: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        let coords = Self.parseCoords(options["coordinates"] ?? options["coords"])
        guard coords.count >= 2 else {
            reject("BAD_ARGS", "drawPolyline requires at least 2 coordinates (got \(coords.count))", nil)
            return
        }
        let color = (options["color"] as? String).flatMap { UIColor(hexString: $0) }
        let width = Self.double(options["width"]) ?? 10.0
        DispatchQueue.main.async {
            guard let mapView = self.findHereMapView() else {
                reject("NO_MAP", "HereMapView not found", nil)
                return
            }
            mapView.drawRoutePolyline(coords: coords, color: color, widthPixels: width)
            resolve(nil)
        }
    }

    /// trimPolyline({ trimIndex }) — removes already-passed segments during navigation
    @objc(trimPolyline:options:resolver:rejecter:)
    func trimPolyline(
        _ viewTag: NSNumber,
        options: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        let index = Int(Self.double(options["trimIndex"]) ?? 0)
        DispatchQueue.main.async {
            self.findHereMapView()?.trimPolyline(upToIndex: index)
            resolve(nil)
        }
    }

    @objc(clearPolyline:resolver:rejecter:)
    func clearPolyline(
        _ viewTag: NSNumber,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.main.async {
            self.findHereMapView()?.clearPolylines()
            resolve(nil)
        }
    }

    // MARK: - Helpers

    /// Coerces an NSNumber / NSString JS value into a Double.
    private static func double(_ value: Any?) -> Double? {
        if let n = value as? NSNumber { return n.doubleValue }
        if let s = value as? String  { return Double(s) }
        return nil
    }

    /// Decodes a base64 PNG string (with or without a `data:` URI prefix) into Data.
    private static func dataFromBase64(_ value: String?) -> Data? {
        guard var str = value, !str.isEmpty else { return nil }
        if str.hasPrefix("data:"), let comma = str.range(of: ",") {
            str = String(str[comma.upperBound...])
        }
        return Data(base64Encoded: str, options: .ignoreUnknownCharacters)
    }

    /// Normalises a JS coordinate list into `[[lat, lng]]`.
    /// Accepts `[{ latitude/lat, longitude/lng/lon }]` or `[[lat, lng]]`.
    private static func parseCoords(_ raw: Any?) -> [[Double]] {
        guard let array = raw as? [Any] else { return [] }
        var result: [[Double]] = []
        result.reserveCapacity(array.count)
        for item in array {
            if let dict = item as? [String: Any] {
                if let lat = double(dict["latitude"] ?? dict["lat"]),
                   let lng = double(dict["longitude"] ?? dict["lng"] ?? dict["lon"]) {
                    result.append([lat, lng])
                }
            } else if let pair = item as? [Any], pair.count >= 2,
                      let lat = double(pair[0]), let lng = double(pair[1]) {
                result.append([lat, lng])
            }
        }
        return result
    }

    // MARK: - View Lookup

    private func findHereMapView() -> HereMapView? {
        let keyWindow = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first(where: { $0.isKeyWindow })
        guard let window = keyWindow else {
            return nil
        }
        return findView(in: window)
    }

    private func findView(in view: UIView) -> HereMapView? {
        if let hereView = view as? HereMapView { return hereView }
        for sub in view.subviews {
            if let found = findView(in: sub) { return found }
        }
        return nil
    }

    @objc static func requiresMainQueueSetup() -> Bool { return false }
}
