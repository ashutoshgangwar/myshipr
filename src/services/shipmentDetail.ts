import {useMemo} from 'react';

import {getShipmentDetail} from '../config/driverApi';
import {
  formatMiles,
  group,
  isNumber,
  MONTHS_SHORT,
  stopTime,
} from '../utils/format';
import {TTL, useCachedResource} from './resourceCache';
import {loadType} from './upcomingShipments';
import type {
  DetailContact,
  DetailStop,
  ShipmentContact,
  ShipmentDetailPayload,
  ShipmentStop,
} from '../types/shipment';
import type {AsyncResource, DetailRow, Nullable} from '../types/common';

/** Everything below reads a payload that may not have arrived yet. */
type Detail = ShipmentDetailPayload | null | undefined;

export const NOT_IN_API = '—';

const ERROR = 'Could not load this shipment.';

const isDrop = (type: string | null | undefined): boolean =>
  /DROP|DELIVER/i.test(String(type || ''));

const bySequence = (a: ShipmentStop, b: ShipmentStop): number =>
  (a?.sequence ?? 0) - (b?.sequence ?? 0);

/** A value the payload actually carried, or the placeholder. */
const value = (raw: unknown): string => {
  const text = String(raw ?? '').trim();
  return text || NOT_IN_API;
};

