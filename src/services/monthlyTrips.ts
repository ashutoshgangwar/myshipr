import {getMonthlyTrips} from '../config/driverApi';
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
import type {MonthlyTrips} from '../types/earnings';

export {MISSING};

const ERROR = 'Could not load your monthly trips.';

/**
 * The total, as a count: 9 → "9", 1200 → "1,200".
 *
 * A trip count is whole by nature, so anything with a tail is rounded rather
 * than printed with decimals the card has no room for.
 *
 * @param {number} value `totalTrips` as the backend sent it
 * @returns {string}
 */
export const formatTotalTrips = (value: number | string | null | undefined): string => {
  if (!isNumber(value)) return MISSING;
  const trips = Math.round(Number(value));
  return `${trips < 0 ? '-' : ''}${group(Math.abs(trips))}`;
};

/**
 * The payload → the numbers the sparkline plots.
 *
 * `weeklyTrips` is what the endpoint sends now — one point per week of the
 * month, weeks without a trip in them carrying `0` — so the line has the
 * shape of the card in the design: a point per week, flat where the month was
 * quiet. Note the figure's key is `trip`, singular, in the weekly shape just
 * as it was in the daily one. `dailyTrips`, the shape this endpoint used to
 * send, is still read when no weekly list arrives, so a backend that has not
 * rolled the change out yet keeps drawing its line rather than dropping to a
 * blank card.
 */
export const toTripsChart = (
  trips: MonthlyTrips | null | undefined,
): number[] => {
  const weekly = trips?.weeklyTrips;
  if (Array.isArray(weekly) && weekly.length) return toWeekChart(weekly, 'trip');
  return toChart(trips?.dailyTrips, 'trip');
};

/**
 * The month the card is reporting — "August".
 *
 * Read off `dailyTrips`' own dates. The weekly payload carries week numbers
 * and no dates, so there is nothing in it to read a month from and the label
 * falls back to the current month — which is the month this endpoint reports
 * on anyway.
 */
export const toTripsRange = (
  dailyTrips: DailyRecord[] | null | undefined,
  now: Date = new Date(),
): string =>
  toRange(dailyTrips, now);

/**
 * The whole payload → the fields of the stat card that come from the API: the
 * value, the month, the sparkline and the delta pill. The icon, label and
 * colour stay with the screen that draws the card.
 *
 * While the call is still out — `trips` null — the value shows `MISSING`, the
 * line is left empty and the pill reads a neutral "0%", so the card keeps its
 * shape and its heading instead of shimmering or collapsing the row beside it.
 *
 * @param {object|null} trips the payload from `getMonthlyTrips`
 * @param {Date} [now] injectable for tests
 * @returns {{value: string, range: string, chart: number[], delta: string,
 *            deltaDirection: 'up'|'down'|'flat'}}
 */
export const toTripsCard = (
  trips: MonthlyTrips | null | undefined,
  now: Date = new Date(),
) => ({
  value: formatTotalTrips(trips?.totalTrips),
  range: toTripsRange(trips?.dailyTrips, now),
  chart: toTripsChart(trips),
  ...toDelta(trips?.percentChange),
});

/**
 * Loads the driver's monthly trips and keeps the payload in state.
 *
 * @returns {{trips: object|null, loading: boolean, error: string|null,
 *            refresh: () => Promise<object|null>}}
 */
export function useMonthlyTrips() {
  const {data, ...rest} = useMonthlyTotal('monthly-trips', getMonthlyTrips, ERROR);
  return {trips: data, ...rest};
}
