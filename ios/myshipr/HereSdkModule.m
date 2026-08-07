#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(HereSdkModule, NSObject)

RCT_EXTERN_METHOD(
  initialize:(NSString *)accessKeyId
  accessKeySecret:(NSString *)accessKeySecret
  scope:(NSString *)scope
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  isInitialized:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  checkMapDataAccess:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  dispose:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

@end
