#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(HEREBridge, NSObject)

RCT_EXTERN_METHOD(
  autosuggest:(NSString *)query
  latitude:(NSNumber *)latitude
  longitude:(NSNumber *)longitude
  limit:(NSNumber *)limit
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  lookup:(NSString *)placeId
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  calculateTruckRoute:(NSNumber *)originLat
  originLng:(NSNumber *)originLng
  destLat:(NSNumber *)destLat
  destLng:(NSNumber *)destLng
  vehicle:(NSDictionary *)vehicle
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  calculateRouteTolls:(NSNumber *)originLat
  originLng:(NSNumber *)originLng
  destLat:(NSNumber *)destLat
  destLng:(NSNumber *)destLng
  currency:(NSString *)currency
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  searchLocationsByText:(NSString *)searchText
  countryFilter:(NSString *)countryFilter
  language:(NSString *)language
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  reverseGeocode:(NSNumber *)latitude
  longitude:(NSNumber *)longitude
  language:(NSString *)language
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

@end
