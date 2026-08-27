import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import styles from './HereMapPicker.styles';
import {colors} from '../../theme/colors';
import AppText from '../../theme/AppText';
import {IS_TABLET} from '../../theme/device';

import {HereMapView} from '../../here';
import {
  autosuggest,
  reverseGeocode,
} from '../../screens/HereMapScreen/services/hereTruckService';
import {getCurrentLocation} from '../../services/LocationService';

import Location_Icon from '../../assets/svg_icon/location.svg';
import Search_Icon from '../../assets/svg_icon/Search_Icon.svg';
import Gps_Icon from '../../assets/svg_icon/gps-svg.svg';
import type {StyleProp, ViewStyle} from 'react-native';
import type {LatLng} from '../../types/common';
import type {HereMapViewHandle} from '../../types/here';

const SEARCH_MIN_CHARS = 3;
const SEARCH_DEBOUNCE_MS = 600;
const REVERSE_DEBOUNCE_MS = 1100;
const CAMERA_POLL_MS = 600;
// ~40 m — below this the map is treated as "not moved".
const COORD_EPSILON = 0.0004;
const DEFAULT_COORDS = {latitude: 28.6139, longitude: 77.209};

const isClose = (a: LatLng, b: LatLng): boolean =>
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
 *
 * Exposes `recenterToCurrentLocation()` on its ref so a parent can trigger the
 * same GPS recenter as the built-in button; it resolves with the located
 * coordinate, or null if the fix failed.
 */
/** What the picker hands back when a point is chosen. */
export interface PickedLocation {
  latitude: number;
  longitude: number;
  description: string;
}

export interface HereMapPickerProps {
  pickedLocation?: PickedLocation | null;
  onPick?: (location: PickedLocation) => void;
  mapStyle?: StyleProp<ViewStyle>;
  searchPlaceholder?: string;
  showSearch?: boolean;
}

/** The one method the picker exposes to its parent. */
export interface HereMapPickerHandle {
  recenterToCurrentLocation: () => void;
}

/** One autosuggest result, as the HERE service returns it. */
interface Suggestion {
  id?: string;
  title?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  [key: string]: unknown;
}

/** A camera move this component has asked for but not yet seen land. */
interface PendingMove extends LatLng {
  description: string;
  resolve?: boolean;
}

const HereMapPicker = forwardRef<HereMapPickerHandle, HereMapPickerProps>(({
  pickedLocation = null,
  onPick,
  mapStyle,
  searchPlaceholder = 'Search a location',
  showSearch = true,
}, ref) => {
  const mapRef = useRef<HereMapViewHandle | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  // Only set for failures the map itself cannot explain — it renders its own
  // "unavailable" state for a failed init, so this stays null in that case.
  const [initError, setInitError] = useState<string | null>(null);

  // Captured once. Kept STABLE so Android's onAfterUpdateTransaction never
  // re-centers the camera on later re-renders (which would fight the user's
  // pan). All subsequent camera moves go through the imperative moveCamera.
  const initialCenter = useRef({
    lat: Number.isFinite(pickedLocation?.latitude)
      ? (pickedLocation?.latitude as number)
      : DEFAULT_COORDS.latitude,
    lng: Number.isFinite(pickedLocation?.longitude)
      ? (pickedLocation?.longitude as number)
      : DEFAULT_COORDS.longitude,
  }).current;

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCenterRef = useRef<LatLng | null>(null);
  const pendingMoveRef = useRef<PendingMove | null>(null);
  const didInitCenterRef = useRef(false);
  const onPickRef = useRef(onPick);
  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  // The map initialises the SDK itself and reports when its surface is live —
  // which is also the point the imperative calls below start working, so
  // everything here hangs off that rather than off a separate init of our own.
  const onMapReady = useCallback(() => setSdkReady(true), []);

  const emitPick = useCallback(
    (lat: number, lng: number, description?: string) => {
    onPickRef.current?.({
      latitude: lat,
      longitude: lng,
      description: description || '',
      });
    },
    [],
  );

  const scheduleReverseGeocode = useCallback(
    (lat: number, lng: number) => {
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
  const moveTo = useCallback(
    (lat: number, lng: number, description?: string, resolve?: boolean) => {
    pendingMoveRef.current = {lat, lng, description: description || '', resolve};
    mapRef.current
        ?.moveCamera({lat, lng, zoom: 15, animate: true, animationDuration: 600})
        .catch(() => {});
    },
    [],
  );

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
          ?.showCurrentLocation(loc.latitude, loc.longitude, {
            style: 'pedestrian',
          })
          .catch(() => {});
      } catch {
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
      } catch {
        return;
      }
      if (!st || !Number.isFinite(st.lat) || !Number.isFinite(st.lng)) return;
      const next: LatLng = {lat: st.lat as number, lng: st.lng as number};
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
  const onChangeQuery = useCallback((q: string) => {
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
    (item: Suggestion) => {
      if (!Number.isFinite(item.latitude) || !Number.isFinite(item.longitude)) {
        return;
      }
      const lat = item.latitude as number;
      const lng = item.longitude as number;
      setQuery(item.title ?? '');
      setSuggestions([]);
      Keyboard.dismiss();
      moveTo(lat, lng, item.title, false);
      emitPick(lat, lng, item.title);
    },
    [moveTo, emitPick],
  );

  const onRecenter = useCallback(async () => {
    if (locating) return null;
    setLocating(true);
    try {
      const loc = await getCurrentLocation({detectMock: true});
      moveTo(loc.latitude, loc.longitude, '', true);
      mapRef.current
        ?.showCurrentLocation(loc.latitude, loc.longitude, {
          style: 'pedestrian',
        })
        .catch(() => {});
      // If we're already sitting on that point the camera won't move, so the
      // poller never fires — emit the pick here instead.
      const center = lastCenterRef.current;
      if (center && isClose(center, {lat: loc.latitude, lng: loc.longitude})) {
        pendingMoveRef.current = null;
        emitPick(loc.latitude, loc.longitude, '');
        scheduleReverseGeocode(loc.latitude, loc.longitude);
      }
      return loc;
    } catch {
      return null;
    } finally {
      setLocating(false);
    }
  }, [locating, moveTo, emitPick, scheduleReverseGeocode]);

  useImperativeHandle(ref, () => ({recenterToCurrentLocation: onRecenter}), [
    onRecenter,
  ]);

  const showOverlay = !sdkReady || !!initError;

  return (
    <View>
      {/* Search */}
      {showSearch && (
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
            {searching && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
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
      )}

      {/* Map. Mounted unconditionally — it initialises the SDK itself and shows
          its own loading / unavailable state, so gating it on our readiness
          flag would only hide the reason when something fails. */}
      <View style={[styles.mapCard, mapStyle]}>
        <HereMapView
          ref={mapRef}
          style={styles.map}
          centerLat={initialCenter.lat}
          centerLng={initialCenter.lng}
          zoomLevel={14}
          // Picking an address is not a driving task — the congestion lines
          // would only fight the centre pin. Day/night still follows the
          // shared preference.
          showTrafficFlow={false}
          showTrafficIncidents={false}
          onMapReady={onMapReady}
          onMapError={(detail: {message?: string}) =>
            setInitError(detail?.message || null)
          }
        />

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
});

HereMapPicker.displayName = 'HereMapPicker';

export default HereMapPicker;
