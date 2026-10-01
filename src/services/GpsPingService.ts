import {AppState} from 'react-native';
import type {AppStateStatus, NativeEventSubscription} from 'react-native';

import {updateDriverGps} from '../config/driverApi';
import {
  clearWatchLocation,
  getCachedLocation,
  getCurrentLocation,
  watchCurrentLocation,
} from './LocationService';
import {APP_PERMISSION_TYPES, checkAppPermission} from './PermissionService';
import {CURRENT_TRIP_ID} from '../screens/HomeScreen/currentTrip';
import type {LocationResult} from '../types/location';
import type {ErrorLike} from '../types/common';

const HEARTBEAT_MS = 60000;
const MIN_DISTANCE_M = 200;
const MIN_GAP_MS = 15000;

const MAX_ACCURACY_M = 200;

const MAX_FIX_AGE_MS = 120000;

/** The watch preset — a fix roughly every `MIN_DISTANCE_M`, GPS-accurate. */
const PING_GEO_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 30000,
  maximumAge: 0,
  distanceFilter: MIN_DISTANCE_M / 2,
  showLocationDialog: false,
  forceRequestLocation: true,
};

const QUIET = {skipGPSCheck: true, skipPermissionCheck: true} as const;

/** Ids the trace is filed under. */
interface PingTarget {
  truckId: string;
  shipmentId: string;
}

const defaultTarget = (): PingTarget => ({
  truckId: CURRENT_TRIP_ID,
  shipmentId: CURRENT_TRIP_ID,
});

let target: PingTarget = defaultTarget();

/** Whether a trace is wanted — true from login to logout, foreground or not. */
let wanted = false;

/** The running watch, or null when it is down (backgrounded, or no permission). */
let watchId: number | null = null;

let heartbeat: ReturnType<typeof setInterval> | null = null;

let appStateSub: NativeEventSubscription | null = null;

/** In-flight watch registration, so two callers cannot register two watches. */
let starting: Promise<void> | null = null;

/** The last fix the server accepted — what both cadence rules measure from. */
let lastSent: {latitude: number; longitude: number; at: number} | null = null;

/** One ping at a time: a slow request must not queue up behind itself. */
let inFlight = false;

/** Pings attempted this session — the number every console line is keyed on. */
let pingCount = 0;

const log = (...args: unknown[]): void => console.log('[GpsPing]', ...args);

/** Metres between two coordinates. Haversine on a spherical earth. */
const distanceMeters = (
  a: {latitude: number; longitude: number},
  b: {latitude: number; longitude: number},
): number => {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};

const isUsable = (fix: LocationResult | null | undefined): fix is LocationResult =>
  !!fix &&
  Number.isFinite(fix.latitude) &&
  Number.isFinite(fix.longitude) &&
  (!Number.isFinite(fix.accuracy) || fix.accuracy <= MAX_ACCURACY_M);

/** Whether a fix is recent enough to stand for where the truck is now. */
const isFresh = (fix: LocationResult, now: number): boolean =>
  Number.isFinite(fix.timestamp) && now - fix.timestamp <= MAX_FIX_AGE_MS;

const seconds = (ms: number): number => Math.round(ms / 1000);

const verdict = (
  fix: LocationResult,
  now: number,
): {send: boolean; why: string} => {
  if (!lastSent) return {send: true, why: 'first fix of this session'};

  const sinceMs = now - lastSent.at;
  const movedM = Math.round(distanceMeters(lastSent, fix));

  if (sinceMs < MIN_GAP_MS) {
    return {
      send: false,
      why: `${seconds(sinceMs)}s since the last ping, under the ${seconds(
        MIN_GAP_MS,
      )}s floor (moved ${movedM}m)`,
    };
  }
  if (sinceMs >= HEARTBEAT_MS) {
    return {send: true, why: `heartbeat — ${seconds(sinceMs)}s since the last ping`};
  }
  if (movedM >= MIN_DISTANCE_M) {
    return {send: true, why: `moved ${movedM}m (>= ${MIN_DISTANCE_M}m)`};
  }
  return {
    send: false,
    why: `moved ${movedM}m of ${MIN_DISTANCE_M}m, ${seconds(
      sinceMs,
    )}s of ${seconds(HEARTBEAT_MS)}s`,
  };
};

let lastSkipLogAt = 0;
const SKIP_LOG_GAP_MS = 5000;

const logSkip = (why: string, now: number): void => {
  if (now - lastSkipLogAt < SKIP_LOG_GAP_MS) return;
  lastSkipLogAt = now;
  log(`holding — ${why}`);
};

const send = async (fix: LocationResult, why: string): Promise<void> => {
  if (inFlight) return;
  inFlight = true;

  const n = ++pingCount;
  const startedAt = Date.now();
  const payload = {
    truckId: target.truckId,
    shipmentId: target.shipmentId,
    latitude: fix.latitude,
    longitude: fix.longitude,
  };


  log(`#${n} → POST /drivers/gps/update  (${why})`, payload);

  try {
    const result = await updateDriverGps(payload);

    lastSent = {latitude: fix.latitude, longitude: fix.longitude, at: Date.now()};
    log(`#${n} ← ok in ${Date.now() - startedAt}ms`, {
      gpsPingId: result?.gpsPingId ?? null,
      message: result?.message ?? null,
      recordedAt: result?.recordedAt ?? null,
    });
  } catch (e) {
    const err = e as ErrorLike & {response?: {status?: number; data?: unknown}};
    log(`#${n} ✗ failed in ${Date.now() - startedAt}ms — retrying with the next fix`, {
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message ?? null,
    });
  } finally {
    inFlight = false;
  }
};

