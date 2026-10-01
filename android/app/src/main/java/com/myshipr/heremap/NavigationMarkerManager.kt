package com.myshipr.heremap

import android.animation.ValueAnimator
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Color
import android.util.Base64
import android.util.LruCache
import android.util.Log
import android.view.animation.LinearInterpolator
import com.caverock.androidsvg.SVG
import com.here.sdk.core.Anchor2D
import com.here.sdk.core.GeoCoordinates
import com.here.sdk.mapview.MapImageFactory
import com.here.sdk.mapview.MapMarker
import com.here.sdk.mapview.MapImage
import com.here.sdk.mapview.MapView
import kotlin.math.*

/**
 * Manages the navigation arrow marker with smooth 60-fps animation.
 *
 * FIX 1 — MARKER DISAPPEARS ON GPS UPDATE
 * ─────────────────────────────────────────
 * Root cause: ValueAnimator.cancel() does NOT guarantee that the
 * addUpdateListener callback stops immediately. On some Android versions it
 * fires one more time on the next Looper frame with a stale t value (often
 * t=1.0), which calls applyToMarker() with the OLD destination coords just
 * as the new animation is starting — causing a visible jump or blank frame.
 *
 * Fix: generation counter. Each call to update() increments `generation`.
 * The closure captures `myGen` at creation time. On every frame it checks
 * if myGen == generation; if not, it is a stale callback and returns silently.
 * This is zero-cost and completely eliminates the race.
 *
 * FIX 2 — SVG ARROW NOT VISIBLE
 * ───────────────────────────────
 * SVG_NORTH_OFFSET_DEG and icon scale preserved. Circle is large and bold.
 */
class NavigationMarkerManager(private val mapView: MapView) {

    companion object {
        private const val TAG            = "NavMarkerManager"
        const val DEFAULT_MARKER_SIZE_PX = 480
        const val DEFAULT_SVG_ASSET      = "truck_icon.svg"
        private const val SVG_NORTH_OFFSET_DEG = -80.0
        private const val ANCHOR_H = 0.5
        private const val ANCHOR_V = 0.5
        private const val GPS_INTERVAL_MS = 950L
    }

    /** Inject before first update(). Done by HereMapView. */
    var polylineManager: PolylineManager? = null

    private var marker: MapMarker? = null
    private var animator: ValueAnimator? = null

    // Generation counter — incremented on every update() call.
    // Each animator closure captures its own generation at creation time
    // and bails out silently if it no longer matches.
    private var generation = 0

    var currentLat     = 0.0; private set
    var currentLng     = 0.0; private set
    var currentBearing = 0.0; private set

    var lastKnownSegmentIndex = -1; private set

    private var lastRenderedBearing = Int.MIN_VALUE
    private var markerSizePx        = DEFAULT_MARKER_SIZE_PX
    private var svgAsset            = DEFAULT_SVG_ASSET

    private val imageCache = LruCache<Int, MapImage>(180)
    private var truckSvg: SVG? = null

    // Optional JS-rasterised vehicle icon. When set it is used as-is (no
    // rotation) instead of the bundled SVG, so the marker matches iOS.
    private var customBitmap: Bitmap? = null
    private var customBitmapKey: String? = null

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    fun update(
        lat: Double, lng: Double, bearing: Double,
        durationMs: Int,
        markerSize: Int? = null, iconAsset: String? = null,
        segmentIndex: Int = lastKnownSegmentIndex,
        iconImageBase64: String? = null
    ) {
        val newSize  = markerSize ?: DEFAULT_MARKER_SIZE_PX
        val newAsset = iconAsset  ?: DEFAULT_SVG_ASSET
        if (newSize != markerSizePx || newAsset != svgAsset) {
            markerSizePx = newSize; svgAsset = newAsset
            truckSvg = null; imageCache.evictAll()
            lastRenderedBearing = Int.MIN_VALUE
        }
        // Swap in / out the JS-supplied icon when it changes.
        if (iconImageBase64 != customBitmapKey) {
            customBitmapKey = iconImageBase64
            customBitmap = decodeBase64(iconImageBase64)
            imageCache.evictAll()
            lastRenderedBearing = Int.MIN_VALUE
            marker?.let { mapView.mapScene.removeMapMarker(it) }
            marker = null
        }
        if (segmentIndex >= 0) lastKnownSegmentIndex = segmentIndex

        // First placement — snap immediately, no animation
        if (marker == null) {
            currentLat = lat; currentLng = lng; currentBearing = bearing
            placeMarker(lat, lng, bearing)
            polylineManager?.syncAnimatedTrim(lat, lng, lastKnownSegmentIndex)
            return
        }

        val fromLat     = currentLat
        val fromLng     = currentLng
        val fromBearing = currentBearing
        var bearingDiff = bearing - fromBearing
        if (bearingDiff >  180) bearingDiff -= 360.0
        if (bearingDiff < -180) bearingDiff += 360.0

        // ── FIX: increment generation BEFORE cancel so the old listener
        //    sees a stale generation and exits immediately ──
        val myGen = ++generation
        animator?.cancel()
        animator = null

        val dur = if (durationMs > 0) durationMs.toLong() else GPS_INTERVAL_MS

        animator = ValueAnimator.ofFloat(0f, 1f).apply {
            duration     = dur
            interpolator = LinearInterpolator()
            addUpdateListener { anim ->
                // ── FIX: stale-callback guard ──
                if (myGen != generation) return@addUpdateListener

                val t = (anim.animatedValue as Float).toDouble()
                currentLat     = fromLat     + (lat     - fromLat)     * t
                currentLng     = fromLng     + (lng     - fromLng)     * t
                currentBearing = fromBearing + bearingDiff             * t

                applyToMarker(currentLat, currentLng, currentBearing)

                // Drive polyline trim with the animated position every frame
                polylineManager?.syncAnimatedTrim(
                    currentLat, currentLng, lastKnownSegmentIndex
                )
            }
            start()
        }
    }

