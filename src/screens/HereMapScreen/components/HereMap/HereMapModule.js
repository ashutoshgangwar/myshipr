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
  // ── SDK ────────────────────────────────────────────────────────────────────
  initSDK: safeMethod('initSDK', 'reject'),

  // ── Map ────────────────────────────────────────────────────────────────────
  moveCamera: safeMethod('moveCamera'),
  // getCameraState() → { lat, lng, bearing, tilt, distanceMeters }
  getCameraState: safeMethod('getCameraState', 'reject'),
  // resetNorth() — animate the map back to a north-up orientation
  resetNorth: safeMethod('resetNorth'),

  // ── Markers ────────────────────────────────────────────────────────────────
  //  addMarker(type, latitude, longitude)
  //    type: 'source' | 'destination' | 'generic'
  //  Both platforms expose a single addMarker that accepts a type string so
  //  callers never need to know which platform they're on.
  addMarker: safeMethod('addMarker'),
  clearMarkers: safeMethod('clearMarkers'),

  // ── Location dot ──────────────────────────────────────────────────────────
  showCurrentLocation: safeMethod('showCurrentLocation'),
  hideCurrentLocation: safeMethod('hideCurrentLocation'),

  // ── Route ─────────────────────────────────────────────────────────────────
  drawRoute: safeMethod('drawRoute'),
  clearRoute: safeMethod('clearRoute'),
  calculateRoute: safeMethod('calculateRoute', 'reject'),

  // ── Navigation ────────────────────────────────────────────────────────────
  startNavigation: safeMethod('startNavigation', 'reject'),
  stopNavigation: safeMethod('stopNavigation', 'reject'),
  simulateNavigation: safeMethod('simulateNavigation', 'reject'),

  // ── Navigation Marker (live GPS dot) ──────────────────────────────────────
  //  updateNavigationMarker(latitude, longitude, bearing)
  //  Fire & forget — no await, called on every GPS tick
  updateNavigationMarker: safeMethod('updateNavigationMarker'),
  removeNavigationMarker: safeMethod('removeNavigationMarker'),

  // ── Navigation Camera ─────────────────────────────────────────────────────
  updateNavigationCamera: safeMethod('updateNavigationCamera'),
  resetNavigationCamera: safeMethod('resetNavigationCamera'),

  // ── Polyline ──────────────────────────────────────────────────────────────
  //  drawPolyline(coords)
  //    coords: Array of { latitude, longitude } objects
  //            OR array of [lat, lng] arrays — both platforms normalise internally
  drawPolyline: safeMethod('drawPolyline', 'reject'),
  trimPolyline: safeMethod('trimPolyline', 'reject'),
  clearPolyline: safeMethod('clearPolyline', 'reject'),

  // ── Map style & features (HERE SDK MapScheme / MapFeatures) ───────────────
  //  setMapScheme(viewTag, 'satellite' | 'normalDay' | 'logisticsNight' | …)
  setMapScheme: safeMethod('setMapScheme', 'reject'),
  getMapScheme: safeMethod('getMapScheme', 'reject'),
  //  setMapFeatures(viewTag, { enable: {FEATURE: MODE}, disable: [FEATURE] })
  setMapFeatures: safeMethod('setMapFeatures', 'reject'),
  //  3D extruded buildings + shadows
  set3DBuildingsEnabled: safeMethod('set3DBuildingsEnabled', 'reject'),
  getSupportedMapFeatures: safeMethod('getSupportedMapFeatures', 'reject'),

  // ── Search / geocoding / POI (HERE SDK SearchEngine) ──────────────────────
  //  These take a single options object and are view-independent. Prefer the
  //  wrappers in src/services/hereSdkService.js over calling them directly.
  suggest: safeMethod('suggest', 'reject'),
  searchByText: safeMethod('searchByText', 'reject'),
  searchByCategory: safeMethod('searchByCategory', 'reject'),
  geocode: safeMethod('geocode', 'reject'),
  reverseGeocode: safeMethod('reverseGeocode', 'reject'),
  lookupPlace: safeMethod('lookupPlace', 'reject'),

  // ── Routing (HERE SDK RoutingEngine, all transport modes) ─────────────────
  calculateRouteWithOptions: safeMethod('calculateRouteWithOptions', 'reject'),

  // ── Debug ─────────────────────────────────────────────────────────────────
  isAvailable: () => !!NativeHereMapModule,
  nativeModule: NativeHereMapModule,
};

export default HereMapModule;