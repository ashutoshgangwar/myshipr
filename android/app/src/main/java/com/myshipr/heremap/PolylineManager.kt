package com.myshipr.heremap

import android.graphics.Color
import com.here.sdk.core.Color as HereColor
import com.here.sdk.core.GeoCoordinates
import com.here.sdk.core.GeoPolyline
import com.here.sdk.mapview.LineCap
import com.here.sdk.mapview.MapMeasureDependentRenderSize
import com.here.sdk.mapview.MapPolyline
import com.here.sdk.mapview.MapView
import com.here.sdk.mapview.RenderSize
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

class PolylineManager(private val mapView: MapView) {

    private val routeProgress = RouteProgressManager()

    private var remainingPolyline: MapPolyline? = null
    private var passedPolyline: MapPolyline? = null

    private var fullCoordinates: List<GeoCoordinates> = emptyList()

    private var remainingColor: HereColor = defaultRemainingColor()
    private var passedColor: HereColor = defaultPassedColor()
    private var lineWidth: Double = 10.0

    private var lastIndex = -1
    private var lastFraction = 0.0
    private var lastDistanceMeters = -1.0
    private var lastRenderMs = 0L

    private var lastSplitPoint: GeoCoordinates? = null

    // Passed route cache grows incrementally as index advances.
    private val passedPath = ArrayList<GeoCoordinates>()
    private var passedPathLastRouteIndex = -1

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    fun draw(coords: List<GeoCoordinates>, color: String, width: Double) {
        fullCoordinates = coords
        remainingColor = parseColor(color)
        passedColor = defaultPassedColor()
        lineWidth = width
        routeProgress.setRoute(coords)

        lastIndex = -1
        lastFraction = 0.0
        lastDistanceMeters = -1.0
        lastRenderMs = 0L
        lastSplitPoint = null

        passedPath.clear()
        passedPathLastRouteIndex = -1

        removePassedPolyline()

        if (coords.size >= 2) swapRemainingPolyline(coords)
        else clear()
    }

    /**
     * Dual-polyline trim strategy:
     * 1) Gray passed route grows incrementally.
     * 2) Blue remaining route shrinks from split point.
     *
     * This avoids full-route redraw behavior and keeps marker + route visually synced.
     */
    fun trim(
        trimIndex: Int,
        trimFraction: Double,
        splitLat: Double? = null,
        splitLng: Double? = null,
        speedMps: Double? = null
    ) {
        if (fullCoordinates.size < 2) return

        val progress = routeProgress.buildState(trimIndex, trimFraction, splitLat, splitLng, speedMps)
            ?: return
        val safeIndex = progress.trimIndex.coerceIn(0, fullCoordinates.size - 2)
        val frac = progress.trimFraction.coerceIn(0.0, 1.0)
        val distanceAtTrim = progress.trimDistanceMeters

        // Never move trim backwards due GPS jitter / snap wobble.
        if (
            lastDistanceMeters >= 0 &&
            distanceAtTrim < (lastDistanceMeters - BACKTRACK_TOLERANCE_METERS)
        ) {
            return
        }

        val now = System.currentTimeMillis()
        val elapsedMs = now - lastRenderMs
        val indexChanged = safeIndex != lastIndex
        val fractionChanged = abs(frac - lastFraction)
        val advancedMeters = if (lastDistanceMeters < 0) {
            Double.MAX_VALUE
        } else {
            distanceAtTrim - lastDistanceMeters
        }

        val shouldRender = when {
            lastDistanceMeters < 0 -> true
            indexChanged && elapsedMs >= MIN_RENDER_INTERVAL_MS -> true
            advancedMeters >= MIN_TRIM_STEP_METERS && elapsedMs >= MIN_RENDER_INTERVAL_MS -> true
            elapsedMs >= MAX_RENDER_INTERVAL_MS && advancedMeters >= FORCE_RENDER_MIN_ADVANCE_METERS -> true
            fractionChanged >= 0.08 && elapsedMs >= MIN_RENDER_INTERVAL_MS -> true
            else -> false
        }

        if (!shouldRender) return
        val rawSplit = progress.trimPoint

        // Jitter guard: do not churn geometry if split changed insignificantly.
        val stableSplit = stabilizeSplit(rawSplit)

        updatePassedPath(safeIndex, stableSplit)
        val remainingPath = buildRemainingPath(safeIndex, stableSplit)

        if (passedPath.size >= 2) swapPassedPolyline(passedPath)
        if (remainingPath.size >= 2) swapRemainingPolyline(remainingPath)

        lastIndex = safeIndex
        lastFraction = frac
        lastDistanceMeters = max(lastDistanceMeters, distanceAtTrim)
        lastRenderMs = now
        lastSplitPoint = stableSplit
    }

