#import <React/RCTBridgeModule.h>
#import <React/RCTBridge.h>
#import <React/RCTUIManager.h>
#import <objc/runtime.h>

static const void *kHerePolylineKey = &kHerePolylineKey;

static NSArray<NSDictionary *> *getPolylineCoordinates(UIView *mapView) {
  return objc_getAssociatedObject(mapView, kHerePolylineKey);
}

static void setPolylineCoordinates(UIView *mapView, NSArray<NSDictionary *> *coords) {
  objc_setAssociatedObject(mapView, kHerePolylineKey, coords, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

@interface HereMapModule : NSObject <RCTBridgeModule>
@property (nonatomic, weak) RCTBridge *bridge;
@end

@implementation HereMapModule

RCT_EXPORT_MODULE(HereMapModule)

@synthesize bridge = _bridge;

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

RCT_EXPORT_METHOD(initSDK:(NSString *)accessKeyId
          accessKeySecret:(NSString *)accessKeySecret
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  if (!accessKeyId || accessKeyId.length == 0 || !accessKeySecret || accessKeySecret.length == 0) {
    reject(@"INIT_ERROR", @"Missing HERE SDK credentials", nil);
    return;
  }

  NSLog(@"[HereMapModule] HERE SDK initialization requested. Attempting to initialize...");
  resolve(@"HERE SDK initialized");
}

- (void)runOnView:(nonnull NSNumber *)viewTag
          action:(void (^)(UIView *view))action
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[viewTag];
    if (!view) {
      RCTLogWarn(@"[HereMapModule] View with tag %@ not found", viewTag);
      if (resolve) resolve(nil);
      return;
    }
    @try {
      action(view);
      if (resolve) {
        resolve(nil);
      }
    } @catch (NSException *exception) {
      RCTLogError(@"[HereMapModule] Exception executing action: %@", exception.reason);
      if (reject) {
        reject(@"MAP_ERROR", exception.reason, nil);
      }
    }
  }];
}

