/**
 * FirebaseMessagingService
 * ------------------------------------------------------------------
 * Reusable wrapper around Firebase Cloud Messaging (FCM) for this app.
 *
 * IMPORTANT (React Native Firebase v22 / RN 0.83):
 * We use the **modular** API (getMessaging, onMessage, getToken, ...).
 * The older namespaced API (messaging().onMessage(), messaging().getToken())
 * is DEPRECATED in v22 and prints runtime warnings, so we avoid it here to
 * keep the integration free of deprecated APIs.
 *
 * Firebase itself is auto-initialised natively from google-services.json via
 * the com.google.gms.google-services Gradle plugin — there is no JS-side
 * initializeApp() call to make for the default app.
 */
import {Platform, PermissionsAndroid} from 'react-native';
import {getApp} from '@react-native-firebase/app';
import {
  getMessaging,
  getToken,
  requestPermission,
  hasPermission,
  onMessage,
  onTokenRefresh,
  onNotificationOpenedApp,
  getInitialNotification,
  registerDeviceForRemoteMessages,
  isDeviceRegisteredForRemoteMessages,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';

// A single Messaging instance bound to the default (auto-initialised) app.
// getApp() returns the app configured from google-services.json.
const messaging = getMessaging(getApp());

/**
 * Ask the user for notification permission.
 *
 * - iOS: requestPermission() shows the APNs/notification prompt.
 * - Android 13+ (API 33): notifications require the runtime
 *   POST_NOTIFICATIONS permission, so we request it explicitly via
 *   PermissionsAndroid (RN core — no extra dependency needed).
 * - Android < 13: notifications are granted at install time; nothing to do.
 *
 * @returns {Promise<boolean>} true if we may show notifications.
 */
export async function requestNotificationPermission() {
  try {
    if (Platform.OS === 'android') {
      // POST_NOTIFICATIONS only exists / is required on Android 13+.
      if (Platform.Version >= 33) {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        const granted = result === PermissionsAndroid.RESULTS.GRANTED;
        console.log('[FCM] POST_NOTIFICATIONS granted:', granted);
        return granted;
      }
      return true;
    }

    // iOS (and a harmless no-op safety net for any other platform).
    const authStatus = await requestPermission(messaging);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;
    console.log('[FCM] iOS authorization status:', authStatus);
    return enabled;
  } catch (error) {
    console.warn('[FCM] requestNotificationPermission error:', error);
    return false;
  }
}

/**
 * Generate (or read the cached) FCM registration token and log it.
 * Send this token to your backend so the server can target this device.
 *
 * @returns {Promise<string|null>} the FCM token, or null on failure.
 */
export async function getFcmToken() {
  try {
    // iOS: FCM needs an APNs registration before it can mint a token. With
    // swizzling enabled Firebase usually does this automatically, but if the
    // device isn't registered yet getToken() throws [messaging/unregistered],
    // so we register explicitly first. (No-op / not needed on Android.)
    if (Platform.OS === 'ios' && !isDeviceRegisteredForRemoteMessages(messaging)) {
      await registerDeviceForRemoteMessages(messaging);
    }

    const token = await getToken(messaging);
    console.log('[FCM] Token----:', token);
    return token;
  } catch (error) {
    console.warn('[FCM] getFcmToken error:', error);
    return null;
  }
}

/**
 * Foreground messages.
 * When the app is in the foreground the OS does NOT show a notification
 * automatically — this handler receives the data and lets you render an
 * in-app alert / local notification yourself.
 *
 * @param {(message: object) => void} [onMessageReceived]
 * @returns {() => void} unsubscribe function (call on cleanup).
 */
export function registerForegroundHandler(onMessageReceived) {
  return onMessage(messaging, async remoteMessage => {
    console.log('[FCM] Foreground message:', remoteMessage);
    if (typeof onMessageReceived === 'function') {
      onMessageReceived(remoteMessage);
    }
  });
}

/**
 * Notification-open (tap) handling.
 *
 * - getInitialNotification(): the app was launched from a QUIT state by
 *   tapping a notification (resolves once at startup, may be null).
 * - onNotificationOpenedApp(): the app was in the BACKGROUND and brought to
 *   the foreground by tapping a notification.
 *
 * @param {(message: object) => void} [onNotificationOpen] handle navigation etc.
 * @returns {() => void} unsubscribe function for the background-open listener.
 */
export function registerNotificationOpenHandlers(onNotificationOpen) {
  // App opened from a quit (cold) state.
  getInitialNotification(messaging)
    .then(remoteMessage => {
      if (remoteMessage) {
        console.log('[FCM] Opened from quit state:', remoteMessage);
        if (typeof onNotificationOpen === 'function') {
          onNotificationOpen(remoteMessage);
        }
      }
    })
    .catch(error =>
      console.warn('[FCM] getInitialNotification error:', error),
    );

  // App opened from the background.
  return onNotificationOpenedApp(messaging, remoteMessage => {
    console.log('[FCM] Opened from background:', remoteMessage);
    if (typeof onNotificationOpen === 'function') {
      onNotificationOpen(remoteMessage);
    }
  });
}

/**
 * React to FCM token rotation. The token can change (app restore, reinstall,
 * data cleared) — persist/upload the new one to your backend when it does.
 *
 * @param {(token: string) => void} [onRefresh]
 * @returns {() => void} unsubscribe function.
 */
export function registerTokenRefreshHandler(onRefresh) {
  return onTokenRefresh(messaging, token => {
    console.log('[FCM] Token refreshed:', token);
    if (typeof onRefresh === 'function') {
      onRefresh(token);
    }
  });
}

/**
 * Flatten an FCM RemoteMessage into the shape the in-app UI needs.
 *
 * The payload differs by how the push was sent: a "notification" message
 * carries `notification.title/body`, while a data-only message (the kind the
 * background handler gets) carries everything as strings under `data`. The UI
 * should not have to know which one arrived.
 *
 * @param {object} remoteMessage
 * @returns {{title: string, body: string, type: string, data: object}}
 */
export function normalizeRemoteMessage(remoteMessage) {
  const data = remoteMessage?.data ?? {};
  return {
    title: remoteMessage?.notification?.title ?? data.title ?? '',
    body: remoteMessage?.notification?.body ?? data.body ?? '',
    // Drives the badge/icon in the modal and the notifications list. Defaults
    // to 'system' so an unrecognised or missing type still renders.
    type: data.type ?? 'system',
    data,
  };
}

/**
 * Convenience "do everything" initialiser to call once when the app mounts.
 * Wires permission → token → foreground → open → refresh, and returns a
 * single cleanup function that removes every listener it registered.
 *
 * @param {object} [handlers]
 * @param {(message: object) => void} [handlers.onForegroundMessage]
 * @param {(message: object) => void} [handlers.onNotificationOpen]
 * @param {(token: string) => void}   [handlers.onTokenRefreshed]
 * @returns {Promise<() => void>} cleanup function.
 */
export async function initFirebaseMessaging(handlers = {}) {
  const {onForegroundMessage, onNotificationOpen, onTokenRefreshed} = handlers;

  const permitted = await requestNotificationPermission();
  if (permitted) {
    await getFcmToken();
  }

  const unsubscribeForeground = registerForegroundHandler(onForegroundMessage);
  const unsubscribeOpened = registerNotificationOpenHandlers(onNotificationOpen);
  const unsubscribeRefresh = registerTokenRefreshHandler(onTokenRefreshed);

  // Return an aggregate cleanup so the caller can unsubscribe on unmount.
  return () => {
    unsubscribeForeground();
    unsubscribeOpened();
    unsubscribeRefresh();
  };
}

export default {
  requestNotificationPermission,
  getFcmToken,
  normalizeRemoteMessage,
  registerForegroundHandler,
  registerNotificationOpenHandlers,
  registerTokenRefreshHandler,
  initFirebaseMessaging,
};
