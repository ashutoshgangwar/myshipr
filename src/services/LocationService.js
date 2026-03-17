import { Alert, Linking } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import DeviceInfo from 'react-native-device-info';
import {
  openSettings,
} from 'react-native-permissions';
import {
  APP_PERMISSION_TYPES,
  checkAppPermission,
  requestAppPermission,
} from './PermissionService';

const HIGH_ACCURACY_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 5000,
};

const LOW_ACCURACY_OPTIONS = {
  enableHighAccuracy: false,
  timeout: 20000,
  maximumAge: 10000,
};

/* -------------------- HELPERS -------------------- */

const delay = ms => new Promise(res => setTimeout(res, ms));

const showPermissionAlert = () => {
  Alert.alert(
    'Location Permission Required',
    'Please allow location permission from settings.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => openSettings() },
    ],
  );
};

const showGPSAlert = () => {
  Alert.alert(
    'GPS Disabled',
    'Please enable Location Services.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Open Settings',
        onPress: () => Linking.openSettings(),
      },
    ],
  );
};

/* -------------------- PERMISSIONS -------------------- */

const checkPermission = async () => {
  const result = await checkAppPermission(APP_PERMISSION_TYPES.LOCATION);
  return result.granted;
};

const requestPermission = async () => {
  const result = await requestAppPermission(APP_PERMISSION_TYPES.LOCATION, {
    showBlockedAlert: false,
  });

  if (!result.granted) {
    showPermissionAlert();
    return false;
  }

  return true;
};

/* -------------------- GPS -------------------- */

const checkGPS = async () => {
  const enabled = await DeviceInfo.isLocationEnabled();
  if (!enabled) {
    showGPSAlert();
    return false;
  }
  return true;
};

/* -------------------- LOCATION CORE -------------------- */

const getPosition = options =>
  new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        // Mock location detection (Android + iOS 15+)
        if (position?.coords?.mocked) {
          reject(new Error('MOCK_LOCATION_DETECTED'));
          return;
        }

        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      error => reject(error),
      options,
    );
  });

/* -------------------- PUBLIC API -------------------- */

export const getCurrentLocation = async () => {
  // 1️⃣ GPS check
  const gpsEnabled = await checkGPS();
  if (!gpsEnabled) throw new Error('GPS_DISABLED');

  // 2️⃣ Permission check
  const hasPermission = await checkPermission();
  if (!hasPermission) {
    const granted = await requestPermission();
    if (!granted) throw new Error('PERMISSION_DENIED');
  }

  // 3️⃣ Try HIGH accuracy
  try {
    return await getPosition(HIGH_ACCURACY_OPTIONS);
  } catch (err) {
    console.warn('High accuracy failed, retrying...', err.message);
  }

  // 4️⃣ Retry LOW accuracy
  try {
    await delay(1500);
    return await getPosition(LOW_ACCURACY_OPTIONS);
  } catch (err) {
    console.warn('Low accuracy failed, retrying...', err.message);
  }

  // 5️⃣ Final retry HIGH accuracy
  try {
    await delay(2000);
    return await getPosition(HIGH_ACCURACY_OPTIONS);
  } catch (err) {
    throw new Error('LOCATION_UNAVAILABLE');
  }
};

export const watchCurrentLocation = async (successCallback, errorCallback, options = HIGH_ACCURACY_OPTIONS) => {
  // 1️⃣ GPS check
  const gpsEnabled = await checkGPS();
  if (!gpsEnabled) throw new Error('GPS_DISABLED');

  // 2️⃣ Permission check
  const hasPermission = await checkPermission();
  if (!hasPermission) {
    const granted = await requestPermission();
    if (!granted) throw new Error('PERMISSION_DENIED');
  }

  return Geolocation.watchPosition(successCallback, errorCallback, options);
};

export const clearWatchLocation = (watchId) => {
  Geolocation.clearWatch(watchId);
};
