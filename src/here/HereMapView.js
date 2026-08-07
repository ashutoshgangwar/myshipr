import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  findNodeHandle,
  NativeModules,
  Platform,
  requireNativeComponent,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import HereSdk from './HereSdk';

const {HereMapModule} = NativeModules;

const COMPONENT_NAME = 'HereMapView';

// Registered by HereMapViewManager on both platforms (Android:
// HereMapViewManager.REACT_CLASS, iOS: RCT_EXTERN_MODULE minus "Manager").
let NativeHereMapView = null;
try {
  NativeHereMapView = requireNativeComponent(COMPONENT_NAME);
} catch (error) {
  console.warn(`[HereMapView] native component ${COMPONENT_NAME} not found`, error);
}

/**
 * React Native view wrapping the HERE SDK `MapView`.
 *
 * The native view owns the map surface lifecycle on both platforms — Android
 * hooks the host lifecycle and releases the surface when React drops the view;
 * iOS tears it down on deinit — so there is nothing to wire up here.
 *
 * Imperative methods are on the ref:
 *
 *     const mapRef = useRef(null);
 *     <HereMapView ref={mapRef} style={{flex: 1}} />
 *     await mapRef.current.loadMap();
 *     await mapRef.current.setCenter(52.53, 13.38, 14);
 *     await mapRef.current.drawRoute({routeId});
 *
 * @param {number} [centerLat] initial camera latitude
 * @param {number} [centerLng] initial camera longitude
 * @param {number} [zoomLevel=14]
 * @param {string} [mapScheme] 'normalDay' | 'normalNight' | 'satellite' |
 *   'hybridDay' | 'logisticsDay' | …
 * @param {boolean} [buildings3D=false]
 * @param {Function} [onMapTap] receives `{latitude, longitude, x, y}`
 * @param {Function} [onMapLongPress] same payload as `onMapTap`
 * @param {Function} [onPoiTap] adds `{name, categoryId}` for HERE's built-in POIs
 */
