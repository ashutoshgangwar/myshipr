// VectorMap.js
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  TouchableOpacity,
  Text,
  View,
  ScrollView,
  Modal,
} from 'react-native';
import styles from './VectorMap.styles';
import MapLibreGL, { setAccessToken } from '@maplibre/maplibre-react-native';
import Gps_Icon from '../../assets/svg_icon/gps-svg.svg';
import Truck_Icon from '../../assets/svg_icon/truck-icon.svg';
import Location_Icon from '../../assets/svg_icon/location.svg';
import {
  clearWatchLocation,
  getCurrentLocation,
  watchCurrentLocation,
} from '../../services/LocationService';
import PtvSearchCard from '../../apiservices/ptvSearchCard';
import CustomMarker from '../../component/Navigation_components/CustomMarker';
import {GOOGLE_MAPS_API_KEY, PTV_API_KEY} from '@env';
import {getRouteBetweenPoints} from '../../apiservices/ptvRoutingService';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import { moderateScale, verticalScale, scale } from 'react-native-size-matters';

// ─── Constants ───────────────────────────────────────────────────────────────

const MAP_STYLES = {
  silica: 'silica',
  blackmarble: 'blackmarble',
  classic: 'classic',
  amber: 'amber',
  gravelpit: 'gravelpit',
  sandbox: 'sandbox',
  silkysand: 'silkysand',
};

const PTV_RASTER_LAYERS =
  'transport,background,labels,trafficIncidents,trafficPatterns';
const PTV_RASTER_TILE_SIZE = 512;

const buildRasterTileTemplateUrl = (style, apiKey = '') => {
  const query = [
    `layers=${PTV_RASTER_LAYERS}`,
    `size=${PTV_RASTER_TILE_SIZE}`,
    `style=${encodeURIComponent(style)}`,
  ];
  if (apiKey) query.push(`apiKey=${encodeURIComponent(apiKey)}`);
  return `https://api.myptv.com/rastermaps/v1/image-tiles/{z}/{x}/{y}?${query.join('&')}`;
};

const INITIAL_COORDINATE = [8.4055677, 49.0070036];
const CITY_ZOOM_LEVELS = [5, 8, 11, 13, 15, 17];
const INITIAL_ZOOM = 11;
const NAVIGATE_ZOOM = 16;
const MIN_ZOOM = 1;
const MAX_ZOOM = 18;

// ── Navigation tuning ────────────────────────────────────────────────────────
const ROUTE_REFETCH_DISTANCE_METERS = 120;
const ROUTE_REFETCH_MIN_INTERVAL_MS = 60_000; // 60 s
const MOVEMENT_UPDATE_THRESHOLD_METERS = 1;
const NAV_CAMERA_PITCH = 45;
const NAV_CAMERA_PADDING = {
  paddingTop: verticalScale(280),
  paddingRight: scale(24),
  paddingBottom: verticalScale(90),
  paddingLeft: scale(24),
};

// ── Off-route detection: if truck is more than this many metres from the route,
//    re-fetch a new route from current position to destination ──────────────
const OFF_ROUTE_THRESHOLD_METERS = 120;
const OFF_ROUTE_CONSECUTIVE_HITS_REQUIRED = 3;
const OFF_ROUTE_REROUTE_COOLDOWN_MS = 20_000;
const MAX_OFF_ROUTE_ACCURACY_METERS = 35;

const ZOOM_LABELS = {
  1: 'World', 2: 'World', 3: 'Continent', 4: 'Continent',
  5: 'Country', 6: 'Country', 7: 'State', 8: 'State',
  9: 'Region', 10: 'Region', 11: 'City', 12: 'City',
  13: 'District', 14: 'District', 15: 'Streets', 16: 'Streets',
  17: 'Buildings', 18: 'Buildings',
};

setAccessToken(null);

// ─── Helpers (defined outside component to avoid re-creation) ────────────────

const smoothBearing = (current, target, factor = 0.15) => {
  let diff = target - current;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return current + diff * factor;
};

// ─── Component ───────────────────────────────────────────────────────────────

