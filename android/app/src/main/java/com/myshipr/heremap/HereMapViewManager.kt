package com.myshipr.heremap

import android.view.View
import android.util.Log
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import java.lang.ref.WeakReference
import java.util.concurrent.ConcurrentHashMap

/**
 * React Native ViewManager for the HERE MapView.
 * Old architecture (Paper renderer) compatible.
 */
class HereMapViewManager(
    private val reactContext: ReactApplicationContext
) : SimpleViewManager<HereMapView>() {

    companion object {
        const val REACT_CLASS = "HereMapView"
        const val TAG = "HereMapViewManager"

        // Keeps a lightweight mapping between React tag and native HereMapView.
        private val viewRegistry = ConcurrentHashMap<Int, WeakReference<HereMapView>>()

        // The map the navigation module renders into when JS does not name one.
        // Apps show a single map at a time, so "most recently mounted" is the
        // right default.
        private var activeViewRef: WeakReference<HereMapView>? = null

        fun registerView(view: HereMapView) {
            if (view.id != View.NO_ID) {
                viewRegistry[view.id] = WeakReference(view)
                activeViewRef = WeakReference(view)
                Log.d(TAG, "Registered HereMapView with ID: ${view.id}")
            }
        }

        fun unregisterView(view: HereMapView) {
            if (view.id != View.NO_ID) {
                viewRegistry.remove(view.id)
                Log.d(TAG, "Unregistered HereMapView with ID: ${view.id}")
            }
            if (activeViewRef?.get() === view) activeViewRef = null
        }

        fun resolveView(tag: Int): HereMapView? {
            return viewRegistry[tag]?.get()
        }

        /**
         * The map view a tag-less call should act on: [tag] when it resolves,
         * otherwise the most recently mounted live map.
         */
        fun resolveViewOrActive(tag: Int?): HereMapView? {
            val byTag = tag?.takeIf { it > 0 }?.let { resolveView(it) }
            val view = byTag ?: activeViewRef?.get()
            return view?.takeIf { it.isAlive() }
        }
    }

    override fun getName(): String = REACT_CLASS

    // The lifecycle listener registered for each view, so it can be removed when
    // the view goes away. Without this every remount leaks a listener that keeps
    // calling into a MapView React has already dropped.
    private val lifecycleListeners = mutableMapOf<HereMapView, LifecycleEventListener>()

    override fun createViewInstance(reactContext: ThemedReactContext): HereMapView {
        Log.d(TAG, "Creating HereMapView instance")
        // HereMapView's constructor performs the MapView onCreate step.
        val view = HereMapView(reactContext)

        // Hook into the activity lifecycle via ReactContext
        val listener = object : LifecycleEventListener {
            override fun onHostResume() {
                Log.d(TAG, "onHostResume - calling mapView.onResume()")
                view.onResume()
            }
            override fun onHostPause() {
                Log.d(TAG, "onHostPause - calling mapView.onPause()")
                view.onPause()
            }
            override fun onHostDestroy() {
                Log.d(TAG, "onHostDestroy - calling mapView.onDestroy()")
                view.onDestroy()
            }
        }
        reactContext.addLifecycleEventListener(listener)
        lifecycleListeners[view] = listener

        return view
    }

    // ------------------------------------------------------------------
    // Props forwarded from JS
    // ------------------------------------------------------------------

    // Store props to apply them together in onAfterUpdateTransaction
    private data class PendingProps(
        var centerLat: Double = 0.0,
        var centerLng: Double = 0.0,
        var zoomLevel: Double = 14.0
    )

    private val pendingProps = mutableMapOf<HereMapView, PendingProps>()

    @ReactProp(name = "zoomLevel", defaultDouble = 14.0)
    fun setZoomLevel(view: HereMapView, zoomLevel: Double) {
        Log.d(TAG, "setZoomLevel: $zoomLevel")
        pendingProps.getOrPut(view) { PendingProps() }.zoomLevel = zoomLevel
    }

    @ReactProp(name = "centerLat", defaultDouble = 0.0)
    fun setCenterLat(view: HereMapView, lat: Double) {
        Log.d(TAG, "setCenterLat: $lat")
        pendingProps.getOrPut(view) { PendingProps() }.centerLat = lat
    }

    @ReactProp(name = "centerLng", defaultDouble = 0.0)
    fun setCenterLng(view: HereMapView, lng: Double) {
        Log.d(TAG, "setCenterLng: $lng")
        pendingProps.getOrPut(view) { PendingProps() }.centerLng = lng
    }

    /** Map style, e.g. "normalDay", "satellite", "logisticsDay". */
    @ReactProp(name = "mapScheme")
    fun setMapScheme(view: HereMapView, scheme: String?) {
        if (!scheme.isNullOrEmpty()) view.setMapScheme(scheme)
    }

    /** Turns on HERE's extruded-building (3D) rendering. */
    @ReactProp(name = "buildings3D", defaultBoolean = false)
    fun setBuildings3D(view: HereMapView, enabled: Boolean) {
        view.set3DBuildingsEnabled(enabled)
    }

    /** Live traffic flow lines, coloured by congestion. */
    @ReactProp(name = "showTrafficFlow", defaultBoolean = false)
    fun setShowTrafficFlow(view: HereMapView, enabled: Boolean) {
        view.setTrafficFlowEnabled(enabled)
    }

    /** Accident / closure / roadworks icons. */
    @ReactProp(name = "showTrafficIncidents", defaultBoolean = false)
    fun setShowTrafficIncidents(view: HereMapView, enabled: Boolean) {
        view.setTrafficIncidentsEnabled(enabled)
    }

    // ------------------------------------------------------------------
    // Events — onMapTap / onMapLongPress / onPoiTap
    // ------------------------------------------------------------------

    override fun getExportedCustomDirectEventTypeConstants(): MutableMap<String, Any> =
        mutableMapOf(
            "topMapTap" to mapOf("registrationName" to "onMapTap"),
            "topMapLongPress" to mapOf("registrationName" to "onMapLongPress"),
            "topPoiTap" to mapOf("registrationName" to "onPoiTap"),
            "topMapError" to mapOf("registrationName" to "onMapError")
        )

    override fun onAfterUpdateTransaction(view: HereMapView) {
        super.onAfterUpdateTransaction(view)
        registerView(view)

        // A view mounted before HereSdk.initialize() finished has no surface.
        // Props arriving now mean JS is still using it, so retry the attach —
        // by this point the engine has usually come up.
        if (!view.isMapAttached() && !view.attachMapView()) return

        pendingProps[view]?.let { props ->
            val lat = props.centerLat
            val lng = props.centerLng
            val zoom = props.zoomLevel
            
            if (lat != 0.0 || lng != 0.0 || zoom != 14.0) {
                Log.d(TAG, "Moving camera to: lat=$lat, lng=$lng, zoom=$zoom")
                view.moveCamera(lat, lng, zoom, animate = false)
            }
        }
    }

    override fun onDropViewInstance(view: HereMapView) {
        Log.d(TAG, "onDropViewInstance")
        lifecycleListeners.remove(view)?.let { reactContext.removeLifecycleEventListener(it) }
        unregisterView(view)
        pendingProps.remove(view)
        // React is done with this view; release the native map surface with it.
        view.onDestroy()
        super.onDropViewInstance(view)
    }
}
