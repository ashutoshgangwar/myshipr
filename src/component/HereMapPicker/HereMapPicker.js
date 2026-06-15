import React, {useEffect, useRef, useState, useCallback} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import {HERE_ACCESS_KEY_ID, HERE_ACCESS_KEY_SECRET} from '@env';

import styles from './HereMapPicker.styles';
import {colors} from '../../theme/colors';
import AppText from '../../theme/AppText';
import {IS_TABLET} from '../../utils/device';

import {
  HereMapView,
  HereMapModule,
} from '../../screens/HereMapScreen/components/HereMap';
import {
  autosuggest,
  reverseGeocode,
} from '../../screens/HereMapScreen/services/hereTruckService';
import {getCurrentLocation} from '../../services/LocationService';

import Location_Icon from '../../assets/svg_icon/location.svg';
import Search_Icon from '../../assets/svg_icon/Search_Icon.svg';
import Gps_Icon from '../../assets/svg_icon/gps-svg.svg';

const hasHereCredentials = Boolean(
  HERE_ACCESS_KEY_ID && HERE_ACCESS_KEY_SECRET,
);

const SEARCH_MIN_CHARS = 3;
const SEARCH_DEBOUNCE_MS = 600;
const REVERSE_DEBOUNCE_MS = 1100;
const CAMERA_POLL_MS = 600;
// ~40 m — below this the map is treated as "not moved".
const COORD_EPSILON = 0.0004;
const DEFAULT_COORDS = {latitude: 28.6139, longitude: 77.209};

const isClose = (a, b) =>
  Math.abs(a.lat - b.lat) < COORD_EPSILON &&
  Math.abs(a.lng - b.lng) < COORD_EPSILON;

/**
 * HERE-SDK destination picker. Self-contained: search bar (HERE autosuggest) +
 * a map whose fixed center pin marks the chosen point. Panning the map updates
 * the selection (reverse-geocoded to an address); picking a search suggestion
 * recenters the map. Works the same on iOS and Android via the native HERE
 * bridge — no Google Maps.
 *
 * @param {object}   props
 * @param {object}   [props.pickedLocation]   Initial {latitude, longitude} to center on.
 * @param {function} props.onPick             Called with {latitude, longitude, description}.
 * @param {object}   [props.mapStyle]         Style for the map card container.
 * @param {string}   [props.searchPlaceholder]
 */
