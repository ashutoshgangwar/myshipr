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
import {calculateTruckRouteREST} from './services/hereTruckService';

import {HereMapView, HereMapModule} from './components/HereMap/index';
import RouteGeometry from './components/HereMap/Routegeometry';
import HereSearchCard from './hereSearchCard';
import {useSelector} from 'react-redux';
import {selectLocation} from '../../redux/slices/locationSlice';

// Utilities and hooks
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
} from './utils/mathUtils';
import {
  decodeFlexiblePolyline,
  decodeGooglePolyline,
} from './utils/polylineDecoder';

// Components
import {
  NavigationControls,
  ToolbarButton,
} from './components/NavigationControls';
import {NavigationInfo} from './components/NavigationInfo';

// Constants
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
  ORIGIN,
  DESTINATION,
} from './constants/navigationConstants';

const hasHereCredentials = Boolean(
  HERE_ACCESS_KEY_ID && HERE_ACCESS_KEY_SECRET,
);

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
  // ── NEW: loading overlay state ──
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

  // const pendingTrimRef = useRef(null);
  // const isTrimFlushingRef = useRef(false);

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

  // const flushPendingTrim = useCallback(async () => {
  //   if (isTrimFlushingRef.current) return;
  //   const payload = pendingTrimRef.current;
  //   if (!payload) return;

  //   isTrimFlushingRef.current = true;
  //   pendingTrimRef.current = null;

  //   try {
  //     await mapRef.current?.trimPolyline(payload);
  //   } catch (_) {
  //   } finally {
  //     isTrimFlushingRef.current = false;
  //     if (pendingTrimRef.current) {
  //       flushPendingTrim();
  //     }
  //   }
  // }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // smooth.subscribe — single source of truth for marker + trim + camera
  // (identical to Version 2 which has the working trim logic)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = smooth.subscribe(async pos => {
      try {
        if (!isUsableNavCoord(pos.lat, pos.lng)) return;

        if (isNavigatingRef.current) {
          const geo = routeGeometryRef.current;
          const hasReal = hasRealGeometryRef.current;

          const truckBearing = isFinite(pos.bearing) ? pos.bearing : 0;

          if (geo && hasReal) {
            const snap = geo.snapToRoute(pos.lat, pos.lng);
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

            const movedEnough = distance >= 2;
            let bd = Math.abs(rawBearing - prev.bearing);
            if (bd > 180) bd = 360 - bd;
            const turnedEnough = bd >= NAVIGATION_MIN_TURN_DEGREES;
            const segChanged = snap.segmentIndex !== prev.trimIndex;

            if (!movedEnough && !turnedEnough && !segChanged) return;

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
              animationDuration: NAVIGATION_MARKER_ANIMATION_MS,
              markerSize: NAVIGATION_MARKER.size,
              iconAsset: NAVIGATION_MARKER.iconAsset,
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

              // 🔥 PREDICTIVE TRIM (marker se aage trim karega)
              const speed = pos.speed || 0;

              // dynamic prediction based on speed
              let offset = 0.015; // base

              if (speed > 15) offset = 0.035; // highway
              else if (speed > 8) offset = 0.025; // city
              else if (speed > 3) offset = 0.02; // slow traffic

              const predictiveFraction = Math.min(snap.fraction + offset, 1);

              // 🚀 DIRECT TRIM (NO QUEUE, NO DELAY)
              mapRef.current?.trimPolyline({
                trimIndex: snap.segmentIndex,
                trimFraction: predictiveFraction,
                splitLat: snap.lat,
                splitLng: snap.lng,
                speedMps: speed,
              });
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

            mapRef.current?.updateNavigationMarker({
              lat: pos.lat,
              lng: pos.lng,
              bearing: truckBearing,
              animationDuration: NAVIGATION_MARKER_ANIMATION_MS,
              markerSize: NAVIGATION_MARKER.size,
              iconAsset: NAVIGATION_MARKER.iconAsset,
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
  // Polyline extraction
  // -------------------------------------------------------------------------
  const extractRoutePolyline = useCallback(routeJson => {
    try {
      const sections = routeJson?.routes?.[0]?.sections || [];
      const allCoords = [];

      for (const section of sections) {
        const polyline = section.polyline;

        if (typeof polyline === 'string' && polyline.length > 0) {
          let decoded = decodeFlexiblePolyline(polyline);

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
    // pendingTrimRef.current = null;
    try {
      isDrawingRouteRef.current = true;
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
      Alert.alert(
        'Route',
        'Please wait for valid source and destination coordinates.',
      );
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
  // Keeps Version 2's full logic (working trim + reroute) and adds the
  // loading overlay from Version 1 around it.
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

    if (previewDebounceRef.current) {
      clearTimeout(previewDebounceRef.current);
      previewDebounceRef.current = null;
    }

    // ── Show loading overlay ──
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
        setIsRouteLoading(false); // ── hide loader on early exit ──
        return;
      }
    }

    // Reset all navigation state
    routeGeometryRef.current = null;
    routeCoordsRef.current = [];
    hasRealGeometryRef.current = false;
    lastTrimCursorRef.current = {index: -1, fraction: 0};
    // pendingTrimRef.current = null;
    rerouteRequestedRef.current = false;
    lastRouteProgressMetersRef.current = 0;
    wrongWayStreakRef.current = 0;

    try {
      // Fetch route while loader is showing
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

    // ── Hide loader — navigation has started ──
    setIsRouteLoading(false);

    try {
      const watchId = await watchCurrentLocation(
        async position => {
          const lat = position.latitude;
          const lng = position.longitude;
          if (!isUsableNavCoord(lat, lng)) return;
          const liveSpeed = resolveLiveSpeedMps(position);
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

          // Push to smooth — smooth.subscribe handles marker/trim/camera
          if (geo && hasReal) {
            let rawSnap = geo.snapToRoute(lat, lng);
            try {
              const heading =
                Number.isFinite(position?.bearing) &&
                Math.abs(position.bearing) > 0.1
                  ? position.bearing
                  : Number.isFinite(position?.heading) &&
                    Math.abs(position.heading) > 0.1
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
              console.warn(
                '[Nav] direction-aware snap failed',
                e?.message ?? e,
              );
            }

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
              console.log(
                '[Nav] wrong-way movement detected — forcing reroute',
              );
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

          // Periodic / deviation reroute
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

      // Background: get a precise GPS fix and freshen geometry if still missing
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
        } catch (err) {
          console.warn('bg GPS setup failed', err);
        }
      })();
    } catch (err) {
      Alert.alert('Navigation', err?.message || 'Unable to start');
      isNavigatingRef.current = false;
      setIsNavigating(false);
      setIsRouteLoading(false); // ── safety: hide loader on catch ──
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
    // pendingTrimRef.current = null;
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

  const previewDebounceRef = useRef(null);
  useEffect(() => {
    if (!sdkReady) return;
    if (isNavigatingRef.current) return;

    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);

    let cancelled = false;

    previewDebounceRef.current = setTimeout(async () => {
      if (cancelled || isNavigatingRef.current) return;
      try {
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
              {
                latitude: sourceLocation.latitude,
                longitude: sourceLocation.longitude,
              },
              {
                latitude: destinationLocation.latitude,
                longitude: destinationLocation.longitude,
              },
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

        await Promise.all([
          mapRef.current?.clearMarkers(),
          mapRef.current?.clearPolyline(),
          mapRef.current?.clearRoute(),
        ]);
        if (cancelled) return;

        previewRouteCoordsRef.current = [];
        previewRouteSummaryRef.current = null;
        previewUsedNativeRouteRef.current = false;

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
            width: NAVIGATION_ROUTE_WIDTH,
          });
          if (cancelled) return;
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
            lat: midLat,
            lng: midLng,
            zoom,
            animate: true,
            animationDuration: 700,
          });
          console.log('[Preview] polyline drawn:', coords.length, 'pts');
        } else if (
          usedNative &&
          sourceLocation &&
          destinationLocation &&
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

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Loading overlay — shown while fetching the initial route */}
      {isRouteLoading && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{color: '#fff', marginTop: 12, fontSize: 16}}>
            Fetching best route for you...
          </Text>
        </View>
      )}

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

      <NavigationInfo
        navigationInfo={navigationInfo}
        routeSummary={routeSummary}
        isNavigating={isNavigating}
        onStop={stopNavigation}
      />

      <NavigationControls
        onCamera={handleMoveCamera}
        onMarkers={handleAddMarkers}
        onLocation={handleShowLocation}
        onRoute={handleDrawRoute}
        onNavigate={handleStartNavigation}
        onClear={handleClear}
        isNavigating={isNavigating}
      />

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