    fun onTrimReceived(segmentIndex: Int, splitLat: Double, splitLng: Double) {
        if (segmentIndex >= 0) lastKnownSegmentIndex = segmentIndex
        polylineManager?.syncAnimatedTrim(
            currentLat.takeIf { it != 0.0 } ?: splitLat,
            currentLng.takeIf { it != 0.0 } ?: splitLng,
            lastKnownSegmentIndex
        )
    }

    fun remove() {
        generation++          // invalidate any running animator immediately
        animator?.cancel(); animator = null
        marker?.let { mapView.mapScene.removeMapMarker(it) }
        marker = null
        lastRenderedBearing   = Int.MIN_VALUE
        lastKnownSegmentIndex = -1
        currentLat = 0.0; currentLng = 0.0; currentBearing = 0.0
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE — marker rendering
    // ─────────────────────────────────────────────────────────────────────────

    private fun placeMarker(lat: Double, lng: Double, bearing: Double) {
        marker?.let { mapView.mapScene.removeMapMarker(it) }
        // Custom teardrop pin anchors at its bottom tip; the drawn arrow centres.
        val anchorV = if (customBitmap != null) 1.0 else ANCHOR_V
        val m = MapMarker(
            GeoCoordinates(lat, lng),
            getOrCreateImage(bearing),
            Anchor2D(ANCHOR_H, anchorV)
        )
        mapView.mapScene.addMapMarker(m)
        marker = m
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
        // JS-supplied icon: one image for all bearings (no rotation), cached at key 0.
        // Scale to the native marker size so the on-screen size is decided here,
        // not by the resolution of the rasterised PNG handed over from JS.
        customBitmap?.let { bmp ->
            return imageCache.get(0)
                ?: MapImageFactory.fromBitmap(HereMapView.scaleToMarkerSize(bmp, markerSizePx))
                    .also { imageCache.put(0, it) }
        }
        val key = roundBearing(bearing)
        return imageCache.get(key)
            ?: createTruckImage(key.toDouble()).also { imageCache.put(key, it) }
    }

    private fun decodeBase64(b64: String?): Bitmap? {
        if (b64.isNullOrEmpty()) return null
        return try {
            val clean = b64.substringAfter(",", b64)
            val bytes = Base64.decode(clean, Base64.DEFAULT)
            BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
        } catch (e: Exception) {
            Log.e(TAG, "decodeBase64 failed: ${e.message}"); null
        }
    }

    private fun roundBearing(b: Double): Int =
        ((round(b / 2.0) * 2).toInt() % 360 + 360) % 360

    private fun createTruckImage(bearing: Double): MapImage {
        val sz       = markerSizePx
        val bitmapSz = (sz * 1.7f).toInt()
        val center   = bitmapSz / 2f
        val radius   = sz / 1.9f

        val bitmap = Bitmap.createBitmap(bitmapSz, bitmapSz, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)

        // Render truck SVG only (no background circle, shadow or border)
        // This ensures the navigation marker appears as a clean truck icon on Android.

        canvas.save()
        canvas.rotate((bearing + SVG_NORTH_OFFSET_DEG).toFloat(), center, center)
        val svg = loadSvg()
       if (svg != null) {

    svg.setDocumentWidth(100f)
    svg.setDocumentHeight(100f)

   val iconSz = radius * 1.65f

    val scale = iconSz / maxOf(
        svg.documentWidth,
        svg.documentHeight
    )

    canvas.translate(center, center)
    canvas.scale(scale, scale)

    canvas.translate(
        -svg.documentWidth / 2f,
        -svg.documentHeight / 2f
    )

    svg.renderToCanvas(canvas)
}
        canvas.restore()

        return MapImageFactory.fromBitmap(bitmap)
    }

    private fun loadSvg(): SVG? {
        if (truckSvg != null) return truckSvg
        return try {
            SVG.getFromAsset(mapView.context.assets, svgAsset).also { truckSvg = it }
        } catch (e: Exception) {
            Log.e(TAG, "SVG load failed: ${e.message}"); null
        }
    }
}