const _FLEX_POLY_TABLE = (() => {
  const T = new Int8Array(128).fill(-1);
  const C = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  for (let i = 0; i < C.length; i++) T[C.charCodeAt(i)] = i;
  return T;
})();

export function decodeFlexiblePolyline(encoded) {
  if (!encoded || encoded.length === 0) return [];
  const result = [];
  let index = 0;

  function readVarint() {
    let v = 0,
      s = 0,
      c;
    do {
      const code = encoded.charCodeAt(index);
      c = code < 128 ? _FLEX_POLY_TABLE[code] : -1;
      if (c < 0) return -1; // signal failure
      index++;
      v |= (c & 0x1f) << s;
      s += 5;
    } while (c >= 0x20 && index < encoded.length);
    return v;
  }

  function readDelta() {
    const v = readVarint();
    if (v < 0) return NaN;
    return v & 1 ? ~(v >> 1) : v >> 1;
  }

  const header = readVarint();
  if (header < 0) return [];
  const precision = (header >> 4) & 0xf;
  const thirdDimT = (header >> 12) & 0x7;
  const hasThird = thirdDimT !== 0;
  const factor = Math.pow(10, precision || 5);
  let lat = 0,
    lng = 0;

  while (index < encoded.length) {
    const dLat = readDelta();
    if (isNaN(dLat)) break;
    lat += dLat;
    if (index >= encoded.length) break;
    const dLng = readDelta();
    if (isNaN(dLng)) break;
    lng += dLng;
    if (hasThird && index < encoded.length) {
      const d = readDelta();
      if (isNaN(d)) break;
    }
    const fLat = lat / factor,
      fLng = lng / factor;
    if (
      isFinite(fLat) &&
      fLat >= -90 &&
      fLat <= 90 &&
      isFinite(fLng) &&
      fLng >= -180 &&
      fLng <= 180
    ) {
      result.push({lat: fLat, lng: fLng});
    }
  }
  return result;
}

/**
 * Decode Google Polyline format (charCode - 63 offset)
 * Used as fallback when HERE Flexible Polyline decode returns 0 coords.
 */
export function decodeGooglePolyline(encoded) {
  if (!encoded || encoded.length === 0) return [];
  const result = [];
  let index = 0,
    lat = 0,
    lng = 0;

  while (index < encoded.length) {
    // Decode latitude
    let shift = 0,
      val = 0,
      byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      val |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    lat += val & 1 ? ~(val >> 1) : val >> 1;

    if (index >= encoded.length) break;

    // Decode longitude
    shift = 0;
    val = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      val |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);
    lng += val & 1 ? ~(val >> 1) : val >> 1;

    const fLat = lat / 1e5;
    const fLng = lng / 1e5;
    if (
      isFinite(fLat) &&
      fLat >= -90 &&
      fLat <= 90 &&
      isFinite(fLng) &&
      fLng >= -180 &&
      fLng <= 180
    ) {
      result.push({lat: fLat, lng: fLng});
    }
  }
  return result;
}
