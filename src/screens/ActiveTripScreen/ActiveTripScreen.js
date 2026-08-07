import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  View,
  ActivityIndicator,
  Alert,
  StatusBar,
  Animated,
  Easing,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {verticalScale} from 'react-native-size-matters';

import styles from './ActiveTripScreen.styles';
import {colors} from '../../theme/colors';
import AppText from '../../theme/AppText';

import {
  HereMapView,
  HereNavigation,
  HereRouting,
  NavigationEvents,
} from '../../here';
import {
  buildTripInfo,
  fitCameraToRoute,
  normalizeLocation,
} from '../../utils/here/mapHelpers';
import {
  NAVIGATION_ROUTE_WIDTH,
  OFF_ROUTE_THRESHOLD,
} from '../HereMapScreen/constants/navigationConstants';
import {getCurrentLocation} from '../../services/LocationService';
import GpsIcon from '../../assets/svg_icon/gps-svg.svg';

import TripTopBar from './components/TripTopBar';
import SideToolbar from './components/SideToolbar';
import ChatPanel from './components/ChatPanel';
import DocumentsPanel from './components/DocumentsPanel';
import BiddingPanel from './components/BiddingPanel';
import HoursOfServicePanel from './components/HoursOfServicePanel';
import CallPanel from './components/CallPanel';
import TripProgressBar from './components/TripProgressBar';
import StepConfirmCard from './components/StepConfirmCard';
import PodModal from './components/PodModal';

// San Francisco fallback (matches the design mock-up region).
const DEFAULT_CENTER = {lat: 37.7599, lng: -122.4469};

// Toolbar ids that open a centre panel.
const PANEL_IDS = ['chat', 'documents', 'bidding', 'navigate', 'call'];

// A reroute costs a routing request, so deviations are only acted on this often.
const REROUTE_MIN_INTERVAL_MS = 10_000;
const CAMERA_DISTANCE_METERS = 350;
const CAMERA_ZOOM_STEP = 1.6;

