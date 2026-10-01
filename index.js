/**
 * @format
 */

import {AppRegistry} from 'react-native';
import { enableScreens } from 'react-native-screens';
// Modular FCM imports (v22). The background handler MUST be registered at the
// top level of index.js — before AppRegistry.registerComponent — so it is
// available to the OS when the app is in the background or fully quit.
import {getApp} from '@react-native-firebase/app';
import {getMessaging, setBackgroundMessageHandler} from '@react-native-firebase/messaging';
import App from './App';
import {name as appName} from './app.json';

// Background / quit-state data messages are delivered here (headless JS).
// Keep this handler lightweight; heavy UI work belongs in the app once opened.
setBackgroundMessageHandler(getMessaging(getApp()), async remoteMessage => {
  console.log('[FCM] Background message:', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
enableScreens();
