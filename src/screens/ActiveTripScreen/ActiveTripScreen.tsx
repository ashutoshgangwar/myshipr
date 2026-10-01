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
import ErrorModal from '../../component/ErrorModal/ErrorModal';
import useErrorModal from '../../hooks/useErrorModal';
import {colors} from '../../theme/colors';
import {IS_TABLET} from '../../theme/device';

import {
  destinationMarkerOptions,
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
  getDeliveryStopProofStatus,
  sendDeliveryStopOtp,
  updateShipmentProgress,
  verifyDeliveryStopOtp,
} from '../../config/driverApi';
import {
  endTripSession,
  getTripSession,
  startTripSession,
  updateTripSession,
} from '../../services/TripSessionService';
import {useTripProgress, verifyCopy} from '../../services/tripProgress';
import {useMaskedCall} from '../../services/maskedCall';
import {
  startNavigationLocationFeed,
  stopNavigationLocationFeed,
} from '../../services/NavigationLocationFeed';
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
import StepConfirmCard from './components/StepConfirmCard';
import PodModal from './components/PodModal';
import type {AxiosError} from 'axios';
import type {ApiErrorBody} from '../../types/api';
import type {RootStackScreenProps} from '../../types/navigation';
import type {Coordinates, ErrorLike, MapLocation} from '../../types/common';
import type {HereMapViewHandle, HereRoute} from '../../types/here';
import type {TruckDetails} from '../../types/navigation';
import type {TripInfo} from '../../utils/here/mapHelpers';
import type {ManeuverStep} from '../HereMapScreen/utils/NextManeuverHud';
import type {TripStep} from '../../services/tripProgress';
import type {CallPhoneType, CallTarget} from '../../types/call';
import type {DeliveryProofStatus} from '../../types/shipment';
import {city} from '../../utils/address';

/** Where the driver is in clearing the current stop. */
type MilestoneStage = 'idle' | 'otp' | 'verified';

/** A route already calculated for this leg, kept to avoid re-requesting it. */
interface PreviewedRoute {
  route: HereRoute;
  origin: MapLocation;
  destination: MapLocation;
  /** Epoch-ms it was calculated, so a stale preview is not reused. */
  at: number;
}

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
// Starting guidance used to accept a fix up to 45 s old, on the reasoning that
// the navigator re-acquires the device feed straight away and racing GPS again
// only adds seconds to the tap. That reasoning holds only if the fix is a
// measurement — and the location service also serves remembered ones, from the
// fast path and from the everything-failed path, which is a place the truck
// has been rather than where it is. Guidance now asks for a live fix
// (`requireLive`), and pays the couple of seconds.

/** Rough great-circle metres — only ever compared against a small radius. */
const metersBetween = (
  a: Coordinates | null | undefined,
  b: Coordinates | null | undefined,
): number => {
  if (!a || !b) return Infinity;
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat = toRad((a.latitude + b.latitude) / 2);
  const x = dLng * Math.cos(lat);
  return Math.sqrt(dLat * dLat + x * x) * 6371000;
};

/**
 * Where the drawn route begins: the first vertex of the polyline the map
 * paints. It is the same `route.geometry.vertices[0]` the native side seeds
 * the navigator's marker with, so logging the two together says whether the
 * marker is standing where the line starts or somewhere else entirely.
 */
const routeStartPoint = (
  hereRoute: HereRoute | null | undefined,
): Coordinates | null => {
  const first = hereRoute?.polyline?.[0];
  if (!first) return null;
  const latitude = Number(first.lat);
  const longitude = Number(first.lng);
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    ? {latitude, longitude}
    : null;
};

/** One coordinate, rounded to the six decimals a lat/lng is worth reading at. */
const logPoint = (point: Coordinates | null | undefined) =>
  point
    ? {lat: Number(point.latitude.toFixed(6)), lng: Number(point.longitude.toFixed(6))}
    : null;

/** Metres between two points, rounded, or null when either is missing. */
const gapMeters = (
  a: Coordinates | null | undefined,
  b: Coordinates | null | undefined,
): number | null => {
  const metres = metersBetween(a, b);
  return Number.isFinite(metres) ? Math.round(metres) : null;
};

/**
 * Which step of the POD sheet a drop still needs, from the proofs the backend
 * already holds for it.
 *
 * The two photos are filed one after the other, so the first one missing is
 * where the sheet opens: nothing filed starts at the receipt, a filed receipt
 * skips to the goods shot, and both filed leaves only the receiver's code.
 *
 * A goods photo filed without a receipt is not a state the flow can produce,
 * and the receipt is the one the paperwork actually turns on — so it is read
 * as a missing receipt and the sheet opens at step 1.
 */
const podStartStepFor = (status: DeliveryProofStatus | null | undefined) => {
  if (!status?.proofReceipt) return 1;
  return status.proofDeliveredGoods ? 3 : 2;
};

