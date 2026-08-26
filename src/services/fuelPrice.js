/**
 * The diesel price behind the DIESEL badge in the dashboard header.
 *
 * The endpoint is coordinate-driven and US-only: it resolves the pair to a
 * state and answers 400 anywhere else. So this module has two jobs — find a
 * coordinate without nagging the driver for a permission the map screens
 * already own, and turn whichever answer comes back (a price, a refusal, no
 * fix at all) into the one short string the badge has room for.
 *
 * The price is polled every 20 seconds, and the poll lives here at module
 * level rather than inside the hook: Home and Bidding are both bottom tabs, so
 * once the driver has visited each, both badges are mounted at once. One
 * shared poll means the endpoint is called every 20 seconds, not every 20
 * seconds per badge, and both chips show the same figure.
 *
 * The badge never goes blank: the last price that came back is kept — in
 * memory and on disk, so it survives a cold start — and stays on the chip
 * until a newer one replaces it. Only a driver who has never once had a price
 * sees $0.00/gal.
 */
import {useCallback, useEffect, useState} from 'react';
import {AppState} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {getFuelPrice} from '../config/driverApi';
import {isNumber} from '../utils/format';
import {getCachedLocation, getCurrentLocation} from './LocationService';

/**
 * What the badge shows before it has ever had a price — a first run outside
 * the US, or one where the driver has never granted location.
 */
export const ZERO_PRICE = '$0.00/gal';

/**
 * How often the badge re-asks for the price. A pump price does not move this
 * fast, but the truck does — 20 seconds of driving is a different stretch of
 * road, and on a state line a different price entirely.
 */
export const REFRESH_MS = 2000;

/** Shown when the call itself fell over — a network drop, a 500. */
const ERROR = 'Could not load the diesel price near you.';

/** Shown when no fix is available, so there is nothing to ask the API about. */
const NO_LOCATION = 'Turn on location to see the diesel price near you.';

/** Added to the reason when the chip is showing a price it kept, not a new one. */
const STALE_NOTE = 'Showing the last price we fetched.';

/** Where the last good price is kept, so a cold start opens on it. */
const CACHE_KEY = '@myshipr/last_fuel_price';

/**
 * 3.891 → "$3.89/gal". Always two decimals — a pump price reads wrong at
 * "$4/gal" — and anything at or below zero is no price at all, so it falls
 * back to N/A rather than printing "$0.00/gal".
 *
 * @param {number} value `pricePerGallon` as the backend sent it
 * @returns {string}
 */
export const formatPricePerGallon = value => {
  if (!isNumber(value)) return ZERO_PRICE;
  const price = Number(value);
  if (price <= 0) return ZERO_PRICE;
  return `$${price.toFixed(2)}/gal`;
};

/**
 * Did this payload actually carry a price? A refusal (`available: false`) and
 * a payload whose `pricePerGallon` came back null both answer no — and neither
 * is allowed to displace the price already on the chip.
 *
 * @param {object|null} price
 * @returns {boolean}
 */
const hasPrice = price =>
  Boolean(price?.available) &&
  isNumber(price?.pricePerGallon) &&
  Number(price.pricePerGallon) > 0;

/**
 * The store's snapshot → what the badge renders.
 *
 * Three cases, in order: a price just came back; it did not, but an older one
 * did and is kept on the chip; or none ever has, which is the only time
 * $0.00/gal shows. Either way the reason — the backend's own sentence, "Fuel
 * price is available for US states only (got IND)" — is carried as `message`,
 * which the badge offers on tap rather than truncating into its two lines.
 *
 * @param {{price?: object|null, last?: object|null, error?: string|null}} snapshot
 * @returns {{value: string, message: string|null, stale: boolean,
 *            muted: boolean}}
 */
