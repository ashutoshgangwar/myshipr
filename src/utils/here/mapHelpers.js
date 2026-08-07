/**
 * Helpers shared by every screen that draws a HERE route — HereMapScreen and
 * ActiveTripScreen both preview a trip the same way, so the coordinate
 * sanitising and the "frame the whole route" camera maths live here rather than
 * being copied per screen.
 */

/**
 * Coerces a loose `{latitude, longitude}` (route params, GPS fix, saved place)
 * into a usable coordinate, or null when it is not one.
 *
 * @param {?Object} loc
 * @returns {?{latitude: number, longitude: number, description: string}}
 */
export function normalizeLocation(loc) {
  if (!loc) return null;
  const latitude = Number(loc.latitude);
  const longitude = Number(loc.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  // (0,0) is the classic "no fix yet" sentinel, never a real destination here.
  if (latitude === 0 && longitude === 0) return null;
  return {latitude, longitude, description: loc.description || ''};
}

/**
 * Frames a whole route by picking a zoom from its bounding-box span.
 *
 * @param {{current: ?Object}} mapRef ref to a <HereMapView>
 * @param {Array<{lat: number, lng: number}>} polyline route geometry
 */
export async function fitCameraToRoute(mapRef, polyline) {
  if (!mapRef?.current || !polyline || polyline.length < 2) return;
  try {
    const lats = polyline.map(p => p.lat);
    const lngs = polyline.map(p => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const spanDeg = Math.max(maxLat - minLat, maxLng - minLng);
    // Short hop → 15, cross-country → 5.
    const zoom = Math.max(
      5,
      Math.min(15, 14 - Math.log2(Math.max(spanDeg, 0.001) * 111)),
    );
    await mapRef.current.moveCamera({
      lat: (minLat + maxLat) / 2,
      lng: (minLng + maxLng) / 2,
      zoom,
      bearing: 0,
      tilt: 0,
      animate: true,
      animationDuration: 800,
    });
  } catch (err) {
    console.warn('[here] fitCameraToRoute failed:', err);
  }
}

/**
 * `{distKm, etaText, arrivalStr}` from metres + seconds remaining, for the
 * route-summary readouts.
 */
export function buildTripInfo(distanceMeters, durationSeconds) {
  if (!Number.isFinite(distanceMeters) || !Number.isFinite(durationSeconds)) {
    return null;
  }
  const totalMinutes = Math.ceil(durationSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return {
    distKm: (distanceMeters / 1000).toFixed(1),
    etaText: hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`,
    arrivalStr: new Date(Date.now() + durationSeconds * 1000).toLocaleTimeString(
      [],
      {hour: '2-digit', minute: '2-digit'},
    ),
  };
}
