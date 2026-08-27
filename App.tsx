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
        console.log('[App] FCM token refreshed:', token);
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
      <NavigationContainer ref={navigationRef} onReady={handleNavigationReady}>
        <AppStackMain />
      </NavigationContainer>
      
      <FcmNotificationModal
        visible={Boolean(currentNotification)}
        notification={currentNotification}
        onClose={dismissNotification}
        onView={viewNotification}
      />
    </SafeAreaProvider>
  );
}
