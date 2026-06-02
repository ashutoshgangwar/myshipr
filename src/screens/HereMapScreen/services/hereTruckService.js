import axios from 'axios';
import { HERE_API_KEY } from '@env';

const HERE_KEY = HERE_API_KEY;

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
    return null;
  }
}

export async function calculateTruckRouteREST(
  origin,
  destination,
  vehicle = {},
) {
  if (!origin || !destination) return null;

  const originCoords =
    origin.access && origin.access.length
      ? origin.access[0]
      : {
          lat: origin.latitude,
          lng: origin.longitude,
        };

  const destCoords =
    destination.access && destination.access.length
      ? destination.access[0]
      : {
          lat: destination.latitude,
          lng: destination.longitude,
        };

  const params = new URLSearchParams();

  params.append('transportMode', 'truck');
  params.append('routingMode', 'fast');

  params.append(
    'origin',
    `${originCoords.lat},${originCoords.lng}`,
  );

  params.append(
    'destination',
    `${destCoords.lat},${destCoords.lng}`,
  );

  params.append(
    'return',
    'summary,polyline,actions,instructions',
  );

  // vehicle params: currentWeight (kg), height (cm), width (cm), length (cm)

  if (vehicle.currentWeight) {
    params.append(
      'vehicle[currentWeight]',
      String(vehicle.currentWeight),
    );
  }

  if (vehicle.height) {
    params.append(
      'vehicle[height]',
      String(vehicle.height),
    );
  }

  if (vehicle.width) {
    params.append(
      'vehicle[width]',
      String(vehicle.width),
    );
  }

  if (vehicle.length) {
    params.append(
      'vehicle[length]',
      String(vehicle.length),
    );
  }

  params.append('apiKey', HERE_KEY);

  const url = `https://router.hereapi.com/v8/routes?${params.toString()}`;

  try {
    const res = await axios.get(url);

    return res.data;
  } catch (e) {
    const errorText =
      e?.response?.data || e.message;

    throw new Error(
      `HERE route error: ${JSON.stringify(errorText)}`,
    );
  }
}

export async function findSequence(params) {
  const searchParams = new URLSearchParams();

  Object.keys(params).forEach(k =>
    searchParams.append(k, params[k]),
  );

  searchParams.append('apikey', HERE_KEY);

  const url = `https://wps.hereapi.com/v8/findsequence2?${searchParams.toString()}`;

  try {
    const res = await axios.get(url);

    return res.data;
  } catch (e) {
    throw new Error('WPS findsequence failed');
  }
}


export async function calculateRouteTolls(
  origin,
  destination,
  currency = 'USD',
) {
  if (!origin || !destination) return null;

  const params = new URLSearchParams();

  params.append(
    'origin',
    `${origin.latitude},${origin.longitude}`,
  );

  params.append(
    'destination',
    `${destination.latitude},${destination.longitude}`,
  );

  params.append('transportMode', 'truck');
  params.append('routingMode', 'fast');
  params.append('return', 'tolls');
  params.append('currency', currency);
  params.append('apiKey', HERE_KEY);

  const url = `https://router.hereapi.com/v8/routes?${params.toString()}`;

  try {
    const res = await axios.get(url);

    console.log(
      '🛣️ Toll API Response:',
      JSON.stringify(res.data, null, 2),
    );

    return res.data;
  } catch (e) {
    console.error(
      '❌ Toll API Error:',
      e?.response?.data || e.message,
    );

    throw new Error(
      `HERE toll route error: ${JSON.stringify(
        e?.response?.data || e.message,
      )}`,
    );
  }
}

export default {
  autosuggest,
  lookup,
  calculateTruckRouteREST,
  findSequence,
  calculateRouteTolls
};