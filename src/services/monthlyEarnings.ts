/**
 * The driver's earnings for the current month — `GET /drivers/shipments/
 * get-monthly-earnings` — and the mappers that turn its payload into the
 * "Monthly Earnings" stat card.
 *
 * The miles card's twin: same payload shape, same two screens, and the
 * sorting, sparkline and month label shared from `monthlyTotals.js`. Only the
 * field names and the money formatting are its own.
 *
 * ← { totalEarnings: 3750,
 *     dailyEarnings: [{ earnings: 2500, date: "2026-08-21" },
 *                     { earnings: 1250, date: "2026-08-26" }] }
 */

import {getMonthlyEarnings} from '../config/driverApi';
import {formatMoney, isNumber} from '../utils/format';
import {
  MISSING,
  toChart,
  toDelta,
  toRange,
  toWeekChart,
  useMonthlyTotal,
} from './monthlyTotals';
import type {DailyRecord} from './monthlyTotals';
import type {MonthlyEarnings} from '../types/earnings';

export {MISSING};

const ERROR = 'Could not load your monthly earnings.';

/**
 * The total, as money: 3750 → "$3,750", 1244.5 → "$1,244.50".
 *
 * `formatMoney` is what every other payout figure in the app goes through, so
 * the card reads the same as the payouts in the transactions table under it.
 *
 * @param {number} value `totalEarnings` as the backend sent it
 * @returns {string}
 */
export const formatTotalEarnings = (value: number | string | null | undefined): string =>
  isNumber(value) ? formatMoney(value) : MISSING;

/**
 * The payload → the numbers the sparkline plots.
 *
 * `weeklyEarnings` is what the endpoint sends now — one point per week of the
 * month, weeks without earnings carrying `0` — so the line has the shape of
 * the card in the design: a point per week, flat where the month was quiet.
 * `dailyEarnings`, the shape this endpoint used to send, is still read when
 * no weekly list arrives, so a backend that has not rolled the change out yet
 * keeps drawing its line rather than dropping to a blank card.
 */
export const toEarningsChart = (
  earnings: MonthlyEarnings | null | undefined,
): number[] => {
  const weekly = earnings?.weeklyEarnings;
  if (Array.isArray(weekly) && weekly.length)
    return toWeekChart(weekly, 'earnings');
  return toChart(earnings?.dailyEarnings, 'earnings');
};

/**
 * The month the card is reporting — "August".
 *
 * Read off `dailyEarnings`' own dates. The weekly payload carries week
 * numbers and no dates, so there is nothing in it to read a month from and
 * the label falls back to the current month — which is the month this
 * endpoint reports on anyway.
 */
export const toEarningsRange = (
  dailyEarnings: DailyRecord[] | null | undefined,
  now: Date = new Date(),
): string =>
  toRange(dailyEarnings, now);

/**
 * The whole payload → the fields of the stat card that come from the API: the
 * value, the month, the sparkline and the delta pill. The icon, label and
 * colour stay with the screen that draws the card.
 *
 * While the call is still out — `earnings` null — the value shows `MISSING`,
 * the line is left empty and the pill reads a neutral "0%", so the card keeps
 * its shape and its heading instead of shimmering or collapsing the row
 * beside it.
 *
 * @param {object|null} earnings the payload from `getMonthlyEarnings`
 * @param {Date} [now] injectable for tests
 * @returns {{value: string, range: string, chart: number[], delta: string,
 *            deltaDirection: 'up'|'down'|'flat'}}
 */
export const toEarningsCard = (
  earnings: MonthlyEarnings | null | undefined,
  now: Date = new Date(),
) => ({
  value: formatTotalEarnings(earnings?.totalEarnings),
  range: toEarningsRange(earnings?.dailyEarnings, now),
  chart: toEarningsChart(earnings),
  ...toDelta(earnings?.percentChange),
});

/**
 * Loads the driver's monthly earnings and keeps the payload in state.
 *
 * @returns {{earnings: object|null, loading: boolean, error: string|null,
 *            refresh: () => Promise<object|null>}}
 */
export function useMonthlyEarnings() {
  const {data, ...rest} = useMonthlyTotal('monthly-earnings', getMonthlyEarnings, ERROR);
  return {earnings: data, ...rest};
}