export const toDieselBadge = ({price, last, error} = {}) => {
  if (hasPrice(price)) {
    return {
      value: formatPricePerGallon(price.pricePerGallon),
      message: null,
      stale: Boolean(price.stale),
      muted: false,
    };
  }

  const reason = price?.message || error || null;

  // A price the driver has already seen beats no price at all, so the chip
  // holds on to it. The note says so on tap, or the last figure would read as
  // the price here rather than the price where they last had one.
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
 * Best-effort coordinate for the request. Both params are required by the
 * endpoint, so no fix means no call — but this never alerts, never asks for a
 * permission the driver has not already given, and never throws. The map and
 * the route card own those prompts; a header badge does not get to interrupt.
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
  } catch (_) {
    return null;
  }
};

/* ------------------------------------------------------------------ *
 * The shared store: one price, one poll, however many badges are up.
 * ------------------------------------------------------------------ */

// `price` is the latest answer, whatever it was; `last` is the latest answer
// that actually carried a price, and is what the chip shows when the newest
// one did not. `loading` starts true because the first fetch is kicked off by
// the first badge to mount — a chip that flashed $0.00/gal before ever asking
// would read as "diesel is free here".
let state = {price: null, last: null, loading: true, error: null};

const listeners = new Set();
let timer = null;
let appStateSub = null;
let inFlight = null;
let hydrated = false;

const emit = patch => {
  state = {...state, ...patch};
  listeners.forEach(listener => listener(state));
};

/**
 * Keep the last good price on disk, so a cold start opens on the figure the
 * driver last saw instead of $0.00/gal while the first call is in flight. A
 * write that fails costs nothing — the price is in memory either way.
 *
 * @param {object} price
 */
const rememberPrice = async price => {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(price));
  } catch (_) {
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
  } catch (_) {
    // A missing or unreadable cache just means the first run shows $0.00/gal.
  }
};

/**
 * One fetch. Concurrent callers — the 20-second tick landing on top of a
 * screen's own refresh — share the request in flight rather than doubling it,
 * which also means the two badges can never disagree about the price.
 *
 * @returns {Promise<object|null>}
 */
const fetchPrice = () => {
  if (inFlight) return inFlight;

  emit({loading: true, error: null});

  inFlight = (async () => {
    try {
      const coordinates = await resolveCoordinates();

      // No fix, no call: the endpoint 400s on a missing coordinate, and a
      // driver who has not granted location is not an error to report.
      if (!coordinates) {
        const missing = {available: false, message: NO_LOCATION};
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
    } catch (err) {
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
 * Loads the diesel price where the driver is and keeps it in state.
 *
 * The first badge to mount starts the 20-second poll and the last to unmount
 * stops it. `value` is the string the badge shows: the newest price, or the
 * last one that came back, or $0.00/gal if none ever has. `message` is why,
 * whenever the figure is not a fresh one, and `muted` marks the $0.00 stand-in
 * so the chip can print it as an absence rather than as a price. `pending` is
 * the one to hand the badge as `loading` — see below.
 *
 * @returns {{price: object|null, value: string, message: string|null,
 *            stale: boolean, loading: boolean, error: string|null,
 *            refresh: () => Promise<object|null>}}
 */
export function useFuelPrice() {
  const [snapshot, setSnapshot] = useState(state);

  useEffect(() => {
    listeners.add(setSnapshot);
    // A second badge mounting inherits whatever the first one has already
    // been told, rather than waiting out a tick with the initial state.
    setSnapshot(state);

    if (listeners.size === 1) startPolling();

    return () => {
      listeners.delete(setSnapshot);
      if (listeners.size === 0) stopPolling();
    };
  }, []);

  const refresh = useCallback(() => fetchPrice(), []);

  const badge = toDieselBadge(snapshot);

  return {
    price: snapshot.price,
    ...badge,
    loading: snapshot.loading,
    // What the badge actually shimmers on. Every 20-second tick sets
    // `loading`, but once there is a figure to hold, shimmering over it would
    // take the price off the chip twice a minute for the sake of showing that
    // it is being refreshed. So the bone is only drawn while there is nothing
    // to draw it over — the first call of the app's life.
    pending: snapshot.loading && badge.muted,
    error: snapshot.error,
    refresh,
  };
}
