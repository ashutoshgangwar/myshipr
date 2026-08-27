import {useMemo} from 'react';

import {getShipmentDetail} from '../config/driverApi';
import {
  formatMiles,
  group,
  isNumber,
  MONTHS_SHORT,
  stopTime,
} from '../utils/format';
import {useMonthlyTotal} from './monthlyTotals';
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

export const NOT_IN_API = 'Not in API';

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

export const toDetailStops = (detail: Detail): DetailStop[] =>
  orderedRoute(detail).map(stop => ({
    kind: isDrop(stop?.type) ? 'drop' : 'pickup',
    sub: stopWindow(stop),
    lat: Number(stop?.lat ?? stop?.latitude),
    lng: Number(stop?.lng ?? stop?.lon ?? stop?.longitude),
  }));

export const toDetailContacts = (detail: Detail): DetailContact[] => {
  const stops = orderedRoute(detail);
  const pickup = stops.find(stop => !isDrop(stop?.type));
  const drop = [...stops].reverse().find(stop => isDrop(stop?.type));

  const card = (
    id: DetailContact['id'],
    kicker: string,
    contact: ShipmentContact | undefined,
    stop: ShipmentStop | undefined,
  ): DetailContact => {
    const dock = contact?.dock ?? stop?.dock;
    return {
      id,
      kicker,
      name: value(contact?.name),
      role: NOT_IN_API,
      phone: value(contact?.phone),
      access:
        [String(stop?.address ?? '').trim(), String(dock ?? '').trim()]
          .filter(Boolean)
          .join(' · ') || NOT_IN_API,
      remarks: null,
    };
  };

  return [
    card('pickup', 'Pickup Contact', detail?.pickupContact, pickup),
    card('drop', 'Drop Contact', detail?.dropContact, drop),
  ];
};

export const toTerms = (detail: Detail): DetailRow[] => {
  const terms = detail?.trailerTerms;
  return [
    {label: 'TRAILER', value: value(terms?.trailer)},
    {label: 'TRAILER NUMBER', value: value(terms?.trailerNumber)},
    {label: 'DIMENSIONS', value: value(terms?.dimensions)},
    {label: 'HAND-OFF TYPE', value: NOT_IN_API},
    {label: 'LOADING RESPONSIBILITY', value: NOT_IN_API},
    {label: 'DRIVER TOUCH FREIGHT', value: NOT_IN_API},
  ];
};


export const toLoadDetails = (detail: Detail): DetailRow[] => {
  const load = detail?.shipmentDetails;
  return [
    {label: 'EQUIPMENT', value: humanize(load?.equipment)},
    {label: 'TRUCK CLASS', value: value(load?.truckClass)},
    {label: 'COMMODITY', value: value(load?.commodity)},
    {label: 'WEIGHT', value: weightLabel(load?.weightLbs)},
    {
      label: 'TOTAL PALLETS',
      value: isNumber(load?.totalPallets)
        ? String(load.totalPallets)
        : NOT_IN_API,
      sub: isNumber(load?.palletCapacity)
        ? `Capacity ${load.palletCapacity}`
        : null,
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
  origin: value(detail?.routeFrom),
  dest: value(detail?.routeTo),
  stops: toDetailStops(detail),
  contacts: toDetailContacts(detail),
  terms: toTerms(detail),
  load: toLoadDetails(detail),
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
  const {data, ...rest} = useMonthlyTotal(fetcher, ERROR);
  return {detail: data, ...rest};
}
