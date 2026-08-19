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

import {
  destinationMarkerOptions,
  DestinationMarkerRasterizer,
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
import {
  endTripSession,
  getTripSession,
  startTripSession,
  updateTripSession,
} from '../../services/TripSessionService';
import GpsIcon from '../../assets/svg_icon/gps-svg.svg';
import NavigationIcon from '../../assets/svg_icon/Navigation_Icon.svg';

import MapStyleControl from '../../component/MapStyleControl/MapStyleControl';
import TripTopBar from './components/TripTopBar';
import DirectionCard from './components/DirectionCard';
import SideToolbar from './components/SideToolbar';
import ChatPanel from './components/ChatPanel';
import DocumentsPanel from './components/DocumentsPanel';
import BiddingPanel from './components/BiddingPanel';
import HoursOfServicePanel from './components/HoursOfServicePanel';
import CallPanel from './components/CallPanel';
import TripProgressBar from './components/TripProgressBar';
import StopVerifyModal from './components/StopVerifyModal';
import PodModal from './components/PodModal';

// San Francisco fallback (matches the design mock-up region).
const DEFAULT_CENTER = {lat: 37.7599, lng: -122.4469};

// Toolbar ids that open a centre panel.
const PANEL_IDS = ['chat', 'documents', 'bidding', 'navigate', 'call'];

// A reroute costs a routing request, so deviations are only acted on this often.
const REROUTE_MIN_INTERVAL_MS = 10_000;
const CAMERA_DISTANCE_METERS = 350;

// Tapping navigate used to pay twice for work the preview had just done: a
// second GPS fix and a second routing request, several seconds of spinner
// before guidance appeared. The preview's route is reused instead while the
// driver is still this close to where it was calculated from, and while it is
// this fresh — beyond either, the road ahead has changed enough to re-route.
const PREVIEW_REUSE_RADIUS_M = 150;
const PREVIEW_REUSE_MAX_AGE_MS = 180_000;
// Guidance re-acquires the device feed the moment it starts, so a fix this
// recent is a good enough starting point. Racing GPS again here only adds
// seconds to the tap.
const NAV_FIX_MAX_AGE_MS = 45_000;

/** Rough great-circle metres — only ever compared against a small radius. */
const metersBetween = (a, b) => {
  if (!a || !b) return Infinity;
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat = toRad((a.latitude + b.latitude) / 2);
  const x = dLng * Math.cos(lat);
  return Math.sqrt(dLat * dLat + x * x) * 6371000;
};

/**
 * The stop-by-stop checklist the driver works through: confirm the step, then
 * verify the stop with the shipper's one-time code. Purely a trip-paperwork
 * flow — it never touches routing or guidance.
 */
const MILESTONES = [
  {
    step: 1,
    code: 'P1',
    title: 'Pre Trip Inspection',
    action: 'VERIFY PICKUP',
    doneTitle: 'Shipment Procured',
    doneText: 'Ride verified at Pickup 1',
    otpDesc: 'Ask the shipper to share OTP to Start the Shipment',
  },
  {
    step: 2,
    code: 'P2',
    title: 'Shipment Procured at Pickup 2',
    action: 'VERIFY PICKUP',
    doneTitle: 'Shipment Procured',
    doneText: 'Ride verified at Pickup 2',
    otpDesc: 'Ask the shipper to share OTP to Start the Shipment',
  },
  {
    step: 3,
    code: 'D1',
    title: 'Arrived at Drop 1',
    action: 'VERIFY DROP',
    doneTitle: 'Shipment Delivered',
    doneText: 'Ride verified at Drop 1',
    otpDesc: 'Ask the receiver to share OTP to complete the drop',
  },
  {
    step: 4,
    code: 'D2',
    title: 'Arrived at Drop 2',
    action: 'VERIFY DROP',
    doneTitle: 'Shipment Delivered',
    doneText: 'Ride verified at Drop 2',
    otpDesc: 'Ask the receiver to share OTP to complete the drop',
  },
];

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

  // The trip that was already guiding when this screen mounted, if any.
  //
  // Guidance runs inside the SDK, so it keeps going after this screen unmounts:
  // the driver can back out to Home, watch the trip in the floating map and
  // come back. Opening on "nothing yet" would have this screen offer to start a
  // second session over the top of the live one, so it opens on what is
  // actually running instead. Read once, at mount.
  const resumedSession = useRef(
    (() => {
      const live = getTripSession();
      return live?.navigating ? live : null;
    })(),
  ).current;

  // Cleared by the re-attach effect once it has taken the rendering back.
  const pendingAttachRef = useRef(Boolean(resumedSession));

  const [activePanel, setActivePanel] = useState(null);
  const [panelFullscreen, setPanelFullscreen] = useState(false);
  const [podOpen, setPodOpen] = useState(false);

  // ── Stop checklist: driving → OTP → verified ────────────────────────────
  const [milestoneIndex, setMilestoneIndex] = useState(0);
  // 'idle' | 'otp' | 'verified' — one stage at a time. 'idle' is the drive to
  // the stop, with no paperwork on screen; tapping Reached is the only thing
  // that opens the OTP sheet.
  const [milestoneStage, setMilestoneStage] = useState('idle');
  const milestone = MILESTONES[milestoneIndex] ?? null;

  /** Stop cleared: bank the progress and move on to the next milestone. */
  const completeMilestone = useCallback(() => {
    setMilestoneIndex(i => i + 1);
    setMilestoneStage('idle');
  }, []);

  /**
   * The bottom-bar button. While stops remain it reads "Reached" and opens that
   * stop's OTP sheet straight away; once they are all cleared it reads "End
   * Trip" and hands over to the proof-of-delivery flow.
   */
  const handleReachedPress = useCallback(() => {
    if (milestone) {
      setMilestoneStage('otp');
      return;
    }
    setPodOpen(true);
  }, [milestone]);

  // ── Trip progress ───────────────────────────────────────────────────────
  // Driven by the route itself — total distance against what is still left —
  // so the bar creeps forward as the truck moves instead of only stepping when
  // a stop is verified. `total` is banked rather than read off the live route:
  // a reroute returns a route measured from wherever the driver now is, which
  // on its own would reset the bar to empty mid-trip.
  const [leg, setLeg] = useState({
    // Re-adopting a running trip: the total was banked when guidance started,
    // and the first progress event fills the remainder back in — so the bar
    // picks up where it was instead of resetting to empty.
    total: resumedSession?.totalDistanceMeters ?? null,
    remaining: null,
  });
  const legRef = useRef(leg);
  useEffect(() => {
    legRef.current = leg;
  }, [leg]);

  const tripProgress = useMemo(() => {
    const {total, remaining} = leg;
    if (!Number.isFinite(total) || total <= 0) return 0;
    if (!Number.isFinite(remaining)) return 0;
    return Math.max(0, Math.min(1, 1 - remaining / total));
  }, [leg]);

  // ── Trip route + guidance ───────────────────────────────────────────────
  // The route currently previewed or being navigated (see HereRouting).
  const [activeRoute, setActiveRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [isNavigating, setIsNavigating] = useState(
    Boolean(resumedSession),
  );

  // Live guidance state — every field below is fed by a navigator event.
  const [navInfo, setNavInfo] = useState(null);
  const [nextManeuver, setNextManeuver] = useState(null);
  const [metersToNext, setMetersToNext] = useState(null);

  // Mirror refs, so event callbacks always see current values without
  // re-subscribing on every render.
  const isNavigatingRef = useRef(false);
  const destinationRef = useRef(null);
  const truckDetailsRef = useRef(null);
  const lastRerouteAtRef = useRef(0);
  const rerouteInFlightRef = useRef(false);
  // The JS fix guidance was started from, so the navigator's own position can
  // be logged against it (see the LOCATION listener).
  const navStartFixRef = useRef(null);
  const lastLocationLogAtRef = useRef(0);

  useEffect(() => {
    isNavigatingRef.current = isNavigating;
  }, [isNavigating]);
  useEffect(() => {
    destinationRef.current = trip.destination;
    truckDetailsRef.current = trip.truckDetails;
  }, [trip]);

  // Publish the trip so the rest of the app knows one is on — it is what Home
  // floats its live map from. A session that is already running is left alone:
  // overwriting it here would drop the route and progress this screen has just
  // re-adopted.
  useEffect(() => {
    if (resumedSession) return;
    startTripSession({
      destinationLocation: trip.destination,
      destinationText: trip.destinationText,
      sourceLocation: trip.source,
      truckDetails: trip.truckDetails,
    });
  }, [resumedSession, trip]);

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
    // Delivered — this is the one exit that really ends the trip, so guidance
    // stops here and the session closes. Without it the driver would land back
    // on Home with a floating map still guiding them to a drop they have made.
    HereNavigation.stopNavigation().catch(() => {});
    endTripSession();

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
      console.log(
        '[ActiveTripScreen] current marker (gps button) lat/lng:',
        pos.latitude,
        pos.longitude,
        {accuracy: pos.accuracy, heading: pos.heading},
      );
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
  const resolvePickup = useCallback(
    async ({preferCacheMs} = {}) => {
      if (trip.source) return trip.source;
      try {
        const fix = await getCurrentLocation({
          detectMock: true,
          // Callers that can live with a slightly older fix say so, and get
          // the cached one back instantly instead of waiting on a provider.
          ...(Number.isFinite(preferCacheMs) ? {preferCacheMs} : null),
        });
        // normalizeLocation keeps only the coordinates, so anything that says
        // how trustworthy this fix is has to be read off it here. `ageMs` is
        // the one that matters: the service can serve a cached fix, including
        // a persisted one from a previous session.
        console.log(
          '[ActiveTripScreen] gps fix lat/lng:',
          fix?.latitude,
          fix?.longitude,
          {
            accuracy: fix?.accuracy,
            ageMs: Number.isFinite(fix?.timestamp)
              ? Date.now() - fix.timestamp
              : null,
            preferCacheMs: preferCacheMs ?? 'default',
          },
        );
        return normalizeLocation(fix);
      } catch (_) {
        return null;
      }
    },
    [trip.source],
  );

  /**
   * The route the preview drew, kept so tapping navigate can start on it
   * rather than calculating the same road twice. Holds where it was
   * calculated from and to, which is what decides whether it is still the
   * right route (see takePreviewRoute).
   */
  const previewRef = useRef(null);

  /** The previewed route, if it still describes the drive about to start. */
  const takePreviewRoute = useCallback((origin, destination) => {
    const cached = previewRef.current;
    if (!cached?.route || !origin || !destination) return null;
    if (Date.now() - cached.at > PREVIEW_REUSE_MAX_AGE_MS) return null;
    if (metersBetween(cached.destination, destination) > 1) return null;
    if (metersBetween(cached.origin, origin) > PREVIEW_REUSE_RADIUS_M) {
      return null;
    }
    return cached.route;
  }, []);

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
      previewRef.current = {
        route: hereRoute,
        origin,
        destination,
        at: Date.now(),
      };
      // Nothing driven yet, so the whole route is what is left.
      setLeg({
        total: hereRoute.distanceMeters,
        remaining: hereRoute.distanceMeters,
      });

      await Promise.all([
        mapRef.current?.clearMarkers(),
        mapRef.current?.clearRoute(),
      ]);
      // The pickup is the driver, so it gets the position indicator rather than
      // a pin — a pin there would read as a stop they still have to reach.
      console.log(
        '[ActiveTripScreen] current marker (preview origin) lat/lng:',
        origin.latitude,
        origin.longitude,
        trip.source ? '(trip source)' : '(live gps)',
      );
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
      await mapRef.current?.addMarker(
        destinationMarkerOptions({
          latitude: destination.latitude,
          longitude: destination.longitude,
        }),
      );
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

  /**
   * Takes back the rendering of a session that is still running — the driver
   * left this screen, watched the trip in Home's floating map, and has now
   * returned. Only the surface moves: the route, the maneuver arrows and the
   * vehicle carry on, which starting navigation again would not do.
   *
   * `{mode: 'fixed'}` is re-asserted because panning the floating map hands the
   * camera to the user, and this map would otherwise inherit that and sit still
   * while the truck drives off it.
   */
  useEffect(() => {
    if (!mapReady || !pendingAttachRef.current) return;
    pendingAttachRef.current = false;

    HereNavigation.attachToMapView(mapRef.current?.getTag(), {
      mode: 'fixed',
      distanceMeters: CAMERA_DISTANCE_METERS,
    })
      // Guidance ended while we were away (arrival, or it was stopped from the
      // floating card), or no map took the rendering — either way there is
      // nothing live to show, so fall back to previewing the trip.
      .then(rendering => setIsNavigating(Boolean(rendering)))
      .catch(() => setIsNavigating(false));
  }, [mapReady]);

  // ── Navigation ───────────────────────────────────────────────────────────

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
    // The trip is still open — the driver has stopped guidance, not arrived —
    // so the session stays, minus the guidance that is no longer running.
    updateTripSession({navigating: false, routeId: null});
  }, []);

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
      const from = await resolvePickup({preferCacheMs: NAV_FIX_MAX_AGE_MS});
      navStartFixRef.current = from;
      lastLocationLogAtRef.current = 0;
      console.log(
        '[ActiveTripScreen] current marker (nav start) lat/lng:',
        from?.latitude,
        from?.longitude,
      );
      if (!from) {
        Alert.alert(
          'Navigation',
          'Current GPS location is not available yet. Turn location on and try again.',
        );
        return;
      }

      // Taking the preview's layers off does not depend on the route, so it
      // runs alongside the routing call instead of after it. Awaited before
      // guidance starts — the navigator draws the route, the maneuver arrows
      // and the vehicle, and a preview still on the map would double them.
      // Swallowing the failure keeps a routing error as the one thing that can
      // reach the alert below, and stops a clear that fails while routing is
      // still in flight from surfacing as an unhandled rejection.
      const cleared = Promise.all([
        mapRef.current?.clearMarkers(),
        mapRef.current?.clearRoute(),
        mapRef.current?.hideCurrentLocation(),
      ]).catch(() => {});

      // The preview drew this same drive seconds ago. Reusing its route is
      // what makes the tap feel immediate: no second routing round trip
      // before guidance can start.
      const navRoute =
        takePreviewRoute(from, destination) ??
        (await HereRouting.calculateTruckRoute(
          from.latitude,
          from.longitude,
          destination.latitude,
          destination.longitude,
          trip.truckDetails,
        ));
      setActiveRoute(navRoute);
      setRouteError(null);
      // Guidance routes from the driver's real position, so this is the
      // distance the progress bar measures against for the rest of the trip.
      setLeg({
        total: navRoute.distanceMeters,
        remaining: navRoute.distanceMeters,
      });

      await cleared;

      await HereNavigation.startNavigation(navRoute.routeId, {
        simulate: false,
        voiceGuidance: true,
        // The SDK writes "Turn right onto Elm Street" but never says it; this
        // is what hands the text to the native speaker. Voice is simply on for
        // the trip — there is no mute control on this screen.
        speak: true,
        // Bind to this screen's map explicitly. Without a tag the navigator
        // renders into whichever HereMapView most recently took a prop update,
        // which is the wrong one as soon as a second map exists anywhere in the
        // tree (HomeScreen's floating map, HereMapScreen behind us).
        mapViewTag: mapRef.current?.getTag() ?? undefined,
        // Without this the SDK picks tilt and zoom from speed, so pulling away
        // from a standstill opens flat and far out instead of on the road
        // ahead. Pin the driving view.
        camera: {
          mode: 'fixed',
          distanceMeters: CAMERA_DISTANCE_METERS,
        },
      });

      // The navigator draws the route, the maneuver arrows and the vehicle —
      // but never the stop being driven to. So the destination pin goes back
      // on after the clear above, or it would vanish when guidance starts.
      // Not awaited: guidance is already running, and the button should not
      // keep spinning for a marker.
      mapRef.current
        ?.addMarker(
          destinationMarkerOptions({
            latitude: destination.latitude,
            longitude: destination.longitude,
          }),
        )
        ?.catch(() => {});

      lastRerouteAtRef.current = Date.now();
      setIsNavigating(true);
      // Hand the running session to the rest of the app: this is what lets the
      // floating map pick the same guidance up when the driver leaves.
      updateTripSession({
        navigating: true,
        routeId: navRoute.routeId,
        totalDistanceMeters: navRoute.distanceMeters,
      });
    } catch (e) {
      Alert.alert('Navigation', e?.message || 'Unable to start navigation');
    } finally {
      setRouteLoading(false);
    }
  }, [handleStopNavigation, isNavigating, resolvePickup, takePreviewRoute, trip]);

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
        // Keep what has already been driven and re-base the total on the new
        // way round, so a detour lengthens the bar instead of resetting it.
        const {total, remaining} = legRef.current;
        const driven = Math.max(0, (total ?? 0) - (remaining ?? 0));
        setLeg({
          total: driven + fresh.distanceMeters,
          remaining: fresh.distanceMeters,
        });
        await HereNavigation.setRoute(fresh.routeId);
        updateTripSession({routeId: fresh.routeId});
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
        // What is left of the drive — the progress bar's numerator.
        if (Number.isFinite(progress.remainingDistanceMeters)) {
          setLeg(prev => ({...prev, remaining: progress.remainingDistanceMeters}));
        }
      },

      // Where the navigator itself thinks the vehicle is. This is what draws
      // the marker during guidance — our own indicator is hidden by then — so
      // it is the only position that explains what is on screen. Throttled:
      // the event fires about once a second.
      [NavigationEvents.LOCATION]: loc => {
        const now = Date.now();
        if (now - lastLocationLogAtRef.current < 3000) return;
        lastLocationLogAtRef.current = now;
        const startFix = navStartFixRef.current;
        console.log(
          '[ActiveTripScreen] current marker (navigator) lat/lng:',
          loc?.latitude,
          loc?.longitude,
          {
            isMapMatched: loc?.isMapMatched,
            accuracy: loc?.horizontalAccuracyMeters,
            speed: loc?.speed,
            // How far HERE's positioning has landed from the JS fix guidance
            // was started with — the two use different providers.
            driftFromStartFixM: startFix
              ? Math.round(metersBetween(startFix, loc))
              : null,
          },
        );
      },

      [NavigationEvents.MANEUVER]: next => setNextManeuver(next),

      [NavigationEvents.ROUTE_DEVIATION]: handleRouteDeviation,

      [NavigationEvents.DESTINATION_REACHED]: () => {
        handleStopNavigation();
        Alert.alert('Arrived', 'You have reached your destination.');
      },
    });

    return unsubscribe;
  }, [handleRouteDeviation, handleStopNavigation]);

  // Nothing is torn down on unmount. Guidance runs natively and survives this
  // screen, and that is now the point: backing out to Home is not ending the
  // trip — the session keeps guiding and Home's floating map takes over
  // rendering it. The trip ends where it actually ends: arrival, the driver
  // stopping guidance, or proof-of-delivery (see runReveal above).

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

  /**
   * The floating navigate button: one meaning, "put me in the driving view".
   * Idle that means starting guidance; mid-trip it re-locks the follow camera
   * on the vehicle after the driver has panned the map away from it.
   */
  const handleNavigatePress = useCallback(() => {
    if (isNavigating) {
      HereNavigation.setCameraBehavior({mode: 'fixed'}).catch(() => {});
      return;
    }
    handleStartNavigation();
  }, [handleStartNavigation, isNavigating]);

  const closePanel = useCallback(() => setActivePanel(null), []);
  const goBack = useCallback(() => navigation?.goBack?.(), [navigation]);

  // Whole-trip figures while previewing; what is left of it while guiding.
  // navInfo only exists once the navigator has emitted its first ROUTE_PROGRESS,
  // which can lag seconds behind startNavigation (and never arrives at all while
  // the truck is stationary). Falling back to the route we just calculated keeps
  // real distance/ETA on screen through that gap instead of "Calculating route…".
  const tripSummary = useMemo(() => {
    if (isNavigating && navInfo) return navInfo;
    if (!activeRoute) return null;
    return buildTripInfo(
      activeRoute.distanceMeters,
      activeRoute.durationSeconds,
    );
  }, [activeRoute, isNavigating, navInfo]);

  /**
   * What the green next-turn card shows. Guidance-only: nothing while the trip
   * is merely being previewed, so the card appears when the driver taps
   * navigate and goes away again when guidance stops.
   *
   * While guidance runs the navigator feeds it; until its first MANEUVER event
   * arrives the calculated route's own maneuver list stands in, so the card is
   * populated from the moment it appears rather than starting blank.
   */
  const direction = useMemo(() => {
    if (!isNavigating) return null;

    if (nextManeuver) {
      return {maneuver: nextManeuver, meters: metersToNext};
    }

    const list = activeRoute?.maneuvers;
    if (!Array.isArray(list) || list.length === 0) return null;

    // The first entry is the depart leg — the turn worth showing is the one
    // after it, and that leg's length is how far there is to drive to reach it.
    const turnIndex = list.findIndex(m => m.action !== 'depart');
    const turn = turnIndex > 0 ? list[turnIndex] : list[0];
    const meters = list
      .slice(0, Math.max(turnIndex, 0))
      .reduce((sum, m) => sum + (Number.isFinite(m.length) ? m.length : 0), 0);

    return {maneuver: turn, meters: meters || turn.length};
  }, [activeRoute, isNavigating, metersToNext, nextManeuver]);

  // The line under the progress bar: "12 min · 18 km · ETA 5:38 PM". With the
  // trip card gone this is also the only place a routing failure can surface,
  // so an error takes the slot instead.
  const legSummary = tripSummary
    ? `${tripSummary.etaText} · ${tripSummary.distKm} km · ETA ${tripSummary.arrivalStr}`
    : 'Calculating route…';

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

      {/* ── Next turn ── */}
      <DirectionCard
        visible={Boolean(direction)}
        maneuver={direction?.maneuver}
        metersToNext={direction?.meters}
      />

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

      {/* ── Floating map buttons ── */}
      {/* Both sit behind the panels (low zIndex), so they stay put when one
          opens. GPS re-centres the map on the driver; navigate hands the map to
          the guidance view. */}
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
          <GpsIcon
            width={verticalScale(26)}
            height={verticalScale(26)}
            fill={colors.navy}
          />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.navFloatBtn,
          {bottom: styles.navFloatBtn.bottom + insets.bottom},
        ]}
        onPress={handleNavigatePress}
        disabled={routeLoading}
        activeOpacity={0.8}>
        {routeLoading ? (
          <ActivityIndicator size="small" color={colors.accentBlue} />
        ) : (
          // The glyph is square inside a 44×30 viewBox, so equal width/height
          // letterboxes it — it lands centred in the circle either way.
          <NavigationIcon width={verticalScale(32)} height={verticalScale(32)} />
        )}
      </TouchableOpacity>

      {/* Map look — day / night / satellite, plus the traffic layers. The map
          follows the clock on its own ('auto'); this is how the driver
          overrides it, and the choice carries to every other map. */}
      <MapStyleControl
        style={[
          styles.mapStyleButton,
          {bottom: styles.mapStyleButton.bottom + insets.bottom},
        ]}
      />

      {/* ── Verify this stop: Reached opens this directly ── */}
      <StopVerifyModal
        stage={milestone ? milestoneStage : null}
        desc={milestone?.otpDesc}
        doneTitle={milestone?.doneTitle}
        doneText={milestone?.doneText}
        onVerify={() => setMilestoneStage('verified')}
        onBack={() => setMilestoneStage('idle')}
        onDone={completeMilestone}
      />

      {/* ── Bottom trip progress ── */}
      <TripProgressBar
        progress={tripProgress}
        fromLabel={MILESTONES[milestoneIndex - 1]?.code ?? 'Current'}
        toLabel={milestone?.code ?? 'Done'}
        summary={routeError || legSummary}
        summaryIsError={Boolean(routeError)}
        withCheckbox={activePanel === 'bidding'}
        endLabel={milestone ? 'Reached' : 'End Trip'}
        onEndTrip={handleReachedPress}
      />

      {/* ── Proof-of-Delivery flow ── */}
      <PodModal
        visible={podOpen}
        onClose={() => setPodOpen(false)}
        onComplete={() => {
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