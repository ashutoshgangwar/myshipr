/**
 * Turns the `GET /drivers/shipments/{tripId}` payload into the exact shapes the
 * Home "Current Trip" card renders. Every helper tolerates a missing field:
 * the card is the driver's first screen, so a half-filled payload must still
 * paint rather than blank out.
 */

import {useMemo} from 'react';

import {getCurrentTrip} from '../../config/driverApi';
import {TTL, useCachedResource} from '../../services/resourceCache';
import {
  formatMiles,
  formatMinutes,
  isNumber,
  MONTHS_SHORT as MONTHS,
  stopTime,
} from '../../utils/format';
import {
  getCachedLocation,
  getCurrentLocation,
} from '../../services/LocationService';
import {toVehicleSpec} from '../../utils/here/vehicleSpec';
import type {
  CurrentTrip,
  ShipmentStop,
  TripStopTarget,
} from '../../types/shipment';
import type {TruckDetails} from '../../types/navigation';
import type {RouteStop} from '../../component/RouteStops/RouteStops';

/** Every mapper below reads a trip that may not have arrived yet. */
type Trip = CurrentTrip | null | undefined;

export {formatMiles, formatMinutes, formatMoney} from '../../utils/format';

// Static until the trip in progress is picked from the loads/assignment API.
// export const CURRENT_TRIP_ID = 'f02f0373-a902-49ba-82a7-fe68f5a0229d';
// export const CURRENT_TRIP_ID = 'e923da6c-899b-4c7b-9a2c-26454765a510';
export const CURRENT_TRIP_ID = 'f83eaf28-6201-48cd-9116-43f0a0cd064e';

// The federal 11-hour driving limit, which is what the in-card bar fills
// against — the API sends only the minutes that are left.
const HOS_CYCLE_MINUTES = 11 * 60;

/** "8:00 AM – 8:30 AM", or whichever half of the window was sent. */
const timeWindow = (stop: ShipmentStop | null | undefined): string => {
  const from = stopTime(stop?.from);
  const to = stopTime(stop?.to);
  if (from && to) return `${from} – ${to}`;
  return from || to || '';
};

export const formatTripDate = (value: unknown): string => {
  if (!value) return '—';
  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) {
      return `${parsed.getDate()} ${MONTHS[parsed.getMonth()]}`;
    }
  }

  // Drop a trailing year, however the rest of the string is punctuated.
  return text.replace(/[\s,]+\d{4}$/, '') || '—';
};

const STATUS_LABELS: Record<string, string> = {
  ON_TIME: 'On time',
  EARLY: 'Early',
  DELAYED: 'Delayed',
  AT_RISK: 'At risk',
  LATE: 'Late',
};

/** The status pill's text plus whether it should read as good or bad. */
export const tripStatusPill = (trip: Trip) => {
  const status = trip?.tripStatus?.timeStatus;
  if (!status) return null;
  const key = String(status).toUpperCase();
  return {
    label: STATUS_LABELS[key] || key.replace(/_/g, ' ').toLowerCase(),
    late: key === 'DELAYED' || key === 'LATE' || key === 'AT_RISK',
  };
};

/**
 * "Starts in 1h 28 mins" — read from `tripStatus.startsIn`, which carries the
 * duration, not the sentence. It is null on a trip already under way, and the
 * pill is simply not rendered then.
 */
export const startsInLabel = (trip: Trip): string | null => {
  const text = String(trip?.tripStatus?.startsIn ?? '').trim();
  if (!text) return null;
  return /^starts/i.test(text) ? text : `Starts in ${text}`;
};

const isDrop = (type: string | null | undefined): boolean =>
  /DROP|DELIVER/i.test(String(type || ''));

/**
 * The order the driver works the stops in.
 *
 * `tripSequence` leads: a trip can span several shipments, and each of those
 * restarts its own `sequence` at 1, so sorting on `sequence` first would
 * interleave two shipments' stops. `sequence` is only the fallback for a
 * payload that omits the trip-wide number.
 */
const byTripSequence = (a: ShipmentStop, b: ShipmentStop): number =>
  (a.tripSequence ?? a.sequence ?? 0) - (b.tripSequence ?? b.sequence ?? 0);

/** The trip's stops, in the order they are driven. */
export const orderedStops = (trip: Trip): ShipmentStop[] =>
  (Array.isArray(trip?.stops) ? [...trip.stops] : []).sort(byTripSequence);

/** A stop's coordinate, however the payload spelled it, or null. */
const stopCoordinates = (stop: ShipmentStop | null | undefined) => {
  const lat = stop?.lat ?? stop?.latitude;
  const lon = stop?.lon ?? stop?.lng ?? stop?.longitude;
  if (!isNumber(lat) || !isNumber(lon)) return null;
  return {latitude: Number(lat), longitude: Number(lon)};
};

/**
 * Every stop the map screen can route to, in trip order.
 *
 * The trip endpoint is the only one that carries coordinates — the progress
 * endpoint names the same stops but sends none — so this is what the map joins
 * a status row to when it needs somewhere to drive. Stops without a coordinate
 * are dropped: there is nothing to route to.
 */
