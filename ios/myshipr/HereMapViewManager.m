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

// ── Map styling props ──────────────────────────────────────────────────────
RCT_EXPORT_VIEW_PROPERTY(mapScheme, NSString)
RCT_EXPORT_VIEW_PROPERTY(buildings3D, BOOL)

@end
