/**
 * The driver's miles for the current month — `GET /drivers/shipments/
 * get-monthly-miles` — and the mappers that turn its payload into the
 * "Monthly Miles" stat card.
 *
 * It lives here rather than in a screen folder because two screens draw the
 * same card from the same call: the Home dashboard and the Earnings screen.
 * Both read it through `resourceCache` under one key, so whichever opens
 * second draws from what the first already fetched. The sorting, sparkline
 * and month label are shared with the earnings card and live in
 * `monthlyTotals.ts`.
 *
 * ← { totalMiles: 158.17000000000002,
 *     dailyMiles: [{ miles: 158.17000000000002, date: "2026-08-21" }] }
 */

import {getMonthlyMiles} from '../config/driverApi';
import {group, isNumber} from '../utils/format';
import {
  MISSING,
  toChart,
  toDelta,
  toRange,
  toWeekChart,
  useMonthlyTotal,
} from './monthlyTotals';
import type {DailyRecord} from './monthlyTotals';
import type {MonthlyMiles} from '../types/earnings';

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
export const formatTotalMiles = (value: number | string | null | undefined): string => {
  if (!isNumber(value)) return MISSING;
  const miles = Number(value);
  const rounded = Math.round(Math.abs(miles) * 100) / 100;
  const whole = Math.trunc(rounded);
  const decimals = String(rounded).split('.')[1];
  return `${miles < 0 ? '-' : ''}${group(whole)}${decimals ? `.${decimals}` : ''}`;
};

/**
 * The payload → the numbers the sparkline plots.
 *
 * `weeklyMiles` is what the endpoint sends now — one point per week of the
 * month, weeks without driving carrying `0` — so the line has the shape of
 * the card in the design: a point per week, flat where the month was quiet.
 * `dailyMiles`, the shape this endpoint used to send, is still read when no
 * weekly list arrives, so a backend that has not rolled the change out yet
 * keeps drawing its line rather than dropping to a blank card.
 */
export const toMilesChart = (miles: MonthlyMiles | null | undefined): number[] => {
  const weekly = miles?.weeklyMiles;
  if (Array.isArray(weekly) && weekly.length) return toWeekChart(weekly, 'miles');
  return toChart(miles?.dailyMiles, 'miles');
};

/**
 * The month the card is reporting — "August".
 *
 * Read off `dailyMiles`' own dates. The weekly payload carries week numbers
 * and no dates, so there is nothing in it to read a month from and the label
 * falls back to the current month — which is the month this endpoint reports
 * on anyway.
 */
export const toMilesRange = (
  dailyMiles: DailyRecord[] | null | undefined,
  now: Date = new Date(),
): string =>
  toRange(dailyMiles, now);

/**
 * The whole payload → the fields of the stat card that come from the API: the
 * value, the month, the sparkline and the delta pill. The icon, label and
 * colour stay with the screen that draws the card.
 *
 * While the call is still out — `miles` null — the value shows `MISSING`, the
 * line is left empty and the pill reads a neutral "0%", so the card keeps its
 * shape and its heading instead of shimmering or collapsing the row beside it.
 *
 * @param {object|null} miles the payload from `getMonthlyMiles`
 * @param {Date} [now] injectable for tests
 * @returns {{value: string, range: string, chart: number[], delta: string,
 *            deltaDirection: 'up'|'down'|'flat'}}
 */
export const toMilesCard = (
  miles: MonthlyMiles | null | undefined,
  now: Date = new Date(),
) => ({
  value: formatTotalMiles(miles?.totalMiles),
  range: toMilesRange(miles?.dailyMiles, now),
  chart: toMilesChart(miles),
  ...toDelta(miles?.percentChange),
});

/**
 * Loads the driver's monthly miles and keeps the payload in state.
 *
 * @returns {{miles: object|null, loading: boolean, error: string|null,
 *            refresh: () => Promise<object|null>}}
 */
export function useMonthlyMiles() {
  const {data, ...rest} = useMonthlyTotal('monthly-miles', getMonthlyMiles, ERROR);
  return {miles: data, ...rest};
}
