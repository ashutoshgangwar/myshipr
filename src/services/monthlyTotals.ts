import {isNumber, MONTHS_LONG} from '../utils/format';
import {TTL, useCachedResource} from './resourceCache';
import type {CachedResource} from './resourceCache';

/**
 * One entry of a monthly breakdown — a day for most endpoints, a week for
 * miles. The figure's key differs per endpoint (`miles`, `earnings`, `trip`),
 * so the shape is an index signature rather than four near-identical
 * interfaces — `toChart`/`toWeekChart` are told which key to read.
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
 * A weekly list → the numbers the sparkline plots.
 *
 * The weekly shape differs from the daily one in two ways that matter here.
 * It is ordered by `week` — a 1-based number, so it sorts numerically rather
 * than as a string — and it is dense: the backend sends every week of the
 * month, carrying `0` for the ones with no driving in them. Those zeros are
 * kept, since a flat stretch is what the month actually did; Sparkline's own
 * `max - min || 1` keeps an all-zero month from dividing by nothing.
 *
 * @param weeks
 * @param field the weekly figure's key — `miles`
 */
export const toWeekChart = (
  weeks: DailyRecord[] | null | undefined,
  field: string,
): number[] => {
  const list = Array.isArray(weeks) ? weeks : [];
  const points = [...list]
    .sort((a, b) => Number(a?.week ?? 0) - Number(b?.week ?? 0))
    .map(week => (isNumber(week?.[field]) ? Number(week[field]) : null))
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
 * A month-over-month change → the delta pill's text and which way it points.
 *
 * The pill carries the direction in its arrow and its colour, so the text is
 * the magnitude alone: -8.9 reads "8.9%" pointing down in red, not "-8.9%".
 * A rise is green with an up arrow. The figure is rounded to a single decimal
 * and trailing zeros are dropped, so a whole percentage stays whole — 20 is
 * "20%", not "20.0%".
 *
 * A change of nothing gets neither: a neutral pill reading "0%" with no arrow
 * beside it, since a month that held steady did not go either way. That is
 * also what a null change becomes — what the endpoint sends in a driver's
 * first month, with no previous month to measure against — so the card keeps
 * the shape it has in the design rather than blanking the pill.
 *
 * @param change the percentage as the backend sent it, already a percentage
 */
export const toDelta = (
  change: number | string | null | undefined,
): {delta: string; deltaDirection: 'up' | 'down' | 'flat'} => {
  if (!isNumber(change)) return {delta: '0%', deltaDirection: 'flat'};

  const percent = Number(change);
  // Rounded before the direction is read, so a change too small to print —
  // 0.04, which shows as "0%" — is called flat rather than drawn with an
  // arrow the figure beside it does not support.
  const rounded = Math.round(Math.abs(percent) * 10) / 10;
  if (!rounded) return {delta: '0%', deltaDirection: 'flat'};

  return {delta: `${rounded}%`, deltaDirection: percent > 0 ? 'up' : 'down'};
};

/**
 * The hook both cards run: read the month's total from the shared cache,
 * fetching it only when what is cached has gone stale.
 *
 * These figures are month-to-date sums — they move a handful of times a day,
 * and never between one screen and the next — so `TTL.MONTHLY` answers a
 * remount, a return to Home, or the Earnings screen asking for the same card
 * out of what Home already fetched, without a call. `refresh({force: true})`
 * is there for a read that has to be current.
 *
 * Generic in the payload: every caller passes a different driverApi getter,
 * and `T` flows straight through to `data`, so a screen reading
 * `data.totalMiles` is checked against that endpoint's own model.
 *
 * @param key what to cache this endpoint's answer under
 * @param fetcher the driverApi getter
 * @param message what to report if the call fails
 */
export function useMonthlyTotal<T>(
  key: string,
  fetcher: () => Promise<T>,
  message: string,
): CachedResource<T> {
  return useCachedResource<T>(key, fetcher, {ttl: TTL.MONTHLY, message});
}
