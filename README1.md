# iOS Push Notifications (FCM) — Setup Record

Why the iOS FCM token was returning `null` while Android worked fine, what was
missing, and what was changed to fix it.

**Date:** 2026-08-14
**Result:** iOS device builds now sign with `aps-environment` and mint a real FCM token.

---

## The symptom

Android received FCM tokens normally. iOS did not, and the Xcode console showed:

```
11.15.0 - [FirebaseMessaging][I-FCM012002] Error in
application:didFailToRegisterForRemoteNotificationsWithError:
no valid "aps-environment" entitlement string found for application

'[FCM] getFcmToken error:',
[Error: [messaging/unknown] no valid "aps-environment" entitlement string found for application]
```

Android was never affected: FCM on Android talks directly to Google's servers.
APNs, entitlements, and provisioning profiles do not exist on that platform, so
none of the problems below could surface there.

---

## What iOS push actually requires

All six must be true. Any one missing and `getFcmToken()` returns `null`.

| # | Requirement | Where it lives |
|---|---|---|
| 1 | `aps-environment` entitlement | `ios/myshipr/myshipr.entitlements` |
| 2 | Push Notifications enabled on the App ID | developer.apple.com → Identifiers |
| 3 | Provisioning profile containing `aps-environment` | Issued by Apple, embedded at build time |
| 4 | App signed by the team that owns the App ID | `DEVELOPMENT_TEAM` in `project.pbxproj` |
| 5 | APNs auth key (`.p8`) uploaded to Firebase | Firebase → Cloud Messaging *(delivery only)* |
| 6 | Firebase Team ID matching the signing team | Firebase → Cloud Messaging *(delivery only)* |

**1–4 control whether you get a token. 5–6 control whether messages get delivered.**
These are independent. A correct Firebase config will not produce a token, and a
token does not imply messages will arrive.

---

## What was already correct

Not the cause, verified and left alone:

