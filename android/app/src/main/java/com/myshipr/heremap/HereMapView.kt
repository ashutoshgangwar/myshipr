package com.myshipr.heremap

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color as AndroidColor
import android.graphics.Paint
import android.util.Base64
import android.widget.FrameLayout
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.UIManagerHelper
import com.here.sdk.core.Anchor2D
import com.here.sdk.core.Color as HereColor
import com.here.sdk.core.GeoCoordinates
import com.here.sdk.core.GeoCoordinatesUpdate
import com.here.sdk.core.GeoOrientationUpdate
import com.here.sdk.core.GeoPolyline
import com.here.sdk.core.LanguageCode
import com.here.sdk.core.Location
import com.here.sdk.core.Point2D
import com.here.sdk.core.engine.SDKNativeEngine
import com.here.sdk.core.Rectangle2D
import com.here.sdk.core.Size2D
import com.here.sdk.gestures.GestureState
import com.here.sdk.gestures.GestureType
import com.here.sdk.gestures.LongPressListener
import com.here.sdk.gestures.MapInteractionListener
import com.here.sdk.gestures.MapInteractionState
import com.here.sdk.gestures.TapListener
import com.here.sdk.mapview.LineCap
import com.here.sdk.mapview.MapCameraAnimationFactory
import com.here.time.Duration
import com.here.sdk.mapview.LocationIndicator
import com.here.sdk.mapview.MapFeatureModes
import com.here.sdk.mapview.MapFeatures
import com.here.sdk.mapview.MapImage
import com.here.sdk.mapview.MapImageFactory
import com.here.sdk.mapview.MapMarker
import com.here.sdk.mapview.MapMeasure
import com.here.sdk.mapview.MapMeasureDependentRenderSize
import com.here.sdk.mapview.MapPolyline
import com.here.sdk.mapview.MapScene
import com.here.sdk.mapview.MapScheme
import com.here.sdk.mapview.MapView
import com.here.sdk.mapview.RenderSize
import com.here.sdk.routing.CalculateRouteCallback
import com.here.sdk.routing.Route
import com.here.sdk.routing.RoutingEngine
import com.here.sdk.routing.RoutingError
import com.here.sdk.routing.TruckOptions
import com.here.sdk.routing.Waypoint

class HereMapView(context: Context) : FrameLayout(context) {

    companion object {
        private const val TAG          = "HereMapView"
        private const val DEFAULT_ZOOM = 14.0
        // Fixed pixel width for native drawRoute fallback
        private const val DEFAULT_ROUTE_WIDTH_PX = 26.0
        private const val DEFAULT_ROUTE_COLOR    = "#4285F4"

        // Side of the square hit-test box used when picking an embedded POI.
        private const val POI_PICK_BOX_PX = 48.0

        // ── Native-controlled marker size ────────────────────────────────────
        // On-screen pixel size for every JS-supplied marker image (source /
        // destination pins and the navigation truck). The rasterised PNG is
        // scaled to this on the native side, so the marker size is decided here
        // — NOT by whatever resolution the PNG happened to be captured at.
        // Tune this single value to make markers bigger / smaller.
        const val MARKER_IMAGE_SIZE_PX = 100

        /** Scales [src] so its longest side equals [target], preserving aspect ratio. */
        fun scaleToMarkerSize(src: Bitmap, target: Int = MARKER_IMAGE_SIZE_PX): Bitmap {
            val maxDim = maxOf(src.width, src.height)
            if (maxDim <= 0 || maxDim == target) return src
            val scale = target.toFloat() / maxDim
            val w = maxOf(1, Math.round(src.width * scale))
            val h = maxOf(1, Math.round(src.height * scale))
            return Bitmap.createScaledBitmap(src, w, h, true)
        }
    }

    /**
     * The HERE surface. Null until [attachMapView] succeeds.
     *
     * `MapView`'s constructor throws when the shared [SDKNativeEngine] does not
     * exist yet, and that used to escape `createViewInstance` and tear down the
     * whole React host. So the surface is created only once the engine is up;
     * until then this view is inert and reports the problem to JS.
     */
    private var _mapView: MapView? = null

    /** Non-null only after the surface is attached — see [isMapAttached]. */
    val mapView: MapView get() = _mapView!!

    fun isMapAttached(): Boolean = _mapView != null

