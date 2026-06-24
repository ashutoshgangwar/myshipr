import React, {useEffect, useRef, useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  MapView,
  Camera,
  UserLocation,
  setAccessToken,
} from '@maplibre/maplibre-react-native';
import Radar from 'react-native-radar';
import {RADAR_PUBLISHABLE_KEY} from '@env';

import ScreenHeader from '../../component/ScreenHeader/ScreenHeader';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import {moderateScale, verticalScale} from 'react-native-size-matters';
import {
  getCurrentLocation,
  watchCurrentLocation,
  clearWatchLocation,
} from '../../services/LocationService';

import {
  decodePolyline,
  haversineMeters,
  extractSteps,
  bearing,
  smoothAngle,
  snapToRoute,
  ADVANCE_THRESHOLD_M,
  ARRIVE_THRESHOLD_M,
  OFF_ROUTE_THRESHOLD_M,
  OFF_ROUTE_FIXES,
  REROUTE_COOLDOWN_MS,
} from './helpers/radarNav';
import SearchPanel from './components/SearchPanel';
import NavBanner from './components/NavBanner';
import ArrivedBanner from './components/ArrivedBanner';
import RouteLayers from './components/RouteLayers';
import RouteCard from './components/RouteCard';
import NavControls from './components/NavControls';

setAccessToken(null);

// console.log('RADAR_PUBLISHABLE_KEY =', RADAR_PUBLISHABLE_KEY);
const KEY_OK =
  typeof RADAR_PUBLISHABLE_KEY === 'string' &&
  RADAR_PUBLISHABLE_KEY.includes('_pk_');
const RADAR_STYLE_URL = `https://api.radar.io/maps/styles/radar-default-v1?publishableKey=${RADAR_PUBLISHABLE_KEY}`;

const DEFAULT_CENTER = [-122.4194, 37.7749]; // [longitude, latitude]

