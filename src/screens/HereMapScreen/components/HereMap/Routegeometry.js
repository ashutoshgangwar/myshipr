
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
function haversineDistance(lat1, lng1, lat2, lng2) {
  const dLat = (lat2 - lat1) * DEG2RAD;
  const dLng = (lng2 - lng1) * DEG2RAD;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * DEG2RAD) * Math.cos(lat2 * DEG2RAD) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function computeBearing(lat1, lng1, lat2, lng2) {
  const φ1 = lat1 * DEG2RAD;
  const φ2 = lat2 * DEG2RAD;
  const Δλ = (lng2 - lng1) * DEG2RAD;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (Math.atan2(y, x) * RAD2DEG + 360) % 360;
}
function projectOntoSegment(pLat, pLng, aLat, aLng, bLat, bLng) {
  const cosLat = Math.cos(((aLat + bLat) / 2) * DEG2RAD);
  const dx = (bLng - aLng) * cosLat;
  const dy = bLat - aLat;
  const px = (pLng - aLng) * cosLat;
  const py = pLat - aLat;

  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-18) return 0;

  const t = Math.max(0, Math.min(1, (px * dx + py * dy) / lenSq));
  return t;
}

// ── Snap tuning ──────────────────────────────────────────────────────────────
// A flyover ("bridge cut"), roundabout ("cut circle") or busy junction makes the
// route pass close to a DIFFERENT part of itself: the entrance and exit of a
// roundabout are metres apart on screen but far apart ALONG the route, and an
// overpass runs right above the road it crosses. A pure nearest-point snap will
// happily leap onto that wrong leg, dragging the marker and the trimmed polyline
// with it. We bias the snap with two soft, additive penalties (measured in
// "equivalent metres of distance-from-line") so the geometrically-correct leg
// keeps winning:
//   • progress penalty — punishes jumping far forward/backward along the route
//     in a single fix (the across-the-loop leap).
//   • bearing penalty — punishes snapping onto a segment heading a very
//     different way than we are travelling (the return leg under an overpass).
const PROGRESS_FORWARD_BAND_M = 70; // free forward travel allowed per fix
const PROGRESS_BACK_BAND_M = 25; // GPS-wobble + smoothed-marker-trails slack
const PROGRESS_PENALTY_PER_M = 0.5; // cost added per excess metre of jump
const BEARING_FREE_DEG = 60; // heading mismatch tolerated for free
const BEARING_PENALTY_M = 50; // max cost for a fully-reversed segment

export default class RouteGeometry {
  /**
   * @param {Array<{lat: number, lng: number}>} coords
   */
  constructor(coords) {
    this.coords = coords;
    this.segmentCount = Math.max(0, coords.length - 1);
    this.cumDist = new Float64Array(coords.length);
    this.cumDist[0] = 0;
    for (let i = 1; i < coords.length; i++) {
      this.cumDist[i] =
        this.cumDist[i - 1] +
        haversineDistance(
          coords[i - 1].lat, coords[i - 1].lng,
          coords[i].lat, coords[i].lng,
        );
    }
    this.totalDistance = this.cumDist[coords.length - 1] || 1;
    this.segmentBearings = new Float64Array(this.segmentCount);
    for (let i = 0; i < this.segmentCount; i++) {
      this.segmentBearings[i] = computeBearing(
        coords[i].lat, coords[i].lng,
        coords[i + 1].lat, coords[i + 1].lng,
      );
    }
    this._lastIndex = 0;
    // Cumulative metres travelled at the last snap. -1 = unset (no bias yet).
    this._lastProgressDist = -1;
  }
  resetLastIndex() {
    this._lastIndex = 0;
    this._lastProgressDist = -1;
  }