    private var routingEngine:           RoutingEngine?            = null
    /**
     * The drawn route. A list rather than one line because traffic colouring
     * splits it into a piece per congestion band — a plain route is simply the
     * one-element case.
     */
    private val routePolylines                                     = mutableListOf<MapPolyline>()
    /**
     * Bumped every time the drawn route is replaced or cleared. Traffic arrives
     * from the network after the route is already on screen, so a late response
     * carries the generation it was asked for and is dropped if the route has
     * moved on since — otherwise clearing the map would be undone a second later
     * by traffic for a route the driver has left behind.
     */
    private var routeGeneration                                    = 0
    private val markers                                            = mutableListOf<MapMarker>()
    private var blueDotMarker:           MapMarker?                = null
    private var locationIndicator:       LocationIndicator?        = null
    private var navMarkerManager:        NavigationMarkerManager?  = null
    private var polylineManager:         PolylineManager?          = null
    private var navigationCameraManager: NavigationCameraManager?  = null

    /** Scheme currently applied — reported back to JS by [getMapScheme]. */
    private var currentScheme: MapScheme = MapScheme.NORMAL_DAY

    /** Map features (3D buildings, traffic…) survive a scene reload via this. */
    private val enabledFeatures = mutableMapOf<String, String>()

    // loadScene is async and resets scene state, so styling calls that arrive
    // before it completes are recorded and replayed rather than dropped.
    private var isSceneLoaded = false
    private var pendingScheme: MapScheme? = null

    /**
     * onDestroy arrives twice — once from the host lifecycle and once when React
     * drops the view — and the second `mapView.onDestroy()` crashes in the SDK.
     */
    private var isDestroyed = false

    /** Callbacks waiting for the current [loadScene] to finish. */
    private val sceneLoadCallbacks = mutableListOf<(String?) -> Unit>()

    // The helper managers all wrap the map surface, so they only exist once it
    // has been attached — every accessor is null until then.

    private fun polylines(): PolylineManager? {
        val map = _mapView ?: return null
        return polylineManager ?: PolylineManager(map).also { polylineManager = it }
    }

    private fun navMarkers(): NavigationMarkerManager? {
        val map = _mapView ?: return null
        return navMarkerManager ?: NavigationMarkerManager(map).also { mgr ->
            mgr.polylineManager = polylines()
            navMarkerManager    = mgr
        }
    }

    private fun navigationCamera(): NavigationCameraManager? {
        val map = _mapView ?: return null
        return navigationCameraManager
            ?: NavigationCameraManager(map).also { navigationCameraManager = it }
    }

    init {
        layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        attachMapView()
    }

    /**
     * Creates the HERE surface and runs its `onCreate` step. Safe to call more
     * than once; returns false while the SDK engine is still missing, which is
     * the "JS mounted the map before HereSdk.initialize() resolved" case.
     */
    fun attachMapView(): Boolean {
        if (_mapView != null) return true

        if (SDKNativeEngine.getSharedInstance() == null) {
            Log.w(TAG, "HERE SDK not initialised yet — map surface not created")
            emitEvent("topMapError", Arguments.createMap().apply {
                putString("code", "SDK_NOT_INITIALIZED")
                putString(
                    "message",
                    "HERE SDK is not initialised — call HereSdk.initialize() " +
                        "before mounting <HereMapView>"
                )
            })
            return false
        }

        return try {
            val view = MapView(context)
            view.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
            addView(view)
            view.onCreate(null)
            _mapView = view
            Log.d(TAG, "✅ HERE map surface attached")

            loadScene(MapScheme.NORMAL_DAY) { initRoutingEngine() }
            attachGestureListeners()
            // React mounts views into an already-resumed host, so no
            // onHostResume follows — resume here or the surface never renders.
            view.onResume()
            true
        } catch (e: Exception) {
            Log.e(TAG, "map surface creation failed: ${e.message}", e)
            emitEvent("topMapError", Arguments.createMap().apply {
                putString("code", "MAP_CREATE_FAILED")
                putString("message", e.message ?: "HERE MapView could not be created")
            })
            false
        }
    }

