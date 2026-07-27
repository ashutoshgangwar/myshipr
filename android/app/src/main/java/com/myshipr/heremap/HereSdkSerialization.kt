package com.myshipr.heremap

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.here.sdk.core.GeoBox
import com.here.sdk.core.GeoCoordinates
import com.here.sdk.core.LocationTime
import com.here.sdk.routing.Maneuver
import com.here.sdk.routing.ManeuverAction
import com.here.sdk.routing.Route
import com.here.sdk.routing.Section
import com.here.sdk.routing.Toll
import com.here.sdk.search.Address
import com.here.sdk.search.Place
import com.here.sdk.search.Suggestion

/**
 * Converts HERE SDK model objects into the plain JS shapes the app already
 * consumed from the HERE REST endpoints, so screens can move to the SDK
 * without reshaping their state.
 *
 * The two shapes that must stay stable:
 *   - places/suggestions → { id, title, address, latitude, longitude, access[] }
 *     (see hereSdkService.autosuggest and normalizeLocationCoords)
 *   - maneuvers          → { action, direction, offset, length, duration }
 *     (see utils/Turnbyturnpanel.js ACTION_ICON / DIR_ICON)
 */
object HereSdkSerialization {

    // -------------------------------------------------------------------------
    // Geometry
    // -------------------------------------------------------------------------

    /** Compact `{lat, lng}` — the shape drawPolyline/moveCamera already accept. */
    fun latLng(coords: GeoCoordinates?): WritableMap? {
        if (coords == null) return null
        return Arguments.createMap().apply {
            putDouble("lat", coords.latitude)
            putDouble("lng", coords.longitude)
        }
    }

    /** `{latitude, longitude}` — the shape the search/picker screens expect. */
    fun latitudeLongitude(coords: GeoCoordinates?): WritableMap? {
        if (coords == null) return null
        return Arguments.createMap().apply {
            putDouble("latitude", coords.latitude)
            putDouble("longitude", coords.longitude)
        }
    }

    fun latLngArray(coords: List<GeoCoordinates>?): WritableArray {
        val array = Arguments.createArray()
        coords?.forEach { point -> latLng(point)?.let { array.pushMap(it) } }
        return array
    }

    fun geoBox(box: GeoBox?): WritableMap? {
        if (box == null) return null
        return Arguments.createMap().apply {
            latLng(box.northEastCorner)?.let { putMap("northEast", it) }
            latLng(box.southWestCorner)?.let { putMap("southWest", it) }
        }
    }

    private fun locationTime(time: LocationTime?): WritableMap? {
        if (time == null) return null
        return Arguments.createMap().apply {
            time.localTime?.let { putDouble("localTimeMs", it.time.toDouble()) }
            time.utcTime?.let { putDouble("utcTimeMs", it.time.toDouble()) }
        }
    }

    // -------------------------------------------------------------------------
    // Search
    // -------------------------------------------------------------------------

    fun address(address: Address?): WritableMap? {
        if (address == null) return null
        return Arguments.createMap().apply {
            putString("label", address.addressText)
            putString("street", address.street)
            putString("houseNumber", address.houseNumOrName)
            putString("city", address.city)
            putString("district", address.district)
            putString("state", address.state)
            putString("stateCode", address.stateCode)
            putString("county", address.county)
            putString("postalCode", address.postalCode)
            putString("country", address.country)
            putString("countryCode", address.countryCode)
        }
    }

    /**
     * A [Place] in the legacy REST-autosuggest shape. `access` holds the
     * routable entry points — callers prefer access[0] over the display
     * coordinate when building a route (see normalizeLocationCoords in JS).
     */
    fun placeToMap(place: Place): WritableMap {
        val coords = place.geoCoordinates
        return Arguments.createMap().apply {
            putString("id", place.id)
            putString("title", place.title)
            putString("address", place.address?.addressText ?: place.title)
            putMap("addressDetails", address(place.address))
            if (coords != null) {
                putDouble("latitude", coords.latitude)
                putDouble("longitude", coords.longitude)
            } else {
                putNull("latitude")
                putNull("longitude")
            }
            putString("placeType", place.placeType?.name)
            place.distanceInMeters?.let { putInt("distanceMeters", it) }
            putArray("access", accessPoints(place.accessPoints))
            putMap("boundingBox", geoBox(place.boundingBox))
            putArray("categories", categories(place))
        }
    }

    /** Access points are emitted with both key styles — JS reads either. */
    private fun accessPoints(points: List<GeoCoordinates>?): WritableArray {
        val array = Arguments.createArray()
        points?.forEach { point ->
            array.pushMap(Arguments.createMap().apply {
                putDouble("lat", point.latitude)
                putDouble("lng", point.longitude)
                putDouble("latitude", point.latitude)
                putDouble("longitude", point.longitude)
            })
        }
        return array
    }

