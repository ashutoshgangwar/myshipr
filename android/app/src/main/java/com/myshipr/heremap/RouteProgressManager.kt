package com.myshipr.heremap

import com.here.sdk.core.GeoCoordinates
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin
import kotlin.math.sqrt

data class RouteProgressState(
    val markerIndex: Int,
    val markerFraction: Double,
    val markerDistanceMeters: Double,
    val markerPoint: GeoCoordinates,
    val trimIndex: Int,
    val trimFraction: Double,
    val trimDistanceMeters: Double,
    val trimPoint: GeoCoordinates
)

class RouteProgressManager {

    private var coordinates: List<GeoCoordinates> = emptyList()
    private var segmentLengthsMeters: DoubleArray = DoubleArray(0)
    private var cumulativeMeters: DoubleArray = DoubleArray(0)

    fun setRoute(coords: List<GeoCoordinates>) {
        coordinates = coords
        if (coords.size < 2) {
            segmentLengthsMeters = DoubleArray(0)
            cumulativeMeters = DoubleArray(0)
            return
        }

        segmentLengthsMeters = DoubleArray(coords.size - 1)
        cumulativeMeters = DoubleArray(coords.size)
        cumulativeMeters[0] = 0.0

        for (i in 0 until coords.size - 1) {
            val len = haversineMeters(coords[i], coords[i + 1])
            segmentLengthsMeters[i] = len
            cumulativeMeters[i + 1] = cumulativeMeters[i] + len
        }
    }

    fun clear() {
        coordinates = emptyList()
        segmentLengthsMeters = DoubleArray(0)
        cumulativeMeters = DoubleArray(0)
    }

    fun buildState(
        markerIndex: Int,
        markerFraction: Double,
        splitLat: Double? = null,
        splitLng: Double? = null,
        speedMps: Double? = null
    ): RouteProgressState? {
        if (coordinates.size < 2) return null

        val safeMarkerIndex = markerIndex.coerceIn(0, coordinates.size - 2)
        val safeMarkerFraction = markerFraction.coerceIn(0.0, 1.0)
        val markerPoint = explicitPointOrInterpolated(safeMarkerIndex, safeMarkerFraction, splitLat, splitLng)
        val markerDistanceMeters = routeDistanceAt(safeMarkerIndex, safeMarkerFraction)

        val lookAheadMeters = computeLookAheadMeters(speedMps ?: 0.0)
        val trimDistanceMeters = min(totalDistanceMeters(), markerDistanceMeters + lookAheadMeters)
        val trimPoint = pointAtDistance(trimDistanceMeters)

        return RouteProgressState(
            markerIndex = safeMarkerIndex,
            markerFraction = safeMarkerFraction,
            markerDistanceMeters = markerDistanceMeters,
            markerPoint = markerPoint,
            trimIndex = trimPoint.index,
            trimFraction = trimPoint.fraction,
            trimDistanceMeters = trimDistanceMeters,
            trimPoint = trimPoint.coordinates
        )
    }

    private fun explicitPointOrInterpolated(
        index: Int,
        fraction: Double,
        splitLat: Double?,
        splitLng: Double?
    ): GeoCoordinates {
        if (
            splitLat != null &&
            splitLng != null &&
            splitLat.isFinite() &&
            splitLng.isFinite() &&
            splitLat in -90.0..90.0 &&
            splitLng in -180.0..180.0
        ) {
            return GeoCoordinates(splitLat, splitLng)
        }

        val start = coordinates[index]
        val end = coordinates[index + 1]
        return GeoCoordinates(
            start.latitude + (end.latitude - start.latitude) * fraction,
            start.longitude + (end.longitude - start.longitude) * fraction
        )
    }

    private fun pointAtDistance(distanceMeters: Double): RoutePoint {
        if (coordinates.size < 2) {
            return RoutePoint(0, 0.0, coordinates.firstOrNull() ?: GeoCoordinates(0.0, 0.0))
        }

        val clampedDistance = distanceMeters.coerceIn(0.0, totalDistanceMeters())
        var low = 0
        var high = max(0, cumulativeMeters.size - 1)
        while (low < high) {
            val mid = (low + high + 1) / 2
            if (cumulativeMeters[mid] <= clampedDistance) {
                low = mid
            } else {
                high = mid - 1
            }
        }

        val index = min(low, coordinates.size - 2)
        val segStartDistance = cumulativeMeters[index]
        val segLength = segmentLengthsMeters.getOrElse(index) { 0.0 }
        val fraction = if (segLength <= 1e-6) 0.0 else ((clampedDistance - segStartDistance) / segLength).coerceIn(0.0, 1.0)
        val start = coordinates[index]
        val end = coordinates[index + 1]
        val point = GeoCoordinates(
            start.latitude + (end.latitude - start.latitude) * fraction,
            start.longitude + (end.longitude - start.longitude) * fraction
        )

        return RoutePoint(index, fraction, point)
    }

    private fun routeDistanceAt(index: Int, fraction: Double): Double {
        if (cumulativeMeters.isEmpty()) return 0.0
        val safeIndex = index.coerceIn(0, max(0, segmentLengthsMeters.size - 1))
        val safeFraction = fraction.coerceIn(0.0, 1.0)
        val segmentLength = segmentLengthsMeters.getOrElse(safeIndex) { 0.0 }
        return cumulativeMeters[safeIndex] + segmentLength * safeFraction
    }

    private fun totalDistanceMeters(): Double = cumulativeMeters.lastOrNull() ?: 0.0

    private fun computeLookAheadMeters(speedMps: Double): Double {
        val safeSpeed = speedMps.coerceIn(0.0, 40.0)
        return (4.0 + safeSpeed * 1.4).coerceIn(4.0, 24.0)
    }

    private fun haversineMeters(a: GeoCoordinates, b: GeoCoordinates): Double {
        val dLat = Math.toRadians(b.latitude - a.latitude)
        val dLng = Math.toRadians(b.longitude - a.longitude)
        val lat1 = Math.toRadians(a.latitude)
        val lat2 = Math.toRadians(b.latitude)
        val sinLat = sin(dLat / 2.0)
        val sinLng = sin(dLng / 2.0)
        val x = sinLat * sinLat + cos(lat1) * cos(lat2) * sinLng * sinLng
        val c = 2.0 * atan2(sqrt(x), sqrt(max(0.0, 1.0 - x)))
        return EARTH_RADIUS_METERS * c
    }

    private data class RoutePoint(
        val index: Int,
        val fraction: Double,
        val coordinates: GeoCoordinates
    )

    private companion object {
        const val EARTH_RADIUS_METERS = 6_371_000.0
    }
}