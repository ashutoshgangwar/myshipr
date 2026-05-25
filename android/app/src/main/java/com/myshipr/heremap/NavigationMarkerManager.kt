package com.myshipr.heremap

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Matrix
import android.util.LruCache
import android.util.Log
import android.view.animation.LinearInterpolator
import com.caverock.androidsvg.SVG
import com.here.sdk.core.Anchor2D
import com.here.sdk.core.GeoCoordinates
import com.here.sdk.mapview.MapImage
import com.here.sdk.mapview.MapImageFactory
import com.here.sdk.mapview.MapMarker
import com.here.sdk.mapview.MapView

/**
 * Manages a single animated navigation truck marker on the map.
 *
 * The marker image is loaded from `assets/truck_icon.svg`, rotated to match
 * the current bearing, and cached in 5° increments (72 entries max).
 *
 * Call [update] to move/rotate the marker with a smooth ValueAnimator.
 * Call [remove] to destroy the marker and cancel any running animation.
 */
class NavigationMarkerManager(private val mapView: MapView) {

    companion object {
        private const val TAG = "NavMarkerManager"
        /** Default marker bitmap size in pixels (overridable from JS). */
        const val DEFAULT_MARKER_SIZE_PX = 180
        /** Default SVG asset filename (overridable from JS). */
        const val DEFAULT_SVG_ASSET = "truck_icon.svg"

        /**
         * Rotation correction so the SVG points NORTH (up) when bearing = 0.
         *   0.0   – SVG already points UP  (truck faces top of image)  ← default
         *  -90.0  – SVG points RIGHT (east) → change to -90.0 to correct
         *   90.0  – SVG points LEFT  (west) → change to  90.0 to correct
         *  180.0  – SVG points DOWN         → change to 180.0 to correct
         */
        private const val SVG_NORTH_OFFSET_DEG = 0.0

        /**
         * Anchor: which point of the bitmap is pinned to the geo-coordinate.
         * (0.5, 0.5) = dead center (safe default for top-down truck).
         * (0.5, 0.65) = slightly below center — useful if the cab is at the top.
         */
        private const val ANCHOR_H = 0.5
        private const val ANCHOR_V = 0.5
        private const val ROTATION_SAFE_SCALE = 1.5f
        // private const val MARKER_CONTENT_PADDING_RATIO = 0.08f
    }

    private var marker: MapMarker? = null
    private var animator: ValueAnimator? = null

    private var currentLat = 0.0
    private var currentLng = 0.0
    private var currentBearing = 0.0

    // Last visual bearing step rendered (rounded to 5°). Guards redundant image swaps.
    private var lastRenderedBearing = Int.MIN_VALUE

    // Current appearance — when either changes the image cache is wiped.
    private var markerSizePx: Int = DEFAULT_MARKER_SIZE_PX
    private var svgAsset: String = DEFAULT_SVG_ASSET

    // LRU cache: bearing step (0–358 in steps of 2) → MapImage. Max 180 entries.
    // 2° precision removes visible image-swap jitter during turns.
    private val imageCache = LruCache<Int, MapImage>(180)

    // Pre-loaded SVG — reloaded whenever svgAsset changes.
    private var truckSvg: SVG? = null

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    fun update(lat: Double, lng: Double, bearing: Double, durationMs: Int,
               markerSize: Int? = null, iconAsset: String? = null) {

        // Apply appearance changes — wipe image cache so new bitmaps are rendered.
        val newSize  = markerSize ?: DEFAULT_MARKER_SIZE_PX
        val newAsset = iconAsset  ?: DEFAULT_SVG_ASSET
        if (newSize != markerSizePx || newAsset != svgAsset) {
            markerSizePx = newSize
            svgAsset = newAsset
            truckSvg = null          // force SVG reload
            imageCache.evictAll()    // force bitmap re-render
            lastRenderedBearing = Int.MIN_VALUE
        }

        if (marker == null) {
            // First placement — create the MapMarker from scratch.
            animator?.cancel()
            currentLat = lat
            currentLng = lng
            currentBearing = bearing
            placeMarker(lat, lng, bearing)
            return
        }

        if (durationMs == 0) {
            // Instant in-place update — move/rotate without destroying the marker.
            // Calling placeMarker() here would remove+re-add the MapMarker every
            // call (up to 60fps) causing visible flicker. applyToMarker() is safe.
            animator?.cancel()
            currentLat = lat
            currentLng = lng
            currentBearing = bearing
            applyToMarker(lat, lng, bearing)
            return
        }

        val fromLat = currentLat
        val fromLng = currentLng
        val fromBearing = currentBearing

        // Shortest-arc bearing delta so we never spin the long way around.
        var bearingDiff = bearing - fromBearing
        if (bearingDiff > 180) bearingDiff -= 360.0
        if (bearingDiff < -180) bearingDiff += 360.0

        animator?.cancel()
        animator = ValueAnimator.ofFloat(0f, 1f).apply {
            duration = durationMs.toLong()
            // LinearInterpolator: the JS smooth hook already applies cubic ease-out.
            // Adding a second ease curve doubles the perceived lag.
            interpolator = LinearInterpolator()
            addUpdateListener { anim ->
                val t = (anim.animatedValue as Float).toDouble()
                val animLat = fromLat + (lat - fromLat) * t
                val animLng = fromLng + (lng - fromLng) * t
                val animBearing = fromBearing + bearingDiff * t
                currentLat = animLat
                currentLng = animLng
                currentBearing = animBearing
                applyToMarker(animLat, animLng, animBearing)
            }
            start()
        }
    }

