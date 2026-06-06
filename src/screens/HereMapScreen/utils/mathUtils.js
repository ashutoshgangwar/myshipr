import {isValidCoord, isUsableNavCoord} from './coordinateValidation';

export function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function computeBearing(fromLat, fromLng, toLat, toLng) {
  const toRad = d => (d * Math.PI) / 180;
  const toDeg = r => (r * 180) / Math.PI;
  const lat1 = toRad(fromLat);
  const lat2 = toRad(toLat);
  const dLng = toRad(toLng - fromLng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function smallestBearingDelta(a, b) {
  let diff = Math.abs((a ?? 0) - (b ?? 0));
  if (diff > 180) diff = 360 - diff;
  return diff;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function lerpBearing(from, to, t) {
  let diff = to - from;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return (from + diff * t + 360) % 360;
}

function metersPerDeg(lat) {
  const toRad = d => (d * Math.PI) / 180;
  const latMeters = 111132.92 - 559.82 * Math.cos(2 * toRad(lat)) + 1.175 * Math.cos(4 * toRad(lat));
  const lngMeters = (Math.PI / 180) * 6378137 * Math.cos(toRad(lat));
  return {latMeters, lngMeters};
}

export function projectPointOnSegment(lat1, lng1, lat2, lng2, latP, lngP) {
  const meanLat = (lat1 + lat2 + latP) / 3;
  const {latMeters, lngMeters} = metersPerDeg(meanLat);

  const Ax = lng1 * lngMeters;
  const Ay = lat1 * latMeters;
  const Bx = lng2 * lngMeters;
  const By = lat2 * latMeters;
  const Px = lngP * lngMeters;
  const Py = latP * latMeters;

  const ABx = Bx - Ax;
  const ABy = By - Ay;
  const APx = Px - Ax;
  const APy = Py - Ay;
  const ab2 = ABx * ABx + ABy * ABy;
  let t = ab2 > 0 ? (APx * ABx + APy * ABy) / ab2 : 0;
  if (t < 0) t = 0;
  if (t > 1) t = 1;

  const projX = Ax + ABx * t;
  const projY = Ay + ABy * t;

  const distMeters = Math.hypot(Px - projX, Py - projY);
  const projLat = projY / latMeters;
  const projLng = projX / lngMeters;

  return {lat: projLat, lng: projLng, fraction: t, distMeters};
}

export function directionAwareSnap({
  lat,
  lng,
  heading,
  speed,
  accuracy,
  coords,
  lastIndex = -1,
  rawSnap = null,
}) {
  if (!Array.isArray(coords) || coords.length < 2) return rawSnap;

  const MAX_ACCURACY = 20; // meters
  const MAX_SNAP_DISTANCE = 50; // meters allowed for snapping
  const BEARING_THRESHOLD = 45; // degrees
  const LOW_SPEED_MPS = 5 / 3.6; // 5 km/h -> m/s

  if (accuracy != null && accuracy > MAX_ACCURACY) {
    return rawSnap;
  }

  const candidates = [];

  // choose window around lastIndex for performance
  const len = coords.length;
  const center = Number.isFinite(lastIndex) && lastIndex >= 0 ? lastIndex : 0;
  const window = Math.max(50, Math.floor(len * 0.1));
  const start = Math.max(0, center - window);
  const end = Math.min(len - 2, center + window);

  for (let i = start; i <= end; i++) {
    const a = coords[i];
    const b = coords[i + 1];
    if (!isValidCoord(a?.lat, a?.lng) || !isValidCoord(b?.lat, b?.lng)) continue;
    const proj = projectPointOnSegment(a.lat, a.lng, b.lat, b.lng, lat, lng);
    if (proj.distMeters > MAX_SNAP_DISTANCE) continue;
    const segBearing = computeBearing(a.lat, a.lng, b.lat, b.lng);
    candidates.push({i, proj, segBearing});
  }

  if (candidates.length === 0) {
    // Try full-route scan as fallback (expensive but rare)
    for (let i = 0; i < len - 1; i++) {
      const a = coords[i];
      const b = coords[i + 1];
      if (!isValidCoord(a?.lat, a?.lng) || !isValidCoord(b?.lat, b?.lng)) continue;
      const proj = projectPointOnSegment(a.lat, a.lng, b.lat, b.lng, lat, lng);
      if (proj.distMeters > MAX_SNAP_DISTANCE) continue;
      const segBearing = computeBearing(a.lat, a.lng, b.lat, b.lng);
      candidates.push({i, proj, segBearing});
    }
  }

  if (candidates.length === 0) return rawSnap;

  // If heading is available and speed sufficient, prefer candidates matching direction
  let filtered = candidates;
  if (Number.isFinite(heading) && (speed == null || speed >= LOW_SPEED_MPS)) {
    filtered = candidates.filter(c => smallestBearingDelta(heading, c.segBearing) <= BEARING_THRESHOLD);
  }

  // If none matched direction and we had heading, relax by doubling threshold
  if (filtered.length === 0 && Number.isFinite(heading)) {
    filtered = candidates.filter(c => smallestBearingDelta(heading, c.segBearing) <= BEARING_THRESHOLD * 2);
  }

  // choose nearest among filtered
  let best = null;
  for (const c of filtered) {
    if (!best || c.proj.distMeters < best.proj.distMeters) best = c;
  }

  if (!best) return rawSnap;

  return {
    lat: best.proj.lat,
    lng: best.proj.lng,
    bearing: best.segBearing,
    segmentIndex: best.i,
    fraction: best.proj.fraction,
    distFromRoute: best.proj.distMeters,
    progress: rawSnap?.progress,
  };
}

/**
 * Sanitize and validate route coordinates
 */
export function sanitizeRouteCoords(coords, origin, destination) {
  if (!Array.isArray(coords) || coords.length < 2) return [];

  const cleaned = [];
  for (const p of coords) {
    if (!isValidCoord(p?.lat, p?.lng)) continue;
    if (cleaned.length === 0) {
      cleaned.push({lat: p.lat, lng: p.lng});
      continue;
    }

    const prev = cleaned[cleaned.length - 1];
    const seg = haversineDistanceMeters(prev.lat, prev.lng, p.lat, p.lng);

    // Drop micro-noise and abnormal huge jumps caused by bad decode/outliers.
    if (seg < 0.8) continue;
    if (seg > 2500) continue;

    cleaned.push({lat: p.lat, lng: p.lng});
  }

  if (cleaned.length < 2) return [];

  if (origin && isUsableNavCoord(origin.lat, origin.lng)) {
    const dStart = haversineDistanceMeters(
      origin.lat,
      origin.lng,
      cleaned[0].lat,
      cleaned[0].lng,
    );
    if (dStart > 6000) return [];
  }

  if (destination && isUsableNavCoord(destination.lat, destination.lng)) {
    const end = cleaned[cleaned.length - 1];
    const dEnd = haversineDistanceMeters(
      destination.lat,
      destination.lng,
      end.lat,
      end.lng,
    );
    if (dEnd > 8000) return [];
  }

  return cleaned;
}

export function reduceRouteCoords(coords, maxPoints = 500) {
  if (!Array.isArray(coords) || coords.length <= maxPoints) return coords;
  if (maxPoints < 2) return [];

  const reduced = [];
  const step = (coords.length - 1) / (maxPoints - 1);

  for (let i = 0; i < maxPoints; i++) {
    const index = Math.min(Math.round(i * step), coords.length - 1);
    reduced.push(coords[index]);
  }

  return reduced.filter(
    (pt, idx, arr) => idx === 0 || pt.lat !== arr[idx - 1].lat || pt.lng !== arr[idx - 1].lng,
  );
}

export function resolveLiveSpeedMps(position) {
  const speed = position?.speed;
  return Number.isFinite(speed) && speed >= 0 ? speed : undefined;
}
