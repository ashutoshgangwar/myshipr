export function isValidCoord(lat, lng) {
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

export function isUsableNavCoord(lat, lng) {
  // Ignore Null Island (0,0) before first real GPS fix.
  return isValidCoord(lat, lng) && !(Math.abs(lat) < 1e-6 && Math.abs(lng) < 1e-6);
}
