# Android Build Size — Reduction Record

Why the Android release build was 143 MB, where the bytes actually were, and
what was changed to cut it to 52 MB.

**Date:** 2026-08-17
**Result:** arm64 release APK 143 MB → **52.3 MB** (−63%). `bundleRelease`, which
was failing before this work, now produces a 98.5 MB AAB.

---

## The numbers

| Artifact | Before | After | Change |
|---|---|---|---|
| `app-arm64-v8a-release.apk` | 143 MB | **52.3 MB** | −63% |
| `app-armeabi-v7a-release.apk` | 111 MB | **47.8 MB** | −57% |
| `app-universal-release.apk` | 436 MB | **166.3 MB** | −62% |
| `app-release.aab` (Play upload) | *build failed* | **98.5 MB** | fixed |

The per-ABI APK is the number to watch — it is roughly what a Play user
downloads. The universal APK is large by construction because it carries both
ABIs' copies of `libheresdk.so`.

---

## Where the bytes were

Measured by extracting `app-arm64-v8a-release.apk` (186 MB uncompressed, 5296
files) before any changes:

| Item | Size | Notes |
|---|---|---|
| `lib/arm64-v8a/libheresdk.so` | 87.3 MB | stored at **0% compression** |
| `assets/geoviz` | 28 MB | HERE map rendering data; 9.8 MB of it fonts |
| `lib/arm64-v8a/libmlkit_google_ocr_pipeline.so` | 11.1 MB | stored at 0% compression |
| `assets/voice_assets` | 13 MB | **48** guidance voice packages |
| `res` | 15 MB | 11.4 MB of it four app images |
| `assets/localization` | 10 MB | 33 locales × metric/imperial |
| `classes.dex` | 8.5 MB | R8 already enabled |
| `assets/mlkit-google-ocr-models` | 5.3 MB | Latin + Chinese + Japanese + Korean + Devanagari |
| `assets/index.android.bundle` | 2.2 MB | Hermes bytecode, already fine |

---

## What was already correct

Verified and left alone — none of these were the problem:

- `minifyEnabled true` and `shrinkResources true` on release
- Hermes enabled (`hermesEnabled=true`), so the JS bundle is bytecode not source
- `reactNativeArchitectures=armeabi-v7a,arm64-v8a` — x86 was never being built
- ABI splits already configured, so per-ABI APKs were already being produced
- The ProGuard keep rules for HERE, React Native and Maps

---

## Change 1 — Native libraries were stored uncompressed

**Saved ~60 MB.** The single largest win.

AGP 8 defaults to `useLegacyPackaging = false`, which stores `.so` files
uncompressed so the installer can map them straight out of the APK instead of
keeping a second extracted copy on disk.

That default is right for the **AAB** — Play recompresses per device — but wrong
for the **APKs we hand out directly**, where nothing recompresses them:

| Library | Stored | Deflated |
|---|---|---|
| `libheresdk.so` | 87,280,112 B | 31,328,967 B (64% off) |
| `libmlkit_google_ocr_pipeline.so` | 11,064,544 B | 4,405,669 B (60% off) |

[android/app/build.gradle](android/app/build.gradle) now decides per build type.
Because packaging must be settled at configuration time, this keys off the
requested Gradle task:

```gradle
def isBundleBuild = gradle.startParameter.taskNames.any {
    it.toLowerCase().contains("bundle")
}
```

`assembleRelease` compresses; `bundleRelease` stays on the Play-optimal default.
Running both in one invocation resolves to the bundle setting.

> **Trade-off:** compressed libs make the APK smaller but the *installed* app
> slightly larger (libs get extracted) and first launch marginally slower. This
> is the correct trade for a directly-distributed APK and is why the AAB path
> deliberately keeps the opposite setting.

---

## Change 2 — HERE SDK ships every market's data

**Saved ~28 MB.** `heresdk-navigate-android-4.27.0.0.301863.aar` bundles guidance
voices, traffic-event strings and map fonts for every market HERE supports.
MyShipr serves English, Spanish, Hindi, Punjabi and Russian.

| Asset | Before | After |
|---|---|---|
| `assets/voice_assets` | 48 packages, 13 MB | 6 packages, 1.6 MB |
| `assets/localization` | 66 files, 10 MB | 10 files, 1.5 MB |
| `assets/geoviz/fonts` | 12 fonts, 9.8 MB | 2 fonts, 796 KB |

These files come from *inside* the `.aar`, so they cannot be excluded by
dependency configuration. The only place to remove them is the merged assets
directory — after AGP unpacks and merges every library's assets, before it
packages them. A `doLast` hook on `merge*Assets` in
[android/app/build.gradle](android/app/build.gradle) does this and logs what it
freed.

**Kept:**

- Voice: `en-US`, `en-GB`, `es-ES`, `es-MX`, `hi-IN`, `ru-RU`
- Traffic strings: `en-US`, `en-GB`, `es-ES`, `es-MX`, `ru-RU`
- Fonts: `FiraGO_Map.ttf` (Latin + Cyrillic + Greek), `NotoSansGurmukhi-Regular-unhinted.ttf` (Punjabi)

**Two things worth knowing:**

1. **HERE publishes no `pa-IN` voice or traffic data at all.** Punjabi drivers
   already fell back to English/Hindi before this change. Nothing regressed.
2. **`fonts.json` was deliberately *not* pruned to match.** HERE ships those
   fallback chains already referencing desktop-only faces (`msgothic.ttc`,
   macOS `ヒラギノ角ゴシック W3.ttc`) that never exist on Android — proof its
   loader is built to skip fallback entries it cannot open. Editing the JSON
   would add risk for no gain.

