package com.myshipr.heremap

import android.view.View
import android.util.Log
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

        fun registerView(view: HereMapView) {
            if (view.id != View.NO_ID) {
                viewRegistry[view.id] = WeakReference(view)
                Log.d(TAG, "Registered HereMapView with ID: ${view.id}")
            }
        }

        fun unregisterView(view: HereMapView) {
            if (view.id != View.NO_ID) {
                viewRegistry.remove(view.id)
                Log.d(TAG, "Unregistered HereMapView with ID: ${view.id}")
            }
        }

        fun resolveView(tag: Int): HereMapView? {
            return viewRegistry[tag]?.get()
        }
    }

    override fun getName(): String = REACT_CLASS

    override fun createViewInstance(reactContext: ThemedReactContext): HereMapView {
        Log.d(TAG, "Creating HereMapView instance")
        val view = HereMapView(reactContext)

        // Hook into the activity lifecycle via ReactContext
        reactContext.addLifecycleEventListener(object :
            com.facebook.react.bridge.LifecycleEventListener {
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
        })

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

    override fun onAfterUpdateTransaction(view: HereMapView) {
        super.onAfterUpdateTransaction(view)
        registerView(view)
        
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
        unregisterView(view)
        pendingProps.remove(view)
    }
}
