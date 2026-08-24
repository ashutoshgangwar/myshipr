/**
 * Loads `GET /drivers/shipments/upcoming` and turns the payload into the rows
 * its two readers render: the Home "Upcoming Shipment" card and the UPCOMING
 * tab of the Shipment table. One call, one shape each — the hook hands back
 * the raw list and each screen maps it.
 *
 * Same rule as the current-trip mapper: every helper tolerates a missing
 * field. A load whose stops carry no address still lists, and a payload the
 * backend half-fills paints rather than blanking the screen.
 */

import {useCallback, useEffect, useRef, useState} from 'react';

import {getUpcomingShipments} from '../config/driverApi';
import {
  formatMiles,
  formatMoney,
  isNumber,
  MONTHS_SHORT as MONTHS,
  stopTime,
} from '../utils/format';

// Stands in for a figure the backend did not send, so a half-filled row still
// lines up with its neighbours instead of collapsing to nothing.
export const MISSING = '…';

const isDrop = type => /DROP|DELIVER/i.test(String(type || ''));

const bySequence = (a, b) =>
  (a?.sequence ?? a?.tripSequence ?? 0) - (b?.sequence ?? b?.tripSequence ?? 0);

const pad = n => String(n).padStart(2, '0');

/** Stops in the order the driver drives them. */
const orderedStops = shipment =>
  (Array.isArray(shipment?.stops) ? [...shipment.stops] : []).sort(bySequence);

/** The stop shape LoadRoute reads: a city label and a pickup/drop type. */
const toStopList = stops =>
  stops
    .map(stop => ({
      city: cityLabel(stop),
      type: isDrop(stop?.type) ? 'drop' : 'pickup',
    }))
    .filter(stop => stop.city);

const rowId = (shipment, index) =>
  String(
    shipment?.shipmentId ??
      shipment?.tripId ??
      shipment?.id ??
      shipment?.awb ??
      `upcoming-${index}`,
  );

/** The "YYYY-MM-DD" head of whatever date-ish value the payload carried. */
const isoDate = value => {
  const iso = /^(\d{4}-\d{2}-\d{2})/.exec(String(value ?? '').trim());
  return iso ? iso[1] : '';
};

/**
 * The Shipment table's pickup pill: "6:00PM JUL 12", or "6:00PM TODAY" for a
 * load leaving today — the format the column already renders. Whichever half
 * the payload is missing simply drops out, and a row with neither shows
 * `MISSING` rather than an empty pill.
 */
const pickupPill = (time, date, today) => {
  const clockText = stopTime(time).replace(' ', '');
  const when =
    date === today
      ? 'TODAY'
      : date
      ? `${MONTHS[Number(date.slice(5, 7)) - 1].toUpperCase()} ${date.slice(8)}`
      : '';
  return [clockText, when].filter(Boolean).join(' ') || MISSING;
};

/**
 * The distance exactly as the backend sent it: 180.4 → "180.4 Miles", 1180 →
 * "1,180 Miles". Nothing is rounded — a driver paid by the mile should see the
 * figure the load actually carries — and a whole number gains no decimals.
 */
const milesLabel = value =>
  isNumber(value) ? formatMiles(value, 'Miles') : MISSING;

/**
 * "FTL_STANDARD" → "FTL". The backend qualifies the load type with a service
 * level; the badge is a two-character chip with a truck in it, so only the
 * type itself fits — and the qualifier is not what the driver is scanning the
 * column for.
 */
const loadType = value => {
  const text = String(value ?? '').trim();
  return text ? text.split('_')[0].toUpperCase() : null;
};

/**
 * "2026-07-26" → "26 Jul 2026". Built from the string's own parts rather than
 * a Date: `new Date('2026-07-26')` is UTC midnight, which reads as the 25th
 * for a driver west of Greenwich. Anything not ISO is passed through as sent.
 */
export const formatLoadDate = value => {
  if (!value) return '';
  const text = String(value).trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (!iso) return text;
  const month = MONTHS[Number(iso[2]) - 1];
  return month ? `${iso[3]} ${month} ${iso[1]}` : text;
};

/**
 * "8:30 AM" → "08:30 AM". The card prints the pickup window and the date on
 * one line, so a padded hour is what keeps every row exactly as wide as every
 * other — an unpadded 9:15 would shift its whole line a character left.
 */
const padHour = text => (/^\d:/.test(text) ? `0${text}` : text);

const COUNTRY = /^(usa?|u\.s\.a\.?|united states( of america)?|canada|mexico|india)$/i;
// "NJ 07302" — the tail of a US address line, state code plus postcode.
const STATE_ZIP = /^([A-Za-z]{2})\.?[\s,]*\d{3,6}(-\d{4})?$/;
const ZIP = /^\d{3,6}(-\d{4})?$/;

/**
 * "Jersey City, NJ" out of whatever the stop carries. The route column is a
 * third of a half-width card, so the full street address does not fit — the
 * city (and its state, when the address names one) is what the driver reads.
 */
