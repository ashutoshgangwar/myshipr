import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { requireNativeComponent, findNodeHandle, StyleSheet } from 'react-native';
import HereMapModule from './HereMapModule';

const COMPONENT_NAME = 'HereMapView';
const NativeHereMapView = requireNativeComponent(COMPONENT_NAME);

/**
 * HereMapView – React Native wrapper for the native HERE SDK map view.
 *
 * Props:
 *   style, centerLat, centerLng, zoomLevel
 *
 * Ref methods:
 *   moveCamera, addMarker, clearMarkers, showCurrentLocation,
 *   drawRoute, clearRoute, calculateRoute,
 *   startNavigation, stopNavigation, simulateNavigation,
 *   updateNavigationMarker, removeNavigationMarker,
 *   drawPolyline, trimPolyline, clearPolyline
 */
const HereMapView = forwardRef(function HereMapView(
  { style, centerLat = 0, centerLng = 0, zoomLevel = 14, ...rest },
  ref,
) {
  const nativeRef = useRef(null);
  const getTag = () => findNodeHandle(nativeRef.current);

  useImperativeHandle(ref, () => ({
    // ── Camera ──
    moveCamera: ({
      lat, lng, zoom = 14, bearing = 0, tilt = 0,
      animate = false, animationDuration = 800,
    }) =>
      HereMapModule.moveCamera(getTag(), {
        lat, lng, zoom, bearing, tilt, animate, animationDuration,
      }),

    // ── Markers ──
    addMarker: ({ lat, lng, color = '#FF0000' }) =>
      HereMapModule.addMarker(getTag(), { lat, lng, color }),

    clearMarkers: () => HereMapModule.clearMarkers(getTag()),

    // ── Current location dot ──
    showCurrentLocation: ({ lat, lng, bearing = 0 }) =>
      HereMapModule.showCurrentLocation(getTag(), { lat, lng, bearing }),

    hideCurrentLocation: () =>
      HereMapModule.hideCurrentLocation(getTag()),

    // ── Route (HERE SDK native routing) ──
    drawRoute: ({ originLat, originLng, destLat, destLng }) =>
      HereMapModule.drawRoute(getTag(), { originLat, originLng, destLat, destLng }),

    clearRoute: () => HereMapModule.clearRoute(getTag()),

    calculateRoute: ({ originLat, originLng, destLat, destLng }) =>
      HereMapModule.calculateRoute(getTag(), { originLat, originLng, destLat, destLng }),

    // ── Navigation (native) ──
    startNavigation: ({ simulate = false } = {}) =>
      HereMapModule.startNavigation(getTag(), { simulate }),

    stopNavigation: () => HereMapModule.stopNavigation(getTag()),

    simulateNavigation: ({ speed = 1.0 } = {}) =>
      HereMapModule.simulateNavigation(getTag(), { speed }),

    // ── Animated navigation marker ──
    // Smoothly moves a directional arrow marker to the given position.
    // Native side handles ValueAnimator for lat/lng/bearing interpolation.
    // Optional: markerSize (px, default 180), iconAsset (SVG filename in assets/)
    updateNavigationMarker: ({
      lat, lng, bearing = 0, animationDuration = 1000,
      markerSize, iconAsset,
    }) =>
      HereMapModule.updateNavigationMarker(getTag(), {
        lat, lng, bearing, animationDuration,
        ...(markerSize != null ? { markerSize } : {}),
        ...(iconAsset   != null ? { iconAsset }   : {}),
      }),

    updateNavigationCamera: ({
      lat, lng, bearing = 0, speedMps,
      animationDuration = 220, forceInstant = false,
    }) =>
      HereMapModule.updateNavigationCamera(getTag(), {
        lat,
        lng,
        bearing,
        animationDuration,
        forceInstant,
        ...(speedMps != null ? {speedMps} : {}),
      }),

    resetNavigationCamera: () =>
      HereMapModule.resetNavigationCamera(getTag()),

    removeNavigationMarker: () =>
      HereMapModule.removeNavigationMarker(getTag()),

    // ── Polyline (with trimming) ──
    // coordinates: Array of { lat, lng }
    drawPolyline: ({ coordinates, color = '#4285F4', width = 8 }) =>
      HereMapModule.drawPolyline(getTag(), { coordinates, color, width }),

    // Trims (hides) the polyline from index 0 up to trimIndex + trimFraction.
    // Optional splitLat/splitLng lets native use exact snapped marker point.
    trimPolyline: ({ trimIndex, trimFraction = 0, splitLat, splitLng, speedMps }) =>
      HereMapModule.trimPolyline(getTag(), {
        trimIndex,
        trimFraction,
        ...(splitLat != null ? {splitLat} : {}),
        ...(splitLng != null ? {splitLng} : {}),
        ...(speedMps != null ? {speedMps} : {}),
      }),

    clearPolyline: () => HereMapModule.clearPolyline(getTag()),
  }));

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
});

export default HereMapView;