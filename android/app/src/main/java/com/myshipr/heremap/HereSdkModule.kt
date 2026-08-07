package com.myshipr.heremap

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import com.here.sdk.core.Authentication
import com.here.sdk.core.engine.AuthenticationMode
import com.here.sdk.core.engine.SDKNativeEngine
import com.here.sdk.core.engine.SDKOptions
import java.net.HttpURLConnection
import java.net.URL

/**
 * Owns the lifetime of the shared [SDKNativeEngine].
 *
 * Every other HERE bridge (routing, navigation, the map view) needs the shared
 * engine to exist, so this module is the single place that creates and tears it
 * down. Call `initialize` once at app start and before rendering any map.
 *
 * JS side: `src/here/HereSdk.js`.
 */
class HereSdkModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "HereSdkModule"
        const val MODULE_NAME = "HereSdkModule"

        /** The Optimized Client Map — the only catalog Navigate renders from. */
        private const val OCM_CATALOG_HRN = "hrn:here:data::olp-here:ocm"
        private const val HTTP_FORBIDDEN = 403

        /** True once [SDKNativeEngine.makeSharedInstance] has succeeded. */
        fun isReady(): Boolean = SDKNativeEngine.getSharedInstance() != null

        /** Throws with an actionable message when the engine is missing. */
        fun requireEngine(): SDKNativeEngine =
            SDKNativeEngine.getSharedInstance()
                ?: throw IllegalStateException(
                    "HERE SDK is not initialised — call HereSdk.initialize() first"
                )
    }

    override fun getName(): String = MODULE_NAME

    /**
     * Creates the shared HERE SDK engine. Resolves `true` when this call created
     * it and `false` when it already existed, so repeated calls are safe.
     */
    @ReactMethod
    fun initialize(
        accessKeyId: String,
        accessKeySecret: String,
        scope: String?,
        promise: Promise
    ) {
        try {
            if (isReady()) {
                promise.resolve(false)
                return
            }
            if (accessKeyId.isBlank() || accessKeySecret.isBlank()) {
                promise.reject(
                    "INVALID_ARGS",
                    "accessKeyId and accessKeySecret are required"
                )
                return
            }

            val authenticationMode = AuthenticationMode.withKeySecret(accessKeyId, accessKeySecret)
            SDKNativeEngine.makeSharedInstance(
                reactContext.applicationContext,
                SDKOptions(authenticationMode).apply {
                    // Credentials issued inside a HERE project only carry that
                    // project's entitlements when the scope is set. Without it
                    // the map-data catalog answers 403 and the base map stays
                    // blank while routing still works.
                    if (!scope.isNullOrBlank()) this.scope = scope
                }
            )
            Log.d(TAG, "HERE SDK initialised")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "initialize failed: ${e.message}", e)
            promise.reject("HERE_INIT_ERROR", e.message ?: "HERE SDK initialisation failed", e)
        }
    }

    @ReactMethod
    fun isInitialized(promise: Promise) = promise.resolve(isReady())

    /**
     * Answers whether these credentials may read the map-data catalog the
     * Navigate edition renders from.
     *
     * The SDK gives no callback for this: when the catalog is not licensed it
     * simply logs `kAccessDenied` and draws nothing, so the map looks broken
     * while routing and guidance keep working. This probes the very request the
     * renderer makes, so the UI can say what is wrong instead of showing an
     * empty map.
     *
     * Resolves `{ hasMapDataAccess, httpStatus, message }`. Only an explicit 403
     * is reported as "no access" — any other outcome (offline, timeout, a moved
     * catalog version) resolves `hasMapDataAccess: true` rather than risk
     * blaming the licence for a network blip.
     */
    @ReactMethod
    fun checkMapDataAccess(promise: Promise) {
        Thread {
            try {
                val engine = requireEngine()
                val token = Authentication.authenticate(engine).token
                val status = probeMapCatalog(token)
                Log.i(TAG, "map data access probe: HTTP $status for $OCM_CATALOG_HRN")

                promise.resolve(Arguments.createMap().apply {
                    putBoolean("hasMapDataAccess", status != HTTP_FORBIDDEN)
                    putInt("httpStatus", status)
                    if (status == HTTP_FORBIDDEN) {
                        putString(
                            "message",
                            "These HERE credentials cannot read the map data " +
                                "catalog ($OCM_CATALOG_HRN), so the base map " +
                                "cannot render. Routing and guidance still work. " +
                                "Check that the key pair is licensed for HERE SDK " +
                                "Navigate, and that HERE_SCOPE is set when the " +
                                "credentials belong to a HERE project."
                        )
                    } else {
                        putNull("message")
                    }
                })
            } catch (e: Exception) {
                // A failed probe says nothing about the licence — stay quiet.
                Log.w(TAG, "map data access probe failed: ${e.message}")
                promise.resolve(Arguments.createMap().apply {
                    putBoolean("hasMapDataAccess", true)
                    putInt("httpStatus", 0)
                    putNull("message")
                })
            }
        }.start()
    }

    /**
     * Asks the platform config API whether this identity may read the map
     * catalog — the same `readResource` permission the renderer needs, but
     * without a catalog version, so the probe cannot go stale.
     */
    private fun probeMapCatalog(token: String): Int {
        val url = URL(
            "https://config.data.api.platform.here.com/config/v1/catalogs/$OCM_CATALOG_HRN"
        )
        val connection = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            setRequestProperty("Authorization", "Bearer $token")
            connectTimeout = 10_000
            readTimeout = 10_000
        }
        return try {
            connection.responseCode
        } finally {
            connection.disconnect()
        }
    }

    /**
     * Releases the engine and everything that depends on it. Navigation is
     * stopped and cached routes are dropped first — disposing the engine while a
     * [com.here.sdk.navigation.VisualNavigator] still holds native handles
     * crashes in the SDK's JNI layer.
     */
    @ReactMethod
    fun dispose(promise: Promise) {
        // Navigation teardown touches the VisualNavigator and the MapView, both
        // of which are UI-thread only — so the whole sequence runs there.
        UiThreadUtil.runOnUiThread {
            try {
                HereNavigationModule.instance?.releaseForShutdown()
                RouteStore.clear()

                SDKNativeEngine.getSharedInstance()?.let { engine ->
                    engine.dispose()
                    // getSharedInstance() keeps returning the disposed engine
                    // unless the reference is cleared, which would make
                    // isInitialized() lie.
                    SDKNativeEngine.setSharedInstance(null)
                }
                Log.d(TAG, "HERE SDK disposed")
                promise.resolve(true)
            } catch (e: Exception) {
                Log.e(TAG, "dispose failed: ${e.message}", e)
                promise.reject("HERE_DISPOSE_ERROR", e.message ?: "HERE SDK dispose failed", e)
            }
        }
    }
}
