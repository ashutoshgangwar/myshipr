package com.myshipr.heremap

import com.here.sdk.core.GeoCoordinates
import com.here.sdk.core.GeoCoordinatesUpdate
import com.here.sdk.core.GeoOrientationUpdate
import com.here.sdk.mapview.MapCameraAnimationFactory
import com.here.sdk.mapview.MapMeasure
import com.here.sdk.mapview.MapView
import com.here.time.Duration
import kotlin.math.*

class NavigationCameraManager(private val mapView: MapView) {

    // 🔥 MODE CONTROL (IMPORTANT)
    enum class CameraMode {
        CENTER,   // Marker exact center
        FOLLOW    // Uber / Google Maps style
    }

    var cameraMode = CameraMode.FOLLOW

    private var lastUpdateMs = 0L
    private var lastBearing = 0.0
    private var lastZoom = DEFAULT_ZOOM
    private var hasState = false

    fun reset() {
        lastUpdateMs = 0L
        lastBearing = 0.0
        lastZoom = DEFAULT_ZOOM
        hasState = false
    }

    fun update(
        lat: Double,
        lng: Double,
        bearing: Double,
        speedMps: Double? = null,
        animationDurationMs: Int = DEFAULT_ANIMATION_DURATION_MS,
        forceInstant: Boolean = false
    ) {
        if (!lat.isFinite() || !lng.isFinite()) return

        val now = System.currentTimeMillis()
        if (!forceInstant && now - lastUpdateMs < MIN_UPDATE_INTERVAL_MS) return

        val safeSpeed = (speedMps ?: 0.0).coerceIn(0.0, MAX_SPEED_MPS)

        val targetBearing = normalizeBearing(bearing)
        val smoothedBearing = if (hasState && !forceInstant) {
            interpolateBearing(lastBearing, targetBearing, BEARING_SMOOTHING_FACTOR)
        } else {
            targetBearing
        }

        val desiredZoom = computeZoomForSpeed(safeSpeed)
        val desiredTilt = computeTiltForSpeed(safeSpeed)

        val zoom = if (hasState && !forceInstant) {
            lastZoom + (desiredZoom - lastZoom) * ZOOM_SMOOTHING_FACTOR
        } else {
            desiredZoom
        }

        // 🔥 MAIN FIX (CENTER vs FOLLOW)
        val cameraTarget: GeoCoordinates =
            if (cameraMode == CameraMode.CENTER) {
                GeoCoordinates(lat, lng)
            } else {
                val lookAheadMeters = computeLookAheadMeters(safeSpeed)
                projectForward(lat, lng, smoothedBearing, lookAheadMeters)
            }

        val distanceInMeters = zoomLevelToDistance(zoom)
        val measure = MapMeasure(MapMeasure.Kind.DISTANCE_IN_METERS, distanceInMeters)
        val orientation = GeoOrientationUpdate(smoothedBearing, desiredTilt)

        if (forceInstant || animationDurationMs <= 0) {
            mapView.camera.lookAt(cameraTarget, orientation, measure)
        } else {
            val animation = MapCameraAnimationFactory.flyTo(
                GeoCoordinatesUpdate(cameraTarget.latitude, cameraTarget.longitude),
                orientation,
                measure,
                0.0,
                Duration.ofMillis(animationDurationMs.toLong())
            )
            mapView.camera.startAnimation(animation)
        }

        lastUpdateMs = now
        lastBearing = smoothedBearing
        lastZoom = zoom
        hasState = true
    }

    // 🔥 IMPROVED (LESS SHIFT, MORE STABLE)
    private fun computeLookAheadMeters(speedMps: Double): Double {
        return (8.0 + speedMps * 2.5).coerceIn(8.0, 40.0)
    }

    private fun computeZoomForSpeed(speedMps: Double): Double {
        return when {
            speedMps < 2.0 -> 17.2
            speedMps < 6.0 -> 16.8
            speedMps < 12.0 -> 16.3
            speedMps < 20.0 -> 15.8
            else -> 15.2
        }
    }

    private fun computeTiltForSpeed(speedMps: Double): Double {
        return when {
            speedMps < 2.0 -> 46.0
            speedMps < 8.0 -> 52.0
            else -> 58.0
        }
    }

    private fun projectForward(
        lat: Double,
        lng: Double,
        bearing: Double,
        distanceMeters: Double
    ): GeoCoordinates {

        val angularDistance = distanceMeters / EARTH_RADIUS_METERS
        val bearingRad = Math.toRadians(bearing)

        val lat1 = Math.toRadians(lat)
        val lng1 = Math.toRadians(lng)

        val lat2 = asin(
            sin(lat1) * cos(angularDistance) +
                    cos(lat1) * sin(angularDistance) * cos(bearingRad)
        )

        val lng2 = lng1 + atan2(
            sin(bearingRad) * sin(angularDistance) * cos(lat1),
            cos(angularDistance) - sin(lat1) * sin(lat2)
        )

        return GeoCoordinates(
            Math.toDegrees(lat2),
            Math.toDegrees(lng2)
        )
    }

    private fun interpolateBearing(from: Double, to: Double, t: Double): Double {
        var diff = normalizeBearing(to) - normalizeBearing(from)
        if (diff > 180) diff -= 360
        if (diff < -180) diff += 360
        return normalizeBearing(from + diff * t)
    }

    private fun normalizeBearing(value: Double): Double {
        var out = value % 360.0
        if (out < 0) out += 360.0

        if (hasState && abs(out - lastBearing) < MIN_BEARING_DELTA_DEGREES) {
            return lastBearing
        }

        return out
    }

    private fun zoomLevelToDistance(zoom: Double): Double {
        val safeZoom = zoom.coerceIn(3.0, 22.0)
        return (40_000_000.0 / 2.0.pow(safeZoom)).coerceAtMost(5_000_000.0)
    }

    companion object {
        const val EARTH_RADIUS_METERS = 6_371_000.0
        const val DEFAULT_ZOOM = 16.6
        const val DEFAULT_ANIMATION_DURATION_MS = 220
        const val MIN_UPDATE_INTERVAL_MS = 33L
        const val MAX_SPEED_MPS = 38.0
        const val BEARING_SMOOTHING_FACTOR = 0.3
        const val ZOOM_SMOOTHING_FACTOR = 0.18
        const val MIN_BEARING_DELTA_DEGREES = 0.75
    }
}