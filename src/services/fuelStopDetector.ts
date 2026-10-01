import {useEffect, useRef} from 'react';
import {AppState} from 'react-native';

import {useLocation} from './LocationService';
import type {LocationResult} from '../types/location';
import type {Nullable} from '../types/common';
import {
  findNearestFuelStation,
  metresBetween,
  type NearestFuelStation,
} from './fuelPriceEntry';

/**
 * When a stop counts as "at a fuel pump". Tune these here — nothing else in
 * the detector hard-codes a number.
 */
export const FUEL_STOP_RULES = {
  /**
   * The nearest station must be at most this far from the driver. Wide enough
   * for a truck stop lot: HERE's coordinate is the building, and the diesel
   * islands can be a couple of hundred metres from it.
   */
  maxDistanceMeters: 3000,
  /** Slower than this, in miles per hour, is stopped. */
  maxSpeedMph: 2,
  /** Stopped for this long before the station search runs. */
  stoppedForMs: 60 * 1000,
  /** The same station is not asked about again for this long. */
  repromptAfterMs: 4 * 60 * 60 * 1000,
};

/** GPS reports speed in metres per second; the rules are in mph. */
const MPS_PER_MPH = 0.44704;

/**
 * Below this gap two fixes are too close together to derive a speed from:
 * a few metres of GPS jitter over one second reads as walking pace.
 */
const MIN_SPEED_SAMPLE_MS = 5000;

/**
 * Station id → when the driver was last asked about it. Module-level so it
 * outlives a remount of the Home screen; it resets when the app restarts.
 */
const lastPromptedAt = new Map<string, number>();

/**
 * Metres per second: the device's own reading when it has one (iOS reports -1
 * for "no reading"), otherwise derived from the previous fix. Undefined when
 * neither is usable.
 */
const speedOf = (
  fix: LocationResult,
  previous: Nullable<LocationResult>,
): number | undefined => {
  if (typeof fix.speed === 'number' && Number.isFinite(fix.speed) && fix.speed >= 0) {
    return fix.speed;
  }
  if (!previous) return undefined;
  const elapsedMs = fix.timestamp - previous.timestamp;
  if (!(elapsedMs >= MIN_SPEED_SAMPLE_MS)) return undefined;
  return metresBetween(previous, fix) / (elapsedMs / 1000);
};

interface FuelStopDetectorOptions {
  /** Watch location at all — e.g. only while the Home screen is focused. */
  enabled: boolean;
  /** Keep watching but do not prompt — e.g. while the sheet is already up. */
  paused?: boolean;
  onArrive: (station: NearestFuelStation, fix: LocationResult) => void;
}

/**
 * Notices the driver pulling in at a fuel station and calls `onArrive` once.
 *
 * A stop starts at the first fix slower than `maxSpeedMph` and ends at the
 * first faster one (`maxSpeedMph`). When a stop reaches `stoppedForMs`, one HERE place search
 * runs around the latest fix; if the nearest station is within
 * `maxDistanceMeters` and was not asked about in the last `repromptAfterMs`,
 * `onArrive` gets it. That is one search per stop, not one per GPS update.
 */
export function useFuelStopDetector({
  enabled,
  paused = false,
  onArrive,
}: FuelStopDetectorOptions): void {
  // Permission and GPS prompts belong to the location label, which asks first;
  // a second set of alerts from this watch would only repeat them.
  const {location} = useLocation({
    watch: enabled,
    fetchOnMount: false,
    skipGPSCheck: true,
    skipPermissionCheck: true,
  });

  const lastFixRef = useRef<Nullable<LocationResult>>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const onArriveRef = useRef(onArrive);
  onArriveRef.current = onArrive;

  const clearStop = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  // Leaving the screen ends any stop in progress.
  useEffect(() => {
    if (!enabled) {
      clearStop();
      lastFixRef.current = null;
    }
    return clearStop;
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !location) return;

    const previous = lastFixRef.current;
    lastFixRef.current = location;
    const speed = speedOf(location, previous);
    if (speed === undefined) return;

    if (speed >= FUEL_STOP_RULES.maxSpeedMph * MPS_PER_MPH) {
      clearStop();
      return;
    }
    // Already stopped — the running timer covers this fix too.
    if (timerRef.current) return;

    timerRef.current = setTimeout(async () => {
      const fix = lastFixRef.current;
      if (!fix || pausedRef.current || AppState.currentState !== 'active') {
        return;
      }

      const station = await findNearestFuelStation(fix).catch(() => null);
      if (
        !station ||
        station.distanceMeters > FUEL_STOP_RULES.maxDistanceMeters ||
        pausedRef.current ||
        // The driver drove off while the search was out.
        timerRef.current === null
      ) {
        return;
      }

      const key = station.id || station.name;
      const askedAt = lastPromptedAt.get(key);
      if (askedAt && Date.now() - askedAt < FUEL_STOP_RULES.repromptAfterMs) {
        return;
      }
      lastPromptedAt.set(key, Date.now());
      onArriveRef.current(station, fix);
    }, FUEL_STOP_RULES.stoppedForMs);
    // The timer is deliberately left set after it fires: this stop has had its
    // one search, and only moving off (clearStop) arms the next one.
  }, [enabled, location]);
}
