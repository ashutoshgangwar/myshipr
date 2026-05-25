package com.myshipr.heremap

import android.view.View
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

        // Keeps a lightweight mapping between React tag and native HereMapView.
        private val viewRegistry = ConcurrentHashMap<Int, WeakReference<HereMapView>>()

        fun registerView(view: HereMapView) {
            if (view.id != View.NO_ID) {
                viewRegistry[view.id] = WeakReference(view)
            }
        }

        fun unregisterView(view: HereMapView) {
            if (view.id != View.NO_ID) {
                viewRegistry.remove(view.id)
            }
        }

        fun resolveView(tag: Int): HereMapView? {
            return viewRegistry[tag]?.get()
        }
    }

    override fun getName(): String = REACT_CLASS

    override fun createViewInstance(reactContext: ThemedReactContext): HereMapView {
        val view = HereMapView(reactContext)

        // Hook into the activity lifecycle via ReactContext
        reactContext.addLifecycleEventListener(object :
            com.facebook.react.bridge.LifecycleEventListener {
            override fun onHostResume() = view.onResume()
            override fun onHostPause() = view.onPause()
            override fun onHostDestroy() = view.onDestroy()
        })

        return view
    }

    // ------------------------------------------------------------------
    // Props forwarded from JS
    // ------------------------------------------------------------------

    @ReactProp(name = "zoomLevel", defaultDouble = 14.0)
    fun setZoomLevel(view: HereMapView, zoomLevel: Double) {
        // Will be applied after scene loads; store and apply via moveCamera
    }

    @ReactProp(name = "centerLat", defaultDouble = 0.0)
    fun setCenterLat(view: HereMapView, lat: Double) {
        // Combined with centerLng in onAfterUpdateTransaction
    }

    @ReactProp(name = "centerLng", defaultDouble = 0.0)
    fun setCenterLng(view: HereMapView, lng: Double) {
        // Combined with centerLat in onAfterUpdateTransaction
    }

    // Store last props so we can apply them together
    private val pendingCenter = mutableMapOf<HereMapView, Triple<Double, Double, Double>>()

    override fun onAfterUpdateTransaction(view: HereMapView) {
        super.onAfterUpdateTransaction(view)
        registerView(view)
        pendingCenter[view]?.let { (lat, lng, zoom) ->
            if (lat != 0.0 || lng != 0.0) {
                view.moveCamera(lat, lng, zoom)
            }
        }
    }

    override fun onDropViewInstance(view: HereMapView) {
        unregisterView(view)
        pendingCenter.remove(view)
        view.onDestroy()
        super.onDropViewInstance(view)
    }
}
