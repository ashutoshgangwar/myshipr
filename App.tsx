import React, { useCallback, useEffect, useRef, useState } from 'react';
import {NavigationContainer} from '@react-navigation/native';
import AppStackMain from './src/Navigation/AppStackMain';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DeviceInfo from 'react-native-device-info';
import { hydrateLocationCache } from './src/services/LocationService';
import {
  initFirebaseMessaging,
  normalizeRemoteMessage,
} from './src/services/FirebaseMessagingService';
import FcmNotificationModal from './src/component/FcmNotificationModal/FcmNotificationModal';
import FuelPricePrompt from './src/component/FuelPricePrompt/FuelPricePrompt';
import {DestinationMarkerRasterizer} from './src/here';
import { navigationRef, navigate, resetTo, getCurrentRouteName } from './src/Navigation/navigationRef';
import { onAuthStateChange, onSessionExpired, registerDevice, hasSession } from './src/config/api';
import { startGpsPings, stopGpsPings } from './src/services/GpsPingService';
import { initDeepLinks } from './src/services/DeepLinkService';
import type {AxiosError} from 'axios';
import type {AppNotification} from './src/services/FirebaseMessagingService';
import type {ErrorLike} from './src/types/common';
import type {RootStackParamList} from './src/types/navigation';

const AUTH_ROUTES = [
  'PreviewSplashScreen',
  'LoginSplashScreen',
  'LoginScreen',
  'SignupScreen',
  'ResetPassword',
];

export default function App() {
  console.log('App Loaded');

  const [notificationQueue, setNotificationQueue] = useState<
    AppNotification[]
  >([]);

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

  useEffect(() => {
    DeviceInfo.getUniqueId()
      .then(deviceId => console.log('[App] Unique Device ID:', deviceId))
      .catch(err => console.log('[App] Unique Device ID failed:', err?.message));
  }, []);

  useEffect(() => {
    hydrateLocationCache();
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    initFirebaseMessaging({
      onForegroundMessage: message =>
        setNotificationQueue(queue => [
          ...queue,
          normalizeRemoteMessage(message),
        ]),
      onNotificationOpen: message => {
        console.log('[App] Notification opened app:', message?.data);
        openNotifications();
      },
      onTokenRefreshed: async token => {
        console.log('[App] FCM token refreshed', token);
        if (!(await hasSession())) {
          console.log('[App] No session — device register deferred to next login');
          return;
        }
        try {
          await registerDevice({fcmRegistrationToken: token});
          console.log('[App] Device re-registered with rotated FCM token');
        } catch (e) {
          const err = e as AxiosError & ErrorLike;
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
  }, [openNotifications]);

  useEffect(
    () =>
      initDeepLinks(link => {
        console.log('[App] Deep link:', link.action);
        resetTo(
          link.screen as keyof RootStackParamList,
          link.params as never,
        );
      }),
    [],
  );

  // The truck's position trace runs for exactly as long as the driver is
  // signed in — see `services/GpsPingService`. Both edges arrive here: the
  // sign-in one from whichever login path stored the session, the sign-out one
  // from logout and from a refresh the server refused.
  useEffect(() => {
    let cancelled = false;

    // A session already on disk emits nothing — it was neither saved nor
    // cleared — so a cold start that lands straight on Home has to ask.
    hasSession()
      .then(signedIn => {
        if (!cancelled && signedIn) startGpsPings();
      })
      .catch(() => {});

    const unsubscribe = onAuthStateChange(signedIn => {
      if (signedIn) startGpsPings();
      else stopGpsPings();
    });

    return () => {
      cancelled = true;
      unsubscribe();
      stopGpsPings();
    };
  }, []);

  useEffect(
    () =>
      onSessionExpired(() => {
        if (!AUTH_ROUTES.includes(getCurrentRouteName() ?? '')) {
          resetTo('LoginSplashScreen');
        }
      }),
    [],
  );

  return (
    <SafeAreaProvider>
      {/*
        Rasterises the drop-location marker once, at startup, so every map
        already has the bytes when it plants a stop. Without this the first map
        to open can beat the raster and fall back to a native pin — and that
        fallback is the one thing that does NOT match across platforms (iOS
        draws HERE's own pin, Android a system icon). It unmounts itself once
        the bytes are cached.
      */}
      <DestinationMarkerRasterizer />
      <NavigationContainer ref={navigationRef} onReady={handleNavigationReady}>
        <AppStackMain />
      </NavigationContainer>
      
      <FcmNotificationModal
        visible={Boolean(currentNotification)}
        notification={currentNotification}
        onClose={dismissNotification}
        onView={viewNotification}
      />

      {/*
        The diesel-price sheet, above the navigator so it opens over whatever
        screen the driver is on: a stop at a fuel station raises it on its own,
        and a screen's own "report a price" control raises the same one through
        `openFuelPriceEntry()`.
      */}
      <FuelPricePrompt />
    </SafeAreaProvider>
  );
}
