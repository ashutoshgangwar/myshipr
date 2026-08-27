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
import {MISSING, toChart, toRange, useMonthlyTotal} from './monthlyTotals';
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

/** `dailyEarnings` → the numbers the sparkline plots. */
export const toEarningsChart = (dailyEarnings: DailyRecord[] | null | undefined): number[] =>
  toChart(dailyEarnings, 'earnings');

/** The month the card is reporting — "August". */
export const toEarningsRange = (
  dailyEarnings: DailyRecord[] | null | undefined,
  now: Date = new Date(),
): string =>
  toRange(dailyEarnings, now);

/**
 * The whole payload → the three fields of the stat card that come from the
 * API. The icon, label, colour and delta pill stay with the screen that draws
 * the card.
 *
 * While the call is still out — `earnings` null — the value shows `MISSING`
 * and the line is left empty, so the card keeps its shape and its heading
 * instead of shimmering or collapsing the row beside it.
 *
 * @param {object|null} earnings the payload from `getMonthlyEarnings`
 * @param {Date} [now] injectable for tests
 * @returns {{value: string, range: string, chart: number[]}}
 */
export const toEarningsCard = (
  earnings: MonthlyEarnings | null | undefined,
  now: Date = new Date(),
) => ({
  value: formatTotalEarnings(earnings?.totalEarnings),
  range: toEarningsRange(earnings?.dailyEarnings, now),
  chart: toEarningsChart(earnings?.dailyEarnings),
});

/**
 * Loads the driver's monthly earnings and keeps the payload in state.
 *
 * @returns {{earnings: object|null, loading: boolean, error: string|null,
 *            refresh: () => Promise<object|null>}}
 */
export function useMonthlyEarnings() {
  const {data, ...rest} = useMonthlyTotal(getMonthlyEarnings, ERROR);
  return {earnings: data, ...rest};
}