    private fun categories(place: Place): WritableArray {
        val array = Arguments.createArray()
        place.details?.categories?.forEach { category ->
            array.pushMap(Arguments.createMap().apply {
                putString("id", category.id)
                putString("name", category.name)
            })
        }
        return array
    }

    /**
     * A [Suggestion] flattened to the same shape as [place]. Suggestions of
     * type QUERY carry no place — JS filters those out by the null coordinate.
     */
    fun suggestion(suggestion: Suggestion): WritableMap {
        val place = suggestion.place
        val map = if (place != null) placeToMap(place) else Arguments.createMap().apply {
            putString("address", suggestion.title)
            putNull("latitude")
            putNull("longitude")
            putArray("access", Arguments.createArray())
        }
        map.putString("id", suggestion.id ?: place?.id)
        map.putString("title", suggestion.title)
        map.putString("suggestionType", suggestion.type?.name)
        return map
    }

    // -------------------------------------------------------------------------
    // Routing
    // -------------------------------------------------------------------------

    fun route(route: Route): WritableMap {
        val durationSeconds = route.duration.seconds.toDouble()
        val trafficDelaySeconds = route.trafficDelay.seconds.toDouble()

        return Arguments.createMap().apply {
            putDouble("distanceMeters", route.lengthInMeters.toDouble())
            putDouble("durationSeconds", durationSeconds)
            putDouble("trafficDelaySeconds", trafficDelaySeconds)
            putDouble("baseDurationSeconds", durationSeconds - trafficDelaySeconds)
            putString("transportMode", route.requestedTransportMode?.name)
            route.consumptionInKilowattHours?.let { putDouble("consumptionKwh", it) }
            putMap("boundingBox", geoBox(route.boundingBox))
            putArray("coordinates", latLngArray(route.geometry?.vertices))
            putArray("sections", sections(route))
            putMap("tolls", tollSummary(route))
        }
    }

    private fun sections(route: Route): WritableArray {
        val array = Arguments.createArray()
        route.sections?.forEach { array.pushMap(sectionToMap(it)) }
        return array
    }

    private fun sectionToMap(section: Section): WritableMap {
        val durationSeconds = section.duration.seconds.toDouble()
        val trafficDelaySeconds = section.trafficDelay.seconds.toDouble()

        return Arguments.createMap().apply {
            putDouble("distanceMeters", section.lengthInMeters.toDouble())
            putDouble("durationSeconds", durationSeconds)
            putDouble("trafficDelaySeconds", trafficDelaySeconds)
            putDouble("baseDurationSeconds", durationSeconds - trafficDelaySeconds)
            putString("transportMode", section.sectionTransportMode?.name)
            putArray("coordinates", latLngArray(section.geometry?.vertices))
            putMap("departure", routePlace(section, departure = true))
            putMap("arrival", routePlace(section, departure = false))
            putMap("departureTime", locationTime(section.departureLocationTime))
            putMap("arrivalTime", locationTime(section.arrivalLocationTime))
            putArray("actions", maneuvers(section))
            putArray("tolls", tolls(section))
            section.consumptionInKilowattHours?.let { putDouble("consumptionKwh", it) }
        }
    }

    private fun routePlace(section: Section, departure: Boolean): WritableMap? {
        val place = if (departure) section.departurePlace else section.arrivalPlace
        if (place == null) return null
        return Arguments.createMap().apply {
            putString("name", place.name)
            putMap("coordinates", latLng(place.mapMatchedCoordinates ?: place.originalCoordinates))
        }
    }

    private fun maneuvers(section: Section): WritableArray {
        val array = Arguments.createArray()
        section.maneuvers?.forEach { array.pushMap(maneuverToMap(it)) }
        return array
    }

    /**
     * Emits the REST-router `action` shape the turn-by-turn panel renders from:
     * `{ action, direction, offset, length, duration, instruction }`.
     */
    private fun maneuverToMap(maneuver: Maneuver): WritableMap {
        val (action, direction) = maneuverAction(maneuver.action)
        return Arguments.createMap().apply {
            putString("action", action)
            direction?.let { putString("direction", it) }
            putInt("offset", maneuver.offset)
            putDouble("length", maneuver.lengthInMeters.toDouble())
            putDouble("duration", maneuver.duration.seconds.toDouble())
            putString("instruction", maneuver.text)
            putString("sdkAction", maneuver.action?.name)
            putInt("sectionIndex", maneuver.sectionIndex)
            putMap("coordinates", latLng(maneuver.coordinates))
            putString("roadName", maneuver.nextRoadTexts?.names?.defaultValue
                ?: maneuver.roadTexts?.names?.defaultValue)
            maneuver.turnAngleInDegrees?.let { putDouble("turnAngle", it) }
            roundaboutExitNumber(maneuver.action)?.let { putInt("exit", it) }
        }
    }

