package com.myshipr.heremap

import android.graphics.Color
import com.here.sdk.core.Color as HereColor
import com.here.sdk.core.GeoCoordinates
import com.here.sdk.core.GeoPolyline
import com.here.sdk.mapview.*
import kotlin.math.*

class PolylineManager(private val mapView: MapView) {

    private val routeProgress = RouteProgressManager()

    private var fullRoutePolyline: MapPolyline? = null
    private var passedPolyline: MapPolyline? = null
    private var fullCoords: List<GeoCoordinates> = emptyList()

    private var lineColor: HereColor = defaultRemainingColor()
    private var lineWidth: Double = 16.0

    private var lastKnownIndex = -1
    private var lastKnownFraction = 0.0
    private var lastKnownDist = -1.0

    private var animLastRenderMs = 0L
    private var currentAnimatedSplit: GeoCoordinates? = null

    private val passedPath = ArrayList<GeoCoordinates>()
    private var passedPathLastRouteIndex = -1

    // -----------------------------------------------------------------------
    // PUBLIC
    // -----------------------------------------------------------------------

    fun draw(coords: List<GeoCoordinates>, color: String, width: Double) {
        clear()
        if (coords.size < 2) return

        fullCoords = coords
        lineColor = parseColor(color)
        lineWidth = width

        routeProgress.setRoute(coords)

        val polyline = createPolyline(
            coords = coords,
            color = lineColor,
            width = lineWidth,
            outlineWidth = lineWidth * 0.15
        )

        polyline?.let {
            mapView.mapScene.addMapPolyline(it)
            fullRoutePolyline = it
        }
    }

    fun clear() {
        removePassedPolyline()
        removeFullRoutePolyline()
        fullCoords = emptyList()
        routeProgress.clear()
        lastKnownIndex = -1
        lastKnownFraction = 0.0
        lastKnownDist = -1.0
        animLastRenderMs = 0L
        currentAnimatedSplit = null
        passedPath.clear()
        passedPathLastRouteIndex = -1
    }

    // -----------------------------------------------------------------------
    // GPS bookkeeping
    // -----------------------------------------------------------------------

    fun trim(
        trimIndex: Int,
        trimFraction: Double,
        splitLat: Double? = null,
        splitLng: Double? = null,
        speedMps: Double? = null
    ) {
        if (fullCoords.size < 2) return

        val progress = routeProgress.buildState(
            trimIndex, trimFraction, splitLat, splitLng
        ) ?: return

        val dist = progress.trimDistanceMeters

        if (lastKnownDist >= 0 && dist < lastKnownDist - BACKTRACK_TOLERANCE_METERS) return

        lastKnownIndex = progress.trimIndex.coerceIn(0, fullCoords.size - 2)
        lastKnownFraction = progress.trimFraction
        lastKnownDist = max(lastKnownDist, dist)
    }

    // -----------------------------------------------------------------------
    // Smooth trim animation
    // -----------------------------------------------------------------------

    fun syncAnimatedTrim(lat: Double, lng: Double, segmentIndex: Int) {
        if (fullCoords.size < 2) return
        if (segmentIndex < 0) return

        val idx = segmentIndex.coerceIn(0, fullCoords.size - 2)
        val now = System.currentTimeMillis()

        if (now - animLastRenderMs < RENDER_INTERVAL_MS) return
        animLastRenderMs = now

        val targetSplit = GeoCoordinates(lat, lng)
        val previous = currentAnimatedSplit

        if (previous == null) {
            currentAnimatedSplit = targetSplit
            updatePassedPath(idx, targetSplit)
            if (passedPath.size >= 2) swapPassedPolyline(passedPath)
            return
        }

        if (haversineMeters(previous, targetSplit) < JITTER_METERS) return

        val smoothSplit = GeoCoordinates(
            lerp(previous.latitude, targetSplit.latitude, SMOOTHING_FACTOR),
            lerp(previous.longitude, targetSplit.longitude, SMOOTHING_FACTOR)
        )

        currentAnimatedSplit = smoothSplit
        updatePassedPath(idx, smoothSplit)
        if (passedPath.size >= 2) swapPassedPolyline(passedPath)
    }

    // -----------------------------------------------------------------------
    // Passed path
    // -----------------------------------------------------------------------

