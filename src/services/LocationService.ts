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
import type {
  AlertStrings,
  GeoOptions,
  GeoOptionsInput,
  GetCurrentLocationOptions,
  LocationResult,
  PreflightOptions,
  UseLocationOptions,
  UseLocationResult,
} from '../types/location';
import type {ErrorLike} from '../types/common';

/** A raw fix from `@react-native-community/geolocation`. */
type GeoPosition = Parameters<
  Parameters<typeof Geolocation.getCurrentPosition>[0]
>[0];


export const LOCATION_ERRORS = {
  GPS_DISABLED: 'GPS_DISABLED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  MOCK_LOCATION_DETECTED: 'MOCK_LOCATION_DETECTED',
  LOCATION_UNAVAILABLE: 'LOCATION_UNAVAILABLE',
  TIMEOUT: 'LOCATION_TIMEOUT',
};


const CACHE_KEY = '@myshipr/last_known_location';
const PERSIST_MIN_INTERVAL_MS = 10000;

let memoryCache: LocationResult | null = null;
let cacheHydrated = false;
let lastPersistTs = 0;

// A type predicate: after this check the caller has a real `LocationResult`,
// which is what lets `getCurrentLocation()` return a cached fix unguarded.
const isUsableLocation = (loc: unknown): loc is LocationResult =>
  !!loc &&
  Number.isFinite((loc as LocationResult).latitude) &&
  Number.isFinite((loc as LocationResult).longitude);

/**
 * Synchronous read of the last-known location (in-memory). May be null until a
 * fix is captured or hydrateLocationCache() has run.
 * @returns {LocationResult|null}
 */
export const getCachedLocation = (): LocationResult | null => memoryCache;

/**
 * Load the persisted last-known location into memory. Safe to call repeatedly;
 * only touches AsyncStorage on the first call. Call once at app startup.
 * @returns {Promise<LocationResult|null>}
 */