- `@react-native-firebase/app` and `/messaging` at `^22.4.0`
- `FirebaseApp.configure()` in [AppDelegate.swift:23](ios/myshipr/AppDelegate.swift#L23)
- `GoogleService-Info.plist` present, `BUNDLE_ID` = `com.myshipr` (matches the target)
- `UIBackgroundModes` → `remote-notification` in [Info.plist:138-141](ios/myshipr/Info.plist#L138-L141)
- `CODE_SIGN_ENTITLEMENTS` wired into **both** Debug and Release configs
- Notification permission granted — logs showed `[FCM] iOS authorization status: 1` (authorized)

The JS layer was never the problem.

---

## What was missing

### 1. The `aps-environment` entitlement was commented out

`myshipr.entitlements` had been deliberately disabled while the team was on a free
Apple account:

```xml
<!-- Push Notifications: requires a PAID Apple Developer account.
     Uncomment the two lines below once enrolled to re-enable iOS FCM push.
<key>aps-environment</key>
<string>development</string>
-->
```

Direct cause of the console error. Uncommenting it was reverted twice by
`git checkout` / branch switches before it was finally committed.

### 2. Push Notifications was not enabled on the App ID

Apple only puts `aps-environment` into a provisioning profile if the App ID has the
capability turned on. Without it, the profile Xcode downloaded had no push
entitlement — so even a correct entitlements file could not be signed in.

### 3. The signing team was wrong

The project was signed under a **personal** Apple account rather than the company one.
Both certificates existed on the machine:

```
OU=Q7SJJXV3R5,  O=Ashutosh Gangwar   ← personal account
OU=9852NBYTDU,  O=MYSHIPR INC        ← company account (correct)
```

`project.pbxproj` carried the stale `Q7SJJXV3R5`. Since the App ID and the APNs key
both live under MYSHIPR INC, signing under the personal team meant push could never
be provisioned.

### 4. The APNs key had never been uploaded to Firebase

No `.p8` in Firebase → no message delivery, even with a valid token.

### 5. Firebase was given the wrong Team ID

The stale `Q7SJJXV3R5` was copied into the Firebase upload dialog. See
[Outstanding](#outstanding) — this is still to be corrected.

---

## What was changed

### `ios/myshipr/myshipr.entitlements` — the only code change

```xml
<!-- Push Notifications. Xcode rewrites this to "production" for
     App Store / TestFlight archives automatically. -->
<key>aps-environment</key>
<string>development</string>
```

Committed, so it stops being reverted.

### Apple Developer Portal

- Enabled **Push Notifications** on App ID `com.myshipr` (team MYSHIPR INC)
- Created APNs auth key `myshipr APNs`:

  ```
  Key ID:           ZXN948GG5X
  Team:             MYSHIPR INC — 9852NBYTDU
  APNs Config:      Team Scoped (All topics)
  APNs Environment: Sandbox & Production
  ```

  One key covers development and production, and every bundle ID in the team.
  It never expires, unlike APNs certificates.

### Xcode

- Switched the signing account to **MYSHIPR INC**; `DEVELOPMENT_TEAM` in
  [project.pbxproj:397](ios/myshipr.xcodeproj/project.pbxproj#L397) and
  [:433](ios/myshipr.xcodeproj/project.pbxproj#L433) now read `9852NBYTDU`
- Added the **Push Notifications** capability
- Cleared DerivedData and rebuilt so a fresh, push-enabled profile was embedded

### Firebase Console

- `.p8` uploaded to both development and production APNs auth key rows
  (Project settings → Cloud Messaging → Apple app configuration → `com.myshipr`)

---

## How to verify

### The entitlement is in the signed binary

```bash
codesign -d --entitlements - --xml \
  ~/Library/Developer/Xcode/DerivedData/myshipr-*/Build/Products/Debug-iphoneos/myshipr.app \
  | plutil -convert xml1 -o - -
```

Expect:

```xml
<key>aps-environment</key>
<string>development</string>
```

### The embedded profile carries push

```bash
security cms -D -i \
  ~/Library/Developer/Xcode/DerivedData/myshipr-*/Build/Products/Debug-iphoneos/myshipr.app/embedded.mobileprovision \
  > /tmp/pp.plist
plutil -extract Entitlements.aps-environment raw -o - /tmp/pp.plist
plutil -extract TeamIdentifier json -o - /tmp/pp.plist
```

Expect `development` and `["9852NBYTDU"]`.

### Which teams the machine can sign for

```bash
security find-identity -v -p codesigning
```

The Team ID is the `OU=` field of the certificate, **not** the 10-character code in
parentheses after the name — that one is the certificate ID. Easy to confuse.

---

## Rebuilding after any signing change

Xcode caches provisioning profiles. Changing the team or a capability without
clearing DerivedData silently reuses the old profile.

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/myshipr-*
cd /Users/ashutoshgangwar/Desktop/myshipr
npx react-native run-ios --device
```

Use a physical device. The Simulator does not receive real APNs pushes.

---

## Token flow, end to end

1. App launches → `FirebaseApp.configure()` in `AppDelegate.swift`
2. iOS registers with APNs — **requires `aps-environment`**, this is where it failed
3. APNs returns a device token
4. Firebase SDK exchanges it for an FCM token
5. [FirebaseMessagingService.js:81](src/services/FirebaseMessagingService.js#L81) `getFcmToken()` returns it
6. [api.js:498](src/config/api.js#L498) attaches it to the login payload as `fcmRegistrationToken`

Step 6 matters. The token only reaches the backend **at login**:

```js
const fcmRegistrationToken = await getFcmToken();
if (fcmRegistrationToken) {
  payload.fcmRegistrationToken = fcmRegistrationToken;
}
```

While `getFcmToken()` returned `null`, the key was silently omitted and
[api.js:439](src/config/api.js#L439) logged `device register skipped — no FCM token`.
**No iOS tokens were ever stored server-side.** Anyone on an older build must log out
and back in before backend-triggered pushes will reach them.

---

## Outstanding

### Firebase Team ID is still wrong

Firebase currently stores `Q7SJJXV3R5` (the personal team) against key `ZXN948GG5X`.
The key belongs to MYSHIPR INC, so APNs will reject every send with:

```
403  { "reason": "InvalidProviderToken" }
```

Notifications fail **silently** — sends look successful in the Firebase console and
nothing arrives on device.

Fix (needs Firebase **Editor** role):

1. Project settings → Cloud Messaging → Apple app configuration → `com.myshipr`
2. Delete both APNs auth key rows
3. Re-upload the **same** `.p8` to both rows with:

   | Field | Value |
   |---|---|
   | File | `AuthKey_ZXN948GG5X.p8` |
   | Key ID | `ZXN948GG5X` |
   | Team ID | `9852NBYTDU` |

### Firebase Editor access

Project `innate-lacing-484116-t8` (`prj-dev-01`) currently grants Viewer only —
blocks uploading keys, sending test messages, and reading delivery reports.
The project owner can change the role at
**Project settings → Users and permissions**.

### Re-login on device

Required once per device after upgrading to a push-enabled build, so the token
reaches the backend.

---

## Notes

- **Never commit the `.p8`.** Anyone holding it can send push notifications as this
  app. Store it in a password manager; share it only over an encrypted channel.
- **TestFlight / App Store:** Xcode rewrites `aps-environment` to `production` when
  archiving. No manual change needed, and the same key covers both environments.
- **APNs Certificates:** ignore that section in Firebase. Certificates are the legacy
  mechanism and expire yearly; the auth key replaces them.
- The `Usage of "messaging().registerDeviceForRemoteMessages()" is not required`
  warning from [FirebaseMessagingService.js:88](src/services/FirebaseMessagingService.js#L88)
  is harmless — auto-registration is on by default, so the call is a no-op. Remove it
  to silence the warning.
