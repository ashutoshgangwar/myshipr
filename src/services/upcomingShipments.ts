/**
 * Loads the driver's shipment lists — `GET /drivers/shipments/upcoming` and
 * `GET /drivers/shipments/past` — and turns either payload into the rows its
 * readers render: the Home "Upcoming Shipment" card and the UPCOMING and PAST
 * tabs of the Shipment table. Both endpoints answer in the same shape, so one
 * set of mappers serves all three; the hooks hand back the raw list and each
 * screen maps it.
 *
 * Same rule as the current-trip mapper: every helper tolerates a missing
 * field. A load whose stops carry no address still lists, and a payload the
 * backend half-fills paints rather than blanking the screen.
 */

import {useMemo} from 'react';

import {TTL, useCachedResource} from './resourceCache';
import type {ShipmentListParams, ShipmentStop, ShipmentSummary} from '../types/shipment';
import type {LatLng, Nullable} from '../types/common';

/**
 * One array for every empty answer. A fresh `[]` per render would give the
 * `useMemo`s downstream a new dependency each time and re-map a list that has
 * not changed.
 */
const EMPTY_LIST: ShipmentSummary[] = [];

/**
 * A route stop reduced to what `LoadRoute` draws.
 *
 * A `type` alias rather than an `interface` so it satisfies `LoadRouteStop`'s
 * index signature — interfaces get no implicit one.
 */
export type StopListEntry = {
  city: string;
  type: 'pickup' | 'drop';
};
import {getPastShipments, getUpcomingShipments} from '../config/driverApi';
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

const isDrop = (type: string | null | undefined): boolean =>
  /DROP|DELIVER/i.test(String(type || ''));

const bySequence = (a: ShipmentStop, b: ShipmentStop): number =>
  (a?.sequence ?? a?.tripSequence ?? 0) - (b?.sequence ?? b?.tripSequence ?? 0);

const pad = (n: number | string): string => String(n).padStart(2, '0');

/** Stops in the order the driver drives them. */
export const orderedStops = (
  shipment: ShipmentSummary | null | undefined,
): ShipmentStop[] =>
  (Array.isArray(shipment?.stops) ? [...shipment.stops] : []).sort(bySequence);

/**
 * The stop's coordinate in the naming the map screens speak, or null when the
 * payload carried none.
 *
 * The list endpoint sends `lat`/`lon` and sends them as `null` on a stop it
 * could not geocode — see the `MAWB-FTL_STANDARD-2OK1AQF9RG8W` row, whose
 * pickup has an address but no point — so "sent the key" is not the same as
 * "sent a number", and only a finite pair counts.
 */
