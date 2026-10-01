/**
 * A type predicate, so a passing check narrows both readings to `number` —
 * which is what lets the navigation code use them without further guards.
 */
export function isValidCoord(
  lat: unknown,
  lng: unknown,
): lat is number {
  return (
    typeof lat === 'number' &&
    isFinite(lat) &&
    lat >= -90 &&
    lat <= 90 &&
    typeof lng === 'number' &&
    isFinite(lng) &&
    lng >= -180 &&
    lng <= 180
  );
}

export function isUsableNavCoord(lat: unknown, lng: unknown): lat is number {
  // Ignore Null Island (0,0) before first real GPS fix.
  return (
    isValidCoord(lat, lng) &&
    !(Math.abs(lat) < 1e-6 && Math.abs(lng as number) < 1e-6)
  );
}
