/**
 * Turns the `GET /drivers/shipments/{tripId}` payload into the exact shapes the
 * Home "Current Trip" card renders. Every helper tolerates a missing field:
 * the card is the driver's first screen, so a half-filled payload must still
 * paint rather than blank out.
 */

import {useCallback, useEffect, useRef, useState} from 'react';

import {getCurrentTrip} from '../../config/driverApi';
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
import type {AxiosError} from 'axios';
import type {ApiErrorBody} from '../../types/api';
import type {ErrorLike} from '../../types/common';
import type {CurrentTrip, ShipmentStop} from '../../types/shipment';
import type {RouteStop} from '../../component/RouteStops/RouteStops';

/** Every mapper below reads a trip that may not have arrived yet. */
type Trip = CurrentTrip | null | undefined;

// Re-exported so the screens that already read these off this module keep
// working — the implementations just moved somewhere both tabs can reach.
export {formatMiles, formatMinutes, formatMoney} from '../../utils/format';

// Static until the trip in progress is picked from the loads/assignment API.
export const CURRENT_TRIP_ID = 'f02f0373-a902-49ba-82a7-fe68f5a0229d';

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

/**
 * "11 Aug 2026" → "11 Aug". The stat cell is a quarter of a half-width card,
 * and the year earns none of that room — a trip is days away, not years.
 * An ISO date is handled too, in case the backend switches format.
 */
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

/** API stops, in sequence, behind the driver's live position. */
export const toRouteStops = (trip: Trip): RouteStop[] | null => {
  const stops = Array.isArray(trip?.stops) ? trip.stops : [];
  if (!stops.length) return null;

  const ordered = [...stops].sort(
    (a, b) =>
      (a.sequence ?? a.tripSequence ?? 0) - (b.sequence ?? b.tripSequence ?? 0),
  );

  return [
    {kind: 'current'},
    ...ordered.map((stop): RouteStop => ({
      kind: isDrop(stop.type) ? 'drop' : 'pickup',
      // The marker icon and the ROUTE summary already say pickup vs drop, so
      // the name line is worth more as the actual street address.
      label: stop.address || undefined,
      sub: timeWindow(stop),
    })),
  ];
};

/**
 * The four figures under the route box.
 *
 * `remainingDistance`, `remainingETA` and `deadMiles` are only computed when
 * the request carried the truck's coordinate — without a fix the backend
 * sends them as null. Each falls back to the trip-wide figure so the row
 * never shows a column of dashes.
 */
export const toTripStats = (trip: Trip) => {
  const deadMiles = trip?.deadMiles;

  return [
    {label: 'Distance', value: formatMiles(trip?.totalMiles)},
    {label: 'Est. time', value: formatMinutes(trip?.estimatedTripMinutes)},
    {label: 'Date', value: formatTripDate(trip?.date)},
    // Null unless the request carried a routable coordinate — the backend
    // measures this from the truck to the pickup.
    {label: 'Dead miles', value: formatMiles(deadMiles)},
  ];
};

/** Hours-of-service row inside the card: text plus bar width. */
export const toHosProgress = (
  trip: Trip,
): {label: string; width: `${number}%`} => {
  const remaining = trip?.remainingHosMinutes;
  // Null means the backend has no ELD hours for this driver — an empty bar
  // says that honestly, where a leftover mock figure would not.
  if (!isNumber(remaining)) return {label: 'Not available', width: '0%'};
  const minutes = Math.max(0, Number(remaining));
  const percent = Math.min(100, Math.round((minutes / HOS_CYCLE_MINUTES) * 100));
  return {label: `${formatMinutes(minutes)} left`, width: `${percent}%`};
};
export const toDestination = (trip: Trip) => {
  const stops = Array.isArray(trip?.stops) ? trip.stops : [];
  const drops = stops.filter(stop => isDrop(stop.type));
  const last = (drops.length ? drops : stops)
    .slice()
    .sort(
      (a, b) =>
        (a.sequence ?? a.tripSequence ?? 0) - (b.sequence ?? b.tripSequence ?? 0),
    )
    .pop();

  if (!last || !isNumber(last.lat) || !isNumber(last.lon)) return null;

  return {
    destinationLocation: {
      latitude: Number(last.lat),
      longitude: Number(last.lon),
      description: last.address || 'Drop location',
    },
    destinationText: last.address || 'Drop location',
  };
};

/**
 * Best-effort coordinate for the request. `lat`/`lon` are optional on the
 * endpoint, so this never alerts, never asks for a permission the driver has
 * not already given, and never throws — a missing fix simply means the trip is
 * fetched without one.
 *
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
 * Loads the driver's current trip and keeps it in state.
 *
 * @param {string} tripId trip to load; nothing is fetched while it is empty
 * @returns {{trip: object|null, loading: boolean, error: string|null,
 *            refresh: () => Promise<object|null>}}
 */
export function useCurrentTrip(tripId?: string | null) {
  const [trip, setTrip] = useState<CurrentTrip | null>(null);
  const [loading, setLoading] = useState(Boolean(tripId));
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const requestRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!tripId) {
      setTrip(null);
      setLoading(false);
      return null;
    }

    const requestId = ++requestRef.current;
    setLoading(true);
    setError(null);

    try {
      const coordinates = await resolveCoordinates();
      const data = await getCurrentTrip({tripId, ...coordinates});

      if (!mountedRef.current || requestId !== requestRef.current) return data;
      setTrip(data ?? null);
      return data;
    } catch (e) {
      const err = e as AxiosError<ApiErrorBody> & ErrorLike;
      if (mountedRef.current && requestId === requestRef.current) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            'Could not load your current trip.',
        );
      }
      return null;
    } finally {
      if (mountedRef.current && requestId === requestRef.current) {
        setLoading(false);
      }
    }
  }, [tripId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {trip, loading, error, refresh};
}
