// Radar geocoding / autocomplete helpers shared by the Radar setup screen and
// the Radar map screen, so both run the same place search against Radar.
import {RADAR_PUBLISHABLE_KEY} from '@env';

// Autocomplete addresses/places for a query, optionally biased toward `near`
// ({latitude, longitude}). Returns Radar's `addresses` array.
export async function fetchAutocomplete(query, near = null) {
  let url =
    'https://api.radar.io/v1/search/autocomplete' +
    `?query=${encodeURIComponent(query)}` +
    '&layers=address,place,locality' +
    '&limit=6';
  if (near && Number.isFinite(near.latitude) && Number.isFinite(near.longitude)) {
    url += `&near=${near.latitude},${near.longitude}`;
  }
  const res = await fetch(url, {
    headers: {Authorization: RADAR_PUBLISHABLE_KEY},
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.meta?.message || `HTTP ${res.status}`);
  }
  return data?.addresses || [];
}

// Reverse-geocode a coordinate to a human-readable address (best effort).
export async function reverseGeocode(latitude, longitude) {
  try {
    const url =
      'https://api.radar.io/v1/geocode/reverse' +
      `?coordinates=${latitude},${longitude}`;
    const res = await fetch(url, {
      headers: {Authorization: RADAR_PUBLISHABLE_KEY},
    });
    const data = await res.json();
    return data?.addresses?.[0]?.formattedAddress || null;
  } catch (e) {
    return null;
  }
}

// Normalize a Radar autocomplete result into the {latitude, longitude, label}
// shape the screens use for source/destination coordinates.
export function placeToCoord(item) {
  const label =
    item.placeLabel || item.formattedAddress || item.street || 'Selected';
  return {
    latitude: item.latitude,
    longitude: item.longitude,
    label,
  };
}
