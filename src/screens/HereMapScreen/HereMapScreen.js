import React, {useEffect, useRef, useState, useCallback} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import styles from './HereMapScreen.styles';
import GpsIcon from '../../assets/svg_icon/gps-svg.svg';
import {HERE_ACCESS_KEY_ID, HERE_ACCESS_KEY_SECRET} from '@env';
import {
  clearWatchLocation,
  getCurrentLocation,
  watchCurrentLocation,
} from '../../services/LocationService';
import {calculateTruckRouteREST} from '../../services/hereTruckService';

import {HereMapView, HereMapModule} from '../../components/HereMap/index';
import HereSearchCard from '../../apiservices/hereSearchCard';
import {useSelector} from 'react-redux';
import {selectLocation} from '../../redux/slices/locationSlice';
import RouteGeometry from '../../components/HereMap/Routegeometry';

const hasHereCredentials = Boolean(
  HERE_ACCESS_KEY_ID && HERE_ACCESS_KEY_SECRET,
);

function isValidCoord(lat, lng) {
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

function isUsableNavCoord(lat, lng) {
  // Ignore Null Island (0,0) before first real GPS fix.
  return isValidCoord(lat, lng) && !(Math.abs(lat) < 1e-6 && Math.abs(lng) < 1e-6);
}

function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function sanitizeRouteCoords(coords, origin, destination) {
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

const ORIGIN = {lat: 50.1109, lng: 8.6821};
const DESTINATION = {lat: 48.1374, lng: 11.5755};

// ── 2D flat navigation view ──
// Keep this lower than street-level max to avoid over-zoom when navigation starts.
const NAVIGATION_ZOOM = 14.0;
const NAVIGATION_START_ZOOM = 13.8;
const NAVIGATION_TILT = 56;
const NAVIGATION_ANIMATE = false;
const NAVIGATION_CAMERA_DURATION_MS = 220;
const NAVIGATION_CAMERA_INTERVAL_MS = 80;
const NAVIGATION_MARKER_ANIMATION_MS = 120;
const NAVIGATION_MIN_MOVE_METERS = 0.2;
const NAVIGATION_MIN_TURN_DEGREES = 0.5;
const NAVIGATION_MIN_SPEED_MPS = 1.8;
const WRONG_WAY_BEARING_THRESHOLD = 135;
const WRONG_WAY_PROGRESS_BACKTRACK_METERS = 12;
const WRONG_WAY_STREAK_LIMIT = 2;

const REROUTE_INTERVAL_MS = 12000;
const OFF_ROUTE_THRESHOLD = 55;

const NAVIGATION_MARKER = {
  size: 120,
  iconAsset: 'truck_icon.svg',
};

const NAVIGATION_ROUTE_WIDTH = 14;

// ---------------------------------------------------------------------------
// Math utilities
// ---------------------------------------------------------------------------
function lerp(a, b, t) {
  return a + (b - a) * t;
}

function computeBearing(fromLat, fromLng, toLat, toLng) {
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

function lerpBearing(from, to, t) {
  let diff = to - from;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return (from + diff * t + 360) % 360;
}

function smallestBearingDelta(a, b) {
  let diff = Math.abs((a ?? 0) - (b ?? 0));
  if (diff > 180) diff = 360 - diff;
  return diff;
}

// ---------------------------------------------------------------------------
// Direction-aware snapping helpers
// ---------------------------------------------------------------------------
function metersPerDeg(lat) {
  // approximate conversions
  const latMeters = 111132.92 - 559.82 * Math.cos(2 * toRad(lat)) + 1.175 * Math.cos(4 * toRad(lat));
  const lngMeters = (Math.PI / 180) * 6378137 * Math.cos(toRad(lat));
  return {latMeters, lngMeters};
}

function projectPointOnSegment(lat1, lng1, lat2, lng2, latP, lngP) {
  // Project point P onto segment AB in an equirectangular/meters plane
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

/**
 * directionAwareSnap
 * - Search nearby route segments for a projection point whose segment bearing
 *   matches the vehicle heading. Falls back to rawSnap when no match.
 */
function directionAwareSnap({
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
    // Poor accuracy: skip direction-aware snapping, use raw nearest snap
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

  // Build a snap-like object (keep rawSnap.progress if available)
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

function resolveLiveSpeedMps(position) {
  const speed = position?.speed;
  return Number.isFinite(speed) && speed >= 0 ? speed : undefined;
}

// ---------------------------------------------------------------------------
// Smooth location animation hook
// ---------------------------------------------------------------------------
function useSmoothLocation() {
  const smoothPos = useRef({lat: 0, lng: 0, bearing: 0, speed: 0});
  const targetPos = useRef({lat: 0, lng: 0, bearing: 0, speed: 0});
  const animStartPosRef = useRef({lat: 0, lng: 0, bearing: 0, speed: 0});
  const prevRawPos = useRef(null);
  const animFrameRef = useRef(null);
  const animStartRef = useRef(0);
  const ANIM_DURATION = 700;
  const hasFirstFix = useRef(false);
  const listenersRef = useRef([]);

  const subscribe = useCallback(cb => {
    listenersRef.current.push(cb);
    return () => {
      listenersRef.current = listenersRef.current.filter(l => l !== cb);
    };
  }, []);

  const notify = useCallback(() => {
    const pos = {...smoothPos.current};
    listenersRef.current.forEach(cb => cb(pos));
  }, []);

  const runAnimation = useCallback(() => {
    const now = Date.now();
    const elapsed = now - animStartRef.current;
    const rawT = Math.min(elapsed / ANIM_DURATION, 1);
    const t = 1 - Math.pow(1 - rawT, 3);

    smoothPos.current = {
      lat: lerp(animStartPosRef.current.lat, targetPos.current.lat, t),
      lng: lerp(animStartPosRef.current.lng, targetPos.current.lng, t),
      bearing: lerpBearing(
        animStartPosRef.current.bearing,
        targetPos.current.bearing,
        t,
      ),
      speed: lerp(animStartPosRef.current.speed, targetPos.current.speed, t),
    };
    notify();

    if (rawT < 1) {
      animFrameRef.current = requestAnimationFrame(runAnimation);
    } else {
      smoothPos.current = {
        lat: targetPos.current.lat,
        lng: targetPos.current.lng,
        bearing: targetPos.current.bearing,
        speed: targetPos.current.speed,
      };
      notify();
    }
  }, [notify]);

  const pushLocation = useCallback(
    (lat, lng, overrideBearing, overrideSpeed) => {
      if (!isValidCoord(lat, lng)) return;

      const now = Date.now();
      let bearing = overrideBearing ?? targetPos.current.bearing;
      let speed =
        typeof overrideSpeed === 'number' && isFinite(overrideSpeed) && overrideSpeed >= 0
          ? overrideSpeed
          : targetPos.current.speed;
      if (overrideBearing == null && prevRawPos.current) {
        const dist =
          Math.abs(lat - prevRawPos.current.lat) +
          Math.abs(lng - prevRawPos.current.lng);
        if (dist > 0.00003) {
          bearing = computeBearing(
            prevRawPos.current.lat,
            prevRawPos.current.lng,
            lat,
            lng,
          );
        }
      }
      if (prevRawPos.current) {
        const dtSec = Math.max(0.001, (now - prevRawPos.current.ts) / 1000);
        const distMeters = haversineDistanceMeters(
          prevRawPos.current.lat,
          prevRawPos.current.lng,
          lat,
          lng,
        );
        if (!(typeof overrideSpeed === 'number' && isFinite(overrideSpeed))) {
          speed = distMeters / dtSec;
        }
      }
      prevRawPos.current = {lat, lng, ts: now};

      if (!hasFirstFix.current) {
        hasFirstFix.current = true;
        smoothPos.current = {lat, lng, bearing, speed};
        targetPos.current = {lat, lng, bearing, speed};
        notify();
        return;
      }

      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animStartPosRef.current = {
        lat: smoothPos.current.lat,
        lng: smoothPos.current.lng,
        bearing: smoothPos.current.bearing,
        speed: smoothPos.current.speed,
      };
      targetPos.current = {lat, lng, bearing, speed};
      animStartRef.current = now;
      animFrameRef.current = requestAnimationFrame(runAnimation);
    },
    [runAnimation, notify],
  );

  const cleanup = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    listenersRef.current = [];
  }, []);

  return {pushLocation, subscribe, smoothPos, cleanup};
}

// ===========================================================================
// Main Screen
// ===========================================================================
export default function HereMapScreen() {
  const mapRef = useRef(null);
  const [sdkReady, setSdkReady] = useState(false);
  const currentLocation = useSelector(selectLocation);

  const sourceRef = useRef(null);
  const destinationRef = useRef(null);
  const [activeInput, setActiveInput] = useState(null);
  const [sourceLocation, setSourceLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [sourceText, setSourceText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [routeSummary, setRouteSummary] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const isNavigatingRef = useRef(false);
  const [navigationInfo, setNavigationInfo] = useState(null);
  const navigationWatchIdRef = useRef(null);
  const lastRouteRefreshRef = useRef(0);
  const isDrawingRouteRef = useRef(false);

  const [isCameraFree, setIsCameraFree] = useState(false);
  const isCameraFreeRef = useRef(false);
  useEffect(() => {
    isCameraFreeRef.current = isCameraFree;
  }, [isCameraFree]);

  const routeGeometryRef = useRef(null);
  const routeCoordsRef = useRef([]);
  const hasRealGeometryRef = useRef(false);

  const previewRouteCoordsRef = useRef([]);
  const previewRouteSummaryRef = useRef(null);
  const previewRouteJsonRef = useRef(null);
  const previewUsedNativeRouteRef = useRef(false);

  // Store destination ref for reroute callbacks (avoids stale closure)
  const destinationLocationRef = useRef(null);
  useEffect(() => {
    destinationLocationRef.current = destinationLocation;
  }, [destinationLocation]);

  useEffect(() => {
    isNavigatingRef.current = isNavigating;
  }, [isNavigating]);

  const smooth = useSmoothLocation();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.35,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const searchCardAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.timing(searchCardAnim, {
      toValue: isNavigating ? 0 : 1,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [isNavigating, searchCardAnim]);

  const lastNativeMarkerRef = useRef({
    lat: 0,
    lng: 0,
    bearing: 0,
    trimIndex: -1,
  });
  const lastTrimCursorRef = useRef({index: -1, fraction: 0});
  const lastCameraUpdateTsRef = useRef(0);
  const rerouteRequestedRef = useRef(false);
  const lastRouteProgressMetersRef = useRef(0);
  const wrongWayStreakRef = useRef(0);

  // -------------------------------------------------------------------------
  // Subscribe smooth location → push to native map
  //
  // 2D view: tilt=0, camera bearing rotates with direction of travel.
  // Truck SVG bearing = direction of travel (front faces forward).
  //
  // Two modes:
  //   hasRealGeometry=true  → snap to decoded polyline, trim behind truck
  //   hasRealGeometry=false → raw GPS position, native drawRoute visual only
  // -------------------------------------------------------------------------
  useEffect(() => {
    const unsub = smooth.subscribe(async pos => {
      try {
        if (!isUsableNavCoord(pos.lat, pos.lng)) return;

        if (isNavigatingRef.current) {
          const geo = routeGeometryRef.current;
          const hasReal = hasRealGeometryRef.current;

          // ── Bearing for the truck SVG ──
          // The SVG truck's natural "front" points UP (bearing=0).
          // We rotate it to face the direction of travel.
          // pos.bearing comes from computeBearing in pushLocation.
          const truckBearing = isFinite(pos.bearing) ? pos.bearing : 0;

          if (geo && hasReal) {
            // ── REAL geometry: snap + trim ──
            const snap = geo.snapToRoute(pos.lat, pos.lng);
            if (!isValidCoord(snap.lat, snap.lng)) return;

            // Use route segment bearing for more stable direction
            const routeBearing = isFinite(snap.bearing)
              ? snap.bearing
              : truckBearing;

            const prev = lastNativeMarkerRef.current;
            const movedEnough =
              (Math.abs(snap.lat - prev.lat) + Math.abs(snap.lng - prev.lng)) *
                111_000 >=
              NAVIGATION_MIN_MOVE_METERS;
            let bd = Math.abs(routeBearing - prev.bearing);
            if (bd > 180) bd = 360 - bd;
            const turnedEnough = bd >= NAVIGATION_MIN_TURN_DEGREES;
            const segChanged = snap.segmentIndex !== prev.trimIndex;

            if (!movedEnough && !turnedEnough && !segChanged) return;

            lastNativeMarkerRef.current = {
              lat: snap.lat,
              lng: snap.lng,
              bearing: routeBearing,
              trimIndex: snap.segmentIndex,
            };

            const promises = [];

            // Marker at snapped position, facing route direction
            promises.push(
              mapRef.current?.updateNavigationMarker({
                lat: snap.lat,
                lng: snap.lng,
                bearing: routeBearing,
                animationDuration: NAVIGATION_MARKER_ANIMATION_MS,
                markerSize: NAVIGATION_MARKER.size,
                iconAsset: NAVIGATION_MARKER.iconAsset,
              }),
            );

            // Trim polyline behind truck (monotonic guard)
            const cursor = lastTrimCursorRef.current;
            if (
              snap.segmentIndex > cursor.index ||
              (snap.segmentIndex === cursor.index &&
                snap.fraction > cursor.fraction)
            ) {
              lastTrimCursorRef.current = {
                index: snap.segmentIndex,
                fraction: snap.fraction,
              };
              promises.push(
                mapRef.current?.trimPolyline({
                  trimIndex: snap.segmentIndex,
                  trimFraction: snap.fraction,
                  splitLat: snap.lat,
                  splitLng: snap.lng,
                  speedMps: pos.speed,
                }),
              );
            }

            // Camera: 2D, bearing = direction of travel
            const now = Date.now();
            const canUpdateCamera =
              now - lastCameraUpdateTsRef.current >= NAVIGATION_CAMERA_INTERVAL_MS;
            if (
              !isDrawingRouteRef.current &&
              !isCameraFreeRef.current &&
              canUpdateCamera
            ) {
              lastCameraUpdateTsRef.current = now;
              promises.push(
                mapRef.current?.updateNavigationCamera({
                  lat: snap.lat,
                  lng: snap.lng,
                  bearing: routeBearing,
                  speedMps: pos.speed,
                  animationDuration: NAVIGATION_CAMERA_DURATION_MS,
                }),
              );
            }

            await Promise.all(promises);
          } else {
            // ── No real geometry: raw GPS ──
            const prev = lastNativeMarkerRef.current;
            const movedEnough =
              (Math.abs(pos.lat - prev.lat) + Math.abs(pos.lng - prev.lng)) *
                111_000 >=
              NAVIGATION_MIN_MOVE_METERS;
            let bd = Math.abs(truckBearing - prev.bearing);
            if (bd > 180) bd = 360 - bd;
            const turnedEnough = bd >= NAVIGATION_MIN_TURN_DEGREES;

            if (!movedEnough && !turnedEnough) return;

            lastNativeMarkerRef.current = {
              lat: pos.lat,
              lng: pos.lng,
              bearing: truckBearing,
              trimIndex: -1,
            };

            const promises = [];

            promises.push(
              mapRef.current?.updateNavigationMarker({
                lat: pos.lat,
                lng: pos.lng,
                bearing: truckBearing,
                animationDuration: NAVIGATION_MARKER_ANIMATION_MS,
                markerSize: NAVIGATION_MARKER.size,
                iconAsset: NAVIGATION_MARKER.iconAsset,
              }),
            );

            const now = Date.now();
            const canUpdateCamera =
              now - lastCameraUpdateTsRef.current >= NAVIGATION_CAMERA_INTERVAL_MS;
            if (
              !isDrawingRouteRef.current &&
              !isCameraFreeRef.current &&
              canUpdateCamera
            ) {
              lastCameraUpdateTsRef.current = now;
              promises.push(
                mapRef.current?.updateNavigationCamera({
                  lat: pos.lat,
                  lng: pos.lng,
                  bearing: truckBearing,
                  speedMps: pos.speed,
                  animationDuration: NAVIGATION_CAMERA_DURATION_MS,
                }),
              );
            }

            await Promise.all(promises);
          }
        } else {
          await mapRef.current?.showCurrentLocation({
            lat: pos.lat,
            lng: pos.lng,
            bearing: isFinite(pos.bearing) ? pos.bearing : 0,
          });
        }
      } catch (_) {}
    });
    return unsub;
  }, [smooth]);

  useEffect(() => {
    return () => smooth.cleanup();
  }, [smooth]);

  useEffect(() => {
    (async () => {
      if (!hasHereCredentials) {
        Alert.alert('HERE SDK Error', 'Missing credentials');
        return;
      }
      try {
        await HereMapModule.initSDK(HERE_ACCESS_KEY_ID, HERE_ACCESS_KEY_SECRET);
        setSdkReady(true);
      } catch (e) {
        Alert.alert('HERE SDK Error', e.message);
      }
    })();
  }, []);

  // -------------------------------------------------------------------------
  // Polyline extraction — tries BOTH decoders
  // -------------------------------------------------------------------------
  const extractRoutePolyline = useCallback(routeJson => {
    try {
      const sections = routeJson?.routes?.[0]?.sections || [];
      const allCoords = [];

      for (const section of sections) {
        const polyline = section.polyline;

        if (typeof polyline === 'string' && polyline.length > 0) {
          // Try HERE Flexible Polyline first
          let decoded = decodeFlexiblePolyline(polyline);

          // If flex decode returned 0 coords, try Google Polyline format
          if (decoded.length === 0) {
            console.log(
              '[extractRoutePolyline] flex decode failed, trying Google format...',
            );
            decoded = decodeGooglePolyline(polyline);
          }

          if (decoded.length > 0) {
            console.log(
              '[extractRoutePolyline] decoded',
              decoded.length,
              'coords from section',
            );
          }
          allCoords.push(...decoded);
        } else if (Array.isArray(polyline)) {
          for (const pt of polyline) {
            if (Array.isArray(pt)) allCoords.push({lat: pt[0], lng: pt[1]});
            else if (pt.lat != null)
              allCoords.push({lat: pt.lat, lng: pt.lng ?? pt.lon});
          }
        }
      }

      console.log('[extractRoutePolyline] total coords:', allCoords.length);
      return allCoords;
    } catch (err) {
      console.warn('extractRoutePolyline failed', err);
      return [];
    }
  }, []);

  const setupRouteGeometry = useCallback(async coords => {
    if (!coords || coords.length < 2) {
      routeGeometryRef.current = null;
      routeCoordsRef.current = [];
      hasRealGeometryRef.current = false;
      return [];
    }
    routeCoordsRef.current = coords;
    routeGeometryRef.current = new RouteGeometry(coords);
    hasRealGeometryRef.current = true;
    lastTrimCursorRef.current = {index: -1, fraction: 0};
    try {
      await mapRef.current?.clearPolyline();
      await mapRef.current?.drawPolyline({
        coordinates: coords,
        color: '#4285F4',
        width: NAVIGATION_ROUTE_WIDTH,
      });
      console.log('[Nav] drawPolyline success:', coords.length, 'pts');
      return coords;
    } catch (err) {
      console.warn('[Nav] drawPolyline failed:', err);
      return [];
    }
  }, []);

  const updateRouteGeometryOnly = useCallback(
    async (originLat, originLng, destLat, destLng, routeJson) => {
      try {
        if (!routeJson) return;
        const rawCoords = extractRoutePolyline(routeJson);
        const coords = sanitizeRouteCoords(
          rawCoords,
          {lat: originLat, lng: originLng},
          {lat: destLat, lng: destLng},
        );
        if (coords.length >= 2) {
          // Reset trim cursor so new polyline trims from beginning
          lastTrimCursorRef.current = {index: -1, fraction: 0};
          await setupRouteGeometry(coords);
        } else {
          hasRealGeometryRef.current = false;
          console.log('[Nav] reroute decode failed, keeping native drawRoute');
          try {
            await mapRef.current?.drawRoute({
              originLat,
              originLng,
              destLat,
              destLng,
            });
          } catch (_) {}
        }
      } catch (err) {
        console.warn('updateRouteGeometryOnly failed', err);
      }
    },
    [extractRoutePolyline, setupRouteGeometry],
  );

  // -------------------------------------------------------------------------
  // Button handlers
  // -------------------------------------------------------------------------
  const handleMoveCamera = async () => {
    try {
      await mapRef.current?.moveCamera({
        lat: ORIGIN.lat,
        lng: ORIGIN.lng,
        zoom: 13,
        animate: true,
        animationDuration: 800,
      });
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleAddMarkers = async () => {
    try {
      await mapRef.current?.addMarker({
        lat: ORIGIN.lat,
        lng: ORIGIN.lng,
        color: '#FF0000',
      });
      await mapRef.current?.addMarker({
        lat: DESTINATION.lat,
        lng: DESTINATION.lng,
        color: '#0000FF',
      });
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleShowLocation = async () => {
    if (isFetchingLocation) return;
    setIsFetchingLocation(true);
    try {
      const location = await getCurrentLocation({detectMock: true});
      smooth.pushLocation(location.latitude, location.longitude);
      await mapRef.current?.moveCamera({
        lat: location.latitude,
        lng: location.longitude,
        zoom: 15,
        animate: true,
        animationDuration: 1000,
      });
      setSourceLocation({
        latitude: location.latitude,
        longitude: location.longitude,
        description: 'Current Location',
      });
      setSourceText('Current Location');
    } catch (e) {
      Alert.alert('Location Error', e?.message || 'Unable to fetch');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleDrawRoute = async () => {
    const origin = sourceLocation
      ? {latitude: sourceLocation.latitude, longitude: sourceLocation.longitude}
      : {latitude: ORIGIN.lat, longitude: ORIGIN.lng};
    const dest = destinationLocation
      ? {
          latitude: destinationLocation.latitude,
          longitude: destinationLocation.longitude,
        }
      : {latitude: DESTINATION.lat, longitude: DESTINATION.lng};

    if (
      !isUsableNavCoord(origin.latitude, origin.longitude) ||
      !isUsableNavCoord(dest.latitude, dest.longitude)
    ) {
      Alert.alert('Route', 'Please wait for valid source and destination coordinates.');
      return;
    }

    try {
      const routeJson = await calculateTruckRouteREST(origin, dest);
      setRouteSummary(routeJson?.routes?.[0]?.sections?.[0]?.summary || null);
      await mapRef.current?.drawRoute({
        originLat: origin.latitude,
        originLng: origin.longitude,
        destLat: dest.latitude,
        destLng: dest.longitude,
      });
    } catch (e) {
      Alert.alert('Route Error', e.message);
    }
  };

  // -------------------------------------------------------------------------
  // handleStartNavigation
  // -------------------------------------------------------------------------
  const handleStartNavigation = async () => {
    if (!destinationLocation) {
      Alert.alert('Navigation', 'Select a destination first.');
      return;
    }
    if (isNavigating) {
      stopNavigation();
      return;
    }

    // Cancel pending preview redraw to avoid camera/route conflicts at nav start.
    if (previewDebounceRef.current) {
      clearTimeout(previewDebounceRef.current);
      previewDebounceRef.current = null;
    }

    // Always anchor navigation start to LIVE GPS + fresh route from that point.
    let navStartSource = null;
    try {
      const start = await getCurrentLocation({detectMock: true});
      if (isUsableNavCoord(start.latitude, start.longitude)) {
        navStartSource = {
          latitude: start.latitude,
          longitude: start.longitude,
          bearing:
            Number.isFinite(start.bearing) && Math.abs(start.bearing) > 0.1
              ? start.bearing
              : Number.isFinite(start.heading) && Math.abs(start.heading) > 0.1
              ? start.heading
              : null,
          description: 'Current Location',
        };
        sourceRef.current = {
          latitude: start.latitude,
          longitude: start.longitude,
        };
        setSourceLocation(navStartSource);
        setSourceText('Current Location');
      }
    } catch (_) {}

    if (!navStartSource) {
      if (
        sourceLocation &&
        isUsableNavCoord(sourceLocation.latitude, sourceLocation.longitude)
      ) {
        navStartSource = {
          latitude: sourceLocation.latitude,
          longitude: sourceLocation.longitude,
          description: sourceLocation.description || 'Current Location',
        };
      } else {
        Alert.alert('Navigation', 'Current GPS location not available yet.');
        return;
      }
    }

    // Build fresh route from current GPS to destination for marker/polyline sync.
    routeGeometryRef.current = null;
    routeCoordsRef.current = [];
    hasRealGeometryRef.current = false;
    lastTrimCursorRef.current = {index: -1, fraction: 0};
    rerouteRequestedRef.current = false;
    lastRouteProgressMetersRef.current = 0;
    wrongWayStreakRef.current = 0;

    try {
      const startRoute = await calculateTruckRouteREST(
        {
          latitude: navStartSource.latitude,
          longitude: navStartSource.longitude,
        },
        {
          latitude: destinationLocation.latitude,
          longitude: destinationLocation.longitude,
        },
      );

      const startSummary =
        startRoute?.routes?.[0]?.sections?.[0]?.summary || null;
      setRouteSummary(startSummary);
      updateNavigationInfo(startSummary);

      const startRawCoords = extractRoutePolyline(startRoute);
      const startCoords = sanitizeRouteCoords(
        startRawCoords,
        {lat: navStartSource.latitude, lng: navStartSource.longitude},
        {
          lat: destinationLocation.latitude,
          lng: destinationLocation.longitude,
        },
      );
      if (startCoords.length >= 2) {
        await setupRouteGeometry(startCoords);
      } else {
        hasRealGeometryRef.current = false;
        try {
          await mapRef.current?.drawRoute({
            originLat: navStartSource.latitude,
            originLng: navStartSource.longitude,
            destLat: destinationLocation.latitude,
            destLng: destinationLocation.longitude,
          });
        } catch (_) {}
      }
    } catch (routeErr) {
      console.warn('[Nav] start route build failed', routeErr);
      hasRealGeometryRef.current = false;
    }

    lastRouteRefreshRef.current = Date.now();
    lastCameraUpdateTsRef.current = 0;
    isNavigatingRef.current = true;
    await mapRef.current?.resetNavigationCamera();

    const smoothLat = smooth.smoothPos.current.lat;
    const smoothLng = smooth.smoothPos.current.lng;
    const hasSmoothFix =
      isValidCoord(smoothLat, smoothLng) &&
      (smoothLat !== 0 || smoothLng !== 0);

    const startGeo = routeGeometryRef.current;
    const hasRealAtStart = hasRealGeometryRef.current;

    let immediatePos =
      navStartSource &&
      isUsableNavCoord(navStartSource.latitude, navStartSource.longitude)
        ? {lat: navStartSource.latitude, lng: navStartSource.longitude}
        : hasSmoothFix
        ? {lat: smoothLat, lng: smoothLng}
        : null;

    const immediateSpeed = 0;
    let immediateBearing =
      Number.isFinite(navStartSource?.bearing) &&
      Math.abs(navStartSource.bearing) > 0.1
        ? navStartSource.bearing
        : 0;
    if (immediatePos) {
      if (startGeo && hasRealAtStart) {
        const snap = startGeo.snapToRoute(immediatePos.lat, immediatePos.lng);
        if (isUsableNavCoord(snap.lat, snap.lng)) {
          immediatePos = {lat: snap.lat, lng: snap.lng};
          immediateBearing = isFinite(snap.bearing)
            ? snap.bearing
            : computeBearing(
                immediatePos.lat,
                immediatePos.lng,
                destinationLocation.latitude,
                destinationLocation.longitude,
              );
          lastTrimCursorRef.current = {
            index: snap.segmentIndex,
            fraction: snap.fraction,
          };
        }
      } else {
        immediateBearing = computeBearing(
          immediatePos.lat,
          immediatePos.lng,
          destinationLocation.latitude,
          destinationLocation.longitude,
        );
      }
    }

    if (immediatePos) {
      smooth.pushLocation(
        immediatePos.lat,
        immediatePos.lng,
        immediateBearing,
        immediateSpeed,
      );
    }

    // Camera + marker: 2D flat view
    try {
      if (immediatePos && isUsableNavCoord(immediatePos.lat, immediatePos.lng)) {
        await mapRef.current?.hideCurrentLocation();

        await Promise.all([
          mapRef.current?.updateNavigationMarker({
            lat: immediatePos.lat,
            lng: immediatePos.lng,
            bearing: immediateBearing,
            animationDuration: 0,
            markerSize: NAVIGATION_MARKER.size,
            iconAsset: NAVIGATION_MARKER.iconAsset,
          }),
          mapRef.current?.updateNavigationCamera({
            lat: immediatePos.lat,
            lng: immediatePos.lng,
            bearing: immediateBearing,
            speedMps: immediateSpeed,
            animationDuration: 700,
            forceInstant: true,
          }),
        ]);

        // Keep polyline corner exactly on the same start point as marker.
        if (startGeo && hasRealAtStart && lastTrimCursorRef.current.index >= 0) {
          await mapRef.current?.trimPolyline({
            trimIndex: lastTrimCursorRef.current.index,
            trimFraction: lastTrimCursorRef.current.fraction,
            splitLat: immediatePos.lat,
            splitLng: immediatePos.lng,
            speedMps: immediateSpeed,
          });
        }

        // Destination pin
        if (
          isValidCoord(
            destinationLocation.latitude,
            destinationLocation.longitude,
          )
        ) {
          await mapRef.current?.addMarker({
            lat: destinationLocation.latitude,
            lng: destinationLocation.longitude,
            color: '#FF3366',
          });
        }
      } else {
        await mapRef.current?.hideCurrentLocation();
      }
    } catch (_) {}

    setIsNavigating(true);

    // GPS watch
    try {
      const watchId = await watchCurrentLocation(
        async position => {
          const lat = position.latitude;
          const lng = position.longitude;
          if (!isUsableNavCoord(lat, lng)) return;
          const liveSpeed = resolveLiveSpeedMps(position);
          const liveHeading =
            Number.isFinite(position?.bearing) && Math.abs(position.bearing) > 0.1
              ? position.bearing
              : Number.isFinite(position?.heading) &&
                Math.abs(position.heading) > 0.1
              ? position.heading
              : undefined;

          sourceRef.current = {latitude: lat, longitude: lng};

          const geo = routeGeometryRef.current;
          const hasReal = hasRealGeometryRef.current;

          if (geo && hasReal) {
            let rawSnap = geo.snapToRoute(lat, lng);
            // Try direction-aware snapping using heading, speed and accuracy
            try {
              const heading = Number.isFinite(position?.bearing) && Math.abs(position.bearing) > 0.1
                ? position.bearing
                : Number.isFinite(position?.heading) && Math.abs(position.heading) > 0.1
                ? position.heading
                : undefined;
              const accuracy = position?.accuracy ?? undefined;
              const speed = resolveLiveSpeedMps(position);
              const dirSnap = directionAwareSnap({
                lat,
                lng,
                heading,
                speed,
                accuracy,
                coords: routeCoordsRef.current,
                lastIndex: lastTrimCursorRef.current?.index ?? -1,
                rawSnap,
              });
              if (dirSnap) rawSnap = dirSnap;
            } catch (e) {
              console.warn('[Nav] direction-aware snap failed', e?.message ?? e);
            }

            // ── Off-route detection → immediate reroute ──
            if (rawSnap.distFromRoute > OFF_ROUTE_THRESHOLD) {
              console.log(
                '[Nav] OFF ROUTE:',
                rawSnap.distFromRoute.toFixed(0),
                'm — forcing reroute',
              );
              rerouteRequestedRef.current = true;
              lastRouteRefreshRef.current = 0;
            }

            const progressMeters =
              Number.isFinite(rawSnap.progress) && Number.isFinite(geo?.totalDistance)
                ? rawSnap.progress * geo.totalDistance
                : 0;
            const progressBacktrack =
              lastRouteProgressMetersRef.current - progressMeters;
            const headingDelta = smallestBearingDelta(
              liveHeading ?? rawSnap.bearing,
              rawSnap.bearing,
            );
            const wrongWay =
              (liveSpeed ?? 0) >= NAVIGATION_MIN_SPEED_MPS &&
              progressBacktrack > WRONG_WAY_PROGRESS_BACKTRACK_METERS &&
              headingDelta >= WRONG_WAY_BEARING_THRESHOLD;

            wrongWayStreakRef.current = wrongWay
              ? wrongWayStreakRef.current + 1
              : Math.max(0, wrongWayStreakRef.current - 1);

            if (wrongWayStreakRef.current >= WRONG_WAY_STREAK_LIMIT) {
              console.log('[Nav] wrong-way movement detected — forcing reroute');
              rerouteRequestedRef.current = true;
              lastRouteRefreshRef.current = 0;
            }

            lastRouteProgressMetersRef.current = progressMeters;
            smooth.pushLocation(
              rawSnap.lat,
              rawSnap.lng,
              rawSnap.bearing,
              liveSpeed,
            );
          } else {
            smooth.pushLocation(lat, lng, liveHeading, liveSpeed);
          }

          // Throttled reroute — also updates distance/ETA
          const now = Date.now();
          const dest = destinationLocationRef.current;
          if (
            dest &&
            (rerouteRequestedRef.current ||
              now - lastRouteRefreshRef.current > REROUTE_INTERVAL_MS)
          ) {
            lastRouteRefreshRef.current = now;
            const rerouteReason = rerouteRequestedRef.current
              ? 'deviation'
              : 'periodic-refresh';
            rerouteRequestedRef.current = false;
            try {
              const origin = sourceRef.current ?? {
                latitude: lat,
                longitude: lng,
              };
              const navRoute = await calculateTruckRouteREST(
                {latitude: origin.latitude, longitude: origin.longitude},
                {latitude: dest.latitude, longitude: dest.longitude},
              );
              const navSummary =
                navRoute?.routes?.[0]?.sections?.[0]?.summary || null;
              setRouteSummary(navSummary);
              updateNavigationInfo(navSummary);

              // Redraw polyline from fresh route (handles direction changes)
              console.log('[Nav] reroute reason:', rerouteReason);
              await updateRouteGeometryOnly(
                origin.latitude,
                origin.longitude,
                dest.latitude,
                dest.longitude,
                navRoute,
              );
              lastRouteProgressMetersRef.current = 0;
              wrongWayStreakRef.current = 0;
            } catch (routeErr) {
              console.warn('reroute failed', routeErr);
            }
          }
        },
        watchErr => {
          console.warn('watch error', watchErr);
        },
        {detectMock: true},
      );
      navigationWatchIdRef.current = watchId;

      // Background: initial GPS fix + route
      (async () => {
        try {
          const start = await getCurrentLocation({detectMock: true});
          sourceRef.current = {
            latitude: start.latitude,
            longitude: start.longitude,
          };
          setSourceText('Current Location');

          const startGeo = routeGeometryRef.current;
          if (startGeo && hasRealGeometryRef.current) {
            const snap = startGeo.snapToRoute(start.latitude, start.longitude);
            smooth.pushLocation(snap.lat, snap.lng, snap.bearing);
          } else {
            smooth.pushLocation(start.latitude, start.longitude);
          }

          if (!hasRealGeometryRef.current) {
            console.log('[Nav] fetching fresh route for geometry...');
            try {
              const freshRoute = await calculateTruckRouteREST(
                {latitude: start.latitude, longitude: start.longitude},
                {
                  latitude: destinationLocation.latitude,
                  longitude: destinationLocation.longitude,
                },
              );
              const summary =
                freshRoute?.routes?.[0]?.sections?.[0]?.summary || null;
              setRouteSummary(summary);
              updateNavigationInfo(summary);

              const coords = extractRoutePolyline(freshRoute);
              const safeCoords = sanitizeRouteCoords(
                coords,
                {lat: start.latitude, lng: start.longitude},
                {
                  lat: destinationLocation.latitude,
                  lng: destinationLocation.longitude,
                },
              );
              if (safeCoords.length >= 2) {
                await setupRouteGeometry(safeCoords);
                console.log(
                  '[Nav] fresh route geometry ready:',
                  safeCoords.length,
                  'pts',
                );
              } else {
                console.log(
                  '[Nav] decode still fails — raw GPS mode continues',
                );
                try {
                  await mapRef.current?.drawRoute({
                    originLat: start.latitude,
                    originLng: start.longitude,
                    destLat: destinationLocation.latitude,
                    destLng: destinationLocation.longitude,
                  });
                } catch (_) {}
              }
            } catch (routeErr) {
              console.warn('fresh route failed', routeErr);
            }
          }

          // Camera follow is already handled by smooth GPS subscription.
          // Avoid extra bootstrap camera jump here.
        } catch (err) {
          console.warn('bg GPS setup failed', err);
        }
      })();
    } catch (err) {
      Alert.alert('Navigation', err?.message || 'Unable to start');
      isNavigatingRef.current = false;
      setIsNavigating(false);
    }
  };

  const stopNavigation = useCallback(() => {
    if (navigationWatchIdRef.current != null) {
      clearWatchLocation(navigationWatchIdRef.current);
      navigationWatchIdRef.current = null;
    }
    isNavigatingRef.current = false;
    setIsNavigating(false);
    setNavigationInfo(null);
    setIsCameraFree(false);
    if (sourceRef.current)
      setSourceLocation({
        latitude: sourceRef.current.latitude,
        longitude: sourceRef.current.longitude,
        description: 'Current Location',
      });
    routeGeometryRef.current = null;
    routeCoordsRef.current = [];
    hasRealGeometryRef.current = false;
    lastTrimCursorRef.current = {index: -1, fraction: 0};
    lastCameraUpdateTsRef.current = 0;
    rerouteRequestedRef.current = false;
    lastRouteProgressMetersRef.current = 0;
    wrongWayStreakRef.current = 0;

    (async () => {
      try {
        await mapRef.current?.resetNavigationCamera();
        await mapRef.current?.removeNavigationMarker();
        await mapRef.current?.clearPolyline();
        await mapRef.current?.clearRoute();
        const pos = smooth.smoothPos.current;
        if (isUsableNavCoord(pos.lat, pos.lng)) {
          await mapRef.current?.showCurrentLocation({
            lat: pos.lat,
            lng: pos.lng,
            bearing: 0,
          });
          await mapRef.current?.moveCamera({
            lat: pos.lat,
            lng: pos.lng,
            zoom: 14,
            bearing: 0,
            tilt: 0,
            animate: true,
            animationDuration: 800,
          });
        }
      } catch (_) {}
    })();
  }, [smooth]);

  const updateNavigationInfo = summary => {
    if (!summary) {
      setNavigationInfo(null);
      return;
    }
    const distKm = (summary.length / 1000).toFixed(1);
    const etaMin = Math.ceil(summary.duration / 60);
    const arrivalTime = new Date(Date.now() + summary.duration * 1000);
    const arrivalStr = arrivalTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    setNavigationInfo({distKm, etaMin, arrivalStr});
  };

  const handleReCenter = useCallback(async () => {
    setIsCameraFree(false);
    const pos = smooth.smoothPos.current;
    try {
      await mapRef.current?.updateNavigationCamera({
        lat: pos.lat,
        lng: pos.lng,
        bearing: isFinite(pos.bearing) ? pos.bearing : 0,
        speedMps: pos.speed,
        animationDuration: 500,
        forceInstant: true,
      });
    } catch (_) {}
  }, [smooth]);

  const handleCoordinateSelect = async (lat, lng) => {
    try {
      await mapRef.current?.moveCamera({
        lat,
        lng,
        zoom: 14,
        animate: true,
        animationDuration: 600,
      });
    } catch (e) {
      console.warn('moveCamera failed', e);
    }
  };

  // Auto-set source
  useEffect(() => {
    if (
      currentLocation &&
      Number.isFinite(currentLocation.latitude) &&
      Number.isFinite(currentLocation.longitude) &&
      !sourceLocation
    ) {
      setSourceLocation({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        description: 'Current Location',
      });
      setSourceText('Current Location');
      smooth.pushLocation(currentLocation.latitude, currentLocation.longitude);
    }
  }, [currentLocation, sourceLocation, smooth]);

  // Sync markers + route preview
  // ── Optimised: debounced, cancellable, fetch-then-swap (no empty-map flash) ──
  const previewDebounceRef = useRef(null);
  useEffect(() => {
    if (!sdkReady) return;
    if (isNavigatingRef.current) return;

    // Debounce: wait 350 ms before firing so rapid state changes collapse
    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);

    // Cancellation flag – if the effect re-runs before the async work
    // completes, the stale closure sets cancelled=true and all awaits bail out
    let cancelled = false;

    previewDebounceRef.current = setTimeout(async () => {
      if (cancelled || isNavigatingRef.current) return;
      try {
        // ── 1. Fetch route FIRST (map still shows old content, no flash) ──
        let coords = [];
        let summary = null;
        let usedNative = false;

        if (
          sourceLocation &&
          destinationLocation &&
          isUsableNavCoord(sourceLocation.latitude, sourceLocation.longitude) &&
          isUsableNavCoord(
            destinationLocation.latitude,
            destinationLocation.longitude,
          )
        ) {
          try {
            const routeJson = await calculateTruckRouteREST(
              {latitude: sourceLocation.latitude, longitude: sourceLocation.longitude},
              {latitude: destinationLocation.latitude, longitude: destinationLocation.longitude},
            );
            if (cancelled) return;
            summary = routeJson?.routes?.[0]?.sections?.[0]?.summary || null;
            coords = sanitizeRouteCoords(
              extractRoutePolyline(routeJson),
              {lat: sourceLocation.latitude, lng: sourceLocation.longitude},
              {
                lat: destinationLocation.latitude,
                lng: destinationLocation.longitude,
              },
            );
            previewRouteJsonRef.current = routeJson;
            if (coords.length < 2) usedNative = true;
          } catch (routeErr) {
            if (cancelled) return;
            console.warn('[Preview] route fetch failed:', routeErr.message);
            usedNative = true;
          }
        }

        if (cancelled) return;

        // ── 2. Now atomically clear + redraw (single frame, no empty flash) ──
        await Promise.all([
          mapRef.current?.clearMarkers(),
          mapRef.current?.clearPolyline(),
          mapRef.current?.clearRoute(),
        ]);
        if (cancelled) return;

        // Reset preview refs
        previewRouteCoordsRef.current = [];
        previewRouteSummaryRef.current = null;
        previewUsedNativeRouteRef.current = false;

        // Source blue dot
        if (
          sourceLocation &&
          isUsableNavCoord(sourceLocation.latitude, sourceLocation.longitude)
        ) {
          await mapRef.current?.showCurrentLocation({
            lat: sourceLocation.latitude,
            lng: sourceLocation.longitude,
            bearing: smooth.smoothPos.current.bearing ?? 0,
          });
        }
        if (cancelled) return;

        // Destination pin
        if (
          destinationLocation &&
          isUsableNavCoord(
            destinationLocation.latitude,
            destinationLocation.longitude,
          )
        ) {
          await mapRef.current?.addMarker({
            lat: destinationLocation.latitude,
            lng: destinationLocation.longitude,
            color: '#FF3366',
          });
        }
        if (cancelled) return;

        // ── 3. Draw route / polyline ──
        if (summary) {
          setRouteSummary(summary);
          previewRouteSummaryRef.current = summary;
        }

        if (coords.length >= 2) {
          previewRouteCoordsRef.current = coords;
          previewUsedNativeRouteRef.current = false;
          await mapRef.current?.drawPolyline({
            coordinates: coords,
            color: '#4285F4',
            width: 10,
          });
          if (cancelled) return;
          // Fit camera to full route
          const lats = coords.map(c => c.lat);
          const lngs = coords.map(c => c.lng);
          const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
          const midLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
          const span = Math.max(
            Math.max(...lats) - Math.min(...lats),
            Math.max(...lngs) - Math.min(...lngs),
          );
          const zoom = Math.max(5, Math.min(14, 14 - Math.log2(span * 111)));
          await mapRef.current?.moveCamera({
            lat: midLat, lng: midLng, zoom,
            animate: true, animationDuration: 700,
          });
          console.log('[Preview] polyline drawn:', coords.length, 'pts');
        } else if (
          usedNative &&
          sourceLocation && destinationLocation &&
          isUsableNavCoord(sourceLocation.latitude, sourceLocation.longitude) &&
          isUsableNavCoord(
            destinationLocation.latitude,
            destinationLocation.longitude,
          )
        ) {
          previewUsedNativeRouteRef.current = true;
          await mapRef.current?.drawRoute({
            originLat: sourceLocation.latitude,
            originLng: sourceLocation.longitude,
            destLat: destinationLocation.latitude,
            destLng: destinationLocation.longitude,
          });
          console.log('[Preview] native drawRoute fallback');
        }
      } catch (err) {
        if (!cancelled) console.warn('sync failed', err);
      }
    }, 350);

    return () => {
      cancelled = true;
      if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    };
    // smooth intentionally excluded — smoothPos.current is read via ref, not state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkReady, sourceLocation, destinationLocation]);

  useEffect(() => {
    return () => {
      if (navigationWatchIdRef.current != null) {
        clearWatchLocation(navigationWatchIdRef.current);
      }
    };
  }, []);

  const handleClear = async () => {
    try {
      await mapRef.current?.clearMarkers();
      await mapRef.current?.clearRoute();
      await mapRef.current?.clearPolyline();
      setRouteSummary(null);
      setNavigationInfo(null);
      routeGeometryRef.current = null;
      routeCoordsRef.current = [];
      hasRealGeometryRef.current = false;
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  // Render
  return (
    <SafeAreaView style={styles.container}>
      {sdkReady ? (
        <HereMapView
          ref={mapRef}
          style={styles.map}
          centerLat={ORIGIN.lat}
          centerLng={ORIGIN.lng}
          zoomLevel={10}
        />
      ) : (
        <View style={styles.loading}>
          <Text style={styles.loadingText}>
            {hasHereCredentials
              ? 'Initialising HERE SDK…'
              : 'Add credentials to .env'}
          </Text>
        </View>
      )}

      {sdkReady && (
        <Animated.View
          style={[
            styles.searchCardWrapper,
            {
              opacity: searchCardAnim,
              transform: [
                {
                  translateY: searchCardAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-200, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents={isNavigating ? 'none' : 'auto'}>
          <HereSearchCard
            sourceRef={sourceRef}
            destinationRef={destinationRef}
            activeInput={activeInput}
            onActiveInputChange={setActiveInput}
            sourceLocation={sourceLocation}
            destinationLocation={destinationLocation}
            sourceText={sourceText}
            destinationText={destinationText}
            setSourceLocation={setSourceLocation}
            setDestinationLocation={setDestinationLocation}
            setSourceText={setSourceText}
            setDestinationText={setDestinationText}
            onCoordinateSelect={handleCoordinateSelect}
            onSwap={() => {
              const s = sourceLocation;
              const d = destinationLocation;
              setSourceLocation(d);
              setDestinationLocation(s);
              const t = sourceText;
              setSourceText(destinationText);
              setDestinationText(t);
            }}
          />
        </Animated.View>
      )}

      {isNavigating && navigationInfo && (
        <View style={styles.navInfoBar}>
          <View style={styles.navInfoRow}>
            <View style={styles.navInfoEta}>
              <Text style={styles.navInfoEtaText}>{navigationInfo.etaMin}</Text>
              <Text style={styles.navInfoEtaLabel}>min</Text>
            </View>
            <View style={styles.navInfoDivider} />
            <View style={styles.navInfoDetails}>
              <Text style={styles.navInfoDistText}>
                {navigationInfo.distKm} km remaining
              </Text>
              <Text style={styles.navInfoArrivalText}>
                Arrival at {navigationInfo.arrivalStr}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.navStopButton}
              onPress={stopNavigation}
              activeOpacity={0.75}>
              <Text style={styles.navStopButtonText}>Stop</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!isNavigating && (
        <View style={styles.toolbar}>
          <ToolbarButton label="📷 Camera" onPress={handleMoveCamera} />
          <ToolbarButton label="📍 Markers" onPress={handleAddMarkers} />
          <ToolbarButton label="🔵 Location" onPress={handleShowLocation} />
          <ToolbarButton label="🛣️ Route" onPress={handleDrawRoute} />
          <ToolbarButton label="🧭 Navigate" onPress={handleStartNavigation} />
          <ToolbarButton label="🗑️ Clear" onPress={handleClear} />
        </View>
      )}

      {routeSummary && !isNavigating && (
        <View style={styles.routeSummaryBar}>
          <Text style={styles.routeSummaryText}>
            Distance: {(routeSummary.length / 1000).toFixed(2)} km • ETA:{' '}
            {Math.ceil(routeSummary.duration / 60)} min
          </Text>
        </View>
      )}

      {isNavigating && (
        <TouchableOpacity
          style={styles.reCenterButton}
          onPress={handleReCenter}
          activeOpacity={0.8}>
          <Text style={styles.reCenterIcon}>◎</Text>
          <Text style={styles.reCenterLabel}>Re-center</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.gpsButton, isNavigating && styles.gpsButtonNavigating]}
        onPress={handleShowLocation}
        disabled={isFetchingLocation}
        activeOpacity={0.8}>
        {isFetchingLocation ? (
          <ActivityIndicator size="small" color="#040000" />
        ) : (
          <GpsIcon width={28} height={28} fill="#040000" />
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}


const _FLEX_POLY_TABLE = (() => {
  const T = new Int8Array(128).fill(-1);
  const C = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  for (let i = 0; i < C.length; i++) T[C.charCodeAt(i)] = i;
  return T;
})();

function decodeFlexiblePolyline(encoded) {
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

// ===========================================================================
// Google Polyline Decoder (charCode - 63 offset)
// Used as FALLBACK when HERE Flexible Polyline decode returns 0 coords.
// HERE v7 Routing API and some REST endpoints use this format.
// ===========================================================================
function decodeGooglePolyline(encoded) {
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

function ToolbarButton({label, onPress, highlight}) {
  return (
    <TouchableOpacity
      style={[styles.button, highlight && styles.buttonHighlight]}
      onPress={onPress}
      activeOpacity={0.75}>
      <Text
        style={[styles.buttonText, highlight && styles.buttonTextHighlight]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