export const humanize = (raw: unknown): string => {
  const text = String(raw ?? '').trim();
  if (!text) return NOT_IN_API;
  return text
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const chipDate = (raw: unknown): string => {
  const text = String(raw ?? '').trim();
  if (!text) return NOT_IN_API;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (!iso) return text;
  const month = MONTHS_SHORT[Number(iso[2]) - 1];
  return month ? `${month}, ${iso[3]}` : text;
};

/** 35000 → "35,000 lbs". */
export const weightLabel = (raw: number | string | null | undefined): string =>
  isNumber(raw) ? `${group(Math.round(Number(raw)))} lbs` : NOT_IN_API;

/** "08:00:00" + "10:00:00" → "8:00 AM - 10:00 AM"; either half may be absent. */
export const stopWindow = (stop: ShipmentStop | null | undefined): string => {
  const from = stopTime(stop?.fromTime ?? stop?.from);
  const to = stopTime(stop?.toTime ?? stop?.to);
  return [from, to].filter(Boolean).join(' - ') || NOT_IN_API;
};

/** The route's stops in the order the driver drives them. */
export const orderedRoute = (detail: Detail): ShipmentStop[] =>
  (Array.isArray(detail?.route) ? [...detail.route] : []).sort(bySequence);

/** The stop's street address, or the city/state it sent instead. */
export const stopAddress = (
  stop: ShipmentStop | null | undefined,
): string | undefined => {
  const parts = [stop?.city, stop?.state].map(part => String(part ?? '').trim());
  const address =
    String(stop?.address ?? '').trim() ||
    String(stop?.location ?? '').trim() ||
    parts.filter(Boolean).join(', ');
  return address || undefined;
};

export const toDetailStops = (detail: Detail): DetailStop[] =>
  orderedRoute(detail).map(stop => ({
    kind: isDrop(stop?.type) ? 'drop' : 'pickup',
    label: stopAddress(stop),
    sub: stopWindow(stop),
    lat: Number(stop?.lat ?? stop?.latitude),
    lng: Number(stop?.lng ?? stop?.lon ?? stop?.longitude),
  }));

/** "12" → "Dock 12"; text that already names the dock is left alone. */
export const dockLabel = (raw: unknown): string => {
  const text = String(raw ?? '').trim();
  if (!text) return NOT_IN_API;
  return /dock/i.test(text) ? text : `Dock ${text}`;
};

export const toDetailContacts = (detail: Detail): DetailContact[] => {
  const stops = orderedRoute(detail);
  const pickup = stops.find(stop => !isDrop(stop?.type));
  const drop = [...stops].reverse().find(stop => isDrop(stop?.type));

  const card = (
    id: DetailContact['id'],
    kicker: string,
    contact: ShipmentContact | undefined,
    stop: ShipmentStop | undefined,
  ): DetailContact => ({
    id,
    kicker,
    name: value(contact?.name),
    role: NOT_IN_API,
    phone: value(contact?.phone),
    // The line under the phone number is the dock; the stop's address is
    // already on the route strip above.
    access: dockLabel(contact?.dock ?? stop?.dock),
    remarks: null,
  });

  return [
    card('pickup', 'Pickup Contact', detail?.pickupContact, pickup),
    card('drop', 'Drop Contact', detail?.dropContact, drop),
  ];
};

// `TrailerTerms` carries `trailer`/`dimensions`/`trailerNumber`, but the
// design's two cells — hook & drop, trailer count — aren't on the payload at
// all, so both read NOT_IN_API until the backend adds them.
export const toTerms = (_detail: Detail): DetailRow[] => [
  {label: 'HOOK & DROP OF TRAILER', value: NOT_IN_API},
  {label: 'TRAILER COUNT', value: NOT_IN_API},

  // {label: 'TRAILER', value: NOT_IN_API},
  // {label: 'DIMENSIONS', value: NOT_IN_API},
  // {label: 'TRAILER NUMBER', value: NOT_IN_API},
  // {label: 'HAND-OFF TYPE', value: NOT_IN_API},
  // {label: 'LOADING RESPONSIBILITY', value: NOT_IN_API},
  // {label: 'DRIVER TOUCH FREIGHT', value: NOT_IN_API},
];


// `ShipmentDetailPayload` carries no reefer block at all — every cell here
// reads NOT_IN_API until the backend adds one, rather than guessing at a
// shape that doesn't exist yet.
export const toReeferDetails = (_detail: Detail): DetailRow[] => [
  {label: 'TEMPERATURE REQUIREMENT', value: NOT_IN_API},
  {label: 'TARGET TEMPERATURE', value: NOT_IN_API},
  {label: 'PRE-COOLING REQUIRED', value: NOT_IN_API},
];

export const toLoadDetails = (detail: Detail): DetailRow[] => {
  const load = detail?.shipmentDetails;
  return [
    {label: 'EQUIPMENT', value: humanize(load?.equipment)},
    {label: 'TRUCK CLASS', value: value(load?.truckClass)},
    {label: 'COMMODITY', value: value(load?.commodity)},
    {label: 'WEIGHT', value: weightLabel(load?.weightLbs)},
    {
      // "22/256 Cap" when the payload carried both halves.
      label: 'PALLETS',
      value: !isNumber(load?.totalPallets)
        ? NOT_IN_API
        : isNumber(load?.palletCapacity)
        ? `${load.totalPallets}/${load.palletCapacity} Cap`
        : String(load.totalPallets),
    },
    {
      label: 'DISTANCE',
      value: isNumber(load?.distanceMiles)
        ? formatMiles(load.distanceMiles, 'Miles')
        : NOT_IN_API,
    },
  ];
};

/**
 * The whole payload → everything the screen renders.
 * @param detail the payload from `getShipmentDetail`
 */
export const toShipmentDetail = (detail: Detail) => ({
  shipmentId: detail?.shipmentId ?? null,
  mode: loadType(detail?.shipmentType) || NOT_IN_API,
  date: chipDate(detail?.pickupDate),
  time: detail?.pickupTime ? stopTime(detail.pickupTime) : NOT_IN_API,
  status: NOT_IN_API,
  // No award/bid amount on this payload — the detail endpoint describes the
  // shipment, not how it was won.
  winningBid: NOT_IN_API,
  origin: value(detail?.routeFrom),
  dest: value(detail?.routeTo),
  stops: toDetailStops(detail),
  contacts: toDetailContacts(detail),
  terms: toTerms(detail),
  load: toLoadDetails(detail),
  reefer: toReeferDetails(detail),
});

/**
 * Loads one shipment's details and keeps the payload in state.
 *
 * @param shipmentId the id off the tapped shipment row
 */
export function useShipmentDetail(
  shipmentId: string | null | undefined,
): {detail: Nullable<ShipmentDetailPayload>} & Omit<
  AsyncResource<ShipmentDetailPayload>,
  'data'
> {
  const fetcher = useMemo(
    () => () =>
      shipmentId
        ? getShipmentDetail({shipmentId})
        : Promise.reject(new Error('No shipment was selected.')),
    [shipmentId],
  );
  const {data, ...rest} = useCachedResource<ShipmentDetailPayload>(
    `shipment-detail:${shipmentId ?? ''}`,
    fetcher,
    {ttl: TTL.DETAIL, message: ERROR},
  );
  return {detail: data, ...rest};
}
