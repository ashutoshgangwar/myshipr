#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(HereMapModule, NSObject)

// ── SDK ────────────────────────────────────────────────────────────────────
RCT_EXTERN_METHOD(
  initSDK:(NSString *)accessKeyId
  secret:(NSString *)accessKeySecret
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

// ── Map lifecycle ──────────────────────────────────────────────────────────
RCT_EXTERN_METHOD(
  loadMap:(nonnull NSNumber *)viewTag options:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  setCenter:(nonnull NSNumber *)viewTag
  latitude:(double)latitude
  longitude:(double)longitude
  zoom:(double)zoom
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  drawRouteGeometry:(nonnull NSNumber *)viewTag options:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

// ── Map Camera ─────────────────────────────────────────────────────────────
RCT_EXTERN_METHOD(
  moveCamera:(nonnull NSNumber *)viewTag options:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  getCameraState:(nonnull NSNumber *)viewTag resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  resetNorth:(nonnull NSNumber *)viewTag resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

// ── Markers ────────────────────────────────────────────────────────────────
// addMarker({ lat, lng, color?, type? })
RCT_EXTERN_METHOD(
  addMarker:(nonnull NSNumber *)viewTag options:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  clearMarkers:(nonnull NSNumber *)viewTag resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

// ── Location Dot ───────────────────────────────────────────────────────────
RCT_EXTERN_METHOD(
  showCurrentLocation:(nonnull NSNumber *)viewTag options:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  hideCurrentLocation:(nonnull NSNumber *)viewTag resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

// ── Route ──────────────────────────────────────────────────────────────────
RCT_EXTERN_METHOD(
  drawRoute:(nonnull NSNumber *)viewTag options:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  clearRoute:(nonnull NSNumber *)viewTag resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  calculateRoute:(nonnull NSNumber *)viewTag options:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

// ── Navigation ─────────────────────────────────────────────────────────────
RCT_EXTERN_METHOD(
  startNavigation:(nonnull NSNumber *)viewTag options:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  stopNavigation:(nonnull NSNumber *)viewTag resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  simulateNavigation:(nonnull NSNumber *)viewTag options:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

// ── Navigation Marker (fire & forget — no promise) ─────────────────────────
RCT_EXTERN_METHOD(
  updateNavigationMarker:(nonnull NSNumber *)viewTag options:(NSDictionary *)options
)

RCT_EXTERN_METHOD(
  removeNavigationMarker:(nonnull NSNumber *)viewTag
)

// ── Navigation Camera ──────────────────────────────────────────────────────
RCT_EXTERN_METHOD(
  updateNavigationCamera:(nonnull NSNumber *)viewTag options:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  resetNavigationCamera:(nonnull NSNumber *)viewTag resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

// ── Polyline ───────────────────────────────────────────────────────────────
RCT_EXTERN_METHOD(
  drawPolyline:(nonnull NSNumber *)viewTag options:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  trimPolyline:(nonnull NSNumber *)viewTag options:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  clearPolyline:(nonnull NSNumber *)viewTag resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

// ── Search / geocoding / POI (HERE SDK SearchEngine) ───────────────────────
RCT_EXTERN_METHOD(
  suggest:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  searchByText:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  searchByCategory:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  geocode:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  reverseGeocode:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  lookupPlace:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

// ── Routing (HERE SDK RoutingEngine) ───────────────────────────────────────
RCT_EXTERN_METHOD(
  calculateRouteWithOptions:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

// ── Map styling & features ─────────────────────────────────────────────────
RCT_EXTERN_METHOD(
  setMapScheme:(nonnull NSNumber *)viewTag scheme:(NSString *)scheme
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  getMapScheme:(nonnull NSNumber *)viewTag resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  setMapFeatures:(nonnull NSNumber *)viewTag options:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  set3DBuildingsEnabled:(nonnull NSNumber *)viewTag enabled:(BOOL)enabled
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  getSupportedMapFeatures:(nonnull NSNumber *)viewTag resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

@end
