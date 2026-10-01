import Foundation

#if canImport(heresdk)
import heresdk
#endif

/// Shared helpers for the HERE SDK-backed native modules.
///
/// `HERESerialization` converts HERE SDK models into the same JSON shapes the
/// app used to get from the HERE REST endpoints, so the JS layer is identical
/// on both platforms. Keep it in sync with Android's `HereSdkSerialization.kt`.
@objcMembers
public class HEREBridge: NSObject {
    @objc public static func placeholder() {
        print("HEREBridge placeholder")
    }
}

// MARK: - Option readers
//
// Options coming from JS are loosely typed: numbers may arrive as strings (the
// truck-details form keeps everything as text), so every reader coerces.

enum HEREOptions {

    static func double(_ value: Any?) -> Double? {
        if let number = value as? NSNumber { return number.doubleValue }
        if let string = value as? String { return Double(string.trimmingCharacters(in: .whitespaces)) }
        return nil
    }

    /// `Int32(someDouble)` traps on NaN, infinity and anything outside Int32's
    /// range, so an out-of-range figure typed into the truck-details form is
    /// clamped rather than allowed to kill the app.
    static func int32(_ value: Any?) -> Int32? {
        guard let value = double(value), value.isFinite else { return nil }
        return Int32(min(max(value.rounded(.towardZero), Double(Int32.min)), Double(Int32.max)))
    }

    static func bool(_ value: Any?) -> Bool? {
        if let number = value as? NSNumber { return number.boolValue }
        if let string = value as? String { return (string as NSString).boolValue }
        return nil
    }

    static func string(_ value: Any?) -> String? {
        if let string = value as? String, !string.isEmpty { return string }
        return nil
    }

    static func strings(_ value: Any?) -> [String] {
        (value as? [Any])?.compactMap { $0 as? String } ?? []
    }

    /// Accepts `{lat,lng}`, `{latitude,longitude}` or a place with `access[0]`.
    static func coordinatePair(_ value: Any?) -> (lat: Double, lng: Double)? {
        guard let map = value as? [String: Any] else { return nil }

        if let access = map["access"] as? [[String: Any]], let first = access.first,
           let lat = double(first["lat"] ?? first["latitude"]),
           let lng = double(first["lng"] ?? first["longitude"]) {
            return (lat, lng)
        }

        guard let lat = double(map["lat"] ?? map["latitude"]),
              let lng = double(map["lng"] ?? map["longitude"]) else { return nil }
        return (lat, lng)
    }
}

#if canImport(heresdk)

enum HERESerialization {

    // MARK: - Geometry

    static func latLng(_ coords: GeoCoordinates?) -> [String: Any]? {
        guard let coords = coords else { return nil }
        return ["lat": coords.latitude, "lng": coords.longitude]
    }

    static func latLngArray(_ coords: [GeoCoordinates]) -> [[String: Any]] {
        coords.map { ["lat": $0.latitude, "lng": $0.longitude] }
    }

    static func geoBox(_ box: GeoBox?) -> [String: Any]? {
        guard let box = box else { return nil }
        return [
            "northEast": ["lat": box.northEastCorner.latitude, "lng": box.northEastCorner.longitude],
            "southWest": ["lat": box.southWestCorner.latitude, "lng": box.southWestCorner.longitude]
        ]
    }

    private static func locationTime(_ time: LocationTime?) -> [String: Any]? {
        guard let time = time else { return nil }
        return [
            "localTimeMs": time.localTime.timeIntervalSince1970 * 1000,
            "utcTimeMs": time.utcTime.timeIntervalSince1970 * 1000
        ]
    }

    // MARK: - Search

    static func address(_ address: Address) -> [String: Any] {
        [
            "label": address.addressText,
            "street": address.street,
            "houseNumber": address.houseNumOrName,
            "city": address.city,
            "district": address.district,
            "state": address.state,
            "stateCode": address.stateCode,
            "county": address.county,
            "postalCode": address.postalCode,
            "country": address.country,
            "countryCode": address.countryCode
        ]
    }

    /// A place in the legacy REST-autosuggest shape. `access` holds the routable
    /// entry points, which callers prefer over the display coordinate.
    static func place(_ value: Place) -> [String: Any] {
        var result: [String: Any] = [
            "id": value.id,
            "title": value.title,
            "address": value.address.addressText.isEmpty ? value.title : value.address.addressText,
            "addressDetails": address(value.address),
            "placeType": String(describing: value.placeType),
            "access": value.accessPoints.map {
                ["lat": $0.latitude, "lng": $0.longitude,
                 "latitude": $0.latitude, "longitude": $0.longitude]
            },
            "categories": value.details.categories.map { ["id": $0.id, "name": $0.name ?? ""] }
        ]

        if let coords = value.geoCoordinates {
            result["latitude"] = coords.latitude
            result["longitude"] = coords.longitude
        } else {
            result["latitude"] = NSNull()
            result["longitude"] = NSNull()
        }
        if let distance = value.distanceInMeters {
            result["distanceMeters"] = Int(distance)
        }
        if let box = geoBox(value.boundingBox) {
            result["boundingBox"] = box
        }
        return result
    }

