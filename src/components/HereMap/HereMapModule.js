import { NativeModules } from 'react-native';

const { HereMapModule: NativeHereMapModule } = NativeModules;

if (!NativeHereMapModule) {
  console.warn(
    '[HereMapModule] Native module not found. Make sure you have rebuilt the Android app after adding HereMapPackage.',
  );
}

/**
 * Creates a safe wrapper for a native method.
 * If the method doesn't exist on the native module, returns a rejected promise
 * with a clear error message.
 */
function safeMethod(name, fallbackReturn) {
  if (NativeHereMapModule?.[name]) {
    return (...args) => NativeHereMapModule[name](...args);
  }
  return async () => {
    if (fallbackReturn === 'reject') {
      return Promise.reject(new Error(`${name} not implemented in native module`));
    }
    // Silent no-op for non-critical methods
  };
}

const HereMapModule = {
  // Core SDK initialisation – must reject if unavailable
  initSDK: safeMethod('initSDK', 'reject'),

  // Map manipulation – silent no-ops if unavailable
  moveCamera: safeMethod('moveCamera'),
  addMarker: safeMethod('addMarker'),
  clearMarkers: safeMethod('clearMarkers'),
  showCurrentLocation: safeMethod('showCurrentLocation'),
  hideCurrentLocation: safeMethod('hideCurrentLocation'),
  drawRoute: safeMethod('drawRoute'),
  clearRoute: safeMethod('clearRoute'),

  // ── New: Animated navigation marker ──
  // Adds/updates the navigation arrow marker with smooth native animation
  // Params: tag, { lat, lng, bearing, animationDuration }
  updateNavigationMarker: safeMethod('updateNavigationMarker'),
  updateNavigationCamera: safeMethod('updateNavigationCamera'),
  resetNavigationCamera: safeMethod('resetNavigationCamera'),

  // Removes the navigation marker
  removeNavigationMarker: safeMethod('removeNavigationMarker'),

  // ── New: Polyline management ──
  // Draws a polyline from an array of coordinates
  // Params: tag, { coordinates: [{lat, lng}, ...], color, width }
  drawPolyline: safeMethod('drawPolyline'),

  // Updates the polyline – trims from the start up to a given index + fraction
  // Params: tag, { trimIndex, trimFraction }
  // trimIndex = index of the segment the marker is on
  // trimFraction = 0-1 how far along that segment
  trimPolyline: safeMethod('trimPolyline'),

  // Clears the drawn polyline
  clearPolyline: safeMethod('clearPolyline'),

  // Navigation-related – reject if unavailable so callers can handle
  calculateRoute: safeMethod('calculateRoute', 'reject'),
  startNavigation: safeMethod('startNavigation', 'reject'),
  stopNavigation: safeMethod('stopNavigation', 'reject'),
  simulateNavigation: safeMethod('simulateNavigation', 'reject'),
};

export default HereMapModule;