export const VectorMap = props => {
  const {
    latitude,
    longitude,
    zoomLevel,
    showMarker = true,
    markerColor = '#E53935',
  } = props;

  // ── Refs ──────────────────────────────────────────────────────────────────
  const cameraRef = useRef(null);
  const smoothBearingRef = useRef(0);
  const lastCameraUpdateRef = useRef(0);
  const sourceAutocompleteRef = useRef(null);
  const destinationAutocompleteRef = useRef(null);
  const locationWatchIdRef = useRef(null);

  const lastTrackedGpsCoordRef = useRef(null);
  const lastRouteFetchCoordRef = useRef(null);
  const lastRouteFetchTimeRef = useRef(null);
  const isFetchingRouteRef = useRef(false);
  const offRouteConsecutiveHitsRef = useRef(0);
  const lastOffRouteRerouteTimeRef = useRef(0);

  const lastSourceSetByRef = useRef('user');
  const lastDestinationSetByRef = useRef('user');
  const styleSwitchInProgressRef = useRef(false);

  // ─── FIX: Use refs for navigation-critical state to break the dependency
  //     chain that caused cascading re-renders and progress resets.
  //     The problem was: GPS update → setSourceLocation → fetchRouteNow changes
  //     → applyLocationUpdate changes → ensureLiveTrackingStarted changes
  //     → useEffect re-runs → watcher killed + progress reset.
  //
  //     Solution: Store route polyline and navigation flag in refs so the
  //     applyLocationUpdate callback is STABLE and doesn't cause the useEffect
  //     to re-trigger.
  // ──────────────────────────────────────────────────────────────────────────
  const routePolylineCoordsRef = useRef(null);
  const isNavigatingRef = useRef(false);
  const sourceLocationRef = useRef(null);
  const destinationLocationRef = useRef(null);

  // ── State ─────────────────────────────────────────────────────────────────
  const [mapStyle, setMapStyle] = useState(MAP_STYLES.silica);
  const [currentZoom, setCurrentZoom] = useState(INITIAL_ZOOM);
  const [cameraPitch, setCameraPitch] = useState(0);
  const [cameraHeading, setCameraHeading] = useState(0);
  const [selectedCoordinate, setSelectedCoordinate] = useState(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [activeInput, setActiveInput] = useState(null);
  const [sourceLocation, setSourceLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [sourceText, setSourceText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [routeData, setRouteData] = useState(null);
  const [displayRoutePolyline, setDisplayRoutePolyline] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [routeApiCallCount, setRouteApiCallCount] = useState(0);
  const [secondsSinceLastRouteApiCall, setSecondsSinceLastRouteApiCall] = useState(0);
  const [routeApiIntervalSeconds, setRouteApiIntervalSeconds] = useState(null);
  const [truckCoordinate, setTruckCoordinate] = useState(null);
  const [truckBearing, setTruckBearing] = useState(0);
  const [routeProgress, setRouteProgress] = useState(0);
  const [remainingPolyline, setRemainingPolyline] = useState(null);
  const [isStyleLoading, setIsStyleLoading] = useState(false);
  const [pendingStyleId, setPendingStyleId] = useState(null);
  const [annotationRefreshToken, setAnnotationRefreshToken] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);

  // ─── FIX: Keep refs in sync with state so callbacks always see latest values
  //     without needing state in their dependency arrays ──────────────────────
  useEffect(() => { isNavigatingRef.current = isNavigating; }, [isNavigating]);
  useEffect(() => { sourceLocationRef.current = sourceLocation; }, [sourceLocation]);
  useEffect(() => { destinationLocationRef.current = destinationLocation; }, [destinationLocation]);

  // ── Derived API key ───────────────────────────────────────────────────────
  const effectivePtvApiKey = useMemo(() => {
    const propKey = typeof props.apiKey === 'string' ? props.apiKey.trim() : '';
    const envKey = typeof PTV_API_KEY === 'string' ? PTV_API_KEY.trim() : '';
    const processEnvKey =
      typeof process?.env?.PTV_API_KEY === 'string'
        ? process.env.PTV_API_KEY.trim()
        : '';
    return propKey || envKey || processEnvKey || '';
  }, [props.apiKey]);

  const ptvRasterTileTemplateUrl = useMemo(
    () => buildRasterTileTemplateUrl(mapStyle, effectivePtvApiKey),
    [mapStyle, effectivePtvApiKey],
  );

  const mapStyleDefinition = useMemo(
    () => ({
      version: 8,
      sources: {
        'ptv-raster-source': {
          type: 'raster',
          tiles: [ptvRasterTileTemplateUrl],
          tileSize: PTV_RASTER_TILE_SIZE,
        },
      },
      layers: [
        {
          id: 'ptv-raster-layer',
          type: 'raster',
          source: 'ptv-raster-source',
          minzoom: MIN_ZOOM,
          maxzoom: MAX_ZOOM,
        },
      ],
    }),
    [ptvRasterTileTemplateUrl],
  );

  const hasActiveCoordinate =
    selectedCoordinate != null || (latitude != null && longitude != null);

  // ── Geometry helpers ──────────────────────────────────────────────────────
  const toRadians = useCallback(v => (v * Math.PI) / 180, []);
  const toDegrees = useCallback(v => (v * 180) / Math.PI, []);

  const getSegmentDistanceMeters = useCallback(
    (pointA, pointB) => {
      if (!pointA || !pointB) return 0;
      const [lon1, lat1] = pointA;
      const [lon2, lat2] = pointB;
      const R = 6371000;
      const dLat = toRadians(lat2 - lat1);
      const dLon = toRadians(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) *
          Math.cos(toRadians(lat2)) *
          Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    },
    [toRadians],
  );

  const getBearing = useCallback(
    (from, to) => {
      if (!from || !to) return 0;
      const [lon1, lat1] = from;
      const [lon2, lat2] = to;
      const lat1R = toRadians(lat1);
      const lat2R = toRadians(lat2);
      const dLonR = toRadians(lon2 - lon1);
      const y = Math.sin(dLonR) * Math.cos(lat2R);
      const x =
        Math.cos(lat1R) * Math.sin(lat2R) -
        Math.sin(lat1R) * Math.cos(lat2R) * Math.cos(dLonR);
      return (toDegrees(Math.atan2(y, x)) + 360) % 360;
    },
    [toDegrees, toRadians],
  );

  const getPolylineLengthMeters = useCallback(
    coordinates => {
      if (!Array.isArray(coordinates) || coordinates.length < 2) return 0;
      let total = 0;
      for (let i = 1; i < coordinates.length; i++) {
        total += getSegmentDistanceMeters(coordinates[i - 1], coordinates[i]);
      }
      return total;
    },
    [getSegmentDistanceMeters],
  );

  const getProjectedPointOnSegment = useCallback(
    (point, segmentStart, segmentEnd) => {
      const latRef = toRadians(
        (point[1] + segmentStart[1] + segmentEnd[1]) / 3,
      );
      const mPerLat = 111320;
      const mPerLon = 111320 * Math.cos(latRef);
      const toM = ([lon, lat]) => ({x: lon * mPerLon, y: lat * mPerLat});
      const toC = ({x, y}) => [x / mPerLon, y / mPerLat];
      const p = toM(point);
      const s = toM(segmentStart);
      const e = toM(segmentEnd);
      const dx = e.x - s.x;
      const dy = e.y - s.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) {
        return {
          coordinate: segmentStart,
          ratio: 0,
          distanceMeters: Math.hypot(p.x - s.x, p.y - s.y),
        };
      }
      const ratio = Math.max(
        0,
        Math.min(1, ((p.x - s.x) * dx + (p.y - s.y) * dy) / lenSq),
      );
      const proj = {x: s.x + dx * ratio, y: s.y + dy * ratio};
      return {
        coordinate: toC(proj),
        ratio,
        distanceMeters: Math.hypot(p.x - proj.x, p.y - proj.y),
      };
    },
    [toRadians],
  );

  const getRoutePositionFromCurrentLocation = useCallback(
    (coordinates, currentCoordinate) => {
      if (
        !Array.isArray(coordinates) ||
        coordinates.length < 2 ||
        !currentCoordinate
      ) {
        return null;
      }

      const totalLength = getPolylineLengthMeters(coordinates);
      if (totalLength <= 0) return null;

      let travelledBefore = 0;
      let best = {
        distanceMeters: Number.POSITIVE_INFINITY,
        coveredMeters: 0,
        coordinate: coordinates[0],
        bearing: 0,
        segmentIndex: 0,
        segmentRatio: 0,
      };

      for (let i = 1; i < coordinates.length; i++) {
        const start = coordinates[i - 1];
        const end = coordinates[i];
        const segLen = getSegmentDistanceMeters(start, end);
        const proj = getProjectedPointOnSegment(currentCoordinate, start, end);

        if (proj.distanceMeters < best.distanceMeters) {
          best = {
            distanceMeters: proj.distanceMeters,
            coveredMeters: travelledBefore + segLen * proj.ratio,
            coordinate: proj.coordinate,
            bearing: getBearing(start, end),
            segmentIndex: i,
            segmentRatio: proj.ratio,
          };
        }

        travelledBefore += segLen;
      }

      // Build the remaining polyline: snapped point → destination
      const remainingCoords = [
        best.coordinate,
        ...coordinates.slice(best.segmentIndex),
      ];

      return {
        progress: Math.max(0, Math.min(1, best.coveredMeters / totalLength)),
        coordinate: best.coordinate,
        bearing: best.bearing,
        remainingCoords,
        offRouteDistance: best.distanceMeters,
      };
    },
    [
      getBearing,
      getPolylineLengthMeters,
      getProjectedPointOnSegment,
      getSegmentDistanceMeters,
    ],
  );

  // ── Route metrics ─────────────────────────────────────────────────────────
  const routePolylineCoordinates = displayRoutePolyline;

  // ─── FIX: Keep the ref in sync so the stable applyLocationUpdate can read it
  useEffect(() => {
    routePolylineCoordsRef.current = routePolylineCoordinates;
  }, [routePolylineCoordinates]);

  const routePolylineLength = useMemo(
    () => getPolylineLengthMeters(routePolylineCoordinates),
    [getPolylineLengthMeters, routePolylineCoordinates],
  );

  const totalDistanceMeters = routeData?.distance ?? routePolylineLength;
  const totalTravelSeconds = routeData?.travelTime ?? 0;
  const coveredDistanceMeters = Math.max(totalDistanceMeters * routeProgress, 0);
  const remainingDistanceMeters = Math.max(totalDistanceMeters - coveredDistanceMeters, 0);
  const pendingTimeSeconds = Math.max(totalTravelSeconds * (1 - routeProgress), 0);

  // ── Formatters ────────────────────────────────────────────────────────────
  const formatDistance = useCallback(meters => {
    const miles = meters / 1609.34;
    if (miles < 0.1) return `${Math.round(meters * 3.28084)} ft`;
    return `${miles.toFixed(2)} mi`;
  }, []);

  const formatTime = useCallback(seconds => {
    if (seconds < 60) return `${Math.max(0, Math.round(seconds))}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, []);

  // ── Location origin setters ───────────────────────────────────────────────
  const setSourceLocationWithOrigin = useCallback((location, origin = 'user') => {
    lastSourceSetByRef.current = origin;
    setSourceLocation(location);
  }, []);

  const setDestinationLocationWithOrigin = useCallback((location, origin = 'user') => {
    lastDestinationSetByRef.current = origin;
    setDestinationLocation(location);
  }, []);

  // ── Fetch route (internal, call-guarded) ──────────────────────────────────
  /**
   * FIX: Accept explicit source/dest so callers can pass coordinates directly
   * without depending on state (which may be stale in a callback).
   * Falls back to current sourceLocation/destinationLocation state.
   */
  const fetchRouteNow = useCallback(
    async (showLoader = true, explicitSource = null, explicitDest = null) => {
      const src = explicitSource || sourceLocationRef.current;
      const dst = explicitDest || destinationLocationRef.current;
      if (!src || !dst) return null;
      if (isFetchingRouteRef.current) return null;

      const now = Date.now();
      if (
        lastRouteFetchTimeRef.current &&
        now - lastRouteFetchTimeRef.current < ROUTE_REFETCH_MIN_INTERVAL_MS
      ) {
        return null;
      }

      isFetchingRouteRef.current = true;
      const prevFetchTime = lastRouteFetchTimeRef.current;
      lastRouteFetchTimeRef.current = now;

      setRouteApiCallCount(prev => prev + 1);
      setSecondsSinceLastRouteApiCall(0);
      if (prevFetchTime) {
        setRouteApiIntervalSeconds(Math.max(0, Math.round((now - prevFetchTime) / 1000)));
      }

      try {
        if (showLoader) setIsLoadingRoute(true);
        setRouteError(null);
        const response = await getRouteBetweenPoints(
          src.latitude,
          src.longitude,
          dst.latitude,
          dst.longitude,
        );
        const hasValidPolyline =
          Array.isArray(response?.polylineCoordinates) &&
          response.polylineCoordinates.length >= 2;

        if (hasValidPolyline) {
          setDisplayRoutePolyline(response.polylineCoordinates);
          routePolylineCoordsRef.current = response.polylineCoordinates;
          setRemainingPolyline(response.polylineCoordinates);
        }

        setRouteData(prev => {
          if (hasValidPolyline) return response;
          if (prev?.polylineCoordinates) {
            return {
              ...response,
              polylineCoordinates: prev.polylineCoordinates,
            };
          }
          return response;
        });

        return response;
      } catch (err) {
        console.warn('Route fetch failed:', err);
        setRouteError('Failed to fetch route');
        return null;
      } finally {
        if (showLoader) setIsLoadingRoute(false);
        isFetchingRouteRef.current = false;
      }
    },
    // FIX: No sourceLocation / destinationLocation in deps — we read from refs
    [],
  );

  // ── Live GPS update handler ───────────────────────────────────────────────
  /**
   * FIX: This callback is now STABLE — it reads navigation state and polyline
   * from refs instead of depending on them via closure. This prevents the
   * cascading re-render loop that was resetting progress.
   *
   * Called on every GPS tick from watchCurrentLocation.
   * Responsibilities:
   *  1. Skip if movement < threshold (avoids GPS jitter)
   *  2. Snap truck to route polyline & update bearing
   *  3. Trim the remaining polyline to the snapped point
   *  4. Fly camera to truck position with correct heading
   *  5. Detect off-route and re-fetch if needed
   *  6. Re-fetch route on distance gate
   */
  const applyLocationUpdate = useCallback(
    location => {
      if (!location) return;
      const currentGpsCoord = [location.longitude, location.latitude];

      // 1. Movement gate — ignore GPS jitter
      if (lastTrackedGpsCoordRef.current) {
        const moved = getSegmentDistanceMeters(
          lastTrackedGpsCoordRef.current,
          currentGpsCoord,
        );
        if (moved < MOVEMENT_UPDATE_THRESHOLD_METERS) return;
      }
      lastTrackedGpsCoordRef.current = currentGpsCoord;

      // Always keep source synced to real GPS during navigation
      // FIX: Only update source text, DON'T call setSourceLocationWithOrigin
      // during navigation to avoid triggering dependency chains.
      // Instead, update the ref directly and only update state minimally.
      if (isNavigatingRef.current) {
        sourceLocationRef.current = {
          latitude: location.latitude,
          longitude: location.longitude,
          description: 'Current Location',
        };
        sourceAutocompleteRef.current?.setAddressText('Current Location');
      } else {
        // When not navigating, still update source location via state
        // (but with 'gps' origin so it doesn't trigger route refetch)
        setSourceLocationWithOrigin(
          {latitude: location.latitude, longitude: location.longitude, description: 'Current Location'},
          'gps',
        );
        sourceAutocompleteRef.current?.setAddressText('Current Location');
      }

      // 2 & 3. Snap to route and trim polyline
      const polyCoords = routePolylineCoordsRef.current;
      const routePos = getRoutePositionFromCurrentLocation(
        polyCoords,
        currentGpsCoord,
      );

      let snappedCoord = currentGpsCoord;
      let heading = 0;

      if (routePos) {
        snappedCoord = routePos.coordinate ?? currentGpsCoord;
        // FIX: Always update progress (not just during isNavigating)
        setRouteProgress(prev => Math.max(prev, routePos.progress));
        if (routePos.remainingCoords && routePos.remainingCoords.length >= 2) {
          setRemainingPolyline(routePos.remainingCoords);
        }

        // Apply smooth bearing
        const rawBearing = routePos.bearing ?? 0;
        smoothBearingRef.current = smoothBearing(
          smoothBearingRef.current,
          rawBearing,
        );
        heading = smoothBearingRef.current;

        // ── FIX: Off-route detection — if truck is too far from the route,
        //    trigger a re-route from current GPS position to destination ──
        if (isNavigatingRef.current) {
          const isAccuracyReliable =
            typeof location?.accuracy !== 'number' ||
            location.accuracy <= MAX_OFF_ROUTE_ACCURACY_METERS;

          if (
            isAccuracyReliable &&
            routePos.offRouteDistance > OFF_ROUTE_THRESHOLD_METERS
          ) {
            offRouteConsecutiveHitsRef.current += 1;
            const canReroute =
              offRouteConsecutiveHitsRef.current >=
                OFF_ROUTE_CONSECUTIVE_HITS_REQUIRED &&
              Date.now() - lastOffRouteRerouteTimeRef.current >=
                OFF_ROUTE_REROUTE_COOLDOWN_MS;

            if (canReroute) {
              const currentSrc = {
                latitude: location.latitude,
                longitude: location.longitude,
                description: 'Current Location',
              };
              lastRouteFetchCoordRef.current = currentGpsCoord;
              lastOffRouteRerouteTimeRef.current = Date.now();
              offRouteConsecutiveHitsRef.current = 0;

              // Force time gate reset so re-route happens immediately
              lastRouteFetchTimeRef.current = null;
              fetchRouteNow(false, currentSrc, destinationLocationRef.current);
            }
          } else {
            offRouteConsecutiveHitsRef.current = 0;
          }
        }
      }

      setTruckCoordinate(snappedCoord);
      setTruckBearing(heading);

      // Also update cameraHeading state so the marker can compensate
      if (isNavigatingRef.current) {
        setCameraHeading(heading);
      }

      // 4. Follow camera during navigation
      const now = Date.now();
      if (isNavigatingRef.current && now - lastCameraUpdateRef.current > 500) {
        lastCameraUpdateRef.current = now;
        cameraRef.current?.setCamera({
          centerCoordinate: snappedCoord,
          zoomLevel: NAVIGATE_ZOOM,
          heading: heading,
          pitch: NAV_CAMERA_PITCH,
          padding: NAV_CAMERA_PADDING,
          animationMode: 'easeTo',
          animationDuration: 300,
        });
      }

      // 5. Re-fetch route: only if moved >120 m from last fetch point AND time gate allows
      if (lastRouteFetchCoordRef.current) {
        const distFromLastFetch = getSegmentDistanceMeters(
          lastRouteFetchCoordRef.current,
          currentGpsCoord,
        );
        if (distFromLastFetch >= ROUTE_REFETCH_DISTANCE_METERS) {
          lastRouteFetchCoordRef.current = currentGpsCoord;
          fetchRouteNow(false);
        }
      }

      props.onCurrentLocationSelected?.({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: location.timestamp,
      });
    },
    // FIX: Minimal stable dependencies — no isNavigating, no routePolylineCoordinates,
    // no sourceLocation, no destinationLocation. All read from refs.
    [
      getRoutePositionFromCurrentLocation,
      getSegmentDistanceMeters,
      setSourceLocationWithOrigin,
      fetchRouteNow,
      props,
    ],
  );

  // ── Start live GPS tracking ───────────────────────────────────────────────
  /**
   * FIX: This function no longer resets progress/polyline/truck position.
   * It only starts the watcher if one isn't already running.
   * The initialization of truck position is done ONLY when starting navigation
   * (in handleNavigateStart), not every time this is called.
   */
  const startLiveTracking = useCallback(() => {
    const polyCoords = routePolylineCoordsRef.current;
    if (!polyCoords || polyCoords.length < 2) return;
    if (locationWatchIdRef.current != null) return; // already watching

    // Immediate one-shot to position truck right away
    getCurrentLocation()
      .then(applyLocationUpdate)
      .catch(err => console.warn('Initial live location failed:', err));

    // Continuous watch
    watchCurrentLocation(
      applyLocationUpdate,
      err => console.warn('Live location update failed:', err),
      {skipGPSCheck: true, skipPermissionCheck: true},
    )
      .then(watchId => {
        locationWatchIdRef.current = watchId;
      })
      .catch(err => console.warn('Unable to start live location watch:', err));
  }, [applyLocationUpdate]);

  // ── Effects ───────────────────────────────────────────────────────────────

  /**
   * FIX: Separated the "start tracking on route" effect from the "cleanup" effect.
   * The old code had ensureLiveTrackingStarted (which reset everything) in the
   * dependency chain, causing the watcher to be killed and restarted on every
   * applyLocationUpdate change, which reset all progress.
   *
   * New approach: We start tracking when routePolylineCoordinates becomes available,
   * and ONLY clean up on unmount or when the route is cleared entirely.
   */
  useEffect(() => {
    if (!routePolylineCoordinates || routePolylineCoordinates.length < 2) {
      // Route cleared — stop tracking and reset
      if (locationWatchIdRef.current != null) {
        clearWatchLocation(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
      }
      lastTrackedGpsCoordRef.current = null;
      setTruckCoordinate(null);
      setTruckBearing(0);
      setRouteProgress(0);
      setRemainingPolyline(null);
      setDisplayRoutePolyline(null);
      offRouteConsecutiveHitsRef.current = 0;
      return;
    }

    // Route exists — preserve current progress where possible.
    // For a new/re-routed polyline, snap to nearest point from current GPS/truck
    // and keep remaining polyline/progress in sync instead of resetting to zero.
    const [firstPoint, secondPoint] = routePolylineCoordinates;

    const anchorCoordinate =
      lastTrackedGpsCoordRef.current || truckCoordinate || firstPoint;
    const routePos = getRoutePositionFromCurrentLocation(
      routePolylineCoordinates,
      anchorCoordinate,
    );

    if (routePos) {
      const snapped = routePos.coordinate ?? anchorCoordinate;
      setTruckCoordinate(snapped);
      setTruckBearing(routePos.bearing ?? getBearing(firstPoint, secondPoint));
      setRouteProgress(prev => Math.max(prev, routePos.progress));
      setRemainingPolyline(
        routePos.remainingCoords && routePos.remainingCoords.length >= 2
          ? routePos.remainingCoords
          : routePolylineCoordinates,
      );
      lastRouteFetchCoordRef.current = snapped;
    } else {
      if (!truckCoordinate) {
        setTruckCoordinate(firstPoint);
        setTruckBearing(getBearing(firstPoint, secondPoint));
      }
      if (!remainingPolyline || remainingPolyline.length < 2) {
        setRemainingPolyline(routePolylineCoordinates);
      }
      lastRouteFetchCoordRef.current = anchorCoordinate;
    }

    // Start live tracking immediately
    startLiveTracking();
  }, [
    getBearing,
    getRoutePositionFromCurrentLocation,
    remainingPolyline,
    routePolylineCoordinates,
    startLiveTracking,
    truckCoordinate,
  ]);

  // Seed source location from GPS on first mount (only once)
  useEffect(() => {
    let isMounted = true;
    const seedSource = async () => {
      if (sourceLocation) return;
      try {
        const location = await getCurrentLocation();
        if (!isMounted) return;
        setSourceLocationWithOrigin(
          {latitude: location.latitude, longitude: location.longitude, description: 'Current Location'},
          'gps',
        );
        setSourceText('Current Location');
        sourceAutocompleteRef.current?.setAddressText('Current Location');
        setSelectedCoordinate([location.longitude, location.latitude]);
      } catch (error) {
        console.warn('Unable to set source from current location:', error);
      }
    };
    seedSource();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clean up location watcher on unmount
  useEffect(() => {
    return () => {
      if (locationWatchIdRef.current != null) {
        clearWatchLocation(locationWatchIdRef.current);
      }
    };
  }, []);

  // Seconds-since-last-API-call ticker
  useEffect(() => {
    if (!lastRouteFetchTimeRef.current) return;
    const intervalId = setInterval(() => {
      if (!lastRouteFetchTimeRef.current) return;
      const elapsed = Math.max(0, Math.round((Date.now() - lastRouteFetchTimeRef.current) / 1000));
      setSecondsSinceLastRouteApiCall(elapsed);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [routeApiCallCount]);

  // ── User-input-driven route fetching ──────────────────────────────────────
  const [userInputVersion, setUserInputVersion] = useState(0);

  const setSourceLocationByUser = useCallback(
    (location, origin = 'user') => {
      setSourceLocationWithOrigin(location, origin);
      if (origin === 'user') setUserInputVersion(v => v + 1);
    },
    [setSourceLocationWithOrigin],
  );

  const setDestinationLocationByUser = useCallback(
    (location, origin = 'user') => {
      setDestinationLocationWithOrigin(location, origin);
      if (origin === 'user') setUserInputVersion(v => v + 1);
    },
    [setDestinationLocationWithOrigin],
  );

  useEffect(() => {
    if (userInputVersion === 0) return;
    if (!sourceLocation || !destinationLocation) return;

    const timer = setTimeout(() => {
      fetchRouteNow(true);
    }, 3500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInputVersion]);

  // Fly camera when parent passes new lat/lon props
  useEffect(() => {
    if (latitude != null && longitude != null) {
      const targetZoom = zoomLevel ?? NAVIGATE_ZOOM;
      const coord = [longitude, latitude];
      setSelectedCoordinate(coord);
      setCurrentZoom(targetZoom);
      cameraRef.current?.setCamera({
        centerCoordinate: coord,
        zoomLevel: targetZoom,
        animationDuration: 900,
        animationMode: 'flyTo',
      });
    }
  }, [latitude, longitude, zoomLevel]);

  // Apply pending style switch in the next animation frame
  useEffect(() => {
    if (!isStyleLoading || !pendingStyleId) return;
    styleSwitchInProgressRef.current = true;
    const frameId = requestAnimationFrame(() => {
      setMapStyle(pendingStyleId);
      setPendingStyleId(null);
    });
    return () => cancelAnimationFrame(frameId);
  }, [isStyleLoading, pendingStyleId]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleUseCurrentLocation = useCallback(async () => {
    try {
      setIsGpsLoading(true);
      const location = await getCurrentLocation();
      const coord = [location.longitude, location.latitude];

      setSourceLocationByUser(
        {latitude: location.latitude, longitude: location.longitude, description: 'Current Location'},
        'user',
      );
      setSourceText('Current Location');
      sourceAutocompleteRef.current?.setAddressText('Current Location');

      setSelectedCoordinate(coord);
      setCurrentZoom(NAVIGATE_ZOOM);
      cameraRef.current?.setCamera({
        centerCoordinate: coord,
        zoomLevel: NAVIGATE_ZOOM,
        pitch: 0,
        heading: 0,
        animationDuration: 900,
        animationMode: 'flyTo',
      });

      props.onCurrentLocationSelected?.({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: location.timestamp,
      });
    } catch (error) {
      console.warn('Failed to fetch current location:', error);
    } finally {
      setIsGpsLoading(false);
    }
  }, [props, setSourceLocationByUser]);

  const flyToCoordinate = useCallback((latitudeValue, longitudeValue) => {
    const coord = [longitudeValue, latitudeValue];
    setSelectedCoordinate(coord);
    setCurrentZoom(NAVIGATE_ZOOM);
    cameraRef.current?.setCamera({
      centerCoordinate: coord,
      zoomLevel: NAVIGATE_ZOOM,
      animationDuration: 900,
      animationMode: 'flyTo',
    });
  }, []);

  const transformRequest = useCallback(
    url => {
      const isPtv = url.includes('api.myptv.com');
      if (!isPtv) return {url, headers: {}};
      return effectivePtvApiKey
        ? {url, headers: {ApiKey: effectivePtvApiKey}}
        : {url, headers: {}};
    },
    [effectivePtvApiKey],
  );

  const centerCoordinate = useMemo(
    () =>
      selectedCoordinate ??
      (latitude != null && longitude != null
        ? [longitude, latitude]
        : INITIAL_COORDINATE),
    [selectedCoordinate, latitude, longitude],
  );

  /**
   * handleNavigateStart
   * - Switches to navigation mode (isNavigating = true)
   * - Fetches route if not already fetched
   * - Orients camera to the road bearing
   * - Tilts to 45° for 3-D navigation view
   * - Starts live GPS tracking
   */
  const handleNavigateStart = useCallback(() => {
    (async () => {
      setIsNavigating(true);
      isNavigatingRef.current = true;

      let data = routeData;
      if (!data?.polylineCoordinates) {
        data = await fetchRouteNow(true);
      }

      if (!data?.polylineCoordinates || data.polylineCoordinates.length < 2) {
        console.warn('No valid route to navigate');
        return;
      }

      const coords = data.polylineCoordinates;
      const first = coords[0];
      const second = coords[1];
      const initialBearing = getBearing(first, second);

      smoothBearingRef.current = initialBearing;
      lastRouteFetchCoordRef.current = first;

      cameraRef.current?.setCamera({
        centerCoordinate: first,
        zoomLevel: NAVIGATE_ZOOM,
        heading: initialBearing,
        pitch: NAV_CAMERA_PITCH,
        padding: NAV_CAMERA_PADDING,
        animationDuration: 700,
        animationMode: 'flyTo',
      });

      setCameraHeading(initialBearing);
      setCameraPitch(NAV_CAMERA_PITCH);
      setTruckCoordinate(first);
      setTruckBearing(initialBearing);
      setRemainingPolyline(coords);
      setSelectedCoordinate(first);

      // Ensure live tracking is running
      startLiveTracking();
    })();
  }, [routeData, fetchRouteNow, getBearing, startLiveTracking]);

  /**
   * handleRecenter
   * - Exits navigation mode
   * - Resets camera to north-up, no tilt
   * - Flies back to current position
   */
  const handleRecenter = useCallback(() => {
    setIsNavigating(false);
    isNavigatingRef.current = false;
    setCameraPitch(0);
    setCameraHeading(0);

    const coord =
      truckCoordinate ||
      (sourceLocation ? [sourceLocation.longitude, sourceLocation.latitude] : null) ||
      centerCoordinate;

    if (!coord) return;

    cameraRef.current?.setCamera({
      centerCoordinate: coord,
      zoomLevel: NAVIGATE_ZOOM,
      heading: 0,
      pitch: 0,
      animationDuration: 700,
      animationMode: 'flyTo',
    });
  }, [truckCoordinate, sourceLocation, centerCoordinate]);

  const handleMapPress = useCallback(
    event => {
      try {
        const coords = event?.geometry?.coordinates;
        if (!coords || !Array.isArray(coords) || coords.length < 2) return;
        const [lng, lat] = coords;
        setDestinationLocationByUser(
          {latitude: lat, longitude: lng, description: 'Selected Location'},
          'user',
        );
        setDestinationText('Selected Location');
        setSelectedCoordinate([lng, lat]);
      } catch (err) {
        console.warn('Map press handler error:', err);
      }
    },
    [setDestinationLocationByUser],
  );

  const handleZoomIn = useCallback(() => {
    const next = CITY_ZOOM_LEVELS.find(z => z > currentZoom);
    const newZoom = next !== undefined ? next : Math.min(currentZoom + 1, MAX_ZOOM);
    setCurrentZoom(newZoom);
    cameraRef.current?.zoomTo(newZoom, 400);
  }, [currentZoom]);

  const handleZoomOut = useCallback(() => {
    const prev = [...CITY_ZOOM_LEVELS].reverse().find(z => z < currentZoom);
    const newZoom = prev !== undefined ? prev : Math.max(currentZoom - 1, MIN_ZOOM);
    setCurrentZoom(newZoom);
    cameraRef.current?.zoomTo(newZoom, 400);
  }, [currentZoom]);

  const closeStyleLoader = useCallback(() => {
    if (!styleSwitchInProgressRef.current) return;
    styleSwitchInProgressRef.current = false;
    setAnnotationRefreshToken(prev => prev + 1);
    setIsStyleLoading(false);
  }, []);

  const handleStyleChange = useCallback(
    styleId => {
      if (styleId === mapStyle || isStyleLoading) return;
      setIsStyleLoading(true);
      setPendingStyleId(styleId);
    },
    [isStyleLoading, mapStyle],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  // Compute the visual rotation for the truck icon.
  // During navigation the map is rotated to cameraHeading, so subtract it to
  // avoid double-rotation.
  const truckIconRotation = isNavigating
    ? truckBearing - cameraHeading
    : truckBearing;

  // FIX: Show the truck marker whenever we have a route + truck coordinate,
  // not only when isNavigating. This way the truck is visible even before
  // the user presses "Navigate" (like Google Maps shows the blue dot).
  const showTruckMarker = truckCoordinate != null && routePolylineCoordinates != null;

  return (
    <View style={styles.container}>
      {/* ── Map ─────────────────────────────────────────────────────────── */}
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle={mapStyleDefinition}
        transformRequest={transformRequest}
        onDidFinishLoadingStyle={closeStyleLoader}
        onDidFinishRenderingMapFully={closeStyleLoader}
        onDidFailLoadingMap={closeStyleLoader}
        onPress={handleMapPress}>

        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate,
            zoomLevel: currentZoom,
            pitch: 0,
            heading: 0,
          }}
        />

        {/* ── Full route polyline (dimmed behind-truck portion) ───────── */}
        {routePolylineCoordinates && (
          <MapLibreGL.ShapeSource
            id="route-source-full"
            shape={{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: routePolylineCoordinates,
              },
            }}>
            <MapLibreGL.LineLayer
              id="route-line-full"
              style={{
                lineColor: '#93C5FD',
                lineWidth: isNavigating ? moderateScale(6) : moderateScale(4),
                lineOpacity: isNavigating ? 0.4 : 0.9,
              }}
            />
          </MapLibreGL.ShapeSource>
        )}

        {/* ── Remaining (ahead-of-truck) polyline ─────────────────────── */}
        {remainingPolyline && remainingPolyline.length >= 2 && (
          <MapLibreGL.ShapeSource
            id="route-source-remaining"
            shape={{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: remainingPolyline,
              },
            }}>
            <MapLibreGL.LineLayer
              id="route-line-remaining"
              style={{
                lineColor: '#2563EB',
                lineWidth: isNavigating ? moderateScale(8) : moderateScale(6),
                lineOpacity: 0.95,
              }}
            />
          </MapLibreGL.ShapeSource>
        )}

        {/* ── Moving truck marker ──────────────────────────────────────── */}
        {/* FIX: Show truck whenever route exists, not only during navigation */}
        {showTruckMarker && (
         <MapLibreGL.MarkerView
          id="truck-marker"
          coordinate={truckCoordinate}>
            <View
              style={[
                styles.truckMarkerWrap,
                {transform: [{rotate: `${truckIconRotation}deg`}]},
              ]}>
              <Truck_Icon width={moderateScale(28)} height={moderateScale(28)} />
            </View>
          </MapLibreGL.MarkerView>
        )}

        {/* ── Source marker (hidden when truck is visible) ─────────────── */}
        {sourceLocation && !showTruckMarker && (
          <MapLibreGL.PointAnnotation
            key={`source-marker-${annotationRefreshToken}`}
            id={`source-marker-${annotationRefreshToken}`}
            coordinate={[sourceLocation.longitude, sourceLocation.latitude]}>
            <CustomMarker type="source" title="Pickup" showLogo={true} />
            <MapLibreGL.Callout title="Start" />
          </MapLibreGL.PointAnnotation>
        )}

        {/* ── Destination marker ───────────────────────────────────────── */}
        {destinationLocation && (
          <MapLibreGL.PointAnnotation
            key={`destination-marker-${annotationRefreshToken}`}
            id={`destination-marker-${annotationRefreshToken}`}
            coordinate={[destinationLocation.longitude, destinationLocation.latitude]}>
            <CustomMarker type="destination" title="Dropoff" showLogo={true} />
            <MapLibreGL.Callout title="Destination" />
          </MapLibreGL.PointAnnotation>
        )}

        {/* ── Fallback pin marker (no source/dest yet) ─────────────────── */}
        {showMarker &&
          hasActiveCoordinate &&
          !sourceLocation &&
          !destinationLocation && (
            <MapLibreGL.PointAnnotation
              key={`selected-marker-${annotationRefreshToken}`}
              id={`selected-marker-${annotationRefreshToken}`}
              coordinate={centerCoordinate}>
              <View style={[styles.markerOuter, {borderColor: markerColor}]}>
                <Location_Icon width={moderateScale(14)} height={moderateScale(14)} />
              </View>
              <MapLibreGL.Callout title="Destination" />
            </MapLibreGL.PointAnnotation>
          )}

      </MapLibreGL.MapView>

      {/* ── Style-switch loading overlay ─────────────────────────────────── */}
      <Modal
        visible={isStyleLoading}
        transparent
        animationType="none"
        statusBarTranslucent>
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)'}}>
          <View style={{backgroundColor: '#FFFFFF', paddingHorizontal: scale(18), paddingVertical: verticalScale(14), borderRadius: moderateScale(12), flexDirection: 'row', alignItems: 'center', gap: scale(10), minWidth: scale(230), justifyContent: 'center'}}>
            <ActivityIndicator size="small" color="#2563EB" />
            <AppText style={{color: '#111827', fontWeight: '600'}}>Updating map...</AppText>
          </View>
        </View>
      </Modal>

      {/* ── Zoom label ───────────────────────────────────────────────────── */}
      <View style={styles.zoomLabel}>
        <Text style={styles.zoomLabelText}>
          {ZOOM_LABELS[Math.round(currentZoom)] ?? 'Map'}
        </Text>
      </View>

      {/* ── GPS button ───────────────────────────────────────────────────── */}
      <View style={styles.gpsButtonWrap}>
        <TouchableOpacity
          style={styles.gpsButton}
          onPress={handleUseCurrentLocation}
          activeOpacity={0.8}
          disabled={isGpsLoading}>
          {isGpsLoading ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <Gps_Icon width={moderateScale(24)} height={moderateScale(24)} />
          )}
        </TouchableOpacity>
      </View>

      {/* ── Zoom controls ────────────────────────────────────────────────── */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn} activeOpacity={0.8}>
          <Text style={styles.zoomButtonText}>+</Text>
        </TouchableOpacity>
        <View style={styles.zoomDivider} />
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut} activeOpacity={0.8}>
          <Text style={styles.zoomButtonText}>−</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search card ──────────────────────────────────────────────────── */}
      <PtvSearchCard
        sourceRef={sourceAutocompleteRef}
        destinationRef={destinationAutocompleteRef}
        activeInput={activeInput}
        onActiveInputChange={setActiveInput}
        sourceLocation={sourceLocation}
        destinationLocation={destinationLocation}
        sourceText={sourceText}
        destinationText={destinationText}
        setSourceLocation={setSourceLocationByUser}
        setDestinationLocation={setDestinationLocationByUser}
        setSourceText={setSourceText}
        setDestinationText={setDestinationText}
        onCoordinateSelect={flyToCoordinate}
        apiKey={GOOGLE_MAPS_API_KEY}
        ptvApiKey={effectivePtvApiKey}
      />

      {/* ── Bottom bar: Navigate / Recenter ──────────────────────────────── */}
      <View style={styles.bottomBar} pointerEvents="box-none">
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleNavigateStart}
          style={[
            styles.bottomButton,
            styles.bottomButtonPrimary,
            isNavigating && {backgroundColor: '#16a34a'},
          ]}>
          <Text style={[styles.bottomButtonText, styles.bottomButtonTextPrimary]}>
            {isNavigating ? 'Navigating...' : 'Navigate'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleRecenter}
          style={styles.bottomButton}>
          <Text style={styles.bottomButtonText}>Recenter</Text>
        </TouchableOpacity>
      </View>

      {/* ── Route info pills ─────────────────────────────────────────────── */}
      {(isLoadingRoute || routeData || routeError) &&
        sourceLocation &&
        destinationLocation && (
          <View style={styles.routeInfoCard}>
            {isLoadingRoute ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.primary || '#2563EB'} />
                <AppText style={[styles.loadingText, {marginLeft: scale(8)}]}>
                  Calculating route...
                </AppText>
              </View>
            ) : routeError ? (
              <View style={styles.errorContainer}>
                <AppText style={styles.errorText}>⚠ {routeError}</AppText>
              </View>
            ) : routeData ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{gap: 8, paddingHorizontal: 10, paddingVertical: 6}}>

                <View style={routePillStyles.pill}>
                  <AppText style={routePillStyles.pillLabel}>
                    {formatDistance(remainingDistanceMeters)}
                  </AppText>
                  <AppText style={routePillStyles.pillSub}>remaining</AppText>
                </View>

                <View style={routePillStyles.pill}>
                  <AppText style={routePillStyles.pillLabel}>
                    {formatTime(pendingTimeSeconds)}
                  </AppText>
                  <AppText style={routePillStyles.pillSub}>live ETA</AppText>
                </View>

                <View style={routePillStyles.pill}>
                  <AppText style={routePillStyles.pillLabel}>
                    {formatDistance(coveredDistanceMeters)}
                  </AppText>
                  <AppText style={routePillStyles.pillSub}>
                    {routeProgress >= 1
                      ? 'completed'
                      : `${Math.round(routeProgress * 100)}% covered`}
                  </AppText>
                </View>

                <View style={[routePillStyles.pill, {borderColor: routeData.violated ? '#dc2626' : '#16a34a', borderWidth: moderateScale(1)}]}>
                  <AppText style={[routePillStyles.pillLabel, {color: routeData.violated ? '#dc2626' : '#16a34a'}]}>
                    {routeData.violated ? 'Violated' : 'Valid'}
                  </AppText>
                  <AppText style={routePillStyles.pillSub}>
                    {routeData.violated ? 'check route' : 'no violations'}
                  </AppText>
                </View>

                <View style={routePillStyles.pill}>
                  <AppText style={routePillStyles.pillLabel}>
                    {routeApiCallCount} calls
                  </AppText>
                  <AppText style={routePillStyles.pillSub}>
                    {formatTime(secondsSinceLastRouteApiCall)} ago
                    {routeApiIntervalSeconds != null
                      ? ` · ${formatTime(routeApiIntervalSeconds)} interval`
                      : ''}
                  </AppText>
                </View>

              </ScrollView>
            ) : null}
          </View>
        )}

      {/* ── Map style switcher ───────────────────────────────────────────── */}
      <View style={{position: 'absolute', top: verticalScale(210), left: 0, right: 0, paddingHorizontal: scale(10)}}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{gap: scale(8), paddingVertical: verticalScale(4)}}>
          {Object.entries(MAP_STYLES).map(([label, styleId]) => (
            <TouchableOpacity
              key={label}
              disabled={isStyleLoading}
              onPress={() => handleStyleChange(styleId)}
              style={[
                styles.mapStylePill,
                mapStyle === styleId && styles.mapStylePillActive,
                isStyleLoading ? {opacity: 0.6} : null,
              ]}>
              <Text
                style={
                  mapStyle === styleId
                    ? [styles.mapStylePillText, styles.mapStylePillTextActive]
                    : styles.mapStylePillText
                }>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

    </View>
  );
};

// ─── Route pill styles ────────────────────────────────────────────────────────
const routePillStyles = {
  pill: {
    paddingVertical: verticalScale(7),
    paddingHorizontal: scale(16),
    borderRadius: moderateScale(22),
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(1) },
    shadowOpacity: 0.12,
    shadowRadius: moderateScale(3),
    elevation: 3,
    justifyContent: 'center',
  },

  pillLabel: {
    fontSize: moderateScale(13),
    fontWeight: '500',
    color: '#111',
  },

  pillSub: {
    fontSize: moderateScale(11),
    color: '#666',
    marginTop: verticalScale(1),
  },
};