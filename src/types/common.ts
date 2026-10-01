/**
 * Small shapes shared across services, screens and components.
 *
 * Nothing here is API-specific — these are the primitives the rest of the type
 * files build on. Types only: this module emits no runtime code.
 */

/** A value the backend may legitimately send as `null`. */
export type Nullable<T> = T | null;

/** A value that may be absent entirely (missing key, unset param). */
export type Maybe<T> = T | null | undefined;

/**
 * A calendar day as the driver API sends and accepts it: `YYYY-MM-DD`.
 * An alias rather than an interface — it documents the format at every call
 * site without pretending to validate it.
 */
export type DateString = string;

/** An ISO-8601 instant, e.g. `resetAvailableAt` on the HOS card. */
export type IsoDateTimeString = string;

/** A WGS-84 position in the naming the app's location code uses. */
export type Coordinates = {
  latitude: number;
  longitude: number;
};

/**
 * The HERE SDK's own naming for the same thing. Route geometry, map markers
 * and camera calls all speak `lat`/`lng`, while the app's location services
 * speak `latitude`/`longitude` — keeping both named types stops the two from
 * being passed to each other by accident.
 */
export type LatLng = {
  lat: number;
  lng: number;
};

/**
 * A place the user picked or the app resolved — what `normalizeLocation()` in
 * `utils/here/mapHelpers` returns. `description` is always a string (it falls
 * back to `''`), never undefined, so screens can render it unguarded.
 */
export type MapLocation = Coordinates & {
  description: string;
};

/**
 * What every data-loading hook in `services/` hands its screen.
 *
 * `error` is the ready-to-display message, not the thrown object — the
 * services turn failures into copy before they reach a screen.
 */
export interface AsyncState<T> {
  data: Nullable<T>;
  loading: boolean;
  error: Nullable<string>;
}

/** An `AsyncState` plus the pull-to-refresh handler the hooks expose. */
export interface AsyncResource<T> extends AsyncState<T> {
  refresh: () => Promise<Nullable<T>>;
}

/**
 * The result of a synchronous form check, as a discriminated union: a passing
 * check carries no copy, and a failing one always carries both halves. Written
 * as a `type` rather than an `interface` precisely so `ok` can narrow — after
 * `if (!result.ok)`, `result.message` is a `string`, not `string | undefined`.
 *
 * This is the exact shape `validateLogin()` and `validateNewPassword()`
 * already return.
 */
export type ValidationResult =
  | {ok: true}
  | {ok: false; title: string; message: string};

/**
 * A caught value, narrowed just enough to read the fields the app's error
 * handling actually touches.
 *
 * Under `strict`, a `catch (e)` binding is `unknown`, so `e.message` will not
 * compile. Casting to this — `const err = e as ErrorLike` — keeps the existing
 * `err.message || 'fallback'` logic byte-for-byte identical, whereas an
 * `e instanceof Error` check would quietly stop reading `message` off the
 * plain objects some native modules reject with.
 */
export interface ErrorLike {
  message?: string;
  name?: string;
  code?: string | number;
}

/** A `{label, value}` pair — the dropdown/option shape used by the forms. */
export interface Option<T = string> {
  label: string;
  value: T;
}

/** A label/value row as the detail screens render them. */
export interface DetailRow {
  label: string;
  value: string;
  sub?: Nullable<string>;
  /** Colours the value — 'success' renders it green. */
  tone?: 'success';
}
