import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  Modal,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {scale, verticalScale} from 'react-native-size-matters';
import AsyncStorage from '@react-native-async-storage/async-storage';

import styles from './HereMapScreen.styles';
import GpsIcon from '../../assets/svg_icon/gps-svg.svg';
import CompassIcon from '../../assets/svg_icon/compass.svg';
import {getCurrentLocation, useLocation} from '../../services/LocationService';

import {
  HereMapView,
  HereNavigation,
  HereRouting,
  HereSdk,
  NavigationEvents,
} from '../../here';

import {
  buildTripInfo,
  fitCameraToRoute,
  normalizeLocation,
} from '../../utils/here/mapHelpers';

import MapStyleControl from '../../component/MapStyleControl/MapStyleControl';
import MarkerRasterizer from './components/MarkerRasterizer';
import MarkerPin from './components/MarkerPin';
import {NavigationControls} from './components/NavigationControls';
import TurnByTurnPanel from './utils/Turnbyturnpanel';
import NextManeuverHud from './utils/NextManeuverHud';

import {
  DESTINATION,
  MARKER_DISPLAY_SIZE,
  NAVIGATION_ROUTE_WIDTH,
  OFF_ROUTE_THRESHOLD,
  ORIGIN,
} from './constants/navigationConstants';

/**
 * Truck routing + turn-by-turn navigation on the HERE SDK Navigate bridge.
 *
 * Guidance is owned end to end by the native `VisualNavigator` (see
 * `HereNavigationModule.kt`): it map-matches the GPS feed, renders the route and
 * the vehicle, follows the camera, and reports maneuvers, progress, speed limits
 * and deviations as events. This screen calculates routes, draws the *preview*
 * polyline, and renders the UI around those events — it does no snapping,
 * polyline trimming or camera work of its own.
 *
 * Preview mode  → markers + route polyline drawn by us, toll summary, controls.
 * Navigate mode → the navigator draws the map; we render the HUD and stats.
 */

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_EXPANDED = Math.round(SCREEN_HEIGHT * 0.45);
const SHEET_COLLAPSED = verticalScale(48);

// Simulated navigation runs the route with synthetic GPS fixes, so guidance can
// be exercised on a desk. Real device positioning is used when it is off.
const SIMULATION_SPEED_FACTOR = 6;

// A reroute costs a routing request, so deviations are only acted on this often.
const REROUTE_MIN_INTERVAL_MS = 10_000;

const CURRENCY_SYMBOL = {INR: '₹', USD: '$', EUR: '€'};

// ── Helpers ────────────────────────────────────────────────────────────────

/** `{total, currency}` from HereRouting → a display string. */
function formatTollTotal(tolls) {
  if (!tolls || typeof tolls.total !== 'number') return '—';
  const currency = tolls.currency || 'USD';
  const symbol = CURRENCY_SYMBOL[currency] ?? currency;
  return `${symbol}${tolls.total.toFixed(2)}`;
}

function formatFare(price, currency) {
  if (typeof price !== 'number') return '—';
  const symbol = CURRENCY_SYMBOL[currency] ?? currency ?? '';
  return `${symbol}${price.toFixed(2)}`;
}

