import React, { useRef, forwardRef, useImperativeHandle, useEffect, useState } from 'react';
import { requireNativeComponent, findNodeHandle, StyleSheet, Platform, View, Text } from 'react-native';
import HereMapModule from './HereMapModule';

const COMPONENT_NAME = 'HereMapView';
let NativeHereMapView;
try {
  NativeHereMapView = requireNativeComponent(COMPONENT_NAME);
} catch (error) {
  console.warn(
    `[HereMapView] Native component not found: ${COMPONENT_NAME}`,
    error,
  );
  NativeHereMapView = null;
}

const HereMapView = forwardRef(function HereMapView(
  { style, centerLat = 0, centerLng = 0, zoomLevel = 14, onSDKInitialized, ...rest },
  ref,
) {
  const nativeRef = useRef(null);
  const [viewReady, setViewReady] = useState(false);
  const [initError, setInitError] = useState(null);

  const getTag = () => (nativeRef.current ? findNodeHandle(nativeRef.current) : null);

  const withTag = callback => {
    const tag = getTag();
    if (!tag) {
      console.warn('[HereMapView] native view tag is not available yet');
      return Promise.reject(new Error('View tag unavailable'));
    }
    try {
      return callback(tag);
    } catch (error) {
      console.error('[HereMapView] Error calling native method:', error);
      return Promise.reject(error);
    }
  };

  useEffect(() => {
    // Mark view as ready after a short delay to ensure native initialization
    const timer = setTimeout(() => {
      setViewReady(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useImperativeHandle(ref, () => ({
    // ── Camera ──
    moveCamera: ({
      lat, lng, zoom = 14, bearing = 0, tilt = 0,
      animate = false, animationDuration = 800,
    }) =>
      withTag(tag =>
        HereMapModule.moveCamera(tag, {
          lat, lng, zoom, bearing, tilt, animate, animationDuration,
        }).catch(err => {
          console.error('[HereMapView] moveCamera failed:', err);
          throw err;
        }),
      ),

    // Returns { lat, lng, bearing, tilt, distanceMeters } for the current camera.
    getCameraState: () => withTag(tag => HereMapModule.getCameraState(tag)),

    // Animate the map back to a north-up orientation (compass reset-to-north).
    resetNorth: () => withTag(tag => HereMapModule.resetNorth(tag)),

    // ── Markers ──
    // `markerSize` (px) is the on-screen size JS wants; native scales the
    // supplied PNG to it, so the rasterised SVG can be any resolution.
    addMarker: ({ lat, lng, color = '#FF0000', image, markerSize }) =>
      withTag(tag =>
        HereMapModule.addMarker(tag, {
          lat,
          lng,
          color,
          ...(image ? { image } : {}),
          ...(markerSize != null ? { markerSize } : {}),
        }),
      ),

    clearMarkers: () => withTag(tag => HereMapModule.clearMarkers(tag)),

    // ── Current location dot ──
    showCurrentLocation: ({ lat, lng, bearing = 0, style = 'navigation' }) =>
      withTag(tag => HereMapModule.showCurrentLocation(tag, { lat, lng, bearing, style })),

    hideCurrentLocation: () =>
      withTag(tag => HereMapModule.hideCurrentLocation(tag)),

    // ── Route (HERE SDK native routing) ──
    drawRoute: ({ originLat, originLng, destLat, destLng }) =>
      withTag(tag =>
        HereMapModule.drawRoute(tag, { originLat, originLng, destLat, destLng }).catch(err => {
          console.error('[HereMapView] drawRoute failed:', err);
          throw err;
        }),
      ),

    clearRoute: () => withTag(tag => HereMapModule.clearRoute(tag)),

    calculateRoute: ({ originLat, originLng, destLat, destLng }) =>
      withTag(tag =>
        HereMapModule.calculateRoute(tag, { originLat, originLng, destLat, destLng }),
      ),

    // ── Navigation (native) ──
    startNavigation: ({ simulate = false } = {}) =>
      withTag(tag => HereMapModule.startNavigation(tag, { simulate })),

    stopNavigation: () => withTag(tag => HereMapModule.stopNavigation(tag)),

    simulateNavigation: ({ speed = 1.0 } = {}) =>
      withTag(tag => HereMapModule.simulateNavigation(tag, { speed })),

    updateNavigationMarker: ({
      lat, lng, bearing = 0, animationDuration = 1000,
      markerSize, iconAsset, iconImage,
    }) =>
      withTag(tag =>
        HereMapModule.updateNavigationMarker(tag, {
          lat, lng, bearing, animationDuration,
          ...(markerSize != null ? { markerSize } : {}),
          ...(iconAsset   != null ? { iconAsset }   : {}),
          ...(iconImage   != null ? { iconImage }   : {}),
        }),
      ),

    updateNavigationCamera: ({
      lat, lng, bearing = 0, speedMps,
      animationDuration = 220, forceInstant = false,
    }) =>
      withTag(tag =>
        HereMapModule.updateNavigationCamera(tag, {
          lat,
          lng,
          bearing,
          animationDuration,
          forceInstant,
          ...(speedMps != null ? {speedMps} : {}),
        }),
      ),

    resetNavigationCamera: () =>
      withTag(tag => HereMapModule.resetNavigationCamera(tag)),

    removeNavigationMarker: () =>
      withTag(tag => HereMapModule.removeNavigationMarker(tag)),

    drawPolyline: ({ coordinates, color = '#4285F4', width = 20 }) => {
      return withTag(tag => HereMapModule.drawPolyline(tag, { coordinates, color, width })).catch(err => {
        console.error('[HereMapView] drawPolyline failed:', err);
        throw err;
      });
    },
    trimPolyline: ({ trimIndex, trimFraction = 0, splitLat, splitLng, speedMps }) => {
      return withTag(tag =>
        HereMapModule.trimPolyline(tag, {
          trimIndex,
          trimFraction,
          ...(splitLat != null ? { splitLat } : {}),
          ...(splitLng != null ? { splitLng } : {}),
          ...(speedMps != null ? { speedMps } : {}),
        }),
      );
    },

    clearPolyline: () => withTag(tag => HereMapModule.clearPolyline(tag)),
  }));

  if (!NativeHereMapView) {
    return (
      <View style={[styles.map, style, styles.fallbackContainer]}>
        <Text style={styles.fallbackText}>
          HERE map native component is not available. Check that the native module is properly linked.
        </Text>
      </View>
    );
  }

  if (initError) {
    return (
      <View style={[styles.map, style, styles.errorContainer]}>
        <Text style={styles.errorText}>
          Map initialization failed: {initError}
        </Text>
      </View>
    );
  }

  return (
    <NativeHereMapView
      ref={nativeRef}
      style={[styles.map, style]}
      centerLat={centerLat}
      centerLng={centerLng}
      zoomLevel={zoomLevel}
      {...rest}
    />
  );
});

const styles = StyleSheet.create({
  map: { flex: 1 },
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  fallbackText: {
    color: '#475569',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    color: '#991b1b',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});

export default HereMapView;
