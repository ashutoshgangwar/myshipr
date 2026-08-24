/**
 * Turns the `GET /drivers/shipments/upcoming` payload into the rows the Home
 * "Upcoming Shipment" card renders, and loads it.
 *
 * Same rule as the current-trip mapper: every helper tolerates a missing
 * field. A load whose stops carry no address still lists, and a payload the
 * backend half-fills paints rather than blanking the card.
 */

import {useCallback, useEffect, useRef, useState} from 'react';

import {getUpcomingShipments} from '../../config/driverApi';
import {stopTime} from './currentTrip';

// Abbreviated, and the day zero-padded below, so every row's line comes out
// the same length: "08:30 AM | 26 Jul 2026", always 22 characters. That is
// what lets one fixed font size fit them all. See `loadWhen` in
// HomeScreen.styles.
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const isDrop = type => /DROP|DELIVER/i.test(String(type || ''));

const bySequence = (a, b) =>
  (a?.sequence ?? a?.tripSequence ?? 0) - (b?.sequence ?? b?.tripSequence ?? 0);

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
      const stops = (
        Array.isArray(shipment?.stops) ? [...shipment.stops] : []
      ).sort(bySequence);
      const first = stops[0];

      // The row reads "08:30 AM | 26 Jul 2026" — the pickup window opening,
      // then the day. Either half can be missing; the separator goes with it.
      const time = padHour(stopTime(
        first?.from ??
          first?.to ??
          shipment?.pickupTime ??
          shipment?.startTime ??
          '',
      ));
      const date = formatLoadDate(
        shipment?.date ?? first?.date ?? first?.from ?? shipment?.pickupTime,
      );

      return {
        id: String(
          shipment?.shipmentId ??
            shipment?.tripId ??
            shipment?.id ??
            shipment?.awb ??
            `upcoming-${index}`,
        ),
        when: [time, date].filter(Boolean).join(' | '),
        stops: stops
          .map(stop => ({
            city: cityLabel(stop),
            type: isDrop(stop.type) ? 'drop' : 'pickup',
          }))
          .filter(stop => stop.city),
      };
    })
    // A load with no legible stop has nothing to draw a route from.
    .filter(load => load.stops.length > 0);
};

/**
 * Loads the driver's upcoming shipments and keeps the mapped rows in state.
 *
 * @param {string} [date] optional `YYYY-MM-DD` filter. Left out by default —
 *   the endpoint does not require it, and defaulting it to today would narrow
 *   the list the backend means to send.
 * @returns {{loads: object[], loading: boolean, error: string|null,
 *            refresh: () => Promise<object[]>}}
 */
export function useUpcomingShipments(date) {
  const [loads, setLoads] = useState([]);
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
      const shipments = await getUpcomingShipments(date ? {date} : {});
      const rows = toUpcomingLoads(shipments);

      if (!mountedRef.current || requestId !== requestRef.current) return rows;
      setLoads(rows);
      return rows;
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

  return {loads, loading, error, refresh};
}
