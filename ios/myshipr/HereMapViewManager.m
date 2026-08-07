#import <React/RCTViewManager.h>

@interface RCT_EXTERN_MODULE(
    HereMapViewManager,
    RCTViewManager
)

// ── Map interaction events ─────────────────────────────────────────────────
// Payload: { latitude, longitude, x, y }; onPoiTap adds { name, categoryId }.
RCT_EXPORT_VIEW_PROPERTY(onMapTap, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onMapLongPress, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onPoiTap, RCTDirectEventBlock)
// Fired when the scene or the SDK fails: { code, message }.
RCT_EXPORT_VIEW_PROPERTY(onMapError, RCTDirectEventBlock)

// ── Camera props ───────────────────────────────────────────────────────────
RCT_EXPORT_VIEW_PROPERTY(centerLat, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(centerLng, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(zoomLevel, NSNumber)

// ── Map styling props ──────────────────────────────────────────────────────
RCT_EXPORT_VIEW_PROPERTY(mapScheme, NSString)
RCT_EXPORT_VIEW_PROPERTY(buildings3D, BOOL)

@end