    /// Suggestions of type `query` carry no place — JS filters those out by the
    /// null coordinate, exactly as it did with the REST response.
    static func suggestion(_ value: Suggestion) -> [String: Any] {
        var result: [String: Any]
        if let resolved = value.place {
            result = place(resolved)
        } else {
            result = [
                "address": value.title,
                "latitude": NSNull(),
                "longitude": NSNull(),
                "access": []
            ]
        }
        result["id"] = value.id ?? value.place?.id ?? NSNull()
        result["title"] = value.title
        result["suggestionType"] = String(describing: value.type)
        return result
    }

    // MARK: - Routing

    static func route(_ value: Route) -> [String: Any] {
        var result: [String: Any] = [
            "distanceMeters": Double(value.lengthInMeters),
            "durationSeconds": value.duration,
            "trafficDelaySeconds": value.trafficDelay,
            "baseDurationSeconds": value.duration - value.trafficDelay,
            "transportMode": String(describing: value.requestedTransportMode),
            "coordinates": latLngArray(value.geometry.vertices),
            "sections": value.sections.map { section($0) },
            "tolls": tollSummary(value)
        ]
        if let consumption = value.consumptionInKilowattHours {
            result["consumptionKwh"] = consumption
        }
        if let box = geoBox(value.boundingBox) {
            result["boundingBox"] = box
        }
        return result
    }

    private static func section(_ value: Section) -> [String: Any] {
        var result: [String: Any] = [
            "distanceMeters": Double(value.lengthInMeters),
            "durationSeconds": value.duration,
            "trafficDelaySeconds": value.trafficDelay,
            "baseDurationSeconds": value.duration - value.trafficDelay,
            "transportMode": String(describing: value.sectionTransportMode),
            "coordinates": latLngArray(value.geometry.vertices),
            "departure": routePlace(value.departurePlace),
            "arrival": routePlace(value.arrivalPlace),
            "actions": value.maneuvers.map { maneuver($0) },
            "tolls": value.tolls.map { toll($0) }
        ]
        if let departure = locationTime(value.departureLocationTime) {
            result["departureTime"] = departure
        }
        if let arrival = locationTime(value.arrivalLocationTime) {
            result["arrivalTime"] = arrival
        }
        if let consumption = value.consumptionInKilowattHours {
            result["consumptionKwh"] = consumption
        }
        return result
    }

    private static func routePlace(_ value: RoutePlace) -> [String: Any] {
        var result: [String: Any] = [
            "coordinates": ["lat": value.mapMatchedCoordinates.latitude,
                            "lng": value.mapMatchedCoordinates.longitude]
        ]
        if let name = value.name { result["name"] = name }
        return result
    }

    /// Emits the REST-router `action` shape the turn-by-turn panel renders from.
    private static func maneuver(_ value: Maneuver) -> [String: Any] {
        let (action, direction) = maneuverAction(value.action)
        var result: [String: Any] = [
            "action": action,
            "offset": Int(value.offset),
            "length": Double(value.lengthInMeters),
            "duration": value.duration,
            "instruction": value.text,
            "sdkAction": String(describing: value.action),
            "sectionIndex": Int(value.sectionIndex),
            "coordinates": ["lat": value.coordinates.latitude,
                            "lng": value.coordinates.longitude]
        ]
        if let direction = direction { result["direction"] = direction }
        if let road = value.nextRoadTexts.names.defaultValue()
            ?? value.roadTexts.names.defaultValue() {
            result["roadName"] = road
        }
        if let angle = value.turnAngleInDegrees { result["turnAngle"] = angle }
        if let exit = roundaboutExitNumber(value.action) { result["exit"] = exit }
        return result
    }

    /// Maps a HERE SDK `ManeuverAction` onto the REST `action`/`direction` pair.
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
            if name.lowercased().contains("roundaboutexit") {
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

    // MARK: - Tolls

    private static func toll(_ value: Toll) -> [String: Any] {
        [
            "countryCode": value.countryCode,
            "tollSystems": value.tollSystems,
            "fares": value.fares.map { ["currency": $0.currency, "price": $0.price] }
        ]
    }

    /// Totals each section's cheapest fare, mirroring the REST
    /// `tolls[summaries]=total` response the screens used to read.
    private static func tollSummary(_ value: Route) -> [String: Any] {
        var total = 0.0
        var currency: String?
        var priced = false

        for section in value.sections {
            for toll in section.tolls {
                guard let cheapest = toll.fares.min(by: { $0.price < $1.price }) else { continue }
                total += cheapest.price
                if currency == nil { currency = cheapest.currency }
                priced = true
            }
        }

        return [
            "total": priced ? total : NSNull(),
            "currency": currency ?? NSNull()
        ]
    }
}

#endif
