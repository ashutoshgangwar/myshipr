import {useCallback, useEffect, useRef, useState} from 'react';

import {isNumber, MONTHS_LONG} from '../utils/format';
import type {AsyncResource, ErrorLike} from '../types/common';
import type {AxiosError} from 'axios';
import type {ApiErrorBody} from '../types/api';

/**
 * One day of a monthly breakdown. The figure's key differs per endpoint
 * (`miles`, `earnings`, `trip`), so the shape is an index signature rather
 * than three near-identical interfaces — `toChart` is told which key to read.
 */
export type DailyRecord = Record<string, string | number | null | undefined>;

/** What a card shows in place of a figure it has not got. */
export const MISSING = '—';

/** The days in the order they happened, oldest first. */
const byDate = (list: DailyRecord[]): DailyRecord[] =>
  [...list].sort((a, b) =>
    String(a?.date ?? '').localeCompare(String(b?.date ?? '')),
  );

/**
 * A daily list → the numbers the sparkline plots.
 *
 * Both endpoints only send the days that carried something, so either list can
 * come back with a single entry — and Sparkline needs two points to draw a
 * line. A lone day is therefore plotted from zero, which is what the month
 * did: it started at nothing and rose to that day's figure. An empty list
 * gives back an empty array, and the card draws no line at all.
 *
 * @param days
 * @param field the daily figure's key — `miles` or `earnings`
 */
export const toChart = (
  days: DailyRecord[] | null | undefined,
  field: string,
): number[] => {
  const list = Array.isArray(days) ? days : [];
  const points = byDate(list)
    .map(day => (isNumber(day?.[field]) ? Number(day[field]) : null))
    // A type predicate, so `points` is `number[]` rather than
    // `(number | null)[]` — the runtime filter is unchanged.
    .filter((value): value is number => value !== null);

  if (!points.length) return [];
  return points.length === 1 ? [0, points[0]] : points;
};

/**
 * The month a card is reporting — "August".
 *
 * Read off the payload's own dates rather than the clock, so the label always
 * names the month the figure came from. The month is taken from the date
 * string's own characters: `new Date('2026-08-21')` is UTC midnight, which
 * reads as the previous day — and so, on the 1st, as the previous month — for
 * a driver west of Greenwich. With no dates to read, the current month stands.
 *
 * @param days
 * @param now injectable for tests
 */
export const toRange = (
  days: DailyRecord[] | null | undefined,
  now: Date = new Date(),
): string => {
  const list = Array.isArray(days) ? days : [];
  const dated = byDate(list)
    .map(day => /^(\d{4})-(\d{2})-\d{2}/.exec(String(day?.date ?? '')))
    .filter((match): match is RegExpExecArray => match !== null);

  const last = dated[dated.length - 1];
  const month = last ? Number(last[2]) - 1 : now.getMonth();
  return MONTHS_LONG[month] ?? MONTHS_LONG[now.getMonth()];
};

/**
 * The hook both cards run: fetch on mount, keep the payload, and hand back a
 * `refresh` the screens call when the driver comes back to them.
 *
 * Generic in the payload: every caller passes a different driverApi getter,
 * and `T` flows straight through to `data`, so a screen reading
 * `data.totalMiles` is checked against that endpoint's own model.
 *
 * @param fetcher the driverApi getter
 * @param message what to report if the call fails
 */
export function useMonthlyTotal<T>(
  fetcher: () => Promise<T>,
  message: string,
): AsyncResource<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const requestRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async (): Promise<T | null> => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setError(null);

    try {
      const payload = await fetcher();
      // A later refresh having already answered means this one is stale —
      // writing it would walk the card backwards.
      if (!mountedRef.current || requestId !== requestRef.current) return payload;
      setData(payload || null);
      return payload;
    } catch (e) {
      const err = e as AxiosError<ApiErrorBody> & ErrorLike;
      if (mountedRef.current && requestId === requestRef.current) {
        setError(err?.response?.data?.message || err?.message || message);
      }
      return null;
    } finally {
      if (mountedRef.current && requestId === requestRef.current) {
        setLoading(false);
      }
    }
  }, [fetcher, message]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {data, loading, error, refresh};
}
