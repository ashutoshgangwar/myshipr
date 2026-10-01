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
    // FIX: trimIndex/trimFraction/trimPoint now equal the MARKER position,
    // not a look-ahead projection. The old look-ahead logic placed the trim
    // point 4–24 m ahead of the vehicle, so the polyline appeared to "lag"
    // because the grey/blue split was always ahead of the arrow.
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

    /**
     * Build the progress state for the current marker position.
     *
     * FIX: speedMps parameter removed. The old code used it to project a
     * look-ahead point ahead of the vehicle and used THAT as trimPoint.
     * That is why the polyline always appeared to lag — the grey/blue split
     * was in front of the arrow, not behind it.
     *
     * trimPoint is now identical to markerPoint. The passed segment is
     * everything behind the arrow; the remaining segment starts at the arrow.
     * This matches what Google Maps and Waze do visually.
     */
    fun buildState(
        markerIndex: Int,
        markerFraction: Double,
        splitLat: Double? = null,
        splitLng: Double? = null
    ): RouteProgressState? {
        if (coordinates.size < 2) return null

        val safeIndex = markerIndex.coerceIn(0, coordinates.size - 2)
        val safeFraction = markerFraction.coerceIn(0.0, 1.0)

        val markerPoint = explicitPointOrInterpolated(safeIndex, safeFraction, splitLat, splitLng)
        val markerDistance = routeDistanceAt(safeIndex, safeFraction)

        // trimPoint == markerPoint: trim exactly where the arrow is
        return RouteProgressState(
            markerIndex        = safeIndex,
            markerFraction     = safeFraction,
            markerDistanceMeters = markerDistance,
            markerPoint        = markerPoint,
            trimIndex          = safeIndex,
            trimFraction       = safeFraction,
            trimDistanceMeters = markerDistance,
            trimPoint          = markerPoint
        )
    }

    private fun explicitPointOrInterpolated(
        index: Int,
        fraction: Double,
        splitLat: Double?,
        splitLng: Double?
    ): GeoCoordinates {
        if (
            splitLat != null && splitLng != null &&
            splitLat.isFinite() && splitLng.isFinite() &&
            splitLat in -90.0..90.0 && splitLng in -180.0..180.0
        ) {
            return GeoCoordinates(splitLat, splitLng)
        }

        val start = coordinates[index]
        val end   = coordinates[index + 1]
        return GeoCoordinates(
            start.latitude  + (end.latitude  - start.latitude)  * fraction,
            start.longitude + (end.longitude - start.longitude) * fraction
        )
    }

    private fun routeDistanceAt(index: Int, fraction: Double): Double {
        if (cumulativeMeters.isEmpty()) return 0.0
        val safeIndex   = index.coerceIn(0, max(0, segmentLengthsMeters.size - 1))
        val safeFraction = fraction.coerceIn(0.0, 1.0)
        val segLen = segmentLengthsMeters.getOrElse(safeIndex) { 0.0 }
        return cumulativeMeters[safeIndex] + segLen * safeFraction
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

    private companion object {
        const val EARTH_RADIUS_METERS = 6_371_000.0
    }
}