/** Distance to the next maneuver, snapped the way a nav readout counts down. */
function formatMeters(meters) {
  if (!Number.isFinite(meters) || meters < 0) return '';
  if (meters < 10) return 'Now';
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function ActiveTripScreen({navigation, route}) {
  const insets = useSafeAreaInsets();
  const trip = useMemo(() => {
    const params = route?.params ?? {};
    const source = normalizeLocation(params.sourceLocation);
    const destination = normalizeLocation(params.destinationLocation);
    return {
      source,
      destination,
      destinationText:
        params.destinationText || destination?.description || 'Destination',
      truckDetails: params.truckDetails ?? null,
    };
  }, [route?.params]);

  const mapRef = useRef(null);
  const [center, setCenter] = useState(
    trip.source
      ? {lat: trip.source.latitude, lng: trip.source.longitude}
      : DEFAULT_CENTER,
  );
  const [mapReady, setMapReady] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [panelFullscreen, setPanelFullscreen] = useState(false);
  const [podOpen, setPodOpen] = useState(false);
  const [milestone, setMilestone] = useState({
    step: 2,
    totalSteps: 4,
    title: 'Shipment Procured at Pickup 2',
  });

  // ── Trip route + guidance ───────────────────────────────────────────────
  // The route currently previewed or being navigated (see HereRouting).
  const [activeRoute, setActiveRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Live guidance state — every field below is fed by a navigator event.
  const [navInfo, setNavInfo] = useState(null);
  const [nextManeuver, setNextManeuver] = useState(null);
  const [metersToNext, setMetersToNext] = useState(null);
  const [speedKph, setSpeedKph] = useState(0);
  const [cameraDistance, setCameraDistance] = useState(CAMERA_DISTANCE_METERS);
  const [voiceText, setVoiceText] = useState(null);
  const [speechOn, setSpeechOn] = useState(true);

  // Mirror refs, so event callbacks always see current values without
  // re-subscribing on every render.
  const isNavigatingRef = useRef(false);
  const destinationRef = useRef(null);
  const truckDetailsRef = useRef(null);
  const lastRerouteAtRef = useRef(0);
  const rerouteInFlightRef = useRef(false);

  useEffect(() => {
    isNavigatingRef.current = isNavigating;
  }, [isNavigating]);
  useEffect(() => {
    destinationRef.current = trip.destination;
    truckDetailsRef.current = trip.truckDetails;
  }, [trip]);

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const [revealing, setRevealing] = useState(false);
  const revealScale = useRef(new Animated.Value(0)).current;

  const runReveal = useCallback(() => {
    revealScale.setValue(0);
    setRevealing(true);
    Animated.timing(revealScale, {
      toValue: 1,
      duration: 1050,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(({finished}) => {
      if (!finished) return;
      navigation?.navigate?.('TruckAnimationScreen', {
        title: 'Completing your trip…',
        subtitle: 'Finalising delivery and queuing your payout.',
        next: 'TripCompletedScreen',
      });

      setTimeout(() => {
        setRevealing(false);
        revealScale.setValue(0);
      }, 400);
    });
  }, [navigation, revealScale]);

  const [locating, setLocating] = useState(false);
  const showMyLocation = useCallback(async ({animate = true} = {}) => {
    if (isNavigatingRef.current) {
      HereNavigation.setCameraBehavior({mode: 'fixed'}).catch(() => {});
      return;
    }

    setLocating(true);
    try {
      const pos = await getCurrentLocation({highAccuracy: false});
      if (!pos?.latitude || !pos?.longitude) return;
      setCenter({lat: pos.latitude, lng: pos.longitude});
      await mapRef.current?.showCurrentLocation(pos.latitude, pos.longitude, {
        bearing: Number.isFinite(pos.heading) ? pos.heading : 0,
      });
      if (animate) {
        await mapRef.current?.moveCamera({
          lat: pos.latitude,
          lng: pos.longitude,
          zoom: 15,
          animate: true,
          animationDuration: 800,
        });
      }
    } catch (_) {
      // Keep the default centre / previous marker on failure.
    } finally {
      setLocating(false);
    }
  }, []);

  // With a trip to show, the route framing owns the camera; only fall back to
  // "centre on me" when this screen was opened without one.
  useEffect(() => {
    if (!mapReady || trip.destination) return undefined;
    const timer = setTimeout(() => {
      showMyLocation({animate: false});
    }, 700);
    return () => clearTimeout(timer);
  }, [mapReady, trip.destination, showMyLocation]);

  // ── Route preview ────────────────────────────────────────────────────────

  /**
   * Resolves the pickup: the driver's live position, unless the caller passed
   * an explicit source. Runs the location service's preflight, so this is also
   * what gets GPS switched on and ACCESS_FINE_LOCATION granted before the
   * navigator asks for the device feed.
   */
  const resolvePickup = useCallback(async () => {
    if (trip.source) return trip.source;
    try {
      return normalizeLocation(await getCurrentLocation({detectMock: true}));
    } catch (_) {
      return null;
    }
  }, [trip.source]);

  /**
   * Calculates the trip's truck route and draws it: the driver at the pickup,
   * a drop marker, the route polyline, and a camera framing the whole thing.
   */
  const drawTripPreview = useCallback(async () => {
    const destination = trip.destination;
    if (!destination) return;

    setRouteLoading(true);
    setRouteError(null);

    const origin = await resolvePickup();
    if (!origin) {
      setRouteError(
        'Waiting for a GPS fix — turn location on, then tap Start Navigation.',
      );
      setRouteLoading(false);
      return;
    }

    try {
      const hereRoute = await HereRouting.calculateTruckRoute(
        origin.latitude,
        origin.longitude,
        destination.latitude,
        destination.longitude,
        trip.truckDetails,
      );
      setActiveRoute(hereRoute);

      await Promise.all([
        mapRef.current?.clearMarkers(),
        mapRef.current?.clearRoute(),
      ]);
      // The pickup is the driver, so it gets the position indicator rather than
      // a pin — a pin there would read as a stop they still have to reach.
      if (trip.source) {
        await mapRef.current?.addMarker({
          latitude: origin.latitude,
          longitude: origin.longitude,
          color: '#22C55E',
        });
      } else {
        await mapRef.current?.showCurrentLocation(
          origin.latitude,
          origin.longitude,
          {style: 'navigation'},
        );
      }
      await mapRef.current?.addMarker({
        latitude: destination.latitude,
        longitude: destination.longitude,
        color: '#FF3366',
      });
      // Native draws the stored route's own geometry — nothing to decode in JS.
      await mapRef.current?.drawRoute({
        routeId: hereRoute.routeId,
        color: '#2563EB',
        width: NAVIGATION_ROUTE_WIDTH,
      });
      await fitCameraToRoute(mapRef, hereRoute.polyline);
    } catch (e) {
      setRouteError(e?.message || 'Unable to build the route');
    } finally {
      setRouteLoading(false);
    }
  }, [resolvePickup, trip]);

  // Draw on arrival, and again after guidance ends — stopping hands the map
  // back with the navigator's layers removed.
  useEffect(() => {
    if (!mapReady || isNavigating) return;
    drawTripPreview();
  }, [mapReady, isNavigating, drawTripPreview]);

  // ── Navigation ───────────────────────────────────────────────────────────

  /**
   * Zoom while guiding. The navigator re-applies its camera on every location
   * fix, so a pinch is undone within the second — the tracking distance itself
   * has to move instead. Native clamps and returns what it settled on.
   */
  const zoomBy = useCallback(
    async factor => {
      try {
        const applied = await HereNavigation.setCameraBehavior({
          distanceMeters: cameraDistance * factor,
        });
        if (Number.isFinite(applied?.distanceMeters)) {
          setCameraDistance(applied.distanceMeters);
        }
      } catch (e) {
        console.warn('[ActiveTripScreen] camera zoom failed:', e?.message);
      }
    },
    [cameraDistance],
  );

  const handleStopNavigation = useCallback(async () => {
    try {
      await HereNavigation.stopNavigation();
    } catch (e) {
      console.warn('[ActiveTripScreen] stopNavigation failed:', e?.message);
    }
    setIsNavigating(false);
    setNavInfo(null);
    setNextManeuver(null);
    setMetersToNext(null);
    setSpeedKph(0);
    setVoiceText(null);
  }, []);

  /** Mutes the cab without stopping guidance — the text keeps coming. */
  const toggleSpeech = useCallback(async () => {
    const next = !speechOn;
    setSpeechOn(next);
    try {
      await HereNavigation.setSpeechEnabled(next);
    } catch (e) {
      console.warn('[ActiveTripScreen] toggling speech failed:', e?.message);
    }
  }, [speechOn]);

  const handleStartNavigation = useCallback(async () => {
    if (isNavigating) {
      handleStopNavigation();
      return;
    }

    const destination = trip.destination;
    if (!destination) {
      Alert.alert('Navigation', 'This trip has no destination yet.');
      return;
    }

    setRouteLoading(true);
    try {
      // Guidance runs on the device's own GPS, so it has to start from where
      // the driver actually is — routing from the previewed origin would begin
      // with an instant deviation the moment they move.
      const from = await resolvePickup();
      if (!from) {
        Alert.alert(
          'Navigation',
          'Current GPS location is not available yet. Turn location on and try again.',
        );
        return;
      }

      const navRoute = await HereRouting.calculateTruckRoute(
        from.latitude,
        from.longitude,
        destination.latitude,
        destination.longitude,
        trip.truckDetails,
      );
      setActiveRoute(navRoute);
      setRouteError(null);

      // Hand the map to the navigator: it renders the route, the maneuver
      // arrows and the vehicle itself, so our preview layers must come off or
      // they would be drawn twice.
      await Promise.all([
        mapRef.current?.clearMarkers(),
        mapRef.current?.clearRoute(),
        mapRef.current?.hideCurrentLocation(),
      ]);

      await HereNavigation.startNavigation(navRoute.routeId, {
        simulate: false,
        voiceGuidance: true,
        // The SDK writes "Turn right onto Elm Street" but never says it; this
        // is what hands the text to the native speaker.
        speak: speechOn,
        // Bind to this screen's map explicitly. Without a tag the navigator
        // renders into whichever HereMapView most recently took a prop update,
        // which is the wrong one as soon as a second map exists anywhere in the
        // tree (HomeScreen's floating map, HereMapScreen behind us).
        mapViewTag: mapRef.current?.getTag() ?? undefined,
        // Without this the SDK picks tilt and zoom from speed, so pulling away
        // from a standstill opens flat and far out instead of on the road
        // ahead. Pin the driving view, at whatever zoom was last chosen.
        camera: {
          mode: 'fixed',
          distanceMeters: cameraDistance,
        },
      });

      lastRerouteAtRef.current = Date.now();
      setIsNavigating(true);
    } catch (e) {
      Alert.alert('Navigation', e?.message || 'Unable to start navigation');
    } finally {
      setRouteLoading(false);
    }
  }, [
    cameraDistance,
    handleStopNavigation,
    isNavigating,
    resolvePickup,
    speechOn,
    trip,
  ]);

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
        const fresh = await HereRouting.calculateTruckRoute(
          from.latitude,
          from.longitude,
          destination.latitude,
          destination.longitude,
          truckDetailsRef.current,
        );
        setActiveRoute(fresh);
        await HereNavigation.setRoute(fresh.routeId);
      } catch (e) {
        console.warn('[ActiveTripScreen] reroute failed:', e?.message);
      } finally {
        rerouteInFlightRef.current = false;
      }
    },
    [],
  );

  useEffect(() => {
    const unsubscribe = HereNavigation.addListeners({
      [NavigationEvents.ROUTE_PROGRESS]: progress => {
        setNavInfo(
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
      },

      [NavigationEvents.MANEUVER]: next => setNextManeuver(next),

      [NavigationEvents.LOCATION]: position =>
        setSpeedKph(
          Number.isFinite(position.speedKph) ? Math.round(position.speedKph) : 0,
        ),

      // The native speaker has already said this; showing it too covers the
      // driver who has the cab muted or missed it.
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

  const handleToolSelect = useCallback(id => {
    if (id === 'collapse') {
      setActivePanel(null);
      return;
    }
    // Only chat / documents / bidding have panels; others just close any open one.
    if (PANEL_IDS.includes(id)) {
      setActivePanel(prev => (prev === id ? null : id));
    } else {
      setActivePanel(null);
    }
  }, []);

  const closePanel = useCallback(() => setActivePanel(null), []);
  const goBack = useCallback(() => navigation?.goBack?.(), [navigation]);

  // Whole-trip figures while previewing; what is left of it while guiding.
  const tripSummary = useMemo(() => {
    if (isNavigating) return navInfo;
    if (!activeRoute) return null;
    return buildTripInfo(
      activeRoute.distanceMeters,
      activeRoute.durationSeconds,
    );
  }, [activeRoute, isNavigating, navInfo]);

  return (
    // No top safe-area inset: insetting the root would leave the container's
    // navy showing as a band above the map. The top bar pads itself past the
    // status bar instead (see topBar.paddingTop), so the map stays full-bleed.
    <View style={styles.container}>
      <StatusBar
        barStyle={panelFullscreen ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />

      {/* ── HERE map (Android + iOS native) ── */}
      {/* HereMapView initialises the SDK itself and renders its own
          "initializing" / error state, so it is mounted unconditionally —
          gating it here would only hide the reason when something fails. */}
      <HereMapView
        ref={mapRef}
        style={styles.map}
        centerLat={center.lat}
        centerLng={center.lng}
        zoomLevel={13}
        onMapReady={() => setMapReady(true)}
        onMapError={detail => setRouteError(detail.message)}
      />

      {/* ── Top bar ── */}
      <TripTopBar
        onBack={goBack}
        onToggleDuty={() => {}}
        onSOS={() => {}}
        onService={() => {}}
      />

      {/* ── Trip route + HERE turn-by-turn navigation ── */}
      {trip.destination && (
        <View style={styles.tripCard}>
          <AppText style={styles.tripCardLabel}>
            {isNavigating ? 'NAVIGATING TO' : 'NEXT STOP'}
          </AppText>
          <AppText style={styles.tripCardTitle} numberOfLines={1}>
            {trip.destinationText}
          </AppText>

          {routeError ? (
            <AppText style={styles.tripCardError} numberOfLines={3}>
              {routeError}
            </AppText>
          ) : (
            <AppText style={styles.tripCardStats}>
              {tripSummary
                ? `${tripSummary.distKm} km · ${tripSummary.etaText}`
                : 'Calculating route…'}
            </AppText>
          )}

          {isNavigating && (
            <>
              <View style={styles.tripCardDivider} />
              {formatMeters(metersToNext) ? (
                <AppText style={styles.tripCardManeuverDist}>
                  {formatMeters(metersToNext)}
                </AppText>
              ) : null}
              <AppText style={styles.tripCardManeuver} numberOfLines={2}>
                {voiceText ||
                  nextManeuver?.instruction ||
                  nextManeuver?.roadName ||
                  'Follow the route'}
              </AppText>
              <AppText style={styles.tripCardStats}>
                {speedKph} km/h · ETA {navInfo?.arrivalStr ?? '—'}
              </AppText>

              {/* The follow camera overrides pinch on every location fix, so
                  zoom has to move the tracking distance instead. */}
              <View style={styles.zoomRow}>
                <AppText style={styles.tripCardLabel}>ZOOM</AppText>
                <View style={styles.zoomBtns}>
                  <TouchableOpacity
                    style={styles.zoomBtn}
                    onPress={() => zoomBy(CAMERA_ZOOM_STEP)}
                    activeOpacity={0.7}>
                    <AppText style={styles.zoomBtnText}>−</AppText>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.zoomBtn}
                    onPress={() => zoomBy(1 / CAMERA_ZOOM_STEP)}
                    activeOpacity={0.7}>
                    <AppText style={styles.zoomBtnText}>+</AppText>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={styles.zoomRow}
                onPress={toggleSpeech}
                activeOpacity={0.7}>
                <AppText style={styles.tripCardLabel}>VOICE</AppText>
                <View style={styles.zoomBtns}>
                  <View style={[styles.zoomBtn, speechOn && styles.zoomBtnOn]}>
                    <AppText style={styles.zoomBtnText}>
                      {speechOn ? '🔊' : '🔇'}
                    </AppText>
                  </View>
                </View>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.navBtn, isNavigating && styles.navBtnStop]}
            onPress={handleStartNavigation}
            disabled={routeLoading}
            activeOpacity={0.85}>
            {routeLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <AppText style={styles.navBtnText}>
                {isNavigating ? 'End Navigation' : 'Start Navigation'}
              </AppText>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ── Left toolbar ── */}
      <SideToolbar panel={activePanel} onSelect={handleToolSelect} />
      
      {keyboardVisible && (
        <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
          <View style={styles.keyboardBackdrop} />
        </TouchableWithoutFeedback>
      )}

      {/* ── Centre panels ── */}
      {activePanel === 'chat' && (
        <ChatPanel onClose={closePanel} onExpandedChange={setPanelFullscreen} />
      )}
      {activePanel === 'documents' && (
        <DocumentsPanel onClose={closePanel} onExpandedChange={setPanelFullscreen} />
      )}
      {activePanel === 'bidding' && (
        <BiddingPanel onClose={closePanel} onExpandedChange={setPanelFullscreen} />
      )}
      {activePanel === 'navigate' && (
        <HoursOfServicePanel onClose={closePanel} onExpandedChange={setPanelFullscreen} />
      )}
      {activePanel === 'call' && <CallPanel onClose={closePanel} />}

      {/* ── Floating GPS re-center button ── */}
      {/* Sits behind the panels (low zIndex), so it stays put when one opens. */}
      <TouchableOpacity
        style={[
          styles.gpsButton,
          {bottom: styles.gpsButton.bottom + insets.bottom},
        ]}
        onPress={() => showMyLocation({animate: true})}
        disabled={locating}
        activeOpacity={0.8}>
        {locating ? (
          <ActivityIndicator size="small" color={colors.navy} />
        ) : (
          <GpsIcon width={verticalScale(26)} height={verticalScale(26)} fill={colors.navy} />
        )}
      </TouchableOpacity>
      
      <StepConfirmCard
        key={milestone?.step}
        visible={Boolean(milestone)}
        step={milestone?.step}
        totalSteps={milestone?.totalSteps}
        title={milestone?.title}
        onConfirm={() => setMilestone(null)}
      />

      {/* ── Bottom trip progress ── */}
      <TripProgressBar
        progress={0.63}
        withCheckbox={activePanel === 'bidding'}
        onEndTrip={() => setPodOpen(true)}
      />

      {/* ── Proof-of-Delivery flow ── */}
      <PodModal
        visible={podOpen}
        onClose={() => setPodOpen(false)}
        onComplete={() => {
          // The modal closes itself (slides out); once it's gone, grow the
          // white circle over the map and then jump to the truck animation.
          setTimeout(runReveal, 320);
        }}
      />

      {/* ── Circular reveal transition ── */}
      {revealing && (
        <Animated.View
          pointerEvents="none"
          style={[styles.revealCircle, {transform: [{scale: revealScale}]}]}
        />
      )}
    </View>
  );
}
