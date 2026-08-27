/**
 * Location fixes, the options that shape a request for one, and the copy shown
 * when the device refuses.
 *
 * Mirrors `services/LocationService` — every field below is one that module
 * reads or writes. Types only: this module emits no runtime code.
 */

import type {Coordinates, Nullable} from './common';

/**
 * A fix as the app stores and passes it around — `normalisePosition()`'s
 * output, not the raw `GeolocationPosition`.
 *
 * The four optional readings are `Nullable` rather than optional because the
 * normaliser writes an explicit `null` for each when the platform omits it.
 */
export interface LocationResult extends Coordinates {
  accuracy: number;
  altitude: Nullable<number>;
  speed: Nullable<number>;
  heading: Nullable<number>;
  timestamp: number;
}

/**
 * The failure modes `LOCATION_ERRORS` names. A rejected location call carries
 * one of these as its `Error.message`, which is how callers tell "GPS is off"
 * from "the user said no".
 */
export type LocationErrorCode =
  | 'GPS_DISABLED'
  | 'PERMISSION_DENIED'
  | 'MOCK_LOCATION_DETECTED'
  | 'LOCATION_UNAVAILABLE'
  | 'LOCATION_TIMEOUT';

/** The knobs `buildGeoOptions()` turns into a native options object. */
export interface GeoOptionsInput {
  highAccuracy: boolean;
  timeout: number;
  maximumAge: number;
}

/** The native options object itself. */
export interface GeoOptions {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
  showLocationDialog: boolean;
  forceRequestLocation: boolean;
}

/** Copy for one alert; every field falls back to a built-in default. */
export interface AlertStrings {
  title?: string;
  message?: string;
  cancel?: string;
  action?: string;
}

/** The two alerts a preflight check can raise, keyed by which check failed. */
export interface LocationAlertStrings {
  gps?: AlertStrings;
  permission?: AlertStrings;
}

/** Shared shape of the preflight toggles. */
export interface PreflightOptions {
  skipGPSCheck?: boolean;
  skipPermissionCheck?: boolean;
  alertStrings?: LocationAlertStrings;
}

/** Options for a one-shot `getCurrentLocation()` / `watchCurrentLocation()`. */
export interface GetCurrentLocationOptions extends PreflightOptions {
  geoOptions?: GeoOptions;
  detectMock?: boolean;
  /** Serve a cached fix younger than this many ms without touching GPS. */
  preferCacheMs?: number;
  acceptableAccuracyM?: number;
}

/** Options for the `useLocation()` hook. */
export interface UseLocationOptions extends GetCurrentLocationOptions {
  /** Track continuously instead of taking a single fix. */
  watch?: boolean;
  fetchOnMount?: boolean;
}

/** What `useLocation()` hands its component. */
export interface UseLocationResult {
  location: Nullable<LocationResult>;
  loading: boolean;
  /** The failure's `message` — the hook stores the string, not the Error. */
  error: Nullable<string>;
  isWatching: boolean;
  refresh: () => Promise<Nullable<LocationResult>>;
  start: () => void;
  stop: () => void;
}
