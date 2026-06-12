import axios from 'axios';
import {Platform} from 'react-native';
import {HERE_API_KEY} from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HERE_KEY = HERE_API_KEY;

// Surfaces the real cause of HERE failures (esp. iOS, where errors were
// previously swallowed). If the key is missing the bundle never got the
// @env value at build time -> rebuild after clearing Metro cache.
if (!HERE_KEY) {
  console.warn(
    `[HERE] HERE_API_KEY is undefined on ${Platform.OS}. ` +
      `@env was not injected into this build — rebuild after ` +
      `\`npm start --reset-cache\`. All HERE requests will 401.`,
  );
}

function logHereError(fnName, e) {
  console.warn(
    `[HERE:${fnName}] failed on ${Platform.OS} —`,
    'status:', e?.response?.status,
    'code:', e?.code,
    'data:', e?.response?.data || e?.message,
    'keyPresent:', !!HERE_KEY,
  );
}

// A bare "Network Error" means no HTTP response was received (connection-level
// failure / timeout / debugger proxy choking on a large response). Retry once
// for those transient cases; a real HTTP error (has e.response) is not retried.
async function hereGet(url, {timeout = 20000, retries = 1} = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await axios.get(url, {timeout});
    } catch (e) {
      lastErr = e;
      if (e?.response) throw e; // server replied with an error — don't retry
      console.warn(
        `[HERE] network attempt ${attempt + 1}/${retries + 1} failed on ` +
          `${Platform.OS} (code: ${e?.code || 'n/a'}) — retrying`,
      );
    }
  }
  throw lastErr;
}

export async function autosuggest(query, coords = null, limit = 5) {
  if (!query || query.trim().length === 0) return [];

  const at =
    coords &&
    Number.isFinite(coords.latitude) &&
    Number.isFinite(coords.longitude)
      ? `${coords.latitude},${coords.longitude}`
      : '0,0';

  const url = `https://autosuggest.search.hereapi.com/v1/autosuggest?q=${encodeURIComponent(
    query,
  )}&at=${at}&limit=${limit}&apiKey=${HERE_KEY}`;

  try {
    const res = await axios.get(url);

    const json = res.data;

    const items = (json.items || [])
      .map(item => ({
        id: item.id,
        title: item.title,
        address: item.address?.label || item.title,
        latitude: item.position?.lat,
        longitude: item.position?.lng,
        access: item.access || [],
      }))
      .filter(i => i.latitude || (i.access && i.access.length));

    return items;
  } catch (e) {
    logHereError('autosuggest', e);
    return [];
  }
}

export async function lookup(placeId) {
  if (!placeId) return null;

  const url = `https://lookup.search.hereapi.com/v1/lookup?id=${encodeURIComponent(
    placeId,
  )}&apiKey=${HERE_KEY}`;

  try {
    const res = await axios.get(url);

    return res.data;
  } catch (e) {
    logHereError('lookup', e);
    return null;
  }
}

function normalizeLocationCoords(location) {
  if (!location) return null;

  if (location.access && location.access.length) {
    const point = location.access[0];
    return {
      lat: Number.isFinite(point.lat) ? point.lat : point.latitude,
      lng: Number.isFinite(point.lng) ? point.lng : point.longitude,
    };
  }

  if (
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude)
  ) {
    return {lat: location.latitude, lng: location.longitude};
  }

  if (Number.isFinite(location.lat) && Number.isFinite(location.lng)) {
    return {lat: location.lat, lng: location.lng};
  }

  return null;
}

function appendTruckVehicleParams(params, vehicle = {}) {
  if (vehicle.grossWeight) {
    params.append('vehicle[grossWeight]', String(vehicle.grossWeight));
  }

  if (vehicle.currentWeight) {
    params.append('vehicle[currentWeight]', String(vehicle.currentWeight));
  } else if (vehicle.grossWeight) {
    params.append('vehicle[currentWeight]', String(vehicle.grossWeight));
  }

  if (vehicle.height) {
    params.append('vehicle[height]', String(vehicle.height));
  }

  if (vehicle.width) {
    params.append('vehicle[width]', String(vehicle.width));
  }

  if (vehicle.length) {
    params.append('vehicle[length]', String(vehicle.length));
  }

  if (vehicle.axleCount) {
    params.append('vehicle[axleCount]', String(vehicle.axleCount));
  }

  if (vehicle.trailerCount) {
    params.append('vehicle[trailerCount]', String(vehicle.trailerCount));
  }

  if (vehicle.weightPerAxle) {
    params.append('vehicle[weightPerAxle]', String(vehicle.weightPerAxle));
  }
}

export async function findSequence(params) {
  const searchParams = new URLSearchParams();

  Object.keys(params).forEach(k => searchParams.append(k, params[k]));

  searchParams.append('apikey', HERE_KEY);

  const url = `https://wps.hereapi.com/v8/findsequence2?${searchParams.toString()}`;

  try {
    const res = await axios.get(url);
    return res.data;
  } catch (e) {
    logHereError('findSequence', e);
    throw new Error('WPS findsequence failed');
  }
}

export async function calculateRouteTolls(
  origin,
  destination,
  currency = 'USD',
  vehicle = {},
) {
  if (!origin || !destination) return null;

  console.log("vehicle params received:", JSON.stringify(vehicle));

  const originCoords = normalizeLocationCoords(origin);
  const destCoords = normalizeLocationCoords(destination);

  if (!originCoords || !destCoords) {
    return null;
  }

  const params = new URLSearchParams();

  params.append('transportMode', 'truck');
  params.append('origin', `${originCoords.lat},${originCoords.lng}`);
  params.append('destination', `${destCoords.lat},${destCoords.lng}`);
  params.append('return', 'tolls,summary,polyline,actions,instructions');
  params.append('currency', currency);
  params.append('tolls[summaries]', 'total');

  appendTruckVehicleParams(params, vehicle);

  params.append('apiKey', HERE_KEY);

  const url = `https://router.hereapi.com/v8/routes?${params.toString()}`;

  console.log('Toll URL:', url);

  try {
    const {data} = await hereGet(url);

    const route = data?.routes?.[0];
    const section = route?.sections?.[0];

    if (!route || !section) {
      return null;
    }

    const normalized = {
      raw: data,
      total: section?.summary?.tolls?.total?.value ?? null,
      currency: section?.summary?.tolls?.total?.currency ?? null,
      tolls: section?.tolls ?? [],
      polyline: section?.polyline ?? null,
      actions: section?.actions ?? [],
      travelTimeSeconds: section?.summary?.duration ?? null,
      baseDurationSeconds: section?.summary?.baseDuration ?? null,
      distanceMeters: section?.summary?.length ?? null,
      departureTime: section?.departure?.time ?? null,
      arrivalTime: section?.arrival?.time ?? null,
    };

    await AsyncStorage.setItem(
      'here_last_tolls',
      JSON.stringify(normalized),
    );

    console.log('Route Toll Result', {
      total: normalized.total,
      distanceMeters: normalized.distanceMeters,
      travelTimeSeconds: normalized.travelTimeSeconds,
    });

    return normalized;
  } catch (e) {
    console.error(
      '❌ HERE Toll Error',
      'status:', e?.response?.status,
      'code:', e?.code,
      'data:', e?.response?.data || e?.message,
      'keyPresent:', !!HERE_KEY,
    );

    throw new Error(
      `HERE toll route error: ${JSON.stringify(
        e?.response?.data || e?.message,
      )}`,
    );
  }
}

export default {
  autosuggest,
  lookup,
  findSequence,
  calculateRouteTolls,
};