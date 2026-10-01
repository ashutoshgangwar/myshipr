package com.myshipr.heremap

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableArray
import com.here.sdk.core.GeoCoordinates
import com.here.sdk.core.LanguageCode
import com.here.sdk.core.engine.SDKNativeEngine
import com.here.sdk.search.AddressQuery
import com.here.sdk.search.CategoryQuery
import com.here.sdk.search.Place
import com.here.sdk.search.PlaceCategory
import com.here.sdk.search.PlaceIdQuery
import com.here.sdk.search.SearchEngine
import com.here.sdk.search.SearchError
import com.here.sdk.search.SearchOptions
import com.here.sdk.search.TextQuery

/**
 * Search, geocoding and POI discovery backed by the HERE SDK Explore
 * `SearchEngine` — the replacement for the autosuggest / geocode / revgeocode /
 * lookup / discover REST endpoints. Everything here is what the Explore edition
 * already ships, so no REST call is made for any of it.
 *
 * The engine is created lazily on first use because it requires
 * [SDKNativeEngine] to be initialised (HereMapModule.initSDK).
 */
object HereSearchService {

    private const val TAG = "HereSearchService"

    /** Matches the previous REST default of `limit=5`. */
    private const val DEFAULT_MAX_ITEMS = 5

    @Volatile
    private var engine: SearchEngine? = null

