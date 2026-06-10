import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, Linking } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import AsyncStorage from '@react-native-async-storage/async-storage';
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


const CACHE_KEY = '@myshipr/last_known_location';
const PERSIST_MIN_INTERVAL_MS = 10000;

let memoryCache = null;
let cacheHydrated = false;
let lastPersistTs = 0;

const isUsableLocation = loc =>
  !!loc && Number.isFinite(loc.latitude) && Number.isFinite(loc.longitude);

/**
 * Synchronous read of the last-known location (in-memory). May be null until a
 * fix is captured or hydrateLocationCache() has run.
 * @returns {LocationResult|null}
 */
export const getCachedLocation = () => memoryCache;

/**
 * Load the persisted last-known location into memory. Safe to call repeatedly;
 * only touches AsyncStorage on the first call. Call once at app startup.
 * @returns {Promise<LocationResult|null>}
 */
export const hydrateLocationCache = async () => {
  if (cacheHydrated) return memoryCache;
  cacheHydrated = true;
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isUsableLocation(parsed)) memoryCache = parsed;
    }
  } catch (err) {
    console.warn('[LocationService] cache hydrate failed', err?.message ?? err);
  }
  return memoryCache;
};

/**
 * Update the cache from a fresh fix. Memory is updated every time; the disk
 * write is throttled (or forced for one-shot fixes).
 * @param {LocationResult} location
 * @param {{ force?: boolean }} [opts]
 */
