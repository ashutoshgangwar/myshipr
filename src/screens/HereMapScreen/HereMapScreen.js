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
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import styles from './HereMapScreen.styles';
import GpsIcon from '../../assets/svg_icon/gps-svg.svg';
import CompassIcon from '../../assets/svg_icon/compass.svg';
import {HERE_ACCESS_KEY_ID, HERE_ACCESS_KEY_SECRET} from '@env';
import {
  clearWatchLocation,
  getCurrentLocation,
  watchCurrentLocation,
  useLocation,
} from '../../services/LocationService';
import {calculateRouteTolls} from './services/hereTruckService';

import {HereMapView, HereMapModule} from './components/HereMap/index';
import RouteGeometry from './components/HereMap/Routegeometry';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MarkerRasterizer from './components/MarkerRasterizer';
import MarkerPin from './components/MarkerPin';

import {
  useSmoothLocation,
  isValidCoord,
  isUsableNavCoord,
} from './hooks/useSmoothLocation';
import {
  haversineDistanceMeters,
  computeBearing,
  smallestBearingDelta,
  directionAwareSnap,
  resolveLiveSpeedMps,
  sanitizeRouteCoords,
  reduceRouteCoords,
} from './utils/mathUtils';
import {
  decodeFlexiblePolyline,
  decodeGooglePolyline,
} from './utils/polylineDecoder';

import {
  NavigationControls,
} from './components/NavigationControls';
import TurnByTurnPanel from './utils/Turnbyturnpanel';
import NextManeuverHud from './utils/NextManeuverHud';

import {
  NAVIGATION_CAMERA_DURATION_MS,
  NAVIGATION_CAMERA_INTERVAL_MS,
  NAVIGATION_MARKER_ANIMATION_MS,
  NAVIGATION_MIN_MOVE_METERS,
  NAVIGATION_MIN_TURN_DEGREES,
  NAVIGATION_MIN_SPEED_MPS,
  WRONG_WAY_BEARING_THRESHOLD,
  WRONG_WAY_PROGRESS_BACKTRACK_METERS,
  WRONG_WAY_STREAK_LIMIT,
  REROUTE_INTERVAL_MS,
  OFF_ROUTE_THRESHOLD,
  NAVIGATION_MARKER,
  NAVIGATION_ROUTE_WIDTH,
  MARKER_DISPLAY_SIZE,
  ORIGIN,
  DESTINATION,
} from './constants/navigationConstants';
import {verticalScale, scale} from 'react-native-size-matters';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_EXPANDED = Math.round(SCREEN_HEIGHT * 0.45);
const SHEET_COLLAPSED = verticalScale(48);
// ── Helpers ───────────────────────────────────────────────────────────────
const hasHereCredentials = Boolean(
  HERE_ACCESS_KEY_ID && HERE_ACCESS_KEY_SECRET,
);

function formatTollTotal(tollData) {
  if (!tollData) return '—';

  if (typeof tollData.total === 'number' || Array.isArray(tollData.tolls)) {
    const currency = tollData.currency || 'USD';
    const total = typeof tollData.total === 'number'
      ? tollData.total
      : (Array.isArray(tollData.tolls)
        ? tollData.tolls.reduce((sum, t) => {
            const price = t?.fares?.[0]?.price?.value;
            return sum + (Number.isFinite(price) ? price : 0);
          }, 0)
        : 0);
    const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency;
    return `${symbol}${Number(total || 0).toFixed(2)}`;
  }

  // Legacy HERE route shape
  const tollSections = tollData?.routes?.[0]?.sections || [];
  const tollList = tollSections.flatMap(s => s.tolls || []);
  const currency = tollList[0]?.fares?.[0]?.price?.currency || 'USD';
  const total = tollList.reduce((sum, toll) => {
    const price = toll?.fares?.[0]?.price?.value;
    return sum + (Number.isFinite(price) ? price : 0);
  }, 0);
  const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency;
  return `${symbol}${total.toFixed(2)}`;
}

