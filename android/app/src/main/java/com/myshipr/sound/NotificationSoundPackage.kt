package com.myshipr.sound

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * ReactPackage for [NotificationSoundModule].
 *
 * Register this in MainApplication.kt:
 *   add(NotificationSoundPackage())
 */
class NotificationSoundPackage : ReactPackage {

    override fun createNativeModules(
        reactContext: ReactApplicationContext
    ): List<NativeModule> = listOf(NotificationSoundModule(reactContext))

    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ): List<ViewManager<*, *>> = emptyList()
}
