// Shared pure helpers and constants for the Radar map / live-navigation screen.

// Radar returns encoded polylines at precision 6 (1e6).
export function decodePolyline(encoded, precision = 6) {
  if (!encoded) return [];
  const factor = Math.pow(10, precision);
  const coordinates = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    // GeoJSON order: [longitude, latitude]
    coordinates.push([lng / factor, lat / factor]);
  }
  return coordinates;
}

// Great-circle distance between two [lng, lat] points, in metres.
export function haversineMeters(a, b) {
  if (!a || !b) return Infinity;
  const toRad = d => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Imperial formatting to match the &units=imperial route response.
export function formatDistance(meters) {
  if (!Number.isFinite(meters)) return '';
  const feet = meters * 3.28084;
  if (feet < 1000) return `${Math.max(0, Math.round(feet / 10) * 10)} ft`;
  return `${(feet / 5280).toFixed(1)} mi`;
}

export function formatDuration(mins) {
  if (!Number.isFinite(mins)) return '';
  if (mins < 1) return '<1 min';
  return `${Math.round(mins)} min`;
}

// Flatten the turn-by-turn steps across every leg of a Radar route. Each step
// carries banner_instructions (short, on-screen) and voice_instructions (spoken
// cue), plus the maneuver point (end_location) used to advance live navigation.
export function extractSteps(route) {
  return (route?.legs || []).flatMap(leg =>
    (leg?.steps || []).map(s => ({
      banner: s.banner_instructions,
      voice: s.voice_instructions,
      instructions: s.instructions,
      maneuver: s.manuever, // note: Radar spells it "manuever"
      streetName: s.street_name,
      distance: s.distance?.text,
      duration: s.duration?.text,
      distanceValue: s.distance?.value ?? 0, // metres
      durationValue: s.duration?.value ?? 0, // minutes
      // GeoJSON order [lng, lat] so it matches the polyline coordinates.
      start: s.start_location
        ? [s.start_location.longitude, s.start_location.latitude]
        : null,
      end: s.end_location
        ? [s.end_location.longitude, s.end_location.latitude]
        : null,
    })),
  );
}

// A glanceable arrow per Radar maneuver type for the navigation banner.
export const MANEUVER_ICON = {
  start: '•',
  straight: '↑',
  left: '↰',
  right: '↱',
  'turn-left': '↰',
  'turn-right': '↱',
  'slight-left': '↖',
  'slight-right': '↗',
  'sharp-left': '⬅',
  'sharp-right': '➡',
  'stay-left': '↖',
  'stay-right': '↗',
  'ramp-left': '↖',
  'ramp-right': '↗',
  'exit-left': '↰',
  'exit-right': '↱',
  uturn: '↩',
  destination: '🏁',
  'destination-left': '🏁',
  'destination-right': '🏁',
};

// How close (metres) the user must get to a maneuver point before we advance to
// the next step, and how close to the final point to declare arrival.
export const ADVANCE_THRESHOLD_M = 30;
export const ARRIVE_THRESHOLD_M = 25;
