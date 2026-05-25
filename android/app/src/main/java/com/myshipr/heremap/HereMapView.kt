package com.myshipr.heremap

import android.content.Context
import android.widget.FrameLayout
import android.util.Log
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
        private const val TAG = "HereMapView"
        private const val DEFAULT_ZOOM = 14.0
    }

    val mapView: MapView = MapView(context)

    private var routingEngine: RoutingEngine? = null
    private var currentPolyline: MapPolyline? = null
    private val markers = mutableListOf<MapMarker>()
    private var locationIndicator: LocationIndicator? = null

    // Navigation marker + polyline managers (created on first use)
    private var navMarkerManager: NavigationMarkerManager? = null
    private var polylineManager: PolylineManager? = null
    private var navigationCameraManager: NavigationCameraManager? = null

    private fun navMarkers() = navMarkerManager
        ?: NavigationMarkerManager(mapView).also { navMarkerManager = it }

    private fun polylines() = polylineManager
        ?: PolylineManager(mapView).also { polylineManager = it }

    private fun navigationCamera() = navigationCameraManager
        ?: NavigationCameraManager(mapView).also { navigationCameraManager = it }

    init {
        layoutParams = LayoutParams(
            LayoutParams.MATCH_PARENT,
            LayoutParams.MATCH_PARENT
        )
        mapView.layoutParams = LayoutParams(
            LayoutParams.MATCH_PARENT,
            LayoutParams.MATCH_PARENT
        )
        addView(mapView)

        mapView.onCreate(null)

        mapView.mapScene.loadScene(MapScheme.NORMAL_DAY) { mapError ->
            if (mapError != null) {
                Log.e(TAG, "Map scene load error: $mapError")
                return@loadScene
            }
            Log.d(TAG, "Map scene loaded successfully")
            // Force English labels regardless of device locale
            MapView.setPrimaryLanguage(LanguageCode.EN_US)
            initRoutingEngine()
        }
    }

    // -------------------------------------------------------------------------
    // Lifecycle – call these from the Activity / Fragment
    // -------------------------------------------------------------------------

    fun onResume() = mapView.onResume()
    fun onPause() = mapView.onPause()
    fun onDestroy() {
        locationIndicator?.disable()
        navMarkerManager?.remove()
        polylineManager?.clear()
        navigationCameraManager?.reset()
        mapView.onDestroy()
    }

    // -------------------------------------------------------------------------
    // Camera
    // -------------------------------------------------------------------------

    fun moveCamera(
        lat: Double,
        lng: Double,
        zoomLevel: Double = DEFAULT_ZOOM,
        bearing: Double = 0.0,
        tilt: Double = 0.0,
        animate: Boolean = false,
        animationDurationMs: Int = 800
    ) {
        val target = GeoCoordinates(lat, lng)
        val distanceInMeters = zoomLevelToDistance(zoomLevel)
        val measure = MapMeasure(MapMeasure.Kind.DISTANCE_IN_METERS, distanceInMeters)
        val orientation = GeoOrientationUpdate(bearing, tilt)

        if (animate && animationDurationMs > 0) {
            try {
                // flyTo(coordsUpdate, orientUpdate, mapMeasure, bowFactor, duration)
                // bowFactor=0 → flat movement like Google Maps (no arc)
                val animation = MapCameraAnimationFactory.flyTo(
                    GeoCoordinatesUpdate(lat, lng),
                    orientation,
                    measure,
                    0.0,
                    Duration.ofMillis(animationDurationMs.toLong())
                )
                mapView.camera.startAnimation(animation)
            } catch (e: Exception) {
                Log.w(TAG, "flyTo animation failed, falling back to lookAt: ${e.message}")
                mapView.camera.lookAt(target, orientation, measure)
            }
        } else {
            mapView.camera.lookAt(target, orientation, measure)
        }
    }

    private fun zoomLevelToDistance(zoom: Double): Double {
        // Clamp zoom so the camera never pulls back far enough to show the globe.
        // zoom 3 → ~5000 km (continent view) is the maximum we allow.
        val safeZoom = zoom.coerceIn(3.0, 22.0)
        return (40_000_000.0 / Math.pow(2.0, safeZoom)).coerceAtMost(5_000_000.0)
    }

    // -------------------------------------------------------------------------
    // Markers
    // -------------------------------------------------------------------------

    fun addMarker(lat: Double, lng: Double, colorHex: String = "#FF0000") {
        val coords = GeoCoordinates(lat, lng)
        val image: MapImage = MapImageFactory.fromResource(
            context.resources,
            android.R.drawable.ic_menu_mylocation
        )
        val marker = MapMarker(coords, image)
        mapView.mapScene.addMapMarker(marker)
        markers.add(marker)
    }

    fun clearMarkers() {
        markers.forEach { mapView.mapScene.removeMapMarker(it) }
        markers.clear()
    }

    // -------------------------------------------------------------------------
    // Location Indicator (blue dot)
    // -------------------------------------------------------------------------

    fun showCurrentLocation(lat: Double, lng: Double, bearing: Double = 0.0) {
        val coords = GeoCoordinates(lat, lng)
        if (locationIndicator == null) {
            locationIndicator = LocationIndicator()
            locationIndicator!!.locationIndicatorStyle =
                LocationIndicator.IndicatorStyle.NAVIGATION
            locationIndicator!!.enable(mapView)
        }
        val location = Location(coords)
        // Set bearing so the arrow points in the direction of travel
        location.bearingInDegrees = bearing
        locationIndicator!!.updateLocation(location)
        // NOTE: Camera is intentionally NOT moved here.
        // JS controls camera position/zoom/tilt during navigation.
    }

    /**
     * Disable and remove the HERE SDK default location indicator (blue dot +
     * accuracy ring). Call this when the custom navigation arrow marker takes
     * over so both indicators don't appear simultaneously.
     */
    fun hideCurrentLocation() {
        locationIndicator?.disable()
        locationIndicator = null
        Log.d(TAG, "hideCurrentLocation: LocationIndicator disabled")
    }

    // -------------------------------------------------------------------------
    // Routes
    // -------------------------------------------------------------------------

    private fun initRoutingEngine() {
        try {
            routingEngine = RoutingEngine()
        } catch (e: Exception) {
            Log.e(TAG, "RoutingEngine init failed: ${e.message}")
        }
    }

    /**
     * Draw a route between two coordinates using HERE Truck routing.
     */
    fun drawRoute(
        originLat: Double,
        originLng: Double,
        destLat: Double,
        destLng: Double,
        onSuccess: ((Double, Double) -> Unit)? = null,
        onError: ((String) -> Unit)? = null
    ) {
        val engine = routingEngine
        if (engine == null) {
            onError?.invoke("RoutingEngine not initialized. Wait for map scene to load.")
            return
        }

        // Simple Waypoint constructor: Waypoint(GeoCoordinates)
        val startWaypoint = Waypoint(GeoCoordinates(originLat, originLng))
        val endWaypoint = Waypoint(GeoCoordinates(destLat, destLng))
        val waypoints = listOf(startWaypoint, endWaypoint)

        val truckOptions = TruckOptions()

        engine.calculateRoute(
            waypoints,
            truckOptions,
            object : CalculateRouteCallback {
                override fun onRouteCalculated(error: RoutingError?, routes: List<Route>?) {
                    if (error != null) {
                        Log.e(TAG, "Route error: $error")
                        onError?.invoke(error.toString())
                        return
                    }
                    val route = routes?.firstOrNull() ?: run {
                        onError?.invoke("No routes returned")
                        return
                    }
                    val (distanceM, durationS) = renderRoute(route)
                    onSuccess?.invoke(distanceM, durationS)
                }
            }
        )
    }

    private fun renderRoute(route: Route): Pair<Double, Double> {
        Log.d(TAG, "renderRoute: ${route.geometry.vertices.size} vertices, " +
            "length=${route.lengthInMeters}m, duration=${route.duration.seconds}s")

        // Remove existing polyline before drawing the new one
        currentPolyline?.let { mapView.mapScene.removeMapPolyline(it) }

        val geoPolyline = GeoPolyline(route.geometry.vertices)

        // #4285F4 solid Google-blue — fully opaque, 10px wide with ROUND caps
        val lineWidth    = MapMeasureDependentRenderSize(RenderSize.Unit.PIXELS, 10.0)
        val outlineWidth = MapMeasureDependentRenderSize(RenderSize.Unit.PIXELS, 2.0)
        val lineColor    = HereColor.valueOf(0.259f, 0.522f, 0.957f, 1.0f)  // #4285F4
        val outlineColor = HereColor.valueOf(0.0f,   0.3f,   0.8f,   1.0f)

        val representation = MapPolyline.SolidRepresentation(
            lineWidth,
            lineColor,
            outlineWidth,
            outlineColor,
            LineCap.ROUND
        )

        currentPolyline = MapPolyline(geoPolyline, representation)
        mapView.mapScene.addMapPolyline(currentPolyline!!)
        Log.d(TAG, "renderRoute: polyline added to MapScene successfully")

        // NOTE: intentionally NOT moving the camera here.
        // JS controls camera position / zoom / tilt during navigation.
        // Moving the camera from native would fight the JS-driven updates.

        return Pair(
            route.lengthInMeters.toDouble(),
            route.duration.seconds.toDouble()
        )
    }

    fun clearRoute() {
        currentPolyline?.let {
            mapView.mapScene.removeMapPolyline(it)
            currentPolyline = null
        }
    }

    // -------------------------------------------------------------------------
    // Navigation marker
    // -------------------------------------------------------------------------

    fun updateNavigationMarker(lat: Double, lng: Double, bearing: Double, durationMs: Int,
                               markerSize: Int? = null, iconAsset: String? = null) {
        // BUG 4 fix: hide the HERE default blue-dot indicator when the custom
        // navigation arrow is active so both don't appear simultaneously.
        if (locationIndicator != null) {
            locationIndicator!!.disable()
            locationIndicator = null
            Log.d(TAG, "updateNavigationMarker: LocationIndicator hidden")
        }
        navMarkers().update(lat, lng, bearing, durationMs, markerSize, iconAsset)
    }

    fun updateNavigationCamera(
        lat: Double,
        lng: Double,
        bearing: Double,
        speedMps: Double?,
        animationDurationMs: Int,
        forceInstant: Boolean
    ) {
        navigationCamera().update(
            lat = lat,
            lng = lng,
            bearing = bearing,
            speedMps = speedMps,
            animationDurationMs = animationDurationMs,
            forceInstant = forceInstant
        )
    }

    fun resetNavigationCamera() {
        navigationCameraManager?.reset()
    }

    fun removeNavigationMarker() {
        navMarkerManager?.remove()
    }

    // -------------------------------------------------------------------------
    // Navigation polyline (with trim support)
    // -------------------------------------------------------------------------

    fun drawPolyline(coordinates: List<GeoCoordinates>, color: String, width: Double) {
        polylines().draw(coordinates, color, width)
    }

    fun trimPolyline(trimIndex: Int, trimFraction: Double, splitLat: Double?, splitLng: Double?, speedMps: Double?) {
        polylineManager?.trim(trimIndex, trimFraction, splitLat, splitLng, speedMps)
    }

    fun clearPolyline() {
        polylineManager?.clear()
    }
}
