package com.myshipr.heremap

import com.here.sdk.core.GeoCoordinatesUpdate
import com.here.sdk.core.GeoOrientationUpdate
import com.here.sdk.mapview.MapCameraAnimationFactory
import com.here.sdk.mapview.MapMeasure
import com.here.sdk.mapview.MapView
import com.here.time.Duration
import kotlin.math.abs
import kotlin.math.asin
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin

class NavigationCameraManager(private val mapView: MapView) {

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
        val lookAheadMeters = computeLookAheadMeters(safeSpeed)
        val cameraTarget = projectForward(lat, lng, smoothedBearing, lookAheadMeters)
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

    private fun computeLookAheadMeters(speedMps: Double): Double {
        return (18.0 + speedMps * 4.5).coerceIn(18.0, 90.0)
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

    private fun projectForward(lat: Double, lng: Double, bearing: Double, distanceMeters: Double): com.here.sdk.core.GeoCoordinates {
        val angularDistance = distanceMeters / EARTH_RADIUS_METERS
        val bearingRad = Math.toRadians(bearing)
        val lat1 = Math.toRadians(lat)
        val lng1 = Math.toRadians(lng)

        val sinLat1 = sin(lat1)
        val cosLat1 = cos(lat1)
        val sinAngular = sin(angularDistance)
        val cosAngular = cos(angularDistance)

        val sinLat2 = sinLat1 * cosAngular + cosLat1 * sinAngular * cos(bearingRad)
        val lat2 = asin(min(1.0, max(-1.0, sinLat2)))
        val y = sin(bearingRad) * sinAngular * cosLat1
        val x = cosAngular - sinLat1 * sin(lat2)
        var lng2 = lng1 + atan2(y, x)
        lng2 = ((lng2 + Math.PI * 3) % (Math.PI * 2)) - Math.PI

        return com.here.sdk.core.GeoCoordinates(Math.toDegrees(lat2), Math.toDegrees(lng2))
    }

    private fun interpolateBearing(from: Double, to: Double, t: Double): Double {
        var diff = normalizeBearing(to) - normalizeBearing(from)
        if (diff > 180.0) diff -= 360.0
        if (diff < -180.0) diff += 360.0
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
        return (40_000_000.0 / Math.pow(2.0, safeZoom)).coerceAtMost(5_000_000.0)
    }

    private companion object {
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