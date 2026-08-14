package com.myshipr.heremap

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.UIManagerModule
import com.here.sdk.core.GeoCoordinates
import com.here.sdk.core.engine.AuthenticationMode
import com.here.sdk.core.engine.SDKNativeEngine
import com.here.sdk.core.engine.SDKOptions

/**
 * Native Module exposing HERE SDK imperative API to JavaScript.
 *
 * JS usage:
 *   import { NativeModules } from 'react-native';
 *   const { HereMapModule } = NativeModules;
 */
class HereMapModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "HereMapModule"
        const val MODULE_NAME = "HereMapModule"
    }

    override fun getName(): String = MODULE_NAME

    // Camera throttle — prevents the HERE tile loader from being overwhelmed
    // when JS calls moveCamera at 60 fps with animate:false.
    private var lastCameraUpdateMs = 0L
    private var lastBearing = -1.0
    private val CAMERA_UPDATE_INTERVAL_MS = 33L // ~30 fps cap

    // -------------------------------------------------------------------------
    // SDK initialisation
    // -------------------------------------------------------------------------

    /**
     * Must be called once before rendering the map.
     *
     * @param accessKeyId     HERE platform access key ID
     * @param accessKeySecret HERE platform access key secret
     */
    @ReactMethod
    fun initSDK(accessKeyId: String, accessKeySecret: String, promise: Promise) {
        try {
            if (SDKNativeEngine.getSharedInstance() != null) {
                promise.resolve("SDK already initialized")
                return
            }
            // HERE SDK 4.26: AuthenticationMode.withKeySecret(keyId, keySecret)
            val authMode = AuthenticationMode.withKeySecret(accessKeyId, accessKeySecret)
            val options = SDKOptions(authMode)
            SDKNativeEngine.makeSharedInstance(reactContext.applicationContext, options)
            promise.resolve("HERE SDK initialized")
        } catch (e: Exception) {
            Log.e(TAG, "initSDK failed: ${e.message}")
            promise.reject("INIT_ERROR", e.message ?: "Unknown error", e)
        }
    }

    // -------------------------------------------------------------------------
    // Map lifecycle
    // -------------------------------------------------------------------------

    /**
     * Resolves once the map scene is renderable, optionally switching scheme
     * first: `{ scheme?: 'normalDay' | 'satellite' | 'logisticsDay' | … }`.
     *
     * The view starts loading its scene as soon as it mounts, so this is the
     * "wait until the map is usable" hook rather than a required setup step.
     */
    @ReactMethod
    fun loadMap(viewTag: Int, options: ReadableMap?, promise: Promise) {
        val scheme = options?.getString("scheme")
        runOnView(viewTag, promise) { view ->
            view.loadMap(scheme) { error ->
                if (error == null) promise.resolve(true)
                else promise.reject("HERE_MAP_ERROR", error)
            }
        }
    }

    // -------------------------------------------------------------------------
    // Camera
    // -------------------------------------------------------------------------

    /** Centres the map on a coordinate at [zoom], without animating. */
    @ReactMethod
    fun setCenter(viewTag: Int, latitude: Double, longitude: Double, zoom: Double, promise: Promise) {
        runOnView(viewTag, promise) { view ->
            view.setCenter(latitude, longitude, zoom)
            promise.resolve(null)
        }
    }

    /**
     * @param viewTag   React tag of the <HereMapView> component
     * @param cameraMap ReadableMap with { lat, lng, zoom?, bearing?, tilt?, animate?, animationDuration? }
     */
    @ReactMethod
    fun moveCamera(viewTag: Int, cameraMap: ReadableMap, promise: Promise) {
        // ── Throttle: drop frames that arrive faster than ~30 fps to prevent
        //    the HERE tile loader from being overwhelmed and showing a blank map.
        val now = System.currentTimeMillis()
        if (now - lastCameraUpdateMs < CAMERA_UPDATE_INTERVAL_MS) {
            promise.resolve(null)
            return
        }
        lastCameraUpdateMs = now

        val lat = cameraMap.getDouble("lat")
        val lng = cameraMap.getDouble("lng")
        val zoom = if (cameraMap.hasKey("zoom")) cameraMap.getDouble("zoom") else 14.0
        val bearing = if (cameraMap.hasKey("bearing")) cameraMap.getDouble("bearing") else 0.0
        val tilt = if (cameraMap.hasKey("tilt")) cameraMap.getDouble("tilt") else 0.0
        val animate = if (cameraMap.hasKey("animate")) cameraMap.getBoolean("animate") else false
        val animDuration = if (cameraMap.hasKey("animationDuration")) cameraMap.getInt("animationDuration") else 800

        // ── Skip bearing update when change < 1° — reduces tile cache churn
        //    (every bearing change forces the renderer to re-project tiles).
        val effectiveBearing = if (lastBearing >= 0 && Math.abs(bearing - lastBearing) < 1.0) {
            lastBearing
        } else {
            lastBearing = bearing
            bearing
        }

        runOnView(viewTag, promise) { view ->
            view.moveCamera(lat, lng, zoom, effectiveBearing, tilt, animate, animDuration)
            promise.resolve(null)
        }
    }

    /** Returns the live camera state { lat, lng, bearing, tilt, distanceMeters }. */
    @ReactMethod
    fun getCameraState(viewTag: Int, promise: Promise) {
        runOnView(viewTag, promise) { view ->
            val state = view.getCameraState()
            val result = Arguments.createMap().apply {
                putDouble("lat", state["lat"] ?: 0.0)
                putDouble("lng", state["lng"] ?: 0.0)
                putDouble("bearing", state["bearing"] ?: 0.0)
                putDouble("tilt", state["tilt"] ?: 0.0)
                putDouble("distanceMeters", state["distanceMeters"] ?: 0.0)
            }
            promise.resolve(result)
        }
    }

    /** Animate the map back to north-up — the compass reset-to-north action. */
    @ReactMethod
    fun resetNorth(viewTag: Int, promise: Promise) {
        runOnView(viewTag, promise) { view ->
            view.resetNorth()
            promise.resolve(null)
        }
    }

    // -------------------------------------------------------------------------
    // Markers
    // -------------------------------------------------------------------------

    /**
     * @param viewTag   React tag of the <HereMapView> component
     * @param markerMap ReadableMap with { lat, lng, color? }
     */
    @ReactMethod
    fun addMarker(viewTag: Int, markerMap: ReadableMap, promise: Promise) {
        val lat = markerMap.getDouble("lat")
        val lng = markerMap.getDouble("lng")
        val color = if (markerMap.hasKey("color")) markerMap.getString("color") ?: "#FF0000"
                    else "#FF0000"
        // Optional JS-rasterised PNG (base64) for the marker icon.
        val image = if (markerMap.hasKey("image")) markerMap.getString("image") else null
        // Optional on-screen size (px) the JS side wants this marker drawn at.
        val markerSize = if (markerMap.hasKey("markerSize")) markerMap.getInt("markerSize") else null

        runOnView(viewTag, promise) { view ->
            view.addMarker(lat, lng, color, image, markerSize)
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun clearMarkers(viewTag: Int, promise: Promise) {
        runOnView(viewTag, promise) { view ->
            view.clearMarkers()
            promise.resolve(null)
        }
    }

    // -------------------------------------------------------------------------
    // Current location
    // -------------------------------------------------------------------------

    @ReactMethod
    fun showCurrentLocation(viewTag: Int, locationMap: ReadableMap, promise: Promise) {
        val lat = locationMap.getDouble("lat")
        val lng = locationMap.getDouble("lng")
        val bearing = if (locationMap.hasKey("bearing")) locationMap.getDouble("bearing") else 0.0
        val style = if (locationMap.hasKey("style")) locationMap.getString("style") ?: "navigation" else "navigation"
        runOnView(viewTag, promise) { view ->
            view.showCurrentLocation(lat, lng, bearing, style)
            promise.resolve(null)
        }
    }

    /**
     * Hide the default HERE SDK location indicator (blue dot + accuracy ring).
     * Call this when switching to the custom navigation arrow marker so both
     * indicators don't appear simultaneously.
     */
    @ReactMethod
    fun hideCurrentLocation(viewTag: Int, promise: Promise) {
        runOnView(viewTag, promise) { view ->
            view.hideCurrentLocation()
            promise.resolve(null)
        }
    }

    // -------------------------------------------------------------------------
    // Routes
    // -------------------------------------------------------------------------

    /**
     * Calculate and draw a truck route between two coordinates.
     *
     * @param routeMap ReadableMap with { originLat, originLng, destLat, destLng }
     */
    @ReactMethod
    fun drawRoute(viewTag: Int, routeMap: ReadableMap, promise: Promise) {
        val originLat = routeMap.getDouble("originLat")
        val originLng = routeMap.getDouble("originLng")
        val destLat = routeMap.getDouble("destLat")
        val destLng = routeMap.getDouble("destLng")

        runOnView(viewTag, promise) { view ->
            view.drawRoute(
                originLat, originLng,
                destLat, destLng,
                onSuccess = { distanceM, durationS ->
                    // Return route summary so JS can populate the nav info bar
                    val result = Arguments.createMap().apply {
                        putDouble("distanceMeters", distanceM)
                        putDouble("durationSeconds", durationS)
                    }
                    promise.resolve(result)
                },
                onError = { msg -> promise.reject("ROUTE_ERROR", msg) }
            )
        }
    }

    /**
     * Draws an already-calculated route. Pass either the `routeId` returned by
     * [HereRoutingModule], or explicit `coordinates: [{lat, lng}]`.
     *
     * Options: `{ routeId?, coordinates?, color?, width? }`.
     * Replaces any previously drawn route; [clearRoute] removes it.
     */
    @ReactMethod
    fun drawRouteGeometry(viewTag: Int, options: ReadableMap, promise: Promise) {
        val color = if (options.hasKey("color")) options.getString("color") ?: "#4285F4" else "#4285F4"
        val width = if (options.hasKey("width")) options.getDouble("width") else 26.0

        val routeId = if (options.hasKey("routeId")) options.getString("routeId") else null
        val vertices: List<GeoCoordinates> = if (routeId != null) {
            val route = RouteStore.get(routeId)
                ?: return promise.reject("HERE_ROUTE_ERROR", "Unknown routeId: $routeId")
            route.geometry?.vertices.orEmpty()
        } else {
            val coordsArray = options.getArray("coordinates")
                ?: return promise.reject("INVALID_ARGS", "routeId or coordinates is required")
            (0 until coordsArray.size()).mapNotNull { index ->
                coordsArray.getMap(index)?.let { point ->
                    val lat = point.getDoubleOrNull("lat") ?: point.getDoubleOrNull("latitude")
                    val lng = point.getDoubleOrNull("lng") ?: point.getDoubleOrNull("longitude")
                    if (lat != null && lng != null) GeoCoordinates(lat, lng) else null
                }
            }
        }

        if (vertices.size < 2) {
            return promise.reject("INVALID_ARGS", "route geometry needs at least 2 points")
        }

        runOnView(viewTag, promise) { view ->
            view.drawRouteGeometry(vertices, color, width)
            promise.resolve(vertices.size)
        }
    }

    @ReactMethod
    fun clearRoute(viewTag: Int, promise: Promise) {
        runOnView(viewTag, promise) { view ->
            view.clearRoute()
            promise.resolve(null)
        }
    }

    // -------------------------------------------------------------------------
    // Navigation marker
    // -------------------------------------------------------------------------

    /**
     * Create or animate a directional arrow marker to the new position.
     *
     * Options: { lat, lng, bearing?, animationDuration? }
     *   - bearing           direction the arrow faces, 0 = north, clockwise (default 0)
     *   - animationDuration ms; pass 0 on the first call so the marker snaps (default 1000)
     */
    @ReactMethod
    fun updateNavigationMarker(viewTag: Int, options: ReadableMap, promise: Promise) {
        val lat = options.getDouble("lat")
        val lng = options.getDouble("lng")
        val bearing = if (options.hasKey("bearing")) options.getDouble("bearing") else 0.0
        val durationMs = if (options.hasKey("animationDuration")) options.getInt("animationDuration") else 1000
        val markerSize = if (options.hasKey("markerSize")) options.getInt("markerSize") else null
        val iconAsset  = if (options.hasKey("iconAsset"))  options.getString("iconAsset")  else null
        val iconImage  = if (options.hasKey("iconImage"))  options.getString("iconImage")  else null

        runOnView(viewTag, promise) { view ->
            view.updateNavigationMarker(lat, lng, bearing, durationMs, markerSize, iconAsset, -1, iconImage)
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun updateNavigationCamera(viewTag: Int, options: ReadableMap, promise: Promise) {
        val lat = options.getDouble("lat")
        val lng = options.getDouble("lng")
        val bearing = if (options.hasKey("bearing")) options.getDouble("bearing") else 0.0
        val speedMps = if (options.hasKey("speedMps")) options.getDouble("speedMps") else null
        val animationDuration = if (options.hasKey("animationDuration")) options.getInt("animationDuration") else 220
        val forceInstant = if (options.hasKey("forceInstant")) options.getBoolean("forceInstant") else false

        runOnView(viewTag, promise) { view ->
            view.updateNavigationCamera(lat, lng, bearing, speedMps, animationDuration, forceInstant)
            promise.resolve(null)
        }
    }

    @ReactMethod
    fun resetNavigationCamera(viewTag: Int, promise: Promise) {
        runOnView(viewTag, promise) { view ->
            view.resetNavigationCamera()
            promise.resolve(null)
        }
    }

    /** Remove the navigation marker and cancel any running animation. */
    @ReactMethod
    fun removeNavigationMarker(viewTag: Int, promise: Promise) {
        runOnView(viewTag, promise) { view ->
            view.removeNavigationMarker()
            promise.resolve(null)
        }
    }

    // -------------------------------------------------------------------------
    // Navigation polyline (with trim support)
    // -------------------------------------------------------------------------

    /**
     * Draw a polyline from an array of coordinates, replacing any previous one.
     *
     * Options: { coordinates: Array<{ lat, lng }>, color?, width? }
     */
    @ReactMethod
    fun drawPolyline(viewTag: Int, options: ReadableMap, promise: Promise) {
        val coordsArray = options.getArray("coordinates")
            ?: return promise.reject("INVALID_ARGS", "coordinates array is required")
        val color = if (options.hasKey("color")) options.getString("color") ?: "#4285F4" else "#4285F4"
        val width = if (options.hasKey("width")) options.getDouble("width") else 10.0

        val coords = ArrayList<GeoCoordinates>(coordsArray.size())
        for (i in 0 until coordsArray.size()) {
            val point = coordsArray.getMap(i) ?: continue
            coords.add(GeoCoordinates(point.getDouble("lat"), point.getDouble("lng")))
        }

        if (coords.size < 2) {
            return promise.reject("INVALID_ARGS", "coordinates must contain at least 2 points")
        }

        runOnView(viewTag, promise) { view ->
            view.drawPolyline(coords, color, width)
            promise.resolve(null)
        }
    }

    /**
     * Trim the polyline from the start up to the current marker position.
     *
     * Options: { trimIndex: Int, trimFraction?: Double }
     *   - trimIndex    index of the segment the marker is currently on
     *   - trimFraction 0.0–1.0, how far along that segment (default 0)
     *
     * This method is designed to be called at ~60 fps and skips redundant
     * redraws when trimIndex has not changed.
     */
    @ReactMethod
    fun trimPolyline(viewTag: Int, options: ReadableMap, promise: Promise) {
        val trimIndex = options.getInt("trimIndex")
        val trimFraction = if (options.hasKey("trimFraction")) options.getDouble("trimFraction") else 0.0
        val splitLat = if (options.hasKey("splitLat")) options.getDouble("splitLat") else null
        val splitLng = if (options.hasKey("splitLng")) options.getDouble("splitLng") else null
        val speedMps = if (options.hasKey("speedMps")) options.getDouble("speedMps") else null

        runOnView(viewTag, promise) { view ->
            view.trimPolyline(trimIndex, trimFraction, splitLat, splitLng, speedMps)
            promise.resolve(null)
        }
    }

    /** Remove the navigation polyline and clear stored coordinates. */
    @ReactMethod
    fun clearPolyline(viewTag: Int, promise: Promise) {
        runOnView(viewTag, promise) { view ->
            view.clearPolyline()
            promise.resolve(null)
        }
    }

    // -------------------------------------------------------------------------
    // Search / geocoding / POI  (HERE SDK SearchEngine — no REST calls)
    // -------------------------------------------------------------------------

    /** Type-ahead suggestions: `{ query, lat?, lng?, limit?, lang? }`. */
    @ReactMethod
    fun suggest(options: ReadableMap, promise: Promise) =
        HereSearchService.suggest(options, promise)

    /** Free-text place search — every result carries a coordinate. */
    @ReactMethod
    fun searchByText(options: ReadableMap, promise: Promise) =
        HereSearchService.searchByText(options, promise)

    /** POI search by HERE category id: `{ categories: [...], lat, lng }`. */
    @ReactMethod
    fun searchByCategory(options: ReadableMap, promise: Promise) =
        HereSearchService.searchByCategory(options, promise)

    /** Forward geocoding: address text → coordinates. */
    @ReactMethod
    fun geocode(options: ReadableMap, promise: Promise) =
        HereSearchService.geocode(options, promise)

    /** Reverse geocoding: coordinates → address (resolves null when unknown). */
    @ReactMethod
    fun reverseGeocode(options: ReadableMap, promise: Promise) =
        HereSearchService.reverseGeocode(options, promise)

    /** Resolves a place id from [suggest] to its full details. */
    @ReactMethod
    fun lookupPlace(options: ReadableMap, promise: Promise) =
        HereSearchService.lookupPlace(options, promise)

    // -------------------------------------------------------------------------
    // Routing  (HERE SDK RoutingEngine — no REST calls)
    // -------------------------------------------------------------------------

    /**
     * Calculates a route for any supported transport mode and resolves
     * `{ routes: [...] }`. See [HereRoutingService.calculateRoute] for the
     * accepted options.
     */
    @ReactMethod
    fun calculateRouteWithOptions(options: ReadableMap, promise: Promise) =
        HereRoutingService.calculateRoute(options, promise)

    // -------------------------------------------------------------------------
    // Map styling & features
    // -------------------------------------------------------------------------

    /** Switch map style, e.g. "normalDay", "satellite", "logisticsNight". */
    @ReactMethod
    fun setMapScheme(viewTag: Int, scheme: String, promise: Promise) {
        runOnView(viewTag, promise) { view ->
            if (view.setMapScheme(scheme)) {
                promise.resolve(view.getMapScheme())
            } else {
                promise.reject("INVALID_ARGS", "Unknown map scheme: $scheme")
            }
        }
    }

    @ReactMethod
    fun getMapScheme(viewTag: Int, promise: Promise) {
        runOnView(viewTag, promise) { view -> promise.resolve(view.getMapScheme()) }
    }

    /**
     * Toggle map features.
     *
     * Options: `{ enable: { FEATURE_KEY: MODE }, disable: [FEATURE_KEY] }` —
     * keys and modes are the HERE `MapFeatures` / `MapFeatureModes` constants,
     * e.g. `{ enable: { "extruded buildings": "all" } }`.
     */
    @ReactMethod
    fun setMapFeatures(viewTag: Int, options: ReadableMap, promise: Promise) {
        val enable = mutableMapOf<String, String>()
        options.getMap("enable")?.let { map ->
            val iterator = map.keySetIterator()
            while (iterator.hasNextKey()) {
                val key = iterator.nextKey()
                map.getString(key)?.let { enable[key] = it }
            }
        }

        val disable = options.getArray("disable")
            ?.let { array -> (0 until array.size()).mapNotNull { array.getString(it) } }
            .orEmpty()

        runOnView(viewTag, promise) { view ->
            view.setMapFeatures(enable, disable)
            promise.resolve(null)
        }
    }

    /**
     * Convenience toggle for the traffic layers, so JS does not have to know
     * the HERE feature/mode constant strings.
     *
     * Options: `{ flow: Boolean, incidents: Boolean }` — omit either key to
     * leave that layer as it is.
     */
    @ReactMethod
    fun setTrafficEnabled(viewTag: Int, options: ReadableMap, promise: Promise) {
        val flow = if (options.hasKey("flow")) options.getBoolean("flow") else null
        val incidents =
            if (options.hasKey("incidents")) options.getBoolean("incidents") else null

        runOnView(viewTag, promise) { view ->
            flow?.let { view.setTrafficFlowEnabled(it) }
            incidents?.let { view.setTrafficIncidentsEnabled(it) }
            promise.resolve(null)
        }
    }

    /** Convenience toggle for HERE's extruded-building (3D) rendering. */
    @ReactMethod
    fun set3DBuildingsEnabled(viewTag: Int, enabled: Boolean, promise: Promise) {
        runOnView(viewTag, promise) { view ->
            view.set3DBuildingsEnabled(enabled)
            promise.resolve(null)
        }
    }

    /** Feature keys/modes this SDK build supports — useful when debugging. */
    @ReactMethod
    fun getSupportedMapFeatures(viewTag: Int, promise: Promise) {
        runOnView(viewTag, promise) { view ->
            val result = Arguments.createMap()
            view.getSupportedMapFeatures().forEach { (feature, modes) ->
                val modeArray = Arguments.createArray()
                modes.forEach { modeArray.pushString(it) }
                result.putArray(feature, modeArray)
            }
            promise.resolve(result)
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Resolves the native [HereMapView] from a React view tag and runs [block]
     * on the main (UI) thread.
     */
    private fun runOnView(viewTag: Int, promise: Promise, block: (HereMapView) -> Unit) {
        reactContext.runOnUiQueueThread {
            try {
                // First try registry (works even when UIManagerModule is unavailable).
                val registeredView = HereMapViewManager.resolveView(viewTag)
                val view = registeredView ?: run {
                    val uiManager = reactContext.getNativeModule(UIManagerModule::class.java)
                        ?: throw IllegalStateException("UIManagerModule not available and view not in registry")
                    uiManager.resolveView(viewTag)
                        ?: throw IllegalStateException("View with tag $viewTag not found")
                }

                if (view !is HereMapView) {
                    throw IllegalStateException("View is not a HereMapView (got ${view::class.java.simpleName})")
                }
                block(view)
            } catch (e: Exception) {
                Log.e(TAG, "runOnView error: ${e.message}")
                promise.reject("VIEW_ERROR", e.message ?: "Unknown error", e)
            }
        }
    }

    // Required for modules that register event listeners (even if unused)
    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}
}
