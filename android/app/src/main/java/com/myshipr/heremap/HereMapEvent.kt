package com.myshipr.heremap

import com.facebook.react.bridge.WritableMap
import com.facebook.react.uimanager.events.Event

/**
 * Generic direct event emitted by [HereMapView] (map tap, long press, POI tap).
 *
 * Uses the EventDispatcher rather than RCTEventEmitter so it works unchanged
 * under both the old renderer and the Fabric interop layer.
 */
class HereMapEvent(
    surfaceId: Int,
    viewTag: Int,
    private val name: String,
    private val payload: WritableMap
) : Event<HereMapEvent>(surfaceId, viewTag) {

    override fun getEventName(): String = name

    override fun getEventData(): WritableMap = payload

    // Two quick taps are two distinct user actions — never merge them.
    override fun canCoalesce(): Boolean = false
}
