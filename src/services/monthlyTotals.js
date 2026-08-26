/**
 * The machinery the two monthly dashboard cards share.
 *
 * `get-monthly-miles` and `get-monthly-earnings` answer in the same shape — a
 * total, plus a list of the days that contributed to it — and feed the same
 * stat card on the same two screens. Only the field names and how the total is
 * printed differ, so the sorting, the sparkline, the month label and the hook
 * live here once; `monthlyMiles.js` and `monthlyEarnings.js` name the fields
 * and the formatting.
 *
 * Nothing here is meant to be imported by a screen — the two modules above are
 * the public face of these calls.
 */

import {useCallback, useEffect, useRef, useState} from 'react';

import {isNumber, MONTHS_LONG} from '../utils/format';

/** What a card shows in place of a figure it has not got. */
export const MISSING = '—';

/** The days in the order they happened, oldest first. */
const byDate = list =>
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
 * @param {object[]} days
 * @param {string} field the daily figure's key — `miles` or `earnings`
 * @returns {number[]}
 */
export const toChart = (days, field) => {
  const list = Array.isArray(days) ? days : [];
  const points = byDate(list)
    .map(day => (isNumber(day?.[field]) ? Number(day[field]) : null))
    .filter(value => value !== null);

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
 * @param {object[]} days
 * @param {Date} [now] injectable for tests
 * @returns {string}
 */
export const toRange = (days, now = new Date()) => {
  const list = Array.isArray(days) ? days : [];
  const dated = byDate(list)
    .map(day => /^(\d{4})-(\d{2})-\d{2}/.exec(String(day?.date ?? '')))
    .filter(Boolean);

  const last = dated[dated.length - 1];
  const month = last ? Number(last[2]) - 1 : now.getMonth();
  return MONTHS_LONG[month] ?? MONTHS_LONG[now.getMonth()];
};

/**
 * The hook both cards run: fetch on mount, keep the payload, and hand back a
 * `refresh` the screens call when the driver comes back to them.
 *
 * @param {() => Promise<object>} fetcher the driverApi getter
 * @param {string} message what to report if the call fails
 * @returns {{data: object|null, loading: boolean, error: string|null,
 *            refresh: () => Promise<object|null>}}
 */
export function useMonthlyTotal(fetcher, message) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const requestRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
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
    } catch (err) {
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
