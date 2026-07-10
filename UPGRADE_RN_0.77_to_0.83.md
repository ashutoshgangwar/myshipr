# React Native Upgrade — 0.77.0 → 0.83.10

Upgrade of **myshipr** from React Native **0.77.0** to **0.83.10** (React **18.3.1 → 19.2.0**), New Architecture enabled, with the HERE SDK native integration preserved.

- **Branch:** `upgrade-rn-0.83`
- **Status:** ✅ JS bundle builds · ✅ Android Gradle config validated · ✅ iOS simulator build succeeds

---

## 1. Prerequisites (required environment)

| Requirement | Needed for 0.83 | Notes |
|---|---|---|
| **Node** | **≥ 20** (used 20.20.0) | 0.77 allowed Node ≥ 18. Must upgrade. |
| **JDK** | **17+** | Required by Gradle 9. |
| **Ruby** | 3.4+ ok (used 4.0.1) | Needs extra stdlib gems (see §7). |
| **CocoaPods** | ≥ 1.13 (used 1.16.2) | |
| **Xcode** | Recent (iOS 18/26 SDK) | |
| **Android SDK** | **compileSdk 36 / buildTools 36** | Install via SDK Manager. |

---

## 2. Dependency changes — `package.json`

### Core
| Package | 0.77 | 0.83 |
|---|---|---|
| `react` | 18.3.1 | **19.2.0** |
| `react-native` | 0.77.0 | **0.83.10** |
| `react-test-renderer` | 18.3.1 | **19.2.0** |
| `@react-native/babel-preset` | 0.77.0 | **0.83.10** |
| `@react-native/eslint-config` | 0.77.0 | **0.83.10** |
| `@react-native/metro-config` | 0.77.0 | **0.83.10** |
| `@react-native/typescript-config` | 0.77.0 | **0.83.10** |
| `@react-native-community/cli` | 15.0.1 | **20.0.0** |
| `@react-native-community/cli-platform-android` | 15.0.1 | **20.0.0** |
| `@react-native-community/cli-platform-ios` | 15.0.1 | **20.0.0** |
| `@types/react` | ^18.2.6 | **^19.2.0** |
| `@types/react-test-renderer` | ^18.0.0 | **^19.1.0** |
| `typescript` | 5.0.4 | **^5.8.3** |
| `@babel/preset-env` | — | **^7.25.3** (added) |
| `engines.node` | >=18 | **>=20** |

### Native ecosystem deps (forced by RN 0.83 / React 19)
Only these were bumped — React Navigation was intentionally **kept on v6** to avoid rewriting screen code.

| Package | 0.77 | 0.83 | Why |
|---|---|---|---|
| `react-native-safe-area-context` | ^4.8.0 | **^5.8.0** | v5 required for RN 0.83 |
| `react-native-screens` | ^3.37.0 | **^4.25.2** | v4 required for RN 0.81+ / React 19 |
| `react-native-gesture-handler` | ^2.18.0 | **^2.32.0** | React 19 compatibility |

### Added tooling (for the voice patch — see §6)
- `patch-package` (^8.0.1), `postinstall-postinstall` (^2.1.0)
- new script: `"postinstall": "patch-package"`

### Left unchanged (verified compatible)
`@react-navigation/*` v6, `@reduxjs/toolkit`, `react-redux`, `react-native-maps`, `@maplibre/maplibre-react-native`, `react-native-vision-camera` (4.7.3), `react-native-svg`, `react-native-webview`, `react-native-radar`, `react-native-device-info`, `react-native-permissions`, async-storage, etc.

> **Install note:** must use `npm install --legacy-peer-deps`. This is a **pre-existing** conflict (unrelated to the upgrade): `react-native-radar` peer-wants `@maplibre/maplibre-react-native@^11`, project pins `^10`.

---

## 3. Android changes

### `android/build.gradle`
```diff
- buildToolsVersion = "35.0.0"
- compileSdkVersion = 35
- targetSdkVersion  = 34
- kotlinVersion     = "1.8.22"
+ buildToolsVersion = "36.0.0"
+ compileSdkVersion = 36
+ targetSdkVersion  = 36
+ kotlinVersion     = "2.1.20"
```
(`ndkVersion = "27.1.12297006"` unchanged.)

### `android/gradle/wrapper/gradle-wrapper.properties`
```diff
- distributionUrl=…/gradle-8.9-all.zip
+ distributionUrl=…/gradle-9.0.0-bin.zip
```

### `android/gradle.properties` — added
```properties
# Use this property to enable edge-to-edge display support.
edgeToEdgeEnabled=false
```

### `android/app/build.gradle` — JSC flavor (only matters if Hermes is disabled)
```diff
- def jscFlavor = 'org.webkit:android-jsc:+'
+ def jscFlavor = 'io.github.react-native-community:jsc-android:2026004.+'
```

### `android/app/src/main/java/com/myshipr/MainApplication.kt`
Rewritten to the new **`loadReactNative()` / `getDefaultReactHost`** pattern (removes manual `SoLoader.init` + `DefaultReactNativeHost` + `DefaultNewArchitectureEntryPoint.load`). **HERE SDK `HereMapPackage()` preserved.**

```kotlin
package com.myshipr

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.myshipr.heremap.HereMapPackage

class MainApplication : Application(), ReactApplication {
  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          add(HereMapPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
```

> `MainActivity.kt` — **no change** (unchanged between 0.77 and 0.83).

---

## 4. iOS changes

### `ios/myshipr/AppDelegate.swift`
Rewritten from `RCTAppDelegate` subclass → the new **`RCTReactNativeFactory` + `ReactNativeDelegate`** pattern. **HERE SDK init (`HERESDKManager.shared.initialize()`) and `moduleName "myshipr"` preserved.**

