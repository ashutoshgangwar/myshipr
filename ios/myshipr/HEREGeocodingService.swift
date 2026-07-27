import Foundation

#if canImport(heresdk)
import heresdk
#endif

/// Forward/reverse geocoding and place lookup via the HERE SDK Explore
/// `SearchEngine` — the replacement for the `geocode.search.hereapi.com`,
/// `revgeocode.search.hereapi.com` and `lookup.search.hereapi.com` endpoints.
///
/// Shares the engine and option parsing with `HEREAutosuggestService`.
@objcMembers
class HEREGeocodingService: NSObject {

#if canImport(heresdk)

    /// Forward geocoding: free-form address text → coordinates.
    static func geocode(
        _ options: [String: Any],
        resolve: @escaping (Any?) -> Void,
        reject: @escaping (String, String) -> Void
    ) {
        guard let query = HEREOptions.string(options["query"])?
            .trimmingCharacters(in: .whitespacesAndNewlines), !query.isEmpty else {
            reject("INVALID_ARGS", "query is required")
            return
        }

        do {
            let addressQuery = AddressQuery(
                query,
                near: HEREAutosuggestService.areaCenter(options)
            )
            try HEREAutosuggestService.searchEngine().searchByAddress(
                addressQuery,
                options: HEREAutosuggestService.searchOptions(options)
            ) { error, places in
                HEREAutosuggestService.resolvePlaces(
                    operation: "geocode", error: error, places: places,
                    resolve: resolve, reject: reject
                )
            }
        } catch {
            reject("SEARCH_ERROR", "geocode failed: \(error)")
        }
    }

    /// Reverse geocoding. Resolves the single closest match, or null — the same
    /// contract the REST helper had.
    static func reverseGeocode(
        _ options: [String: Any],
        resolve: @escaping (Any?) -> Void,
        reject: @escaping (String, String) -> Void
    ) {
        guard let lat = HEREOptions.double(options["latitude"] ?? options["lat"]),
              let lng = HEREOptions.double(options["longitude"] ?? options["lng"]) else {
            reject("INVALID_ARGS", "latitude and longitude are required")
            return
        }

        do {
            try HEREAutosuggestService.searchEngine().searchByCoordinates(
                GeoCoordinates(latitude: lat, longitude: lng),
                options: HEREAutosuggestService.searchOptions(options, maxItemsDefault: 1)
            ) { error, places in
                guard let first = places?.first else {
                    if let error = error { print("[HERE] reverseGeocode failed: \(error)") }
                    resolve(nil)
                    return
                }
                resolve(HERESerialization.place(first))
            }
        } catch {
            reject("SEARCH_ERROR", "reverseGeocode failed: \(error)")
        }
    }

    /// Resolves a place id (as returned by suggest) to its full details.
    static func lookupPlace(
        _ options: [String: Any],
        resolve: @escaping (Any?) -> Void,
        reject: @escaping (String, String) -> Void
    ) {
        guard let id = HEREOptions.string(options["id"]) else {
            reject("INVALID_ARGS", "id is required")
            return
        }

        do {
            try HEREAutosuggestService.searchEngine().searchByPlaceId(
                PlaceIdQuery(id),
                languageCode: HEREAutosuggestService.languageCode(options)
            ) { error, place in
                guard let place = place else {
                    if let error = error { print("[HERE] lookupPlace failed: \(error)") }
                    resolve(nil)
                    return
                }
                resolve(HERESerialization.place(place))
            }
        } catch {
            reject("SEARCH_ERROR", "lookupPlace failed: \(error)")
        }
    }

#endif
}
