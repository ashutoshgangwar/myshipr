import Foundation

#if canImport(heresdk)
import heresdk
#endif

/// Converts HERE SDK model objects into the plain JS shapes the app consumes.
///
/// Mirrors `android/.../heremap/HereSdkSerialization.kt` and
/// `HereNavigationSerialization.kt` so a payload is identical on both
/// platforms. Distances are metres and durations seconds throughout; speeds are
/// given in both m/s and km/h so UI code never has to convert.
enum HereSerialization {

    private static let mpsToKph = 3.6

#if canImport(heresdk)

    // MARK: - Maneuvers

    /// The turn-by-turn `action`/`direction` shape the panel renders from.
    static func maneuver(_ maneuver: Maneuver) -> [String: Any] {
        let (action, direction) = maneuverAction(maneuver.action)
        var map: [String: Any] = [
            "action": action,
            "offset": Int(maneuver.offset),
            "length": Double(maneuver.lengthInMeters),
            "duration": maneuver.duration,
            "instruction": maneuver.text,
            "sdkAction": String(describing: maneuver.action),
            "sectionIndex": Int(maneuver.sectionIndex),
            "coordinates": [
                "lat": maneuver.coordinates.latitude,
                "lng": maneuver.coordinates.longitude,
            ],
        ]
        if let direction = direction { map["direction"] = direction }
        if let angle = maneuver.turnAngleInDegrees { map["turnAngle"] = angle }
        if let exit = roundaboutExitNumber(maneuver.action) { map["exit"] = exit }

        let road = maneuver.nextRoadTexts.names.defaultValue()
            ?? maneuver.roadTexts.names.defaultValue()
        map["roadName"] = road ?? NSNull()
        return map
    }

    /// The upcoming turn. `distanceMeters`/`durationSeconds` are the live
    /// countdown to the turn, not the maneuver's own length.
    static func maneuver(
        _ maneuver: Maneuver,
        index: Int,
        distanceMeters: Double,
        durationSeconds: Double
    ) -> [String: Any] {
        var map = self.maneuver(maneuver)
        map["index"] = index
        map["distanceMeters"] = distanceMeters
        map["durationSeconds"] = durationSeconds
        return map
    }

    /// Maps a HERE `ManeuverAction` onto the REST-style `action`/`direction`.
    private static func maneuverAction(_ action: ManeuverAction) -> (String, String?) {
        switch action {
        case .depart: return ("depart", nil)
        case .arrive: return ("arrive", nil)
        case .continueOn: return ("continue", "straight")

        case .leftUTurn, .rightUTurn: return ("turn", "uturn")
        case .sharpLeftTurn: return ("turn", "sharp-left")
        case .leftTurn: return ("turn", "left")
        case .slightLeftTurn: return ("turn", "slight-left")
        case .slightRightTurn: return ("turn", "slight-right")
        case .rightTurn: return ("turn", "right")
        case .sharpRightTurn: return ("turn", "sharp-right")

        case .leftExit: return ("exit", "left")
        case .rightExit: return ("exit", "right")
        case .leftRamp: return ("ramp", "left")
        case .rightRamp: return ("ramp", "right")

        case .leftFork: return ("keep", "left")
        case .middleFork: return ("keep", "straight")
        case .rightFork: return ("keep", "right")

        case .enterHighwayFromLeft: return ("merge", "left")
        case .enterHighwayFromRight: return ("merge", "right")

        case .leftRoundaboutEnter: return ("roundaboutEnter", "left")
        case .rightRoundaboutEnter: return ("roundaboutEnter", "right")
        case .leftRoundaboutPass: return ("roundaboutPass", "left")
        case .rightRoundaboutPass: return ("roundaboutPass", "right")

        default:
            let name = String(describing: action)
            if name.contains("RoundaboutExit") || name.contains("roundaboutExit") {
                return ("roundaboutExit", name.hasPrefix("left") ? "left" : "right")
            }
            return ("continue", nil)
        }
    }

    /// `leftRoundaboutExit3` → 3. Nil for every non-roundabout-exit action.
    private static func roundaboutExitNumber(_ action: ManeuverAction) -> Int? {
        let name = String(describing: action)
        guard let range = name.range(of: "oundaboutExit") else { return nil }
        return Int(name[range.upperBound...])
    }

    // MARK: - Navigation events

