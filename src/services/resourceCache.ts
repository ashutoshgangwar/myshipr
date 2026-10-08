import {useCallback, useEffect, useRef, useState} from 'react';

import type {AxiosError} from 'axios';
import type {ApiErrorBody} from '../types/api';
import type {ErrorLike} from '../types/common';

/**
 * How long each kind of answer stays good for. Set by how fast the figure
 * behind it can actually move, not by how fast a screen can ask.
 */
export const TTL = {
  /** Month-to-date totals — they move a few times a day at most. */
  MONTHLY: 5 * 60 * 1000,
  /** Shipment lists: a dispatcher can add a load mid-shift. */
  LIST: 60 * 1000,
  /**
   * One record read by id — a shipment's details, its payout, its contacts.
   * Near-static once the load is booked, and each is keyed by its own id, so
   * tapping back into the same row redraws out of the cache.
   */
  DETAIL: 2 * 60 * 1000,
  /** The trip being driven, whose ETA and stop states do move. */
  TRIP: 30 * 1000,
  /** Reward points, credited when the driver reports a price. */
  REWARD: 60 * 1000,
  /**
   * Hours of service. Driving minutes tick once a minute, so anything under
   * a minute re-reads a figure that has not changed; 20s keeps the bar and
   * the duty pill within a minute of the truth for one call every 20s
   * instead of the one-per-second this used to run at.
   */
  HOS: 20 * 1000,
} as const;

type Listener = () => void;

interface Entry {
  /** `undefined` until the first answer lands — distinct from a null payload. */
  value: unknown;
  fetchedAt: number;
  error: string | null;
  inFlight: Promise<unknown> | null;
  listeners: Set<Listener>;
}

const store = new Map<string, Entry>();

const entryOf = (key: string): Entry => {
  const existing = store.get(key);
  if (existing) return existing;

  const created: Entry = {
    value: undefined,
    fetchedAt: 0,
    error: null,
    inFlight: null,
    listeners: new Set(),
  };
  store.set(key, created);
  return created;
};

const emit = (entry: Entry): void => {
  entry.listeners.forEach(listener => listener());
};


const same = (a: unknown, b: unknown): boolean => {
  if (a === b) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
};

const messageOf = (e: unknown, fallback: string): string => {
  const err = e as AxiosError<ApiErrorBody> & ErrorLike;
  return err?.response?.data?.message || err?.message || fallback;
};

/** What the cache holds for `key`, or `undefined` if it has never answered. */
export const readResource = <T>(key: string): T | undefined =>
  store.get(key)?.value as T | undefined;

/** Whether `key`'s answer is still inside its TTL. */
export const isFresh = (key: string, ttl: number): boolean => {
  const entry = store.get(key);
  return (
    entry !== undefined &&
    entry.value !== undefined &&
    Date.now() - entry.fetchedAt < ttl
  );
};


export const invalidateResource = (key?: string): void => {
  const clear = (entry: Entry) => {
    entry.value = undefined;
    entry.fetchedAt = 0;
    entry.error = null;
    emit(entry);
  };

  if (key === undefined) {
    store.forEach(clear);
    return;
  }
  const entry = store.get(key);
  if (entry) clear(entry);
};

export const subscribeResource = (key: string, listener: Listener): (() => void) => {
  const entry = entryOf(key);
  entry.listeners.add(listener);
  return () => {
    entry.listeners.delete(listener);
  };
};

interface FetchOptions {
  /** Answers inside this window come from the cache. */
  ttl?: number;
  /** Go to the network even if the cached answer is still fresh. */
  force?: boolean;
  /** What to report if the call fails and the error has nowhere better to go. */
  message?: string;
}

/**
 * The one way anything in this module reaches the network.
 *
 * @returns the payload — the cached one when it is still fresh — or null if
 *          the call failed with nothing cached to fall back on.
 */