const updateCache = (location, { force = false } = {}) => {
  if (!isUsableLocation(location)) return;
  memoryCache = location;
  cacheHydrated = true;
  const now = Date.now();
  if (force || now - lastPersistTs >= PERSIST_MIN_INTERVAL_MS) {
    lastPersistTs = now;
    AsyncStorage.setItem(CACHE_KEY, JSON.stringify(location)).catch(() => {});
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Fast-fix tuning
//
// GPS (enableHighAccuracy:true) needs satellites and can take 20-30 s to get a
// fix — or never get one — indoors, in a basement or underground. The network
// provider (Wi-Fi + cell, enableHighAccuracy:false) usually answers in 1-3 s
// anywhere there's any signal. So instead of waiting on GPS we RACE both
// providers with short timeouts and take whichever returns first, and we accept
// a recent OS-cached fix so a fresh-enough location comes back instantly.
// ─────────────────────────────────────────────────────────────────────────────
const FAST_TIMEOUT_MS = 7000;    // first attempt: both providers in parallel
const SLOW_TIMEOUT_MS = 15000;   // escalated single network attempt
const FAST_MAX_AGE_MS = 15000;   // accept an OS fix up to 15 s old → often instant
const SLOW_MAX_AGE_MS = 120000;  // last resort: accept a 2 min old OS fix

/** @type {GeolocationOptions} */
const PRESET_OPTIONS = {
  // GPS — most accurate, slowest, fails underground.
  high: {
    enableHighAccuracy: true,
    timeout: FAST_TIMEOUT_MS,
    maximumAge: FAST_MAX_AGE_MS,
    showLocationDialog: true,
    forceRequestLocation: true,
  },
  // Network (Wi-Fi / cell) — fast, works indoors/underground, lower accuracy.
  low: {
    enableHighAccuracy: false,
    timeout: SLOW_TIMEOUT_MS,
    maximumAge: SLOW_MAX_AGE_MS,
    showLocationDialog: true,
    forceRequestLocation: true,
  },
  watch: {
    enableHighAccuracy: true,
    timeout: 25000,
    maximumAge: 0,
    // 1 m (was 5 m) so navigation receives a fresh fix roughly every metre,
    // letting the marker glide continuously between fixes.
    distanceFilter: 1,
    showLocationDialog: true,
    forceRequestLocation: true,
  },
};

const buildGeoOptions = ({ highAccuracy, timeout, maximumAge }) => ({
  enableHighAccuracy: highAccuracy,
  timeout,
  maximumAge,
  showLocationDialog: true,
  forceRequestLocation: true,
});

/**
 * Resolves with the first promise to FULFILL; rejects only when every promise
 * has rejected (with the last rejection). Lets us race the network and GPS
 * providers and return the faster one. (Promise.any isn't guaranteed on every
 * RN JS engine, so we implement it.)
 */
const firstSuccess = promises =>
  new Promise((resolve, reject) => {
    if (!promises.length) {
      reject(new Error(LOCATION_ERRORS.LOCATION_UNAVAILABLE));
      return;
    }
    let remaining = promises.length;
    let lastError;
    promises.forEach(p =>
      Promise.resolve(p).then(resolve, err => {
        lastError = err;
        remaining -= 1;
        if (remaining === 0) reject(lastError);
      }),
    );
  });

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
 * Get the device's current location — optimised to return FAST, including
 * indoors / in a basement / underground where GPS alone can hang for 20-30 s.
 *
 * Strategy, in order:
 *   1. If a fresh-enough cached fix exists, return it instantly (and refresh in
 *      the background for next time). Disable with `preferCacheMs: 0`.
 *   2. Race the network (Wi-Fi/cell) provider against GPS with a short timeout
 *      and take whichever answers first — network wins indoors, GPS outdoors.
 *   3. Escalate to one slower network attempt (bigger timeout, older OS fix).
 *   4. Fall back to the last-known cached location instead of throwing.
 *
 * @param {GetCurrentLocationOptions} [options]
 * @returns {Promise<LocationResult>}
 */
export const getCurrentLocation = async ({
  detectMock          = true,
  skipGPSCheck        = false,
  skipPermissionCheck = false,
  fallbackToCache     = true,
  highAccuracy        = true,    // also race GPS; false = pure-network fast fix
  preferCacheMs       = 10000,   // serve a cached fix this fresh instantly (0 = always fetch)
  timeout             = FAST_TIMEOUT_MS,
  maximumAge          = FAST_MAX_AGE_MS,
  alertStrings        = {},
} = {}) => {
  // 1. Instant cache hit — no GPS round-trip at all.
  if (preferCacheMs > 0) {
    const cached = getCachedLocation() ?? (await hydrateLocationCache());
    if (
      isUsableLocation(cached) &&
      Number.isFinite(cached.timestamp) &&
      Date.now() - cached.timestamp <= preferCacheMs
    ) {
      refreshLocationInBackground({ detectMock, skipGPSCheck, skipPermissionCheck });
      return cached;
    }
  }

  await runPreflightChecks({ skipGPSCheck, skipPermissionCheck, alertStrings });

  // 2. Race network + GPS — first usable fix wins.
  const legs = [
    getPosition(buildGeoOptions({ highAccuracy: false, timeout, maximumAge }), detectMock),
  ];
  if (highAccuracy) {
    legs.push(
      getPosition(buildGeoOptions({ highAccuracy: true, timeout, maximumAge }), detectMock),
    );
  }

  let lastError;
  try {
    const position = await firstSuccess(legs);
    updateCache(position, { force: true });
    return position;
  } catch (err) {
    lastError = err;
    // A hard NO from the user/device — don't bother escalating.
    if (
      err.message === LOCATION_ERRORS.PERMISSION_DENIED ||
      err.message === LOCATION_ERRORS.MOCK_LOCATION_DETECTED
    ) {
      throw err;
    }
  }

  // 3. Escalate: one slower network attempt that accepts an older OS fix.
  try {
    const position = await getPosition(PRESET_OPTIONS.low, detectMock);
    updateCache(position, { force: true });
    return position;
  } catch (fallbackError) {
    lastError = fallbackError;
  }

  // 4. Everything failed — hand back the last-known location instead of
  //    throwing, so the app keeps showing *something* (production behaviour).
  if (fallbackToCache) {
    const cached = getCachedLocation() ?? (await hydrateLocationCache());
    if (isUsableLocation(cached)) {
      console.warn('[LocationService] live fix failed — using cached location');
      return cached;
    }
  }

  throw new Error(lastError?.message || LOCATION_ERRORS.LOCATION_UNAVAILABLE);
};

/**
 * Fire-and-forget refresh used after serving a cached fix, so the cache stays
 * warm for next time. Never throws and never blocks the caller.
 */
const refreshLocationInBackground = ({ detectMock = true } = {}) => {
  firstSuccess([
    getPosition(
      buildGeoOptions({ highAccuracy: false, timeout: FAST_TIMEOUT_MS, maximumAge: FAST_MAX_AGE_MS }),
      detectMock,
    ),
    getPosition(
      buildGeoOptions({ highAccuracy: true, timeout: FAST_TIMEOUT_MS, maximumAge: FAST_MAX_AGE_MS }),
      detectMock,
    ),
  ])
    .then(position => updateCache(position, { force: true }))
    .catch(() => {}); // best-effort
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
      const normalised = normalisePosition(position);
      updateCache(normalised); // throttled persist; keeps cache always fresh
      successCallback(normalised);
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


// ─────────────────────────────────────────────────────────────────────────────
// useLocation — the ONE hook every screen uses
//
// Cache-first: seeds `location` from the last-known cache so the UI never starts
// blank, then either does a single fresh fetch (default) or a continuous watch
// (`watch: true`, used during navigation). A failed live fix never blanks the
// screen — it falls back to the cached value. This replaces the old
// useCurrentLocation / useWatchLocation hooks and the per-screen Redux cache.
//
//   const { location, loading, error, refresh, start, stop } = useLocation();
//   const { location } = useLocation({ watch: true });   // live tracking
// ─────────────────────────────────────────────────────────────────────────────
export const useLocation = ({
  watch               = false,
  fetchOnMount        = true,
  detectMock          = true,
  skipGPSCheck        = false,
  skipPermissionCheck = false,
  geoOptions,
  alertStrings        = {},
} = {}) => {
  const [location, setLocation] = useState(() => getCachedLocation());
  const [loading,  setLoading]  = useState(
    (watch || fetchOnMount) && !getCachedLocation(),
  );
  const [error,      setError]      = useState(null);
  const [isWatching, setIsWatching] = useState(false);

  const watchIdRef = useRef(null);
  const optsRef    = useRef({});
  optsRef.current  = {
    detectMock, skipGPSCheck, skipPermissionCheck, geoOptions, alertStrings,
  };

  // Hydrate the persisted cache on first mount so a cold start shows the
  // last-known location while the first live fix is still in flight.
  useEffect(() => {
    let active = true;
    if (!getCachedLocation()) {
      hydrateLocationCache().then(cached => {
        if (active && cached) setLocation(prev => prev ?? cached);
      });
    }
    return () => {
      active = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getCurrentLocation({
        ...optsRef.current,
        fallbackToCache: true,
      });
      setLocation(result);
      return result;
    } catch (err) {
      setError(err.message ?? LOCATION_ERRORS.LOCATION_UNAVAILABLE);
      const cached = getCachedLocation();
      if (cached) setLocation(cached);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      clearWatchLocation(watchIdRef.current);
      watchIdRef.current = null;
      setIsWatching(false);
    }
  }, []);

  const start = useCallback(async () => {
    if (watchIdRef.current !== null) stop();
    setError(null);
    setIsWatching(true);
    try {
      const id = await watchCurrentLocation(
        pos => {
          setLocation(pos);
          setLoading(false);
        },
        err => setError(err.message ?? LOCATION_ERRORS.LOCATION_UNAVAILABLE),
        optsRef.current,
      );
      watchIdRef.current = id;
    } catch (err) {
      setError(err.message ?? LOCATION_ERRORS.LOCATION_UNAVAILABLE);
      setIsWatching(false);
      const cached = getCachedLocation();
      if (cached) setLocation(cached);
    }
  }, [stop]);

  useEffect(() => {
    if (watch) {
      start();
      return () => stop();
    }
    if (fetchOnMount) {
      refresh();
    }
    return undefined;
  }, [watch, fetchOnMount, start, stop, refresh]);

  return { location, loading, error, isWatching, refresh, start, stop };
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
 * @property {boolean} [detectMock=true]
 * @property {boolean} [skipGPSCheck=false]
 * @property {boolean} [skipPermissionCheck=false]
 * @property {boolean} [fallbackToCache=true]   Return last-known fix if live fails.
 * @property {boolean} [highAccuracy=true]      Also race GPS; false = network-only fast fix.
 * @property {number}  [preferCacheMs=10000]    Serve a cached fix this fresh instantly (0 = always fetch).
 * @property {number}  [timeout=7000]           Per-provider timeout (ms) for the fast race.
 * @property {number}  [maximumAge=15000]       Accept an OS fix this old (ms).
 * @property {object}  [alertStrings]
 * @property {object}  [alertStrings.gps]
 * @property {object}  [alertStrings.permission]
 */