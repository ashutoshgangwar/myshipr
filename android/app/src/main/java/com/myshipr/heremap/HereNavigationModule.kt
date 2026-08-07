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
import com.here.sdk.core.Anchor2D
import com.here.sdk.core.LanguageCode
import com.here.sdk.core.UnitSystem
import com.here.sdk.location.ConfirmationStatus
import com.here.sdk.location.LocationAccuracy
import com.here.sdk.location.LocationEngine
import com.here.sdk.location.LocationEngineStatus
import com.here.sdk.mapview.MapMeasure
import com.here.sdk.navigation.DestinationReachedListener
import com.here.sdk.navigation.DynamicCameraBehavior
import com.here.sdk.navigation.EventTextListener
import com.here.sdk.navigation.FixedCameraBehavior
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

        // Driving-view camera defaults. The SDK's own default follows the
        // vehicle but derives tilt and zoom from speed, so a real drive that
        // starts parked opens flat and far out — nothing like the tilted
        // road-ahead view a simulated run at 6× shows. These pin it instead.
        //
        // Tilt and the principal point together decide whether the horizon
        // falls inside the viewport: the top edge sits roughly 40° above the
        // camera axis at this anchor, so anything past ~50° of tilt aims the
        // top of the screen beyond the horizon and the scene's sky band shows
        // as a blue-grey wash across the top of the map. Keep tilt + that
        // offset under 90°; if a sliver of sky still shows on a taller screen,
        // lower the tilt rather than the anchor.
        private const val DEFAULT_CAMERA_TILT = 45.0
        private const val DEFAULT_CAMERA_DISTANCE = 350.0

        // Vehicle sits about two-thirds down the screen, so the road ahead
        // fills the frame — the "looking up the road" framing drivers expect.
        private const val DEFAULT_CAMERA_PRINCIPAL_Y = 0.68

        // Guard rails for the zoom controls: closer than ~50 m clips through
        // the vehicle, further than ~5 km stops being a driving view.
        private const val MIN_CAMERA_DISTANCE = 50.0
        private const val MAX_CAMERA_DISTANCE = 5000.0

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

    /** Says the maneuvers out loud; the SDK only writes them. */
    private var speaker: HereSpeaker? = null

    /** The map currently being rendered into, if any. */
    private var boundView: HereMapView? = null

    /** Guards against re-emitting onManeuver for every progress tick. */
    private var lastManeuverIndex = -1

    /** Remembered so a reroute restarts the simulation at the same pace. */
    private var simulationSpeedFactor = 1.0

    /**
     * The live driving-camera settings. Kept here rather than read back off the
     * behavior so a zoom step preserves the tilt and framing, and so the same
     * view is restored when guidance is handed a new navigator.
     */
    private var cameraTilt = DEFAULT_CAMERA_TILT
    private var cameraDistance = DEFAULT_CAMERA_DISTANCE
    private var cameraPrincipalY = DEFAULT_CAMERA_PRINCIPAL_Y
    private var cameraBearing: Double? = null
    private var cameraMode = "fixed"

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
     *   unitSystem?: String,     // 'metric' | 'imperialUs' | 'imperialUk'
     *   camera?: {               // driving view; see setCameraBehavior
     *     mode?: 'fixed' | 'dynamic' | 'free',
     *     tiltDegrees?, distanceMeters?, principalPointY?, bearingDegrees?
     *   }
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
            readCameraOptions(options?.getMap("camera"))
            applyCameraBehavior(navigator)

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
            readCameraOptions(options?.getMap("camera"))
            applyCameraBehavior(navigator)
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

    /**
     * Pins the camera to a driving view instead of leaving it on the SDK's
     * speed-derived default.
     *
     * `mode` picks what follows the vehicle:
     *   - `fixed`   — constant tilt and distance (the default here)
     *   - `dynamic` — the SDK varies tilt/zoom with speed
     *   - `free`    — nobody follows; the map keeps whatever the user's pan,
     *                 pinch and rotate gestures leave it at
     */
    private fun applyCameraBehavior(navigator: VisualNavigator) {
        val principalPoint = Anchor2D(0.5, cameraPrincipalY)
        navigator.cameraBehavior = when (cameraMode) {
            "free" -> null
            "dynamic" -> DynamicCameraBehavior().apply {
                normalizedPrincipalPoint = principalPoint
            }
            else -> FixedCameraBehavior().apply {
                normalizedPrincipalPoint = principalPoint
                cameraTiltInDegrees = cameraTilt
                // null bearing means "point where the vehicle is heading",
                // which is what makes the road run up the screen.
                cameraBearingInDegrees = cameraBearing
                zoom = MapMeasure(MapMeasure.Kind.DISTANCE_IN_METERS, cameraDistance)
            }
        }
    }

    /**
     * The driver panned, pinched or rotated the map the navigator is drawing
     * into. Hand them the camera — otherwise the next location fix snaps it
     * straight back and the gesture looks broken. [setCameraBehavior] with
     * `mode: 'fixed'` (the re-centre button) takes it back.
     */
    fun onUserTookCamera(view: HereMapView) {
        if (view !== boundView || cameraMode == "free") return
        cameraMode = "free"
        UiThreadUtil.runOnUiThread {
            visualNavigator?.let { applyCameraBehavior(it) }
        }
    }

    /**
     * Folds a camera options block into the remembered settings. Absent keys
     * keep their current value, so a zoom step can send `distanceMeters` alone
     * without flattening the tilt.
     */
    private fun readCameraOptions(camera: ReadableMap?) {
        if (camera == null) return
        camera.getStringOrNull("mode")?.let { cameraMode = it }
        camera.getDoubleOrNull("tiltDegrees")?.let { cameraTilt = it }
        camera.getDoubleOrNull("distanceMeters")?.let {
            cameraDistance = it.coerceIn(MIN_CAMERA_DISTANCE, MAX_CAMERA_DISTANCE)
        }
        camera.getDoubleOrNull("principalPointY")?.let {
            cameraPrincipalY = it.coerceIn(0.0, 1.0)
        }
        // Absent leaves the current setting; an explicit null means heading-up.
        if (camera.hasKey("bearingDegrees")) {
            cameraBearing = camera.getDoubleOrNull("bearingDegrees")
        }
    }

    /** The settings actually in force, so JS need not mirror the clamping. */
    private fun cameraState(): WritableMap = Arguments.createMap().apply {
        putString("mode", cameraMode)
        putDouble("tiltDegrees", cameraTilt)
        putDouble("distanceMeters", cameraDistance)
        putDouble("principalPointY", cameraPrincipalY)
        if (cameraBearing != null) putDouble("bearingDegrees", cameraBearing!!)
        else putNull("bearingDegrees")
    }

    /**
     * Retunes the camera while guidance is running — what the zoom controls and
     * the re-centre button call. Takes the same block [startNavigation] accepts
     * under `camera`.
     */
    @ReactMethod
    fun setCameraBehavior(camera: ReadableMap?, promise: Promise) {
        onUiThread(promise) {
            readCameraOptions(camera)
            visualNavigator?.let { applyCameraBehavior(it) }
            cameraState()
        }
    }

    private fun applyGuidanceOptions(navigator: VisualNavigator, options: ReadableMap?) {
        val voiceGuidance = options?.getBooleanOrNull("voiceGuidance") ?: true
        // The SDK writes the instruction but never says it, so speaking is a
        // separate switch: a screen that wants to run its own TTS off the
        // onVoiceGuidance event can keep the text and silence this one.
        val speak = options?.getBooleanOrNull("speak") ?: true
        val language = options?.getStringOrNull("language")

        navigator.maneuverNotificationOptions = ManeuverNotificationOptions().apply {
            this.language = parseLanguage(language)
            unitSystem = parseUnitSystem(options?.getStringOrNull("unitSystem"))
        }

        if (voiceGuidance && speak) {
            val speaker = ensureSpeaker()
            speaker.setLanguage(language)
            speaker.enabled = true
        } else {
            this.speaker?.enabled = false
        }

        // Dropping the listener is what actually silences guidance; the options
        // above only shape the text.
        navigator.eventTextListener =
            if (voiceGuidance) EventTextListener { eventText ->
                speaker?.speak(eventText.text)
                emit(EVENT_VOICE_GUIDANCE, HereNavigationSerialization.eventText(eventText))
            } else null
    }

    private fun ensureSpeaker(): HereSpeaker =
        speaker ?: HereSpeaker(reactContext).also { speaker = it }

    /**
     * Mutes or unmutes spoken guidance mid-trip. The `onVoiceGuidance` events
     * keep arriving either way, so the on-screen instruction stays live while
     * the cab is quiet.
     */
    @ReactMethod
    fun setSpeechEnabled(enabled: Boolean, promise: Promise) {
        onUiThread(promise) {
            if (enabled) ensureSpeaker().enabled = true else speaker?.enabled = false
            enabled
        }
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

                // HERE Positioning refuses to start until the app declares that
                // HERE's privacy notice is covered by its own — see
                // confirmPrivacyNotice(). Declare it before the first start.
                var confirmation = confirmPrivacyNotice(engine)
                var status = engine.start(LocationAccuracy.NAVIGATION)

                // The declaration is forwarded to the SDK's positioning client,
                // which does not exist until a start has built it — so the first
                // one can be dropped on a cold engine. Declare again and retry.
                if (status == LocationEngineStatus.PRIVACY_NOTICE_UNCONFIRMED) {
                    confirmation = confirmPrivacyNotice(engine)
                    status = engine.start(LocationAccuracy.NAVIGATION)
                    if (status == LocationEngineStatus.PRIVACY_NOTICE_UNCONFIRMED) {
                        engine.removeLocationListener(navigator)
                        throw IllegalStateException(
                            "HERE Positioning rejected the privacy-notice " +
                                "confirmation ($confirmation). Check that the " +
                                "HERE credentials are licensed for positioning."
                        )
                    }
                }

                if (!isPositioningStarted(status)) {
                    engine.removeLocationListener(navigator)
                    throw IllegalStateException(
                        "Device positioning could not start: $status"
                    )
                }
            }
        }
    }

    /**
     * Whether a [LocationEngine.start] result means positioning is running.
     *
     * Three of the enum's members mean success, not one: ENGINE_STARTED for a
     * cold start, ALREADY_STARTED when a feed is up, and a bare OK — which is
     * what a start returns once the privacy-notice confirmation has been
     * accepted. Everything else is a genuine failure.
     */
    private fun isPositioningStarted(status: LocationEngineStatus): Boolean =
        status == LocationEngineStatus.ENGINE_STARTED ||
            status == LocationEngineStatus.ALREADY_STARTED ||
            status == LocationEngineStatus.OK

    /**
     * Declares to the SDK that this app's own privacy notice covers HERE's.
     *
     * HERE Positioning is a data-collecting service, so the SDK will not start
     * it until the app states that it has told its users — until then every
     * `start()` answers PRIVACY_NOTICE_UNCONFIRMED. This is a one-off
     * declaration by the app, not a consent dialog for the driver.
     *
     * The obligation behind it is real: MyShipr's privacy notice has to
     * actually include the HERE positioning disclosure for this call to be
     * truthful. PENDING means the SDK is still writing the confirmation, which
     * is fine — the retry that follows picks it up.
     *
     * Returns null when the SDK threw: internally this hands the flag to a
     * positioning client it dereferences without a null check, so on a cold
     * engine it can fail rather than answer. That is recoverable — the caller
     * starts the engine and declares again — so it must not take the whole
     * navigation session down with it.
     */
    private fun confirmPrivacyNotice(engine: LocationEngine): ConfirmationStatus? = try {
        engine.confirmHEREPrivacyNoticeInclusion().also { status ->
            if (status != ConfirmationStatus.OK && status != ConfirmationStatus.PENDING) {
                Log.w(TAG, "privacy-notice confirmation returned $status")
            }
        }
    } catch (e: Exception) {
        Log.w(TAG, "privacy-notice confirmation threw: ${e.message}")
        null
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
        // Cut off any half-spoken instruction — guidance for a trip that just
        // ended is worse than silence.
        speaker?.stop()
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
            speaker?.shutdown()
            speaker = null
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