    fun remove() {
        animator?.cancel()
        animator = null
        marker?.let { mapView.mapScene.removeMapMarker(it) }
        marker = null
        lastRenderedBearing = Int.MIN_VALUE
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private fun placeMarker(lat: Double, lng: Double, bearing: Double) {
        marker?.let { mapView.mapScene.removeMapMarker(it) }
        val image = getOrCreateImage(bearing)
        // Explicit Anchor2D so the correct point of the bitmap sits on the
        // geo-coordinate. Adjust ANCHOR_V (0=top, 1=bottom) to shift the truck
        // forward/backward on the route visually.
        val newMarker = MapMarker(
            GeoCoordinates(lat, lng),
            image,
            Anchor2D(ANCHOR_H, ANCHOR_V)
        )
        mapView.mapScene.addMapMarker(newMarker)
        marker = newMarker
        lastRenderedBearing = roundBearing(bearing)
    }

    private fun applyToMarker(lat: Double, lng: Double, bearing: Double) {
        val m = marker ?: return
        m.coordinates = GeoCoordinates(lat, lng)
        val rounded = roundBearing(bearing)
        if (rounded != lastRenderedBearing) {
            m.image = getOrCreateImage(bearing)
            lastRenderedBearing = rounded
        }
    }

    private fun getOrCreateImage(bearing: Double): MapImage {
        val rounded = roundBearing(bearing)
        return imageCache.get(rounded) ?: createTruckImage(rounded.toDouble()).also {
            imageCache.put(rounded, it)
        }
    }

    private fun roundBearing(bearing: Double): Int =
        ((Math.round(bearing / 2.0) * 2).toInt() % 360 + 360) % 360

    // -------------------------------------------------------------------------
    // Bitmap rendering — truck SVG rotated to bearing
    // -------------------------------------------------------------------------

    /**
     * Renders truck_icon.svg into a [MARKER_SIZE_PX]×[MARKER_SIZE_PX] bitmap
     * rotated by [bearing] degrees (0 = north = up in map space).
     */
      private fun createTruckImage(bearing: Double): MapImage {
    val svgSize = markerSizePx

    // Bitmap diagonal size — koi bhi angle pe clip nahi hoga
    val bitmapSize = (svgSize * 1.5f).toInt()
    val center = bitmapSize / 2f

    val bitmap = Bitmap.createBitmap(bitmapSize, bitmapSize, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)

    val svg = loadSvg()
    if (svg != null) {
        // SVG ki actual width/height lo
        val svgW = svg.documentWidth.takeIf { it > 0f } ?: 509f
        val svgH = svg.documentHeight.takeIf { it > 0f } ?: 509f

        // Scale factor: SVG ko svgSize x svgSize mein fit karo
        val scaleX = svgSize / svgW
        val scaleY = svgSize / svgH
        val scale = minOf(scaleX, scaleY) // aspect ratio preserve

        // Rendered size after scale
        val renderedW = svgW * scale
        val renderedH = svgH * scale

        val effectiveBearing = (bearing + SVG_NORTH_OFFSET_DEG).toFloat()

        canvas.save()

        // Step 1: bitmap ke centre pe rotate karo
        canvas.rotate(effectiveBearing, center, center)

        // Step 2: SVG ko bilkul centre mein rakh
        canvas.translate(
            center - renderedW / 2f,
            center - renderedH / 2f
        )

        // Step 3: Scale apply karo
        canvas.scale(scale, scale)

        // Step 4: SVG render karo (ab yeh bilkul centre mein hoga)
        svg.renderToCanvas(canvas)

        canvas.restore()
    } else {
        val paint = android.graphics.Paint(android.graphics.Paint.ANTI_ALIAS_FLAG).apply {
            color = android.graphics.Color.parseColor("#4285F4")
            style = android.graphics.Paint.Style.FILL
        }
        canvas.drawCircle(center, center, svgSize / 2f - 4f, paint)
    }

    return MapImageFactory.fromBitmap(bitmap)
}
    /** Lazily loads the SVG from the app's asset folder; caches after first load. */
    private fun loadSvg(): SVG? {
        if (truckSvg != null) return truckSvg
        return try {
            val assetManager = mapView.context.assets
            truckSvg = SVG.getFromAsset(assetManager, svgAsset)
            truckSvg
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load $svgAsset from assets: ${e.message}")
            null
        }
    }
}


