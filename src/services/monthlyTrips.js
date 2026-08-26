import {getMonthlyTrips} from '../config/driverApi';
import {group, isNumber} from '../utils/format';
import {MISSING, toRange, useMonthlyTotal} from './monthlyTotals';

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
export const formatTotalTrips = value => {
  if (!isNumber(value)) return MISSING;
  const trips = Math.round(Number(value));
  return `${trips < 0 ? '-' : ''}${group(Math.abs(trips))}`;
};

/** The month the card is reporting — "August". */
export const toTripsRange = (dailyTrips, now = new Date()) =>
  toRange(dailyTrips, now);

/**
 * The whole payload → the two fields of the stat card that come from the API.
 * The icon, label, colour, sparkline and delta pill stay with the screen that
 * draws the card.
 *
 * While the call is still out — `trips` null — the value shows `MISSING`, so
 * the card keeps its shape and its heading instead of shimmering or
 * collapsing the row beside it.
 *
 * @param {object|null} trips the payload from `getMonthlyTrips`
 * @param {Date} [now] injectable for tests
 * @returns {{value: string, range: string}}
 */
export const toTripsCard = (trips, now = new Date()) => ({
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