/** A fix off the watch. */
const onFix = (fix: LocationResult): void => {
  if (!wanted) return;
  const now = Date.now();
  const reported = fix?.accuracy;
  if (!isUsable(fix)) {
    logSkip(`fix unusable (accuracy ${Math.round(reported)}m)`, now);
    return;
  }
  const {send: go, why} = verdict(fix, now);
  if (!go) {
    logSkip(why, now);
    return;
  }
  send(fix, why);
};

const onHeartbeat = async (): Promise<void> => {
  if (!wanted || inFlight) return;

  const now = Date.now();
  const cached = getCachedLocation();
  if (isUsable(cached) && isFresh(cached, now)) {
    const {send: go, why} = verdict(cached, now);
    if (go) {
      await send(cached, `${why}, from the last-known fix`);
      return;
    }
    logSkip(why, now);
  }
  if (lastSent && now - lastSent.at < HEARTBEAT_MS) return;

  try {
    const fix = await getCurrentLocation({...QUIET, preferCacheMs: MIN_GAP_MS});
    if (!wanted) return;
    const reported = fix?.accuracy;
    if (!isUsable(fix)) {
      logSkip(
        `heartbeat fix unusable (accuracy ${Math.round(reported)}m)`,
        Date.now(),
      );
      return;
    }
    const at = Date.now();
    const {send: go, why} = verdict(fix, at);
    if (go) await send(fix, why);
    else logSkip(why, at);
  } catch (e) {
    const err = e as ErrorLike;
    log('heartbeat could not get a fix —', err?.message ?? err);
  }
};

/** Registers the watch, if the driver has granted location and one isn't up. */
const startWatch = async (): Promise<void> => {
  if (watchId !== null || starting) {
    await starting;
    return;
  }

  starting = (async () => {
    const {granted} = await checkAppPermission(APP_PERMISSION_TYPES.LOCATION);
    if (!granted) {
      log('location permission not granted — trace paused until it is');
      return;
    }
    try {
      const id = await watchCurrentLocation(
        onFix,
        (error: Error) =>
          log('location watch failed', (error as ErrorLike)?.message ?? error),
        {...QUIET, geoOptions: PING_GEO_OPTIONS},
      );
      // Signed out, or backgrounded, while the watch was being registered.
      if (!wanted || AppState.currentState !== 'active') {
        clearWatchLocation(id);
        return;
      }
      watchId = id;
    } catch (e) {
      const err = e as ErrorLike;
      log('could not start the watch', err?.message ?? err);
    }
  })();

  try {
    await starting;
  } finally {
    starting = null;
  }
};

const stopWatch = (): void => {
  if (watchId === null) return;
  clearWatchLocation(watchId);
  watchId = null;
};

const onAppStateChange = (state: AppStateStatus): void => {
  if (!wanted) return;
  if (state === 'active') {
    startWatch();
    // Back in the foreground after a gap the OS made — say where the truck is
    // now rather than waiting out the rest of the beat.
    onHeartbeat();
    return;
  }
  stopWatch();
};

/**
 * Starts the trace. Idempotent — calling it while it is already running only
 * re-points it, which is what a login on top of a live session does.
 *
 * @param ids optional override for the truck/shipment the trace is filed
 *   under; both default to the one hard-coded trip id.
 */
export const startGpsPings = (ids: Partial<PingTarget> = {}): void => {
  target = {...defaultTarget(), ...ids};

  if (wanted) return;
  wanted = true;
  log('trace on', {
    ...target,
    rule: `ping every ${seconds(HEARTBEAT_MS)}s or ${MIN_DISTANCE_M}m, never inside ${seconds(MIN_GAP_MS)}s`,
  });

  if (!appStateSub) {
    appStateSub = AppState.addEventListener('change', onAppStateChange);
  }
  if (!heartbeat) {
    heartbeat = setInterval(() => onHeartbeat(), HEARTBEAT_MS);
  }

  startWatch();
  // The first fix goes as soon as there is one, rather than a beat from now.
  onHeartbeat();
};

/**
 * Stops the trace and forgets where it got to, so the next driver to sign in
 * on this handset starts a trace of their own rather than one paced by the
 * last one's fixes.
 */
export const stopGpsPings = (): void => {
  if (!wanted) return;
  wanted = false;
  log(`trace off after ${pingCount} ping(s)`);

  stopWatch();
  if (heartbeat) {
    clearInterval(heartbeat);
    heartbeat = null;
  }
  if (appStateSub) {
    appStateSub.remove();
    appStateSub = null;
  }
  lastSent = null;
  lastSkipLogAt = 0;
  pingCount = 0;
  target = defaultTarget();
};

/** Whether a trace is running — signed in, whatever the watch is doing. */
export const isGpsPingRunning = (): boolean => wanted;