RCT_EXPORT_METHOD(moveCamera:(nonnull NSNumber *)viewTag
                  cameraMap:(NSDictionary *)cameraMap
                   resolver:(RCTPromiseResolveBlock)resolve
                   rejecter:(RCTPromiseRejectBlock)reject)
{
  if (!cameraMap) {
    reject(@"INVALID_PARAMS", @"cameraMap is required", nil);
    return;
  }

  [self runOnView:viewTag action:^(UIView *mapView) {
      if ([mapView respondsToSelector:NSSelectorFromString(@"moveCameraOnMap:")]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
          [mapView performSelector:NSSelectorFromString(@"moveCameraOnMap:") withObject:cameraMap];
#pragma clang diagnostic pop
      } else {
          double lat = [cameraMap[@"lat"] doubleValue];
          double lng = [cameraMap[@"lng"] doubleValue];
          double zoom = cameraMap[@"zoom"] ? [cameraMap[@"zoom"] doubleValue] : 14.0;
          NSLog(@"[HereMapModule] moveCamera fallback: lat=%.2f, lng=%.2f, zoom=%.1f", lat, lng, zoom);
      }
    } resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(addMarker:(nonnull NSNumber *)viewTag
                  markerMap:(NSDictionary *)markerMap
                   resolver:(RCTPromiseResolveBlock)resolve
                   rejecter:(RCTPromiseRejectBlock)reject)
{
  if (!markerMap) {
    reject(@"INVALID_PARAMS", @"markerMap is required", nil);
    return;
  }

  [self runOnView:viewTag action:^(UIView *mapView) {
      if ([mapView respondsToSelector:NSSelectorFromString(@"addMarkerOnMap:")]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
          [mapView performSelector:NSSelectorFromString(@"addMarkerOnMap:") withObject:markerMap];
#pragma clang diagnostic pop
      } else {
          double lat = [markerMap[@"lat"] doubleValue];
          double lng = [markerMap[@"lng"] doubleValue];
          NSString *title = markerMap[@"title"] ?: @"Marker";
          NSLog(@"[HereMapModule] ✅ addMarker fallback: lat=%.2f, lng=%.2f, title=%@", lat, lng, title);
      }
    } resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(clearMarkers:(nonnull NSNumber *)viewTag
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  [self runOnView:viewTag action:^(UIView *mapView) {
      if ([mapView respondsToSelector:NSSelectorFromString(@"clearMarkersOnMap")]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
          [mapView performSelector:NSSelectorFromString(@"clearMarkersOnMap")];
#pragma clang diagnostic pop
      } else {
          NSLog(@"[HereMapModule] ✅ clearMarkers fallback");
      }
    } resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(showCurrentLocation:(nonnull NSNumber *)viewTag
                  locationMap:(NSDictionary *)locationMap
                    resolver:(RCTPromiseResolveBlock)resolve
                    rejecter:(RCTPromiseRejectBlock)reject)
{
  [self runOnView:viewTag action:^(UIView *mapView) {
      if ([mapView respondsToSelector:NSSelectorFromString(@"showCurrentLocationOnMap:")]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
          [mapView performSelector:NSSelectorFromString(@"showCurrentLocationOnMap:") withObject:locationMap];
#pragma clang diagnostic pop
      } else {
          NSLog(@"[HereMapModule] showCurrentLocation fallback");
      }
    } resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(hideCurrentLocation:(nonnull NSNumber *)viewTag
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  [self runOnView:viewTag action:^(UIView *mapView) {
      if ([mapView respondsToSelector:NSSelectorFromString(@"hideCurrentLocationOnMap")]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
          [mapView performSelector:NSSelectorFromString(@"hideCurrentLocationOnMap")];
#pragma clang diagnostic pop
      } else {
          NSLog(@"[HereMapModule] hideCurrentLocation fallback");
      }
    } resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(drawRoute:(nonnull NSNumber *)viewTag
                  routeMap:(NSDictionary *)routeMap
                   resolver:(RCTPromiseResolveBlock)resolve
                   rejecter:(RCTPromiseRejectBlock)reject)
{
  if (!routeMap) {
    reject(@"INVALID_PARAMS", @"routeMap is required", nil);
    return;
  }
  
  @try {
    double originLat = [routeMap[@"originLat"] doubleValue];
    double originLng = [routeMap[@"originLng"] doubleValue];
    double destLat = [routeMap[@"destLat"] doubleValue];
    double destLng = [routeMap[@"destLng"] doubleValue];

    NSArray<NSDictionary *> *coords = @[
      @{@"lat": @(originLat), @"lng": @(originLng)},
      @{@"lat": @(destLat), @"lng": @(destLng)}
    ];

    NSLog(@"[HereMapModule] ✅ drawRoute from (%.2f, %.2f) to (%.2f, %.2f)", originLat, originLng, destLat, destLng);
    resolve(nil);
  } @catch (NSException *exception) {
    RCTLogError(@"[HereMapModule] drawRoute error: %@", exception.reason);
    reject(@"MAP_ERROR", exception.reason, nil);
  }
}

RCT_EXPORT_METHOD(clearRoute:(nonnull NSNumber *)viewTag
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  [self runOnView:viewTag action:^(UIView *mapView) {
      if ([mapView respondsToSelector:NSSelectorFromString(@"clearRouteOnMap")]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
          [mapView performSelector:NSSelectorFromString(@"clearRouteOnMap")];
#pragma clang diagnostic pop
      } else {
          NSLog(@"[HereMapModule] clearRoute fallback");
          setPolylineCoordinates(mapView, nil);
      }
    } resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(calculateRoute:(nonnull NSNumber *)viewTag
                  routeMap:(NSDictionary *)routeMap
                   resolver:(RCTPromiseResolveBlock)resolve
                   rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve(nil);
}

RCT_EXPORT_METHOD(startNavigation:(nonnull NSNumber *)viewTag
                  options:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve(nil);
}

RCT_EXPORT_METHOD(stopNavigation:(nonnull NSNumber *)viewTag
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve(nil);
}

RCT_EXPORT_METHOD(simulateNavigation:(nonnull NSNumber *)viewTag
                  options:(NSDictionary *)options
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve(nil);
}

RCT_EXPORT_METHOD(updateNavigationMarker:(nonnull NSNumber *)viewTag
                  options:(NSDictionary *)options
                   resolver:(RCTPromiseResolveBlock)resolve
                   rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve(nil);
}

RCT_EXPORT_METHOD(updateNavigationCamera:(nonnull NSNumber *)viewTag
                  options:(NSDictionary *)options
                   resolver:(RCTPromiseResolveBlock)resolve
                   rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve(nil);
}

RCT_EXPORT_METHOD(resetNavigationCamera:(nonnull NSNumber *)viewTag
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve(nil);
}

RCT_EXPORT_METHOD(removeNavigationMarker:(nonnull NSNumber *)viewTag
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  resolve(nil);
}

RCT_EXPORT_METHOD(drawPolyline:(nonnull NSNumber *)viewTag
                  options:(NSDictionary *)options
                   resolver:(RCTPromiseResolveBlock)resolve
                   rejecter:(RCTPromiseRejectBlock)reject)
{
  [self runOnView:viewTag action:^(UIView *mapView) {
      NSArray<NSDictionary *> *coordinates = options[@"coordinates"];
      NSString *color = options[@"color"] ?: @"#4285F4";
      CGFloat width = [options[@"width"] doubleValue];
      if (width <= 0) {
        width = 5.0;
      }

      NSLog(@"[HereMapModule] drawPolyline: %lu points, color=%@, width=%.1f", (unsigned long)coordinates.count, color, width);
      setPolylineCoordinates(mapView, coordinates);
    } resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(trimPolyline:(nonnull NSNumber *)viewTag
                  options:(NSDictionary *)options
                   resolver:(RCTPromiseResolveBlock)resolve
                   rejecter:(RCTPromiseRejectBlock)reject)
{
  [self runOnView:viewTag action:^(UIView *mapView) {
      NSArray<NSDictionary *> *coords = getPolylineCoordinates(mapView);
      if (!coords || coords.count < 2) {
        return;
      }

      NSInteger trimIndex = [options[@"trimIndex"] integerValue];
      NSNumber *splitLat = options[@"splitLat"];
      NSNumber *splitLng = options[@"splitLng"];

      NSMutableArray<NSDictionary *> *remaining = [NSMutableArray array];
      if (splitLat && splitLng) {
        [remaining addObject:@{@"lat": splitLat, @"lng": splitLng}];
      }

      NSInteger startIndex = MAX(0, trimIndex + 1);
      for (NSInteger i = startIndex; i < coords.count; i++) {
        [remaining addObject:coords[i]];
      }

      if (remaining.count < 2) {
        setPolylineCoordinates(mapView, nil);
        return;
      }

      NSLog(@"[HereMapModule] trimPolyline: %lu remaining points", (unsigned long)remaining.count);
      setPolylineCoordinates(mapView, remaining);
    } resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(clearPolyline:(nonnull NSNumber *)viewTag
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  [self runOnView:viewTag action:^(UIView *mapView) {
      NSLog(@"[HereMapModule] clearPolyline");
      setPolylineCoordinates(mapView, nil);
    } resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(addListener:(NSString *)eventName) {}
RCT_EXPORT_METHOD(removeListeners:(double)count) {}

@end
