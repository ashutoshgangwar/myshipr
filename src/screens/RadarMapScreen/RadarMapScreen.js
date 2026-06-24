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
import {getCurrentLocation} from '../../services/LocationService';

setAccessToken(null);

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
      if (!coordinates.length) {
        throw new Error('No route found between those points');
      }

      setRoute({
        coordinates,
        distance: r?.distance?.text,
        duration: r?.duration?.text,
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader
        title="Radar Demo"
        subtitle="Location SDK"
        onBack={navigation ? () => navigation.goBack() : undefined}
      />

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
                  lineColor: colors.button_color,
                  lineWidth: 5,
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

        {route ? (
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