export default function RadarMapScreen({navigation}) {
  const cameraRef = useRef(null);
  const [status, setStatus] = useState('Not started');
  const [coords, setCoords] = useState(null); // {latitude, longitude}
  const [mapStatus, setMapStatus] = useState(
    KEY_OK ? 'Loading map…' : 'Missing/invalid Radar key — reset Metro cache',
  );
  const [route, setRoute] = useState(null); // {coordinates, distance, duration, steps}
  const [matching, setMatching] = useState(false);

  // Live (Google-Maps-style) navigation.
  const [navActive, setNavActive] = useState(false);
  const [navStepIndex, setNavStepIndex] = useState(0);
  const [navArrived, setNavArrived] = useState(false);
  const [navInfo, setNavInfo] = useState(null); // {distanceToManeuver, remainingDistance, remainingDuration}
  const navWatchId = useRef(null);
  const navStepRef = useRef(0); // current step index, read inside the watch callback
  const navStepsRef = useRef([]); // steps array, read inside the watch callback

  // Polyline trimming: the remaining (not-yet-driven) part of the route, fed to
  // RouteLayers so the line shrinks behind the user as they move.
  const [remainingCoords, setRemainingCoords] = useState(null);
  const navCoordsRef = useRef([]); // full route polyline, read inside the watch callback
  const dstCoordRef = useRef(null); // destination, read inside the watch callback for re-routing

  // Heading-up camera: smoothed compass heading + last position to derive course.
  const headingRef = useRef(0);
  const lastUserRef = useRef(null);

  // Re-routing control (all read/written inside the watch callback).
  const offRouteCountRef = useRef(0);
  const rerouteInFlightRef = useRef(false);
  const lastRerouteTsRef = useRef(0);

  // Place autocomplete (source + destination).
  const [srcQuery, setSrcQuery] = useState('');
  const [dstQuery, setDstQuery] = useState('');
  const [srcResults, setSrcResults] = useState([]);
  const [dstResults, setDstResults] = useState([]);
  const [srcCoord, setSrcCoord] = useState(null); // {latitude, longitude, label}
  const [dstCoord, setDstCoord] = useState(null);
  const [activeField, setActiveField] = useState(null); // 'src' | 'dst' | null
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const searchTimer = useRef(null);

  useEffect(() => {
    Radar.initialize(RADAR_PUBLISHABLE_KEY);
    Radar.setUserId('user-123'); // any id for this user
    Radar.setMetadata({plan: 'free'});
    // Fetch the current location via LocationService and prefill it as the
    // source, so the route can be calculated from where the user is standing.
    locateMe({prefillSource: true});
  }, []);

  // Reverse-geocode a coordinate to a human-readable address (best effort).
  async function reverseGeocode(latitude, longitude) {
    try {
      const url =
        'https://api.radar.io/v1/geocode/reverse' +
        `?coordinates=${latitude},${longitude}`;
      const res = await fetch(url, {
        headers: {Authorization: RADAR_PUBLISHABLE_KEY},
      });
      const data = await res.json();
      return data?.addresses?.[0]?.formattedAddress || null;
    } catch (e) {
      return null;
    }
  }

  // Get the current device location via LocationService (handles permissions,
  // GPS checks, caching and the fast network/GPS race). Optionally fills the
  // source search bar so the user can route straight from their location.
  async function locateMe({prefillSource = false} = {}) {
    setLocating(true);
    setStatus('Locating…');
    try {
      const {latitude, longitude} = await getCurrentLocation();
      setCoords({latitude, longitude});
      setStatus('Got location');
      cameraRef.current?.setCamera({
        centerCoordinate: [longitude, latitude],
        zoomLevel: 14,
        animationDuration: 800,
      });

      if (prefillSource) {
        const label =
          (await reverseGeocode(latitude, longitude)) || 'Current location';
        setSrcCoord({latitude, longitude, label});
        setSrcQuery(label);
        setSrcResults([]);
      }
    } catch (e) {
      setStatus('Error: ' + String(e?.message || e));
    } finally {
      setLocating(false);
    }
  }

  async function fetchAutocomplete(query) {
    let url =
      'https://api.radar.io/v1/search/autocomplete' +
      `?query=${encodeURIComponent(query)}` +
      '&layers=address,place,locality' +
      '&limit=6';
    if (coords) {
      url += `&near=${coords.latitude},${coords.longitude}`;
    }
    const res = await fetch(url, {
      headers: {Authorization: RADAR_PUBLISHABLE_KEY},
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.meta?.message || `HTTP ${res.status}`);
    }
    return data?.addresses || [];
  }

  function onChangeQuery(field, text) {
    if (field === 'src') {
      setSrcQuery(text);
      setSrcCoord(null);
    } else {
      setDstQuery(text);
      setDstCoord(null);
    }
    setActiveField(field);

    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }
    const q = text.trim();
    if (q.length < 3) {
      field === 'src' ? setSrcResults([]) : setDstResults([]);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const addresses = await fetchAutocomplete(q);
        field === 'src' ? setSrcResults(addresses) : setDstResults(addresses);
      } catch (e) {
        field === 'src' ? setSrcResults([]) : setDstResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }

  function selectPlace(field, item) {
    const label =
      item.placeLabel || item.formattedAddress || item.street || 'Selected';
    const coord = {
      latitude: item.latitude,
      longitude: item.longitude,
      label,
    };
    if (field === 'src') {
      setSrcCoord(coord);
      setSrcQuery(label);
      setSrcResults([]);
    } else {
      setDstCoord(coord);
      setDstQuery(label);
      setDstResults([]);
    }
    setActiveField(null);
  }

  // Call Radar's directions API between two {latitude, longitude} points and
  // return the parsed route. Shared by the initial match and live re-routing.
  async function fetchDirections(src, dst) {
    // /route/directions actually routes between two points along roads, unlike
    // /route/match (which only snaps a recorded GPS trace).
    const locations =
      `${src.latitude},${src.longitude}|${dst.latitude},${dst.longitude}`;
    const url =
      'https://api.radar.io/v1/route/directions' +
      `?locations=${encodeURIComponent(locations)}` +
      '&mode=car&units=imperial&geometry=polyline6';
    const res = await fetch(url, {
      headers: {Authorization: RADAR_PUBLISHABLE_KEY},
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.meta?.message || `HTTP ${res.status}`);
    }
    const r = data?.routes?.[0];
    const coordinates = decodePolyline(r?.geometry?.polyline);
    if (!coordinates.length) {
      throw new Error('No route found between those points');
    }
    return {
      coordinates,
      distance: r?.distance?.text,
      duration: r?.duration?.text,
      steps: extractSteps(r),
    };
  }

  async function matchRoute() {
    if (!srcCoord || !dstCoord) {
      setMapStatus('Pick a source and destination first');
      return;
    }
    setMatching(true);
    setMapStatus('Finding route…');
    try {
      const r = await fetchDirections(srcCoord, dstCoord);
      setRoute(r);
      setMapStatus('Route found');

      // Fit the camera to the route polyline.
      const lngs = r.coordinates.map(c => c[0]);
      const lats = r.coordinates.map(c => c[1]);
      const ne = [Math.max(...lngs), Math.max(...lats)];
      const sw = [Math.min(...lngs), Math.min(...lats)];
      cameraRef.current?.fitBounds(
        ne,
        sw,
        [moderateScale(60), moderateScale(60)],
        800,
      );
    } catch (e) {
      setMapStatus('Route match failed: ' + String(e.message || e));
    } finally {
      setMatching(false);
    }
  }

  // Off-route recovery: request a fresh route from the user's current position
  // to the destination, then swap it in mid-navigation. Guarded by an in-flight
  // flag and a cooldown so we don't spam the API on every fix.
  async function reroute(user) {
    if (rerouteInFlightRef.current) return;
    const now = Date.now();
    if (now - lastRerouteTsRef.current < REROUTE_COOLDOWN_MS) return;
    const dst = dstCoordRef.current;
    if (!dst) return;

    rerouteInFlightRef.current = true;
    lastRerouteTsRef.current = now;
    setMapStatus('Rerouting…');
    try {
      const r = await fetchDirections(
        {latitude: user[1], longitude: user[0]},
        dst,
      );
      // Swap the live route: reset steps to the start of the new one and refresh
      // the polyline the camera/trim logic reads.
      navStepsRef.current = r.steps;
      navStepRef.current = 0;
      navCoordsRef.current = r.coordinates;
      setNavStepIndex(0);
      setRoute(r);
      setRemainingCoords(r.coordinates);
      offRouteCountRef.current = 0;
      setMapStatus('Navigating…');
    } catch (e) {
      setMapStatus('Reroute failed: ' + String(e.message || e));
    } finally {
      rerouteInFlightRef.current = false;
    }
  }

  // Called on every GPS fix while navigating. Follows the user with the camera,
  // advances through the maneuvers as they're passed, and recomputes the
  // remaining distance/ETA — the live, Google-Maps-style part.
  function onNavLocation(pos) {
    const user = [pos.longitude, pos.latitude];
    const steps = navStepsRef.current;
    if (!steps.length) return;

    // Snap onto the route: trim the already-driven part of the polyline so the
    // line shrinks behind the user, and measure how far off-route we are.
    const fullCoords = navCoordsRef.current;
    if (fullCoords.length > 1) {
      const snap = snapToRoute(user, fullCoords);
      setRemainingCoords([snap.point, ...fullCoords.slice(snap.index + 1)]);

      // Off-route → re-route. Require a few consecutive off-route fixes so a
      // single noisy GPS jump doesn't trigger a needless API call.
      if (snap.distance > OFF_ROUTE_THRESHOLD_M) {
        offRouteCountRef.current += 1;
        if (offRouteCountRef.current >= OFF_ROUTE_FIXES) {
          reroute(user);
        }
      } else {
        offRouteCountRef.current = 0;
      }
    }

    // Heading-up ("bottom-to-up"): rotate the map so the direction of travel
    // points up. Prefer the GPS heading while moving, else derive the course
    // from the last position; smooth it so the camera glides, not shivers.
    const prev = lastUserRef.current;
    let target = null;
    if (
      Number.isFinite(pos.heading) &&
      pos.heading >= 0 &&
      (pos.speed == null || pos.speed > 0.5)
    ) {
      target = pos.heading;
    } else if (prev && haversineMeters(prev, user) > 2) {
      target = bearing(prev, user);
    }
    if (target != null) {
      headingRef.current = smoothAngle(headingRef.current, target, 0.25);
    }
    lastUserRef.current = user;

    // Chase camera: follow the user, tilt for the forward nav perspective, and
    // rotate to the smoothed heading so the road ahead points up the phone.
    cameraRef.current?.setCamera({
      centerCoordinate: user,
      zoomLevel: 17,
      heading: headingRef.current,
      pitch: 45,
      animationDuration: 900,
    });

    // Advance past any maneuver(s) we've already reached. The maneuver point is
    // the end of the current step (== start of the next).
    let idx = navStepRef.current;
    let toManeuver = haversineMeters(user, steps[idx]?.end);
    while (idx < steps.length - 1 && toManeuver < ADVANCE_THRESHOLD_M) {
      idx += 1;
      toManeuver = haversineMeters(user, steps[idx]?.end);
    }
    if (idx !== navStepRef.current) {
      navStepRef.current = idx;
      setNavStepIndex(idx);
    }

    // Remaining distance = distance to the next maneuver + every step after it.
    // Remaining time ≈ sum of the durations of the steps still ahead.
    let remainingDistance = toManeuver;
    for (let i = idx + 1; i < steps.length; i++) {
      remainingDistance += steps[i].distanceValue || 0;
    }
    let remainingDuration = 0;
    for (let i = idx; i < steps.length; i++) {
      remainingDuration += steps[i].durationValue || 0;
    }
    setNavInfo({
      distanceToManeuver: toManeuver,
      remainingDistance,
      remainingDuration,
    });

    // Arrival: on the final step and within range of the destination.
    const dest = steps[steps.length - 1]?.end;
    if (
      idx >= steps.length - 1 &&
      haversineMeters(user, dest) < ARRIVE_THRESHOLD_M
    ) {
      setNavArrived(true);
      setMapStatus('You have arrived');
      stopNavigation();
    }
  }

  async function startNavigation() {
    if (!route?.steps?.length) {
      setMapStatus('Find a route first');
      return;
    }
    navStepsRef.current = route.steps;
    navStepRef.current = 0;
    navCoordsRef.current = route.coordinates || [];
    dstCoordRef.current = dstCoord;
    offRouteCountRef.current = 0;
    rerouteInFlightRef.current = false;
    lastRerouteTsRef.current = 0;
    headingRef.current = 0;
    lastUserRef.current = null;
    setNavStepIndex(0);
    setNavArrived(false);
    setNavInfo(null);
    setRemainingCoords(route.coordinates);
    setNavActive(true);
    setMapStatus('Navigating…');

    // Immediately zoom into the nav view instead of waiting for the first GPS
    // fix (which can take seconds on Android/iOS, leaving the map frozen).
    const start = route.steps[0]?.start;
    const center = coords
      ? [coords.longitude, coords.latitude]
      : start || route.coordinates?.[0] || DEFAULT_CENTER;
    cameraRef.current?.setCamera({
      centerCoordinate: center,
      zoomLevel: 17,
      pitch: 45,
      heading: 0,
      animationDuration: 800,
    });

    try {
      const id = await watchCurrentLocation(
        onNavLocation,
        err => setMapStatus('GPS: ' + String(err?.message || err)),
        {detectMock: false},
      );
      navWatchId.current = id;
    } catch (e) {
      setNavActive(false);
      setMapStatus('Could not start navigation: ' + String(e?.message || e));
    }
  }

  function stopNavigation() {
    if (navWatchId.current !== null) {
      clearWatchLocation(navWatchId.current);
      navWatchId.current = null;
    }
    setNavActive(false);
    // Restore the full (untrimmed) route so the user sees the whole trip again.
    setRemainingCoords(null);
    if (route?.coordinates?.length) {
      cameraRef.current?.setCamera({
        pitch: 0,
        heading: 0,
        animationDuration: 400,
      });
    }
  }

  // Tear down the location watch if the screen unmounts mid-navigation.
  useEffect(
    () => () => {
      if (navWatchId.current !== null) {
        clearWatchLocation(navWatchId.current);
        navWatchId.current = null;
      }
    },
    [],
  );

  const navStep = navActive ? route?.steps?.[navStepIndex] : null;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader
        title="Radar Demo"
        subtitle="Location SDK"
        onBack={navigation ? () => navigation.goBack() : undefined}
      />

      <NavBanner step={navStep} info={navInfo} />

      {navArrived ? (
        <ArrivedBanner onDismiss={() => setNavArrived(false)} />
      ) : null}

      {navActive ? null : (
        <SearchPanel
          srcQuery={srcQuery}
          dstQuery={dstQuery}
          srcCoord={srcCoord}
          dstCoord={dstCoord}
          srcResults={srcResults}
          dstResults={dstResults}
          activeField={activeField}
          searching={searching}
          locating={locating}
          onChangeQuery={onChangeQuery}
          onFocusField={setActiveField}
          onSelectPlace={selectPlace}
          onLocate={() => locateMe({prefillSource: true})}
        />
      )}

      <View style={styles.map}>
        <MapView
          style={StyleSheet.absoluteFill}
          mapStyle={RADAR_STYLE_URL}
          logoEnabled
          attributionEnabled
          onDidFinishLoadingMap={() => setMapStatus('Map loaded')}
          onDidFailLoadingMap={() =>
            setMapStatus('Map failed to load — check key / network')
          }>
          <Camera
            ref={cameraRef}
            defaultSettings={{centerCoordinate: DEFAULT_CENTER, zoomLevel: 11}}
          />
          <UserLocation visible />

          <RouteLayers
            coordinates={
              navActive ? remainingCoords || route?.coordinates : route?.coordinates
            }
          />
        </MapView>

        <View style={styles.badge}>
          <AppText style={styles.badgeText}>{mapStatus}</AppText>
        </View>

        <NavControls
          navActive={navActive}
          navInfo={navInfo}
          matching={matching}
          canMatch={!matching && !!srcCoord && !!dstCoord}
          canStart={!!route?.steps?.length}
          onMatch={matchRoute}
          onStart={startNavigation}
          onExit={stopNavigation}
        />

        {route && !navActive ? <RouteCard route={route} /> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    flex: 1,
  },
  badge: {
    position: 'absolute',
    top: verticalScale(10),
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(16),
  },
  badgeText: {
    color: '#fff',
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
});
