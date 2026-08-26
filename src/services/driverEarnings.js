/**
 * The driver's earnings ledger — `GET /drivers/earnings?period=…` — and the
 * mappers that turn its payload into the Earnings screen: the gross figure in
 * the blue header and the transactions table under it.
 *
 * The period dropdown IS this call's one parameter, so the period lives here
 * rather than in the screen: `PERIODS` is what the menu lists, and the hook
 * refetches whenever the driver picks another one.
 *
 * Same rule as the shipment mappers: every helper tolerates a missing field.
 * `payout` and `paymentStatus` come back null on a load the back office has
 * not settled yet, and those rows still list.
 *
 * ← { period: "ALL", grossEarnings: 0,
 *     shipments: [{ shipmentId, awb, shipmentType, distanceMiles, date,
 *                   payout, paymentStatus,
 *                   stops: [{sequence, type, address, from, to, …}] }] }
 */

import {useMemo} from 'react';

import {getDriverEarnings} from '../config/driverApi';
import {formatMiles, formatMoney, isNumber, MONTHS_LONG} from '../utils/format';
import {useMonthlyTotal} from './monthlyTotals';
import {loadType, orderedStops, toStopList} from './upcomingShipments';

/** What a cell shows in place of a figure the backend did not send. */
export const MISSING = '—';

const ERROR = 'Could not load your earnings.';

/**
 * The dropdown, in the order it lists: the label the driver reads and the
 * `period` value the backend takes. ALL leads, the way the endpoint's own
 * default does.
 */
export const PERIODS = [
  {label: 'All', value: 'ALL'},
  {label: 'Weekly', value: 'WEEKLY'},
  {label: 'Monthly', value: 'MONTHLY'},
  {label: 'Yearly', value: 'YEARLY'},
];

export const DEFAULT_PERIOD = PERIODS[0].value;

const pad = n => String(n).padStart(2, '0');

/**
 * The paid/unpaid pill's text. The backend's own vocabulary is screaming
 * snake case; the table's pills are the three the design names, so those are
 * spelled exactly as its `STATUS_COLOR` map keys them and anything else is
 * title-cased rather than shown raw.
 *
 * A null status is a load the back office has not settled — "Pending" says
 * that, where an ellipsis in a filled pill reads as a broken chip.
 */
const STATUS_LABEL = {
  PAID: 'Paid',
  IN_TRANSIT: 'In - Transit',
  INTRANSIT: 'In - Transit',
  CANCELLED: 'Cancelled',
  CANCELED: 'Cancelled',
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  UNPAID: 'Unpaid',
};