// ───────────────────────────────────────────────────────────────────────────
export default function HereMapScreen({navigation, route}) {
  const mapRef = useRef(null);

  const [sdkError, setSdkError] = useState(null);
  // True once <HereMapView> has mounted its native surface — only then do the
  // imperative map calls work.
  const [mapReady, setMapReady] = useState(false);

  // Cache-first seed from the shared location service; the navigator owns the
  // continuous fixes once guidance starts.
  const {location: currentLocation} = useLocation({fetchOnMount: false});

  const [sourceLocation, setSourceLocation] = useState(
    normalizeLocation(route?.params?.sourceLocation),
  );
  const [destinationLocation, setDestinationLocation] = useState(
    normalizeLocation(route?.params?.destinationLocation),
  );
  const [sourceText, setSourceText] = useState(route?.params?.sourceText || '');
  const [destinationText, setDestinationText] = useState(
    route?.params?.destinationText || '',
  );
  const [truckDetails, setTruckDetails] = useState(
    route?.params?.truckDetails || null,
  );

  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [isTollLoading, setIsTollLoading] = useState(false);

  // The route currently previewed or being navigated (see HereRouting).
  const [activeRoute, setActiveRoute] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [simulateNavigation, setSimulateNavigation] = useState(true);

  // Live guidance state — every field below is fed by a navigator event.
  const [navigationInfo, setNavigationInfo] = useState(null);
  const [maneuverIndex, setManeuverIndex] = useState(null);
  const [metersToNext, setMetersToNext] = useState(null);
  const [liveSpeedKph, setLiveSpeedKph] = useState(0);
  const [speedLimitKph, setSpeedLimitKph] = useState(null);
  const [isSpeeding, setIsSpeeding] = useState(false);
  const [voiceText, setVoiceText] = useState(null);

  const [tollModalVisible, setTollModalVisible] = useState(false);
  const [turnModalVisible, setTurnModalVisible] = useState(false);
  const [markerModalVisible, setMarkerModalVisible] = useState(false);
  const [markerShape, setMarkerShape] = useState('truck');
  const markerImagesRef = useRef(null);

  // Live map heading, polled so the compass needle tracks it and the
  // reset-to-north button is meaningful.
  const [mapBearing, setMapBearing] = useState(0);

  const [bottomSheetCollapsed, setBottomSheetCollapsed] = useState(false);
  const sheetHeightAnim = useRef(new Animated.Value(SHEET_EXPANDED)).current;

  // Mirror refs, so event callbacks and timers always see current values
  // without re-subscribing on every render.
  const isNavigatingRef = useRef(false);
  const destinationRef = useRef(null);
  const sourceRef = useRef(null);
  const truckDetailsRef = useRef(null);
  const lastRerouteAtRef = useRef(0);
  const rerouteInFlightRef = useRef(false);
  // Set for the whole of handleStartNavigation. Starting navigation updates the
  // source, which re-arms the preview debounce — without this guard a slow route
  // request would let that preview fire and redraw over the running navigator.
  const navStartingRef = useRef(false);

  useEffect(() => {
    isNavigatingRef.current = isNavigating;
  }, [isNavigating]);
  useEffect(() => {
    destinationRef.current = normalizeLocation(destinationLocation);
  }, [destinationLocation]);
  useEffect(() => {
    sourceRef.current = normalizeLocation(sourceLocation);
  }, [sourceLocation]);
  useEffect(() => {
    truckDetailsRef.current = truckDetails;
  }, [truckDetails]);

  const toggleBottomSheet = useCallback(() => {
    const next = !bottomSheetCollapsed;
    setBottomSheetCollapsed(next);
    Animated.timing(sheetHeightAnim, {
      toValue: next ? SHEET_COLLAPSED : SHEET_EXPANDED,
      duration: 280,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false, // height cannot use the native driver
    }).start();
  }, [bottomSheetCollapsed, sheetHeightAnim]);

  // ── SDK bootstrap ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await HereSdk.initialize();
      } catch (e) {
        if (!cancelled) setSdkError(e.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Restore the previously chosen vehicle marker ─────────────────────────
  useEffect(() => {
    AsyncStorage.getItem('here_marker_shape')
      .then(saved => {
        if (saved === 'truck' || saved === 'car') setMarkerShape(saved);
      })
      .catch(() => {});
  }, []);

  const handleSelectMarkerShape = useCallback(shape => {
    setMarkerShape(shape);
    setMarkerModalVisible(false);
    AsyncStorage.setItem('here_marker_shape', shape).catch(() => {});
  }, []);

  // ── Route calculation ────────────────────────────────────────────────────

  /**
   * One truck route request for the whole screen — preview, navigation start
   * and reroute all go through here so they share the same truck profile.
   */
  const calculateTruckRoute = useCallback(async (origin, destination) => {
    return HereRouting.calculateTruckRoute(
      origin.latitude,
      origin.longitude,
      destination.latitude,
      destination.longitude,
      truckDetailsRef.current || null,
    );
  }, []);

  /** Draws markers + route polyline and frames the whole trip. */
  const drawPreview = useCallback(async (origin, destination, hereRoute) => {
    await Promise.all([
      mapRef.current?.clearMarkers(),
      mapRef.current?.clearRoute(),
    ]);

    const isCurrentLocation = origin.description
      ?.toLowerCase()
      .includes('current location');

    if (isCurrentLocation) {
      await mapRef.current?.showCurrentLocation(
        origin.latitude,
        origin.longitude,
        {style: 'pedestrian'},
      );
    } else {
      await mapRef.current?.addMarker({
        latitude: origin.latitude,
        longitude: origin.longitude,
        color: '#22C55E',
        image: markerImagesRef.current?.source,
        markerSize: MARKER_DISPLAY_SIZE,
      });
    }

    await mapRef.current?.addMarker({
      latitude: destination.latitude,
      longitude: destination.longitude,
      color: '#FF3366',
      image: markerImagesRef.current?.destination,
      markerSize: MARKER_DISPLAY_SIZE,
    });

    // Native draws the stored route's own geometry — nothing to decode in JS.
    await mapRef.current?.drawRoute({
      routeId: hereRoute.routeId,
      color: '#4285F4',
      width: NAVIGATION_ROUTE_WIDTH,
    });
    await fitCameraToRoute(mapRef, hereRoute.polyline);
  }, []);

  /** Resolves the origin: picked source → live GPS → the sample origin. */
  const resolveOrigin = useCallback(() => {
    const picked = normalizeLocation(sourceLocation);
    if (picked) return picked;
    const live = normalizeLocation(currentLocation);
    if (live) return {...live, description: 'Current Location'};
    return {latitude: ORIGIN.lat, longitude: ORIGIN.lng, description: ''};
  }, [sourceLocation, currentLocation]);

  const previewRoute = useCallback(async () => {
    const origin = resolveOrigin();
    const destination =
      normalizeLocation(destinationLocation) ??
      {latitude: DESTINATION.lat, longitude: DESTINATION.lng, description: ''};

    setIsTollLoading(true);
    try {
      const hereRoute = await calculateTruckRoute(origin, destination);
      setActiveRoute(hereRoute);
      await drawPreview(origin, destination, hereRoute);
    } catch (e) {
      Alert.alert('Route Error', e.message);
    } finally {
      setIsTollLoading(false);
    }
  }, [
    calculateTruckRoute,
    destinationLocation,
    drawPreview,
    resolveOrigin,
  ]);

  // Auto-preview whenever a genuinely new source/destination pair appears.
  // Debounced so dragging a pin or typing an address does not spam the router.
  const previewDebounceRef = useRef(null);
  const lastPreviewPairRef = useRef('');

  useEffect(() => {
    if (!mapReady || isNavigating) return undefined;

    const origin = normalizeLocation(sourceLocation);
    const destination = normalizeLocation(destinationLocation);
    if (!origin || !destination) return undefined;

    const pairKey =
      `${origin.latitude.toFixed(5)},${origin.longitude.toFixed(5)}` +
      `→${destination.latitude.toFixed(5)},${destination.longitude.toFixed(5)}`;
    if (pairKey === lastPreviewPairRef.current) return undefined;
    lastPreviewPairRef.current = pairKey;

    clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = setTimeout(() => {
      if (!isNavigatingRef.current && !navStartingRef.current) previewRoute();
    }, 350);

    return () => clearTimeout(previewDebounceRef.current);
  }, [
    mapReady,
    isNavigating,
    sourceLocation,
    destinationLocation,
    previewRoute,
  ]);

  // ── Navigation events ────────────────────────────────────────────────────

  /**
   * Recalculates from the driver's actual position and hands the fresh route to
   * the running navigator. Throttled, and skipped while one is already in
   * flight, so a sustained detour cannot queue a burst of routing requests.
   */
  const handleRouteDeviation = useCallback(
    async event => {
      const off = event?.deviationDistanceMeters;
      if (!Number.isFinite(off) || off < OFF_ROUTE_THRESHOLD) return;
      if (rerouteInFlightRef.current) return;
      if (Date.now() - lastRerouteAtRef.current < REROUTE_MIN_INTERVAL_MS) return;

      const destination = destinationRef.current;
      const from = normalizeLocation(event.currentLocation);
      if (!destination || !from) return;

      rerouteInFlightRef.current = true;
      lastRerouteAtRef.current = Date.now();
      try {
        const fresh = await calculateTruckRoute(from, destination);
        setActiveRoute(fresh);
        await HereNavigation.setRoute(fresh.routeId);
      } catch (e) {
        console.warn('[HereMapScreen] reroute failed:', e.message);
      } finally {
        rerouteInFlightRef.current = false;
      }
    },
    [calculateTruckRoute],
  );

  const handleStopNavigation = useCallback(async () => {
    try {
      await HereNavigation.stopNavigation();
    } catch (e) {
      console.warn('[HereMapScreen] stopNavigation failed:', e.message);
    }

    setIsNavigating(false);
    setNavigationInfo(null);
    setManeuverIndex(null);
    setMetersToNext(null);
    setLiveSpeedKph(0);
    setSpeedLimitKph(null);
    setIsSpeeding(false);
    setVoiceText(null);
    setTurnModalVisible(false);
    lastPreviewPairRef.current = '';

    // The navigator released the map when it stopped — put the preview back.
    const origin = sourceRef.current;
    if (origin) {
      try {
        await mapRef.current?.showCurrentLocation(
          origin.latitude,
          origin.longitude,
          {style: 'pedestrian'},
        );
        await mapRef.current?.setCenter(origin.latitude, origin.longitude, 14);
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    const unsubscribe = HereNavigation.addListeners({
      [NavigationEvents.ROUTE_PROGRESS]: progress => {
        setNavigationInfo(
          buildTripInfo(
            progress.remainingDistanceMeters,
            progress.remainingDurationSeconds,
          ),
        );
        setMetersToNext(
          Number.isFinite(progress.distanceToNextManeuverMeters)
            ? progress.distanceToNextManeuverMeters
            : null,
        );
        if (Number.isInteger(progress.maneuverIndex)) {
          setManeuverIndex(progress.maneuverIndex);
        }
      },

      [NavigationEvents.MANEUVER]: next => setManeuverIndex(next.index),

      [NavigationEvents.LOCATION]: position => {
        setLiveSpeedKph(
          Number.isFinite(position.speedKph) ? Math.round(position.speedKph) : 0,
        );
        // Keeps "resume preview" after stopping anchored to where we ended up.
        sourceRef.current = {
          latitude: position.latitude,
          longitude: position.longitude,
          description: 'Current Location',
        };
      },

      [NavigationEvents.SPEED_LIMIT]: limit => {
        const kph = limit.effectiveSpeedLimitKph ?? limit.speedLimitKph;
        setSpeedLimitKph(Number.isFinite(kph) ? Math.round(kph) : null);
      },

      [NavigationEvents.SPEED_WARNING]: warning =>
        setIsSpeeding(!!warning.isSpeeding),

      [NavigationEvents.VOICE_GUIDANCE]: guidance => setVoiceText(guidance.text),

      [NavigationEvents.ROUTE_DEVIATION]: handleRouteDeviation,

      [NavigationEvents.DESTINATION_REACHED]: () => {
        handleStopNavigation();
        Alert.alert('Arrived', 'You have reached your destination.');
      },
    });

    return unsubscribe;
  }, [handleRouteDeviation, handleStopNavigation]);

  // Guidance runs natively, so it survives this screen unmounting — stop it.
  useEffect(
    () => () => {
      HereNavigation.stopNavigation().catch(() => {});
    },
    [],
  );

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleShowLocation = useCallback(async () => {
    if (isFetchingLocation) return;
    setIsFetchingLocation(true);
    try {
      const location = await getCurrentLocation({detectMock: true});
      const origin = {
        latitude: location.latitude,
        longitude: location.longitude,
        description: 'Current Location',
      };
      setSourceLocation(origin);
      setSourceText('Current Location');
      if (!isNavigatingRef.current) {
        await mapRef.current?.showCurrentLocation(
          origin.latitude,
          origin.longitude,
          {style: 'pedestrian'},
        );
        await mapRef.current?.moveCamera({
          lat: origin.latitude,
          lng: origin.longitude,
          zoom: 15,
          animate: true,
          animationDuration: 1000,
        });
      }
    } catch (e) {
      Alert.alert('Location Error', e?.message || 'Unable to fetch');
    } finally {
      setIsFetchingLocation(false);
    }
  }, [isFetchingLocation]);

  const handleStartNavigation = useCallback(async () => {
    if (isNavigating) {
      handleStopNavigation();
      return;
    }

    const destination = normalizeLocation(destinationLocation);
    if (!destination) {
      Alert.alert('Navigation', 'Select a destination first.');
      return;
    }

    clearTimeout(previewDebounceRef.current);
    navStartingRef.current = true;
    setIsRouteLoading(true);

    try {
      // Navigation must start from where the driver actually is, not from the
      // previewed source — fall back to it only when there is no live fix.
      let origin;
      try {
        const fix = await getCurrentLocation({detectMock: true});
        origin = normalizeLocation({
          latitude: fix.latitude,
          longitude: fix.longitude,
          description: 'Current Location',
        });
      } catch (_) {
        origin = null;
      }
      origin = origin ?? normalizeLocation(sourceLocation);

      if (!origin) {
        Alert.alert('Navigation', 'Current GPS location is not available yet.');
        return;
      }

      setSourceLocation(origin);
      setSourceText('Current Location');

      const navRoute = await calculateTruckRoute(origin, destination);
      setActiveRoute(navRoute);

      // Hand the map to the navigator: it renders the route, the maneuver
      // arrows and the vehicle itself, so our preview layers must come off or
      // they would be drawn twice.
      await Promise.all([
        mapRef.current?.clearMarkers(),
        mapRef.current?.clearRoute(),
        mapRef.current?.hideCurrentLocation(),
      ]);

      await HereNavigation.startNavigation(navRoute.routeId, {
        simulate: simulateNavigation,
        speedFactor: SIMULATION_SPEED_FACTOR,
        voiceGuidance: true,
      });

      lastRerouteAtRef.current = Date.now();
      setIsNavigating(true);
    } catch (e) {
      Alert.alert('Navigation', e?.message || 'Unable to start navigation');
    } finally {
      navStartingRef.current = false;
      setIsRouteLoading(false);
    }
  }, [
    calculateTruckRoute,
    destinationLocation,
    handleStopNavigation,
    isNavigating,
    simulateNavigation,
    sourceLocation,
  ]);

  const handleClear = useCallback(async () => {
    try {
      await Promise.all([
        mapRef.current?.clearMarkers(),
        mapRef.current?.clearRoute(),
      ]);
    } catch (e) {
      console.warn('[HereMapScreen] clear failed:', e.message);
    }
    setActiveRoute(null);
    setNavigationInfo(null);
    lastPreviewPairRef.current = '';
  }, []);

  const handleResetNorth = useCallback(async () => {
    try {
      await mapRef.current?.resetNorth();
      setMapBearing(0);
    } catch (_) {}
  }, []);

  // ── Camera heading poll (compass needle) ─────────────────────────────────
  useEffect(() => {
    if (!mapReady || isNavigating) {
      setMapBearing(0);
      return undefined;
    }
    let active = true;
    const id = setInterval(async () => {
      try {
        const state = await mapRef.current?.getCameraState();
        if (active && Number.isFinite(state?.bearing)) setMapBearing(state.bearing);
      } catch (_) {}
    }, 600);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [mapReady, isNavigating]);

  // ── Seed source from the cached location once ────────────────────────────
  useEffect(() => {
    if (sourceLocation) return;
    const live = normalizeLocation(currentLocation);
    if (!live) return;
    setSourceLocation({...live, description: 'Current Location'});
    setSourceText('Current Location');
  }, [currentLocation, sourceLocation]);

  // ── Centre on the driver when the screen has no trip yet ─────────────────
  useEffect(() => {
    if (!mapReady) return undefined;

    const centerOnDriver = async () => {
      if (isNavigatingRef.current || destinationRef.current) return;
      try {
        const location = await getCurrentLocation({detectMock: true});
        const fix = normalizeLocation(location);
        if (!fix || isNavigatingRef.current || destinationRef.current) return;
        await mapRef.current?.showCurrentLocation(fix.latitude, fix.longitude, {
          style: 'pedestrian',
        });
        await mapRef.current?.moveCamera({
          lat: fix.latitude,
          lng: fix.longitude,
          zoom: 15,
          animate: true,
          animationDuration: 800,
        });
      } catch (e) {
        console.warn('[HereMapScreen] center on driver failed:', e.message);
      }
    };

    centerOnDriver();
    return navigation?.addListener?.('focus', centerOnDriver);
  }, [mapReady, navigation]);

  // ── Seed from navigation params ──────────────────────────────────────────
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
      setSourceText(params.sourceText || incomingSource.description || '');
    }
    if (params.truckDetails && typeof params.truckDetails === 'object') {
      setTruckDetails(params.truckDetails);
    }
  }, [route?.params]);

  // ── Render ───────────────────────────────────────────────────────────────
  const routeSummary = activeRoute
    ? {length: activeRoute.distanceMeters, duration: activeRoute.durationSeconds}
    : null;
  const tolls = activeRoute?.tolls ?? null;
  const maneuvers = activeRoute?.maneuvers ?? [];

  return (
    <SafeAreaView style={styles.container}>
      {isRouteLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingOverlayText}>
            Fetching best route for you...
          </Text>
        </View>
      )}

      {/* ── Map ── */}
      <View style={[styles.topArea, {flex: 1}]}>
        {/* HereMapView initialises the SDK itself and renders its own
            "initializing" / error state, so it is mounted unconditionally —
            gating it here would only hide the reason when something fails. */}
        <HereMapView
          ref={mapRef}
          style={styles.map}
          centerLat={ORIGIN.lat}
          centerLng={ORIGIN.lng}
          zoomLevel={10}
          onMapReady={() => setMapReady(true)}
          onMapError={detail => setSdkError(detail.message)}
        />

        {sdkError ? (
          <View style={styles.mapErrorBanner}>
            <Text style={styles.mapErrorText} numberOfLines={3}>
              {sdkError}
            </Text>
          </View>
        ) : null}

        {isNavigating && (
          <NextManeuverHud
            steps={maneuvers}
            isNavigating={isNavigating}
            maneuverIndex={maneuverIndex}
            metersToNext={metersToNext}
          />
        )}

        {/* Posted speed limit, red-ringed once the navigator flags speeding. */}
        {isNavigating && speedLimitKph != null && (
          <View
            style={[
              styles.speedLimitBadge,
              isSpeeding && styles.speedLimitBadgeAlert,
            ]}>
            <Text style={styles.speedLimitValue}>{speedLimitKph}</Text>
            <Text style={styles.speedLimitUnit}>km/h</Text>
          </View>
        )}

        {/* Compass — preview mode only; the navigator owns the camera while
            guiding. The icon counter-rotates so it always points north. */}
        {!isNavigating && (
          <TouchableOpacity
            style={styles.compassButton}
            onPress={handleResetNorth}
            activeOpacity={0.8}>
            <View style={{transform: [{rotate: `${-mapBearing}deg`}]}}>
              <CompassIcon width={scale(28)} height={scale(28)} fill="#1e293b" />
            </View>
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
            <GpsIcon
              width={verticalScale(28)}
              height={verticalScale(28)}
              fill="#040000"
            />
          )}
        </TouchableOpacity>

        {/* Map look — day / night / satellite, plus the traffic layers. The
            map follows the clock on its own ('auto'); this is the override,
            and the choice carries to every other map in the app. */}
        <MapStyleControl style={styles.mapStyleButton} />

        {!isNavigating && (
          <TouchableOpacity
            style={styles.markerPickerBtn}
            onPress={() => setMarkerModalVisible(true)}
            activeOpacity={0.8}>
            <MarkerPin
              iconKey={markerShape}
              color="#2563EB"
              width={verticalScale(26)}
            />
          </TouchableOpacity>
        )}

        {/* Off-screen rasteriser: turns the chosen SVGs into PNG bytes so the
            native marker images match across platforms. */}
        <MarkerRasterizer
          vehicleShape={markerShape}
          onReady={imgs => {
            markerImagesRef.current = imgs;
          }}
        />
      </View>

      {/* ── Bottom sheet ── */}
      <Animated.View
        style={[styles.bottomArea, {flex: 0, height: sheetHeightAnim}]}>
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
            // ── Navigation panel ──────────────────────────────────────────
            <View style={styles.navPanel}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.navScrollContent}>
                {voiceText ? (
                  <View style={styles.voiceBanner}>
                    <Text style={styles.voiceBannerText} numberOfLines={2}>
                      🔊 {voiceText}
                    </Text>
                  </View>
                ) : null}

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
                  <View style={styles.navSpeedHero}>
                    <Text style={styles.navSpeedValue}>{liveSpeedKph}</Text>
                    <Text style={styles.navSpeedUnit}>km/h</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.navStopBtn}
                    onPress={handleStopNavigation}
                    activeOpacity={0.85}>
                    <Text style={styles.navStopBtnText}>End Navigation</Text>
                  </TouchableOpacity>
                </View>

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

                <View style={styles.navMetaRow}>
                  <View style={styles.navMetaToCol}>
                    <Text style={styles.navMetaLabel}>To</Text>
                    <Text style={styles.navMetaValue} numberOfLines={1}>
                      {destinationText || '—'}
                    </Text>
                  </View>
                  <View style={styles.navMetaTollCol}>
                    <Text style={styles.navMetaLabel}>Toll</Text>
                    {tolls?.total != null ? (
                      <TouchableOpacity onPress={() => setTollModalVisible(true)}>
                        <Text style={styles.navTollValue}>
                          {formatTollTotal(tolls)}
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
            // ── Preview panel ─────────────────────────────────────────────
            <View style={[styles.detailsContainer, {flex: 1}]}>
              <View style={styles.bottomControlsBar}>
                <NavigationControls
                  onLocation={handleShowLocation}
                  onRoute={previewRoute}
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
                      ) : tolls ? (
                        <TouchableOpacity
                          onPress={() => setTollModalVisible(true)}>
                          <Text style={styles.summaryValueToll}>
                            {formatTollTotal(tolls)}
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

                  {/* Simulated navigation drives the route with synthetic GPS
                      fixes — the only way to exercise guidance off the road. */}
                  <View style={styles.simulateRow}>
                    <View style={styles.simulateTextCol}>
                      <Text style={styles.simulateLabel}>
                        Simulate navigation
                      </Text>
                      <Text style={styles.simulateHint}>
                        Drive the route without moving. Turn off to use real GPS.
                      </Text>
                    </View>
                    <Switch
                      value={simulateNavigation}
                      onValueChange={setSimulateNavigation}
                      trackColor={{true: '#93C5FD', false: '#CBD5E1'}}
                      thumbColor={simulateNavigation ? '#2563EB' : '#F1F5F9'}
                    />
                  </View>
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Animated.View>

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
              steps={maneuvers}
              summary={routeSummary}
              isNavigating={false} // false → full scrollable step list
              maneuverIndex={maneuverIndex}
              metersToNext={metersToNext}
              style={styles.turnPanelInModal}
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
              {(tolls?.items ?? []).map((toll, index) => (
                <View key={`${toll.tollSystem ?? 'toll'}-${index}`} style={styles.tollItem}>
                  <View style={styles.tollItemLeft}>
                    <Text style={styles.tollItemName}>
                      {toll.tollSystem || 'Toll'}
                    </Text>
                    <Text style={styles.tollItemRoad}>
                      {toll.countryCode || 'Route'}
                    </Text>
                  </View>
                  <Text style={styles.tollItemAmount}>
                    {formatFare(toll.price, toll.currency)}
                  </Text>
                </View>
              ))}

              <View style={styles.tollItemTotal}>
                <Text style={styles.tollItemTotalLabel}>Total Estimate</Text>
                <Text style={styles.tollItemTotalAmount}>
                  {formatTollTotal(tolls)}
                </Text>
              </View>

              <Text style={styles.tollModalNote}>
                * Shows cheapest one-way toll per booth
              </Text>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Vehicle marker picker ── */}
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
            <Text style={styles.markerModalTitle}>Choose vehicle icon</Text>
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
