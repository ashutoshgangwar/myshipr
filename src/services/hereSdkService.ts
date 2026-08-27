import {NativeModules} from 'react-native';

import type {LatLng} from '../types/common';

/**
 * A place as the native HERE module returns it, or a bare coordinate.
 *
 * Deliberately loose: `normalizeLocationCoords` exists precisely because the
 * SDK hands back three different spellings (`access[]`, `latitude/longitude`,
 * `lat/lng`), and its job is to accept all of them.
 */
export interface HerePlaceLike {
  access?: Array<{lat?: number; lng?: number; latitude?: number; longitude?: number}>;
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  [key: string]: unknown;
}

/** A stop on a calculated route; `passThrough` skips the arrival event. */
export interface RouteWaypoint extends HerePlaceLike {
  passThrough?: boolean;
}

/** Arguments accepted by [calculateRoute]. */
export interface CalculateRouteParams {
  origin: HerePlaceLike;
  destination: HerePlaceLike;
  waypoints?: RouteWaypoint[];
  transportMode?:
    | 'truck' | 'car' | 'pedestrian' | 'scooter' | 'bicycle' | 'bus' | 'taxi';
  isElectric?: boolean;
  /** kg + cm, as collected by TruckParamsForm. */
  vehicle?: object;
  ev?: Record<string, unknown>;
  routeOptions?: Record<string, unknown>;
  avoid?: {features?: string[]};
  walkSpeedMps?: number;
}


import HereSdk from '../here/HereSdk';

const {HereMapModule} = NativeModules;

if (!HereMapModule) {
  console.warn(
    '[HERE] Native HereMapModule is missing. Rebuild the app — the HERE SDK ' +
      'search/routing calls will all reject until it is linked.',
  );
}

/** Bias point used when the caller has no GPS fix yet (Delhi NCR). */
export const HERE_DEFAULT_COORDS = {latitude: 28.4595, longitude: 77.0266};

/**
 * Creates the shared HERE engine the search calls below run on.
 *
 * There is one engine per process and whoever makes it decides its options, so
 * this delegates to `HereSdk.initialize()` rather than making its own: that is
 * the path that passes HERE_SCOPE, and without the scope a project-issued key
 * gets a 403 from the map-data catalog — a blank base map everywhere, while
 * search and routing carry on working and hide the cause.
 */
export function ensureInitialized() {
  return HereSdk.ensureInitialized();
}

async function ready(name: string): Promise<void> {
  await ensureInitialized();
  if (typeof (HereMapModule as Record<string, unknown>)[name] !== 'function') {
    throw new Error(`[HERE] HereMapModule.${name} is unavailable — rebuild the app`);
  }
}

function areaOptions(coords: {latitude?: number; longitude?: number} | null): LatLng {
  const lat = coords?.latitude;
  const lng = coords?.longitude;
  if (typeof lat === 'number' && Number.isFinite(lat) &&
      typeof lng === 'number' && Number.isFinite(lng)) {
    return {lat, lng};
  }
  return {lat: HERE_DEFAULT_COORDS.latitude, lng: HERE_DEFAULT_COORDS.longitude};
}

function logFailure(operation: string, error: unknown): void {
  console.warn(
    `[HERE:${operation}] failed —`,
    (error as {message?: string})?.message || error,
  );
}

export async function autosuggest(
  query: string,
  coords: {latitude?: number; longitude?: number} | null = null,
  limit: number = 5,
) {
  if (!query || query.trim().length === 0) return [];

  try {
    await ready('suggest');
    const items = await HereMapModule.suggest({
      query,
      limit,
      ...areaOptions(coords),
    });
    return (items || []).filter(
      (item: HerePlaceLike) =>
        item.latitude != null || (item.access && item.access.length > 0),
    );
  } catch (e) {
    logFailure('autosuggest', e);
    return [];
  }
}

