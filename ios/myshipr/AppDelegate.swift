import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
// Firebase core — required so the native Firebase SDK is configured from
// GoogleService-Info.plist before any React Native Firebase module is used.
import FirebaseCore

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    // Initialize Firebase as early as possible in app launch. Reads the
    // GoogleService-Info.plist bundled in the app target. Must run before RN
    // starts so @react-native-firebase modules find the default app.
    FirebaseApp.configure()

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    // Initialize HERE SDK
    HERESDKManager.shared.initialize()

    factory.startReactNative(
      withModuleName: "myshipr",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  // MARK: - Deep links

  /// Custom-scheme links: `myshipr://activate?token=…`.
  ///
  /// Used in development (no domain verification needed) and as the landing
  /// page's "Open in app" fallback. Without this method iOS launches the app
  /// but the URL never reaches JS, so the driver lands on the splash screen
  /// with no idea why nothing happened.
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return RCTLinkingManager.application(app, open: url, options: options)
  }

  /// Universal Links: `https://<host>/d/activate?token=…`.
  ///
  /// This is the link that actually goes in the invite email. iOS only routes
  /// it here once the domain's apple-app-site-association file lists this app;
  /// until then the same URL simply opens Safari, which is the intended
  /// app-not-installed fallback.
  func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    return RCTLinkingManager.application(
      application,
      continue: userActivity,
      restorationHandler: restorationHandler
    )
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
