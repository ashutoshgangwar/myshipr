
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

function toIsoString(time) {
  const ms = time?.utcTimeMs ?? time?.localTimeMs;
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

function toRestShapedRoute(route) {
  if (!route) return null;

  return {
    routes: [
      {
        id: 'here-sdk-route',
        sections: (route.sections || []).map(section => ({
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


export async function calculateTruckRoute(origin, destination, vehicle = {}) {
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
  origin,
  destination,
  currency = 'USD',
  vehicle = {},
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
      tolls: (route.sections || []).flatMap(section => section.tolls || []),
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
    console.error('❌ HERE toll route failed —', e?.message || e);
    throw new Error(`HERE toll route error: ${e?.message || e}`);
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