    /// Progress along the whole route. HERE reports per section; the *last*
    /// section's remaining values are the route's remaining values, which is
    /// what an ETA needs.
    static func routeProgress(_ progress: RouteProgress) -> [String: Any] {
        var map: [String: Any] = ["sectionCount": progress.sectionProgress.count]

        if let overall = progress.sectionProgress.last {
            map["remainingDistanceMeters"] = Double(overall.remainingDistanceInMeters)
            map["remainingDurationSeconds"] = overall.remainingDuration
            map["trafficDelaySeconds"] = overall.trafficDelay
        }
        map["sectionIndex"] = Int(progress.routeMatchedLocation.sectionIndex)
        map["sectionOffsetMeters"] = progress.routeMatchedLocation.spanOffsetInMeters

        if let next = progress.maneuverProgress.first {
            map["maneuverIndex"] = Int(next.maneuverIndex)
            map["distanceToNextManeuverMeters"] = Double(next.remainingDistanceInMeters)
            map["durationToNextManeuverSeconds"] = next.remainingDuration
        }
        return map
    }

    static func speedLimit(_ limit: SpeedLimit) -> [String: Any] {
        var map: [String: Any] = [:]
        // Null where HERE has no limit on record — JS must treat that as
        // "unknown", not "no limit".
        putSpeed(&map, "speedLimit", limit.speedLimitInMetersPerSecond)
        putSpeed(&map, "effectiveSpeedLimit", limit.effectiveSpeedLimitInMetersPerSecond())
        putSpeed(&map, "advisorySpeedLimit", limit.advisorySpeedLimitInMetersPerSecond)
        putSpeed(&map, "schoolZoneSpeedLimit", limit.schoolZoneSpeedLimitInMetersPerSecond)
        return map
    }

    /// `isSpeeding` is the flag most UIs actually bind to.
    static func speedWarning(_ status: SpeedWarningStatus) -> [String: Any] {
        [
            "status": String(describing: status),
            "isSpeeding": status == .speedLimitExceeded,
        ]
    }

    static func routeDeviation(_ deviation: RouteDeviation) -> [String: Any] {
        let current = deviation.currentLocation.mapMatchedLocation?.coordinates
            ?? deviation.currentLocation.originalLocation.coordinates
        let lastOnRoute = deviation.lastLocationOnRoute.map {
            $0.mapMatchedLocation?.coordinates ?? $0.originalLocation.coordinates
        }

        var map: [String: Any] = [
            "lastTraveledSectionIndex": Int(deviation.lastTraveledSectionIndex),
            "traveledDistanceOnLastSectionMeters":
                Double(deviation.traveledDistanceOnLastSectionInMeters),
            "currentLocation": [
                "latitude": current.latitude, "longitude": current.longitude,
            ],
        ]

        if let lastOnRoute = lastOnRoute {
            map["lastLocationOnRoute"] = [
                "latitude": lastOnRoute.latitude, "longitude": lastOnRoute.longitude,
            ]
            // How far off-route we are. Null before the first on-route fix,
            // which is exactly when a reroute decision cannot be made yet.
            map["deviationDistanceMeters"] = current.distance(to: lastOnRoute)
        } else {
            map["lastLocationOnRoute"] = NSNull()
            map["deviationDistanceMeters"] = NSNull()
        }
        return map
    }

    /// Guidance text — feed `text` to TTS to speak the turn.
    static func eventText(_ event: EventText) -> [String: Any] {
        var map: [String: Any] = [
            "text": event.text,
            "type": String(describing: event.type),
            "distanceMeters": event.distanceInMeters,
        ]
        if let details = event.maneuverNotificationDetails {
            map["notificationType"] = String(describing: details.maneuverNotificationType)
            map["maneuverAction"] = String(describing: details.maneuver.action)
        }
        return map
    }

    /// A position update from whichever source is driving navigation. The
    /// map-matched coordinate is preferred: it is snapped to the road, so it
    /// matches what the map draws.
    static func navigableLocation(_ location: NavigableLocation) -> [String: Any] {
        let matched = location.mapMatchedLocation
        let original = location.originalLocation
        let coordinates = matched?.coordinates ?? original.coordinates

        var map: [String: Any] = [
            "latitude": coordinates.latitude,
            "longitude": coordinates.longitude,
            "isMapMatched": matched != nil,
            "isDrivingInTheWrongWay": matched?.isDrivingInTheWrongWay ?? false,
        ]
        map["bearing"] = (matched?.bearingInDegrees ?? original.bearingInDegrees) ?? NSNull()
        map["horizontalAccuracyMeters"] =
            (matched?.horizontalAccuracyInMeters ?? original.horizontalAccuracyInMeters) ?? NSNull()
        putSpeed(&map, "speed", matched?.speedInMetersPerSecond ?? original.speedInMetersPerSecond)
        return map
    }

    // MARK: - Helpers

    /// Writes `<key>Mps` / `<key>Kph`, or nulls when the SDK has no value.
    private static func putSpeed(_ map: inout [String: Any], _ key: String, _ mps: Double?) {
        if let mps = mps {
            map["\(key)Mps"] = mps
            map["\(key)Kph"] = mps * mpsToKph
        } else {
            map["\(key)Mps"] = NSNull()
            map["\(key)Kph"] = NSNull()
        }
    }
#endif
}
