import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  MapView,
  Camera,
  UserLocation,
  ShapeSource,
  LineLayer,
  CircleLayer,
  setAccessToken,
} from '@maplibre/maplibre-react-native';
import Radar from 'react-native-radar';
import {RADAR_PUBLISHABLE_KEY} from '@env';

import ScreenHeader from '../../component/ScreenHeader/ScreenHeader';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import GPS_Icon from '../../assets/svg_icon/gps-svg.svg'
import {moderateScale, verticalScale} from 'react-native-size-matters';
import {
  getCurrentLocation,
  watchCurrentLocation,
  clearWatchLocation,
} from '../../services/LocationService';

setAccessToken(null);

// Great-circle distance between two [lng, lat] points, in metres.
function haversineMeters(a, b) {
  if (!a || !b) return Infinity;
  const toRad = d => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Imperial formatting to match the &units=imperial route response.
function formatDistance(meters) {
  if (!Number.isFinite(meters)) return '';
  const feet = meters * 3.28084;
  if (feet < 1000) return `${Math.max(0, Math.round(feet / 10) * 10)} ft`;
  return `${(feet / 5280).toFixed(1)} mi`;
}

function formatDuration(mins) {
  if (!Number.isFinite(mins)) return '';
  if (mins < 1) return '<1 min';
  return `${Math.round(mins)} min`;
}

// A glanceable arrow per Radar maneuver type for the navigation banner.
const MANEUVER_ICON = {
  start: '•',
  straight: '↑',
  left: '↰',
  right: '↱',
  'turn-left': '↰',
  'turn-right': '↱',
  'slight-left': '↖',
  'slight-right': '↗',
  'sharp-left': '⬅',
  'sharp-right': '➡',
  'stay-left': '↖',
  'stay-right': '↗',
  'ramp-left': '↖',
  'ramp-right': '↗',
  'exit-left': '↰',
  'exit-right': '↱',
  uturn: '↩',
  destination: '🏁',
  'destination-left': '🏁',
  'destination-right': '🏁',
};

// How close (metres) the user must get to a maneuver point before we advance to
// the next step, and how close to the final point to declare arrival.
const ADVANCE_THRESHOLD_M = 30;
const ARRIVE_THRESHOLD_M = 25;

// Radar returns encoded polylines at precision 6 (1e6).
function decodePolyline(encoded, precision = 6) {
  if (!encoded) return [];
  const factor = Math.pow(10, precision);
  const coordinates = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    // GeoJSON order: [longitude, latitude]
    coordinates.push([lng / factor, lat / factor]);
  }
  return coordinates;
}

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
  const [route, setRoute] = useState(null); // {coordinates, distance, roads}
  const [matching, setMatching] = useState(false);

  // Live (Google-Maps-style) navigation.
  const [navActive, setNavActive] = useState(false);
  const [navStepIndex, setNavStepIndex] = useState(0);
  const [navArrived, setNavArrived] = useState(false);
  const [navInfo, setNavInfo] = useState(null); // {distanceToManeuver, remainingDistance, remainingDuration}
  const navWatchId = useRef(null);
  const navStepRef = useRef(0); // current step index, read inside the watch callback
  const navStepsRef = useRef([]); // steps array, read inside the watch callback

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
        const label = (await reverseGeocode(latitude, longitude)) ||
          'Current location';
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

  async function matchRoute() {
    if (!srcCoord || !dstCoord) {
      setMapStatus('Pick a source and destination first');
      return;
    }
    setMatching(true);
    setMapStatus('Finding route…');
    try {
      // /route/directions actually routes between two points along roads,
      // unlike /route/match (which only snaps a recorded GPS trace).
      const locations =
        `${srcCoord.latitude},${srcCoord.longitude}|` +
        `${dstCoord.latitude},${dstCoord.longitude}`;
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
      console.log('decode line--', r?.geometry?.polyline)
      console.log('poluline------', coordinates)
      if (!coordinates.length) {
        throw new Error('No route found between those points');
      }

      // Flatten the turn-by-turn steps across every leg. Each step carries the
      // banner_instructions (short, for the on-screen banner) and
      // voice_instructions (spoken cue) straight from the Radar response, plus
      // the maneuver point (end_location) we use to advance live navigation.
      const steps = (r?.legs || []).flatMap(leg =>
        (leg?.steps || []).map(s => ({
          banner: s.banner_instructions,
          voice: s.voice_instructions,
          instructions: s.instructions,
          maneuver: s.manuever, // note: Radar spells it "manuever"
          streetName: s.street_name,
          distance: s.distance?.text,
          duration: s.duration?.text,
          distanceValue: s.distance?.value ?? 0, // metres
          durationValue: s.duration?.value ?? 0, // minutes
          // GeoJSON order [lng, lat] so it matches the polyline coordinates.
          start: s.start_location
            ? [s.start_location.longitude, s.start_location.latitude]
            : null,
          end: s.end_location
            ? [s.end_location.longitude, s.end_location.latitude]
            : null,
        })),
      );

      setRoute({
        coordinates,
        distance: r?.distance?.text,
        duration: r?.duration?.text,
        steps,
      });
      setMapStatus('Route found');

      // Fit the camera to the route polyline.
      const lngs = coordinates.map(c => c[0]);
      const lats = coordinates.map(c => c[1]);
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

  // Called on every GPS fix while navigating. Follows the user with the camera,
  // advances through the maneuvers as they're passed, and recomputes the
  // remaining distance/ETA — the live, Google-Maps-style part.
  function onNavLocation(pos) {
    const user = [pos.longitude, pos.latitude];
    const steps = navStepsRef.current;
    if (!steps.length) return;

    // Chase camera: center on the user, tilt, and rotate toward the heading so
    // the road ahead points "up" like a real nav view.
    cameraRef.current?.setCamera({
      centerCoordinate: user,
      zoomLevel: 17,
      heading: Number.isFinite(pos.heading) && pos.heading >= 0 ? pos.heading : 0,
      pitch: 50,
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
    if (idx >= steps.length - 1 && haversineMeters(user, dest) < ARRIVE_THRESHOLD_M) {
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
    setNavStepIndex(0);
    setNavArrived(false);
    setNavInfo(null);
    setNavActive(true);
    setMapStatus('Navigating…');
    try {
      const id = await watchCurrentLocation(
        onNavLocation,
        err => setMapStatus('GPS: ' + String(err?.message || err)),
        {detectMock: false}, // allow simulator/mock fixes while testing nav
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
    // Re-fit the full route so the user sees the whole trip again.
    if (route?.coordinates?.length) {
      cameraRef.current?.setCamera({pitch: 0, heading: 0, animationDuration: 400});
    }
  }

  // Tear down the location watch if the screen unmounts mid-navigation.
  useEffect(() => () => {
    if (navWatchId.current !== null) {
      clearWatchLocation(navWatchId.current);
      navWatchId.current = null;
    }
  }, []);

  const navStep = navActive ? route?.steps?.[navStepIndex] : null;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader
        title="Radar Demo"
        subtitle="Location SDK"
        onBack={navigation ? () => navigation.goBack() : undefined}
      />

      {navStep ? (
        <View style={styles.navBanner}>
          <AppText style={styles.navArrow}>
            {MANEUVER_ICON[navStep.maneuver] || '↑'}
          </AppText>
          <View style={styles.navBannerInfo}>
            <AppText style={styles.navBannerText} numberOfLines={2}>
              {navStep.banner || navStep.voice || navStep.instructions}
            </AppText>
            {navInfo ? (
              <AppText style={styles.navBannerDist}>
                {formatDistance(navInfo.distanceToManeuver)}
                {navStep.streetName ? ` · ${navStep.streetName}` : ''}
              </AppText>
            ) : null}
          </View>
        </View>
      ) : null}

      {navArrived ? (
        <TouchableOpacity
          style={styles.arrivedBanner}
          onPress={() => setNavArrived(false)}
          activeOpacity={0.85}>
          <AppText style={styles.arrivedText}>🏁 You have arrived</AppText>
          <AppText style={styles.arrivedDismiss}>Tap to dismiss</AppText>
        </TouchableOpacity>
      ) : null}

      {navActive ? null : (
      <View style={styles.searchPanel}>
        <View style={styles.inputRow}>
          <View style={[styles.fieldDot, {backgroundColor: '#2ecc71'}]} />
          <TextInput
            style={styles.input}
            placeholder="Search source"
            placeholderTextColor="#999"
            value={srcQuery}
            onChangeText={t => onChangeQuery('src', t)}
            onFocus={() => setActiveField('src')}
            returnKeyType="search"
          />
          {srcCoord ? <AppText style={styles.checkMark}>✓</AppText> : null}
          <TouchableOpacity
            style={styles.locateButton}
            onPress={() => locateMe({prefillSource: true})}
            disabled={locating}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            activeOpacity={0.7}>
            {locating ? (
              <ActivityIndicator size="small" color={colors.button_color} />
            ) : (
              <GPS_Icon width={20} headers={10}/>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.inputRow}>
          <View style={[styles.fieldDot, {backgroundColor: '#e74c3c'}]} />
          <TextInput
            style={styles.input}
            placeholder="Search destination"
            placeholderTextColor="#999"
            value={dstQuery}
            onChangeText={t => onChangeQuery('dst', t)}
            onFocus={() => setActiveField('dst')}
            returnKeyType="search"
          />
          {dstCoord ? <AppText style={styles.checkMark}>✓</AppText> : null}
        </View>

        {activeField &&
        (activeField === 'src' ? srcResults : dstResults).length ? (
          <View style={styles.dropdown}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {(activeField === 'src' ? srcResults : dstResults).map(
                (item, i) => (
                  <TouchableOpacity
                    key={`${item.formattedAddress}-${i}`}
                    style={styles.resultRow}
                    onPress={() => selectPlace(activeField, item)}
                    activeOpacity={0.7}>
                    <AppText style={styles.resultTitle} numberOfLines={1}>
                      {item.placeLabel || item.street || item.formattedAddress}
                    </AppText>
                    <AppText style={styles.resultSub} numberOfLines={1}>
                      {item.formattedAddress}
                    </AppText>
                  </TouchableOpacity>
                ),
              )}
            </ScrollView>
          </View>
        ) : null}

        {searching && activeField ? (
          <View style={styles.searchingRow}>
            <ActivityIndicator size="small" color={colors.button_color} />
          </View>
        ) : null}
      </View>
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

          {route?.coordinates?.length ? (
            <ShapeSource
              id="routeSource"
              shape={{
                type: 'FeatureCollection',
                features: [
                  {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                      type: 'LineString',
                      coordinates: route.coordinates,
                    },
                  },
                  {
                    type: 'Feature',
                    properties: {marker: 'start'},
                    geometry: {
                      type: 'Point',
                      coordinates: route.coordinates[0],
                    },
                  },
                  {
                    type: 'Feature',
                    properties: {marker: 'end'},
                    geometry: {
                      type: 'Point',
                      coordinates:
                        route.coordinates[route.coordinates.length - 1],
                    },
                  },
                ],
              }}>
              <LineLayer
                id="routeLineCasing"
                style={{
                  lineColor: '#ffffff',
                  lineWidth: 8,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              <LineLayer
                id="routeLine"
                style={{
                  lineColor: colors.accentBlue,
                  lineWidth: 8,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              <CircleLayer
                id="routeEndpoints"
                filter={['has', 'marker']}
                style={{
                  circleRadius: 7,
                  circleColor: [
                    'match',
                    ['get', 'marker'],
                    'start',
                    '#2ecc71',
                    'end',
                    '#e74c3c',
                    '#000000',
                  ],
                  circleStrokeColor: '#ffffff',
                  circleStrokeWidth: 2,
                }}
              />
            </ShapeSource>
          ) : null}
        </MapView>

        <View style={styles.badge}>
          <AppText style={styles.badgeText}>{mapStatus}</AppText>
        </View>

        {navActive ? (
          <>
            {navInfo ? (
              <View style={styles.etaCard}>
                <AppText style={styles.etaPrimary}>
                  {formatDuration(navInfo.remainingDuration)}
                </AppText>
                <AppText style={styles.etaSecondary}>
                  {formatDistance(navInfo.remainingDistance)} left
                </AppText>
              </View>
            ) : null}
            <TouchableOpacity
              style={[styles.matchButton, styles.exitButton]}
              onPress={stopNavigation}
              activeOpacity={0.85}>
              <AppText style={styles.matchButtonText}>Exit</AppText>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.matchButton,
                (matching || !srcCoord || !dstCoord) && styles.matchButtonDisabled,
              ]}
              onPress={matchRoute}
              disabled={matching || !srcCoord || !dstCoord}
              activeOpacity={0.85}>
              <AppText style={styles.matchButtonText}>
                {matching ? 'Matching…' : 'Match Route'}
              </AppText>
            </TouchableOpacity>

            {route?.steps?.length ? (
              <TouchableOpacity
                style={styles.startNavButton}
                onPress={startNavigation}
                activeOpacity={0.85}>
                <AppText style={styles.matchButtonText}>▶ Start</AppText>
              </TouchableOpacity>
            ) : null}
          </>
        )}

        {route && !navActive ? (
          <View style={styles.routeCard}>
            <AppText style={styles.routeTitle}>Route</AppText>
            <View style={styles.routeStats}>
              {route.distance ? (
                <View style={styles.statItem}>
                  <AppText style={styles.statValue}>{route.distance}</AppText>
                  <AppText style={styles.statLabel}>distance</AppText>
                </View>
              ) : null}
              {route.duration ? (
                <View style={styles.statItem}>
                  <AppText style={styles.statValue}>{route.duration}</AppText>
                  <AppText style={styles.statLabel}>duration</AppText>
                </View>
              ) : null}
            </View>

            {route.steps?.length ? (
              <ScrollView
                style={styles.stepList}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled>
                {route.steps.map((step, i) => (
                  <View key={i} style={styles.stepRow}>
                    <View style={styles.stepDot} />
                    <View style={styles.stepInfo}>
                      <AppText style={styles.stepBanner} numberOfLines={2}>
                        {step.banner || step.voice || step.instructions}
                      </AppText>
                      {step.voice && step.voice !== step.banner ? (
                        <AppText style={styles.stepVoice} numberOfLines={2}>
                          🔊 {step.voice}
                        </AppText>
                      ) : null}
                      {step.distance ? (
                        <AppText style={styles.stepMeta}>
                          {step.distance}
                          {step.streetName ? ` · ${step.streetName}` : ''}
                        </AppText>
                      ) : null}
                    </View>
                  </View>
                ))}
              </ScrollView>
            ) : null}
          </View>
        ) : null}
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
  searchPanel: {
    backgroundColor: '#fff',
    marginHorizontal: moderateScale(12),
    marginTop: verticalScale(8),
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(4),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(8),
  },
  fieldDot: {
    width: moderateScale(9),
    height: moderateScale(9),
    borderRadius: moderateScale(5),
    marginRight: moderateScale(10),
  },
  input: {
    flex: 1,
    fontSize: moderateScale(14),
    color: colors.text_dark,
    padding: 0,
  },
  checkMark: {
    color: '#2ecc71',
    fontSize: moderateScale(16),
    fontWeight: '700',
    marginLeft: moderateScale(6),
  },
  locateButton: {
    marginLeft: moderateScale(8),
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning_text,
  },
  locateIcon: {
    fontSize: moderateScale(1),
    color: colors.button_color,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginLeft: moderateScale(19),
  },
  dropdown: {
    maxHeight: verticalScale(180),
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: verticalScale(4),
  },
  resultRow: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(4),
    borderBottomWidth: 1,
    borderBottomColor: '#f3f3f3',
  },
  resultTitle: {
    fontSize: moderateScale(14),
    color: colors.text_dark,
    fontWeight: '600',
  },
  resultSub: {
    fontSize: moderateScale(11),
    color: '#888',
    marginTop: verticalScale(1),
  },
  searchingRow: {
    paddingVertical: verticalScale(8),
    alignItems: 'center',
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
  footer: {
    padding: moderateScale(16),
    gap: verticalScale(8),
  },
  row: {
    fontSize: moderateScale(16),
    color: colors.text_dark,
  },
  button: {
    marginTop: verticalScale(4),
    backgroundColor: colors.button_color,
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },
  buttonText: {
    color: colors.text_color_button,
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  matchButton: {
    position: 'absolute',
    bottom: verticalScale(16),
    right: moderateScale(16),
    backgroundColor: colors.button_color,
    paddingHorizontal: moderateScale(18),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(24),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  matchButtonDisabled: {
    opacity: 0.6,
  },
  startNavButton: {
    position: 'absolute',
    bottom: verticalScale(64),
    right: moderateScale(16),
    backgroundColor: '#2ecc71',
    paddingHorizontal: moderateScale(18),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(24),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  exitButton: {
    backgroundColor: '#e74c3c',
  },
  navBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a73e8',
    marginHorizontal: moderateScale(12),
    marginTop: verticalScale(8),
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(12),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 20,
  },
  navArrow: {
    color: '#fff',
    fontSize: moderateScale(34),
    fontWeight: '700',
    marginRight: moderateScale(14),
  },
  navBannerInfo: {
    flex: 1,
  },
  navBannerText: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  navBannerDist: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: moderateScale(13),
    marginTop: verticalScale(2),
  },
  etaCard: {
    position: 'absolute',
    bottom: verticalScale(16),
    left: moderateScale(16),
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(10),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  etaPrimary: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#2ecc71',
  },
  etaSecondary: {
    fontSize: moderateScale(12),
    color: '#888',
    marginTop: verticalScale(1),
  },
  arrivedBanner: {
    marginHorizontal: moderateScale(12),
    marginTop: verticalScale(8),
    backgroundColor: '#2ecc71',
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    zIndex: 20,
  },
  arrivedText: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  arrivedDismiss: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: moderateScale(11),
    marginTop: verticalScale(2),
  },
  matchButtonText: {
    color: colors.text_color_button,
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  routeCard: {
    position: 'absolute',
    bottom: verticalScale(16),
    left: moderateScale(16),
    width: '60%',
    maxHeight: verticalScale(200),
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  routeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(6),
  },
  routeTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: colors.text_dark,
    marginBottom: verticalScale(8),
  },
  routeStats: {
    flexDirection: 'row',
  },
  statItem: {
    marginRight: moderateScale(20),
  },
  statValue: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: colors.button_color,
  },
  statLabel: {
    fontSize: moderateScale(11),
    color: '#888',
    marginTop: verticalScale(1),
  },
  routeDistance: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: colors.button_color,
  },
  stepList: {
    marginTop: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: verticalScale(6),
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: verticalScale(6),
    borderBottomWidth: 1,
    borderBottomColor: '#f3f3f3',
  },
  stepDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(4),
    backgroundColor: colors.button_color,
    marginTop: verticalScale(4),
    marginRight: moderateScale(8),
  },
  stepInfo: {
    flex: 1,
  },
  stepBanner: {
    fontSize: moderateScale(13),
    color: colors.text_dark,
    fontWeight: '600',
  },
  stepVoice: {
    fontSize: moderateScale(11),
    color: '#666',
    marginTop: verticalScale(2),
  },
  stepMeta: {
    fontSize: moderateScale(11),
    color: '#888',
    marginTop: verticalScale(2),
  },
  roadList: {
    flexGrow: 0,
  },
  roadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(5),
  },
  roadDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(4),
    backgroundColor: colors.button_color,
    marginRight: moderateScale(8),
  },
  roadInfo: {
    flex: 1,
  },
  roadName: {
    fontSize: moderateScale(13),
    color: colors.text_dark,
    fontWeight: '600',
  },
  roadClass: {
    fontSize: moderateScale(11),
    color: '#888',
  },
  speedLimit: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: colors.text_dark,
    marginLeft: moderateScale(8),
  },
});
