import { Platform, PermissionsAndroid, Alert } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

/* ---------------- CONFIG ---------------- */
const HIGH_ACCURACY = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

const LOW_ACCURACY = {
  enableHighAccuracy: false,
  timeout: 15000,
  maximumAge: 30000, // allow cached location
};

/* ---------------- PERMISSION ---------------- */
const requestLocationPermission = async () => {
  if (Platform.OS !== 'android') return true;

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location Permission',
      message: 'App needs your location to continue',
      buttonPositive: 'OK',
    },
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
};

/* ---------------- POSITION PROMISE ---------------- */
const getPosition = options =>
  new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      pos => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      error => reject(error),
      options,
    );
  });

/* ---------------- PUBLIC API ---------------- */
export const getCurrentLocation = async () => {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    Alert.alert('Permission denied', 'Location permission is required');
    return null;
  }

  // 1️⃣ Try high accuracy (best for outdoor)
  try {
    return await getPosition(HIGH_ACCURACY);
  } catch (error) {
    console.log('High accuracy failed, trying fallback...');
  }

  // 2️⃣ Fallback: low accuracy (indoor / weak GPS)
  try {
    return await getPosition(LOW_ACCURACY);
  } catch (error) {
    console.log('Low accuracy failed');
  }

  Alert.alert(
    'Location Error',
    'Unable to fetch location. Please move to an open area.',
  );
  return null;
};
