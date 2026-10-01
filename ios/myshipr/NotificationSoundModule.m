#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(NotificationSoundModule, NSObject)

RCT_EXTERN_METHOD(play)

RCT_EXTERN_METHOD(playNamed:(NSString *)name)

@end
