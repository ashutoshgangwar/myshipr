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
import MapLibreGL from '@maplibre/maplibre-react-native';
import Gps_Icon from '../../assets/svg_icon/gps-svg.svg';
import Truck_Icon from '../../assets/svg_icon/truck-icon.svg';
import Location_Icon from '../../assets/svg_icon/location.svg';
import {
  clearWatchLocation,
  getCurrentLocation,
  watchCurrentLocation,
} from '../../services/LocationService';
import SearchCard from '../../component/Navigation_components/SearchCard';
import CustomMarker from '../../component/Navigation_components/CustomMarker';
import {GOOGLE_MAPS_API_KEY, PTV_API_KEY} from '@env';
import {getRouteBetweenPoints} from '../../apiservices/ptvRoutingService';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';

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

  if (apiKey) {
    query.push(`apiKey=${encodeURIComponent(apiKey)}`);
  }

  return `https://api.myptv.com/rastermaps/v1/image-tiles/{z}/{x}/{y}?${query.join(
    '&',
  )}`;
};

const INITIAL_COORDINATE = [8.4055677, 49.0070036];
const CITY_ZOOM_LEVELS = [5, 8, 11, 13, 15, 17];
const INITIAL_ZOOM = 11;
const NAVIGATE_ZOOM = 13;
const MIN_ZOOM = 1;
const MAX_ZOOM = 18;
const MOVEMENT_UPDATE_THRESHOLD_METERS = 8;

const ZOOM_LABELS = {
  1: 'World',
  2: 'World',
  3: 'Continent',
  4: 'Continent',
  5: 'Country',
  6: 'Country',
  7: 'State',
  8: 'State',
  9: 'Region',
  10: 'Region',
  11: 'City',
  12: 'City',
  13: 'District',
  14: 'District',
  15: 'Streets',
  16: 'Streets',
  17: 'Buildings',
  18: 'Buildings',
};