    /**
     * Loads a map scheme and re-applies everything the scene reset: the HERE
     * watermark position and any enabled map features (3D buildings, traffic…).
     */
    private fun loadScene(scheme: MapScheme, onLoaded: (() -> Unit)? = null) {
        val mapView = _mapView ?: return notifySceneLoaded("HERE map surface is not attached")
        mapView.mapScene.loadScene(scheme) { err ->
            if (err != null) {
                Log.e(TAG, "❌ Scene load error: $err")
                notifySceneLoaded(err.toString())
                return@loadScene
            }
            Log.d(TAG, "✅ Map scene loaded successfully")
            currentScheme = scheme
            MapView.setPrimaryLanguage(LanguageCode.EN_US)

            // Move the HERE watermark/logo to the vertical-centre of the map's
            // right edge (kept in sync with iOS's setWatermarkLocation). The
            // anchor (1.0, 0.5) is the right edge mid-height; the negative-x
            // offset pulls the logo inward so it isn't clipped off-screen.
            mapView.setWatermarkLocation(
                Anchor2D(1.0, 0.8),
                Point2D(-65.0, -40.0)
            )

            // Loading a scene clears the feature set, so restore it.
            isSceneLoaded = true
            if (enabledFeatures.isNotEmpty()) {
                mapView.mapScene.enableFeatures(enabledFeatures)
            }

            onLoaded?.invoke()
            notifySceneLoaded(null)

            // A scheme requested while this load was in flight wins.
            pendingScheme?.let { requested ->
                pendingScheme = null
                if (requested != currentScheme) loadScene(requested)
            }
        }
    }

    private fun notifySceneLoaded(error: String?) {
        val waiting = sceneLoadCallbacks.toList()
        sceneLoadCallbacks.clear()
        waiting.forEach { it(error) }
    }

