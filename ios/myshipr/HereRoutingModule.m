#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(HereRoutingModule, NSObject)

RCT_EXTERN_METHOD(
  calculateCarRoute:(double)originLat
  originLng:(double)originLng
  destLat:(double)destLat
  destLng:(double)destLng
  options:(NSDictionary *)options
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  calculateTruckRoute:(double)originLat
  originLng:(double)originLng
  destLat:(double)destLat
  destLng:(double)destLng
  truckOptions:(NSDictionary *)truckOptions
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  calculateEVRoute:(double)originLat
  originLng:(double)originLng
  destLat:(double)destLat
  destLng:(double)destLng
  evOptions:(NSDictionary *)evOptions
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  releaseRoute:(NSString *)routeId
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

@end
