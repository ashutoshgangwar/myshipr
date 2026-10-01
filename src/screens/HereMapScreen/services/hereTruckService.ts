
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  autosuggest,
  calculateRoute,
  geocode,
  lookup,
  normalizeLocationCoords,
  optimizeWaypointOrder,
  reverseGeocode,
  searchPOIs,
  searchPlaces,
} from '../../../services/hereSdkService';
import type {HerePlaceLike} from '../../../services/hereSdkService';
import type {ErrorLike} from '../../../types/common';

/**
 * A route as the HERE SDK returns it, before this module reshapes it into the
 * REST-compatible form the screens read. Described only as deeply as it walks.
 */
interface SdkSection {
  transportMode?: string;
  coordinates?: unknown[];
  actions?: unknown[];
  tolls?: unknown[];
  departureTime?: {utcTimeMs?: number; localTimeMs?: number};
  arrivalTime?: {utcTimeMs?: number; localTimeMs?: number};
  [key: string]: unknown;
}

interface SdkRoute {
  sections?: SdkSection[];
  coordinates?: unknown[];
  durationSeconds?: number;
  baseDurationSeconds?: number;
  tolls?: {total?: number; currency?: string};
  [key: string]: unknown;
}

export {
  autosuggest,
  geocode,
  lookup,
  optimizeWaypointOrder,
  reverseGeocode,
  searchPOIs,
  searchPlaces,
  calculateRoute,
};

// ─────────────────────────────────────────────────────────────────────────────
// REST-compatible route shape
// ─────────────────────────────────────────────────────────────────────────────

function toIsoString(
  time?: {utcTimeMs?: number; localTimeMs?: number} | null,
): string | null {
  const ms = time?.utcTimeMs ?? time?.localTimeMs;
  return typeof ms === 'number' && Number.isFinite(ms)
    ? new Date(ms).toISOString()
    : null;
}

function toRestShapedRoute(route?: SdkRoute | null) {
  if (!route) return null;

  return {
    routes: [
      {
        id: 'here-sdk-route',
        sections: (route.sections || []).map((section: SdkSection) => ({
          type: 'vehicle',
          transport: {mode: section.transportMode},
          polyline: section.coordinates || [],
          actions: section.actions || [],
          tolls: section.tolls || [],
          departure: {
            time: toIsoString(section.departureTime),
            place: section.departure || null,
          },
          arrival: {
            time: toIsoString(section.arrivalTime),
            place: section.arrival || null,
          },
          summary: {
            length: section.distanceMeters,
            duration: section.durationSeconds,
            baseDuration: section.baseDurationSeconds,
            ...(route.tolls?.total != null
              ? {tolls: {total: {value: route.tolls.total, currency: route.tolls.currency}}}
              : {}),
          },
        })),
      },
    ],
  };
}


export async function calculateTruckRoute(
  origin: HerePlaceLike,
  destination: HerePlaceLike,
  vehicle: object = {},
) {
  const {routes} = await calculateRoute({
    origin,
    destination,
    transportMode: 'truck',
    vehicle,
  });
  return toRestShapedRoute(routes?.[0]);
}

export const calculateTruckRouteREST = calculateTruckRoute;

export async function calculateRouteTolls(
  origin: HerePlaceLike,
  destination: HerePlaceLike,
  currency: string = 'USD',
  vehicle: object = {},
) {
  if (!origin || !destination) return null;

  const originCoords = normalizeLocationCoords(origin);
  const destCoords = normalizeLocationCoords(destination);
  if (!originCoords || !destCoords) return null;

  try {
    const {routes} = await calculateRoute({
      origin: originCoords,
      destination: destCoords,
      transportMode: 'truck',
      vehicle,
      routeOptions: {enableTolls: true},
    });

    const route = routes?.[0];
    if (!route) return null;

    const firstSection = route.sections?.[0] || {};
    const normalized = {
      raw: toRestShapedRoute(route),
      route,
      total: route.tolls?.total ?? null,
      currency: route.tolls?.currency ?? (route.tolls?.total != null ? null : currency),
      tolls: (route.sections || []).flatMap(
        (section: SdkSection) => section.tolls || [],
      ),
      polyline: route.coordinates || [],
      actions: firstSection.actions || [],
      travelTimeSeconds: route.durationSeconds ?? null,
      baseDurationSeconds: route.baseDurationSeconds ?? null,
      distanceMeters: route.distanceMeters ?? null,
      departureTime: toIsoString(firstSection.departureTime),
      arrivalTime: toIsoString(
        route.sections?.[route.sections.length - 1]?.arrivalTime,
      ),
    };

    await AsyncStorage.setItem('here_last_tolls', JSON.stringify(normalized));

    return normalized;
  } catch (e) {
    const err = e as ErrorLike;
    console.error('❌ HERE toll route failed —', err?.message || e);
    throw new Error(`HERE toll route error: ${err?.message || e}`);
  }
}

export default {
  autosuggest,
  reverseGeocode,
  lookup,
  geocode,
  searchPlaces,
  searchPOIs,
  calculateRoute,
  calculateTruckRoute,
  calculateRouteTolls,
  optimizeWaypointOrder,
};