export const toTripStopTargets = (trip: Trip): TripStopTarget[] =>
  orderedStops(trip).flatMap((stop, index): TripStopTarget[] => {
    const coordinates = stopCoordinates(stop);
    if (!coordinates) return [];

    const address =
      stop.address || (isDrop(stop.type) ? 'Drop location' : 'Pickup location');

    return [
      {
        tripSequence: stop.tripSequence ?? stop.sequence ?? index + 1,
        sequence: stop.sequence ?? null,
        shipmentId: stop.shipmentId ?? null,
        type: stop.type ?? (isDrop(stop.type) ? 'DROP' : 'PICKUP'),
        address,
        location: {...coordinates, description: address},
        window: timeWindow(stop),
      },
    ];
  });

export const tripShipmentId = (trip: Trip): string | null =>
  orderedStops(trip).find(stop => stop.shipmentId)?.shipmentId ??
  trip?.tripId ??
  null;

/** API stops, in sequence, behind the driver's live position. */
export const toRouteStops = (trip: Trip): RouteStop[] | null => {
  const ordered = orderedStops(trip);
  if (!ordered.length) return null;

  return [
    {kind: 'current'},
    ...ordered.map((stop): RouteStop => ({
      kind: isDrop(stop.type) ? 'drop' : 'pickup',
      label: stop.address || undefined,
      sub: timeWindow(stop),
    })),
  ];
};

export const toTripStats = (trip: Trip) => {
  const deadMiles = trip?.deadMiles;

  return [
    {label: 'Distance', value: formatMiles(trip?.totalMiles)},
    {label: 'Est. time', value: formatMinutes(trip?.estimatedTripMinutes)},
    {label: 'Date', value: formatTripDate(trip?.date)},
    {label: 'Dead miles', value: formatMiles(deadMiles)},
  ];
};

/** Hours-of-service row inside the card: text plus bar width. */
export const toHosProgress = (
  trip: Trip,
): {label: string; width: `${number}%`} => {
  const remaining = trip?.remainingHosMinutes;
  if (!isNumber(remaining)) return {label: 'Not available', width: '0%'};
  const minutes = Math.max(0, Number(remaining));
  const percent = Math.min(100, Math.round((minutes / HOS_CYCLE_MINUTES) * 100));
  return {label: `${formatMinutes(minutes)} left`, width: `${percent}%`};
};

/**
 * The truck profile the trip's route is calculated for, converted from the
 * payload's `equipmentDetail` into HERE's kilograms and centimetres.
 *
 * Null when the load has no equipment on it yet, which routes the trip as a
 * generic truck rather than failing.
 */
export const toTruckDetails = (trip: Trip): TruckDetails | null =>
  toVehicleSpec(trip?.equipmentDetail);

export const toDestination = (trip: Trip) => {
  const targets = toTripStopTargets(trip);
  const drops = targets.filter(target => isDrop(target.type));
  const last = (drops.length ? drops : targets).pop();

  if (!last) return null;

  return {
    destinationLocation: last.location,
    destinationText: last.address,
  };
};

/**
 * @returns {Promise<{lat: number, lon: number}|null>}
 */
const resolveCoordinates = async () => {
  const cached = getCachedLocation();
  if (cached) {
    return {lat: cached.latitude, lon: cached.longitude};
  }

  try {
    const fix = await getCurrentLocation({
      // The map and the route card already own the permission/GPS prompts.
      skipGPSCheck: true,
      skipPermissionCheck: true,
      highAccuracy: false,
      preferCacheMs: 60000,
    });
    return fix ? {lat: fix.latitude, lon: fix.longitude} : null;
  } catch {
    return null;
  }
};

/**
 * The driver's current trip, read through the shared cache.
 *
 * Keyed by trip id, so the screens that ask for the same trip share one call.
 * `TTL.TRIP` is 30s — the ETA and the stop states do move while the truck is
 * rolling, but not between one focus and the next — and a refetch that comes
 * back with the trip unchanged keeps the cached object, so the route strip
 * and the stats row do not repaint for nothing.
 *
 * Nothing is fetched while `tripId` is empty.
 *
 * @param tripId trip to load
 * @returns {{trip: object|null, loading: boolean, error: string|null,
 *            refresh: (opts?: {force?: boolean}) => Promise<object|null>}}
 */
export function useCurrentTrip(tripId?: string | null) {
  const fetcher = useMemo(
    () => async () => {
      const coordinates = await resolveCoordinates();
      return getCurrentTrip({tripId: tripId as string, ...coordinates});
    },
    [tripId],
  );

  const {data, loading, error, refresh} = useCachedResource<CurrentTrip>(
    tripId ? `current-trip:${tripId}` : '',
    fetcher,
    {
      ttl: TTL.TRIP,
      message: 'Could not load your current trip.',
      enabled: Boolean(tripId),
    },
  );

  return {trip: data, loading, error, refresh};
}
