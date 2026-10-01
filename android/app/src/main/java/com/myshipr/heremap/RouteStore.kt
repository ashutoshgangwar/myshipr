package com.myshipr.heremap

import com.here.sdk.routing.Route
import java.util.concurrent.atomic.AtomicLong

/**
 * Keeps calculated [Route] objects alive on the native side and hands JS a
 * string id for them.
 *
 * A HERE `Route` wraps a native handle and cannot cross the bridge, but
 * navigation needs the exact object that routing produced. So routing stores the
 * route here and returns `routeId`; `HereNavigation.startNavigation(routeId)`
 * looks it back up.
 *
 * Bounded to [MAX_ENTRIES] so a screen that recalculates on every GPS fix cannot
 * leak native route handles — the oldest route is evicted first.
 */
object RouteStore {

    private const val MAX_ENTRIES = 10

    private val counter = AtomicLong(0)

    // Access-ordered so eviction drops the least recently *used* route, not just
    // the least recently inserted one.
    private val routes = object : LinkedHashMap<String, Route>(16, 0.75f, true) {
        override fun removeEldestEntry(eldest: MutableMap.MutableEntry<String, Route>): Boolean =
            size > MAX_ENTRIES
    }

    private var lastRouteId: String? = null

    @Synchronized
    fun put(route: Route): String {
        val id = "route-${counter.incrementAndGet()}"
        routes[id] = route
        lastRouteId = id
        return id
    }

    /** Resolves [routeId], falling back to the most recent route when it is null. */
    @Synchronized
    fun get(routeId: String?): Route? =
        if (routeId.isNullOrEmpty()) lastRouteId?.let { routes[it] } else routes[routeId]

    /**
     * The id [get] would resolve — i.e. [routeId] itself, or the most recent
     * one when it is null. Lets a caller that accepted "<latest>" report back
     * the concrete id it ended up using.
     */
    @Synchronized
    fun resolveId(routeId: String?): String? =
        if (routeId.isNullOrEmpty()) lastRouteId
        else if (routes.containsKey(routeId)) routeId
        else null

    @Synchronized
    fun remove(routeId: String) {
        routes.remove(routeId)
        if (lastRouteId == routeId) lastRouteId = routes.keys.lastOrNull()
    }

    @Synchronized
    fun clear() {
        routes.clear()
        lastRouteId = null
    }
}