    private fun searchEngine(): SearchEngine {
        engine?.let { return it }
        synchronized(this) {
            engine?.let { return it }
            if (SDKNativeEngine.getSharedInstance() == null) {
                throw IllegalStateException(
                    "HERE SDK is not initialised — call HereMapModule.initSDK() first"
                )
            }
            return SearchEngine().also { engine = it }
        }
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Type-ahead suggestions. Options: `{ query, lat?, lng?, limit?, lang? }`.
     * Resolves an array of place-shaped maps (see [HereSdkSerialization]).
     */
    fun suggest(options: ReadableMap, promise: Promise) {
        val query = options.getStringOrNull("query")?.trim()
        if (query.isNullOrEmpty()) {
            promise.resolve(Arguments.createArray())
            return
        }

        runCatchingSearch(promise) {
            val area = TextQuery.Area(areaCenter(options))
            searchEngine().suggestByText(
                TextQuery(query, area),
                searchOptions(options)
            ) { error, suggestions ->
                if (error != null && suggestions == null) {
                    rejectSearch(promise, "suggest", error)
                    return@suggestByText
                }
                val results = Arguments.createArray()
                suggestions?.forEach { results.pushMap(HereSdkSerialization.suggestion(it)) }
                promise.resolve(results)
            }
        }
    }

    /**
     * Free-text place search. Unlike [suggest] every result carries a
     * resolved coordinate, so this is what a "search" button should call.
     */
    fun searchByText(options: ReadableMap, promise: Promise) {
        val query = options.getStringOrNull("query")?.trim()
        if (query.isNullOrEmpty()) {
            promise.resolve(Arguments.createArray())
            return
        }

        runCatchingSearch(promise) {
            val area = TextQuery.Area(areaCenter(options))
            searchEngine().searchByText(
                TextQuery(query, area),
                searchOptions(options)
            ) { error, places ->
                resolvePlaces(promise, "searchByText", error, places)
            }
        }
    }

    /**
     * POI search by HERE place category, e.g. truck stops, fuel stations or EV
     * chargers. Options: `{ categories: [String], lat, lng, filter?, limit? }`
     * where each category is a HERE category id such as `"700-7600-0116"` or
     * one of the [PlaceCategory] constants.
     */
    fun searchByCategory(options: ReadableMap, promise: Promise) {
        val categoryIds = options.getArray("categories")
            ?.let { array -> (0 until array.size()).mapNotNull { array.getString(it) } }
            .orEmpty()

        if (categoryIds.isEmpty()) {
            promise.reject("INVALID_ARGS", "categories must contain at least one category id")
            return
        }

        runCatchingSearch(promise) {
            val categories = categoryIds.map { PlaceCategory(it) }
            val area = CategoryQuery.Area(areaCenter(options))
            val filter = options.getStringOrNull("filter")
            val query = if (filter.isNullOrEmpty()) {
                CategoryQuery(categories, area)
            } else {
                CategoryQuery(categories, filter, area)
            }

            searchEngine().searchByCategory(query, searchOptions(options)) { error, places ->
                resolvePlaces(promise, "searchByCategory", error, places)
            }
        }
    }

    /** Forward geocoding: free-form address text → coordinates. */
    fun geocode(options: ReadableMap, promise: Promise) {
        val query = options.getStringOrNull("query")?.trim()
        if (query.isNullOrEmpty()) {
            promise.reject("INVALID_ARGS", "query is required")
            return
        }

        runCatchingSearch(promise) {
            searchEngine().searchByAddress(
                AddressQuery(query, areaCenter(options)),
                searchOptions(options)
            ) { error, places ->
                resolvePlaces(promise, "geocode", error, places)
            }
        }
    }

    /**
     * Reverse geocoding: coordinates → the address under them. Resolves the
     * single closest match (or null), matching the old REST helper's contract.
     */
    fun reverseGeocode(options: ReadableMap, promise: Promise) {
        val lat = options.getDoubleOrNull("latitude") ?: options.getDoubleOrNull("lat")
        val lng = options.getDoubleOrNull("longitude") ?: options.getDoubleOrNull("lng")

        if (lat == null || lng == null) {
            promise.reject("INVALID_ARGS", "latitude and longitude are required")
            return
        }

        runCatchingSearch(promise) {
            searchEngine().searchByCoordinates(
                GeoCoordinates(lat, lng),
                searchOptions(options, defaultMaxItems = 1)
            ) { error, places ->
                val first = places?.firstOrNull()
                if (first == null) {
                    if (error != null) Log.w(TAG, "reverseGeocode failed: $error")
                    promise.resolve(null)
                } else {
                    promise.resolve(HereSdkSerialization.placeToMap(first))
                }
            }
        }
    }

    /** Resolves a place id (as returned by [suggest]) to its full details. */
    fun lookupPlace(options: ReadableMap, promise: Promise) {
        val id = options.getStringOrNull("id")
        if (id.isNullOrEmpty()) {
            promise.reject("INVALID_ARGS", "id is required")
            return
        }

        runCatchingSearch(promise) {
            searchEngine().searchByPlaceId(
                PlaceIdQuery(id),
                resolveLanguageCode(options)
            ) { error, place ->
                if (place == null) {
                    if (error != null) Log.w(TAG, "lookupPlace failed: $error")
                    promise.resolve(null)
                } else {
                    promise.resolve(HereSdkSerialization.placeToMap(place))
                }
            }
        }
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private fun resolvePlaces(
        promise: Promise,
        operation: String,
        error: SearchError?,
        places: List<Place>?
    ) {
        // NO_RESULTS_FOUND is a normal outcome for a query nobody matched —
        // resolve an empty list rather than surfacing it as a failure.
        if (error != null && error != SearchError.NO_RESULTS_FOUND) {
            rejectSearch(promise, operation, error)
            return
        }
        val results: WritableArray = Arguments.createArray()
        places?.forEach { results.pushMap(HereSdkSerialization.placeToMap(it)) }
        promise.resolve(results)
    }

    private fun rejectSearch(promise: Promise, operation: String, error: SearchError) {
        Log.w(TAG, "$operation failed: $error")
        promise.reject("SEARCH_ERROR", "$operation failed: $error")
    }

    /** Guards the synchronous part — engine creation and query construction. */
    private inline fun runCatchingSearch(promise: Promise, block: () -> Unit) {
        try {
            block()
        } catch (e: Exception) {
            Log.e(TAG, "search request failed: ${e.message}")
            promise.reject("SEARCH_ERROR", e.message ?: "Unknown search error", e)
        }
    }

    private fun searchOptions(
        options: ReadableMap,
        defaultMaxItems: Int = DEFAULT_MAX_ITEMS
    ): SearchOptions = SearchOptions().apply {
        maxItems = options.getIntOrNull("limit") ?: defaultMaxItems
        resolveLanguageCode(options)?.let { languageCode = it }
    }

    private fun resolveLanguageCode(options: ReadableMap): LanguageCode? {
        val raw = options.getStringOrNull("lang") ?: return LanguageCode.EN_US
        return try {
            LanguageCode.valueOf(raw.uppercase().replace('-', '_'))
        } catch (e: IllegalArgumentException) {
            Log.w(TAG, "unknown language code '$raw', falling back to EN_US")
            LanguageCode.EN_US
        }
    }

    /**
     * Every HERE query is biased toward an area. Falls back to Null Island the
     * same way the previous REST helper did when the caller has no fix yet.
     */
    private fun areaCenter(options: ReadableMap): GeoCoordinates {
        val lat = options.getDoubleOrNull("lat") ?: options.getDoubleOrNull("latitude") ?: 0.0
        val lng = options.getDoubleOrNull("lng") ?: options.getDoubleOrNull("longitude") ?: 0.0
        return GeoCoordinates(lat, lng)
    }
}

// -----------------------------------------------------------------------------
// ReadableMap accessors — HERE options are all optional, ReadableMap is not.
// -----------------------------------------------------------------------------

internal fun ReadableMap.getStringOrNull(key: String): String? =
    if (hasKey(key) && !isNull(key)) getString(key) else null

internal fun ReadableMap.getDoubleOrNull(key: String): Double? =
    if (hasKey(key) && !isNull(key)) getDouble(key) else null

internal fun ReadableMap.getIntOrNull(key: String): Int? =
    if (hasKey(key) && !isNull(key)) getInt(key) else null

internal fun ReadableMap.getBooleanOrNull(key: String): Boolean? =
    if (hasKey(key) && !isNull(key)) getBoolean(key) else null