export const hydrateLocationCache = async (): Promise<LocationResult | null> => {
  if (cacheHydrated) return memoryCache;
  cacheHydrated = true;
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isUsableLocation(parsed)) memoryCache = parsed;
    }
  } catch (e) {
    const err = e as ErrorLike;
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
const updateCache = (
  location: LocationResult,
  { force = false }: { force?: boolean } = {},
): void => {
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
// providers with short timeouts, and we accept a recent OS-cached fix so a
// fresh-enough location comes back instantly. The race is settled on accuracy
// rather than speed — see the accuracy floor below, without which the coarse
// provider wins every time simply by being first.
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

// ─────────────────────────────────────────────────────────────────────────────
// Accuracy floor
//
// The race above must not be won on speed alone. Android's network provider
// answers in about a second with a cell-tower fix, which it reports at exactly
// 100 m accuracy and which can be KILOMETRES from the device — GPS answers a
// couple of seconds later at 5-10 m. Returning whichever arrived first meant
// systematically returning the cell fix and never the GPS one.
//
// So a fix has to be accurate enough to win outright. A coarse one is kept as
// a fallback while the remaining providers are given a short grace period, and
// is only returned if nothing better turns up in that window — the wait stays
// bounded, but a good fix is preferred whenever one is available.
// ─────────────────────────────────────────────────────────────────────────────
const ACCEPTABLE_ACCURACY_M = 50;   // good enough to stop waiting
const ACCURACY_GRACE_MS = 4000;     // extra time GPS gets when the fast fix is coarse

/** Reported accuracy in metres; unknown counts as "as bad as it gets". */
const accuracyOf = (position: {accuracy?: number} | null | undefined): number =>
  Number.isFinite(position?.accuracy) ? (position as {accuracy: number}).accuracy : Infinity;

const buildGeoOptions = ({
  highAccuracy,
  timeout,
  maximumAge,
}: GeoOptionsInput): GeoOptions => ({
  enableHighAccuracy: highAccuracy,
  timeout,
  maximumAge,
  showLocationDialog: true,
  forceRequestLocation: true,
});

/**
 * Resolves with the BEST fix rather than the first one: an accurate fix
 * resolves immediately, a coarse one only after the other providers have had
 * `graceMs` to do better (or have all settled). Rejects only when every
 * promise rejected, with the last rejection.
 *
 * (Promise.any isn't guaranteed on every RN JS engine, and would pick the
 * first answer anyway — which is the behaviour this replaces.)
 */
const bestFix = (
  promises: Array<Promise<LocationResult>>,
  {
    acceptableAccuracyM = ACCEPTABLE_ACCURACY_M,
    graceMs = ACCURACY_GRACE_MS,
  }: {acceptableAccuracyM?: number; graceMs?: number} = {},
): Promise<LocationResult> =>
  new Promise<LocationResult>((resolve, reject) => {
    if (!promises.length) {
      reject(new Error(LOCATION_ERRORS.LOCATION_UNAVAILABLE));
      return;
    }

    let remaining = promises.length;
    let best: LocationResult | null = null;
    let lastError: unknown;
    let settled = false;
    let graceTimer: ReturnType<typeof setTimeout> | null = null;

    const finish = () => {
      if (settled) return;
      settled = true;
      if (graceTimer) clearTimeout(graceTimer);
      if (best) resolve(best);
      else reject(lastError || new Error(LOCATION_ERRORS.LOCATION_UNAVAILABLE));
    };

    const onSettled = () => {
      remaining -= 1;
      if (remaining === 0) finish();
    };

    promises.forEach((p: Promise<LocationResult>) =>
      Promise.resolve(p).then(
        position => {
          if (!best || accuracyOf(position) < accuracyOf(best)) best = position;
          // Accurate enough — no reason to wait on anything else.
          if (accuracyOf(best) <= acceptableAccuracyM) {
            finish();
            return;
          }
          onSettled();
          // Coarse, and something is still running: hold this as the fallback
          // and give the rest a moment to beat it.
          if (!settled && !graceTimer) {
            graceTimer = setTimeout(finish, graceMs);
          }
        },
        err => {
          lastError = err;
          onSettled();
        },
      ),
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
const getPosition = (
  options: GeoOptions,
  detectMock: boolean = true,
): Promise<LocationResult> =>
  new Promise<LocationResult>((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        if (detectMock && (position?.coords as {mocked?: boolean})?.mocked) {
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
const normalisePosition = (position: GeoPosition): LocationResult => ({
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
const normaliseGeolocationError = (error: {code?: number} | null | undefined): Error => {
  const code = error?.code;
  if (code === 1) return new Error(LOCATION_ERRORS.PERMISSION_DENIED);
  if (code === 3) return new Error(LOCATION_ERRORS.TIMEOUT);
  return new Error(LOCATION_ERRORS.LOCATION_UNAVAILABLE);
};


const showPermissionAlert = (strings: AlertStrings = {}): void => {
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

const showGPSAlert = (strings: AlertStrings = {}): void => {
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
const checkPermission = async (): Promise<boolean> => {
  const result = await checkAppPermission(APP_PERMISSION_TYPES.LOCATION);
  return result.granted;
};

/**
 * Requests the location permission, optionally showing a blocked alert.
 *
 * @param {{ alertStrings?: object, showBlockedAlert?: boolean }} [opts]
 * @returns {Promise<boolean>}
 */
const requestPermission = async ({
  alertStrings,
  showBlockedAlert = false,
}: {alertStrings?: AlertStrings; showBlockedAlert?: boolean} = {}): Promise<boolean> => {
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
const checkGPS = async ({
  alertStrings,
}: {alertStrings?: AlertStrings} = {}): Promise<boolean> => {
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
}: PreflightOptions = {}): Promise<void> => {
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
 *      and take the most accurate answer — a fix under `acceptableAccuracyM`
 *      wins outright, a coarse one only after GPS has had a few seconds to
 *      beat it. Network wins indoors, GPS outdoors.
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
  acceptableAccuracyM = ACCEPTABLE_ACCURACY_M,
  timeout             = FAST_TIMEOUT_MS,
  maximumAge          = FAST_MAX_AGE_MS,
  alertStrings        = {},
} = {}) => {
  // 1. Instant cache hit — no GPS round-trip at all. Accuracy is checked as
  //    well as age: a coarse fix served from here would keep being handed back
  //    for as long as it stays fresh, so a bad one would outlive itself.
  if (preferCacheMs > 0) {
    const cached = getCachedLocation() ?? (await hydrateLocationCache());
    if (
      isUsableLocation(cached) &&
      Number.isFinite(cached.timestamp) &&
      Date.now() - cached.timestamp <= preferCacheMs &&
      accuracyOf(cached) <= acceptableAccuracyM
    ) {
      refreshLocationInBackground({ detectMock, skipGPSCheck, skipPermissionCheck });
      return cached;
    }
  }

  await runPreflightChecks({ skipGPSCheck, skipPermissionCheck, alertStrings });

  // 2. Race network + GPS — the most accurate usable fix wins (see bestFix).
  const legs = [
    getPosition(buildGeoOptions({ highAccuracy: false, timeout, maximumAge }), detectMock),
  ];
  if (highAccuracy) {
    legs.push(
      getPosition(
        // maximumAge 0: an OS-cached fix here is usually the same cell-tower
        // one the network leg is already fetching, and accepting it would let
        // this leg "answer" without GPS ever being consulted.
        buildGeoOptions({ highAccuracy: true, timeout, maximumAge: 0 }),
        detectMock,
      ),
    );
  }

  let lastError;
  try {
    const position = await bestFix(legs, { acceptableAccuracyM });
    updateCache(position, { force: true });
    return position;
  } catch (e) {
    const err = e as ErrorLike;
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

  throw new Error(
    (lastError as ErrorLike)?.message || LOCATION_ERRORS.LOCATION_UNAVAILABLE,
  );
};

/**
 * Fire-and-forget refresh used after serving a cached fix, so the cache stays
 * warm for next time. Never throws and never blocks the caller.
 */
const refreshLocationInBackground = ({
  detectMock = true,
}: GetCurrentLocationOptions = {}): void => {
  bestFix([
    getPosition(
      buildGeoOptions({ highAccuracy: false, timeout: FAST_TIMEOUT_MS, maximumAge: FAST_MAX_AGE_MS }),
      detectMock,
    ),
    getPosition(
      buildGeoOptions({ highAccuracy: true, timeout: FAST_TIMEOUT_MS, maximumAge: 0 }),
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
  successCallback: (location: LocationResult) => void,
  errorCallback: (error: Error) => void,
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
      if (detectMock && (position?.coords as {mocked?: boolean})?.mocked) {
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
export const clearWatchLocation = (watchId: number): void => {
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
}: UseLocationOptions = {}): UseLocationResult => {
  const [location, setLocation] = useState(() => getCachedLocation());
  const [loading,  setLoading]  = useState(
    (watch || fetchOnMount) && !getCachedLocation(),
  );
  const [error,      setError]      = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);

  const watchIdRef = useRef<number | null>(null);
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
    } catch (e) {
      const err = e as ErrorLike;
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
    } catch (e) {
      const err = e as ErrorLike;
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
 * @property {number}  [acceptableAccuracyM=50] Accuracy (m) that wins the race outright and that a cached fix must meet.
 * @property {number}  [timeout=7000]           Per-provider timeout (ms) for the fast race.
 * @property {number}  [maximumAge=15000]       Accept an OS fix this old (ms).
 * @property {object}  [alertStrings]
 * @property {object}  [alertStrings.gps]
 * @property {object}  [alertStrings.permission]
 */