async function fitCameraToCoords(mapRef, coords) {
  if (!mapRef?.current || !coords || coords.length < 2) return;
  try {
    const lats = coords.map(c => c.lat);
    const lngs = coords.map(c => c.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const midLat = (minLat + maxLat) / 2;
    const midLng = (minLng + maxLng) / 2;
    const spanDeg = Math.max(maxLat - minLat, maxLng - minLng);
    // Clamp zoom: very short routes → 15, cross-country → 5
    const zoom = Math.max(
      5,
      Math.min(15, 14 - Math.log2(Math.max(spanDeg, 0.001) * 111)),
    );
    await mapRef.current.moveCamera({
      lat: midLat,
      lng: midLng,
      zoom,
      bearing: 0,
      tilt: 0,
      animate: true,
      animationDuration: 800,
    });
  } catch (err) {
    console.warn('[fitCameraToCoords] moveCamera failed:', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
export default function HereMapScreen({navigation, route}) {
  const mapRef = useRef(null);
  const [sdkReady, setSdkReady] = useState(false);
  // Seed location from the shared LocationService cache (cache-first, no extra
  // GPS prompt). The live navigation watch below owns the continuous fixes.
  const {location: currentLocation} = useLocation({fetchOnMount: false});

  const sourceRef = useRef(null);
  const destinationRef = useRef(null);
  const [activeInput, setActiveInput] = useState(null);

  const normalizeLocation = loc => {
    if (!loc) return null;
    const lat = Number(loc.latitude);
    const lng = Number(loc.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }
    return {
      latitude: lat,
      longitude: lng,
      description: loc.description || '',
    };
  };

  const [sourceLocation, setSourceLocation] = useState(
    normalizeLocation(route?.params?.sourceLocation),
  );
  const [destinationLocation, setDestinationLocation] = useState(
    normalizeLocation(route?.params?.destinationLocation),
  );
  const [sourceText, setSourceText] = useState(
    route?.params?.sourceText || '',
  );
  const [destinationText, setDestinationText] = useState(
    route?.params?.destinationText || '',
  );
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [routeSummary, setRouteSummary] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const isNavigatingRef = useRef(false);
  const [navigationInfo, setNavigationInfo] = useState(null);
  const [truckDetails, setTruckDetails] = useState(null);

  const lastTollRouteRef = useRef('');
  const [tollData, setTollData] = useState(null);
  const [tollModalVisible, setTollModalVisible] = useState(false);

  // ── Marker icon selection (Truck / Car) ──────────────────────────────────
  // The chosen shape is rasterised in JS (see MarkerRasterizer) and the PNG
  // bytes are handed to native so source / destination / vehicle markers look
  // identical on iOS and Android.
  const [markerShape, setMarkerShape] = useState('truck');
  const [markerModalVisible, setMarkerModalVisible] = useState(false);
  const markerImagesRef = useRef(null);
  const [turnModalVisible, setTurnModalVisible] = useState(false);
  const [isTollLoading, setIsTollLoading] = useState(false);

  const [liveSpeedKph, setLiveSpeedKph] = useState(0);

  // Live map orientation (degrees, 0 = north-up). Polled from native so the
  // compass reset-to-north button can appear only when the user has rotated the
  // map, and so its needle tracks the current heading.
  const [mapBearing, setMapBearing] = useState(0);

  const [routeResponseForPanel, setRouteResponseForPanel] = useState(null);
  const routeResponseForPanelRef = useRef(null);
  useEffect(() => {
    routeResponseForPanelRef.current = routeResponseForPanel;
  }, [routeResponseForPanel]);

  const [snapSegmentIndex, setSnapSegmentIndex] = useState(-1);
  const [metersToNext, setMetersToNext] = useState(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);

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

  const destinationLocationRef = useRef(null);
  useEffect(() => {
    destinationLocationRef.current = normalizeLocation(destinationLocation);
  }, [destinationLocation]);
  useEffect(() => {
    isNavigatingRef.current = isNavigating;
  }, [isNavigating]);

  // Keep mirror refs so the preview effect always sees the latest values
  // without needing to list them as deps (which would cause extra fetches).
  const sourceLocationRef = useRef(null);
  useEffect(() => {
    sourceLocationRef.current = normalizeLocation(sourceLocation);
  }, [sourceLocation]);

  const [bottomSheetCollapsed, setBottomSheetCollapsed] = useState(false);
  const sheetHeightAnim = useRef(new Animated.Value(SHEET_EXPANDED)).current;

  const toggleBottomSheet = useCallback(() => {
    const next = !bottomSheetCollapsed;
    setBottomSheetCollapsed(next);
    Animated.timing(sheetHeightAnim, {
      toValue: next ? SHEET_COLLAPSED : SHEET_EXPANDED,
      duration: 280,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false, // height can't use the native driver
    }).start();
  }, [bottomSheetCollapsed, sheetHeightAnim]);

  const smooth = useSmoothLocation();

  // ─── FIX: Replace the fragile shouldFetchPreviewRef boolean with a
  //     stable "preview key" that increments whenever BOTH coords are
  //     present and either one has changed. The preview useEffect depends
  //     on this key — it fires exactly once per increment, no more.
  // ─────────────────────────────────────────────────────────────────────────
  const [previewKey, setPreviewKey] = useState(0);
  const lastPreviewPairRef = useRef({srcKey: null, dstKey: null});

  // Bump previewKey only when a genuinely new src+dst pair appears.
  useEffect(() => {
    if (isNavigatingRef.current) return;

    const safeSource = normalizeLocation(sourceLocation);
    const safeDestination = normalizeLocation(destinationLocation);

    if (!safeSource || !safeDestination) return;

    const srcKey = `${safeSource.latitude.toFixed(6)},${safeSource.longitude.toFixed(6)}`;
    const dstKey = `${safeDestination.latitude.toFixed(6)},${safeDestination.longitude.toFixed(6)}`;

    const prev = lastPreviewPairRef.current;
    if (srcKey === prev.srcKey && dstKey === prev.dstKey) return; // same pair, skip

    lastPreviewPairRef.current = {srcKey, dstKey};
    setPreviewKey(k => k + 1);
  }, [sourceLocation, destinationLocation]);

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
  // Timestamp of the last native marker forward — used to glide the native
  // marker animation over the real gap between forwards instead of a fixed ms.
  const lastMarkerUpdateTsRef = useRef(0);
  const rerouteRequestedRef = useRef(false);
  const lastRouteProgressMetersRef = useRef(0);
  const wrongWayStreakRef = useRef(0);
  // Last GPS fix used to derive speed when the device reports none (iOS).
  const lastSpeedSampleRef = useRef(null);
  // Timestamp of the last GPS fix delivered to the navigation watch. The watch
  // uses distanceFilter:1, so when the vehicle stops the OS stops emitting fixes
  // entirely — the watchdog below uses this to drop the live speed to 0 instead
  // of leaving the HUD frozen on the last moving value.
  const lastFixAtRef = useRef(0);

  // ─── smooth.subscribe ────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = smooth.subscribe(async pos => {
      try {
        if (!isUsableNavCoord(pos.lat, pos.lng)) return;

        if (isNavigatingRef.current) {
          setLiveSpeedKph(
            Number.isFinite(pos.speed) ? Math.round(pos.speed * 3.6) : 0,
          );
        }

        if (isNavigatingRef.current) {
          const geo = routeGeometryRef.current;
          const hasReal = hasRealGeometryRef.current;
          const truckBearing = isFinite(pos.bearing) ? pos.bearing : 0;

          if (geo && hasReal) {
            // Feed the smoothed travel bearing so the snap won't hop onto the
            // wrong leg at a flyover / roundabout / junction (see RouteGeometry).
            const snapHint = Number.isFinite(pos.bearing) ? pos.bearing : null;
            const snap = geo.snapToRoute(pos.lat, pos.lng, snapHint);
            if (!isValidCoord(snap.lat, snap.lng)) return;

            const rawBearing = isFinite(snap.bearing)
              ? snap.bearing
              : truckBearing;
            const prev = lastNativeMarkerRef.current;
            const distance = haversineDistanceMeters(
              prev.lat,
              prev.lng,
              snap.lat,
              snap.lng,
            );

            const movedEnough = distance >= 0.6;
            let bd = Math.abs(rawBearing - prev.bearing);
            if (bd > 180) bd = 360 - bd;
            const turnedEnough = bd >= NAVIGATION_MIN_TURN_DEGREES;
            const segChanged = snap.segmentIndex !== prev.trimIndex;

            if (!movedEnough && !turnedEnough && !segChanged) return;

            // Glide the native marker over the real gap since the last forward
            // (clamped) so it keeps moving between forwards instead of darting
            // in a fixed 180 ms and freezing.
            const nowMarker = Date.now();
            const sinceMarker = lastMarkerUpdateTsRef.current
              ? nowMarker - lastMarkerUpdateTsRef.current
              : NAVIGATION_MARKER_ANIMATION_MS;
            lastMarkerUpdateTsRef.current = nowMarker;
            const markerAnimMs = Math.min(900, Math.max(120, sinceMarker));

            const smoothBearing =
              prev.bearing +
              smallestBearingDelta(prev.bearing, rawBearing) * 0.2;
            lastNativeMarkerRef.current = {
              lat: snap.lat,
              lng: snap.lng,
              bearing: smoothBearing,
              trimIndex: snap.segmentIndex,
            };

            mapRef.current?.updateNavigationMarker({
              lat: snap.lat,
              lng: snap.lng,
              bearing: smoothBearing,
              animationDuration: markerAnimMs,
              markerSize: NAVIGATION_MARKER.size,
              iconAsset: NAVIGATION_MARKER.iconAsset,
              iconImage: markerImagesRef.current?.vehicle,
              segmentIndex: snap.segmentIndex,
            });

            const cursor = lastTrimCursorRef.current;
            if (
              snap.segmentIndex !== cursor.index ||
              Math.abs(snap.fraction - cursor.fraction) > 0.0001
            ) {
              lastTrimCursorRef.current = {
                index: snap.segmentIndex,
                fraction: snap.fraction,
              };

              const speed = pos.speed || 0;
              let offset = 0.015;
              if (speed > 15) offset = 0.035;
              else if (speed > 8) offset = 0.025;
              else if (speed > 3) offset = 0.02;
              const predictiveFraction = Math.min(snap.fraction + offset, 1);

              mapRef.current?.trimPolyline({
                trimIndex: snap.segmentIndex,
                trimFraction: predictiveFraction,
                splitLat: snap.lat,
                splitLng: snap.lng,
                speedMps: speed,
              });
              setSnapSegmentIndex(snap.segmentIndex);

              (() => {
                try {
                  const coords = routeCoordsRef.current;
                  const actions =
                    routeResponseForPanelRef.current?.routes?.[0]?.sections?.[0]
                      ?.actions ?? [];
                  if (!coords.length || !actions.length) return;
                  const nextAction = actions.find(
                    a => (a.offset ?? 0) > snap.segmentIndex,
                  );
                  if (!nextAction) {
                    setMetersToNext(0);
                    return;
                  }
                  const targetSegIdx = nextAction.offset;
                  let dist = 0;
                  const currentSegEnd = coords[snap.segmentIndex + 1];
                  if (currentSegEnd)
                    dist += haversineDistanceMeters(
                      snap.lat,
                      snap.lng,
                      currentSegEnd.lat,
                      currentSegEnd.lng,
                    );
                  for (
                    let si = snap.segmentIndex + 1;
                    si < targetSegIdx && si + 1 < coords.length;
                    si++
                  ) {
                    dist += haversineDistanceMeters(
                      coords[si].lat,
                      coords[si].lng,
                      coords[si + 1].lat,
                      coords[si + 1].lng,
                    );
                  }
                  setMetersToNext(dist);
                } catch (_) {}
              })();
            }

            const now = Date.now();
            const canUpdateCamera =
              now - lastCameraUpdateTsRef.current >=
              NAVIGATION_CAMERA_INTERVAL_MS;
            if (
              !isDrawingRouteRef.current &&
              !isCameraFreeRef.current &&
              canUpdateCamera
            ) {
              lastCameraUpdateTsRef.current = now;
              mapRef.current?.updateNavigationCamera({
                lat: snap.lat,
                lng: snap.lng,
                bearing: smoothBearing,
                speedMps: pos.speed,
                animationDuration: NAVIGATION_CAMERA_DURATION_MS,
              });
            }
          } else {
            const prev = lastNativeMarkerRef.current;
            const movedEnough =
              (Math.abs(pos.lat - prev.lat) + Math.abs(pos.lng - prev.lng)) *
                111_000 >=
              NAVIGATION_MIN_MOVE_METERS;
            let bd = Math.abs(truckBearing - prev.bearing);
            if (bd > 180) bd = 360 - bd;
            const turnedEnough = bd >= NAVIGATION_MIN_TURN_DEGREES;
            if (!movedEnough && !turnedEnough) return;

            const nowMarker = Date.now();
            const sinceMarker = lastMarkerUpdateTsRef.current
              ? nowMarker - lastMarkerUpdateTsRef.current
              : NAVIGATION_MARKER_ANIMATION_MS;
            lastMarkerUpdateTsRef.current = nowMarker;
            const markerAnimMs = Math.min(900, Math.max(120, sinceMarker));

            lastNativeMarkerRef.current = {
              lat: pos.lat,
              lng: pos.lng,
              bearing: truckBearing,
              trimIndex: -1,
            };
            mapRef.current?.updateNavigationMarker({
              lat: pos.lat,
              lng: pos.lng,
              bearing: truckBearing,
              animationDuration: markerAnimMs,
              markerSize: NAVIGATION_MARKER.size,
              iconAsset: NAVIGATION_MARKER.iconAsset,
              iconImage: markerImagesRef.current?.vehicle,
              segmentIndex: -1,
            });

            const now = Date.now();
            const canUpdateCamera =
              now - lastCameraUpdateTsRef.current >=
              NAVIGATION_CAMERA_INTERVAL_MS;
            if (
              !isDrawingRouteRef.current &&
              !isCameraFreeRef.current &&
              canUpdateCamera
            ) {
              lastCameraUpdateTsRef.current = now;
              mapRef.current?.updateNavigationCamera({
                lat: pos.lat,
                lng: pos.lng,
                bearing: truckBearing,
                speedMps: pos.speed,
                animationDuration: NAVIGATION_CAMERA_DURATION_MS,
              });
            }
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

  // ─── Stale-fix speed watchdog ──────────────────────────────────────────────
  // distanceFilter:1 means the OS stops delivering fixes the moment the vehicle
  // stops, so the last fix (and its non-zero speed) would otherwise stay on the
  // HUD forever. While navigating, if no fix has arrived for STALE_FIX_MS we
  // treat the vehicle as stopped and force the live speed to 0 in real time.
  useEffect(() => {
    if (!isNavigating) return undefined;
    const STALE_FIX_MS = 2000;
    const id = setInterval(() => {
      const last = lastFixAtRef.current;
      if (last && Date.now() - last > STALE_FIX_MS) {
        setLiveSpeedKph(prev => (prev === 0 ? prev : 0));
      }
    }, 500);
    return () => clearInterval(id);
  }, [isNavigating]);

  useEffect(() => {
    (async () => {
      if (!hasHereCredentials) {
        Alert.alert('HERE SDK Error', 'Missing credentials');
        return;
      }
      try {
        await HereMapModule.initSDK(HERE_ACCESS_KEY_ID, HERE_ACCESS_KEY_SECRET);
        console.log('✅ HERE SDK initialized');
        setSdkReady(true);
      } catch (e) {
        console.error('❌ HERE SDK init failed:', e.message);
        Alert.alert('HERE SDK Error', e.message);
      }
    })();
  }, []);

  // ── Restore the previously chosen marker shape ────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('here_marker_shape');
        if (saved === 'truck' || saved === 'car') setMarkerShape(saved);
      } catch (_) {}
    })();
  }, []);

  const handleSelectMarkerShape = useCallback(shape => {
    setMarkerShape(shape);
    setMarkerModalVisible(false);
    AsyncStorage.setItem('here_marker_shape', shape).catch(() => {});
  }, []);

  const extractRoutePolyline = useCallback(routeJson => {
    try {
      const sections = routeJson?.routes?.[0]?.sections || [];
      const allCoords = [];
      for (const section of sections) {
        const polyline = section.polyline;
        if (typeof polyline === 'string' && polyline.length > 0) {
          // sanitize polyline (remove whitespace which may break decoding)
          const cleaned = String(polyline).replace(/\s+/g, '');
          let decoded = decodeFlexiblePolyline(cleaned);
          if (!decoded || decoded.length === 0) {
            console.warn(
              '[Polyline] flexible decode returned 0 coords, trying Google decoder. polyline_len=',
              cleaned.length,
              'prefix=', cleaned.slice(0, 80),
            );
            decoded = decodeGooglePolyline(cleaned);
          }
          if (!decoded || decoded.length === 0) {
            console.warn(
              '[Polyline] Both decoders returned 0 coords — attempting fallbacks. raw_prefix=',
              String(polyline).slice(0, 120),
            );

            // Fallback 1: maybe API returned JSON-encoded array string
            try {
              const parsed = JSON.parse(polyline);
              if (Array.isArray(parsed) && parsed.length > 0) {
                const coordsFromJson = parsed.map(pt => {
                  if (Array.isArray(pt)) return {lat: pt[0], lng: pt[1]};
                  if (pt && (pt.lat != null || pt.lat !== undefined)) return {lat: pt.lat, lng: pt.lng ?? pt.lon};
                  return null;
                }).filter(Boolean);
                if (coordsFromJson.length) decoded = coordsFromJson;
              }
            } catch (e) {}

            // Fallback 2: maybe a whitespace/space separated list of lat,lng pairs
            if ((!decoded || decoded.length === 0) && typeof cleaned === 'string') {
              const parts = cleaned.trim().split(/\s+/);
              const maybeCoords = [];
              for (const p of parts) {
                const bits = p.split(',');
                if (bits.length >= 2) {
                  const la = Number(bits[0]);
                  const lo = Number(bits[1]);
                  if (Number.isFinite(la) && Number.isFinite(lo)) maybeCoords.push({lat: la, lng: lo});
                }
              }
              if (maybeCoords.length) decoded = maybeCoords;
            }

            if ((!decoded || decoded.length === 0)) {
              console.warn(
                '[Polyline] All decode attempts failed — polyline may be malformed. raw_prefix=',
                String(polyline).slice(0, 240),
              );
            }
          }
          allCoords.push(...(decoded || []));
        } else if (Array.isArray(polyline)) {
          for (const pt of polyline) {
            if (Array.isArray(pt)) allCoords.push({lat: pt[0], lng: pt[1]});
            else if (pt.lat != null)
              allCoords.push({lat: pt.lat, lng: pt.lng ?? pt.lon});
          }
        }
      }
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
      isDrawingRouteRef.current = true;
      // Draw the FULL route geometry (not a down-sampled copy) so the drawn
      // line exactly matches the route returned by the HERE API, and so the
      // native trim indices (which come from snapping against these same full
      // coords) line up segment-for-segment during navigation.
      await Promise.all([
        mapRef.current?.clearPolyline(),
        mapRef.current?.clearRoute(),
      ]);
      await mapRef.current?.drawPolyline({
        coordinates: coords,
        color: '#4285F4',
        width: NAVIGATION_ROUTE_WIDTH,
      });
      return coords;
    } catch (err) {
      console.warn('[Nav] drawPolyline failed:', err);
      return [];
    } finally {
      isDrawingRouteRef.current = false;
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
          lastTrimCursorRef.current = {index: -1, fraction: 0};
          await setupRouteGeometry(coords);
        } else {
          console.warn(
            '[Polyline] sanitizeRouteCoords returned < 2 points — using native drawRoute fallback',
          );
          hasRealGeometryRef.current = false;
          try {
            await Promise.all([
              mapRef.current?.clearPolyline(),
              mapRef.current?.clearRoute(),
            ]);
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
    const safeSource = normalizeLocation(sourceLocation);
    const safeDest = normalizeLocation(destinationLocation);
    // Default the route origin to the user's CURRENT location. Only fall back to
    // the hardcoded ORIGIN constant when neither a picked source nor a live GPS
    // fix is available.
    const hasCurrentLocation =
      currentLocation &&
      Number.isFinite(currentLocation.latitude) &&
      Number.isFinite(currentLocation.longitude);
    const origin = safeSource
      ? {latitude: safeSource.latitude, longitude: safeSource.longitude}
      : hasCurrentLocation
      ? {latitude: currentLocation.latitude, longitude: currentLocation.longitude}
      : {latitude: ORIGIN.lat, longitude: ORIGIN.lng};
    const dest = safeDest
      ? {latitude: safeDest.latitude, longitude: safeDest.longitude}
      : {latitude: DESTINATION.lat, longitude: DESTINATION.lng};

    if (destinationLocation && !safeDest) {
      Alert.alert('Route Error', 'Destination coordinates are invalid.');
      return;
    }

    setIsTollLoading(true);
    try {
      const tollResponse = await calculateRouteTolls(
        origin,
        dest,
        truckDetails?.currency || 'USD',
        truckDetails,
      );
      const routeJson = tollResponse?.raw || null;
      setTollData(tollResponse);
      setRouteResponseForPanel(routeJson);
      setRouteSummary(routeJson?.routes?.[0]?.sections?.[0]?.summary || null);

      await Promise.all([
        mapRef.current?.clearMarkers(),
        mapRef.current?.clearPolyline(),
        mapRef.current?.clearRoute(),
      ]);

      if (safeSource) {
        if (safeSource.description?.toLowerCase().includes('current location')) {
          await mapRef.current?.showCurrentLocation({
            lat: safeSource.latitude,
            lng: safeSource.longitude,
            bearing: smooth.smoothPos.current.bearing ?? 0,
          });
        } else {
          await mapRef.current?.addMarker({
            lat: safeSource.latitude,
            lng: safeSource.longitude,
            color: '#22C55E',
            image: markerImagesRef.current?.source,
            markerSize: MARKER_DISPLAY_SIZE,
          });
        }
      }
      if (safeDest) {
        await mapRef.current?.addMarker({
          lat: safeDest.latitude,
          lng: safeDest.longitude,
          color: '#FF3366',
          image: markerImagesRef.current?.destination,
          markerSize: MARKER_DISPLAY_SIZE,
        });
      }

      const rawCoords = extractRoutePolyline(routeJson);
      const coords = sanitizeRouteCoords(
        rawCoords,
        {lat: origin.latitude, lng: origin.longitude},
        {lat: dest.latitude, lng: dest.longitude},
      );
      const displayCoords = reduceRouteCoords(coords, 1000);
      if (displayCoords.length >= 2) {
        await mapRef.current?.drawPolyline({
          coordinates: displayCoords,
          color: '#4285F4',
          width: NAVIGATION_ROUTE_WIDTH,
        });
        // ── FIX: Fit camera to the drawn polyline ──────────────────────
        await fitCameraToCoords(mapRef, coords);
      } else {
        console.warn(
          '[handleDrawRoute] Falling back to native drawRoute — coord count:',
          coords.length,
        );
        await mapRef.current?.drawRoute({
          originLat: origin.latitude,
          originLng: origin.longitude,
          destLat: dest.latitude,
          destLng: dest.longitude,
        });
      }
    } catch (e) {
      Alert.alert('Route Error', e.message);
    } finally {
      setIsTollLoading(false);
    }
  };

  const handleStartNavigation = async () => {
    if (!destinationLocation) {
      Alert.alert('Navigation', 'Select a destination first.');
      return;
    }
    if (isNavigating) {
      stopNavigation();
      return;
    }

    if (previewDebounceRef.current) {
      clearTimeout(previewDebounceRef.current);
      previewDebounceRef.current = null;
    }

    setIsRouteLoading(true);

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
      const safeSource = normalizeLocation(sourceLocation);
      if (safeSource) {
        navStartSource = {
          latitude: safeSource.latitude,
          longitude: safeSource.longitude,
          description: safeSource.description || 'Current Location',
        };
      } else {
        Alert.alert('Navigation', 'Current GPS location not available yet.');
        setIsRouteLoading(false);
        return;
      }
    }

    const safeDestination = normalizeLocation(destinationLocation);
    if (!safeDestination) {
      Alert.alert('Navigation', 'Selected destination coordinates are invalid.');
      setIsRouteLoading(false);
      return;
    }

    routeGeometryRef.current = null;
    routeCoordsRef.current = [];
    hasRealGeometryRef.current = false;
    lastTrimCursorRef.current = {index: -1, fraction: 0};
    rerouteRequestedRef.current = false;
    lastRouteProgressMetersRef.current = 0;
    wrongWayStreakRef.current = 0;
    lastSpeedSampleRef.current = null;
    lastFixAtRef.current = 0;
    setSnapSegmentIndex(-1);
    setMetersToNext(null);
    setLiveSpeedKph(0);

    try {
      const tollResponse = await calculateRouteTolls(
        {latitude: navStartSource.latitude, longitude: navStartSource.longitude},
        {latitude: safeDestination.latitude, longitude: safeDestination.longitude},
        truckDetails?.currency || 'USD',
        truckDetails,
      );
      const startRoute = tollResponse?.raw || null;
      setRouteResponseForPanel(startRoute);
      const startSummary = startRoute?.routes?.[0]?.sections?.[0]?.summary || null;
      setRouteSummary(startSummary);
      updateNavigationInfo(startSummary);

      const startRawCoords = extractRoutePolyline(startRoute);
      const startCoords = sanitizeRouteCoords(
        startRawCoords,
        {lat: navStartSource.latitude, lng: navStartSource.longitude},
        {lat: safeDestination.latitude, lng: safeDestination.longitude},
      );
      if (startCoords.length >= 2) {
        await setupRouteGeometry(startCoords);
      } else {
        hasRealGeometryRef.current = false;
        try {
          await Promise.all([
            mapRef.current?.clearPolyline(),
            mapRef.current?.clearRoute(),
          ]);
          await mapRef.current?.drawRoute({
            originLat: navStartSource.latitude,
            originLng: navStartSource.longitude,
            destLat: safeDestination.latitude,
            destLng: safeDestination.longitude,
          });
        } catch (_) {}
      }
    } catch (routeErr) {
      console.warn('[Nav] start route build failed', routeErr);
      hasRealGeometryRef.current = false;
    }

    lastRouteRefreshRef.current = Date.now();
    lastCameraUpdateTsRef.current = 0;
    lastMarkerUpdateTsRef.current = 0;
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
                safeDestination.latitude,
                safeDestination.longitude,
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
          safeDestination.latitude,
          safeDestination.longitude,
        );
      }
    }

    if (immediatePos)
      smooth.pushLocation(
        immediatePos.lat,
        immediatePos.lng,
        immediateBearing,
        immediateSpeed,
      );

    try {
      if (
        immediatePos &&
        isUsableNavCoord(immediatePos.lat, immediatePos.lng)
      ) {
        await mapRef.current?.hideCurrentLocation();
        await Promise.all([
          mapRef.current?.updateNavigationMarker({
            lat: immediatePos.lat,
            lng: immediatePos.lng,
            bearing: immediateBearing,
            animationDuration: 0,
            markerSize: NAVIGATION_MARKER.size,
            iconAsset: NAVIGATION_MARKER.iconAsset,
            iconImage: markerImagesRef.current?.vehicle,
            segmentIndex: lastTrimCursorRef.current.index,
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
        if (
          startGeo &&
          hasRealAtStart &&
          lastTrimCursorRef.current.index >= 0
        ) {
          await mapRef.current?.trimPolyline({
            trimIndex: lastTrimCursorRef.current.index,
            trimFraction: lastTrimCursorRef.current.fraction,
            splitLat: immediatePos.lat,
            splitLng: immediatePos.lng,
            speedMps: immediateSpeed,
          });
        }
        if (
          isValidCoord(
            safeDestination.latitude,
            safeDestination.longitude,
          )
        ) {
          await mapRef.current?.addMarker({
            lat: safeDestination.latitude,
            lng: safeDestination.longitude,
            color: '#FF3366',
            image: markerImagesRef.current?.destination,
            markerSize: MARKER_DISPLAY_SIZE,
          });
        }
      } else {
        await mapRef.current?.hideCurrentLocation();
      }
    } catch (_) {}

    setIsNavigating(true);
    setIsRouteLoading(false);

    try {
      const watchId = await watchCurrentLocation(
        async position => {
          const lat = position.latitude;
          const lng = position.longitude;
          if (!isUsableNavCoord(lat, lng)) return;
          // Mark this fix's arrival so the stale-fix watchdog knows the vehicle
          // is still moving (it zeroes the speed once fixes stop coming in).
          lastFixAtRef.current = Date.now();
          let liveSpeed = resolveLiveSpeedMps(position);
          // iOS often reports no/invalid GPS speed; derive it from the distance
          // between consecutive fixes so the speed HUD matches Android.
          const nowTs = Number.isFinite(position?.timestamp)
            ? position.timestamp
            : Date.now();
          if (!Number.isFinite(liveSpeed)) {
            const prevSample = lastSpeedSampleRef.current;
            if (prevSample) {
              const dtSec = (nowTs - prevSample.timestamp) / 1000;
              if (dtSec >= 0.3) {
                const movedMeters = haversineDistanceMeters(
                  prevSample.lat,
                  prevSample.lng,
                  lat,
                  lng,
                );
                const computed = movedMeters / dtSec;
                // Keep a clean 0 when idle; reject GPS jumps (>360 km/h).
                if (Number.isFinite(computed) && computed >= 0 && computed < 100) {
                  liveSpeed = computed;
                }
              }
            }
          }
          lastSpeedSampleRef.current = {lat, lng, timestamp: nowTs};
          const liveHeading =
            Number.isFinite(position?.bearing) &&
            Math.abs(position.bearing) > 0.1
              ? position.bearing
              : Number.isFinite(position?.heading) &&
                Math.abs(position.heading) > 0.1
              ? position.heading
              : undefined;

          sourceRef.current = {latitude: lat, longitude: lng};

          const geo = routeGeometryRef.current;
          const hasReal = hasRealGeometryRef.current;

          if (geo && hasReal) {
            // Pass the live heading so the base snap already prefers the leg we
            // are travelling on before directionAwareSnap refines it.
            let rawSnap = geo.snapToRoute(
              lat,
              lng,
              Number.isFinite(liveHeading) ? liveHeading : null,
            );
            try {
              const heading =
                Number.isFinite(position?.bearing) &&
                Math.abs(position.bearing) > 0.1
                  ? position.bearing
                  : Number.isFinite(position?.heading) &&
                    Math.abs(position.heading) > 0.1
                  ? position.heading
                  : undefined;
              const dirSnap = directionAwareSnap({
                lat,
                lng,
                heading,
                speed: liveSpeed,
                accuracy: position?.accuracy ?? undefined,
                coords: routeCoordsRef.current,
                lastIndex: lastTrimCursorRef.current?.index ?? -1,
                rawSnap,
              });
              if (dirSnap) rawSnap = dirSnap;
            } catch (e) {
              console.warn(
                '[Nav] direction-aware snap failed',
                e?.message ?? e,
              );
            }

            if (rawSnap.distFromRoute > OFF_ROUTE_THRESHOLD) {
              rerouteRequestedRef.current = true;
              lastRouteRefreshRef.current = 0;
            }

            const progressMeters =
              Number.isFinite(rawSnap.progress) &&
              Number.isFinite(geo?.totalDistance)
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

          const now = Date.now();
          const dest = normalizeLocation(destinationLocationRef.current);
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
              const origin = normalizeLocation(sourceRef.current) ?? {
                latitude: lat,
                longitude: lng,
              };
              const tollResponse = await calculateRouteTolls(
                {latitude: origin.latitude, longitude: origin.longitude},
                {latitude: dest.latitude, longitude: dest.longitude},
                truckDetails?.currency || 'USD',
                truckDetails,
              );
              const navRoute = tollResponse?.raw || null;
              setRouteResponseForPanel(navRoute);
              setSnapSegmentIndex(-1);
              setMetersToNext(null);
              const navSummary =
                navRoute?.routes?.[0]?.sections?.[0]?.summary || null;
              setRouteSummary(navSummary);
              updateNavigationInfo(navSummary);
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

      (async () => {
        try {
          const start = await getCurrentLocation({detectMock: true});
          sourceRef.current = {
            latitude: start.latitude,
            longitude: start.longitude,
          };
          setSourceText('Current Location');
          const startGeoNow = routeGeometryRef.current;
          if (startGeoNow && hasRealGeometryRef.current) {
            const snap = startGeoNow.snapToRoute(
              start.latitude,
              start.longitude,
            );
            smooth.pushLocation(snap.lat, snap.lng, snap.bearing);
          } else {
            smooth.pushLocation(start.latitude, start.longitude);
          }
          if (!hasRealGeometryRef.current) {
            try {
              const tollResponse = await calculateRouteTolls(
                {latitude: start.latitude, longitude: start.longitude},
                {
                  latitude: safeDestination.latitude,
                  longitude: safeDestination.longitude,
                },
                truckDetails?.currency || 'USD',
                truckDetails,
              );
              const freshRoute = tollResponse?.raw || null;
              const summary = freshRoute?.routes?.[0]?.sections?.[0]?.summary || null;
              setRouteSummary(summary);
              updateNavigationInfo(summary);
              const coords = extractRoutePolyline(freshRoute);
              const safeCoords = sanitizeRouteCoords(
                coords,
                {lat: start.latitude, lng: start.longitude},
                {
                  lat: safeDestination.latitude,
                  lng: safeDestination.longitude,
                },
              );
              if (safeCoords.length >= 2) {
                await setupRouteGeometry(safeCoords);
              } else {
                try {
                  await Promise.all([
                    mapRef.current?.clearPolyline(),
                    mapRef.current?.clearRoute(),
                  ]);
                  await mapRef.current?.drawRoute({
                    originLat: start.latitude,
                    originLng: start.longitude,
                    destLat: safeDestination.latitude,
                    destLng: safeDestination.longitude,
                  });
                } catch (_) {}
              }
            } catch (routeErr) {
              console.warn('fresh route failed', routeErr);
            }
          }
        } catch (err) {
          console.warn('bg GPS setup failed', err);
        }
      })();
    } catch (err) {
      Alert.alert('Navigation', err?.message || 'Unable to start');
      isNavigatingRef.current = false;
      setIsNavigating(false);
      setIsRouteLoading(false);
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
    setRouteResponseForPanel(null);
    setSnapSegmentIndex(-1);
    setMetersToNext(null);
    setIsCameraFree(false);
    setTollData(null);
    setLiveSpeedKph(0);
    setTurnModalVisible(false);

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
    lastMarkerUpdateTsRef.current = 0;
    rerouteRequestedRef.current = false;
    lastRouteProgressMetersRef.current = 0;
    wrongWayStreakRef.current = 0;
    lastSpeedSampleRef.current = null;
    lastFixAtRef.current = 0;
    // Force the preview effect to re-run so the toll cost is re-fetched after
    // navigation ends — otherwise an unchanged src/dst pair leaves it stuck
    // on "Fetching..".
    lastPreviewPairRef.current = {srcKey: null, dstKey: null};

    (async () => {
      try {
        await mapRef.current?.resetNavigationCamera();
        await mapRef.current?.removeNavigationMarker();
        await Promise.all([
          mapRef.current?.clearPolyline(),
          mapRef.current?.clearRoute(),
        ]);
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
    const totalMinutes = Math.ceil(summary.duration / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const etaText = hours > 0 ? `${hours} hr ${minutes} min` : `${minutes} min`;
    const arrivalTime = new Date(Date.now() + summary.duration * 1000);
    const arrivalStr = arrivalTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    setNavigationInfo({distKm, etaText, arrivalStr});
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

  // ─── Compass reset-to-north ──────────────────────────────────────────────
  const handleResetNorth = useCallback(async () => {
    try {
      await mapRef.current?.resetNorth();
      setMapBearing(0);
    } catch (_) {}
  }, []);

  // Poll the native camera bearing so the compass button can show only when the
  // map is rotated away from north. Runs in preview/idle mode only — during
  // navigation the map is intentionally heading-up and the Re-center button
  // governs the camera instead.
  useEffect(() => {
    if (!sdkReady || isNavigating) {
      setMapBearing(0);
      return undefined;
    }
    let active = true;
    const id = setInterval(async () => {
      try {
        const state = await mapRef.current?.getCameraState();
        if (active && state && Number.isFinite(state.bearing)) {
          setMapBearing(state.bearing);
        }
      } catch (_) {}
    }, 600);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [sdkReady, isNavigating]);

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

  // ─── Seed source from Redux current location (only when no source yet) ───
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

  // ─── Center the map on the user's current location when the screen opens
  //     or comes back into focus. Skipped while navigating or when a
  //     destination is already set (the route preview frames the camera then).
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sdkReady) return;

    const centerOnCurrentLocation = async () => {
      if (isNavigatingRef.current) return;
      if (destinationLocationRef.current) return;
      try {
        const location = await getCurrentLocation({detectMock: true});
        if (!isUsableNavCoord(location.latitude, location.longitude)) return;
        // Re-check after the async GPS resolve in case state changed.
        if (isNavigatingRef.current || destinationLocationRef.current) return;
        smooth.pushLocation(location.latitude, location.longitude);
        await mapRef.current?.showCurrentLocation({
          lat: location.latitude,
          lng: location.longitude,
          bearing: 0,
        });
        await mapRef.current?.moveCamera({
          lat: location.latitude,
          lng: location.longitude,
          zoom: 15,
          animate: true,
          animationDuration: 800,
        });
      } catch (e) {
        console.warn('[focus] center on current location failed', e);
      }
    };

    centerOnCurrentLocation();
    const unsub = navigation?.addListener?.('focus', centerOnCurrentLocation);
    return unsub;
  }, [sdkReady, navigation, smooth]);

  // ─── Seed from route params ───────────────────────────────────────────────
  useEffect(() => {
    const params = route?.params || {};
    const incomingDestination = normalizeLocation(params.destinationLocation);
    const incomingSource = normalizeLocation(params.sourceLocation);

    if (incomingDestination) {
      setDestinationLocation(incomingDestination);
      setDestinationText(
        params.destinationText || incomingDestination.description || '',
      );
    }
    if (incomingSource) {
      setSourceLocation(incomingSource);
      setSourceText(
        params.sourceText || incomingSource.description || '',
      );
    }
    if (params.truckDetails && typeof params.truckDetails === 'object') {
      setTruckDetails(params.truckDetails);
    }
    if (params.tollsData) {
      setTollData(params.tollsData);
      try {
        const routeJson = params.tollsData?.raw || null;
        if (routeJson) {
          const origin = incomingSource || {
            latitude: ORIGIN.lat,
            longitude: ORIGIN.lng,
          };
          const dest = incomingDestination || {
            latitude: DESTINATION.lat,
            longitude: DESTINATION.lng,
          };
          const rawCoords = extractRoutePolyline(routeJson);
          const coords = sanitizeRouteCoords(
            rawCoords,
            {lat: origin.latitude, lng: origin.longitude},
            {lat: dest.latitude, lng: dest.longitude},
          );
          if (coords.length >= 2) {
            const displayCoords = reduceRouteCoords(coords, 600);
            // draw preview polyline
            (async () => {
              try {
                await mapRef.current?.clearMarkers();
                await mapRef.current?.clearPolyline();
                await mapRef.current?.drawPolyline({
                  coordinates: displayCoords,
                  color: '#4285F4',
                  width: NAVIGATION_ROUTE_WIDTH,
                });
                // expose route json to panels
                setRouteResponseForPanel(routeJson);
                const summary = routeJson?.routes?.[0]?.sections?.[0]?.summary || null;
                setRouteSummary(summary);
                await fitCameraToCoords(mapRef, coords);
              } catch (_) {}
            })();
          }
        }
      } catch (_) {}
    }
    // NOTE: No longer manually setting shouldFetchPreviewRef here.
    // The previewKey useEffect above automatically detects the new pair.
  }, [route?.params]);

  // ─── Preview useEffect — fires exactly once per new src+dst pair ──────────
  // Depends on previewKey (incremented only when a genuinely new pair arrives)
  // and sdkReady. Reads the latest locations via refs to avoid stale closures.
  // ─────────────────────────────────────────────────────────────────────────
  const previewDebounceRef = useRef(null);

  useEffect(() => {
    if (!sdkReady) return;
    if (previewKey === 0) return; // no pair has arrived yet
    if (isNavigatingRef.current) return;

    // Read the LATEST locations via refs (not stale closure values).
    const src = normalizeLocation(sourceLocationRef.current);
    const dst = normalizeLocation(destinationLocationRef.current);

    const srcReady = src && isUsableNavCoord(src.latitude, src.longitude);
    const dstReady = dst && isUsableNavCoord(dst.latitude, dst.longitude);
    if (!srcReady || !dstReady) return;

    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    setTollData(null);

    let cancelled = false;

    previewDebounceRef.current = setTimeout(async () => {
      if (cancelled || isNavigatingRef.current) return;

      // Re-read refs inside the timeout to get truly latest values.
      const latestSrc = normalizeLocation(sourceLocationRef.current);
      const latestDst = normalizeLocation(destinationLocationRef.current);
      if (
        !latestSrc ||
        !latestDst ||
        !isUsableNavCoord(latestSrc.latitude, latestSrc.longitude) ||
        !isUsableNavCoord(latestDst.latitude, latestDst.longitude)
      ) {
        return;
      }

      try {
        let coords = [];
        let summary = null;
        let usedNative = false;

        // ── Call the API (route + tolls) ─────────────────────────────────
        try {
          const tollResponse = await calculateRouteTolls(
            {latitude: latestSrc.latitude, longitude: latestSrc.longitude},
            {latitude: latestDst.latitude, longitude: latestDst.longitude},
            truckDetails?.currency || 'USD',
            truckDetails,
          );
          if (cancelled) return;
          const routeJson = tollResponse?.raw || null;
          setTollData(tollResponse);
          // expose route json to panels
          setRouteResponseForPanel(routeJson);
          summary = routeJson?.routes?.[0]?.sections?.[0]?.summary || null;
          coords = sanitizeRouteCoords(
            extractRoutePolyline(routeJson),
            {lat: latestSrc.latitude, lng: latestSrc.longitude},
            {lat: latestDst.latitude, lng: latestDst.longitude},
          );
          previewRouteJsonRef.current = routeJson;
          if (coords.length < 2) usedNative = true;
        } catch (routeErr) {
          console.warn('[Preview] Route API failed:', routeErr);
          if (cancelled) return;
          usedNative = true;
        }

        if (cancelled) return;

        // ── Clear map layers before drawing ──────────────────────────────
        await Promise.all([
          mapRef.current?.clearMarkers(),
          mapRef.current?.clearPolyline(),
          mapRef.current?.clearRoute(),
        ]);
        if (cancelled) return;

        previewRouteCoordsRef.current = [];
        previewRouteSummaryRef.current = null;
        previewUsedNativeRouteRef.current = false;

        // ── Source marker ─────────────────────────────────────────────────
        if (isUsableNavCoord(latestSrc.latitude, latestSrc.longitude)) {
          if (
            latestSrc.description?.toLowerCase().includes('current location')
          ) {
            await mapRef.current?.showCurrentLocation({
              lat: latestSrc.latitude,
              lng: latestSrc.longitude,
              bearing: smooth.smoothPos.current.bearing ?? 0,
            });
          } else {
            await mapRef.current?.addMarker({
              lat: latestSrc.latitude,
              lng: latestSrc.longitude,
              color: '#22C55E',
              image: markerImagesRef.current?.source,
              markerSize: MARKER_DISPLAY_SIZE,
            });
          }
        }
        if (cancelled) return;

        // ── Destination marker ────────────────────────────────────────────
        if (isUsableNavCoord(latestDst.latitude, latestDst.longitude)) {
          await mapRef.current?.addMarker({
            lat: latestDst.latitude,
            lng: latestDst.longitude,
            color: '#FF3366',
            image: markerImagesRef.current?.destination,
            markerSize: MARKER_DISPLAY_SIZE,
          });
        }
        if (cancelled) return;

        if (summary) {
          setRouteSummary(summary);
          previewRouteSummaryRef.current = summary;
        }

        // ── Draw polyline or fallback ─────────────────────────────────────
        if (coords.length >= 2) {
          const displayCoords = reduceRouteCoords(coords, 600);
          previewRouteCoordsRef.current = displayCoords;
          await mapRef.current?.drawPolyline({
            coordinates: displayCoords,
            color: '#4285F4',
            width: NAVIGATION_ROUTE_WIDTH,
          });
          if (cancelled) return;
          // ── FIX: Always fit camera after drawing preview polyline ──────
          await fitCameraToCoords(mapRef, coords);
        } else if (
          usedNative &&
          isUsableNavCoord(latestSrc.latitude, latestSrc.longitude) &&
          isUsableNavCoord(latestDst.latitude, latestDst.longitude)
        ) {
          previewUsedNativeRouteRef.current = true;
          await mapRef.current?.drawRoute({
            originLat: latestSrc.latitude,
            originLng: latestSrc.longitude,
            destLat: latestDst.latitude,
            destLng: latestDst.longitude,
          });
          // ── FIX: Fit camera for native fallback route too ─────────────
          if (!cancelled) {
            await fitCameraToCoords(mapRef, [
              {lat: latestSrc.latitude, lng: latestSrc.longitude},
              {lat: latestDst.latitude, lng: latestDst.longitude},
            ]);
          }
        }
      } catch (err) {
        if (!cancelled) console.warn('preview sync failed', err);
      }
    }, 350);

    return () => {
      cancelled = true;
      if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkReady, previewKey]);
  // ^^^ ONLY sdkReady and previewKey — not sourceLocation/destinationLocation.
  //     This prevents double-firing when both states update in the same cycle.

  useEffect(() => {
    return () => {
      if (navigationWatchIdRef.current != null)
        clearWatchLocation(navigationWatchIdRef.current);
    };
  }, []);

  const handleClear = async () => {
    try {
      await Promise.all([
        mapRef.current?.clearMarkers(),
        mapRef.current?.clearPolyline(),
        mapRef.current?.clearRoute(),
      ]);
      setRouteSummary(null);
      setNavigationInfo(null);
      setTollData(null);
      routeGeometryRef.current = null;
      routeCoordsRef.current = [];
      hasRealGeometryRef.current = false;
      // Reset the preview pair so next destination select triggers a fresh fetch
      lastPreviewPairRef.current = {srcKey: null, dstKey: null};
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* ── Loading overlay ── */}
      {isRouteLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingOverlayText}>
            Fetching best route for you...
          </Text>
        </View>
      )}

      {/* ── Top / Map area ── */}
      <View style={[styles.topArea, {flex: 1}]}>
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
                ? 'Initializing HERE SDK…'
                : 'Add credentials to .env'}
            </Text>
          </View>
        )}

        {/* ── Next-maneuver HUD (top, navigating only) ──
            Google-Maps-style turn arrow + live countdown to the upcoming
            maneuver, driven by the HERE turn-by-turn `actions` data. */}
        {isNavigating && (
          <NextManeuverHud
            routeResponse={routeResponseForPanel}
            isNavigating={isNavigating}
            snapSegmentIndex={snapSegmentIndex}
            metersToNext={metersToNext}
          />
        )}

        {/* Compass — visible in preview/idle mode (hidden while navigating).
            The needle tracks the live map heading; tapping snaps the map back
            to north-up. */}
        {!isNavigating && (
          <TouchableOpacity
            style={styles.compassButton}
            onPress={handleResetNorth}
            activeOpacity={0.8}>
            {/* The whole compass icon rotates opposite the map bearing so it
                always points to geographic north on screen. */}
            <View
              style={{
                transform: [{rotate: `${-mapBearing}deg`}],
              }}>
              <CompassIcon
                width={scale(28)}
                height={scale(28)}
                fill="#1e293b"
              />
            </View>
          </TouchableOpacity>
        )}

        {/* Re-center (navigating only) */}
        {isNavigating && (
          <TouchableOpacity
            style={styles.reCenterButton}
            onPress={handleReCenter}
            activeOpacity={0.8}>
            <Text style={styles.reCenterIcon}>◎</Text>
            <Text style={styles.reCenterLabel}>Re-center</Text>
          </TouchableOpacity>
        )}

        {/* GPS button */}
        <TouchableOpacity
          style={[styles.gpsButton, isNavigating && styles.gpsButtonNavigating]}
          onPress={handleShowLocation}
          disabled={isFetchingLocation}
          activeOpacity={0.8}>
          {isFetchingLocation ? (
            <ActivityIndicator size="small" color="#040000" />
          ) : (
            <GpsIcon width={verticalScale(28)} height={verticalScale(28)} fill="#040000" />
          )}
        </TouchableOpacity>

        {/* Marker-icon picker (hidden during navigation) */}
        {!isNavigating && (
          <TouchableOpacity
            style={styles.markerPickerBtn}
            onPress={() => setMarkerModalVisible(true)}
            activeOpacity={0.8}>
            <MarkerPin iconKey={markerShape} color="#2563EB" width={verticalScale(26)} />
          </TouchableOpacity>
        )}

        {/* Off-screen rasteriser: turns the chosen SVGs into PNG bytes for native */}
        <MarkerRasterizer
          vehicleShape={markerShape}
          onReady={imgs => {
            markerImagesRef.current = imgs;
          }}
        />
      </View>

      {/* ── Bottom area ── */}
      {/* <View style={styles.bottomArea}> */}

      <Animated.View
        style={[styles.bottomArea, {flex: 0, height: sheetHeightAnim}]}>
        {/* Drag handle / hide-show toggle */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={toggleBottomSheet}
          style={styles.sheetHandle}>
          <View style={styles.sheetHandleBar} />
        </TouchableOpacity>
        <View style={styles.sheetBody}>
          {!destinationLocation ? (
            <View style={styles.placeholderCard}>
              <Text style={styles.placeholderTitle}>Pick your destination</Text>
              <Text style={styles.placeholderText}>
                Tap the search button above to choose where you want to go and
                preview the route.
              </Text>
            </View>
          ) : isNavigating ? (
            // ── NAVIGATION-MODE bottom panel ──────────────────────────────
            <View style={styles.navPanel}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.navScrollContent}>
              {/* Small button → opens turn-by-turn directions modal */}
              <TouchableOpacity
                style={styles.navDirectionsBtn}
                onPress={() => setTurnModalVisible(true)}
                activeOpacity={0.85}>
                <Text style={styles.navDirectionsIcon}>🧭</Text>
                <Text style={styles.navDirectionsText} numberOfLines={1}>
                  Turn-by-turn directions
                </Text>
                <Text style={styles.navDirectionsChevron}>›</Text>
              </TouchableOpacity>
              <View style={styles.navTopRow}>
                {/* Left side → Speed */}
                <View style={styles.navSpeedHero}>
                  <Text style={styles.navSpeedValue}>{liveSpeedKph}</Text>
                  <Text style={styles.navSpeedUnit}>km/h</Text>
                </View>

                {/* Right side → Button */}
                <TouchableOpacity
                  style={styles.navStopBtn}
                  onPress={stopNavigation}
                  activeOpacity={0.85}>
                  <Text style={styles.navStopBtnText}>End Navigation</Text>
                </TouchableOpacity>
              </View>

              {/* Trip stats: remaining time | distance | arrival */}
              <View style={styles.navStatsRow}>
                <View style={styles.navStatItem}>
                  <Text style={styles.navStatValue}>
                    {navigationInfo?.etaText ?? '—'}
                  </Text>
                  <Text style={styles.navStatLabel}>Remaining</Text>
                </View>
                <View style={styles.navStatDivider} />
                <View style={styles.navStatItem}>
                  <Text style={styles.navStatValue}>
                    {navigationInfo?.distKm ?? '—'} km
                  </Text>
                  <Text style={styles.navStatLabel}>Distance</Text>
                </View>
                <View style={styles.navStatDivider} />
                <View style={styles.navStatItem}>
                  <Text style={styles.navStatValue}>
                    {navigationInfo?.arrivalStr ?? '—'}
                  </Text>
                  <Text style={styles.navStatLabel}>Arrival</Text>
                </View>
              </View>

              {/* Destination + toll */}
              <View style={styles.navMetaRow}>
                <View style={styles.navMetaToCol}>
                  <Text style={styles.navMetaLabel}>To</Text>
                  <Text style={styles.navMetaValue} numberOfLines={1}>
                    {destinationText || '—'}
                  </Text>
                </View>
                <View style={styles.navMetaTollCol}>
                  <Text style={styles.navMetaLabel}>Toll</Text>
                  {isTollLoading ? (
                    <ActivityIndicator size="small" color="#10B981" />
                  ) : tollData ? (
                    <TouchableOpacity onPress={() => setTollModalVisible(true)}>
                      <Text style={styles.navTollValue}>
                        {formatTollTotal(tollData)}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.navTollValue}>—</Text>
                  )}
                </View>
              </View>
                </ScrollView>
            </View>
          ) : (
            // ── PREVIEW MODE (your existing details UI, unchanged) ────────
            <View style={[styles.detailsContainer, {flex: 1}]}>
              <View style={styles.bottomControlsBar}>
                <NavigationControls
                  onCamera={handleMoveCamera}
                  onMarkers={handleAddMarkers}
                  onLocation={handleShowLocation}
                  onRoute={handleDrawRoute}
                  onNavigate={handleStartNavigation}
                  onClear={handleClear}
                  isNavigating={isNavigating}
                />
              </View>

              <ScrollView
                style={styles.previewScroll}
                contentContainerStyle={styles.previewScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled">
                <View style={styles.previewCard}>
                  <View style={styles.detailsHeader}>
                    <Text style={styles.detailsTitle}>Route Details</Text>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Toll Cost</Text>
                      {isTollLoading ? (
                        <ActivityIndicator size="small" color="#3B7EFF" />
                      ) : tollData ? (
                        <TouchableOpacity
                          onPress={() => setTollModalVisible(true)}>
                          <Text style={styles.summaryValueToll}>
                            {formatTollTotal(tollData)}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.summaryValueToll}>Fetching..</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>From</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {sourceText || 'Current Location'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>To</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {destinationText}
                    </Text>
                  </View>

                  {routeSummary ? (
                    <View style={styles.routeSummaryCard}>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Total Distance</Text>
                        <Text style={styles.summaryValue}>
                          {(routeSummary.length / 1000).toFixed(2)} km
                        </Text>
                      </View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Est. Time</Text>
                        <Text style={styles.summaryValue}>
                          {Math.ceil(routeSummary.duration / 60)} min
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.loadingDetails}>
                      <Text style={styles.loadingText}>
                        Loading route details...
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Animated.View>
      {/* </View> */}

      {/* ── Turn-by-turn directions modal ── */}
      <Modal
        visible={turnModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTurnModalVisible(false)}>
        <TouchableOpacity
          style={styles.turnModalOverlay}
          activeOpacity={1}
          onPress={() => setTurnModalVisible(false)}>
          {/* Inner content swallows taps so it doesn't close on press */}
          <TouchableOpacity activeOpacity={1} style={styles.turnModalContent}>
            <View style={styles.turnModalHeader}>
              <Text style={styles.turnModalTitle}>Directions</Text>
              <TouchableOpacity
                onPress={() => setTurnModalVisible(false)}
                activeOpacity={0.7}>
                <Text style={styles.tollModalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <TurnByTurnPanel
              routeResponse={routeResponseForPanel}
              isNavigating={false} // false → render the full scrollable step list
              snapSegmentIndex={snapSegmentIndex}
              metersToNext={metersToNext}
              style={styles.turnPanelInModal} // cancels component's position:absolute
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Toll breakdown modal ── */}
      <Modal
        visible={tollModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTollModalVisible(false)}>
        <TouchableOpacity
          style={styles.tollModalOverlay}
          activeOpacity={1}
          onPress={() => setTollModalVisible(false)}>
          <View style={styles.tollModalContent}>
            <View style={styles.tollModalHeader}>
              <Text style={styles.tollModalTitle}>Toll Breakdown</Text>
              <TouchableOpacity
                onPress={() => setTollModalVisible(false)}
                activeOpacity={0.7}>
                <Text style={styles.tollModalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.tollModalScroll}
              showsVerticalScrollIndicator={false}
              bounces>
              {(tollData?.routes?.[0]?.sections ||
                tollData?.raw?.routes?.[0]?.sections ||
                (Array.isArray(tollData?.tolls) ? [{tolls: tollData.tolls}] : [])
              ).map((section, si) =>
                (section.tolls || []).map((toll, ti) => {
                  const fares = toll.fares || [];
                  const singleFares = fares.filter(f => {
                    if (!f.pass) return true;
                    if (f.pass.returnJourney === true) return false;
                    if (f.pass.validityPeriod != null) return false;
                    return true;
                  });
                  const best = (singleFares.length ? singleFares : fares)[0];
                  const amount = best?.price?.value || 0;
                  const currency = best?.price?.currency || tollData?.currency || 'USD';
                  const symbol =
                    currency === 'INR'
                      ? '₹'
                      : currency === 'USD'
                      ? '$'
                      : currency === 'EUR'
                      ? '€'
                      : currency;
                  return (
                    <View key={`${si}-${ti}`} style={styles.tollItem}>
                      <View style={styles.tollItemLeft}>
                        <Text style={styles.tollItemName}>
                          {toll.tollSystem || 'Toll'}
                        </Text>
                        <Text style={styles.tollItemRoad}>
                          {toll.name || 'Route'}
                        </Text>
                      </View>
                      <Text style={styles.tollItemAmount}>
                        {symbol}
                        {amount.toFixed(2)}
                      </Text>
                    </View>
                  );
                }),
              )}

              <View style={styles.tollItemTotal}>
                <Text style={styles.tollItemTotalLabel}>Total Estimate</Text>
                <Text style={styles.tollItemTotalAmount}>
                  {formatTollTotal(tollData)}
                </Text>
              </View>

              <Text style={styles.tollModalNote}>
                * Shows cheapest one-way toll per booth
              </Text>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Marker icon picker modal ── */}
      <Modal
        visible={markerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMarkerModalVisible(false)}>
        <TouchableOpacity
          style={styles.markerModalOverlay}
          activeOpacity={1}
          onPress={() => setMarkerModalVisible(false)}>
          <View style={styles.markerModalCard}>
            <Text style={styles.markerModalTitle}>
              Choose vehicle icon
            </Text>
            <Text style={styles.markerModalSubtitle}>
              Shown for your vehicle while navigating. Source uses a home pin and
              destination a truck pin.
            </Text>
            <View style={styles.markerModalRow}>
              {['truck', 'car'].map(shape => {
                const selected = markerShape === shape;
                return (
                  <TouchableOpacity
                    key={shape}
                    onPress={() => handleSelectMarkerShape(shape)}
                    activeOpacity={0.85}
                    style={[
                      styles.markerOption,
                      {
                        borderColor: selected ? '#2563EB' : '#e2e8f0',
                        backgroundColor: selected ? '#eff6ff' : '#ffffff',
                      },
                    ]}>
                    <MarkerPin
                      iconKey={shape}
                      color="#2563EB"
                      width={verticalScale(46)}
                    />
                    <Text
                      style={[
                        styles.markerOptionLabel,
                        {color: selected ? '#2563EB' : '#475569'},
                      ]}>
                      {shape}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
