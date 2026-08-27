import {useCallback, useEffect, useState} from 'react';
import {AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type {FuelPricePayload, FuelPriceResult} from '../types/earnings';
import type {ErrorLike, Nullable} from '../types/common';
import type {AxiosError} from 'axios';
import type {ApiErrorBody} from '../types/api';

/** The module store's snapshot, shared by every subscriber. */
export interface FuelPriceState {
  /** The live answer, or null before the first one lands. */
  price: Nullable<FuelPriceResult>;
  /** The last good price, kept so a failed refresh does not blank the badge. */
  last: Nullable<FuelPriceResult>;
  loading: boolean;
  error: Nullable<string>;
}

/** What the DIESEL badge renders. */
export interface DieselBadgeView {
  value: string;
  message: Nullable<string>;
  stale: boolean;
  muted: boolean;
}


import {getFuelPrice} from '../config/driverApi';
import {isNumber} from '../utils/format';
import {getCachedLocation, getCurrentLocation} from './LocationService';

export const ZERO_PRICE = '$0.00/gal';

export const REFRESH_MS = 200000;

/** Shown when the call itself fell over — a network drop, a 500. */
const ERROR = 'Could not load the diesel price near you.';

/** Shown when no fix is available, so there is nothing to ask the API about. */
const NO_LOCATION = 'Turn on location to see the diesel price near you.';

/** Added to the reason when the chip is showing a price it kept, not a new one. */
const STALE_NOTE = 'Showing the last price we fetched.';

/** Where the last good price is kept, so a cold start opens on it. */
const CACHE_KEY = '@myshipr/last_fuel_price';

/**
 *
 * @param value `pricePerGallon` as the backend sent it
 */
export const formatPricePerGallon = (
  value: number | string | null | undefined,
): string => {
  if (!isNumber(value)) return ZERO_PRICE;
  const price = Number(value);
  if (price <= 0) return ZERO_PRICE;
  return `$${price.toFixed(2)}/gal`;
};

/**
 *
 */
const hasPrice = (
  price: Nullable<FuelPriceResult> | undefined,
): price is FuelPricePayload & {available: true} =>
  Boolean(price?.available) &&
  isNumber(price?.pricePerGallon) &&
  Number(price.pricePerGallon) > 0;

/**
 * The store's snapshot → what the badge renders.
 *
 */
export const toDieselBadge = ({
  price,
  last,
  error,
}: Partial<FuelPriceState> = {}): DieselBadgeView => {
  if (hasPrice(price)) {
    return {
      value: formatPricePerGallon(price.pricePerGallon),
      message: null,
      stale: Boolean(price.stale),
      muted: false,
    };
  }

  const reason = price?.message || error || null;

  if (hasPrice(last)) {
    return {
      value: formatPricePerGallon(last.pricePerGallon),
      message: reason ? `${reason}\n\n${STALE_NOTE}` : STALE_NOTE,
      stale: true,
      muted: false,
    };
  }

  return {value: ZERO_PRICE, message: reason, stale: false, muted: true};
};

/**
 *
 * @returns {Promise<{latitude: number, longitude: number}|null>}
 */
const resolveCoordinates = async () => {
  const cached = getCachedLocation();
  if (cached) {
    return {latitude: cached.latitude, longitude: cached.longitude};
  }

  try {
    const fix = await getCurrentLocation({
      skipGPSCheck: true,
      skipPermissionCheck: true,
      highAccuracy: false,
      preferCacheMs: 60000,
    });
    return fix ? {latitude: fix.latitude, longitude: fix.longitude} : null;
  } catch {
    return null;
  }
};

let state: FuelPriceState = {
  price: null,
  last: null,
  loading: true,
  error: null,
};

const listeners = new Set<(snapshot: FuelPriceState) => void>();
let timer: ReturnType<typeof setInterval> | null = null;
let appStateSub: {remove: () => void} | null = null;
let inFlight: Promise<Nullable<FuelPriceResult>> | null = null;
let hydrated = false;

const emit = (patch: Partial<FuelPriceState>): void => {
  state = {...state, ...patch};
  listeners.forEach(listener => listener(state));
};

/**
 *
 */
const rememberPrice = async (price: FuelPriceResult): Promise<void> => {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(price));
  } catch {
    // Not worth reporting: this is a convenience, not the source of truth.
  }
};

/**
 * Read that cache back, once per app run. A price fetched in the meantime
 * wins — this is only ever a starting point, never an overwrite.
 *
 * @returns {Promise<void>}
 */
const hydrateLastPrice = async () => {
  if (hydrated) return;
  hydrated = true;

  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    const cached = raw ? JSON.parse(raw) : null;
    if (hasPrice(cached) && !hasPrice(state.last)) emit({last: cached});
  } catch {
    // A missing or unreadable cache just means the first run shows $0.00/gal.
  }
};

/**
 * One fetch. Concurrent callers — the 20-second tick landing on top of a
 * screen's own refresh — share the request in flight rather than doubling it,
 * which also means the two badges can never disagree about the price.
 *
 */
