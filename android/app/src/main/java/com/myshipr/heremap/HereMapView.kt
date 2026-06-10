package com.myshipr.heremap

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import android.widget.FrameLayout
import android.util.Log
import com.here.sdk.core.Anchor2D
import com.here.sdk.core.Color as HereColor
import com.here.sdk.core.GeoCoordinates
import com.here.sdk.core.GeoCoordinatesUpdate
import com.here.sdk.core.GeoOrientationUpdate
import com.here.sdk.core.GeoPolyline
import com.here.sdk.core.LanguageCode
import com.here.sdk.core.Location
import com.here.sdk.mapview.LineCap
import com.here.sdk.mapview.MapCameraAnimationFactory
import com.here.time.Duration
import com.here.sdk.mapview.LocationIndicator
import com.here.sdk.mapview.MapImage
import com.here.sdk.mapview.MapImageFactory
import com.here.sdk.mapview.MapMarker
import com.here.sdk.mapview.MapMeasure
import com.here.sdk.mapview.MapMeasureDependentRenderSize
import com.here.sdk.mapview.MapPolyline
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

    val mapView: MapView = MapView(context)

    private var routingEngine:           RoutingEngine?            = null
    private var currentPolyline:         MapPolyline?              = null
    private val markers                                            = mutableListOf<MapMarker>()
    private var locationIndicator:       LocationIndicator?        = null
    private var navMarkerManager:        NavigationMarkerManager?  = null
    private var polylineManager:         PolylineManager?          = null
    private var navigationCameraManager: NavigationCameraManager?  = null

    private fun polylines(): PolylineManager =
        polylineManager ?: PolylineManager(mapView).also { polylineManager = it }

    private fun navMarkers(): NavigationMarkerManager =
        navMarkerManager ?: NavigationMarkerManager(mapView).also { mgr ->
            mgr.polylineManager = polylines()
            navMarkerManager    = mgr
        }

    private fun navigationCamera(): NavigationCameraManager =
        navigationCameraManager
            ?: NavigationCameraManager(mapView).also { navigationCameraManager = it }

    init {
        layoutParams         = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        mapView.layoutParams = LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT)
        addView(mapView)
        
        Log.d(TAG, "✅ HereMapView initialized")
        Log.d(TAG, "✅ MapView added to hierarchy with MATCH_PARENT layout")
        
        // Call onCreate with null SavedInstanceState
        mapView.onCreate(null)
        Log.d(TAG, "✅ mapView.onCreate() called")
        
        // Load map scene
        mapView.mapScene.loadScene(MapScheme.NORMAL_DAY) { err ->
            if (err != null) {
                Log.e(TAG, "❌ Scene load error: $err")
                return@loadScene
            }
            Log.d(TAG, "✅ Map scene loaded successfully")
            MapView.setPrimaryLanguage(LanguageCode.EN_US)
            initRoutingEngine()
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────────────────

    fun onResume()  {
        Log.d(TAG, "onResume called")
        mapView.onResume()
    }
    fun onPause()   {
        Log.d(TAG, "onPause called")
        mapView.onPause()
    }
    fun onDestroy() {
        Log.d(TAG, "onDestroy called")
        locationIndicator?.disable()
        navMarkerManager?.remove()
        polylineManager?.clear()
        navigationCameraManager?.reset()
        mapView.onDestroy()
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Camera
    // ─────────────────────────────────────────────────────────────────────────

    fun moveCamera(
        lat: Double, lng: Double,
        zoomLevel: Double = DEFAULT_ZOOM,
        bearing: Double = 0.0, tilt: Double = 0.0,
        animate: Boolean = false, animationDurationMs: Int = 800
    ) {
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

    private fun zoomLevelToDistance(zoom: Double): Double {
        val z = zoom.coerceIn(3.0, 22.0)
        return (40_000_000.0 / Math.pow(2.0, z)).coerceAtMost(5_000_000.0)
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
        markers.forEach { mapView.mapScene.removeMapMarker(it) }
        markers.clear()
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Location indicator
    // ─────────────────────────────────────────────────────────────────────────

    fun showCurrentLocation(lat: Double, lng: Double, bearing: Double = 0.0) {
        if (locationIndicator == null) {
            locationIndicator = LocationIndicator().also {
                it.locationIndicatorStyle = LocationIndicator.IndicatorStyle.NAVIGATION
                it.enable(mapView)
            }
        }
        locationIndicator!!.updateLocation(Location(GeoCoordinates(lat, lng)).also {
            it.bearingInDegrees = bearing
        })
    }

    fun hideCurrentLocation() {
        locationIndicator?.disable()
        locationIndicator = null
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
                    onSuccess?.invoke(renderRoute(r).first, renderRoute(r).second)
                }
            }
        )
    }

    private fun renderRoute(route: Route): Pair<Double, Double> {
        currentPolyline?.let { mapView.mapScene.removeMapPolyline(it) }
        // FIX: was hardcoded 10.0 DIP — now 16px fixed
        currentPolyline = MapPolyline(
            GeoPolyline(route.geometry.vertices),
            MapPolyline.SolidRepresentation(
                MapMeasureDependentRenderSize(
                    RenderSize.Unit.PIXELS,          // ✅ PIXELS not DENSITY_INDEPENDENT_PIXELS
                    DEFAULT_ROUTE_WIDTH_PX
                ),
                HereColor.valueOf(0.259f, 0.522f, 0.957f, 1.0f),
                MapMeasureDependentRenderSize(
                    RenderSize.Unit.PIXELS,          // ✅ PIXELS not DENSITY_INDEPENDENT_PIXELS
                    DEFAULT_ROUTE_WIDTH_PX * 0.15
                ),
                HereColor.valueOf(0.0f, 0.3f, 0.8f, 1.0f),
                LineCap.ROUND
            )
        )
        mapView.mapScene.addMapPolyline(currentPolyline!!)
        return Pair(route.lengthInMeters.toDouble(), route.duration.seconds.toDouble())
    }

    fun clearRoute() {
        currentPolyline?.let { mapView.mapScene.removeMapPolyline(it); currentPolyline = null }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Navigation marker
    // ─────────────────────────────────────────────────────────────────────────

    fun updateNavigationMarker(
        lat: Double, lng: Double, bearing: Double, durationMs: Int,
        markerSize: Int? = null, iconAsset: String? = null,
        segmentIndex: Int = -1, iconImageBase64: String? = null
    ) {
        if (locationIndicator != null) { locationIndicator!!.disable(); locationIndicator = null }
        navMarkers().update(lat, lng, bearing, durationMs, markerSize, iconAsset, segmentIndex, iconImageBase64)
    }

    fun updateNavigationCamera(
        lat: Double, lng: Double, bearing: Double,
        speedMps: Double?, animationDurationMs: Int, forceInstant: Boolean
    ) = navigationCamera().update(lat, lng, bearing, speedMps, animationDurationMs, forceInstant)

    fun resetNavigationCamera()  { navigationCameraManager?.reset() }
    fun removeNavigationMarker() { navMarkerManager?.remove() }

    // ─────────────────────────────────────────────────────────────────────────
    // Navigation polyline
    // ─────────────────────────────────────────────────────────────────────────

    fun drawPolyline(coordinates: List<GeoCoordinates>, color: String, width: Double) {
        polylines().draw(coordinates, color, width)
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