package com.myshipr.heremap

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.here.sdk.core.LanguageCode
import com.here.sdk.core.UnitSystem
import com.here.sdk.location.LocationAccuracy
import com.here.sdk.location.LocationEngine
import com.here.sdk.location.LocationEngineStatus
import com.here.sdk.navigation.DestinationReachedListener
import com.here.sdk.navigation.EventTextListener
import com.here.sdk.navigation.LocationSimulator
import com.here.sdk.navigation.LocationSimulatorOptions
import com.here.sdk.navigation.ManeuverNotificationOptions
import com.here.sdk.navigation.NavigableLocationListener
import com.here.sdk.navigation.RouteDeviationListener
import com.here.sdk.navigation.RouteProgressListener
import com.here.sdk.navigation.SpeedWarningListener
import com.here.sdk.navigation.VisualNavigator
import com.here.sdk.routing.Route
import com.here.time.Duration

/**
 * Turn-by-turn guidance driven by the HERE SDK's [VisualNavigator].
 *
 * The SDK owns all of the navigation logic — map matching, maneuver timing,
 * speed warnings, camera following and route rendering. This module only:
 *   1. binds a [VisualNavigator] to the mounted [HereMapView],
 *   2. feeds it locations from either [LocationSimulator] or [LocationEngine],
 *   3. forwards its callbacks to JS as device events.
 *
 * JS side: `src/here/HereNavigation.js`.
 */
class HereNavigationModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "HereNavigationModule"
        const val MODULE_NAME = "HereNavigationModule"

        // Events emitted to JS. Keep in sync with src/here/HereNavigation.js.
        private const val EVENT_MANEUVER = "onManeuver"
        private const val EVENT_ROUTE_PROGRESS = "onRouteProgress"
        private const val EVENT_SPEED_LIMIT = "onSpeedLimit"
        private const val EVENT_SPEED_WARNING = "onSpeedWarning"
        private const val EVENT_ROUTE_DEVIATION = "onRouteDeviation"
        private const val EVENT_DESTINATION_REACHED = "onDestinationReached"
        private const val EVENT_VOICE_GUIDANCE = "onVoiceGuidance"
        private const val EVENT_LOCATION = "onNavigationLocation"

        /**
         * The live instance, so the map view can detach the navigator before its
         * surface is destroyed and [HereSdkModule] can tear navigation down
         * before disposing the engine.
         */
        @Volatile
        var instance: HereNavigationModule? = null
            private set
    }

    /** Where the navigator's location fixes come from. */
    private enum class LocationSource { SIMULATED, DEVICE }

    private var visualNavigator: VisualNavigator? = null
    private var locationSimulator: LocationSimulator? = null
    private var locationEngine: LocationEngine? = null

    /** The map currently being rendered into, if any. */
    private var boundView: HereMapView? = null

    /** Guards against re-emitting onManeuver for every progress tick. */
    private var lastManeuverIndex = -1

    /** Remembered so a reroute restarts the simulation at the same pace. */
    private var simulationSpeedFactor = 1.0

    init {
        instance = this
    }

    override fun getName(): String = MODULE_NAME

    override fun invalidate() {
        releaseForShutdown()
        instance = null
        super.invalidate()
    }

    // -------------------------------------------------------------------------
    // Guided navigation
    // -------------------------------------------------------------------------

    /**
     * Starts turn-by-turn guidance along a route previously produced by
     * [HereRoutingModule]. Pass `null` for [routeId] to use the most recent one.
     *
     * Options:
     * ```
     * {
     *   mapViewTag?: Int,        // defaults to the mounted <HereMapView>
     *   simulate?: Boolean,      // default true — drive the route with LocationSimulator
     *   speedFactor?: Double,    // simulation speed multiplier, default 1.0
     *   voiceGuidance?: Boolean, // default true — emit onVoiceGuidance texts
     *   language?: String,       // LanguageCode name, e.g. 'EN_US'
     *   unitSystem?: String      // 'metric' | 'imperialUs' | 'imperialUk'
     * }
     * ```
     */
    @ReactMethod
    fun startNavigation(routeId: String?, options: ReadableMap?, promise: Promise) {
        onUiThread(promise) {
            HereSdkModule.requireEngine()

            val route = RouteStore.get(routeId)
                ?: throw IllegalArgumentException(
                    "No route for id '${routeId ?: "<latest>"}' — calculate one first"
                )

            val navigator = ensureNavigator()
            applyGuidanceOptions(navigator, options)
            lastManeuverIndex = -1
            navigator.route = route

            attachToMap(navigator, options?.getIntOrNull("mapViewTag"))

            val simulate = options?.getBooleanOrNull("simulate") ?: true
            startLocationSource(
                navigator = navigator,
                route = route,
                source = if (simulate) LocationSource.SIMULATED else LocationSource.DEVICE,
                speedFactor = options?.getDoubleOrNull("speedFactor") ?: 1.0
            )

            Arguments.createMap().apply {
                putBoolean("started", true)
                putBoolean("simulated", simulate)
                putDouble("distanceMeters", route.lengthInMeters.toDouble())
                putDouble("durationSeconds", route.duration.seconds.toDouble())
            }
        }
    }

    /**
     * Swaps the route guidance is following, without restarting the session —
     * the reroute primitive. Call it with a freshly calculated route after
     * `onRouteDeviation`.
     *
     * If a simulation is currently driving the old route it is restarted against
     * the new one; otherwise the device location feed keeps running untouched.
     */
    @ReactMethod
    fun setRoute(routeId: String?, promise: Promise) {
        onUiThread(promise) {
            val navigator = visualNavigator
                ?: throw IllegalStateException("Navigation is not running")
            val route = RouteStore.get(routeId)
                ?: throw IllegalArgumentException(
                    "No route for id '${routeId ?: "<latest>"}'"
                )

            val wasSimulating = locationSimulator != null
            lastManeuverIndex = -1
            navigator.route = route

            if (wasSimulating) {
                startLocationSource(navigator, route, LocationSource.SIMULATED, simulationSpeedFactor)
            }
            true
        }
    }

    /** Ends guidance, stops the location feed and clears the route from the map. */
    @ReactMethod
    fun stopNavigation(promise: Promise) {
        onUiThread(promise) {
            teardown()
            true
        }
    }

    // -------------------------------------------------------------------------
    // Tracking (free driving — no route)
    // -------------------------------------------------------------------------

    /**
     * Starts route-less tracking: the map follows the vehicle and speed
     * limit / speed warning events keep firing, but there are no maneuvers.
     *
     * Always uses device positioning — there is no route to simulate along — so
     * the caller must already hold ACCESS_FINE_LOCATION.
     *
     * Options: `{ mapViewTag? }`.
     */
    @ReactMethod
    fun startTracking(options: ReadableMap?, promise: Promise) {
        onUiThread(promise) {
            HereSdkModule.requireEngine()

            val navigator = ensureNavigator()
            lastManeuverIndex = -1
            // A null route is what switches the navigator into tracking mode.
            navigator.route = null

            attachToMap(navigator, options?.getIntOrNull("mapViewTag"))
            startLocationSource(navigator, route = null, source = LocationSource.DEVICE)

            true
        }
    }

    @ReactMethod
    fun stopTracking(promise: Promise) {
        onUiThread(promise) {
            teardown()
            true
        }
    }

    // -------------------------------------------------------------------------
    // Simulation
    // -------------------------------------------------------------------------

    /**
     * Drives the navigator along a route with synthetic GPS fixes — the way to
     * exercise guidance without leaving your desk. Replaces whatever location
     * source is currently running.
     *
     * Options: `{ speedFactor?: Double }` (1.0 = real-time).
     */
    @ReactMethod
    fun startSimulation(routeId: String?, options: ReadableMap?, promise: Promise) {
        onUiThread(promise) {
            HereSdkModule.requireEngine()

            val navigator = ensureNavigator()
            val route = RouteStore.get(routeId)
                ?: navigator.route
                ?: throw IllegalArgumentException("No route to simulate along")

            if (navigator.route == null) navigator.route = route

            startLocationSource(
                navigator = navigator,
                route = route,
                source = LocationSource.SIMULATED,
                speedFactor = options?.getDoubleOrNull("speedFactor") ?: 1.0
            )
            true
        }
    }

    @ReactMethod
    fun stopSimulation(promise: Promise) {
        onUiThread(promise) {
            stopLocationSources()
            true
        }
    }

    // -------------------------------------------------------------------------
    // Navigator setup
    // -------------------------------------------------------------------------

    private fun ensureNavigator(): VisualNavigator =
        visualNavigator ?: VisualNavigator().also { navigator ->
            attachListeners(navigator)
            visualNavigator = navigator
        }

    /**
     * Binds the navigator to a mounted map so the SDK can draw the route, the
     * maneuver arrows and the location indicator, and follow the vehicle.
     *
     * Navigation still runs (and still emits events) when no map is mounted —
     * that is the headless case — so a missing view is a warning, not an error.
     */
    private fun attachToMap(navigator: VisualNavigator, mapViewTag: Int?) {
        val view = HereMapViewManager.resolveViewOrActive(mapViewTag)
        if (view == null) {
            Log.w(TAG, "no HereMapView mounted — navigating without map rendering")
            return
        }
        if (boundView !== view) {
            navigator.stopRendering()
            navigator.startRendering(view.mapView)
            boundView = view
        }
    }

    private fun applyGuidanceOptions(navigator: VisualNavigator, options: ReadableMap?) {
        val voiceGuidance = options?.getBooleanOrNull("voiceGuidance") ?: true

        navigator.maneuverNotificationOptions = ManeuverNotificationOptions().apply {
            language = parseLanguage(options?.getStringOrNull("language"))
            unitSystem = parseUnitSystem(options?.getStringOrNull("unitSystem"))
        }
        // Dropping the listener is what actually silences guidance; the options
        // above only shape the text.
        navigator.eventTextListener =
            if (voiceGuidance) EventTextListener { eventText ->
                emit(EVENT_VOICE_GUIDANCE, HereNavigationSerialization.eventText(eventText))
            } else null
    }

    private fun parseLanguage(raw: String?): LanguageCode {
        if (raw.isNullOrBlank()) return LanguageCode.EN_US
        val normalized = raw.replace('-', '_').uppercase()
        return try {
            LanguageCode.valueOf(normalized)
        } catch (e: IllegalArgumentException) {
            Log.w(TAG, "unknown language '$raw', using EN_US")
            LanguageCode.EN_US
        }
    }

    private fun parseUnitSystem(raw: String?): UnitSystem = when (raw?.lowercase()) {
        "imperialus", "imperial_us", "imperial" -> UnitSystem.IMPERIAL_US
        "imperialuk", "imperial_uk" -> UnitSystem.IMPERIAL_UK
        else -> UnitSystem.METRIC
    }

    /**
     * Wires every navigator callback to a JS event. Attached once per navigator;
     * [applyGuidanceOptions] may later replace the voice-guidance listener.
     */
    private fun attachListeners(navigator: VisualNavigator) {
        navigator.routeProgressListener = RouteProgressListener { progress ->
            emit(EVENT_ROUTE_PROGRESS, HereNavigationSerialization.routeProgress(progress))
            emitManeuverIfChanged(navigator, progress)
        }

        navigator.navigableLocationListener = NavigableLocationListener { location ->
            emit(EVENT_LOCATION, HereNavigationSerialization.navigableLocation(location))
        }

        attachSpeedLimitListener(navigator)

        navigator.speedWarningListener = SpeedWarningListener { status ->
            emit(EVENT_SPEED_WARNING, HereNavigationSerialization.speedWarning(status))
        }

        navigator.routeDeviationListener = RouteDeviationListener { deviation ->
            emit(EVENT_ROUTE_DEVIATION, HereNavigationSerialization.routeDeviation(deviation))
        }

        navigator.destinationReachedListener = DestinationReachedListener {
            emit(EVENT_DESTINATION_REACHED, Arguments.createMap())
        }

        navigator.eventTextListener = EventTextListener { eventText ->
            emit(EVENT_VOICE_GUIDANCE, HereNavigationSerialization.eventText(eventText))
        }
    }

    /**
     * `SpeedLimitListener` is deprecated in 4.27 but is still the only way
     * VisualNavigator reports posted limits — `RoadAttributes` carries road flags,
     * not speeds. Isolated here so the suppression covers exactly this call.
     */
    @Suppress("DEPRECATION")
    private fun attachSpeedLimitListener(navigator: VisualNavigator) {
        navigator.speedLimitListener =
            com.here.sdk.navigation.SpeedLimitListener { speedLimit ->
                emit(EVENT_SPEED_LIMIT, HereNavigationSerialization.speedLimit(speedLimit))
            }
    }

    /**
     * Route progress fires several times a second; the maneuver only changes at
     * a turn, so JS gets one event per turn rather than one per tick.
     */
    private fun emitManeuverIfChanged(navigator: VisualNavigator, progress: com.here.sdk.navigation.RouteProgress) {
        val next = progress.maneuverProgress?.firstOrNull() ?: return
        if (next.maneuverIndex == lastManeuverIndex) return

        val maneuver = navigator.getManeuver(next.maneuverIndex) ?: return
        lastManeuverIndex = next.maneuverIndex
        emit(
            EVENT_MANEUVER,
            HereNavigationSerialization.maneuver(
                maneuver = maneuver,
                index = next.maneuverIndex,
                distanceMeters = next.remainingDistanceInMeters.toDouble(),
                durationSeconds = next.remainingDuration.seconds.toDouble()
            )
        )
    }

    // -------------------------------------------------------------------------
    // Location sources
    // -------------------------------------------------------------------------

    private fun startLocationSource(
        navigator: VisualNavigator,
        route: Route?,
        source: LocationSource,
        speedFactor: Double = 1.0
    ) {
        stopLocationSources()

        when (source) {
            LocationSource.SIMULATED -> {
                val simulationRoute = route
                    ?: throw IllegalArgumentException("Simulation needs a route")
                simulationSpeedFactor = speedFactor.coerceIn(0.1, 20.0)
                val options = LocationSimulatorOptions().apply {
                    this.speedFactor = simulationSpeedFactor
                    notificationInterval = Duration.ofMillis(500)
                }
                locationSimulator = LocationSimulator(simulationRoute, options).apply {
                    // The navigator is itself a LocationListener, so simulated
                    // fixes go straight into map matching.
                    listener = navigator
                    start()
                }
            }

            LocationSource.DEVICE -> {
                val engine = locationEngine ?: LocationEngine().also { locationEngine = it }
                engine.addLocationListener(navigator)
                val status = engine.start(LocationAccuracy.NAVIGATION)
                if (status != LocationEngineStatus.ENGINE_STARTED &&
                    status != LocationEngineStatus.ALREADY_STARTED
                ) {
                    engine.removeLocationListener(navigator)
                    throw IllegalStateException(
                        "Device positioning could not start: $status"
                    )
                }
            }
        }
    }

    private fun stopLocationSources() {
        locationSimulator?.stop()
        locationSimulator = null

        locationEngine?.let { engine ->
            visualNavigator?.let { engine.removeLocationListener(it) }
            engine.stop()
        }
    }

    // -------------------------------------------------------------------------
    // Teardown
    // -------------------------------------------------------------------------

    private fun teardown() {
        stopLocationSources()
        visualNavigator?.let { navigator ->
            navigator.route = null
            navigator.stopRendering()
        }
        boundView = null
        lastManeuverIndex = -1
    }

    /**
     * Called by [HereMapView] immediately before its native surface goes away.
     *
     * This runs synchronously when already on the UI thread: posting it would
     * leave the navigator rendering into a MapView that `onDestroy()` has
     * already torn down.
     */
    fun onMapViewDestroyed(view: HereMapView) {
        if (boundView !== view) return
        runOnUiThreadNow {
            visualNavigator?.stopRendering()
            boundView = null
        }
    }

    /**
     * Full release, used before the SDK engine is disposed and when the React
     * context goes away.
     */
    fun releaseForShutdown() = runOnUiThreadNow {
        try {
            teardown()
            locationEngine = null
            visualNavigator = null
        } catch (e: Exception) {
            Log.w(TAG, "shutdown cleanup failed: ${e.message}")
        }
    }

    /** Runs [block] on the UI thread, inline when already there. */
    private fun runOnUiThreadNow(block: () -> Unit) {
        if (UiThreadUtil.isOnUiThread()) block() else UiThreadUtil.runOnUiThread(block)
    }

    // -------------------------------------------------------------------------
    // Bridge helpers
    // -------------------------------------------------------------------------

    /**
     * Runs [block] on the UI thread — every VisualNavigator, MapView and
     * LocationSimulator call has to be there — and settles [promise] with its
     * result or its exception.
     */
    private fun onUiThread(promise: Promise, block: () -> Any?) {
        UiThreadUtil.runOnUiThread {
            try {
                when (val result = block()) {
                    is WritableMap -> promise.resolve(result)
                    is Boolean -> promise.resolve(result)
                    null -> promise.resolve(null)
                    else -> promise.resolve(result.toString())
                }
            } catch (e: Exception) {
                Log.e(TAG, "navigation call failed: ${e.message}", e)
                promise.reject("HERE_NAVIGATION_ERROR", e.message ?: "Navigation call failed", e)
            }
        }
    }

    private fun emit(eventName: String, payload: WritableMap) {
        if (!reactContext.hasActiveReactInstance()) return
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, payload)
    }

    // Required by NativeEventEmitter on the JS side.
    @ReactMethod
    fun addListener(eventName: String) = Unit

    @ReactMethod
    fun removeListeners(count: Int) = Unit
}
