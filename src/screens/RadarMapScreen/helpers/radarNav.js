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

// Bearing (compass degrees, 0=N) from point a to point b, both [lng, lat].
// Used to point the camera in the direction of travel ("heading-up").
export function bearing(a, b) {
  if (!a || !b) return 0;
  const toRad = d => (d * Math.PI) / 180;
  const toDeg = r => (r * 180) / Math.PI;
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const dLng = toRad(b[0] - a[0]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Low-pass filter for a compass angle: nudge `current` toward `target` by
// `alpha`, taking the shortest way around the 0/360 wrap. Smooths the noisy
// per-fix GPS heading so the heading-up camera glides instead of shivering.
export function smoothAngle(current, target, alpha = 0.25) {
  const diff = ((target - current + 540) % 360) - 180; // shortest signed delta
  return (current + alpha * diff + 360) % 360;
}

// Project [lng, lat] into local planar metres around refLat (equirectangular).
function toXY(p, refLat) {
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos((refLat * Math.PI) / 180);
  return [p[0] * mPerDegLng, p[1] * mPerDegLat];
}

// Snap a user position onto the route polyline. Returns the nearest point on the
// line, the index of the segment it falls on, and the perpendicular distance in
// metres. Powers two things: trimming the already-driven part of the polyline
// (slice from `index`), and off-route detection for re-routing (`distance`).
export function snapToRoute(user, coords) {
  if (!coords || coords.length < 2) {
    return {index: 0, point: coords?.[0] || user, distance: Infinity};
  }
  const refLat = user[1];
  const u = toXY(user, refLat);
  let best = {index: 0, point: coords[0], distance: Infinity};
  for (let i = 0; i < coords.length - 1; i++) {
    const a = toXY(coords[i], refLat);
    const b = toXY(coords[i + 1], refLat);
    const abx = b[0] - a[0];
    const aby = b[1] - a[1];
    const len2 = abx * abx + aby * aby;
    let t = len2 ? ((u[0] - a[0]) * abx + (u[1] - a[1]) * aby) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const dx = u[0] - (a[0] + t * abx);
    const dy = u[1] - (a[1] + t * aby);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < best.distance) {
      // Interpolate the snapped point back to [lng, lat].
      const point = [
        coords[i][0] + t * (coords[i + 1][0] - coords[i][0]),
        coords[i][1] + t * (coords[i + 1][1] - coords[i][1]),
      ];
      best = {index: i, point, distance: dist};
    }
  }
  return best;
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

// Re-routing: how far off the polyline (metres) counts as "off-route", how many
// consecutive off-route fixes we require before re-routing (so a single noisy
// GPS jump doesn't trigger it), and the minimum gap between re-route API calls.
export const OFF_ROUTE_THRESHOLD_M = 50;
export const OFF_ROUTE_FIXES = 3;
export const REROUTE_COOLDOWN_MS = 8000;