    /** Maps a HERE SDK [ManeuverAction] onto the REST `action`/`direction` pair. */
    private fun maneuverAction(action: ManeuverAction?): Pair<String, String?> = when (action) {
        null -> "continue" to null
        ManeuverAction.DEPART -> "depart" to null
        ManeuverAction.ARRIVE -> "arrive" to null
        ManeuverAction.CONTINUE_ON -> "continue" to "straight"

        ManeuverAction.LEFT_U_TURN, ManeuverAction.RIGHT_U_TURN -> "turn" to "uturn"
        ManeuverAction.SHARP_LEFT_TURN -> "turn" to "sharp-left"
        ManeuverAction.LEFT_TURN -> "turn" to "left"
        ManeuverAction.SLIGHT_LEFT_TURN -> "turn" to "slight-left"
        ManeuverAction.SLIGHT_RIGHT_TURN -> "turn" to "slight-right"
        ManeuverAction.RIGHT_TURN -> "turn" to "right"
        ManeuverAction.SHARP_RIGHT_TURN -> "turn" to "sharp-right"

        ManeuverAction.LEFT_EXIT -> "exit" to "left"
        ManeuverAction.RIGHT_EXIT -> "exit" to "right"
        ManeuverAction.LEFT_RAMP -> "ramp" to "left"
        ManeuverAction.RIGHT_RAMP -> "ramp" to "right"

        ManeuverAction.LEFT_FORK -> "keep" to "left"
        ManeuverAction.MIDDLE_FORK -> "keep" to "straight"
        ManeuverAction.RIGHT_FORK -> "keep" to "right"

        ManeuverAction.ENTER_HIGHWAY_FROM_LEFT -> "merge" to "left"
        ManeuverAction.ENTER_HIGHWAY_FROM_RIGHT -> "merge" to "right"

        ManeuverAction.LEFT_ROUNDABOUT_ENTER -> "roundaboutEnter" to "left"
        ManeuverAction.RIGHT_ROUNDABOUT_ENTER -> "roundaboutEnter" to "right"
        ManeuverAction.LEFT_ROUNDABOUT_PASS -> "roundaboutPass" to "left"
        ManeuverAction.RIGHT_ROUNDABOUT_PASS -> "roundaboutPass" to "right"

        else ->
            if (action.name.contains("ROUNDABOUT_EXIT")) {
                "roundaboutExit" to if (action.name.startsWith("LEFT")) "left" else "right"
            } else {
                "continue" to null
            }
    }

    /** LEFT_ROUNDABOUT_EXIT3 → 3. Null for every non-roundabout-exit action. */
    private fun roundaboutExitNumber(action: ManeuverAction?): Int? {
        val name = action?.name ?: return null
        if (!name.contains("ROUNDABOUT_EXIT")) return null
        return name.substringAfter("ROUNDABOUT_EXIT").toIntOrNull()
    }

    // -------------------------------------------------------------------------
    // Tolls
    // -------------------------------------------------------------------------

    private fun tolls(section: Section): WritableArray {
        val array = Arguments.createArray()
        section.tolls?.forEach { array.pushMap(tollToMap(it)) }
        return array
    }

    private fun tollToMap(toll: Toll): WritableMap {
        val fares = Arguments.createArray()
        toll.fares?.forEach { fare ->
            fares.pushMap(Arguments.createMap().apply {
                putString("currency", fare.currency)
                putDouble("price", fare.price)
            })
        }
        val systems = Arguments.createArray()
        toll.tollSystems?.forEach { systems.pushString(it) }

        return Arguments.createMap().apply {
            putString("countryCode", toll.countryCode)
            putArray("tollSystems", systems)
            putArray("fares", fares)
        }
    }

    /**
     * Totals every section's cheapest fare, mirroring the REST
     * `tolls[summaries]=total` response the screens used to read.
     * Returns a null total when the route has no priced tolls at all.
     */
    private fun tollSummary(route: Route): WritableMap {
        var total = 0.0
        var currency: String? = null
        var priced = false

        route.sections?.forEach { section ->
            section.tolls?.forEach { toll ->
                val cheapest = toll.fares?.minByOrNull { it.price }
                if (cheapest != null) {
                    total += cheapest.price
                    if (currency == null) currency = cheapest.currency
                    priced = true
                }
            }
        }

        return Arguments.createMap().apply {
            if (priced) putDouble("total", total) else putNull("total")
            putString("currency", currency)
        }
    }
}
