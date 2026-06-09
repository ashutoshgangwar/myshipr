import { NativeModules } from 'react-native';

const NativeHereMapModule = NativeModules.HereMapModule;

if (!NativeHereMapModule) {
  console.warn(
    '[HereMapModule] Native module not found. Make sure the native module is linked and the app has been rebuilt.',
  );
}

function safeMethod(name, fallback = 'noop') {
  const method = NativeHereMapModule?.[name];

  if (typeof method === 'function') {
    return (...args) => method(...args);
  }

  return (...args) => {
    const message = `[HereMapModule] ${name} is not implemented in the native module`;

    console.warn(message, args);

    if (fallback === 'reject') {
      return Promise.reject(new Error(message));
    }

    return undefined;
  };
}

const HereMapModule = {
  // SDK
  initSDK: safeMethod('initSDK', 'reject'),

  // Map
  moveCamera: safeMethod('moveCamera'),
  addMarker: safeMethod('addMarker'),
  clearMarkers: safeMethod('clearMarkers'),

  // Location
  showCurrentLocation: safeMethod('showCurrentLocation'),
  hideCurrentLocation: safeMethod('hideCurrentLocation'),

  // Route
  drawRoute: safeMethod('drawRoute'),
  clearRoute: safeMethod('clearRoute'),
  calculateRoute: safeMethod('calculateRoute', 'reject'),

  // Navigation
  startNavigation: safeMethod('startNavigation', 'reject'),
  stopNavigation: safeMethod('stopNavigation', 'reject'),
  simulateNavigation: safeMethod('simulateNavigation', 'reject'),

  // Navigation Marker
  updateNavigationMarker: safeMethod('updateNavigationMarker'),
  removeNavigationMarker: safeMethod('removeNavigationMarker'),

  // Navigation Camera
  updateNavigationCamera: safeMethod('updateNavigationCamera'),
  resetNavigationCamera: safeMethod('resetNavigationCamera'),

  // Polyline
  drawPolyline: safeMethod('drawPolyline', 'reject'),
  trimPolyline: safeMethod('trimPolyline', 'reject'),
  clearPolyline: safeMethod('clearPolyline', 'reject'),

  // Debug
  isAvailable: () => !!NativeHereMapModule,
  nativeModule: NativeHereMapModule,
};

export default HereMapModule;