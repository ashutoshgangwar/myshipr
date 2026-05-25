package com.myshipr.heremap

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * ReactPackage that wires up the HERE SDK native view and module.
 *
 * Register this in MainApplication.kt:
 *   add(HereMapPackage())
 */
class HereMapPackage : ReactPackage {

    override fun createNativeModules(
        reactContext: ReactApplicationContext
    ): List<NativeModule> = listOf(HereMapModule(reactContext))

    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ): List<ViewManager<*, *>> = listOf(HereMapViewManager(reactContext))
}
