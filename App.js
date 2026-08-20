import React, { useCallback, useEffect, useRef, useState } from 'react';
import {NavigationContainer} from '@react-navigation/native';
import AppStackMain from './src/Navigation/AppStackMain';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { hydrateLocationCache } from './src/services/LocationService';
import {
  initFirebaseMessaging,
  normalizeRemoteMessage,
} from './src/services/FirebaseMessagingService';
import FcmNotificationModal from './src/component/FcmNotificationModal/FcmNotificationModal';
import { navigationRef, navigate, resetTo, getCurrentRouteName } from './src/Navigation/navigationRef';
import { onSessionExpired, registerDevice, hasSession } from './src/config/api';
import { initDeepLinks } from './src/services/DeepLinkService';

// Screens that are already part of the signed-out flow — a late session-expiry
// callback must not yank the user off the login form they are typing into.
const AUTH_ROUTES = [
  'PreviewSplashScreen',
  'LoginSplashScreen',
  'LoginScreen',
  'SignupScreen',
  'ResetPassword',
];

export default function App() {
  console.log('App Loaded');

  // Foreground pushes waiting to be shown. A queue rather than a single value
  // because a second message can land while the driver is still reading the
  // first one, and dropping it would lose a load or bid alert outright.
  const [notificationQueue, setNotificationQueue] = useState([]);
  // A notification tapped from a QUIT state resolves before NavigationContainer
  // is ready, so the navigate() call would be silently swallowed. Hold it here
  // and flush it from onReady instead.
  const pendingOpenRef = useRef(false);

  const currentNotification = notificationQueue[0];

  const dismissNotification = useCallback(
    () => setNotificationQueue(queue => queue.slice(1)),
    [],
  );

  const openNotifications = useCallback(() => {
    if (navigationRef.isReady()) {
      navigate('NotificationScreen');
    } else {
      pendingOpenRef.current = true;
    }
  }, []);

  const viewNotification = useCallback(() => {
    dismissNotification();
    openNotifications();
  }, [dismissNotification, openNotifications]);

  const handleNavigationReady = useCallback(() => {
    if (pendingOpenRef.current) {
      pendingOpenRef.current = false;
      navigate('NotificationScreen');
    }
  }, []);

  // Load the persisted last-known location into memory so the first screen can
  // show it instantly while the first live GPS fix is still in flight.
  useEffect(() => {
    hydrateLocationCache();
  }, []);

  // Initialise Firebase Cloud Messaging once on mount: request permission,
  // log the FCM token, and register foreground + notification-open listeners.
  // initFirebaseMessaging resolves to a cleanup fn that removes the listeners.
  useEffect(() => {
    let cleanup;
    initFirebaseMessaging({
      // The OS draws no banner while the app is in the foreground, so surface
      // the push ourselves. Functional update: this callback is registered once
      // and would otherwise close over the queue as it was on mount.
      onForegroundMessage: message =>
        setNotificationQueue(queue => [
          ...queue,
          normalizeRemoteMessage(message),
        ]),
      // Tapped from background/quit — the OS already showed it, so go straight
      // to the list instead of repeating it in a modal.
      onNotificationOpen: message => {
        console.log('[App] Notification opened app:', message?.data);
        openNotifications();
      },
      // FCM rotates the token (app restore, reinstall, data cleared). Login
      // already registered the old one, so the server keeps pushing to a dead
      // address unless we re-register here. Signed-out users have no bearer
      // token to send with it — their next login registers the fresh token.
      onTokenRefreshed: async token => {
        console.log('[App] FCM token refreshed:', token);
        if (!(await hasSession())) {
          console.log('[App] No session — device register deferred to next login');
          return;
        }
        try {
          await registerDevice({fcmRegistrationToken: token});
          console.log('[App] Device re-registered with rotated FCM token');
        } catch (err) {
          console.warn(
            '[App] Device re-register failed:',
            err?.response?.status || err?.message,
          );
        }
      },
    }).then(unsubscribe => {
      cleanup = unsubscribe;
    });
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
    // openNotifications is stable (useCallback with no deps), so the listeners
    // are still registered exactly once.
  }, [openNotifications]);

  // Driver-invite / password-reset links tapped while the app is already
  // running. The launch link is handled by the splash screen instead — it owns
  // the first navigation, and routing here as well would race it.
  useEffect(
    () =>
      initDeepLinks(link => {
        console.log('[App] Deep link:', link.action);
        // reset, not navigate: the driver arrived from their mail app, so
        // whatever stack was underneath is not somewhere Back should return to.
        resetTo(link.screen, link.params);
      }),
    [],
  );

  // The refresh token is gone or was rejected: the stored session is already
  // cleared, so send the user back to the login flow from wherever they were.
  useEffect(
    () =>
      onSessionExpired(() => {
        if (!AUTH_ROUTES.includes(getCurrentRouteName())) {
          resetTo('LoginSplashScreen');
        }
      }),
    [],
  );

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} onReady={handleNavigationReady}>
        <AppStackMain />
      </NavigationContainer>

      {/* Outside the navigator so a push shows over whichever screen is up. */}
      <FcmNotificationModal
        visible={Boolean(currentNotification)}
        notification={currentNotification}
        onClose={dismissNotification}
        onView={viewNotification}
      />
    </SafeAreaProvider>
  );
}
