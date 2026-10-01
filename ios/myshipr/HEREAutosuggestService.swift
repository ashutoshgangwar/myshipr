import Foundation

#if canImport(heresdk)
import heresdk
#endif

/// Type-ahead suggestions and free-text / category POI search, backed by the
/// HERE SDK Explore `SearchEngine`.
///
/// This is the replacement for the `autosuggest.search.hereapi.com` and
/// `discover` REST endpoints — everything here ships inside the SDK, so the app
/// makes no HTTP request of its own for it.
@objcMembers
class HEREAutosuggestService: NSObject {

    /// Matches the previous REST default of `limit=5`.
    static let defaultMaxItems: Int32 = 5

#if canImport(heresdk)

    /// Created lazily: the engine requires `SDKNativeEngine` to exist, which
    /// only happens once `HereMapModule.initSDK` has run.
    private static var engine: SearchEngine?

    static func searchEngine() throws -> SearchEngine {
        if let engine = engine { return engine }
        let created = try SearchEngine()
        engine = created
        return created
    }

    // MARK: - Suggestions

    static func suggest(
        _ options: [String: Any],
        resolve: @escaping (Any?) -> Void,
        reject: @escaping (String, String) -> Void
    ) {
        guard let query = HEREOptions.string(options["query"])?
            .trimmingCharacters(in: .whitespacesAndNewlines), !query.isEmpty else {
            resolve([])
            return
        }

        do {
            let textQuery = TextQuery(query, area: TextQuery.Area(areaCenter: areaCenter(options)))
            try searchEngine().suggestByText(
                textQuery,
                options: searchOptions(options)
            ) { error, suggestions in
                guard let suggestions = suggestions else {
                    if let error = error {
                        reject("SEARCH_ERROR", "suggest failed: \(error)")
                    } else {
                        resolve([])
                    }
                    return
                }
                resolve(suggestions.map { HERESerialization.suggestion($0) })
            }
        } catch {
            reject("SEARCH_ERROR", "suggest failed: \(error)")
        }
    }

    // MARK: - Text & category search

    static func searchByText(
        _ options: [String: Any],
        resolve: @escaping (Any?) -> Void,
        reject: @escaping (String, String) -> Void
    ) {
        guard let query = HEREOptions.string(options["query"])?
            .trimmingCharacters(in: .whitespacesAndNewlines), !query.isEmpty else {
            resolve([])
            return
        }

        do {
            let textQuery = TextQuery(query, area: TextQuery.Area(areaCenter: areaCenter(options)))
            try searchEngine().searchByText(
                textQuery,
                options: searchOptions(options)
            ) { error, places in
                resolvePlaces(operation: "searchByText", error: error, places: places,
                              resolve: resolve, reject: reject)
            }
        } catch {
            reject("SEARCH_ERROR", "searchByText failed: \(error)")
        }
    }

    /// POI search by HERE category id, e.g. truck stops, fuel or EV charging.
    static func searchByCategory(
        _ options: [String: Any],
        resolve: @escaping (Any?) -> Void,
        reject: @escaping (String, String) -> Void
    ) {
        let ids = HEREOptions.strings(options["categories"])
        guard !ids.isEmpty else {
            reject("INVALID_ARGS", "categories must contain at least one category id")
            return
        }

        do {
            let categories = ids.map { PlaceCategory(id: $0) }
            let area = CategoryQuery.Area(areaCenter: areaCenter(options))
            let query: CategoryQuery
            if let filter = HEREOptions.string(options["filter"]) {
                query = CategoryQuery(categories, filter: filter, area: area)
            } else {
                query = CategoryQuery(categories, area: area)
            }

            try searchEngine().searchByCategory(
                query,
                options: searchOptions(options)
            ) { error, places in
                resolvePlaces(operation: "searchByCategory", error: error, places: places,
                              resolve: resolve, reject: reject)
            }
        } catch {
            reject("SEARCH_ERROR", "searchByCategory failed: \(error)")
        }
    }

    // MARK: - Shared helpers

    /// `noResultsFound` is a normal outcome for a query nobody matched — it
    /// resolves an empty list rather than surfacing as a failure.
    static func resolvePlaces(
        operation: String,
        error: SearchError?,
        places: [Place]?,
        resolve: @escaping (Any?) -> Void,
        reject: @escaping (String, String) -> Void
    ) {
        if let error = error, error != .noResultsFound {
            reject("SEARCH_ERROR", "\(operation) failed: \(error)")
            return
        }
        resolve((places ?? []).map { HERESerialization.place($0) })
    }

    static func searchOptions(
        _ options: [String: Any],
        maxItemsDefault: Int32 = defaultMaxItems
    ) -> SearchOptions {
        SearchOptions(
            languageCode: languageCode(options),
            maxItems: HEREOptions.int32(options["limit"]) ?? maxItemsDefault
        )
    }

    static func languageCode(_ options: [String: Any]) -> LanguageCode {
        guard let raw = HEREOptions.string(options["lang"]) else { return .enUs }
        // "en-US" / "en_US" / "enUs" all match the SDK case `.enUs`; compare on
        // letters/digits only, case-insensitively.
        let target = raw.filter { $0.isLetter || $0.isNumber }.lowercased()
        return LanguageCode.allCases.first {
            String(describing: $0).lowercased() == target
        } ?? .enUs
    }

    /// Every HERE query is biased toward an area. Falls back to Null Island the
    /// same way the previous REST helper did when the caller has no fix yet.
    static func areaCenter(_ options: [String: Any]) -> GeoCoordinates {
        let lat = HEREOptions.double(options["lat"] ?? options["latitude"]) ?? 0
        let lng = HEREOptions.double(options["lng"] ?? options["longitude"]) ?? 0
        return GeoCoordinates(latitude: lat, longitude: lng)
    }

#endif
}
