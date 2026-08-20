package com.myshipr

import android.content.Intent
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "myshipr"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  /**
   * Driver-invite links tapped while MyShipr is already running.
   *
   * The activity is `singleTask`, so Android reuses this instance and delivers
   * the link here instead of relaunching. `setIntent` replaces the intent the
   * activity was started with, which is what `Linking.getInitialURL()` reads —
   * without it a second link would still report the first one. `super` forwards
   * the intent to React Native, which is what fires the JS `url` event that
   * DeepLinkService listens for.
   */
  override fun onNewIntent(intent: Intent) {
    setIntent(intent)
    super.onNewIntent(intent)
  }
}