```swift
import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?
  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    window = UIWindow(frame: UIScreen.main.bounds)

    HERESDKManager.shared.initialize()   // HERE SDK

    factory.startReactNative(withModuleName: "myshipr", in: window, launchOptions: launchOptions)
    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? { self.bundleURL() }
  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
```

### `ios/myshipr/Info.plist` — added
```xml
<key>CADisableMinimumFrameDurationOnPhone</key>
<true/>
```

### `ios/.xcode.env.local` — ⚠️ Node path (machine-local, gitignored)
The old value pinned **Node 18**, which breaks the RN 0.83 "Bundle React Native code and images" script phase (`Command PhaseScriptExecution failed`). RN 0.83 needs Node ≥ 20.
```diff
- export NODE_BINARY=/opt/homebrew/Cellar/node@18/18.20.8/bin/node
+ export NODE_BINARY=/Users/ashutoshgangwar/.nvm/versions/node/v20.20.0/bin/node
```
> Update this if you change Node versions via nvm. Not committed (gitignored).

### Pods
Reinstall from scratch after the JS deps change:
```bash
cd ios && rm -rf Pods Podfile.lock build
RCT_NEW_ARCH_ENABLED=1 bundle exec pod install
```
`Podfile` itself needed **no functional change** (custom HERE SDK / MapLibre / permissions hooks preserved).

---

## 5. TypeScript — `tsconfig.json`
In 0.83 the `@react-native/typescript-config` package exposes its config only via the package `exports` map, so the old subpath no longer resolves.
```diff
- "extends": "@react-native/typescript-config/tsconfig.json",
+ "extends": "@react-native/typescript-config",
```
This also cleared the cascading *"No inputs were found"* error (`allowJs` is inherited from the base config once `extends` resolves). `include`/`exclude` unchanged.

---

## 6. Third-party fix — `@react-native-voice/voice@3.2.4` (abandoned)

Its `android/build.gradle` is incompatible with Gradle 9 / AGP 8 and crashed the Android build:
- `jcenter()` — **removed in Gradle 9** (crashed script evaluation → cascading "does not specify compileSdk" error).
- No `namespace` (AGP 8 requires it; manifest `package=` attribute no longer allowed).
- Stale deps: `appcompat-v7`, `com.facebook.react:react-native:+`, `minSdk 15`.

**Fixed** (`jcenter → mavenCentral+google`, added `namespace "com.wenkesj.voice"`, removed manifest `package=`, modernized deps to `androidx.appcompat`, `react-android`, `minSdk 24`) and made durable with **patch-package**:
- Patch file: `patches/@react-native-voice+voice+3.2.4.patch`
- Re-applied automatically on every `npm install` via the `postinstall` script.

> The abandoned voice package has no newer release (3.2.4 is the last). Consider migrating off it long-term.

> Three other legacy modules (`react-native-biometrics`, `@react-native-ml-kit/text-recognition`, `react-native-linear-gradient`) also lack `namespace` but build fine — the RN Gradle Plugin auto-injects a namespace fallback from their manifest. **No action needed.**

---

## 7. `Gemfile` — Ruby 3.4+ stdlib gems (added)
```ruby
gem 'bigdecimal'
gem 'logger'
gem 'benchmark'
gem 'mutex_m'
```

## `.gitignore` — added
```
.kotlin/
```

---

## 8. Reproduce the upgrade (clean machine)

```bash
git checkout upgrade-rn-0.83

# 1. JS deps (pre-existing radar/maplibre peer conflict → legacy flag)
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps          # runs postinstall → applies voice patch

# 2. iOS
#    - set ios/.xcode.env.local NODE_BINARY to your Node 20 path
bundle install
cd ios && rm -rf Pods Podfile.lock build
RCT_NEW_ARCH_ENABLED=1 bundle exec pod install && cd ..

# 3. Run
npm run android      # first run downloads Gradle 9.0
npm run ios
```

---

## 9. Verification done
- ✅ `npx react-native bundle` (Android + iOS graph) — builds clean under RN 0.83 / React 19
- ✅ `./gradlew app:installDebug --dry-run` — all Gradle projects configure cleanly on Gradle 9
- ✅ `xcodebuild -scheme myshipr -sdk iphonesimulator` — **`** BUILD SUCCEEDED **`**
- ⬜ **Remaining:** on-device runtime smoke test — HERE map, camera (VisionCamera), voice-to-form, navigation flows.

---

## 10. Files touched (summary)
```
package.json                                              deps + engines + postinstall
package-lock.json / Gemfile.lock / ios/Podfile.lock       lockfiles
tsconfig.json                                             extends path
Gemfile                                                   Ruby 3.4 gems
.gitignore                                                .kotlin/
android/build.gradle                                      SDK/buildTools/kotlin
android/gradle.properties                                 edgeToEdgeEnabled
android/gradle/wrapper/gradle-wrapper.properties          Gradle 9.0.0
android/app/build.gradle                                  jscFlavor
android/app/src/main/java/com/myshipr/MainApplication.kt  loadReactNative pattern
ios/myshipr/AppDelegate.swift                             RCTReactNativeFactory pattern
ios/myshipr/Info.plist                                    CADisableMinimumFrameDurationOnPhone
ios/myshipr/PrivacyInfo.xcprivacy                         regenerated by pod install
ios/myshipr.xcodeproj/project.pbxproj                     pod install
ios/.xcode.env.local                                      Node 20 (gitignored, not committed)
patches/@react-native-voice+voice+3.2.4.patch            Gradle 9 / AGP 8 fix (new)
```
