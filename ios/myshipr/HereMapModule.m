#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(HereMapModule, NSObject)

RCT_EXTERN_METHOD(
  initSDK:(NSString *)accessKeyId
  secret:(NSString *)accessKeySecret
  resolver:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

@end
