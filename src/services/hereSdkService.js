import {NativeModules} from 'react-native';
import {HERE_ACCESS_KEY_ID, HERE_ACCESS_KEY_SECRET} from '@env';

const {HereMapModule} = NativeModules;

if (!HereMapModule) {
  console.warn(
    '[HERE] Native HereMapModule is missing. Rebuild the app — the HERE SDK ' +
      'search/routing calls will all reject until it is linked.',
  );
}

/** Bias point used when the caller has no GPS fix yet (Delhi NCR). */
export const HERE_DEFAULT_COORDS = {latitude: 28.4595, longitude: 77.0266};

let initPromise = null;
export function ensureInitialized() {
  if (!HereMapModule?.initSDK) {
    return Promise.reject(
      new Error('[HERE] Native HereMapModule is unavailable — rebuild the app'),
    );
  }
  if (!HERE_ACCESS_KEY_ID || !HERE_ACCESS_KEY_SECRET) {
    return Promise.reject(
      new Error(
        '[HERE] HERE_ACCESS_KEY_ID/SECRET missing from the bundle — rebuild ' +
          'after `npm start --reset-cache`',
      ),
    );
  }
  if (!initPromise) {
    initPromise = HereMapModule.initSDK(
      HERE_ACCESS_KEY_ID,
      HERE_ACCESS_KEY_SECRET,
    ).catch(e => {
      initPromise = null;
      throw e;
    });
  }
  return initPromise;
}

async function ready(name) {
  await ensureInitialized();
  if (typeof HereMapModule[name] !== 'function') {
    throw new Error(`[HERE] HereMapModule.${name} is unavailable — rebuild the app`);
  }
}

function areaOptions(coords) {
  if (
    coords &&
    Number.isFinite(coords.latitude) &&
    Number.isFinite(coords.longitude)
  ) {
    return {lat: coords.latitude, lng: coords.longitude};
  }
  return {lat: HERE_DEFAULT_COORDS.latitude, lng: HERE_DEFAULT_COORDS.longitude};
}

function logFailure(operation, error) {
  console.warn(`[HERE:${operation}] failed —`, error?.message || error);
}

export async function autosuggest(query, coords = null, limit = 5) {
  if (!query || query.trim().length === 0) return [];

  try {
    await ready('suggest');
    const items = await HereMapModule.suggest({
      query,
      limit,
      ...areaOptions(coords),
    });
    return (items || []).filter(
      item => item.latitude != null || (item.access && item.access.length > 0),
    );
  } catch (e) {
    logFailure('autosuggest', e);
    return [];
  }
}

/** Free-text place search — unlike [autosuggest] every result has a coordinate. */
export async function searchPlaces(query, coords = null, limit = 10) {
  if (!query || query.trim().length === 0) return [];

  try {
    await ready('searchByText');
    return (await HereMapModule.searchByText({query, limit, ...areaOptions(coords)})) || [];
  } catch (e) {
    logFailure('searchPlaces', e);
    return [];
  }
}
export async function searchPOIs(categories, coords = null, {limit = 20, filter} = {}) {
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
export async function geocode(query, coords = null, limit = 5) {
  try {
    await ready('geocode');
    return (await HereMapModule.geocode({query, limit, ...areaOptions(coords)})) || [];
  } catch (e) {
    logFailure('geocode', e);
    return [];
  }
}

export async function reverseGeocode(coords) {
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
export async function lookup(placeId) {
  if (!placeId) return null;

  try {
    await ready('lookupPlace');
    return await HereMapModule.lookupPlace({id: placeId});
  } catch (e) {
    logFailure('lookup', e);
    return null;
  }
}

export function normalizeLocationCoords(location) {
  if (!location) return null;

  if (location.access && location.access.length) {
    const point = location.access[0];
    const lat = Number.isFinite(point.lat) ? point.lat : point.latitude;
    const lng = Number.isFinite(point.lng) ? point.lng : point.longitude;
    if (Number.isFinite(lat) && Number.isFinite(lng)) return {lat, lng};
  }

  if (Number.isFinite(location.latitude) && Number.isFinite(location.longitude)) {
    return {lat: location.latitude, lng: location.longitude};
  }

  if (Number.isFinite(location.lat) && Number.isFinite(location.lng)) {
    return {lat: location.lat, lng: location.lng};
  }

  return null;
}

/**
 * Calculates a route with the native RoutingEngine.
 *
 * @param {object} params
 * @param {object} params.origin        place / {latitude,longitude} / {lat,lng}
 * @param {object} params.destination   same
 * @param {Array}  [params.waypoints]   intermediate stops, `{...coords, passThrough?}`
 * @param {string} [params.transportMode] 'truck' (default) | 'car' | 'pedestrian' |
 *                                        'scooter' | 'bicycle' | 'bus' | 'taxi'
 * @param {boolean}[params.isElectric]  EV routing for car / truck
 * @param {object} [params.vehicle]     kg + cm, as collected by TruckParamsForm
 * @param {object} [params.ev]          battery specs for EV routing
 * @param {object} [params.routeOptions] alternatives / tolls / departureTime / …
 * @param {object} [params.avoid]       `{features: ['tollRoad', 'ferry', …]}`
 * @returns {Promise<{routes: Array}>}
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
}) {
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
      .map(stop => {
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
export function optimizeWaypointOrder(params) {
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