  /**
   * Snap a GPS position to the nearest point on the route polyline.
   *
   * Uses a "rolling window" search: starts from the last-known segment and
   * searches forward (+ a small backward window for GPS wobble). This makes
   * repeated calls O(1) amortised instead of O(n).
   *
   * @param {number} lat
   * @param {number} lng
   * @param {number|null} [hintBearing=null] direction of travel (deg). When
   *        provided, segments heading the opposite way are penalised so the
   *        marker won't hop onto the return leg under an overpass / roundabout.
   * @param {number} [searchRadius=30]
   * @returns {{ segmentIndex, fraction, lat, lng, bearing, progress, distFromRoute }}
   */
  snapToRoute(lat, lng, hintBearing = null, searchRadius = 30) {
    if (this.segmentCount === 0) {
      return {
        segmentIndex: 0,
        fraction: 0,
        lat: this.coords[0]?.lat ?? lat,
        lng: this.coords[0]?.lng ?? lng,
        bearing: 0,
        progress: 0,
        distFromRoute: 0,
      };
    }

    const useBearing = Number.isFinite(hintBearing);
    const haveProgress = this._lastProgressDist >= 0;

    // Cost = raw distance-from-segment + progress penalty + bearing penalty.
    // Tracking bestDist separately from bestCost lets the off-route fallback
    // below trigger on the TRUE geometric distance, not the penalised cost.
    let bestCost = Infinity;
    let bestDist = Infinity;
    let bestIdx = this._lastIndex;
    let bestT = 0;
    const from = Math.max(0, this._lastIndex - 3);
    const to = Math.min(this.segmentCount - 1, this._lastIndex + searchRadius);

    for (let i = from; i <= to; i++) {
      const a = this.coords[i];
      const b = this.coords[i + 1];
      const t = projectOntoSegment(lat, lng, a.lat, a.lng, b.lat, b.lng);
      const sLat = a.lat + (b.lat - a.lat) * t;
      const sLng = a.lng + (b.lng - a.lng) * t;
      const dist = haversineDistance(lat, lng, sLat, sLng);

      let cost = dist;

      if (haveProgress) {
        const segLen = haversineDistance(a.lat, a.lng, b.lat, b.lng);
        const candProgress = this.cumDist[i] + segLen * t;
        const ahead = candProgress - this._lastProgressDist;
        if (ahead > PROGRESS_FORWARD_BAND_M) {
          cost += (ahead - PROGRESS_FORWARD_BAND_M) * PROGRESS_PENALTY_PER_M;
        } else if (ahead < -PROGRESS_BACK_BAND_M) {
          cost += (-ahead - PROGRESS_BACK_BAND_M) * PROGRESS_PENALTY_PER_M;
        }
      }

      if (useBearing) {
        let bd = Math.abs(hintBearing - this.segmentBearings[i]);
        if (bd > 180) bd = 360 - bd;
        if (bd > BEARING_FREE_DEG) {
          cost +=
            ((bd - BEARING_FREE_DEG) / (180 - BEARING_FREE_DEG)) *
            BEARING_PENALTY_M;
        }
      }

      if (cost < bestCost) {
        bestCost = cost;
        bestDist = dist;
        bestIdx = i;
        bestT = t;
      }
    }

    // Genuinely off the line (>100 m) — e.g. a tunnel exit or a big GPS jump.
    // Progress is no longer trustworthy, so do a pure nearest-point full scan to
    // re-acquire the route; a reroute is already requested upstream in this case.
    if (bestDist > 100) {
      for (let i = 0; i < this.segmentCount; i++) {
        const a = this.coords[i];
        const b = this.coords[i + 1];
        const t = projectOntoSegment(lat, lng, a.lat, a.lng, b.lat, b.lng);
        const sLat = a.lat + (b.lat - a.lat) * t;
        const sLng = a.lng + (b.lng - a.lng) * t;
        const dist = haversineDistance(lat, lng, sLat, sLng);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
          bestT = t;
        }
      }
    }

    this._lastIndex = bestIdx;

    const a = this.coords[bestIdx];
    const b = this.coords[bestIdx + 1];
    const snappedLat = a.lat + (b.lat - a.lat) * bestT;
    const snappedLng = a.lng + (b.lng - a.lng) * bestT;
    const bearing = this.segmentBearings[bestIdx];
    const segDist = haversineDistance(a.lat, a.lng, b.lat, b.lng);
    const progressDist = this.cumDist[bestIdx] + segDist * bestT;
    const progress = progressDist / this.totalDistance;
    this._lastProgressDist = progressDist;

    return {
      segmentIndex: bestIdx,
      fraction: bestT,
      lat: snappedLat,
      lng: snappedLng,
      bearing,
      progress,
      distFromRoute: bestDist,
    };
  }

  /**
   * Returns a sub-array of coordinates representing the REMAINING route
   * from the given segment index + fraction onward.
   * Useful if native trimPolyline isn't available – you can redraw the
   * polyline with only the remaining portion.
   *
   * @param {number} segmentIndex
   * @param {number} fraction
   * @returns {Array<{lat: number, lng: number}>}
   */
  getRemainingCoords(segmentIndex, fraction) {
    if (segmentIndex >= this.segmentCount) {
      return [this.coords[this.coords.length - 1]];
    }

    const a = this.coords[segmentIndex];
    const b = this.coords[segmentIndex + 1];
    const startPoint = {
      lat: a.lat + (b.lat - a.lat) * fraction,
      lng: a.lng + (b.lng - a.lng) * fraction,
    };

    return [startPoint, ...this.coords.slice(segmentIndex + 1)];
  }
}