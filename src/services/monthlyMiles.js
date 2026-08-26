/**
 * The driver's miles for the current month — `GET /drivers/shipments/
 * get-monthly-miles` — and the mappers that turn its payload into the
 * "Monthly Miles" stat card.
 *
 * It lives here rather than in a screen folder because two screens draw the
 * same card from the same call: the Home dashboard and the Earnings screen.
 * Each still runs its own fetch, the way they each run their own upcoming
 * shipments call.
 *
 * ← { totalMiles: 158.17000000000002,
 *     dailyMiles: [{ miles: 158.17000000000002, date: "2026-08-21" }] }
 */

import {useCallback, useEffect, useRef, useState} from 'react';

import {getMonthlyMiles} from '../config/driverApi';
import {group, isNumber, MONTHS_LONG} from '../utils/format';

/** What the card shows in place of a figure it has not got. */
export const MISSING = '—';

/**
 * The total, printed as miles: 158.17000000000002 → "158.17", 20000 → "20,000".
 *
 * Rounded to two decimals rather than passed through the way per-load
 * distances are — this total is a sum of floats, so it arrives with the tail
 * of binary noise above, and "158.17000000000002" is not a figure to put on a
 * card. Trailing zeros are dropped, so a whole number stays whole.
 *
 * @param {number} value `totalMiles` as the backend sent it
 * @returns {string}
 */
export const formatTotalMiles = value => {
  if (!isNumber(value)) return MISSING;
  const miles = Number(value);
  const rounded = Math.round(Math.abs(miles) * 100) / 100;
  const whole = Math.trunc(rounded);
  const decimals = String(rounded).split('.')[1];
  return `${miles < 0 ? '-' : ''}${group(whole)}${decimals ? `.${decimals}` : ''}`;
};

/** The days in the order they were driven, oldest first. */
const byDate = list =>
  [...list].sort((a, b) => String(a?.date ?? '').localeCompare(String(b?.date ?? '')));

/**
 * `dailyMiles` → the numbers the sparkline plots.
 *
 * The backend only sends the days the driver actually drove, so this list can
 * come back with a single entry — and Sparkline needs two points to draw a
 * line. A lone day is therefore plotted from zero, which is what the month
 * did: it started at nothing and rose to that day's miles. An empty list
 * gives back an empty array, and the card draws no line at all.
 *
 * @param {object[]} dailyMiles
 * @returns {number[]}
 */
export const toMilesChart = dailyMiles => {
  const list = Array.isArray(dailyMiles) ? dailyMiles : [];
  const points = byDate(list)
    .map(day => (isNumber(day?.miles) ? Number(day.miles) : null))
    .filter(miles => miles !== null);

  if (!points.length) return [];
  return points.length === 1 ? [0, points[0]] : points;
};

/**
 * The month the card is reporting — "August".
 *
 * Read off the payload's own dates rather than the clock, so the label always
 * names the month the figure came from. The month is taken from the date
 * string's own characters: `new Date('2026-08-21')` is UTC midnight, which
 * reads as the previous day — and so, on the 1st, as the previous month — for
 * a driver west of Greenwich. With no dates to read, the current month stands.
 *
 * @param {object[]} dailyMiles
 * @param {Date} [now] injectable for tests
 * @returns {string}
 */
export const toMilesRange = (dailyMiles, now = new Date()) => {
  const list = Array.isArray(dailyMiles) ? dailyMiles : [];
  const dated = byDate(list)
    .map(day => /^(\d{4})-(\d{2})-\d{2}/.exec(String(day?.date ?? '')))
    .filter(Boolean);

  const last = dated[dated.length - 1];
  const month = last ? Number(last[2]) - 1 : now.getMonth();
  return MONTHS_LONG[month] ?? MONTHS_LONG[now.getMonth()];
};

/**
 * The whole payload → the three fields of the stat card that come from the
 * API. The icon, colour and label stay with the screen that draws the card.
 *
 * While the call is still out — `miles` null — the value shows `MISSING` and
 * the line is left empty, so the card keeps its shape and its heading instead
 * of shimmering or collapsing the row beside it.
 *
 * @param {object|null} miles the payload from `getMonthlyMiles`
 * @param {Date} [now] injectable for tests
 * @returns {{value: string, range: string, chart: number[]}}
 */
export const toMilesCard = (miles, now = new Date()) => ({
  value: formatTotalMiles(miles?.totalMiles),
  range: toMilesRange(miles?.dailyMiles, now),
  chart: toMilesChart(miles?.dailyMiles),
});

/**
 * Loads the driver's monthly miles and keeps the payload in state.
 *
 * @returns {{miles: object|null, loading: boolean, error: string|null,
 *            refresh: () => Promise<object|null>}}
 */
export function useMonthlyMiles() {
  const [miles, setMiles] = useState(null);
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
      const payload = await getMonthlyMiles();
      // A later refresh having already answered means this one is stale —
      // writing it would walk the card backwards.
      if (!mountedRef.current || requestId !== requestRef.current) return payload;
      setMiles(payload || null);
      return payload;
    } catch (err) {
      if (mountedRef.current && requestId === requestRef.current) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            'Could not load your monthly miles.',
        );
      }
      return null;
    } finally {
      if (mountedRef.current && requestId === requestRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {miles, loading, error, refresh};
}