export function fetchResource<T>(
  key: string,
  fetcher: () => Promise<T>,
  {ttl = 0, force = false, message = 'Oops.'}: FetchOptions = {},
): Promise<T | null> {
  const entry = entryOf(key);

  // A call already out answers this one too. Two cards mounting together, or
  // a poll tick landing on a focus refresh, cost one request between them.
  if (entry.inFlight) return entry.inFlight as Promise<T | null>;

  if (!force && isFresh(key, ttl)) {
    return Promise.resolve(entry.value as T);
  }

  const request = fetcher()
    .then(payload => {
      entry.fetchedAt = Date.now();
      entry.error = null;
      // The point of the whole module: an unchanged answer keeps the object
      // the subscribers already hold, so their `setState` is a no-op and no
      // card repaints.
      if (!same(entry.value, payload)) entry.value = payload;
      emit(entry);
      return (entry.value ?? null) as T | null;
    })
    .catch(e => {
      entry.error = messageOf(e, message);
      // A dropped call leaves the last good payload where it is — the card
      // keeps its figures and the error goes to whoever is showing one.
      emit(entry);
      return null;
    })
    .finally(() => {
      entry.inFlight = null;
    });

  entry.inFlight = request;
  return request;
}

interface CachedResourceOptions {
  ttl: number;
  /** What to report if the call fails. */
  message: string;
  /** False parks the hook: no fetch, no subscription, `loading` false. */
  enabled?: boolean;
}

export interface RefreshOptions {
  /** Ignore the TTL. What a pull-to-refresh, or a write, wants. */
  force?: boolean;
  /** Leave `loading` and `error` alone — what a background poll wants. */
  silent?: boolean;
}

export interface CachedResource<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: (options?: RefreshOptions) => Promise<T | null>;
}

/**
 * A cached endpoint, as a hook.
 *
 * Mounting with a fresh answer already in the store draws it on the first
 * render with no call and no spinner. `refresh()` respects the TTL, so a
 * screen may call it on every focus without that meaning a request;
 * `refresh({force: true})` is the escape hatch for a read that has to be
 * current — straight after a write, or a deliberate pull-to-refresh.
 *
 * @param key what this endpoint+arguments are cached under; '' parks the hook
 * @param fetcher the driverApi getter
 */
export function useCachedResource<T>(
  key: string,
  fetcher: () => Promise<T>,
  {ttl, message, enabled = true}: CachedResourceOptions,
): CachedResource<T> {
  const active = enabled && Boolean(key);

  const [data, setData] = useState<T | null>(
    () => (active ? readResource<T>(key) ?? null : null),
  );
  const [loading, setLoading] = useState(
    () => active && readResource<T>(key) === undefined,
  );
  const [error, setError] = useState<string | null>(null);

  // The getter is usually a module-level import, but a caller closing over a
  // parameter would hand us a new one per render. Read through a ref so the
  // fetch identity — and with it the effect below — keys off `key` alone.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(
    async ({force = false, silent = false}: RefreshOptions = {}) => {
      if (!active) return null;

      // Nothing to show for a call that will not happen: an in-TTL read
      // returns what is already on screen without a spinner over it.
      const willFetch = force || !isFresh(key, ttl);
      if (willFetch && !silent) {
        setLoading(true);
        setError(null);
      }

      const payload = await fetchResource<T>(key, () => fetcherRef.current(), {
        ttl,
        force,
        message,
      });

      const failed = payload === null && store.get(key)?.error;
      if (willFetch && !silent) {
        setLoading(false);
        setError(failed ? String(failed) : null);
      }
      return payload;
    },
    [active, key, ttl, message],
  );

  useEffect(() => {
    if (!active) {
      setData(null);
      setLoading(false);
      return undefined;
    }

    // Whoever writes the key — this hook, a poll, or the same card on
    // another screen — every subscriber redraws from the one store.
    const unsubscribe = subscribeResource(key, () => {
      setData((readResource<T>(key) ?? null) as T | null);
    });

    setData((readResource<T>(key) ?? null) as T | null);
    refresh();

    return unsubscribe;
  }, [active, key, refresh]);

  return {data, loading, error, refresh};
}
