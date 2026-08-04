import React, { useEffect } from 'react';
import {NavigationContainer} from '@react-navigation/native';
import AppStackMain from './src/Navigation/AppStackMain';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { hydrateLocationCache } from './src/services/LocationService';
import { initFirebaseMessaging } from './src/services/FirebaseMessagingService';
import { navigationRef, resetTo, getCurrentRouteName } from './src/Navigation/navigationRef';
import { onSessionExpired } from './src/config/api';

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
      // TODO: route/handle notifications for your app here (e.g. show an
      // in-app banner on foreground messages, navigate on notification tap).
      onForegroundMessage: message =>
        console.log('[App] Foreground notification:', message?.notification),
      onNotificationOpen: message =>
        console.log('[App] Notification opened app:', message?.data),
    }).then(unsubscribe => {
      cleanup = unsubscribe;
    });
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

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
      <NavigationContainer ref={navigationRef}>
        <AppStackMain />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