export const cityLabel = stop => {
  if (!stop) return '';
  // A backend that already splits the address is taken at its word.
  if (stop.city) return [stop.city, stop.state].filter(Boolean).join(', ');

  const parts = String(stop.address ?? stop.location ?? '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
  if (!parts.length) return '';

  while (parts.length > 1 && COUNTRY.test(parts[parts.length - 1])) parts.pop();

  const last = parts[parts.length - 1];
  const previous = parts.length > 1 ? parts[parts.length - 2] : '';

  const stateZip = STATE_ZIP.exec(last);
  if (stateZip && previous) return `${previous}, ${stateZip[1].toUpperCase()}`;

  // "Jersey City NJ 07302" arriving as a single unpunctuated token.
  const inline = /^(.+?)[\s,]+([A-Za-z]{2})[\s,]+\d{3,6}(-\d{4})?$/.exec(last);
  if (inline) return `${inline[1]}, ${inline[2].toUpperCase()}`;

  if (ZIP.test(last) && previous) return previous;
  return last;
};

/**
 * The API list → the card's rows.
 *
 * @param {object[]} shipments as returned by `getUpcomingShipments`
 * @returns {{id: string, when: string, stops: {city: string, type: string}[]}[]}
 */
export const toUpcomingLoads = shipments => {
  const list = Array.isArray(shipments) ? shipments : [];

  return list
    .map((shipment, index) => {
      const stops = orderedStops(shipment);
      const first = stops[0];

      // The row reads "08:30 AM | 26 Jul 2026" — the pickup window opening,
      // then the day. Either half can be missing; the separator goes with it.
      const time = padHour(
        stopTime(
          first?.from ??
            first?.to ??
            shipment?.pickupTime ??
            shipment?.startTime ??
            '',
        ),
      );
      const date = formatLoadDate(
        shipment?.date ?? first?.date ?? first?.from ?? shipment?.pickupTime,
      );

      return {
        id: rowId(shipment, index),
        when: [time, date].filter(Boolean).join(' | '),
        stops: toStopList(stops),
      };
    })
    // A load with no legible stop has nothing to draw a route from.
    .filter(load => load.stops.length > 0);
};

/**
 * The API list → the UPCOMING rows of the Shipment table.
 *
 * The table's cells are fixed — AWB over a load-type badge, the route, payout
 * over distance, and a pickup pill — so anything the payload leaves out comes
 * back as `MISSING` rather than an empty cell. The load-type badge is the one
 * exception: the table already hides it when there is no type, and an ellipsis
 * in a badge reads as a broken chip rather than a pending value.
 *
 * @param {object[]} shipments as returned by `getUpcomingShipments`
 * @param {Date} [now] today, for the "TODAY" pill; injectable for tests
 * @returns {object[]} rows in the shape the table's renderItem expects
 */
export const toShipmentRows = (shipments, now = new Date()) => {
  const list = Array.isArray(shipments) ? shipments : [];
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate(),
  )}`;

  return list.map((shipment, index) => {
    const stops = orderedStops(shipment);
    const first = stops[0];
    const date = isoDate(shipment?.date ?? first?.date ?? first?.from);

    return {
      id: rowId(shipment, index),
      awb: shipment?.awb || MISSING,
      // Left null when absent: the row hides the badge entirely.
      type: loadType(shipment?.shipmentType ?? shipment?.type),
      stops: toStopList(stops),
      payout: isNumber(shipment?.loadPayout)
        ? formatMoney(shipment.loadPayout)
        : MISSING,
      // The list endpoint names this `shipmentDistanceMiles`; `totalMiles` is
      // what the single-trip payload calls the same figure, kept as a fallback.
      miles: milesLabel(
        shipment?.shipmentDistanceMiles ?? shipment?.totalMiles,
      ),
      pickupAt: pickupPill(
        first?.from ?? shipment?.pickupTime ?? shipment?.startTime,
        date,
        today,
      ),
      // A load leaving today gets the green pill.
      today: Boolean(date) && date === today,
    };
  });
};

/**
 * Loads the driver's upcoming shipments and keeps the raw list in state.
 *
 * The list is handed back unmapped: the Home card and the Shipment table read
 * the same payload into different shapes, so each maps it with `useMemo`
 * rather than the hook picking a winner.
 *
 * @param {string} [date] optional `YYYY-MM-DD` filter. Left out by default —
 *   the endpoint does not require it, and defaulting it to today would narrow
 *   the list the backend means to send.
 * @returns {{shipments: object[], loading: boolean, error: string|null,
 *            refresh: () => Promise<object[]>}}
 */
export function useUpcomingShipments(date) {
  const [shipments, setShipments] = useState([]);
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
      const list = await getUpcomingShipments(date ? {date} : {});

      if (!mountedRef.current || requestId !== requestRef.current) return list;
      setShipments(list);
      return list;
    } catch (err) {
      if (mountedRef.current && requestId === requestRef.current) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            'Could not load your upcoming shipments.',
        );
      }
      return [];
    } finally {
      if (mountedRef.current && requestId === requestRef.current) {
        setLoading(false);
      }
    }
  }, [date]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {shipments, loading, error, refresh};
}