const HereMapPicker = ({
  pickedLocation = null,
  onPick,
  mapStyle,
  searchPlaceholder = 'Search a location',
}) => {
  const mapRef = useRef(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [initError, setInitError] = useState(null);

  // Captured once. Kept STABLE so Android's onAfterUpdateTransaction never
  // re-centers the camera on later re-renders (which would fight the user's
  // pan). All subsequent camera moves go through the imperative moveCamera.
  const initialCenter = useRef({
    lat: Number.isFinite(pickedLocation?.latitude)
      ? pickedLocation.latitude
      : DEFAULT_COORDS.latitude,
    lng: Number.isFinite(pickedLocation?.longitude)
      ? pickedLocation.longitude
      : DEFAULT_COORDS.longitude,
  }).current;

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  const searchTimerRef = useRef(null);
  const resolveTimerRef = useRef(null);
  const lastCenterRef = useRef(null); // {lat, lng}
  const pendingMoveRef = useRef(null); // {lat, lng, description, resolve}
  const didInitCenterRef = useRef(false);
  const onPickRef = useRef(onPick);
  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  // ── SDK init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!hasHereCredentials) {
        setInitError('Missing HERE SDK credentials');
        return;
      }
      try {
        await HereMapModule.initSDK(HERE_ACCESS_KEY_ID, HERE_ACCESS_KEY_SECRET);
        if (!cancelled) setSdkReady(true);
      } catch (e) {
        if (!cancelled) setInitError(e?.message || 'HERE SDK init failed');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const emitPick = useCallback((lat, lng, description) => {
    onPickRef.current?.({
      latitude: lat,
      longitude: lng,
      description: description || '',
    });
  }, []);

  const scheduleReverseGeocode = useCallback(
    (lat, lng) => {
      if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
      resolveTimerRef.current = setTimeout(async () => {
        const res = await reverseGeocode({latitude: lat, longitude: lng});
        const c = lastCenterRef.current;
        // Apply only if the map hasn't moved on since we asked.
        if (res && c && isClose(c, {lat, lng})) {
          emitPick(lat, lng, res.address);
        }
      }, REVERSE_DEBOUNCE_MS);
    },
    [emitPick],
  );

  // Animate the camera and remember the intended target so the poller below
  // attributes the resulting movement to us (and keeps the chosen label).
  const moveTo = useCallback((lat, lng, description, resolve) => {
    pendingMoveRef.current = {lat, lng, description: description || '', resolve};
    mapRef.current
      ?.moveCamera({lat, lng, zoom: 15, animate: true, animationDuration: 600})
      .catch(() => {});
  }, []);

  // ── Initial center: prop location, else current GPS, else default ─────────
  useEffect(() => {
    if (!sdkReady || didInitCenterRef.current) return;
    didInitCenterRef.current = true;
    (async () => {
      if (
        pickedLocation &&
        Number.isFinite(pickedLocation.latitude) &&
        Number.isFinite(pickedLocation.longitude)
      ) {
        moveTo(
          pickedLocation.latitude,
          pickedLocation.longitude,
          pickedLocation.description,
          false,
        );
        emitPick(
          pickedLocation.latitude,
          pickedLocation.longitude,
          pickedLocation.description,
        );
        if (!pickedLocation.description) {
          scheduleReverseGeocode(
            pickedLocation.latitude,
            pickedLocation.longitude,
          );
        }
        return;
      }
      try {
        const loc = await getCurrentLocation({detectMock: true});
        moveTo(loc.latitude, loc.longitude, '', true);
        mapRef.current
          ?.showCurrentLocation({lat: loc.latitude, lng: loc.longitude})
          .catch(() => {});
      } catch (_) {
        moveTo(DEFAULT_COORDS.latitude, DEFAULT_COORDS.longitude, '', true);
      }
    })();
  }, [sdkReady, pickedLocation, moveTo, emitPick, scheduleReverseGeocode]);

  // ── Camera poller — turns map pans into picks ─────────────────────────────
  useEffect(() => {
    if (!sdkReady) return undefined;
    const id = setInterval(async () => {
      let st;
      try {
        st = await mapRef.current?.getCameraState();
      } catch (_) {
        return;
      }
      if (!st || !Number.isFinite(st.lat) || !Number.isFinite(st.lng)) return;
      const next = {lat: st.lat, lng: st.lng};
      const prev = lastCenterRef.current;
      if (prev && isClose(prev, next)) return; // map is still
      lastCenterRef.current = next;

      const pending = pendingMoveRef.current;
      if (pending && isClose(pending, next)) {
        pendingMoveRef.current = null;
        emitPick(next.lat, next.lng, pending.description);
        if (pending.resolve || !pending.description) {
          scheduleReverseGeocode(next.lat, next.lng);
        }
        return;
      }

      // User dragged the map — the center pin is the new selection.
      emitPick(next.lat, next.lng, '');
      scheduleReverseGeocode(next.lat, next.lng);
    }, CAMERA_POLL_MS);
    return () => clearInterval(id);
  }, [sdkReady, emitPick, scheduleReverseGeocode]);

  useEffect(
    () => () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
    },
    [],
  );

  // ── Search ────────────────────────────────────────────────────────────────
  const onChangeQuery = useCallback(q => {
    setQuery(q);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const text = (q || '').trim();
    if (text.length < SEARCH_MIN_CHARS) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      setSearching(true);
      const center = lastCenterRef.current
        ? {
            latitude: lastCenterRef.current.lat,
            longitude: lastCenterRef.current.lng,
          }
        : DEFAULT_COORDS;
      const items = await autosuggest(text, center, 5);
      setSuggestions(items);
      setSearching(false);
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  const onSelectSuggestion = useCallback(
    item => {
      if (!Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)) {
        return;
      }
      setQuery(item.title);
      setSuggestions([]);
      Keyboard.dismiss();
      moveTo(item.latitude, item.longitude, item.title, false);
      emitPick(item.latitude, item.longitude, item.title);
    },
    [moveTo, emitPick],
  );

  const onRecenter = useCallback(async () => {
    if (locating) return;
    setLocating(true);
    try {
      const loc = await getCurrentLocation({detectMock: true});
      moveTo(loc.latitude, loc.longitude, '', true);
      mapRef.current
        ?.showCurrentLocation({lat: loc.latitude, lng: loc.longitude})
        .catch(() => {});
    } catch (_) {
    } finally {
      setLocating(false);
    }
  }, [locating, moveTo]);

  const showOverlay = !sdkReady || !!initError;

  return (
    <View>
      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Search_Icon width={18} height={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.primaryLight}
            value={query}
            onChangeText={onChangeQuery}
            returnKeyType="search"
          />
          {searching && <ActivityIndicator size="small" color={colors.primary} />}
        </View>

        {suggestions.length > 0 && (
          <View style={styles.suggestionList}>
            {suggestions.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionItem}
                activeOpacity={0.7}
                onPress={() => onSelectSuggestion(item)}>
                <AppText style={styles.suggestionTitle} numberOfLines={1}>
                  {item.title}
                </AppText>
                <AppText style={styles.suggestionAddress} numberOfLines={1}>
                  {item.address}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Map */}
      <View style={[styles.mapCard, mapStyle]}>
        {sdkReady && (
          <HereMapView
            ref={mapRef}
            style={styles.map}
            centerLat={initialCenter.lat}
            centerLng={initialCenter.lng}
            zoomLevel={14}
          />
        )}

        {/* Fixed center pin */}
        {sdkReady && !showOverlay && (
          <View style={styles.centerPinWrap} pointerEvents="none">
            <View style={styles.centerPinLift}>
              <Location_Icon width={32} height={32} color={colors.primary} />
            </View>
            <View style={styles.centerPinDot} />
          </View>
        )}

        {sdkReady && !showOverlay && (
          <View style={styles.hintChip} pointerEvents="none">
            <AppText style={styles.hintText}>
              Move the map to set your destination
            </AppText>
          </View>
        )}

        {/* GPS recenter */}
        {sdkReady && !showOverlay && (
          <TouchableOpacity
            style={styles.gpsBtn}
            onPress={onRecenter}
            activeOpacity={0.8}>
            {locating ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Gps_Icon
                width={IS_TABLET ? 28 : 25}
                height={IS_TABLET ? 28 : 25}
              />
            )}
          </TouchableOpacity>
        )}

        {showOverlay && (
          <View style={styles.overlay}>
            {initError ? (
              <AppText style={styles.overlayText}>{initError}</AppText>
            ) : (
              <>
                <ActivityIndicator size="small" color={colors.primary} />
                <AppText style={styles.overlayText}>Loading map…</AppText>
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default HereMapPicker;