/** Free-text place search — unlike [autosuggest] every result has a coordinate. */
export async function searchPlaces(
  query: string,
  coords: {latitude?: number; longitude?: number} | null = null,
  limit: number = 10,
) {
  if (!query || query.trim().length === 0) return [];

  try {
    await ready('searchByText');
    return (await HereMapModule.searchByText({query, limit, ...areaOptions(coords)})) || [];
  } catch (e) {
    logFailure('searchPlaces', e);
    return [];
  }
}
export async function searchPOIs(
  categories: string | string[],
  coords: {latitude?: number; longitude?: number} | null = null,
  {limit = 20, filter}: {limit?: number; filter?: unknown} = {},
) {
  const ids = (Array.isArray(categories) ? categories : [categories]).filter(Boolean);
  if (ids.length === 0) return [];

  try {
    await ready('searchByCategory');
    return (
      (await HereMapModule.searchByCategory({
        categories: ids,
        limit,
        ...(filter ? {filter} : {}),
        ...areaOptions(coords),
      })) || []
    );
  } catch (e) {
    logFailure('searchPOIs', e);
    return [];
  }
}

/** Forward geocoding: address text → `[place]` (closest match first). */
export async function geocode(
  query: string,
  coords: {latitude?: number; longitude?: number} | null = null,
  limit: number = 5,
) {
  try {
    await ready('geocode');
    return (await HereMapModule.geocode({query, limit, ...areaOptions(coords)})) || [];
  } catch (e) {
    logFailure('geocode', e);
    return [];
  }
}

export async function reverseGeocode(coords: {
  latitude?: number;
  longitude?: number;
} | null | undefined) {
  if (
    !coords ||
    !Number.isFinite(coords.latitude) ||
    !Number.isFinite(coords.longitude)
  ) {
    return null;
  }

  try {
    await ready('reverseGeocode');
    return await HereMapModule.reverseGeocode({
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
  } catch (e) {
    logFailure('reverseGeocode', e);
    return null;
  }
}

/** Resolves a place id from [autosuggest] to its full details, or null. */
export async function lookup(placeId: string | null | undefined) {
  if (!placeId) return null;

  try {
    await ready('lookupPlace');
    return await HereMapModule.lookupPlace({id: placeId});
  } catch (e) {
    logFailure('lookup', e);
    return null;
  }
}

export function normalizeLocationCoords(
  location: HerePlaceLike | null | undefined,
): LatLng | null {
  if (!location) return null;

  // A local finite-number narrowing helper — same test as before, but it
  // tells the compiler the value really is a `number` afterwards.
  const finite = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value);

  if (location.access && location.access.length) {
    const point = location.access[0];
    const lat = finite(point.lat) ? point.lat : point.latitude;
    const lng = finite(point.lng) ? point.lng : point.longitude;
    if (finite(lat) && finite(lng)) return {lat, lng};
  }

  if (finite(location.latitude) && finite(location.longitude)) {
    return {lat: location.latitude, lng: location.longitude};
  }

  if (finite(location.lat) && finite(location.lng)) {
    return {lat: location.lat, lng: location.lng};
  }

  return null;
}

/**
 * Calculates a route with the native RoutingEngine.
 *
 * See {@link CalculateRouteParams} for what each argument does.
 */
export async function calculateRoute({
  origin,
  destination,
  waypoints = [],
  transportMode = 'truck',
  isElectric = false,
  vehicle = {},
  ev,
  routeOptions,
  avoid,
  walkSpeedMps,
}: CalculateRouteParams) {
  await ready('calculateRouteWithOptions');

  const originCoords = normalizeLocationCoords(origin);
  const destCoords = normalizeLocationCoords(destination);
  if (!originCoords || !destCoords) {
    throw new Error('HERE route error: origin/destination coordinates are invalid');
  }

  return HereMapModule.calculateRouteWithOptions({
    origin: originCoords,
    destination: destCoords,
    waypoints: waypoints
      .map((stop: RouteWaypoint) => {
        const coords = normalizeLocationCoords(stop);
        return coords ? {...coords, passThrough: !!stop?.passThrough} : null;
      })
      .filter(Boolean),
    transportMode,
    isElectric,
    vehicle,
    ...(ev ? {ev} : {}),
    ...(routeOptions ? {routeOptions} : {}),
    ...(avoid ? {avoid} : {}),
    ...(walkSpeedMps != null ? {walkSpeedMps} : {}),
  });
}
export function optimizeWaypointOrder(params: CalculateRouteParams) {
  return calculateRoute({
    ...params,
    routeOptions: {...(params.routeOptions || {}), optimizeWaypointsOrder: true},
  });
}

export default {
  autosuggest,
  searchPlaces,
  searchPOIs,
  geocode,
  reverseGeocode,
  lookup,
  calculateRoute,
  optimizeWaypointOrder,
  normalizeLocationCoords,
  ensureInitialized,
};