    private fun updatePassedPath(idx: Int, split: GeoCoordinates) {
        if (passedPath.isEmpty()) {
            passedPath.add(fullCoords.first())
            passedPathLastRouteIndex = 0
        }

        if (idx > passedPathLastRouteIndex) {
            for (i in passedPathLastRouteIndex + 1..idx) {
                passedPath.add(fullCoords[i])
            }
            passedPathLastRouteIndex = idx
        }

        if (passedPath.size == 1) passedPath.add(split)
        else passedPath[passedPath.lastIndex] = split
    }

    private fun swapPassedPolyline(coords: List<GeoCoordinates>) {
        if (coords.size < 2) return

        val passedWidth = lineWidth + PASSED_WIDTH_EXTRA

        val polyline = createPolyline(
            coords = coords,
            color = passedColor(),
            width = passedWidth,
            outlineWidth = passedWidth * 0.15
        ) ?: return

        removePassedPolyline()
        mapView.mapScene.addMapPolyline(polyline)
        passedPolyline = polyline
    }

    // -----------------------------------------------------------------------
    // FIX: MapMeasureDependentRenderSize is the ONLY accepted type by
    // SolidRepresentation. The key change is Unit.PIXELS (not
    // DENSITY_INDEPENDENT_PIXELS). PIXELS gives a fixed screen size at all
    // zoom levels — DENSITY_INDEPENDENT_PIXELS is zoom-scaled by HERE SDK
    // which made the line shrink at navigation zoom levels (14+).
    // -----------------------------------------------------------------------
    private fun createPolyline(
        coords: List<GeoCoordinates>,
        color: HereColor,
        width: Double,
        outlineWidth: Double
    ): MapPolyline? {
        if (coords.size < 2) return null

        return try {
            MapPolyline(
                GeoPolyline(coords),
                MapPolyline.SolidRepresentation(
                    MapMeasureDependentRenderSize(
                        RenderSize.Unit.PIXELS,   // ✅ PIXELS not DENSITY_INDEPENDENT_PIXELS
                        width
                    ),
                    color,
                    MapMeasureDependentRenderSize(
                        RenderSize.Unit.PIXELS,   // ✅ PIXELS not DENSITY_INDEPENDENT_PIXELS
                        outlineWidth
                    ),
                    HereColor.valueOf(0.0f, 0.2f, 0.65f, 1.0f),
                    LineCap.ROUND
                )
            )
        } catch (e: Exception) {
            null
        }
    }

    // -----------------------------------------------------------------------
    // Remove
    // -----------------------------------------------------------------------

    private fun removeFullRoutePolyline() {
        fullRoutePolyline?.let { mapView.mapScene.removeMapPolyline(it) }
        fullRoutePolyline = null
    }

    private fun removePassedPolyline() {
        passedPolyline?.let { mapView.mapScene.removeMapPolyline(it) }
        passedPolyline = null
    }

    // -----------------------------------------------------------------------
    // Utils
    // -----------------------------------------------------------------------

    private fun lerp(start: Double, end: Double, fraction: Double) =
        start + (end - start) * fraction

    private fun haversineMeters(a: GeoCoordinates, b: GeoCoordinates): Double {
        val dLat = Math.toRadians(b.latitude - a.latitude)
        val dLng = Math.toRadians(b.longitude - a.longitude)
        val x = sin(dLat / 2).pow(2) +
                cos(Math.toRadians(a.latitude)) *
                cos(Math.toRadians(b.latitude)) *
                sin(dLng / 2).pow(2)
        return 6_371_000.0 * 2 * atan2(sqrt(x), sqrt(1 - x))
    }

    private fun parseColor(hex: String): HereColor {
        return try {
            val c = Color.parseColor(hex)
            HereColor.valueOf(
                Color.red(c) / 255f,
                Color.green(c) / 255f,
                Color.blue(c) / 255f,
                Color.alpha(c) / 255f
            )
        } catch (e: Exception) {
            defaultRemainingColor()
        }
    }

    companion object {
        const val RENDER_INTERVAL_MS = 16L
        const val JITTER_METERS = 0.5
        const val BACKTRACK_TOLERANCE_METERS = 2.0
        const val PASSED_WIDTH_EXTRA = 6.0
        const val SMOOTHING_FACTOR = 0.55

        fun defaultRemainingColor(): HereColor =
            HereColor.valueOf(0.259f, 0.522f, 0.957f, 1.0f)

        fun passedColor(): HereColor =
            HereColor.valueOf(0.91f, 0.91f, 0.93f, 1.0f)
    }
}