export const statusLabel = value => {
  const text = String(value ?? '').trim();
  if (!text) return 'Pending';

  const known = STATUS_LABEL[text.toUpperCase().replace(/[\s-]+/g, '_')];
  if (known) return known;

  return text
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * "2026-08-12" → "12 AUGUST 2026". Read off the string's own characters, not
 * a `Date`: `new Date('2026-08-12')` is UTC midnight, which reads as the 11th
 * for a driver west of Greenwich. Anything not ISO passes through as sent.
 */
export const formatRowDate = value => {
  if (!value) return '';
  const text = String(value).trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (!iso) return text;
  const month = MONTHS_LONG[Number(iso[2]) - 1];
  return month ? `${iso[3]} ${month.toUpperCase()} ${iso[1]}` : text;
};

/** 52.28 → "52.28 MILES", exactly as the backend sent it. */
const milesLabel = value =>
  isNumber(value) ? formatMiles(value, 'MILES').toUpperCase() : MISSING;

/** The "YYYY-MM-DD" head of the date a shipment carries, or ''. */
const rowDate = shipment => {
  const first = orderedStops(shipment)[0];
  const iso = /^(\d{4}-\d{2}-\d{2})/.exec(
    String(shipment?.date ?? first?.date ?? '').trim(),
  );
  return iso ? iso[1] : '';
};

/**
 * The payload's `shipments` → the rows the transactions table renders.
 *
 * Newest first: this is a ledger, so the load the driver was last paid for
 * belongs at the top. Undated loads sort last — they carry nothing to place
 * them by, and burying them keeps the run of dates readable.
 *
 * The field names are the ones `paymentFromTransaction` reads, so tapping a
 * row still opens the payout breakdown with the load's own details in it.
 *
 * @param {object|object[]|null} earnings the payload, or its `shipments` list
 * @returns {object[]} rows in the shape the table's renderItem expects
 */
export const toEarningsRows = earnings => {
  const list = Array.isArray(earnings)
    ? earnings
    : Array.isArray(earnings?.shipments)
    ? earnings.shipments
    : [];

  return list
    .map((shipment, index) => {
      const date = rowDate(shipment);

      return {
        id: String(
          shipment?.shipmentId ?? shipment?.tripId ?? shipment?.awb ?? index,
        ),
        date,
        awb: shipment?.awb || MISSING,
        // Left null when absent: the row hides the badge entirely rather than
        // drawing an empty chip.
        type: loadType(shipment?.shipmentType ?? shipment?.type),
        stops: toStopList(orderedStops(shipment)),
        miles: milesLabel(shipment?.distanceMiles ?? shipment?.totalMiles),
        when: formatRowDate(date),
        amount: isNumber(shipment?.payout)
          ? formatMoney(shipment.payout)
          : MISSING,
        status: statusLabel(shipment?.paymentStatus),
      };
    })
    .sort((a, b) => {
      const left = a.date || '0000-00-00';
      const right = b.date || '0000-00-00';
      return left > right ? -1 : left < right ? 1 : 0;
    });
};

/**
 * The week `now` falls in, Monday to Sunday, as "24 Aug – 30 Aug".
 *
 * The response reports a gross and a list of loads, not the window it filtered
 * by, so the header's date line is worked out from the calendar here. Monday
 * is the week's start because that is how a driver's settlement week runs.
 */
const weekRange = now => {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // getDay() is Sunday-first; Sunday belongs to the week that began 6 days ago.
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const label = date =>
    `${pad(date.getDate())} ${MONTHS_LONG[date.getMonth()].slice(0, 3)}`;
  return `${label(start)} – ${label(end)}`;
};

/**
 * The header copy for a period — the date line under "EARNINGS" and the label
 * under the gross figure.
 *
 * @param {string} period one of `PERIODS`' values
 * @param {Date} [now] injectable for tests
 * @returns {{range: string, grossLabel: string}}
 */
export const toPeriodCopy = (period, now = new Date()) => {
  switch (String(period ?? '').toUpperCase()) {
    case 'WEEKLY':
      return {
        range: weekRange(now),
        grossLabel: 'Gross earning this Week',
      };
    case 'MONTHLY':
      return {
        range: `${MONTHS_LONG[now.getMonth()]} ${now.getFullYear()}`,
        grossLabel: 'Gross earning this Month',
      };
    case 'YEARLY':
      return {
        range: String(now.getFullYear()),
        grossLabel: 'Gross earning this Year',
      };
    default:
      return {range: 'All time', grossLabel: 'Gross earning to date'};
  }
};

/**
 * The whole payload → what the blue header draws.
 *
 * While the call is still out — `earnings` null — the gross shows `MISSING`,
 * so the header keeps its shape instead of collapsing and shoving the floating
 * stat cards up the screen.
 *
 * @param {object|null} earnings the payload from `getDriverEarnings`
 * @param {string} period the period the screen is showing
 * @param {Date} [now] injectable for tests
 * @returns {{gross: string, range: string, grossLabel: string}}
 */
export const toEarningsHeader = (earnings, period, now = new Date()) => ({
  gross: isNumber(earnings?.grossEarnings)
    ? formatMoney(earnings.grossEarnings)
    : MISSING,
  ...toPeriodCopy(period, now),
});

/**
 * Loads the driver's earnings for a period and keeps the payload in state.
 *
 * The fetcher is rebuilt whenever `period` changes, which is what makes the
 * shared hook refetch — picking "Yearly" from the dropdown asks the backend
 * again rather than filtering the rows already on screen.
 *
 * @param {string} [period] one of `PERIODS`' values
 * @returns {{earnings: object|null, loading: boolean, error: string|null,
 *            refresh: () => Promise<object|null>}}
 */
export function useDriverEarnings(period = DEFAULT_PERIOD) {
  const fetcher = useMemo(() => () => getDriverEarnings({period}), [period]);
  const {data, ...rest} = useMonthlyTotal(fetcher, ERROR);
  return {earnings: data, ...rest};
}