    /**
     * Resolves once the map scene is renderable, optionally switching to
     * [schemeName] first. The view starts loading `NORMAL_DAY` in its
     * constructor, so this is really "tell me when the map is ready" — calling
     * it after the scene is already up completes immediately.
     *
     * [onResult] receives null on success or the SDK's error text on failure.
     */
    fun loadMap(schemeName: String?, onResult: (String?) -> Unit) {
        // A view mounted before HereSdk.initialize() finished has no surface —
        // now that JS is asking for the map, try again.
        if (!attachMapView()) {
            onResult("HERE SDK is not initialised — call HereSdk.initialize() first")
            return
        }

        val requested = schemeName?.let { parseMapScheme(it) }
        if (schemeName != null && requested == null) {
            onResult("Unknown map scheme: $schemeName")
            return
        }

        if (isSceneLoaded && (requested == null || requested == currentScheme)) {
            onResult(null)
            return
        }

        sceneLoadCallbacks.add(onResult)
        when {
            // A load is already in flight — the callback above rides along with it.
            !isSceneLoaded -> requested?.let { pendingScheme = it }
            else -> loadScene(requested!!)
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────────────────

    fun onResume()  {
        if (isDestroyed) return
        val mapView = _mapView ?: return
        Log.d(TAG, "onResume called")
        mapView.onResume()
    }
    fun onPause()   {
        if (isDestroyed) return
        val mapView = _mapView ?: return
        Log.d(TAG, "onPause called")
        mapView.onPause()
    }
    fun onDestroy() {
        if (isDestroyed) return
        isDestroyed = true
        val mapView = _mapView ?: return
        Log.d(TAG, "onDestroy called")
        // Navigation renders into this MapView — it has to let go before the
        // native surface is torn down.
        HereNavigationModule.instance?.onMapViewDestroyed(this)
        sceneLoadCallbacks.clear()
        locationIndicator?.disable()
        clearBlueDot()
        navMarkerManager?.remove()
        polylineManager?.clear()
        navigationCameraManager?.reset()
        mapView.onDestroy()
        _mapView = null
    }

    /** False once the native surface has been torn down — never draw after this. */
    fun isAlive(): Boolean = !isDestroyed

    // ─────────────────────────────────────────────────────────────────────────
    // Camera
    // ─────────────────────────────────────────────────────────────────────────

    fun moveCamera(
        lat: Double, lng: Double,
        zoomLevel: Double = DEFAULT_ZOOM,
        bearing: Double = 0.0, tilt: Double = 0.0,
        animate: Boolean = false, animationDurationMs: Int = 800
    ) {
        val mapView = _mapView ?: return
        Log.d(TAG, "moveCamera: lat=$lat, lng=$lng, zoom=$zoomLevel, animate=$animate")
        val target      = GeoCoordinates(lat, lng)
        val measure     = MapMeasure(MapMeasure.Kind.DISTANCE_IN_METERS, zoomLevelToDistance(zoomLevel))
        val orientation = GeoOrientationUpdate(bearing, tilt)
        if (animate && animationDurationMs > 0) {
            try {
                mapView.camera.startAnimation(
                    MapCameraAnimationFactory.flyTo(
                        GeoCoordinatesUpdate(lat, lng), orientation, measure,
                        0.0, Duration.ofMillis(animationDurationMs.toLong())
                    )
                )
                Log.d(TAG, "✅ Camera animation started")
            } catch (e: Exception) {
                Log.w(TAG, "flyTo failed, fallback: ${e.message}")
                mapView.camera.lookAt(target, orientation, measure)
            }
        } else {
            mapView.camera.lookAt(target, orientation, measure)
            Log.d(TAG, "✅ Camera positioned")
        }
    }

    /** Centres the map without animating — the plain "go here" camera call. */
    fun setCenter(lat: Double, lng: Double, zoomLevel: Double = DEFAULT_ZOOM) =
        moveCamera(lat, lng, zoomLevel, animate = false)

    private fun zoomLevelToDistance(zoom: Double): Double {
        val z = zoom.coerceIn(3.0, 22.0)
        return (40_000_000.0 / Math.pow(2.0, z)).coerceAtMost(5_000_000.0)
    }

    /** Live camera orientation/position — JS uses it to drive the compass button. */
    fun getCameraState(): Map<String, Double> {
        val mapView = _mapView ?: return emptyMap()
        val s = mapView.camera.state
        return mapOf(
            "lat" to s.targetCoordinates.latitude,
            "lng" to s.targetCoordinates.longitude,
            "bearing" to s.orientationAtTarget.bearing,
            "tilt" to s.orientationAtTarget.tilt,
            "distanceMeters" to s.distanceToTargetInMeters
        )
    }

    /** Animate the map back to north-up (bearing 0, tilt 0), keeping target + zoom. */
    fun resetNorth() {
        val mapView = _mapView ?: return
        val s = mapView.camera.state
        val target      = GeoCoordinatesUpdate(s.targetCoordinates.latitude, s.targetCoordinates.longitude)
        val measure     = MapMeasure(MapMeasure.Kind.DISTANCE_IN_METERS, s.distanceToTargetInMeters)
        val orientation = GeoOrientationUpdate(0.0, 0.0)
        try {
            mapView.camera.startAnimation(
                MapCameraAnimationFactory.flyTo(target, orientation, measure, 0.0, Duration.ofMillis(400))
            )
        } catch (e: Exception) {
            Log.w(TAG, "resetNorth flyTo failed, fallback: ${e.message}")
            mapView.camera.lookAt(s.targetCoordinates, orientation, measure)
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Map styling — the schemes the Explore edition ships with
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Switches the map style. Accepts the [MapScheme] enum names in any case
     * and hyphen/camel form, e.g. "satellite", "hybridDay", "LOGISTICS_NIGHT".
     * Returns false when the name matches no scheme (the map is left as-is).
     */
    fun setMapScheme(name: String): Boolean {
        val scheme = parseMapScheme(name) ?: run {
            Log.w(TAG, "unknown map scheme '$name'")
            return false
        }
        if (!isSceneLoaded) {
            // The initial loadScene is still running — queue instead of racing it.
            pendingScheme = scheme
            return true
        }
        if (scheme == currentScheme) return true
        loadScene(scheme)
        return true
    }

    fun getMapScheme(): String = currentScheme.name

    private fun parseMapScheme(name: String): MapScheme? {
        // "hybridDay" / "hybrid-day" / "HYBRID_DAY" all match HYBRID_DAY —
        // compare on letters and digits only, case-insensitively.
        val target = name.filter { it.isLetterOrDigit() }.lowercase()
        if (target.isEmpty()) return null
        return MapScheme.values().firstOrNull {
            it.name.replace("_", "").lowercase() == target
        }
    }

    /**
     * Toggles map features. [enable] maps a [MapFeatures] key to a
     * [MapFeatureModes] value; [disable] is a plain list of feature keys.
     * `EXTRUDED_BUILDINGS` is what turns on 3D building rendering.
     */
    fun setMapFeatures(enable: Map<String, String>, disable: List<String>) {
        // Record first: props can arrive before the surface exists (JS mounted
        // the map before the SDK came up), and the recorded set is what
        // loadScene replays once it does.
        disable.forEach { enabledFeatures.remove(it) }
        enabledFeatures.putAll(enable)

        val mapView = _mapView ?: return

        // Before the scene is ready there is nothing to toggle — the recorded
        // set is applied by loadScene instead.
        if (!isSceneLoaded) return

        if (disable.isNotEmpty()) mapView.mapScene.disableFeatures(disable)
        if (enable.isNotEmpty()) mapView.mapScene.enableFeatures(enable)
    }

    /** Convenience toggle for 3D buildings + the shadows that sell the effect. */
    fun set3DBuildingsEnabled(enabled: Boolean) {
        if (enabled) {
            setMapFeatures(
                mapOf(
                    MapFeatures.EXTRUDED_BUILDINGS to MapFeatureModes.EXTRUDED_BUILDINGS_ALL,
                    MapFeatures.SHADOWS to MapFeatureModes.SHADOWS_ALL
                ),
                emptyList()
            )
        } else {
            setMapFeatures(
                emptyMap(),
                listOf(MapFeatures.EXTRUDED_BUILDINGS, MapFeatures.SHADOWS)
            )
        }
    }

    /**
     * Live traffic flow — the coloured congestion lines HERE draws over the
     * road network (green free-flow through to dark red standstill).
     * `TRAFFIC_FLOW_WITH_FREE_FLOW` keeps the green so an empty road reads as
     * "checked and clear" rather than "no data".
     */
    fun setTrafficFlowEnabled(enabled: Boolean) {
        if (enabled) {
            setMapFeatures(
                mapOf(MapFeatures.TRAFFIC_FLOW to MapFeatureModes.TRAFFIC_FLOW_WITH_FREE_FLOW),
                emptyList()
            )
        } else {
            setMapFeatures(emptyMap(), listOf(MapFeatures.TRAFFIC_FLOW))
        }
    }

    /** Accident / closure / roadworks icons on the map. */
    fun setTrafficIncidentsEnabled(enabled: Boolean) {
        if (enabled) {
            setMapFeatures(
                mapOf(MapFeatures.TRAFFIC_INCIDENTS to MapFeatureModes.TRAFFIC_INCIDENTS_ALL),
                emptyList()
            )
        } else {
            setMapFeatures(emptyMap(), listOf(MapFeatures.TRAFFIC_INCIDENTS))
        }
    }

    /** The feature keys/modes this SDK build supports — handy for debugging. */
    fun getSupportedMapFeatures(): Map<String, List<String>> =
        _mapView?.mapScene?.supportedFeatures ?: emptyMap()

    // ─────────────────────────────────────────────────────────────────────────
    // Map interaction — tap / long-press, including embedded POIs
    // ─────────────────────────────────────────────────────────────────────────

    private fun attachGestureListeners() {
        val mapView = _mapView ?: return
        mapView.gestures.tapListener = TapListener { point ->
            emitTouchEvent("topMapTap", point)
            pickPlaceAt(point) { picked ->
                if (picked != null) emitPoiEvent(picked, point)
            }
        }

        mapView.gestures.longPressListener = LongPressListener { state, point ->
            if (state == GestureState.BEGIN) emitTouchEvent("topMapLongPress", point)
        }

        // While guidance runs, the navigator re-applies its follow camera on
        // every location fix — which silently undoes any pan, pinch or rotate
        // the driver makes. This listener reports that they have taken the
        // camera over so the navigator can let go of it; the re-centre button
        // hands it back. It is a listener, not a gesture handler, so the map's
        // own default pan/zoom behaviour is untouched.
        mapView.gestures.mapInteractionListener =
            MapInteractionListener { gestureType, state ->
                if (state != MapInteractionState.BEGIN) return@MapInteractionListener
                if (gestureType == GestureType.PAN ||
                    gestureType == GestureType.PINCH_ROTATE ||
                    gestureType == GestureType.TWO_FINGER_PAN ||
                    gestureType == GestureType.DOUBLE_TAP
                ) {
                    HereNavigationModule.instance?.onUserTookCamera(this)
                }
            }
    }

    /**
     * Picks the embedded (carto) POI under a screen point. HERE returns these
     * as a lightweight [com.here.sdk.core.PickedPlace]; JS can hand the id back
     * to the search engine for full details.
     */
    private fun pickPlaceAt(point: Point2D, callback: (com.here.sdk.core.PickedPlace?) -> Unit) {
        val mapView = _mapView ?: return callback(null)
        try {
            // A small box around the finger — a 1px hit test almost never lands
            // on the POI icon itself.
            val size = POI_PICK_BOX_PX
            val origin = Point2D(point.x - size / 2, point.y - size / 2)
            val filter = MapScene.MapPickFilter(
                listOf(MapScene.MapPickFilter.ContentType.MAP_CONTENT)
            )
            mapView.pick(filter, Rectangle2D(origin, Size2D(size, size))) { result ->
                callback(result?.mapContent?.pickedPlaces?.firstOrNull())
            }
        } catch (e: Exception) {
            Log.w(TAG, "pickPlaceAt failed: ${e.message}")
            callback(null)
        }
    }

    private fun emitTouchEvent(eventName: String, point: Point2D) {
        val coords = _mapView?.viewToGeoCoordinates(point) ?: return
        emitEvent(eventName, Arguments.createMap().apply {
            putDouble("latitude", coords.latitude)
            putDouble("longitude", coords.longitude)
            putDouble("x", point.x)
            putDouble("y", point.y)
        })
    }

    private fun emitPoiEvent(picked: com.here.sdk.core.PickedPlace, point: Point2D) {
        emitEvent("topPoiTap", Arguments.createMap().apply {
            putString("name", picked.name)
            putString("categoryId", picked.placeCategoryId)
            picked.coordinates?.let {
                putDouble("latitude", it.latitude)
                putDouble("longitude", it.longitude)
            }
            putDouble("x", point.x)
            putDouble("y", point.y)
        })
    }

    private fun emitEvent(eventName: String, payload: WritableMap) {
        val reactContext = context as? ReactContext ?: return
        val dispatcher = UIManagerHelper.getEventDispatcherForReactTag(reactContext, id) ?: return
        dispatcher.dispatchEvent(
            HereMapEvent(UIManagerHelper.getSurfaceId(reactContext), id, eventName, payload)
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Markers
    // ─────────────────────────────────────────────────────────────────────────

    fun addMarker(
        lat: Double, lng: Double,
        colorHex: String = "#FF0000",
        imageBase64: String? = null,
        markerSizePx: Int? = null
    ) {
        val mapView = _mapView ?: return
        val customImage = decodeMarkerImage(imageBase64, markerSizePx)
        val m = if (customImage != null) {
            // JS-supplied teardrop pin → anchor at the bottom-centre tip.
            MapMarker(GeoCoordinates(lat, lng), customImage, Anchor2D(0.5, 1.0))
        } else {
            MapMarker(
                GeoCoordinates(lat, lng),
                MapImageFactory.fromResource(context.resources, android.R.drawable.ic_menu_mylocation)
            )
        }
        mapView.mapScene.addMapMarker(m)
        markers.add(m)
    }

    /** Decodes a base64 PNG (optionally data-URI prefixed) into a HERE MapImage. */
    private fun decodeMarkerImage(base64: String?, markerSizePx: Int? = null): MapImage? {
        if (base64.isNullOrEmpty()) return null
        return try {
            val clean = base64.substringAfter(",", base64)
            val bytes = Base64.decode(clean, Base64.DEFAULT)
            val bmp = BitmapFactory.decodeByteArray(bytes, 0, bytes.size) ?: return null
            // Honor the JS-requested size; fall back to the native default.
            val target = markerSizePx ?: MARKER_IMAGE_SIZE_PX
            MapImageFactory.fromBitmap(scaleToMarkerSize(bmp, target))
        } catch (e: Exception) {
            Log.e(TAG, "decodeMarkerImage failed: ${e.message}"); null
        }
    }

    fun clearMarkers() {
        val mapView = _mapView ?: return
        markers.forEach { mapView.mapScene.removeMapMarker(it) }
        markers.clear()
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Location indicator
    // ─────────────────────────────────────────────────────────────────────────

    fun showCurrentLocation(
        lat: Double,
        lng: Double,
        bearing: Double = 0.0,
        style: String = "navigation"
    ) {
        val mapView = _mapView ?: return
        // "pedestrian" → solid blue dot marker, "navigation" → green direction arrow.
        if (style.equals("pedestrian", ignoreCase = true)) {
            showBlueDot(lat, lng)
            return
        }

        // NAVIGATION uses HERE's built-in arrow indicator; drop any blue dot first.
        clearBlueDot()
        if (locationIndicator == null) {
            locationIndicator = LocationIndicator().also {
                it.locationIndicatorStyle = LocationIndicator.IndicatorStyle.NAVIGATION
                it.enable(mapView)
            }
        } else {
            locationIndicator!!.locationIndicatorStyle = LocationIndicator.IndicatorStyle.NAVIGATION
        }
        locationIndicator!!.updateLocation(Location(GeoCoordinates(lat, lng)).also {
            it.bearingInDegrees = bearing
        })
    }

    /** Solid blue location dot drawn natively, shown as a centre-anchored marker. */
    private fun showBlueDot(lat: Double, lng: Double) {
        val mapView = _mapView ?: return
        // The built-in NAVIGATION indicator and the blue dot are mutually exclusive.
        locationIndicator?.disable()
        locationIndicator = null

        val coords = GeoCoordinates(lat, lng)
        blueDotMarker?.let { it.coordinates = coords; return }

        val marker = MapMarker(coords, MapImageFactory.fromBitmap(makeBlueDotBitmap()), Anchor2D(0.5, 0.5))
        mapView.mapScene.addMapMarker(marker)
        blueDotMarker = marker
    }

    private fun clearBlueDot() {
        blueDotMarker?.let { marker -> _mapView?.mapScene?.removeMapMarker(marker) }
        blueDotMarker = null
    }

    /** Draws a blue filled circle with a white ring — the classic "you are here" dot. */
    private fun makeBlueDotBitmap(sizePx: Int = 48): Bitmap {
        val bmp = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bmp)
        val cx = sizePx / 2f
        val cy = sizePx / 2f
        val paint = Paint(Paint.ANTI_ALIAS_FLAG)
        // White outer ring.
        paint.color = AndroidColor.WHITE
        canvas.drawCircle(cx, cy, sizePx * 0.5f, paint)
        // Blue core.
        paint.color = AndroidColor.rgb(66, 133, 244) // Google-blue #4285F4
        canvas.drawCircle(cx, cy, sizePx * 0.38f, paint)
        return bmp
    }

    fun hideCurrentLocation() {
        locationIndicator?.disable()
        locationIndicator = null
        clearBlueDot()
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Routes
    // ─────────────────────────────────────────────────────────────────────────

    private fun initRoutingEngine() {
        try { routingEngine = RoutingEngine() }
        catch (e: Exception) { Log.e(TAG, "RoutingEngine init failed: ${e.message}") }
    }

    fun drawRoute(
        originLat: Double, originLng: Double, destLat: Double, destLng: Double,
        onSuccess: ((Double, Double) -> Unit)? = null,
        onError:   ((String) -> Unit)?         = null
    ) {
        val engine = routingEngine ?: run { onError?.invoke("RoutingEngine not ready"); return }
        engine.calculateRoute(
            listOf(
                Waypoint(GeoCoordinates(originLat, originLng)),
                Waypoint(GeoCoordinates(destLat, destLng))
            ),
            TruckOptions(),
            object : CalculateRouteCallback {
                override fun onRouteCalculated(error: RoutingError?, routes: List<Route>?) {
                    if (error != null) { onError?.invoke(error.toString()); return }
                    val r = routes?.firstOrNull() ?: run { onError?.invoke("No routes"); return }
                    val (distanceMeters, durationSeconds) = renderRoute(r)
                    onSuccess?.invoke(distanceMeters, durationSeconds)
                }
            }
        )
    }

    private fun renderRoute(route: Route): Pair<Double, Double> {
        drawRouteGeometry(route.geometry.vertices, DEFAULT_ROUTE_COLOR, DEFAULT_ROUTE_WIDTH_PX)
        return Pair(route.lengthInMeters.toDouble(), route.duration.seconds.toDouble())
    }

    /**
     * Draws route geometry that was calculated elsewhere — the vertices returned
     * by [HereRoutingModule], or a stored route resolved from [RouteStore].
     *
     * Replaces whatever [drawRoute]/[drawRouteGeometry] drew before, so
     * [clearRoute] removes it either way.
     */
    fun drawRouteGeometry(
        vertices: List<GeoCoordinates>,
        colorHex: String = DEFAULT_ROUTE_COLOR,
        widthPx: Double = DEFAULT_ROUTE_WIDTH_PX
    ) {
        if (isDestroyed || vertices.size < 2) return
        removeRoutePolylines()
        addRoutePolyline(vertices, colorHex, widthPx)
    }

    /**
     * Redraws the route as congestion-coloured pieces — blue where it is flowing,
     * yellow where it is slow, red where it is heavy (see [TrafficRouteColoring]).
     *
     * [generation] is the value [routeGeneration] had when the traffic was
     * requested; a mismatch means the route has since been replaced or cleared,
     * so the stale colouring is dropped rather than drawn over the new route.
     */
    fun drawRouteSegments(
        segments: List<TrafficRouteColoring.Segment>,
        widthPx: Double = DEFAULT_ROUTE_WIDTH_PX,
        generation: Int
    ) {
        if (isDestroyed || segments.isEmpty()) return
        if (generation != routeGeneration) return

        removeRoutePolylines()
        // Keep the generation: this is the same route, only better coloured.
        routeGeneration = generation
        segments.forEach { addRoutePolyline(it.coordinates, it.colorHex, widthPx) }
    }

    /** The generation a traffic request should quote back to [drawRouteSegments]. */
    fun routeGeneration(): Int = routeGeneration

    private fun addRoutePolyline(
        vertices: List<GeoCoordinates>,
        colorHex: String,
        widthPx: Double
    ) {
        val mapView = _mapView ?: return
        if (vertices.size < 2) return

        val fill = parseColor(colorHex)
        val polyline = try {
            MapPolyline(
                GeoPolyline(vertices),
                MapPolyline.SolidRepresentation(
                    // PIXELS, not density-independent: the route keeps the same
                    // on-screen thickness on every device.
                    MapMeasureDependentRenderSize(RenderSize.Unit.PIXELS, widthPx),
                    fill,
                    MapMeasureDependentRenderSize(RenderSize.Unit.PIXELS, widthPx * 0.15),
                    darken(fill),
                    LineCap.ROUND
                )
            )
        } catch (e: Exception) {
            Log.w(TAG, "route polyline could not be built: ${e.message}")
            return
        }
        mapView.mapScene.addMapPolyline(polyline)
        routePolylines.add(polyline)
    }

    fun clearRoute() {
        removeRoutePolylines()
    }

    /** Takes every drawn route piece off the map and invalidates in-flight traffic. */
    private fun removeRoutePolylines() {
        val scene = _mapView?.mapScene
        routePolylines.forEach { line -> scene?.removeMapPolyline(line) }
        routePolylines.clear()
        routeGeneration++
    }

    /** "#RRGGBB" / "#AARRGGBB" → HERE colour, falling back to the route blue. */
    private fun parseColor(hex: String): HereColor = try {
        HereColor.valueOf(AndroidColor.parseColor(hex))
    } catch (e: IllegalArgumentException) {
        Log.w(TAG, "unparseable colour '$hex', using default")
        HereColor.valueOf(AndroidColor.parseColor(DEFAULT_ROUTE_COLOR))
    }

    /** Outline colour — the fill at 60% brightness reads as a border at any hue. */
    private fun darken(color: HereColor): HereColor =
        HereColor.valueOf(
            color.red() * 0.6f,
            color.green() * 0.6f,
            color.blue() * 0.6f,
            color.alpha()
        )

    // ─────────────────────────────────────────────────────────────────────────
    // Navigation marker
    // ─────────────────────────────────────────────────────────────────────────

    fun updateNavigationMarker(
        lat: Double, lng: Double, bearing: Double, durationMs: Int,
        markerSize: Int? = null, iconAsset: String? = null,
        segmentIndex: Int = -1, iconImageBase64: String? = null
    ) {
        if (locationIndicator != null) { locationIndicator!!.disable(); locationIndicator = null }
        navMarkers()?.update(lat, lng, bearing, durationMs, markerSize, iconAsset, segmentIndex, iconImageBase64)
    }

    fun updateNavigationCamera(
        lat: Double, lng: Double, bearing: Double,
        speedMps: Double?, animationDurationMs: Int, forceInstant: Boolean
    ) { navigationCamera()?.update(lat, lng, bearing, speedMps, animationDurationMs, forceInstant) }

    fun resetNavigationCamera()  { navigationCameraManager?.reset() }
    fun removeNavigationMarker() { navMarkerManager?.remove() }

    // ─────────────────────────────────────────────────────────────────────────
    // Navigation polyline
    // ─────────────────────────────────────────────────────────────────────────

    fun drawPolyline(coordinates: List<GeoCoordinates>, color: String, width: Double) {
        polylines()?.draw(coordinates, color, width) ?: return
        navMarkerManager?.polylineManager = polylineManager
    }

    fun trimPolyline(
        trimIndex: Int, trimFraction: Double,
        splitLat: Double?, splitLng: Double?, speedMps: Double?
    ) {
        polylineManager?.trim(trimIndex, trimFraction, splitLat, splitLng, speedMps)
        if (splitLat != null && splitLng != null) {
            navMarkerManager?.onTrimReceived(trimIndex, splitLat, splitLng)
        }
    }

    fun clearPolyline() {
        polylineManager?.clear()
        polylineManager = null
        navMarkerManager?.polylineManager = null
    }
}