export const stopLatLng = (
  stop: ShipmentStop | null | undefined,
): Nullable<LatLng> => {
  const lat = Number(stop?.lat ?? stop?.latitude);
  const lng = Number(stop?.lng ?? stop?.lon ?? stop?.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? {lat, lng} : null;
};

/**
 * The load's leg: the first stop's point and the last stop's, in
 * `tripSequence`/`sequence` order — sequence 1 through whatever the run ends
 * on, be that 2, 3 or 4.
 *
 * `GET /drivers/shipments/{shipmentId}/detail` carries addresses but no
 * coordinates, so the details screen cannot draw its route line from its own
 * payload. The list endpoint does carry them, so the row the driver tapped
 * hands the two ends over as route params and the map draws from those.
 * Either end is null when its stop had no point; the caller decides what an
 * incomplete leg looks like.
 */
export const routeEnds = (
  shipment: ShipmentSummary | null | undefined,
): {pickup: Nullable<LatLng>; drop: Nullable<LatLng>} => {
  const stops = orderedStops(shipment);
  return {
    pickup: stopLatLng(stops[0]),
    drop: stopLatLng(stops[stops.length - 1]),
  };
};

/** The stop shape LoadRoute reads: a city label and a pickup/drop type. */
export const toStopList = (stops: ShipmentStop[]): StopListEntry[] =>
  stops
    .map((stop): StopListEntry => ({
      city: cityLabel(stop),
      type: isDrop(stop?.type) ? 'drop' : 'pickup',
    }))
    .filter(stop => stop.city);

const rowId = (
  shipment: (ShipmentSummary & {id?: string}) | null | undefined,
  index: number,
): string =>
  String(
    shipment?.shipmentId ??
      shipment?.tripId ??
      shipment?.id ??
      shipment?.awb ??
      `upcoming-${index}`,
  );

/** The "YYYY-MM-DD" head of whatever date-ish value the payload carried. */
const isoDate = (value: unknown): string => {
  const iso = /^(\d{4}-\d{2}-\d{2})/.exec(String(value ?? '').trim());
  return iso ? iso[1] : '';
};

/**
 * The Shipment table's pickup pill: "6:00PM JUL 12", or "6:00PM TODAY" for a
 * load leaving today — the format the column already renders. Whichever half
 * the payload is missing simply drops out, and a row with neither shows
 * `MISSING` rather than an empty pill.
 */
const pickupPill = (
  time: string | null | undefined,
  date: string,
  today: string,
): string => {
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
const milesLabel = (value: number | string | null | undefined): string =>
  isNumber(value) ? formatMiles(value, 'Miles') : MISSING;

/**
 * "FTL_STANDARD" → "FTL". The backend qualifies the load type with a service
 * level; the badge is a two-character chip with a truck in it, so only the
 * type itself fits — and the qualifier is not what the driver is scanning the
 * column for.
 */
export const loadType = (value: unknown): string | null => {
  const text = String(value ?? '').trim();
  return text ? text.split('_')[0].toUpperCase() : null;
};

/**
 * "2026-07-26" → "26 Jul 2026". Built from the string's own parts rather than
 * a Date: `new Date('2026-07-26')` is UTC midnight, which reads as the 25th
 * for a driver west of Greenwich. Anything not ISO is passed through as sent.
 */
export const formatLoadDate = (value: unknown): string => {
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
const padHour = (text: string): string => (/^\d:/.test(text) ? `0${text}` : text);

const COUNTRY = /^(usa?|u\.s\.a\.?|united states( of america)?|canada|mexico|india)$/i;
// "NJ 07302" — the tail of a US address line, state code plus postcode.
const STATE_ZIP = /^([A-Za-z]{2})\.?[\s,]*\d{3,6}(-\d{4})?$/;
const ZIP = /^\d{3,6}(-\d{4})?$/;

/**
 * "Jersey City, NJ" out of whatever the stop carries. The route column is a
 * third of a half-width card, so the full street address does not fit — the
 * city (and its state, when the address names one) is what the driver reads.
 */
export const cityLabel = (stop: ShipmentStop | null | undefined): string => {
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
 * Today as "YYYY-MM-DD", built from the local calendar rather than
 * `toISOString()` — the latter is UTC, so a driver west of Greenwich would get
 * tomorrow's date all evening and lose today's loads off the card.
 *
 * @param {Date} [now] injectable for tests
 * @returns {string}
 */
export const todayIso = (now = new Date()) =>
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

/**
 * The API list → the card's rows.
 *
 * Anything scheduled before `now`'s day is dropped: the card is titled
 * "Upcoming Shipment", and a load whose pickup was yesterday is not something
 * the driver can still act on. A shipment carrying no legible date is kept —
 * the rest of this file paints half-filled payloads rather than hiding them,
 * and there is nothing to prove it is in the past. What survives is ordered
 * soonest-first, so the top row is the next load to run.
 *
 * @param {object[]} shipments as returned by `getUpcomingShipments`
 * @param {Date} [now] today, for the past cutoff; injectable for tests
 * @returns {{id: string, when: string, stops: {city: string, type: string}[]}[]}
 */
export const toUpcomingLoads = (
  shipments: ShipmentSummary[] | null | undefined,
  now: Date = new Date(),
) => {
  const list = Array.isArray(shipments) ? shipments : [];
  const today = todayIso(now);

  return list
    .filter(shipment => {
      const date = shipmentDate(shipment);
      return !date || date >= today;
    })
    .sort((a, b) => {
      // Undated loads sort last: they carry nothing to place them by, and
      // pushing them past the dated rows keeps the run order readable.
      const left = shipmentDate(a) || '9999-99-99';
      const right = shipmentDate(b) || '9999-99-99';
      return left < right ? -1 : left > right ? 1 : 0;
    })
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
 * The day a shipment is scheduled for, as "YYYY-MM-DD", or '' when the
 * payload carries no legible date. The Shipment screen's date strip marks its
 * days from this, so it has to read the date out of a shipment exactly the
 * way the table's rows do.
 *
 * @param {object} shipment one entry of the upcoming list
 * @returns {string}
 */
export const shipmentDate = (
  shipment: ShipmentSummary | null | undefined,
): string => {
  const first = orderedStops(shipment)[0];
  return isoDate(shipment?.date ?? first?.date ?? first?.from);
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
export const toShipmentRows = (
  shipments: ShipmentSummary[] | null | undefined,
  now: Date = new Date(),
) => {
  const list = Array.isArray(shipments) ? shipments : [];
  const today = todayIso(now);

  return list.map((shipment, index) => {
    const stops = orderedStops(shipment);
    const first = stops[0];
    const date = shipmentDate(shipment);

    return {
      id: rowId(shipment, index),
      // The id the details endpoint takes. Kept apart from `id`, which falls
      // back to a positional key so every row still has one — a synthesised
      // key must never be sent to the API as if it were a real shipment.
      shipmentId: shipment?.shipmentId ?? shipment?.tripId ?? null,
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
      // The leg's two ends, for the details screen's map. Kept on the row so
      // the coordinates travel with the tap rather than being looked up
      // again from an endpoint that does not send them.
      route: routeEnds(shipment),
    };
  });
};

/**
 * The list hook the two shipment endpoints share.
 *
 * `fetcher` is `getUpcomingShipments` or `getPastShipments` — same signature,
 * same payload shape, so the only thing that differs is which URL is hit and
 * how a failure reads to the driver.
 *
 * Cached per endpoint *and* per date, so the Home card and the Shipment
 * table's UPCOMING tab — which ask for the same day — share one call, and
 * switching the table back to a day it has already shown redraws without one.
 * `TTL.LIST` is a minute: long enough that walking between the two screens
 * costs nothing, short enough that a load a dispatcher adds mid-shift shows
 * up on the next look.
 *
 * The list is handed back unmapped: the Home card and the Shipment table read
 * the same payload into different shapes, so each maps it with `useMemo`
 * rather than the hook picking a winner.
 *
 * @param key what to cache this endpoint's answers under, before the date
 * @param fetcher the driverApi getter
 * @param errorText shown when the call fails
 * @param date optional `YYYY-MM-DD` filter; omitted from the request when
 *   falsy, which lets the backend choose the window
 */
function useShipmentList(
  key: string,
  fetcher: (params: ShipmentListParams) => Promise<ShipmentSummary[]>,
  errorText: string,
  date?: string,
) {
  const {data, loading, error, refresh} = useCachedResource<ShipmentSummary[]>(
    `${key}:${date ?? ''}`,
    // Closes over `date`, so it is read through the hook's own ref rather
    // than re-keying the fetch — the cache key already carries the day.
    useMemo(() => () => fetcher(date ? {date} : {}), [fetcher, date]),
    {ttl: TTL.LIST, message: errorText},
  );

  return {
    // A failed call must not leave the previous day's rows on screen
    // pretending to be this day's — the error line replaces them.
    shipments: error ? EMPTY_LIST : data ?? EMPTY_LIST,
    // The `date` the list on screen was fetched with, so a caller can tell
    // rows that belong to the day it is showing from rows left over from the
    // day before it. Null until the first response lands.
    loadedDate: data === null && !error ? undefined : date ?? null,
    loading,
    error,
    refresh,
  };
}

/**
 * Loads the driver's upcoming shipments and keeps the raw list in state.
 *
 * @param {string} [date] optional `YYYY-MM-DD` filter
 * @returns {{shipments: object[], loadedDate: string|null|undefined,
 *            loading: boolean, error: string|null,
 *            refresh: () => Promise<object[]>}}
 */
export function useUpcomingShipments(date?: string) {
  return useShipmentList(
    'shipments-upcoming',
    getUpcomingShipments,
    'Could not load your upcoming shipments.',
    date,
  );
}

/**
 * Loads the driver's completed shipments — the PAST tab of the Shipment table.
 *
 * @param {string} [date] optional `YYYY-MM-DD` filter
 * @returns {{shipments: object[], loadedDate: string|null|undefined,
 *            loading: boolean, error: string|null,
 *            refresh: () => Promise<object[]>}}
 */
export function usePastShipments(date?: string) {
  return useShipmentList(
    'shipments-past',
    getPastShipments,
    'Could not load your past shipments.',
    date,
  );
}
