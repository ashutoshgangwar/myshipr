package com.myshipr.heremap

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.here.sdk.core.Location
import com.here.sdk.navigation.EventText
import com.here.sdk.navigation.NavigableLocation
import com.here.sdk.navigation.RouteDeviation
import com.here.sdk.navigation.RouteProgress
import com.here.sdk.navigation.SpeedLimit
import com.here.sdk.routing.Maneuver

/**
 * Turns the objects [com.here.sdk.navigation.VisualNavigator] hands its
 * listeners into the plain payloads emitted on the JS event stream.
 *
 * Distances are metres and durations seconds throughout; speeds are given in
 * both m/s and km/h so UI code never has to remember the conversion.
 */
object HereNavigationSerialization {

    private const val MPS_TO_KPH = 3.6

    /**
     * Progress along the whole route.
     *
     * HERE reports progress per section; the *last* section's remaining values
     * are the remaining values for the entire route, which is what an ETA needs.
     */
    fun routeProgress(progress: RouteProgress): WritableMap {
        val overall = progress.sectionProgress?.lastOrNull()
        val next = progress.maneuverProgress?.firstOrNull()

        return Arguments.createMap().apply {
            if (overall != null) {
                putDouble("remainingDistanceMeters", overall.remainingDistanceInMeters.toDouble())
                putDouble("remainingDurationSeconds", overall.remainingDuration.seconds.toDouble())
                putDouble("trafficDelaySeconds", overall.trafficDelay.seconds.toDouble())
            }
            putInt("sectionCount", progress.sectionProgress?.size ?: 0)
            progress.routeMatchedLocation?.let { matched ->
                putInt("sectionIndex", matched.sectionIndex)
                putDouble("sectionOffsetMeters", matched.spanOffsetInMeters)
            }
            if (next != null) {
                putInt("maneuverIndex", next.maneuverIndex)
                putDouble(
                    "distanceToNextManeuverMeters",
                    next.remainingDistanceInMeters.toDouble()
                )
                putDouble(
                    "durationToNextManeuverSeconds",
                    next.remainingDuration.seconds.toDouble()
                )
            }
        }
    }

    /**
     * The upcoming turn. [distanceMeters] / [durationSeconds] come from the
     * matching `ManeuverProgress` — they are the live countdown to the turn,
     * not the maneuver's own length.
     */
    fun maneuver(
        maneuver: Maneuver,
        index: Int,
        distanceMeters: Double,
        durationSeconds: Double
    ): WritableMap = HereSdkSerialization.maneuverToMap(maneuver).apply {
        putInt("index", index)
        putDouble("distanceMeters", distanceMeters)
        putDouble("durationSeconds", durationSeconds)
    }

    fun speedLimit(speedLimit: SpeedLimit): WritableMap {
        val effective = speedLimit.effectiveSpeedLimitInMetersPerSecond()
        return Arguments.createMap().apply {
            // Null when HERE has no limit on record for this stretch of road —
            // JS must treat that as "unknown", not "no limit".
            putSpeed("speedLimit", speedLimit.speedLimitInMetersPerSecond)
            putSpeed("effectiveSpeedLimit", effective)
            putSpeed("advisorySpeedLimit", speedLimit.advisorySpeedLimitInMetersPerSecond)
            putSpeed("schoolZoneSpeedLimit", speedLimit.schoolZoneSpeedLimitInMetersPerSecond)
        }
    }

    /** `{ status, isSpeeding }` — `isSpeeding` is the flag most UIs actually bind to. */
    fun speedWarning(status: com.here.sdk.navigation.SpeedWarningStatus): WritableMap =
        Arguments.createMap().apply {
            putString("status", status.name)
            putBoolean(
                "isSpeeding",
                status == com.here.sdk.navigation.SpeedWarningStatus.SPEED_LIMIT_EXCEEDED
            )
        }

    fun routeDeviation(deviation: RouteDeviation): WritableMap {
        val current = deviation.currentLocation.mapMatchedLocation?.coordinates
            ?: deviation.currentLocation.originalLocation.coordinates
        val lastOnRoute = deviation.lastLocationOnRoute?.let {
            it.mapMatchedLocation?.coordinates ?: it.originalLocation.coordinates
        }

        return Arguments.createMap().apply {
            putInt("lastTraveledSectionIndex", deviation.lastTraveledSectionIndex)
            putDouble(
                "traveledDistanceOnLastSectionMeters",
                deviation.traveledDistanceOnLastSectionInMeters.toDouble()
            )
            putMap("currentLocation", HereSdkSerialization.latitudeLongitude(current))
            putMap("lastLocationOnRoute", HereSdkSerialization.latitudeLongitude(lastOnRoute))
            // How far off-route we are. Null before the first on-route fix,
            // which is exactly when a reroute decision cannot be made yet.
            if (lastOnRoute != null) {
                putDouble("deviationDistanceMeters", current.distanceTo(lastOnRoute))
            } else {
                putNull("deviationDistanceMeters")
            }
        }
    }

    /** Guidance text — feed `text` to TTS to speak the turn. */
    fun eventText(eventText: EventText): WritableMap = Arguments.createMap().apply {
        putString("text", eventText.text)
        putString("type", eventText.type?.name)
        putDouble("distanceMeters", eventText.distanceInMeters)
        eventText.maneuverNotificationDetails?.let { details ->
            putString("notificationType", details.maneuverNotificationType?.name)
            putString("maneuverAction", details.maneuver?.action?.name)
        }
    }

    /**
     * A position update from whichever source is driving navigation. The
     * map-matched coordinate is preferred: it is snapped to the road, so it
     * matches what the map is drawing.
     */
    fun navigableLocation(location: NavigableLocation): WritableMap {
        val matched = location.mapMatchedLocation
        val original = location.originalLocation
        val coordinates = matched?.coordinates ?: original.coordinates

        return Arguments.createMap().apply {
            putDouble("latitude", coordinates.latitude)
            putDouble("longitude", coordinates.longitude)
            putBoolean("isMapMatched", matched != null)
            putNumber("bearing", matched?.bearingInDegrees ?: original.bearingInDegrees)
            putSpeed("speed", matched?.speedInMetersPerSecond ?: original.speedInMetersPerSecond)
            putNumber(
                "horizontalAccuracyMeters",
                matched?.horizontalAccuracyInMeters ?: original.horizontalAccuracyInMeters
            )
            putBoolean("isDrivingInTheWrongWay", matched?.isDrivingInTheWrongWay ?: false)
        }
    }

    fun location(location: Location): WritableMap = Arguments.createMap().apply {
        putDouble("latitude", location.coordinates.latitude)
        putDouble("longitude", location.coordinates.longitude)
        putNumber("bearing", location.bearingInDegrees)
        putSpeed("speed", location.speedInMetersPerSecond)
        putNumber("horizontalAccuracyMeters", location.horizontalAccuracyInMeters)
        location.time?.let { putDouble("timestamp", it.time.toDouble()) }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /** Writes `<key>Mps` / `<key>Kph`, or nulls when the SDK has no value. */
    private fun WritableMap.putSpeed(key: String, metersPerSecond: Double?) {
        if (metersPerSecond == null) {
            putNull("${key}Mps")
            putNull("${key}Kph")
        } else {
            putDouble("${key}Mps", metersPerSecond)
            putDouble("${key}Kph", metersPerSecond * MPS_TO_KPH)
        }
    }

    private fun WritableMap.putNumber(key: String, value: Double?) {
        if (value == null) putNull(key) else putDouble(key, value)
    }
}
