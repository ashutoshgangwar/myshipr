/**
 * The driver's miles for the current month — `GET /drivers/shipments/
 * get-monthly-miles` — and the mappers that turn its payload into the
 * "Monthly Miles" stat card.
 *
 * It lives here rather than in a screen folder because two screens draw the
 * same card from the same call: the Home dashboard and the Earnings screen.
 * Each still runs its own fetch, the way they each run their own upcoming
 * shipments call. The sorting, sparkline and month label are shared with the
 * earnings card and live in `monthlyTotals.js`.
 *
 * ← { totalMiles: 158.17000000000002,
 *     dailyMiles: [{ miles: 158.17000000000002, date: "2026-08-21" }] }
 */

import {getMonthlyMiles} from '../config/driverApi';
import {group, isNumber} from '../utils/format';
import {MISSING, toChart, toRange, useMonthlyTotal} from './monthlyTotals';

export {MISSING};

const ERROR = 'Could not load your monthly miles.';

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

/** `dailyMiles` → the numbers the sparkline plots. */
export const toMilesChart = dailyMiles => toChart(dailyMiles, 'miles');

/** The month the card is reporting — "August". */
export const toMilesRange = (dailyMiles, now = new Date()) =>
  toRange(dailyMiles, now);

/**
 * The whole payload → the three fields of the stat card that come from the
 * API. The icon, label, colour and delta pill stay with the screen that draws
 * the card.
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
  const {data, ...rest} = useMonthlyTotal(getMonthlyMiles, ERROR);
  return {miles: data, ...rest};
}