MapLibreGL.setAccessToken(null);

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
  const sourceAutocompleteRef = useRef(null);
  const destinationAutocompleteRef = useRef(null);
  const locationWatchIdRef = useRef(null);
  const lastTrackedCoordinateRef = useRef(null);
  const lastSourceSetByRef = useRef('user');
  const lastDestinationSetByRef = useRef('user');
  const styleSwitchInProgressRef = useRef(false);
  const lastRouteApiCallAtRef = useRef(null);
  const prevRouteApiCallAtRef = useRef(null);

  const [mapStyle, setMapStyle] = useState(
    MAP_STYLES.silica ?? Object.values(MAP_STYLES)[0] ?? 'silica',
  );
  const [currentZoom, setCurrentZoom] = useState(INITIAL_ZOOM);
  const [selectedCoordinate, setSelectedCoordinate] = useState(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [activeInput, setActiveInput] = useState(null);
  const [sourceLocation, setSourceLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [sourceText, setSourceText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [routeData, setRouteData] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [routeApiCallCount, setRouteApiCallCount] = useState(0);
  const [secondsSinceLastRouteApiCall, setSecondsSinceLastRouteApiCall] =
    useState(0);
  const [routeApiIntervalSeconds, setRouteApiIntervalSeconds] = useState(null);
  const [isRouteExpanded, setIsRouteExpanded] = useState(false);
  const [truckCoordinate, setTruckCoordinate] = useState(null);
  const [truckBearing, setTruckBearing] = useState(0);
  const [routeProgress, setRouteProgress] = useState(0);
  const [isStyleLoading, setIsStyleLoading] = useState(false);
  const [pendingStyleId, setPendingStyleId] = useState(null);
  const [annotationRefreshToken, setAnnotationRefreshToken] = useState(0);

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
  const toRadians = useCallback(value => (value * Math.PI) / 180, []);
  const toDegrees = useCallback(value => (value * 180) / Math.PI, []);

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
          };
        }

        travelledBefore += segLen;
      }

      return {
        progress: Math.max(0, Math.min(1, best.coveredMeters / totalLength)),
        coordinate: best.coordinate,
        bearing: best.bearing,
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
  const routePolylineCoordinates = routeData?.polylineCoordinates ?? null;

  const routePolylineLength = useMemo(
    () => getPolylineLengthMeters(routePolylineCoordinates),
    [getPolylineLengthMeters, routePolylineCoordinates],
  );

  const totalDistanceMeters = routeData?.distance ?? routePolylineLength;
  const totalTravelSeconds = routeData?.travelTime ?? 0;
  const coveredDistanceMeters = Math.max(
    totalDistanceMeters * routeProgress,
    0,
  );
  const remainingDistanceMeters = Math.max(
    totalDistanceMeters - coveredDistanceMeters,
    0,
  );
  const pendingTimeSeconds = Math.max(
    totalTravelSeconds * (1 - routeProgress),
    0,
  );

  // ── Formatters ────────────────────────────────────────────────────────────
  const formatDistance = useCallback(meters => {
    const miles = meters / 1609.34;
    if (miles < 0.1) {
      return `${Math.round(meters * 3.28084)} ft`;
    }
    return `${miles.toFixed(2)} mi`;
  }, []);

  const formatTime = useCallback(seconds => {
    if (seconds < 60) return `${Math.max(0, Math.round(seconds))}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }, []);

  // ── Effects ───────────────────────────────────────────────────────────────

  // Fetch route when source/destination change (debounced 5 s)
  useEffect(() => {
    if (!sourceLocation || !destinationLocation) return;

    const sourceIsUser = lastSourceSetByRef.current === 'user';
    const destIsUser = lastDestinationSetByRef.current === 'user';

    if (!sourceIsUser && !destIsUser) return;

    const debounceTimer = setTimeout(async () => {
      const callStartedAt = Date.now();
      prevRouteApiCallAtRef.current = lastRouteApiCallAtRef.current;
      lastRouteApiCallAtRef.current = callStartedAt;
      setRouteApiCallCount(prev => prev + 1);
      setSecondsSinceLastRouteApiCall(0);
      if (prevRouteApiCallAtRef.current) {
        setRouteApiIntervalSeconds(
          Math.max(
            0,
            Math.round(
              (callStartedAt - prevRouteApiCallAtRef.current) / 1000,
            ),
          ),
        );
      }

      setIsLoadingRoute(true);
      setRouteError(null);
      setRouteData(null);

      try {
        const response = await getRouteBetweenPoints(
          sourceLocation.latitude,
          sourceLocation.longitude,
          destinationLocation.latitude,
          destinationLocation.longitude,
        );
        setRouteData(response);
        console.log('Route Data:', {
          distance: response.distance,
          travelTime: response.travelTime,
          violated: response.violated,
          trafficDelay: response.trafficDelay,
        });
      } catch (error) {
        console.log('Route Fetch Error:', error);
        let errorMessage = 'Failed to fetch route';
        if (error?.message) {
          if (error.message.includes('ROUTING_ROUTE_NOT_FOUND')) {
            errorMessage =
              'No route found between these locations. Try selecting closer destinations.';
          } else if (error.message.includes('HTTP 400')) {
            errorMessage = 'Invalid route. Please check your locations.';
          } else if (
            error.message.includes('HTTP 401') ||
            error.message.includes('HTTP 403')
          ) {
            errorMessage =
              'API authentication failed. Please check configuration.';
          } else {
            errorMessage = error.message;
          }
        }
        setRouteError(errorMessage);
      } finally {
        setIsLoadingRoute(false);
      }
    }, 50000000000); // 5-second debounce

    return () => clearTimeout(debounceTimer);
  }, [sourceLocation, destinationLocation]);

  useEffect(() => {
    if (!lastRouteApiCallAtRef.current) return;

    const intervalId = setInterval(() => {
      if (!lastRouteApiCallAtRef.current) return;
      const elapsed = Math.max(
        0,
        Math.round((Date.now() - lastRouteApiCallAtRef.current) / 1000),
      );
      setSecondsSinceLastRouteApiCall(elapsed);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [routeApiCallCount]);

  // Seed source from current GPS on first mount
  useEffect(() => {
    let isMounted = true;

    const seedSource = async () => {
      if (sourceLocation) return;
      try {
        const location = await getCurrentLocation();
        if (!isMounted) return;
        setSourceLocationWithOrigin(
          {
            latitude: location.latitude,
            longitude: location.longitude,
            description: 'Current Location',
          },
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
  }, [sourceLocation]);

  // Clean up location watcher on unmount
  useEffect(() => {
    return () => {
      if (locationWatchIdRef.current != null) {
        clearWatchLocation(locationWatchIdRef.current);
      }
    };
  }, []);

  // Live truck tracking along route polyline
  useEffect(() => {
    if (!routePolylineCoordinates || routePolylineCoordinates.length < 2) {
      if (locationWatchIdRef.current != null) {
        clearWatchLocation(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
      }
      lastTrackedCoordinateRef.current = null;
      setTruckCoordinate(null);
      setTruckBearing(0);
      setRouteProgress(0);
      return;
    }

    const [firstPoint, secondPoint] = routePolylineCoordinates;
    setTruckCoordinate(firstPoint);
    setTruckBearing(getBearing(firstPoint, secondPoint));
    setRouteProgress(0);
    lastTrackedCoordinateRef.current = null;

    const applyLocationUpdate = location => {
      const currentCoordinate = [location.longitude, location.latitude];

      if (lastTrackedCoordinateRef.current) {
        const moved = getSegmentDistanceMeters(
          lastTrackedCoordinateRef.current,
          currentCoordinate,
        );
        if (moved < MOVEMENT_UPDATE_THRESHOLD_METERS) return;
      }

      lastTrackedCoordinateRef.current = currentCoordinate;

      setSourceLocationWithOrigin(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          description: 'Current Location',
        },
        'gps',
      );
      setSourceText('Current Location');
      sourceAutocompleteRef.current?.setAddressText('Current Location');

      const routePosition = getRoutePositionFromCurrentLocation(
        routePolylineCoordinates,
        currentCoordinate,
      );
      if (!routePosition) return;

      setTruckCoordinate(routePosition.coordinate ?? currentCoordinate);
      setTruckBearing(routePosition.bearing ?? 0);
      setRouteProgress(prev => Math.max(prev, routePosition.progress));

      props.onCurrentLocationSelected?.({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: location.timestamp,
      });
    };

    getCurrentLocation()
      .then(applyLocationUpdate)
      .catch(err => console.warn('Initial live location failed:', err));

    watchCurrentLocation(
      applyLocationUpdate,
      err => console.warn('Live location update failed:', err),
      {skipGPSCheck: true, skipPermissionCheck: true},
    )
      .then(watchId => {
        locationWatchIdRef.current = watchId;
      })
      .catch(err => console.warn('Unable to start live location watch:', err));

    return () => {
      if (locationWatchIdRef.current != null) {
        clearWatchLocation(locationWatchIdRef.current);
        locationWatchIdRef.current = null;
      }
    };
  }, [
    getBearing,
    getRoutePositionFromCurrentLocation,
    getSegmentDistanceMeters,
    props,
    routePolylineCoordinates,
  ]);

  // Fly camera when parent passes new lat/lon props
  useEffect(() => {
    if (latitude != null && longitude != null) {
      const targetZoom = zoomLevel ?? NAVIGATE_ZOOM;
      const coord = [longitude, latitude];
      setSelectedCoordinate(coord);
      setCurrentZoom(targetZoom);
      cameraRef.current?.flyTo(coord, 900);
      cameraRef.current?.zoomTo(targetZoom, 900);
    }
  }, [latitude, longitude, zoomLevel]);

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

      setSourceLocationWithOrigin(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          description: 'Current Location',
        },
        'user',
      );
      setSourceText('Current Location');
      sourceAutocompleteRef.current?.setAddressText('Current Location');

      setSelectedCoordinate(coord);
      setCurrentZoom(NAVIGATE_ZOOM);
      cameraRef.current?.flyTo(coord, 900);
      cameraRef.current?.zoomTo(NAVIGATE_ZOOM, 900);

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
  }, [props]);

  const setSourceLocationWithOrigin = useCallback((location, origin = 'user') => {
    lastSourceSetByRef.current = origin;
    setSourceLocation(location);
  }, []);

  const setDestinationLocationWithOrigin = useCallback((location, origin = 'user') => {
    lastDestinationSetByRef.current = origin;
    setDestinationLocation(location);
  }, []);

  const flyToCoordinate = useCallback((latitudeValue, longitudeValue) => {
    const coord = [longitudeValue, latitudeValue];
    setSelectedCoordinate(coord);
    setCurrentZoom(NAVIGATE_ZOOM);
    cameraRef.current?.flyTo(coord, 900);
    cameraRef.current?.zoomTo(NAVIGATE_ZOOM, 900);
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

  const handleZoomIn = useCallback(() => {
    const next = CITY_ZOOM_LEVELS.find(z => z > currentZoom);
    const newZoom =
      next !== undefined ? next : Math.min(currentZoom + 1, MAX_ZOOM);
    setCurrentZoom(newZoom);
    cameraRef.current?.zoomTo(newZoom, 400);
  }, [currentZoom]);

  const handleZoomOut = useCallback(() => {
    const prev = [...CITY_ZOOM_LEVELS].reverse().find(z => z < currentZoom);
    const newZoom =
      prev !== undefined ? prev : Math.max(currentZoom - 1, MIN_ZOOM);
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

  const centerCoordinate = useMemo(
    () =>
      selectedCoordinate ??
      (latitude != null && longitude != null
        ? [longitude, latitude]
        : INITIAL_COORDINATE),
    [selectedCoordinate, latitude, longitude],
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* ── Map ─────────────────────────────────────────────────────────── */}
      <MapLibreGL.MapView
        style={styles.map}
        mapStyle={mapStyleDefinition}
        transformRequest={transformRequest}
        onDidFinishLoadingStyle={closeStyleLoader}
        onDidFinishRenderingMapFully={closeStyleLoader}
        onDidFailLoadingMap={closeStyleLoader}>
        <MapLibreGL.Camera
          ref={cameraRef}
          zoomLevel={INITIAL_ZOOM}
          centerCoordinate={centerCoordinate}
          pitch={0}
          heading={0}
        />

        {/* Route polyline */}
        {routeData?.polylineCoordinates && (
          <MapLibreGL.ShapeSource
            id="route-source"
            shape={{
              type: 'Feature',
              geometry: {
                type: 'LineString',
                coordinates: routeData.polylineCoordinates,
              },
            }}>
            <MapLibreGL.LineLayer
              id="route-line"
              style={{
                lineColor: '#2563EB',
                lineWidth: 4,
                lineOpacity: 0.8,
              }}
            />
          </MapLibreGL.ShapeSource>
        )}

        {/* Moving truck marker */}
        {truckCoordinate && routePolylineCoordinates && (
          <MapLibreGL.PointAnnotation
            key={`truck-marker-${annotationRefreshToken}`}
            id={`truck-marker-${annotationRefreshToken}`}
            coordinate={truckCoordinate}>
            <View
              style={[
                styles.truckMarkerWrap,
                {transform: [{rotate: `${truckBearing}deg`}]},
              ]}>
              <Truck_Icon width={22} height={22} />
            </View>
            <MapLibreGL.Callout
              title={routeProgress >= 1 ? 'Arrived' : 'Truck navigating'}
            />
          </MapLibreGL.PointAnnotation>
        )}

        {/* Source marker */}
        {sourceLocation && (
          <MapLibreGL.PointAnnotation
            key={`source-marker-${annotationRefreshToken}`}
            id={`source-marker-${annotationRefreshToken}`}
            coordinate={[sourceLocation.longitude, sourceLocation.latitude]}>
            <CustomMarker type="source" title="Pickup" showLogo={true} />
            <MapLibreGL.Callout title="Start" />
          </MapLibreGL.PointAnnotation>
        )}

        {/* Destination marker */}
        {destinationLocation && (
          <MapLibreGL.PointAnnotation
            key={`destination-marker-${annotationRefreshToken}`}
            id={`destination-marker-${annotationRefreshToken}`}
            coordinate={[
              destinationLocation.longitude,
              destinationLocation.latitude,
            ]}>
            <CustomMarker type="destination" title="Dropoff" showLogo={true} />
            <MapLibreGL.Callout title="Destination" />
          </MapLibreGL.PointAnnotation>
        )}

        {/* Fallback pin marker */}
        {showMarker &&
          hasActiveCoordinate &&
          !sourceLocation &&
          !destinationLocation && (
            <MapLibreGL.PointAnnotation
              key={`selected-marker-${annotationRefreshToken}`}
              id={`selected-marker-${annotationRefreshToken}`}
              coordinate={centerCoordinate}>
              <View style={[styles.markerOuter, {borderColor: markerColor}]}>
                <Location_Icon width={14} height={14} />
              </View>
              <MapLibreGL.Callout title="Destination" />
            </MapLibreGL.PointAnnotation>
          )}
      </MapLibreGL.MapView>

      <Modal
        visible={isStyleLoading}
        transparent
        animationType="none"
        statusBarTranslucent>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.55)',
          }}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 18,
              paddingVertical: 14,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              minWidth: 230,
              justifyContent: 'center',
            }}>
            <ActivityIndicator size="small" color="#2563EB" />
            <AppText style={{color: '#111827', fontWeight: '600'}}>
              Updating map...
            </AppText>
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
            <Gps_Icon width={24} height={24} />
          )}
        </TouchableOpacity>
      </View>

      {/* ── Zoom controls ────────────────────────────────────────────────── */}
      <View style={styles.zoomControls}>
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={handleZoomIn}
          activeOpacity={0.8}>
          <Text style={styles.zoomButtonText}>+</Text>
        </TouchableOpacity>
        <View style={styles.zoomDivider} />
        <TouchableOpacity
          style={styles.zoomButton}
          onPress={handleZoomOut}
          activeOpacity={0.8}>
          <Text style={styles.zoomButtonText}>−</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search card ──────────────────────────────────────────────────── */}
      <SearchCard
        sourceRef={sourceAutocompleteRef}
        destinationRef={destinationAutocompleteRef}
        activeInput={activeInput}
        onActiveInputChange={setActiveInput}
        sourceLocation={sourceLocation}
        destinationLocation={destinationLocation}
        sourceText={sourceText}
        destinationText={destinationText}
        setSourceLocation={setSourceLocationWithOrigin}
        setDestinationLocation={setDestinationLocationWithOrigin}
        setSourceText={setSourceText}
        setDestinationText={setDestinationText}
        onCoordinateSelect={flyToCoordinate}
        apiKey={GOOGLE_MAPS_API_KEY}
      />

      {/* ── Route info pill strip ────────────────────────────────────────── */}
      {(isLoadingRoute || routeData || routeError) &&
        sourceLocation &&
        destinationLocation && (
          <View style={styles.routeInfoCard}>
            {isLoadingRoute ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="small"
                  color={colors.primary || '#2563EB'}
                />
                <AppText style={[styles.loadingText, {marginLeft: 8}]}>
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
                contentContainerStyle={{
                  gap: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                }}>

                {/* Distance remaining */}
                <View style={routePillStyles.pill}>
                  <AppText style={routePillStyles.pillLabel}>
                    {formatDistance(remainingDistanceMeters)}
                  </AppText>
                  <AppText style={routePillStyles.pillSub}>remaining</AppText>
                </View>

                {/* Live ETA */}
                <View style={routePillStyles.pill}>
                  <AppText style={routePillStyles.pillLabel}>
                    {formatTime(pendingTimeSeconds)}
                  </AppText>
                  <AppText style={routePillStyles.pillSub}>live ETA</AppText>
                </View>

                {/* Covered distance */}
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

                {/* Route status */}
                <View
                  style={[
                    routePillStyles.pill,
                    {
                      borderColor: routeData.violated
                        ? '#dc2626'
                        : '#16a34a',
                      borderWidth: 1,
                    },
                  ]}>
                  <AppText
                    style={[
                      routePillStyles.pillLabel,
                      {
                        color: routeData.violated ? '#dc2626' : '#16a34a',
                      },
                    ]}>
                    {routeData.violated ? 'Violated' : 'Valid'}
                  </AppText>
                  <AppText style={routePillStyles.pillSub}>
                    {routeData.violated ? 'check route' : 'no violations'}
                  </AppText>
                </View>

                {/* API debug pill */}
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
      <View
        style={{
          position: 'absolute',
          top: 210,
          left: 0,
          right: 0,
          paddingHorizontal: 10,
        }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{gap: 8, paddingVertical: 4}}>
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

// ─── Route pill styles (mirrors map style switcher pill aesthetic) ────────────
const routePillStyles = {
  pill: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.12)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
    justifyContent: 'center',
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111',
  },
  pillSub: {
    fontSize: 11,
    color: '#666',
    marginTop: 1,
  },
};