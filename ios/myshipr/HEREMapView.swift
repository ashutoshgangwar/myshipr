import UIKit
import ObjectiveC

/// Container for HERE SDK MapView with initialization and basic operations
@objc(HereMapContainer)
class HereMapContainer: UIView {
    @objc var mapView: UIView?
    @objc var centerLat: NSNumber = 0.0
    @objc var centerLng: NSNumber = 0.0
    @objc var zoomLevel: NSNumber = 14.0
    
    private var initAttempted = false
    private var initFailed = false
    private let TAG = "[HereMapContainer]"
    private var markerObjects: [AnyObject] = []
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        backgroundColor = .white
        initializeMapView()
    }
    
    required init?(coder: NSCoder) {
        super.init(coder: coder)
        backgroundColor = .white
        initializeMapView()
    }
    
    private func initializeMapView() {
        guard !initAttempted else { return }
        initAttempted = true
        
        print("\(TAG) Attempting to initialize HERE SDK MapView...")
        
        if let mapViewInstance = createHereSDKMapView() {
            print("\(TAG) ✅ Successfully created HERE SDK MapView")
            mapView = mapViewInstance
            mapView?.frame = self.bounds
            mapView?.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            self.addSubview(mapView!)
            
            if centerLat.doubleValue != 0.0 || centerLng.doubleValue != 0.0 {
                moveCamera(lat: centerLat, lng: centerLng, zoom: zoomLevel, animated: false)
            }
        } else {
            print("\(TAG) ❌ Failed to initialize HERE SDK MapView - using placeholder")
            initFailed = true
            createPlaceholder()
        }
    }
    
    private func createHereSDKMapView() -> UIView? {
        let possibleClassNames = [
            "com.here.sdk.mapview.MapView",
            "HereMapView",
            "MapView",
            "HEREMapView",
            "HERESdkMapsMapView",
            "com.here.maps.MapView"
        ]
        
        for className in possibleClassNames {
            if let viewClass = NSClassFromString(className) as? UIView.Type {
                print("\(TAG) Found class: \(className)")
                let mapView = viewClass.init(frame: self.bounds)
                print("\(TAG) Created MapView using init(frame:)")
                return mapView
            }
        }
        return nil
    }
    
    private func createPlaceholder() {
        let placeholder = UIView()
        placeholder.frame = self.bounds
        placeholder.backgroundColor = UIColor(red: 0.95, green: 0.95, blue: 0.95, alpha: 1)
        placeholder.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        self.addSubview(placeholder)
        
        let label = UILabel()
        label.text = "Map unavailable\n(HERE SDK not initialized)"
        label.numberOfLines = 0
        label.textAlignment = .center
        label.textColor = .darkGray
        label.font = UIFont.systemFont(ofSize: 14)
        label.frame = CGRect(x: 20, y: 0, width: self.bounds.width - 40, height: 100)
        label.center = CGPoint(x: self.bounds.midX, y: self.bounds.midY)
        placeholder.addSubview(label)
    }
    
    @objc func moveCamera(lat: NSNumber, lng: NSNumber, zoom: NSNumber, animated: Bool) {
        centerLat = lat
        centerLng = lng
        zoomLevel = zoom
        
        guard let mapView = mapView, !initFailed else {
            print("\(TAG) Cannot moveCamera: map view unavailable")
            return
        }
        
        let latVal = lat.doubleValue
        let lngVal = lng.doubleValue
        let zoomVal = zoom.doubleValue
        
        print("\(TAG) Moving camera to: \(latVal), \(lngVal), zoom: \(zoomVal)")
        
        if mapView.responds(to: NSSelectorFromString("moveCamera:")) {
            mapView.perform(NSSelectorFromString("moveCamera:"), with: [latVal, lngVal])
        } else if mapView.responds(to: NSSelectorFromString("setCameraPosition:zoom:")) {
            mapView.perform(NSSelectorFromString("setCameraPosition:zoom:"), with: [latVal, lngVal], with: zoomVal)
        } else if mapView.responds(to: NSSelectorFromString("moveToCoordinate:withZoom:")) {
            mapView.perform(NSSelectorFromString("moveToCoordinate:withZoom:"), with: [latVal, lngVal], with: zoomVal)
        }
    }

    @objc func moveCameraOnMap(_ cameraMap: NSDictionary) {
        guard let lat = cameraMap["lat"] as? NSNumber,
              let lng = cameraMap["lng"] as? NSNumber else {
            print("\(TAG) moveCameraOnMap missing required lat/lng")
            return
        }

        let zoom = cameraMap["zoom"] as? NSNumber ?? zoomLevel
        let animate = cameraMap["animate"] as? Bool ?? false
        moveCamera(lat: lat, lng: lng, zoom: zoom, animated: animate)
    }

    @objc func addMarkerOnMap(_ markerMap: NSDictionary) {
        guard let lat = markerMap["lat"] as? NSNumber,
              let lng = markerMap["lng"] as? NSNumber else {
            print("\(TAG) addMarkerOnMap missing required lat/lng")
            return
        }

        let colorHex = markerMap["color"] as? String ?? "#FF0000"
        addMarker(lat: lat, lng: lng, colorHex: colorHex as NSString)
    }

    @objc func clearMarkersOnMap() {
        clearMarkers()
    }

    @objc func showCurrentLocationOnMap(_ locationMap: NSDictionary) {
        print("\(TAG) showCurrentLocationOnMap called")
    }

    @objc func hideCurrentLocationOnMap() {
        print("\(TAG) hideCurrentLocationOnMap called")
    }

    @objc func clearRouteOnMap() {
        print("\(TAG) clearRouteOnMap called")
    }

    @objc func addMarker(lat: NSNumber, lng: NSNumber, colorHex: NSString) {
        guard let mapView = mapView, !initFailed else {
            print("\(TAG) addMarker failed because map view is unavailable")
            return
        }

        guard let coordinates = createGeoCoordinates(lat: lat.doubleValue, lng: lng.doubleValue) else {
            print("\(TAG) addMarker failed to create GeoCoordinates")
            return
        }

        guard let marker = createMapMarker(coordinates: coordinates, colorHex: colorHex as String) else {
            print("\(TAG) addMarker failed to create MapMarker")
            return
        }

        if addMapMarker(marker) {
            markerObjects.append(marker)
            print("\(TAG) Added marker at \(lat), \(lng)")
        } else {
            print("\(TAG) addMarker failed to add marker to map scene")
        }
    }

    @objc func clearMarkers() {
        guard let _ = mapView else { return }
        for marker in markerObjects {
            removeMapMarker(marker)
        }
        markerObjects.removeAll()
        print("\(TAG) Cleared map markers")
    }

    private func getMapScene() -> AnyObject? {
        guard let mapView = mapView else { return nil }
        let selector = NSSelectorFromString("mapScene")
        guard mapView.responds(to: selector) else { return nil }
        return mapView.perform(selector)?.takeUnretainedValue()
    }

    private func addMapMarker(_ marker: AnyObject) -> Bool {
        guard let mapScene = getMapScene() else { return false }
        let selector = NSSelectorFromString("addMapMarker:")
        guard mapScene.responds(to: selector) else { return false }
        mapScene.perform(selector, with: marker)
        return true
    }

    private func removeMapMarker(_ marker: AnyObject) -> Bool {
        guard let mapScene = getMapScene() else { return false }
        let selector = NSSelectorFromString("removeMapMarker:")
        guard mapScene.responds(to: selector) else { return false }
        mapScene.perform(selector, with: marker)
        return true
    }

    private func createGeoCoordinates(lat: Double, lng: Double) -> AnyObject? {
        guard let geoCoordinatesClass = NSClassFromString("GeoCoordinates") else {
            return nil
        }

        let selectors = ["initWithLatitude:longitude:", "initWithLat:lng:"]
        for selectorName in selectors {
            let selector = NSSelectorFromString(selectorName)
            if class_getInstanceMethod(geoCoordinatesClass, selector) != nil,
               let instance = class_createInstance(geoCoordinatesClass, 0) as AnyObject? {
                if let result = instance.perform(selector, with: NSNumber(value: lat), with: NSNumber(value: lng))?.takeUnretainedValue() {
                    return result
                }
            }
        }

        return nil
    }

    private func createMapMarker(coordinates: AnyObject, colorHex: String) -> AnyObject? {
        guard let mapMarkerClass = NSClassFromString("MapMarker") else {
            return nil
        }

        let selectorInfo: [(String, Bool)] = [
            ("initWithCoordinates:image:", true),
            ("initWithGeoCoordinates:image:", true),
            ("initWithCoordinates:", false),
            ("initWithGeoCoordinates:", false)
        ]

        for (selectorName, usesImage) in selectorInfo {
            let selector = NSSelectorFromString(selectorName)
            if class_getInstanceMethod(mapMarkerClass, selector) != nil,
               let markerInstance = class_createInstance(mapMarkerClass, 0) as AnyObject? {
                if usesImage {
                    guard let image = createMapImage(colorHex: colorHex) else { continue }
                    if let result = markerInstance.perform(selector, with: coordinates, with: image)?.takeUnretainedValue() {
                        return result
                    }
                } else {
                    if let result = markerInstance.perform(selector, with: coordinates)?.takeUnretainedValue() {
                        return result
                    }
                }
            }
        }

        return nil
    }

    private func createMapImage(colorHex: String) -> AnyObject? {
        if let factoryClass = NSClassFromString("MapImageFactory") as? AnyClass,
           class_respondsToSelector(factoryClass, NSSelectorFromString("fromUIImage:")) {
            let image = createDefaultMarkerImage(colorHex: colorHex)
            return (factoryClass as AnyObject).perform(NSSelectorFromString("fromUIImage:"), with: image)?.takeUnretainedValue()
        }

        if let mapImageClass = NSClassFromString("MapImage"),
           class_getInstanceMethod(mapImageClass, NSSelectorFromString("initWithUIImage:")) != nil,
           let instance = class_createInstance(mapImageClass, 0) as AnyObject? {
            let image = createDefaultMarkerImage(colorHex: colorHex)
            return instance.perform(NSSelectorFromString("initWithUIImage:"), with: image)?.takeUnretainedValue()
        }

        return nil
    }

    private func createDefaultMarkerImage(colorHex: String) -> UIImage {
        let config = UIImage.SymbolConfiguration(pointSize: 24, weight: .bold)
        let symbol = UIImage(systemName: "mappin.circle.fill", withConfiguration: config)?
            .withTintColor(UIColor.systemRed, renderingMode: .alwaysOriginal)
        return symbol ?? UIImage()
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        mapView?.frame = self.bounds
    }
}