const HereMapView = forwardRef(function HereMapView(
  {
    style,
    centerLat = 0,
    centerLng = 0,
    zoomLevel = 14,
    mapScheme,
    buildings3D = false,
    onMapTap,
    onMapLongPress,
    onPoiTap,
    onMapError,
    onMapReady,
    ...rest
  },
  ref,
) {
  const nativeRef = useRef(null);

  // The native MapView constructor throws if the shared HERE engine does not
  // exist yet, so the native component is not mounted until initialize()
  // resolves. Doing it here means no caller can get this wrong.
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState(null);

  // Shown over a working surface: the map renders, it just has no data.
  const [dataAccessWarning, setDataAccessWarning] = useState(null);

  useEffect(() => {
    let cancelled = false;
    HereSdk.initialize()
      .then(() => {
        if (cancelled) return;
        setSdkReady(true);

        // An unlicensed map-data catalog draws a blank map with no error, so
        // ask explicitly rather than leave an empty rectangle unexplained.
        return HereSdk.checkMapDataAccess().then(result => {
          if (cancelled || result.hasMapDataAccess) return;
          setDataAccessWarning(result.message);
          onMapError?.({code: 'MAP_DATA_FORBIDDEN', message: result.message});
        });
      })
      .catch(e => {
        if (cancelled) return;
        setError(e.message);
        onMapError?.({code: 'SDK_INIT_FAILED', message: e.message});
      });
    return () => {
      cancelled = true;
    };
    // onMapError is only read on failure; re-subscribing on each render of the
    // parent would restart initialisation for nothing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const api = useMemo(() => {
    // Native commands address the map by its React tag, so every call resolves
    // it first and fails loudly rather than silently no-op'ing before layout.
    const withTag = callback => {
      const tag = nativeRef.current ? findNodeHandle(nativeRef.current) : null;
      if (!tag) {
        return Promise.reject(
          new Error('[HereMapView] the map is not mounted yet'),
        );
      }
      if (!HereMapModule) {
        return Promise.reject(
          new Error('[HereMapView] native HereMapModule is missing — rebuild the app'),
        );
      }
      return callback(tag);
    };

    return {
      /**
       * Resolves once the map scene is renderable — await it before drawing.
       * @param {Object} [options] `{ scheme }` to switch style at the same time
       */
      loadMap: (options = null) =>
        withTag(tag => HereMapModule.loadMap(tag, options)),

      /** Centres the map, without animating. */
      setCenter: (latitude, longitude, zoom = zoomLevel) =>
        withTag(tag => HereMapModule.setCenter(tag, latitude, longitude, zoom)),

      /**
       * Shows the current-position indicator.
       * @param {number} latitude
       * @param {number} longitude
       * @param {Object} [options] `{ bearing, style: 'navigation'|'pedestrian' }`
       */
      showCurrentLocation: (latitude, longitude, options = {}) =>
        withTag(tag =>
          HereMapModule.showCurrentLocation(tag, {
            lat: latitude,
            lng: longitude,
            bearing: options.bearing ?? 0,
            style: options.style ?? 'navigation',
          }),
        ),

      hideCurrentLocation: () =>
        withTag(tag => HereMapModule.hideCurrentLocation(tag)),

      /**
       * Adds a pin. `image` is base64 PNG bytes (see MarkerRasterizer); native
       * scales it to `markerSize` so the source resolution does not matter.
       */
      addMarker: ({latitude, longitude, color = '#FF0000', image, markerSize}) =>
        withTag(tag =>
          HereMapModule.addMarker(tag, {
            lat: latitude,
            lng: longitude,
            color,
            ...(image ? {image} : {}),
            ...(markerSize != null ? {markerSize} : {}),
          }),
        ),

      clearMarkers: () => withTag(tag => HereMapModule.clearMarkers(tag)),

      /**
       * Draws route geometry. Pass the `routeId` from `HereRouting.*`, or an
       * explicit `coordinates` array.
       *
       * @param {Object} route `{ routeId }` or `{ coordinates: [{lat,lng}] }`,
       *   plus optional `{ color, width }`
       * @returns {Promise<number>} number of vertices drawn
       */
      drawRoute: route =>
        withTag(tag => HereMapModule.drawRouteGeometry(tag, route)),

      clearRoute: () => withTag(tag => HereMapModule.clearRoute(tag)),

      /** Animated camera move: `{lat, lng, zoom, bearing, tilt, animate}`. */
      moveCamera: camera => withTag(tag => HereMapModule.moveCamera(tag, camera)),

      /** `{ lat, lng, bearing, tilt, distanceMeters }` for the live camera. */
      getCameraState: () => withTag(tag => HereMapModule.getCameraState(tag)),

      /** Animates the map back to north-up. */
      resetNorth: () => withTag(tag => HereMapModule.resetNorth(tag)),

      setMapScheme: scheme => withTag(tag => HereMapModule.setMapScheme(tag, scheme)),

      /** The React tag, for calls that take an explicit `mapViewTag`. */
      getTag: () => (nativeRef.current ? findNodeHandle(nativeRef.current) : null),
    };
  }, [zoomLevel]);

  useImperativeHandle(ref, () => api, [api]);

  // Fires once the native surface is actually mounted — the point at which the
  // imperative methods start working. Screens that move the camera or draw on
  // load should hang off this rather than off their own "SDK ready" flag, which
  // can win the race against this component's mount.
  const notifiedReadyRef = useRef(false);
  useEffect(() => {
    if (!sdkReady || notifiedReadyRef.current || !nativeRef.current) return;
    notifiedReadyRef.current = true;
    onMapReady?.(api);
    // onMapReady is fired exactly once; re-running on identity changes would
    // replay "the map just appeared" on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkReady]);

  if (!NativeHereMapView) {
    return (
      <View style={[styles.map, style, styles.fallback]}>
        <Text style={styles.fallbackText}>
          {`HERE map native component is not linked. Rebuild the ${Platform.OS} app.`}
        </Text>
      </View>
    );
  }

  // Surface the reason instead of a blank rectangle — a failed init is almost
  // always missing/rejected credentials, which is only actionable if it is said.
  if (error) {
    return (
      <View style={[styles.map, style, styles.fallback, styles.errorBox]}>
        <Text style={styles.errorTitle}>HERE map unavailable</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!sdkReady) {
    return (
      <View style={[styles.map, style, styles.fallback]}>
        <ActivityIndicator size="small" color="#2563EB" />
        <Text style={styles.fallbackText}>Initializing HERE map…</Text>
      </View>
    );
  }

  // The surface still renders (route, markers, location indicator all work), so
  // the warning is an overlay rather than a replacement.
  return (
    <View style={[styles.map, style]}>
      <NativeHereMapView
        ref={nativeRef}
        style={styles.map}
        centerLat={centerLat}
        centerLng={centerLng}
        zoomLevel={zoomLevel}
        buildings3D={buildings3D}
        {...(mapScheme ? {mapScheme} : {})}
        {...(onMapTap ? {onMapTap: event => onMapTap(event.nativeEvent)} : {})}
        {...(onMapLongPress
          ? {onMapLongPress: event => onMapLongPress(event.nativeEvent)}
          : {})}
        {...(onPoiTap ? {onPoiTap: event => onPoiTap(event.nativeEvent)} : {})}
        onMapError={event => {
          const detail = event.nativeEvent;
          setError(detail.message);
          onMapError?.(detail);
        }}
        {...rest}
      />

      {dataAccessWarning ? (
        <View style={styles.warningBanner} pointerEvents="none">
          <Text style={styles.warningTitle}>Base map data unavailable</Text>
          <Text style={styles.warningText}>{dataAccessWarning}</Text>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  map: {flex: 1},
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  fallbackText: {
    color: '#475569',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 20,
  },
  errorTitle: {
    color: '#991B1B',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    textAlign: 'center',
  },
  warningBanner: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(254,243,199,0.97)',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  warningTitle: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  warningText: {
    color: '#92400E',
    fontSize: 12,
  },
});

export default HereMapView;
