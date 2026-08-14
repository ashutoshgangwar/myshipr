package com.myshipr.heremap

import android.graphics.Color as AndroidColor
import android.util.Log
import com.here.sdk.core.Color as HereColor
import com.here.sdk.core.GeoCoordinates
import com.here.sdk.navigation.TrafficOnRouteColors
import com.here.sdk.routing.CalculateTrafficOnRouteCallback
import com.here.sdk.routing.Route
import com.here.sdk.routing.RoutingError
import com.here.sdk.routing.TrafficOnRoute
import com.here.sdk.routing.TrafficOnSpan

/**
 * Live congestion along a route, as colour.
 *
 * A route drawn in one flat blue says nothing about what the driver is about to
 * hit. `RoutingEngine.calculateTrafficOnRoute` answers that: it returns the same
 * route split into *spans*, each carrying a jam factor — HERE's 0 (free) to 10
 * (blocked) congestion scale — which [colorFor] buckets into the three states
 * the trip screen shows:
 *
 *   - free flowing → the ordinary route blue
 *   - slow         → yellow
 *   - heavy        → red (deepening to a near-maroon where the road is blocked)
 *
 * Two consumers, one scale, so both readings agree:
 *   - the preview polyline, drawn from [segments] (see `HereMapView.drawRouteSegments`)
 *   - the navigator's own route rendering, which colours itself once it is handed
 *     a [TrafficOnRoute] and the palette from [navigatorColors]
 *
 * Keep in sync with iOS's `HERERoutingService` traffic helpers.
 */
object TrafficRouteColoring {

    private const val TAG = "TrafficRouteColoring"

    /** Free-flowing — the same blue the plain route is drawn in. */
    const val COLOR_FREE = "#2563EB"

    /** Moving, but below the road's normal speed. */
    const val COLOR_SLOW = "#F59E0B"

    /** Queuing or stationary. */
    const val COLOR_HEAVY = "#EF4444"

    /** The road is closed or completely blocked. */
    const val COLOR_BLOCKED = "#991B1B"

    // HERE's jam factor: 0-3 free, 4-7 slow, 8-9 queuing, 10 stationary/blocked.
    private const val JAM_SLOW = 4.0
    private const val JAM_HEAVY = 8.0
    private const val JAM_BLOCKED = 10.0

    /** A run of route geometry that shares one congestion colour. */
    data class Segment(val coordinates: List<GeoCoordinates>, val colorHex: String)

    /** Where a jam factor lands on the three-state scale above. */
    fun colorFor(jamFactor: Double): String = when {
        jamFactor >= JAM_BLOCKED -> COLOR_BLOCKED
        jamFactor >= JAM_HEAVY -> COLOR_HEAVY
        jamFactor >= JAM_SLOW -> COLOR_SLOW
        else -> COLOR_FREE
    }

    /**
     * Asks the routing service what traffic looks like on [route] right now.
     *
     * Traffic is a live figure, so this is a network call: it is fired off after
     * the route is already on screen rather than being waited for, and a failure
     * simply leaves the plain blue line — never an error the driver has to read.
     *
     * [lastTraveledSectionIndex] and [traveledDistanceOnLastSectionInMeters] tell
     * the service how far along the route the truck already is, so a refresh
     * mid-trip costs only the part still to drive. Both are 0 for a preview.
     *
     * [onResult] is called on an SDK thread, not the UI thread.
     */
    fun request(
        route: Route,
        lastTraveledSectionIndex: Int = 0,
        traveledDistanceOnLastSectionInMeters: Int = 0,
        onResult: (TrafficOnRoute?) -> Unit
    ) {
        try {
            HereRoutingService.routingEngine().calculateTrafficOnRoute(
                route,
                lastTraveledSectionIndex,
                traveledDistanceOnLastSectionInMeters,
                object : CalculateTrafficOnRouteCallback {
                    override fun onTrafficOnRouteCalculated(
                        error: RoutingError?,
                        traffic: TrafficOnRoute?
                    ) {
                        if (error != null) {
                            Log.w(TAG, "traffic on route unavailable: $error")
                            onResult(null)
                            return
                        }
                        onResult(traffic)
                    }
                }
            )
        } catch (e: Exception) {
            Log.w(TAG, "traffic on route request failed: ${e.message}")
            onResult(null)
        }
    }

    /**
     * Cuts [traffic] into the coloured runs to draw, merging neighbouring spans
     * that share a colour so a quiet motorway is one polyline rather than
     * hundreds.
     *
     * Returns an empty list when the response carries no usable geometry, which
     * the caller should read as "leave the plain line alone".
     */
    fun segments(traffic: TrafficOnRoute): List<Segment> {
        val segments = mutableListOf<Segment>()
        for (section in traffic.trafficSections.orEmpty()) {
            val geometry = section.geometry ?: continue
            if (geometry.size < 2) continue
            segments += sectionSegments(geometry, section.trafficSpans.orEmpty())
        }
        return segments
    }

    /**
     * A span marks where it *starts* along the section's geometry
     * ([TrafficOnSpan.trafficSectionPolylineOffset]); it runs until the next one
     * begins, or to the end of the section for the last. Consecutive runs share
     * their boundary vertex, so the colours butt up against each other instead of
     * leaving a hairline gap.
     */
    private fun sectionSegments(
        geometry: List<GeoCoordinates>,
        spans: List<TrafficOnSpan>
    ): List<Segment> {
        val lastIndex = geometry.lastIndex
        val starts = spans
            .map { it.trafficSectionPolylineOffset.coerceIn(0, lastIndex) to colorFor(it.jamFactor) }
            .sortedBy { it.first }

        // No span data for this section: it is all free-flowing as far as we know.
        if (starts.isEmpty()) return listOf(Segment(geometry, COLOR_FREE))

        val out = mutableListOf<Segment>()
        var runStart = starts.first().first
        var runColor = starts.first().second

        // Geometry ahead of the first span is unmeasured — draw it plain.
        if (runStart > 0) out.add(Segment(geometry.subList(0, runStart + 1), COLOR_FREE))

        for ((offset, color) in starts.drop(1)) {
            if (color == runColor) continue
            if (offset > runStart) {
                out.add(Segment(geometry.subList(runStart, offset + 1), runColor))
                runStart = offset
            }
            runColor = color
        }
        if (lastIndex > runStart) {
            out.add(Segment(geometry.subList(runStart, lastIndex + 1), runColor))
        }
        return out
    }

    /**
     * The same palette for the navigator's own route rendering.
     *
     * The SDK only recolours the congested parts — free-flowing road keeps the
     * navigator's route colour — so there is no "free" entry to give it here.
     */
    fun navigatorColors(): TrafficOnRouteColors = TrafficOnRouteColors(
        hereColor(COLOR_SLOW),
        hereColor(COLOR_HEAVY),
        hereColor(COLOR_BLOCKED)
    )

    private fun hereColor(hex: String): HereColor =
        HereColor.valueOf(AndroidColor.parseColor(hex))
}
