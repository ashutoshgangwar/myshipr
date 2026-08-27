import {getMonthlyTrips} from '../config/driverApi';
import {group, isNumber} from '../utils/format';
import {MISSING, toRange, useMonthlyTotal} from './monthlyTotals';
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

/** The month the card is reporting — "August". */
export const toTripsRange = (
  dailyTrips: DailyRecord[] | null | undefined,
  now: Date = new Date(),
): string =>
  toRange(dailyTrips, now);

/**
 *
 * @param {object|null} trips the payload from `getMonthlyTrips`
 * @param {Date} [now] injectable for tests
 * @returns {{value: string, range: string}}
 */
export const toTripsCard = (
  trips: MonthlyTrips | null | undefined,
  now: Date = new Date(),
) => ({
  value: formatTotalTrips(trips?.totalTrips),
  range: toTripsRange(trips?.dailyTrips, now),
});

/**
 * Loads the driver's monthly trips and keeps the payload in state.
 *
 * @returns {{trips: object|null, loading: boolean, error: string|null,
 *            refresh: () => Promise<object|null>}}
 */
export function useMonthlyTrips() {
  const {data, ...rest} = useMonthlyTotal(getMonthlyTrips, ERROR);
  return {trips: data, ...rest};
}