    fun clear() {
        removeRemainingPolyline()
        removePassedPolyline()
        fullCoordinates = emptyList()
        routeProgress.clear()

        lastIndex = -1
        lastFraction = 0.0
        lastDistanceMeters = -1.0
        lastRenderMs = 0L
        lastSplitPoint = null

        passedPath.clear()
        passedPathLastRouteIndex = -1
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private fun removeRemainingPolyline() {
        remainingPolyline?.let { mapView.mapScene.removeMapPolyline(it) }
        remainingPolyline = null
    }

    private fun removePassedPolyline() {
        passedPolyline?.let { mapView.mapScene.removeMapPolyline(it) }
        passedPolyline = null
    }

    private fun swapRemainingPolyline(coords: List<GeoCoordinates>) {
        val newPolyline = createPolyline(coords, remainingColor, lineWidth, 2.0) ?: return

        // Atomic swap to avoid a blank frame (flicker): add new first, then remove old.
        mapView.mapScene.addMapPolyline(newPolyline)
        remainingPolyline?.let { mapView.mapScene.removeMapPolyline(it) }
        remainingPolyline = newPolyline
    }

    private fun swapPassedPolyline(coords: List<GeoCoordinates>) {
        val passedWidth = max(2.0, lineWidth - PASSED_WIDTH_REDUCTION)
        val newPolyline = createPolyline(coords, passedColor, passedWidth, 0.0) ?: return

        // Atomic swap to avoid a blank frame (flicker): add new first, then remove old.
        mapView.mapScene.addMapPolyline(newPolyline)
        passedPolyline?.let { mapView.mapScene.removeMapPolyline(it) }
        passedPolyline = newPolyline
    }

    private fun createPolyline(
        coords: List<GeoCoordinates>,
        color: HereColor,
        width: Double,
        outlineWidthPx: Double
    ): MapPolyline? {
        try {
            val geoPolyline = GeoPolyline(coords)

            val widthRender = MapMeasureDependentRenderSize(
                RenderSize.Unit.PIXELS,
                width
            )

            val outlineWidth = MapMeasureDependentRenderSize(
                RenderSize.Unit.PIXELS,
                outlineWidthPx
            )

            val outlineColor = HereColor.valueOf(0.0f, 0.2f, 0.65f, 1.0f)

            val representation = MapPolyline.SolidRepresentation(
                widthRender,
                color,
                outlineWidth,
                outlineColor,
                LineCap.ROUND
            )
            return MapPolyline(geoPolyline, representation)
        } catch (e: Exception) {
            return null
        }
    }

    private fun buildRemainingPath(index: Int, split: GeoCoordinates): List<GeoCoordinates> {
        val remaining = ArrayList<GeoCoordinates>(fullCoordinates.size - index + 1)
        remaining.add(split)
        if (index + 1 < fullCoordinates.size) {
            remaining.addAll(fullCoordinates.subList(index + 1, fullCoordinates.size))
        }

        if (remaining.size == 1 && fullCoordinates.isNotEmpty()) {
            val end = fullCoordinates.last()
            if (
                abs(end.latitude - remaining[0].latitude) > 1e-9 ||
                abs(end.longitude - remaining[0].longitude) > 1e-9
            ) {
                remaining.add(end)
            }
        }

        return remaining
    }

    private fun updatePassedPath(index: Int, split: GeoCoordinates) {
        if (passedPath.isEmpty()) {
            passedPath.add(fullCoordinates.first())
            passedPathLastRouteIndex = 0
        }

        if (index > passedPathLastRouteIndex) {
            val from = max(1, passedPathLastRouteIndex + 1)
            val toInclusive = min(index, fullCoordinates.lastIndex)
            for (i in from..toInclusive) {
                passedPath.add(fullCoordinates[i])
            }
            passedPathLastRouteIndex = toInclusive
        }

        // Keep moving split point at the end of passed path for smooth continuity.
        if (passedPath.size == 1) {
            passedPath.add(split)
        } else {
            passedPath[passedPath.lastIndex] = split
        }
    }

    private fun stabilizeSplit(raw: GeoCoordinates): GeoCoordinates {
        val prev = lastSplitPoint ?: return raw
        val d = haversineMeters(prev, raw)
        if (d < SPLIT_JITTER_METERS) {
            return prev
        }

        // Quantize very lightly to reduce tiny floating-point shimmer.
        val qLat = quantize(raw.latitude, SPLIT_QUANTIZATION_DEGREES)
        val qLng = quantize(raw.longitude, SPLIT_QUANTIZATION_DEGREES)
        return GeoCoordinates(qLat, qLng)
    }

    private fun quantize(value: Double, step: Double): Double {
        return kotlin.math.round(value / step) * step
    }

    private fun haversineMeters(a: GeoCoordinates, b: GeoCoordinates): Double {
        val dLat = Math.toRadians(b.latitude - a.latitude)
        val dLng = Math.toRadians(b.longitude - a.longitude)
        val lat1 = Math.toRadians(a.latitude)
        val lat2 = Math.toRadians(b.latitude)

        val sinLat = kotlin.math.sin(dLat / 2.0)
        val sinLng = kotlin.math.sin(dLng / 2.0)
        val x = sinLat * sinLat + kotlin.math.cos(lat1) * kotlin.math.cos(lat2) * sinLng * sinLng
        val c = 2.0 * kotlin.math.atan2(kotlin.math.sqrt(x), kotlin.math.sqrt(max(0.0, 1.0 - x)))
        return EARTH_RADIUS_METERS * c
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

    private companion object {
        const val EARTH_RADIUS_METERS = 6_371_000.0
        const val MIN_RENDER_INTERVAL_MS = 33L          // ~30fps ceiling
        const val MAX_RENDER_INTERVAL_MS = 66L          // keep sync tight under slow movement
        const val MIN_TRIM_STEP_METERS = 0.55           // smaller step for smoother movement
        const val FORCE_RENDER_MIN_ADVANCE_METERS = 0.25
        const val BACKTRACK_TOLERANCE_METERS = 0.75
        const val SPLIT_JITTER_METERS = 0.18
        const val SPLIT_QUANTIZATION_DEGREES = 1e-7
        const val PASSED_WIDTH_REDUCTION = 1.5

        fun defaultRemainingColor() =
            HereColor.valueOf(0.259f, 0.522f, 0.957f, 1.0f) // #4285F4

        fun defaultPassedColor() =
            HereColor.valueOf(0.53f, 0.56f, 0.60f, 1.0f) // gray, Google-like passed route
    }
}