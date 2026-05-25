import { Alert, Linking } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import DeviceInfo from 'react-native-device-info';
import { openSettings } from 'react-native-permissions';
import {
  APP_PERMISSION_TYPES,
  checkAppPermission,
  requestAppPermission,
} from './PermissionService';


export const LOCATION_ERRORS = {
  GPS_DISABLED: 'GPS_DISABLED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  MOCK_LOCATION_DETECTED: 'MOCK_LOCATION_DETECTED',
  LOCATION_UNAVAILABLE: 'LOCATION_UNAVAILABLE',
  TIMEOUT: 'LOCATION_TIMEOUT',
};

/** @type {GeolocationOptions} */
const PRESET_OPTIONS = {
  high: {
    enableHighAccuracy: true,
    timeout: 25000,
    maximumAge: 8000,
    showLocationDialog: true,
    forceRequestLocation: true,
  },
  low: {
    enableHighAccuracy: false,
    timeout: 30000,
    maximumAge: 30000,
    showLocationDialog: true,
    forceRequestLocation: true,
  },
  watch: {
    enableHighAccuracy: true,
    timeout: 25000,
    maximumAge: 0,
    distanceFilter: 5,
    showLocationDialog: true,
    forceRequestLocation: true,
  },
};

/**
 * Default retry strategy for getCurrentLocation.
 * Each element is [GeolocationOptions, delayBeforeAttemptMs].
 * Override via `retryStrategy` in getCurrentLocation options.
 *
 * @type {Array<[GeolocationOptions, number]>}
 */
const DEFAULT_RETRY_STRATEGY = [
  [PRESET_OPTIONS.high, 0],
  [PRESET_OPTIONS.low,  2000],
  [PRESET_OPTIONS.high, 2500],
  [PRESET_OPTIONS.low,  3000],
];


const delay = ms => new Promise(res => setTimeout(res, ms));

/**
 * Wraps Geolocation.getCurrentPosition in a Promise.
 * Rejects with a normalised Error whose message is one of LOCATION_ERRORS.
 *
 * @param {GeolocationOptions} options
 * @param {boolean} [detectMock=true]  Reject when mocked coords are detected.
 * @returns {Promise<LocationResult>}
 */
const getPosition = (options, detectMock = true) =>
  new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        if (detectMock && position?.coords?.mocked) {
          reject(new Error(LOCATION_ERRORS.MOCK_LOCATION_DETECTED));
          return;
        }
        resolve(normalisePosition(position));
      },
      error => reject(normaliseGeolocationError(error)),
      options,
    );
  });

/**
 * Extracts the fields callers care about from a raw Geolocation position.
 *
 * @param {GeolocationPosition} position
 * @returns {LocationResult}
 */
const normalisePosition = position => ({
  latitude:  position.coords.latitude,
  longitude: position.coords.longitude,
  accuracy:  position.coords.accuracy,
  altitude:  position.coords.altitude ?? null,
  speed:     position.coords.speed ?? null,
  heading:   position.coords.heading ?? null,
  timestamp: position.timestamp,
});

/**
 * Maps native Geolocation error codes to friendly LOCATION_ERRORS strings.
 *
 * @param {{ code: number, message: string }} error
 * @returns {Error}
 */
const normaliseGeolocationError = error => {
  const code = error?.code;
  if (code === 1) return new Error(LOCATION_ERRORS.PERMISSION_DENIED);
  if (code === 3) return new Error(LOCATION_ERRORS.TIMEOUT);
  return new Error(LOCATION_ERRORS.LOCATION_UNAVAILABLE);
};


const showPermissionAlert = (strings = {}) => {
  const {
    title   = 'Location Permission Required',
    message = 'Please allow location permission from settings.',
    cancel  = 'Cancel',
    action  = 'Open Settings',
  } = strings;

  Alert.alert(title, message, [
    { text: cancel, style: 'cancel' },
    { text: action, onPress: () => openSettings() },
  ]);
};

const showGPSAlert = (strings = {}) => {
  const {
    title   = 'GPS Disabled',
    message = 'Please enable Location Services to continue.',
    cancel  = 'Cancel',
    action  = 'Open Settings',
  } = strings;

  Alert.alert(title, message, [
    { text: cancel, style: 'cancel' },
    { text: action, onPress: () => Linking.openSettings() },
  ]);
};

/**
 * @returns {Promise<boolean>}
 */
const checkPermission = async () => {
  const result = await checkAppPermission(APP_PERMISSION_TYPES.LOCATION);
  return result.granted;
};

/**
 * Requests the location permission, optionally showing a blocked alert.
 *
 * @param {{ alertStrings?: object, showBlockedAlert?: boolean }} [opts]
 * @returns {Promise<boolean>}
 */
const requestPermission = async ({ alertStrings, showBlockedAlert = false } = {}) => {
  const result = await requestAppPermission(APP_PERMISSION_TYPES.LOCATION, {
    showBlockedAlert,
  });

  if (!result.granted) {
    showPermissionAlert(alertStrings);
    return false;
  }

  return true;
};