export default function ActiveTripScreen({navigation, route}: RootStackScreenProps<'ActiveTripScreen'>) {
  // The app's one dialog — see `hooks/useErrorModal`.
  const {modalProps, showError, showSuccess, showWarning} = useErrorModal();
  const insets = useSafeAreaInsets();

  // ── The trip's stops ────────────────────────────────────────────────────
  // Handed over by whoever opened the map (Home reads them off
  // `GET /drivers/shipments/{tripId}`), in `tripSequence` order — 1, 2, 3 … —
  // which is the order they are driven. They are the only source of
  // coordinates: the progress endpoint names the same stops but sends none.
  const tripStops = useMemo(() => {
    const stops = route?.params?.stops;
    return Array.isArray(stops) ? [...stops].sort(
      (a, b) => (a?.tripSequence ?? 0) - (b?.tripSequence ?? 0),
    ) : [];
  }, [route?.params?.stops]);

  // The progress endpoint is keyed on the shipment; on a single-shipment trip
  // that is the same id as the trip's own.
  const shipmentId =
    route?.params?.shipmentId ||
    tripStops.find(stop => stop.shipmentId)?.shipmentId ||
    route?.params?.tripId ||
    null;

  /**
   * How far through the trip the driver is. Fetched as this screen mounts —
   * i.e. the moment the map opens — and re-read whenever a stop is cleared.
   */
  const {
    progress: tripProgressPayload,
    steps,
    preTrip,
    activeStep,
    lastDoneStep,
    loading: progressLoading,
    refresh: refreshProgress,
    markStopVerified,
    markPreTripDone,

  } = useTripProgress(shipmentId, tripStops);

  const awaitingProgress =
    tripStops.length > 0 && !tripProgressPayload && progressLoading;

  /** Every stop cleared. The drive is over; the POD flow takes it from here. */
  const allStopsDone = steps.length > 0 && !activeStep;


  const activeStopTarget = useMemo(() => {
    if (!activeStep) return null;
    return (
      tripStops.find(stop => stop.tripSequence === activeStep.tripSequence) ??
      null
    );
  }, [activeStep, tripStops]);

  const trip = useMemo(() => {
    const params = route?.params ?? {};
    const source = normalizeLocation(params.sourceLocation);
    const paramDestination = normalizeLocation(params.destinationLocation);
    const stopDestination = activeStopTarget
      ? normalizeLocation(activeStopTarget.location)
      : null;
    const destination = stopDestination ?? paramDestination;

    return {
      source,
      destination,
      destinationText:
        (stopDestination ? activeStopTarget?.address : null) ||
        params.destinationText ||
        destination?.description ||
        'Destination',
      truckDetails: params.truckDetails ?? null,
    };
  }, [activeStopTarget, route?.params]);

  const mapRef = useRef<HereMapViewHandle | null>(null);
  const [center, setCenter] = useState(
    trip.source
      ? {lat: trip.source.latitude, lng: trip.source.longitude}
      : DEFAULT_CENTER,
  );
  const [mapReady, setMapReady] = useState(false);
  const resumedSession = useRef(
    (() => {
      const live = getTripSession();
      return live?.navigating ? live : null;
    })(),
  ).current;

  // Cleared by the re-attach effect once it has taken the rendering back.
  const pendingAttachRef = useRef(Boolean(resumedSession));

  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [panelFullscreen, setPanelFullscreen] = useState(false);
  const [podOpen, setPodOpen] = useState(false);
  const [podStep, setPodStep] = useState<TripStep | null>(null);
  const [podStartStep, setPodStartStep] = useState(1);
  const [podChecking, setPodChecking] = useState(false);
  const podCheckingRef = useRef(false);

  const [milestoneStage, setMilestoneStage] = useState<MilestoneStage>('idle');
  // The verify-otp call: in flight, and why the last attempt was turned down.
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [resendFailed, setResendFailed] = useState(false);
  const [confirmingPreTrip, setConfirmingPreTrip] = useState(false);
  const [preTripError, setPreTripError] = useState<string | null>(null);
  const verify = useMemo(() => verifyCopy(activeStep), [activeStep]);


  const stopTargetFor = useCallback(
    (step: TripStep | null) => {
      if (!step) return null;
      const stopShipmentId =
        step.shipmentId ?? activeStopTarget?.shipmentId ?? shipmentId;
      const stopSequence =
        step.sequence ?? activeStopTarget?.sequence ?? step.tripSequence;
      if (!stopShipmentId || !Number.isFinite(Number(stopSequence))) return null;
      return {shipmentId: stopShipmentId, sequence: Number(stopSequence)};
    },
    [activeStopTarget, shipmentId],
  );

  /** The stop being cleared, for the send-otp and verify-otp calls. */
  const otpTarget = useMemo(
    () => stopTargetFor(activeStep),
    [activeStep, stopTargetFor],
  );

  /**
   * The same two path parts for the drop the POD sheet is being run at — what
   * its receipt is filed against. Null when the sheet was opened from "End
   * Trip" with every stop already cleared.
   */
  const podTarget = useMemo(
    () => stopTargetFor(podStep),
    [podStep, stopTargetFor],
  );

  /**
   * "Resend OTP" on the verify sheet — asks the backend to issue this stop a
   * fresh code with
   * `POST /drivers/shipments/{shipmentId}/delivery/stops/{sequence}/send-otp`.
   *
   * Nothing about the trip moves on the back of this: the stop still clears
   * only when `verify-otp` accepts a code, so there is no progress to re-read.
   * All the driver gets is a line saying whether a new code went out — most
   * often the failure is the backend's own resend cooldown, and its message is
   * the useful thing to show.
   */
  const handleResendOtp = useCallback(async () => {
    if (!otpTarget) {
      setResendFailed(true);
      setResendNotice('This stop is missing its shipment reference.');
      return;
    }

    setResending(true);
    setResendNotice(null);
    setResendFailed(false);
    // The code that was on screen is the one being replaced, so the reason the
    // last one was turned down no longer describes anything.
    setVerifyError(null);
    try {
      const result = await sendDeliveryStopOtp(otpTarget);
      setResendFailed(false);
      setResendNotice(
        result?.message ||
          (result?.sentTo ? `A new code was sent to ${result.sentTo}.` : null) ||
          'A new code has been sent.',
      );
    } catch (e) {
      const err = e as AxiosError<ApiErrorBody> & ErrorLike;
      setResendFailed(true);
      setResendNotice(
        err?.response?.data?.message ||
          err?.message ||
          'Could not send a new code. Please try again.',
      );
    } finally {
      setResending(false);
    }
  }, [otpTarget]);

  const handleVerifyOtp = useCallback(
    async (code: string) => {
      if (!activeStep) return;
      if (!otpTarget) {
        setVerifyError('This stop is missing its shipment reference.');
        return;
      }

      setVerifying(true);
      setVerifyError(null);
      try {
        const result = await verifyDeliveryStopOtp({...otpTarget, otp: code});
        if (result?.verified === false) {
          setVerifyError(
            result?.message || 'That code could not be verified. Please try again.',
          );
          return;
        }
        setMilestoneStage('verified');
      } catch (e) {
        const err = e as AxiosError<ApiErrorBody> & ErrorLike;
        setVerifyError(
          err?.response?.data?.message ||
            err?.message ||
            'That code could not be verified. Please try again.',
        );
      } finally {
        setVerifying(false);
      }
    },
    [activeStep, otpTarget],
  );

  const resetSheetNotices = useCallback(() => {
    setVerifyError(null);
    setResendNotice(null);
    setResendFailed(false);
  }, []);

  const progressTripId =
    tripProgressPayload?.tripId || route?.params?.tripId || shipmentId;

  const handleConfirmPreTrip = useCallback(async () => {
    if (!progressTripId) {
      setPreTripError('This trip is missing its reference.');
      return;
    }

    setConfirmingPreTrip(true);
    setPreTripError(null);
    try {
      await updateShipmentProgress({
        tripId: progressTripId,
        status: 'PRE_TRIP_INSPECTION',
      });
      markPreTripDone();
      refreshProgress();
    } catch (e) {
      const err = e as AxiosError<ApiErrorBody> & ErrorLike;
      setPreTripError(
        err?.response?.data?.message ||
          err?.message ||
          'Could not confirm the inspection. Please try again.',
      );
    } finally {
      setConfirmingPreTrip(false);
    }
  }, [markPreTripDone, progressTripId, refreshProgress]);


  const openPod = useCallback(
    async (step: TripStep | null) => {
      if (podCheckingRef.current) return;

      const target = stopTargetFor(step);
      let startStep = 1;
      if (target) {
        podCheckingRef.current = true;
        setPodChecking(true);
        try {
          startStep = podStartStepFor(await getDeliveryStopProofStatus(target));
        } catch (e) {
          const err = e as AxiosError<ApiErrorBody> & ErrorLike;
          console.log(
            '[ActiveTrip] proof status failed — opening POD at step 1',
            err?.response?.data ?? err?.message,
          );
        } finally {
          podCheckingRef.current = false;
          setPodChecking(false);
        }
      }

      // The sheet takes the screen, so anything else on it steps aside first.
      setActivePanel(null);
      setMilestoneStage('idle');
      setPodStartStep(startStep);
      setPodStep(step);
      setPodOpen(true);
    },
    [stopTargetFor],
  );

  /** What the POD sheet's info card names the load. */
  const podLoadId = route?.params?.awb || undefined;

  const podLeg = useMemo(() => {
    const target = podStep ?? activeStep;
    const priorStop = target
      ? steps.reduce<TripStep | null>(
          (best, step) =>
            step.tripSequence < target.tripSequence &&
            (!best || step.tripSequence > best.tripSequence)
              ? step
              : best,
          null,
        )
      : null;

    const from =
      city(priorStop?.address) || city(route?.params?.sourceText);
    const to = city(
      podStep?.address || activeStopTarget?.address || trip.destinationText,
    );
    return {from: from || undefined, to: to || undefined};
  }, [
    activeStep,
    activeStopTarget?.address,
    podStep,
    route?.params?.sourceText,
    steps,
    trip.destinationText,
  ]);


  const handleReachedPress = useCallback(() => {
    if (!activeStep) {
      openPod(null);
      return;
    }
    if (activeStep.kind === 'drop') {
      openPod(activeStep);
      return;
    }
    resetSheetNotices();
    setMilestoneStage('otp');
  }, [activeStep, openPod, resetSheetNotices]);


  const handleStepPress = useCallback(
    (step: TripStep) => {
      if (!step.clickable || step.tripSequence !== activeStep?.tripSequence) {
        return;
      }
      if (step.kind === 'drop') {
        openPod(step);
        return;
      }
      setActivePanel(null);
      resetSheetNotices();
      setMilestoneStage('otp');
    },
    [activeStep, openPod, resetSheetNotices],
  );

  const [leg, setLeg] = useState<{
    total: number | null;
    remaining: number | null;
  }>({
    total: (resumedSession?.totalDistanceMeters as number | undefined) ?? null,
    remaining: null,
  });
  const legRef = useRef(leg);
  useEffect(() => {
    legRef.current = leg;
  }, [leg]);

  const tripProgress = useMemo(() => {
    const {total, remaining} = leg;
    if (total == null || !Number.isFinite(total) || total <= 0) return 0;
    if (remaining == null || !Number.isFinite(remaining)) return 0;
    return Math.max(0, Math.min(1, 1 - remaining / total));
  }, [leg]);

  // ── Trip route + guidance ───────────────────────────────────────────────
  // The route currently previewed or being navigated (see HereRouting).
  const [activeRoute, setActiveRoute] = useState<HereRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(
    Boolean(resumedSession),
  );

  // Live guidance state — every field below is fed by a navigator event.
  const [navInfo, setNavInfo] = useState<TripInfo | null>(null);
  const [nextManeuver, setNextManeuver] = useState<ManeuverStep | null>(null);
  const [metersToNext, setMetersToNext] = useState<number | null>(null);

  // Mirror refs, so event callbacks always see current values without
  // re-subscribing on every render.
  const isNavigatingRef = useRef(false);
  // The stop being driven to, for the navigator's callbacks — they are
  // subscribed once and must not be re-subscribed every time it advances.
  const activeStepRef = useRef<TripStep | null>(null);
  const destinationRef = useRef<MapLocation | null>(null);
  const truckDetailsRef = useRef<TruckDetails | null>(null);
  const lastRerouteAtRef = useRef(0);
  const rerouteInFlightRef = useRef(false);
  const navStartFixRef = useRef<MapLocation | null>(null);
  const routeStartRef = useRef<Coordinates | null>(null);
  /** How fresh and how accurate the last GPS fix resolvePickup returned was. */
  const lastFixMetaRef = useRef<{
    accuracy: number | null;
    ageMs: number | null;
    preferCacheMs: number | string;
  } | null>(null);
  const lastLocationLogAtRef = useRef(0);
  useEffect(() => {
    if (resumedSession) startNavigationLocationFeed();
  }, [resumedSession]);

  useEffect(() => {
    isNavigatingRef.current = isNavigating;
  }, [isNavigating]);
  useEffect(() => {
    activeStepRef.current = activeStep;
  }, [activeStep]);
  useEffect(() => {
    destinationRef.current = trip.destination;
    truckDetailsRef.current = trip.truckDetails;
  }, [trip]);
  useEffect(() => {
    if (!getTripSession()) {
      startTripSession({
        destinationLocation: trip.destination,
        destinationText: trip.destinationText,
        sourceLocation: trip.source,
        truckDetails: trip.truckDetails,
      });
      return;
    }
    updateTripSession({
      destinationLocation: trip.destination,
      destinationText: trip.destinationText,
    });
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
    HereNavigation.stopNavigation().catch(() => {});
    stopNavigationLocationFeed();
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
    } catch {
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

  const resolvePickup = useCallback(
    async ({
      preferCacheMs,
      requireLive = false,
    }: {preferCacheMs?: number; requireLive?: boolean} = {}) => {
      if (trip.source && !tripStops.length) return trip.source;
      try {
        const fix = await getCurrentLocation({
          detectMock: true,
          ...(Number.isFinite(preferCacheMs) ? {preferCacheMs} : null),
          ...(requireLive ? {preferCacheMs: 0, fallbackToCache: false} : null),
        });
        const meta = {
          accuracy: fix?.accuracy ?? null,
          ageMs: Number.isFinite(fix?.timestamp)
            ? Date.now() - fix.timestamp
            : null,
          preferCacheMs: preferCacheMs ?? 'default',
        };
        // Kept so the nav-start line can report how trustworthy the fix the
        // route was built from actually was, without cross-referencing logs.
        lastFixMetaRef.current = meta;
        console.log(
          '[ActiveTripScreen] gps fix lat/lng:',
          fix?.latitude,
          fix?.longitude,
          meta,
        );
        return normalizeLocation(fix);
      } catch {
        return null;
      }
    },
    [trip.source, tripStops.length],
  );

  const previewRef = useRef<PreviewedRoute | null>(null);

  /** The previewed route, if it still describes the drive about to start. */
  const takePreviewRoute = useCallback(
    (origin?: Coordinates | null, destination?: Coordinates | null) => {
    const cached = previewRef.current;
    if (!cached?.route || !origin || !destination) return null;
    if (Date.now() - cached.at > PREVIEW_REUSE_MAX_AGE_MS) return null;
    if (metersBetween(cached.destination, destination) > 1) return null;
    if (metersBetween(cached.origin, origin) > PREVIEW_REUSE_RADIUS_M) {
      return null;
    }
    return cached.route;
  }, []);

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
      const previewStart = routeStartPoint(hereRoute);
      routeStartRef.current = previewStart;
      console.log('[ActiveTripScreen] PREVIEW marker vs polyline start', {
        marker: logPoint(origin),
        markerFrom: trip.source ? 'trip source' : 'live gps',
        // The vehicle profile the leg was priced for — kg and cm, converted
        // from the trip payload's equipmentDetail. Null means the route is a
        // generic truck's, so its restrictions and ETA are not this load's.
        truckSpec: trip.truckDetails,
        polylineStart: logPoint(previewStart),
        markerToPolylineStartM: gapMeters(origin, previewStart),
        polylineVertices: hereRoute?.polyline?.length ?? 0,
      });
      if (trip.source) {
        await mapRef.current?.addMarker({
          latitude: origin.latitude,
          longitude: origin.longitude,
          color: colors.success,
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
        color: colors.accentBlue,
        width: NAVIGATION_ROUTE_WIDTH,
      });
      await fitCameraToRoute(mapRef, hereRoute.polyline);
    } catch (e) {
      setRouteError((e as ErrorLike)?.message || 'Unable to build the route');
    } finally {
      setRouteLoading(false);
    }
  }, [resolvePickup, trip]);

  // Draw on arrival, and again after guidance ends — stopping hands the map
  // back with the navigator's layers removed. Also after each stop is cleared:
  // `trip.destination` has moved on to the next one by then, so this is what
  // draws the next leg.
  useEffect(() => {
    if (!mapReady || isNavigating) return;
    // Nothing to preview: either which stop to drive to is not settled yet, or
    // there are no stops left to drive to.
    if (awaitingProgress || allStopsDone) return;
    drawTripPreview();
  }, [
    allStopsDone,
    awaitingProgress,
    drawTripPreview,
    isNavigating,
    mapReady,
  ]);

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
      .then((rendering: unknown) => setIsNavigating(Boolean(rendering)))
      .catch(() => setIsNavigating(false));
  }, [mapReady]);

  // ── Navigation ───────────────────────────────────────────────────────────

  const handleStopNavigation = useCallback(async () => {
    // Before the SDK call, so no fix can arrive for a navigator that is on its
    // way out.
    stopNavigationLocationFeed();
    try {
      await HereNavigation.stopNavigation();
    } catch (e) {
      console.warn('[ActiveTripScreen] stopNavigation failed:', (e as ErrorLike)?.message);
    }
    setIsNavigating(false);
    setNavInfo(null);
    setNextManeuver(null);
    setMetersToNext(null);
    // The trip is still open — the driver has stopped guidance, not arrived —
    // so the session stays, minus the guidance that is no longer running.
    updateTripSession({navigating: false, routeId: null});
  }, []);

  /**
   * The stop's OTP has been accepted: mark it done and move the trip on.
   *
   * The stop is banked locally straight away (a pickup as procured, a drop as
   * completed) so the strip and the destination follow immediately, and the
   * progress endpoint is re-read behind that in case the backend has more to
   * say. Guidance to a stop that has just been cleared is no longer the drive
   * the driver is on, so it stops here — which also hands the map back, and the
   * preview effect draws the leg to the next stop.
   */
  const completeStop = useCallback(() => {
    const cleared = activeStep;
    setMilestoneStage('idle');
    setVerifyError(null);
    if (!cleared) return;

    markStopVerified(cleared.tripSequence);
    if (isNavigatingRef.current) handleStopNavigation();
    refreshProgress();
  }, [activeStep, handleStopNavigation, markStopVerified, refreshProgress]);

  /**
   * The proof-of-delivery flow finished on its summary step.
   *
   * The drop it was run for is banked as delivered here and nothing is sent:
   * no endpoint is called anywhere in this flow yet, so the delivery lives on
   * the device — the same local banking a verified stop gets, minus the
   * refetch, which would only re-read a backend that has not been told.
   *
   * What happens next is whether that was the last of the run: with stops
   * still to work the sheet simply closes and the map previews the next leg,
   * and with none left the trip is over and the reveal takes the driver to the
   * completed screen. Opened with no stop at all — "End Trip", every stop
   * already cleared — it is always the latter.
   */
  const handlePodComplete = useCallback(() => {
    const cleared = podStep;
    setPodStep(null);

    if (cleared) {
      markStopVerified(cleared.tripSequence);
      // Guidance to a stop that has just been delivered is no longer the drive
      // the driver is on.
      if (isNavigatingRef.current) handleStopNavigation();
    }

    const remaining = steps.filter(
      step => step.state !== 'done' && step.tripSequence !== cleared?.tripSequence,
    ).length;
    // The sheet is still animating itself away; let it leave before the
    // reveal wipes the screen.
    if (!remaining) setTimeout(runReveal, 320);
  }, [handleStopNavigation, markStopVerified, podStep, runReveal, steps]);

  const handleStartNavigation = useCallback(async () => {
    if (isNavigating) {
      handleStopNavigation();
      return;
    }

    const destination = trip.destination;
    if (!destination) {
      showWarning('Navigation', 'This trip has no destination yet.');
      return;
    }

    setRouteLoading(true);
    try {
      const from = await resolvePickup({requireLive: true});
      navStartFixRef.current = from;
      lastLocationLogAtRef.current = 0;
      if (!from) {
        showWarning(
          'Navigation',
          'Current GPS location is not available yet. Turn location on and try again.',
        );
        return;
      }
      const cleared = Promise.all([
        mapRef.current?.clearMarkers(),
        mapRef.current?.clearRoute(),
        mapRef.current?.hideCurrentLocation(),
      ]).catch(() => {});

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

      const navStart = routeStartPoint(navRoute);
      routeStartRef.current = navStart;
      console.log('[ActiveTripScreen] NAV START marker vs polyline start', {
        gpsFix: logPoint(from),
        polylineStart: logPoint(navStart),
        gpsFixToPolylineStartM: gapMeters(from, navStart),
        routeId: navRoute.routeId,
        truckSpec: trip.truckDetails,
        reusedPreviewRoute: Boolean(takePreviewRoute(from, destination)),
        polylineVertices: navRoute?.polyline?.length ?? 0,
        // How much the fix the route was built from is worth. A large ageMs
        // means the leg starts from where the truck was, not where it is.
        gpsFix_ageMs: lastFixMetaRef.current?.ageMs ?? null,
        gpsFix_accuracyM: lastFixMetaRef.current?.accuracy ?? null,
      });

      // Guidance routes from the driver's real position, so this is the
      // distance the progress bar measures against for the rest of the trip.
      setLeg({
        total: navRoute.distanceMeters,
        remaining: navRoute.distanceMeters,
      });

      await cleared;

      await HereNavigation.startNavigation(navRoute.routeId, {
        simulate: false,
        locationSource: 'app',
        voiceGuidance: true,
        speak: true,
        mapViewTag: mapRef.current?.getTag() ?? undefined,
        camera: {
          mode: 'fixed',
          distanceMeters: CAMERA_DISTANCE_METERS,
        },
      });
      mapRef.current
        ?.addMarker(
          destinationMarkerOptions({
            latitude: destination.latitude,
            longitude: destination.longitude,
          }),
        )
        ?.catch(() => {});
      startNavigationLocationFeed();

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
      showError(e as ErrorLike, {
        title: 'Navigation',
        message: (e as ErrorLike)?.message || 'Unable to start navigation',
      });
    } finally {
      setRouteLoading(false);
    }
  }, [
    handleStopNavigation,
    isNavigating,
    resolvePickup,
    showError,
    showWarning,
    takePreviewRoute,
    trip,
  ]);

  /**
   * Recalculates from the driver's actual position and hands the fresh route to
   * the running navigator. Throttled, and skipped while one is already in
   * flight, so a sustained detour cannot queue a burst of routing requests.
   */
  const handleRouteDeviation = useCallback(
    async (event: {
      deviationDistanceMeters?: number;
      /** The fix that produced the deviation, used as the reroute origin. */
      currentLocation?: {latitude?: number; longitude?: number};
    }) => {
      const off = event?.deviationDistanceMeters;
      if (typeof off !== 'number' || !Number.isFinite(off) || off < OFF_ROUTE_THRESHOLD)
        return;
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
        console.warn('[ActiveTripScreen] reroute failed:', (e as ErrorLike)?.message);
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
        const first = lastLocationLogAtRef.current === 0;
        lastLocationLogAtRef.current = now;
        // The marker on screen stands wherever this event says: during
        // guidance the navigator draws the vehicle itself, off its own
        // map-matched position, and our indicator is hidden.
        // The raw fix HERE Positioning produced, before the SDK snapped it to
        // a road. Splitting it from the matched one is what says whether a
        // misplaced marker is bad positioning or map matching locking onto the
        // wrong stretch of road.
        const raw =
          Number.isFinite(loc?.rawLatitude) && Number.isFinite(loc?.rawLongitude)
            ? {latitude: loc.rawLatitude, longitude: loc.rawLongitude}
            : null;

        console.log('[ActiveTripScreen] MARKER (navigator) vs polyline start', {
          first,
          marker: logPoint(loc),
          polylineStart: logPoint(routeStartRef.current),
          // The number that answers the question: zero-ish means the marker is
          // standing on the head of the drawn line, which is what it should do
          // until the truck actually moves.
          markerToPolylineStartM: gapMeters(loc, routeStartRef.current),
          // How far HERE's positioning has landed from the JS fix guidance was
          // started with — the two use different providers.
          markerToGpsFixM: gapMeters(loc, navStartFixRef.current),
          isMapMatched: loc?.isMapMatched,
          accuracy: loc?.horizontalAccuracyMeters,
          speed: loc?.speed,

          // Raw HERE fix vs the same two references. If rawToGpsFixM is small
          // while markerToGpsFixM is large, the positioning agreed with us and
          // map matching moved the marker. If both are large, HERE Positioning
          // itself is reporting a different place than the device's own GPS.
          raw: logPoint(raw),
          rawToMatchedM: gapMeters(raw, loc),
          rawToGpsFixM: gapMeters(raw, navStartFixRef.current),
          rawAccuracyM: loc?.rawAccuracyMeters,
          rawAgeMs: Number.isFinite(loc?.rawTimestamp)
            ? Math.round(Date.now() - loc.rawTimestamp)
            : null,
        });
      },

      [NavigationEvents.MANEUVER]: next => setNextManeuver(next),

      [NavigationEvents.ROUTE_DEVIATION]: handleRouteDeviation,

      // The destination guidance was following is one stop, not the whole
      // trip. Arriving at it is exactly when that stop has to be verified, so
      // the OTP sheet opens on its own rather than making the driver find the
      // Reached button. With every stop already cleared there is nothing to
      // verify, and the plain arrival notice stands.
      [NavigationEvents.DESTINATION_REACHED]: () => {
        handleStopNavigation();
        if (activeStepRef.current) {
          setVerifyError(null);
          setMilestoneStage('otp');
          return;
        }
        showSuccess('You have reached your destination.', {title: 'Arrived'});
      },
    });

    return unsubscribe;
  }, [handleRouteDeviation, handleStopNavigation, showSuccess]);

  const handleToolSelect = useCallback((id: string) => {
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

  const handleNavigatePress = useCallback(() => {
    if (isNavigating) {
      HereNavigation.setCameraBehavior({mode: 'fixed'}).catch(() => {});
      return;
    }
    handleStartNavigation();
  }, [handleStartNavigation, isNavigating]);

  const closePanel = useCallback(() => setActivePanel(null), []);


  const reportCallFailure = useCallback(
    (message: string) => {
      showError(message, {title: 'Call'});
    },
    [showError],
  );

  const {connecting: connectingContactId, placeCall} = useMaskedCall(
    shipmentId,
    reportCallFailure,
  );


  const handleCallContact = useCallback(
    async (target: CallTarget, phoneType: CallPhoneType) => {
      if (await placeCall(target, phoneType)) setActivePanel(null);
    },
    [placeCall],
  );

  const goBack = useCallback(() => navigation?.goBack?.(), [navigation]);

  const tripSummary = useMemo(() => {
    if (isNavigating && navInfo) return navInfo;
    if (!activeRoute) return null;
    return buildTripInfo(
      activeRoute.distanceMeters,
      activeRoute.durationSeconds,
    );
  }, [activeRoute, isNavigating, navInfo]);

  const direction = useMemo(() => {
    if (!isNavigating) return null;

    if (nextManeuver) {
      return {maneuver: nextManeuver, meters: metersToNext};
    }

    const list = activeRoute?.maneuvers as ManeuverStep[] | undefined;
    if (!Array.isArray(list) || list.length === 0) return null;
    const turnIndex = list.findIndex((m: ManeuverStep) => m.action !== 'depart');
    const turn = turnIndex > 0 ? list[turnIndex] : list[0];
    const meters = list
      .slice(0, Math.max(turnIndex, 0))
      .reduce(
        (sum: number, m: ManeuverStep) =>
          sum + (typeof m.length === 'number' && Number.isFinite(m.length) ? m.length : 0),
        0,
      );

    return {maneuver: turn, meters: meters || turn.length};
  }, [activeRoute, isNavigating, metersToNext, nextManeuver]);

  const legSummary = tripSummary
    ? `${tripSummary.etaText} · ${tripSummary.distMiles} mi · ETA ${tripSummary.arrivalStr}`
    : 'Calculating route…';

  return (

    <View style={styles.container}>
      <StatusBar
        barStyle={panelFullscreen ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />

      <HereMapView
        ref={mapRef}
        style={styles.map}
        centerLat={center.lat}
        centerLng={center.lng}
        zoomLevel={13}
        onMapReady={() => setMapReady(true)}
        onMapError={detail => setRouteError(detail.message ?? null)}
      />

      {/* ── Top bar ── */}
      <TripTopBar
        onBack={goBack}
        onSelectStatus={() => {}}
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
        <HoursOfServicePanel
          steps={steps}
          preTrip={preTrip}
          loading={progressLoading}
          awb={route?.params?.awb}
          onStepPress={handleStepPress}
          onClose={closePanel}
          onExpandedChange={setPanelFullscreen}
        />
      )}
      {activePanel === 'call' && (
        <CallPanel
          shipmentId={shipmentId}
          connectingId={connectingContactId}
          onClose={closePanel}
          onCall={handleCallContact}
        />
      )}


      <TouchableOpacity
        style={[
          styles.gpsButton,
          {bottom: styles.gpsButton.bottom + insets.bottom},
        ]}
        onPress={() => showMyLocation({animate: true})}
        disabled={locating}
        activeOpacity={0.8}>
        {locating ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <GpsIcon
            width={verticalScale(26)}
            height={verticalScale(26)}
            fill={colors.primary}
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
          // Tablets get the large spinner — the small one reads as a speck at
          // the button size this screen uses there.
          <ActivityIndicator
            size={IS_TABLET ? 'large' : 'small'}
            color={colors.accentBlue}
          />
        ) : (
          // The glyph is square inside a 44×30 viewBox, so equal width/height
          // letterboxes it — it lands centred in the circle either way.
          <NavigationIcon width={verticalScale(32)} height={verticalScale(32)} />
        )}
      </TouchableOpacity>

      <MapStyleControl
        style={[
          styles.mapStyleButton,
          {bottom: styles.mapStyleButton.bottom + insets.bottom},
        ]}
      />

      <StepConfirmCard
        visible={
          !preTrip.done &&
          Boolean(tripProgressPayload) &&
          milestoneStage === 'idle' &&
          !panelFullscreen
        }
        title="Pre Trip Inspection"
        confirming={confirmingPreTrip}
        error={preTripError}
        onConfirm={handleConfirmPreTrip}
      />

      {/* ── Verify this stop: Reached, or the stop's own chip, opens this ── */}
      <StopVerifyModal
        stage={activeStep ? milestoneStage : null}
        desc={verify?.desc}
        doneTitle={verify?.doneTitle}
        doneText={verify?.doneText}
        onVerify={handleVerifyOtp}
        verifying={verifying}
        error={verifyError}
        onCodeChange={() => setVerifyError(null)}
        onResend={handleResendOtp}
        resending={resending}
        resendNotice={resendNotice}
        resendFailed={resendFailed}
        onBack={() => {
          resetSheetNotices();
          setMilestoneStage('idle');
        }}
        onDone={completeStop}
      />

      {/* ── Bottom trip progress ── */}
      <TripProgressBar
        progress={tripProgress}
        fromLabel={lastDoneStep?.code ?? 'Current'}
        toLabel={activeStep?.code ?? 'Done'}
        summary={routeError || legSummary}
        summaryIsError={Boolean(routeError)}
        withCheckbox={activePanel === 'bidding'}
        endLabel={
          podChecking ? 'Checking…' : activeStep ? 'Reached' : 'End Trip'
        }
        onEndTrip={handleReachedPress}
      />

      {/* ── Proof-of-Delivery flow ── */}
      <PodModal
        visible={podOpen}
        loadId={podLoadId}
        fromLocation={podLeg.from}
        toLocation={podLeg.to}
        stopTarget={podTarget}
        initialStep={podStartStep}
        onClose={() => {
          setPodOpen(false);
          setPodStep(null);
        }}
        onComplete={handlePodComplete}
      />

      {/* ── Circular reveal transition ── */}
      {revealing && (
        <Animated.View
          pointerEvents="none"
          style={[styles.revealCircle, {transform: [{scale: revealScale}]}]}
        />
      )}

      <ErrorModal {...modalProps} />
    </View>
  );
}