const fetchPrice = (): Promise<Nullable<FuelPriceResult>> => {
  if (inFlight) return inFlight;

  emit({loading: true, error: null});

  inFlight = (async () => {
    try {
      const coordinates = await resolveCoordinates();

      // No fix, no call: the endpoint 400s on a missing coordinate, and a
      // driver who has not granted location is not an error to report.
      if (!coordinates) {
        const missing: FuelPriceResult = {
          available: false,
          message: NO_LOCATION,
        };
        emit({price: missing, loading: false});
        return missing;
      }

      const payload = await getFuelPrice(coordinates);

      // Only an answer carrying a price displaces the one being kept — a
      // refusal ("US states only") leaves the chip on the last figure.
      const fresh = hasPrice(payload);
      emit({price: payload || null, loading: false, ...(fresh && {last: payload})});
      if (fresh) rememberPrice(payload);

      return payload;
    } catch (e) {
      const err = e as AxiosError<ApiErrorBody> & ErrorLike;
      // `last` is untouched, so the price stays on screen; `toDieselBadge`
      // only falls back to $0.00/gal when there was never one to keep.
      emit({
        loading: false,
        error: err?.response?.data?.message || err?.message || ERROR,
      });
      return null;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
};

const startTimer = () => {
  if (timer === null) timer = setInterval(fetchPrice, REFRESH_MS);
};

const stopTimer = () => {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
};

/**
 * The poll runs while at least one badge is mounted and the app is in the
 * foreground. Backgrounded, it stops — a badge nobody is looking at has no
 * reason to keep calling — and coming back fetches at once, since the price on
 * screen is however old the backgrounded stretch was.
 */
const startPolling = () => {
  // Kicked off alongside the first fetch, not awaited: whichever lands first
  // fills the chip, and a fetched price always wins over a cached one.
  hydrateLastPrice();
  fetchPrice();
  startTimer();

  if (appStateSub) return;
  appStateSub = AppState.addEventListener('change', status => {
    if (status !== 'active') {
      stopTimer();
      return;
    }
    fetchPrice();
    startTimer();
  });
};

const stopPolling = () => {
  stopTimer();
  appStateSub?.remove();
  appStateSub = null;
};

/**
 * Re-ask for the price now, without subscribing to it.
 *
 * For the screens: Home re-fetches on every focus, because the pump price
 * moves through the day and the truck has usually moved too — but it has no
 * business re-rendering itself over the answer. The chip is subscribed and
 * will redraw on its own, so a screen that only wants to *trigger* the call
 * reaches for this rather than for the hook.
 *
 * @returns {Promise<object|null>}
 */
export const refreshFuelPrice = () => fetchPrice();

/**
 * A store snapshot → everything the hook hands back except `refresh`.
 *
 */
const toView = (snapshot: FuelPriceState) => {
  const badge = toDieselBadge(snapshot);

  return {
    price: snapshot.price,
    ...badge,
    loading: snapshot.loading,
    // What the badge actually shimmers on. Every tick sets `loading`, but
    // once there is a figure to hold, shimmering over it would take the price
    // off the chip for the sake of showing that it is being refreshed. So the
    // bone is only drawn while there is nothing to draw it over — the first
    // call of the app's life.
    pending: snapshot.loading && badge.muted,
    error: snapshot.error,
  };
};

/**
 * Would these two views draw the same chip?
 *
 * `price` and `loading` are left out on purpose. `price` is a fresh object on
 * every fetch, so comparing it would answer "different" every tick and defeat
 * the point; `loading` flips twice per tick by design. Neither is anything the
 * chip draws — `pending` is the flag it shimmers on, and that is compared.
 *
 * @param {object} a
 */
const sameView = (
  a: ReturnType<typeof toView>,
  b: ReturnType<typeof toView>,
): boolean =>
  a.value === b.value &&
  a.message === b.message &&
  a.stale === b.stale &&
  a.muted === b.muted &&
  a.pending === b.pending &&
  a.error === b.error;

/**
 * Loads the diesel price where the driver is and keeps it in state.
 *
 * The first badge to mount starts the 20-second poll and the last to unmount
 * stops it. `value` is the string the badge shows: the newest price, or the
 * last one that came back, or $0.00/gal if none ever has. `message` is why,
 * whenever the figure is not a fresh one, and `muted` marks the $0.00 stand-in
 * so the chip can print it as an absence rather than as a price. `pending` is
 * the one to hand the badge as `loading`.
 *
 * What comes back is the same object between price changes — the poll on its
 * own does not re-render the screen this is called from. The consequence is
 * that `price` and `loading` are sampled rather than live: they are whatever
 * they were at the last emit that actually changed the chip. Render on
 * `pending`, and read `price` for the payload behind a figure, not to watch
 * the call.
 *
 * @returns {{price: object|null, value: string, message: string|null,
 *            stale: boolean, loading: boolean, error: string|null,
 *            refresh: () => Promise<object|null>}}
 */
export function useFuelPrice() {
  const [view, setView] = useState(() => toView(state));

  useEffect(() => {
    // Every tick emits twice — once when the request goes out, once when it
    // lands — and a pump price is usually the same figure it was 20 seconds
    // ago. Both Home and Bidding call this hook at their top level, above one
    // long ScrollView, so setting state on each of those emits re-renders the
    // whole screen — chart, stat cards, the loads list — for a chip whose two
    // lines have not moved. That is what makes the screen twitch under the
    // poll. So the listener derives what the badge would draw and keeps the
    // object it already has whenever that comes out the same: the screen
    // re-renders when the price changes, not when it is checked.
    const listener = (snapshot: FuelPriceState): void => {
      const next = toView(snapshot);
      setView(current => (sameView(current, next) ? current : next));
    };

    listeners.add(listener);
    // A second badge mounting inherits whatever the first one has already
    // been told, rather than waiting out a tick with the initial state.
    listener(state);

    if (listeners.size === 1) startPolling();

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) stopPolling();
    };
  }, []);

  const refresh = useCallback(() => fetchPrice(), []);

  return {...view, refresh};
}