/**
 * @param {{ alertStrings?: object }} [opts]
 * @returns {Promise<boolean>}
 */
const checkGPS = async ({ alertStrings } = {}) => {
  const enabled = await DeviceInfo.isLocationEnabled();
  if (!enabled) {
    showGPSAlert(alertStrings);
    return false;
  }
  return true;
};


/**
 * Runs GPS and permission checks.  Throws on failure.
 *
 * @param {object} opts
 * @param {boolean} [opts.skipGPSCheck=false]
 * @param {boolean} [opts.skipPermissionCheck=false]
 * @param {object}  [opts.alertStrings]
 */
const runPreflightChecks = async ({
  skipGPSCheck        = false,
  skipPermissionCheck = false,
  alertStrings        = {},
} = {}) => {
  if (!skipGPSCheck) {
    const gpsEnabled = await checkGPS({ alertStrings: alertStrings.gps });
    if (!gpsEnabled) throw new Error(LOCATION_ERRORS.GPS_DISABLED);
  }

  if (!skipPermissionCheck) {
    const hasPermission = await checkPermission();
    if (!hasPermission) {
      const granted = await requestPermission({ alertStrings: alertStrings.permission });
      if (!granted) throw new Error(LOCATION_ERRORS.PERMISSION_DENIED);
    }
  }
};


/**
 * Get the device's current location with configurable retry logic.
 *
 * @param {GetCurrentLocationOptions} [options]
 * @returns {Promise<LocationResult>}
 */
export const getCurrentLocation = async ({
  retryStrategy       = DEFAULT_RETRY_STRATEGY,
  detectMock          = true,
  skipGPSCheck        = false,
  skipPermissionCheck = false,
  alertStrings        = {},
} = {}) => {
  await runPreflightChecks({ skipGPSCheck, skipPermissionCheck, alertStrings });

  let lastError;

  for (let i = 0; i < retryStrategy.length; i++) {
    const [geoOptions, waitMs] = retryStrategy[i];

    if (waitMs > 0) await delay(waitMs);

    try {
      return await getPosition(geoOptions, detectMock);
    } catch (err) {
      lastError = err;
      if (
        err.message === LOCATION_ERRORS.MOCK_LOCATION_DETECTED ||
        err.message === LOCATION_ERRORS.PERMISSION_DENIED
      ) {
        throw err;
      }

      const isLastAttempt = i === retryStrategy.length - 1;
      if (!isLastAttempt) {
        console.warn(`[LocationService] Attempt ${i + 1} failed (${err.message}), retrying…`);
      }
    }
  }

  if (lastError?.message === LOCATION_ERRORS.TIMEOUT) {
    try {
      return await getPosition(PRESET_OPTIONS.low, detectMock);
    } catch (fallbackError) {
      lastError = fallbackError;
    }
  }

  throw new Error(lastError?.message || LOCATION_ERRORS.LOCATION_UNAVAILABLE);
};

/**
 * Subscribe to continuous location updates.
 *
 * @param {function(LocationResult): void}  successCallback
 * @param {function(Error): void}           errorCallback
 * @param {GetCurrentLocationOptions}       [options]
 * @returns {Promise<number>}
  */
export const watchCurrentLocation = async (
  successCallback,
  errorCallback,
  {
    geoOptions          = PRESET_OPTIONS.watch,
    detectMock          = true,
    skipGPSCheck        = false,
    skipPermissionCheck = false,
    alertStrings        = {},
  } = {},
) => {
  await runPreflightChecks({ skipGPSCheck, skipPermissionCheck, alertStrings });

  return Geolocation.watchPosition(
    position => {
      if (detectMock && position?.coords?.mocked) {
        errorCallback(new Error(LOCATION_ERRORS.MOCK_LOCATION_DETECTED));
        return;
      }
      successCallback(normalisePosition(position));
    },
    error => errorCallback(normaliseGeolocationError(error)),
    geoOptions,
  );
};

/**
 * Stop a running location watch.
 *
 * @param {number} watchId
 */
export const clearWatchLocation = watchId => {
  Geolocation.clearWatch(watchId);
};


export { PRESET_OPTIONS };


/**
 * @typedef {object} LocationResult
 * @property {number}      latitude
 * @property {number}      longitude
 * @property {number}      accuracy   
 * @property {number|null} altitude
 * @property {number|null} speed   
 * @property {number|null} heading   
 * @property {number}      timestamp  
 */

/**
 * @typedef {object} GetCurrentLocationOptions
 * @property {Array<[GeolocationOptions, number]>} [retryStrategy]
 * @property {boolean} [detectMock=true]       
 * @property {boolean} [skipGPSCheck=false]       
 * @property {boolean} [skipPermissionCheck=false] 
 * @property {object}  [alertStrings]             
 * @property {object}  [alertStrings.gps]       
 * @property {object}  [alertStrings.permission] 
 */