The dropped fonts were CJK, SE-Asian and South-Indian (`NotoSansJP-Regular.otf`
alone was 4.5 MB, and is referenced only by the `Oslo_Japan` map scene).

---

## Change 3 — Oversized app images

**Saved 11.4 MB.** Four images in `src/assets/Image`, all rendered as
full-screen backgrounds or icons:

| File | Before | After |
|---|---|---|
| `bg_image_login.jpg` | 4096×2725, 6.93 MB | 2048×1362, 370 KB |
| `pod_screen.png` | 2502×3990, 4.57 MB | 1200×1914, 52 KB |
| `fuel_pump.png` | 1122×1402, 993 KB | 500×625, 230 KB |
| `pod_cer.webp` | 918 KB | **deleted** |

`pod_screen.png` is a flat illustration, so a 256-colour palette is visually
lossless on it (measured RMSE 3.5/255) and cut the file ~30×.

`pod_cer.webp` had no `require()` or `import` anywhere in `src/`, `ios/` or
`android/` — it was dead weight.

APK `res/` went from **15 MB → 4.1 MB**.

> **Note for future changes:** React Native's bundle task does not reliably
> detect in-place edits to image assets. If you re-optimise an image and the APK
> size does not move, delete `android/app/build/generated/res/react` and rebuild.

---

## Change 4 — ML Kit OCR bundled four unused scripts

**Saved 2.8 MB.** `@react-native-ml-kit/text-recognition` declares Latin,
Chinese, Devanagari, Japanese and Korean models. [OCRService.js](src/services/OCRService.js)
only ever calls `TextRecognition.recognize(uri)` with no script argument, which
always resolves to Latin.

The module's `TextRecognitionModule.java` hard-imports the CJK option classes, so
dropping the Gradle dependencies alone would break its compilation. This needed a
patch via `patch-package` (already wired into `postinstall`):

    patches/@react-native-ml-kit+text-recognition+2.0.0.patch

It removes the Chinese/Japanese/Korean imports, their `switch` cases and their
Gradle dependencies, keeping Latin and Devanagari.
`assets/mlkit-google-ocr-models` went **5.3 MB → 2.5 MB**.

The patch reapplies automatically on `npm install`.

---

## Change 5 — Android resource locales

**Saved ~1 MB.** Play Services and AndroidX between them ship translations for
roughly 80 locales. `defaultConfig` now sets:

```gradle
resourceConfigurations += ["en", "es", "hi", "pa", "ru"]
```

This affects Android resources only; the HERE SDK's own locale data is handled
by Change 2.

---

## Change 6 — `bundleRelease` was broken (pre-existing)

Not a size issue, but it blocked shipping to Play and was **already failing
before this work**:

```
Multiple shrunk-resources files found in directory '.../minifyReleaseWithR8'
Please disable building multiple APKs when building an Android app bundle.
```

AGP rejects the build when ABI splits and an app bundle are requested together
([issuetracker 402800800](https://issuetracker.google.com/402800800)) — an AAB
already splits by ABI on Play's side. `splits.abi.enable` is now `!isBundleBuild`,
reusing the same flag from Change 1.

`npm run BR` works again.

---

## Verification

Every figure above was read out of a real build, not estimated:

```sh
npm run AR    # ./gradlew assembleRelease  -> per-ABI + universal APKs
npm run BR    # ./gradlew bundleRelease    -> app-release.aab
```

Contents confirmed by extracting the resulting APK:

```sh
unzip -v android/app/build/outputs/apk/release/app-arm64-v8a-release.apk \
  | grep libheresdk        # expect "Defl:N ... 64%", not "Stored"

cd /tmp && unzip -q -o .../app-arm64-v8a-release.apk
ls assets/voice_assets   | wc -l   # expect 6  (was 48)
ls assets/localization   | wc -l   # expect 10 (was 66)
ls assets/geoviz/fonts   | wc -l   # expect 2  (was 12)
```

---

## Still to do

### Smoke-test the map and navigation

The size wins are verified from the APK contents, but the trimmed assets are
exactly the parts that need exercising on a device:

- Turn-by-turn **voice guidance** in each shipped language
- **Map label rendering** (the font chain changed)
- **Traffic event** text on a route with incidents
- **OCR** on a document scan

### Two unused dependencies

Both grep to zero references in `src/` and can likely be removed:

- `react-native-compressor` — native, autolinked, ships `libandroidlame.so`
- `react-native-google-places-autocomplete` — JS only

`react-native-webview` also greps to zero but **must stay** — it is a required
peer dependency of `react-native-signature-canvas`.

### If you distribute APKs directly

The universal APK is 166 MB because it carries both ABIs. Shipping the per-ABI
files instead (52.3 MB / 47.8 MB) roughly thirds what users download.

---

## Files changed

| File | Change |
|---|---|
| [android/app/build.gradle](android/app/build.gradle) | Packaging, HERE asset trim, locale filter, bundle fix |
| `patches/@react-native-ml-kit+text-recognition+2.0.0.patch` | New — drops CJK OCR scripts |
| [src/assets/Image/bg_image_login.jpg](src/assets/Image/bg_image_login.jpg) | Resized 4096→2048 wide |
| [src/assets/Image/pod_screen.png](src/assets/Image/pod_screen.png) | Resized + palette-quantised |
| [src/assets/Image/fuel_pump.png](src/assets/Image/fuel_pump.png) | Resized 1122→500 wide |
| `src/assets/Image/pod_cer.webp` | Deleted — unreferenced |
