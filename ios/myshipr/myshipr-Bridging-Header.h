#ifndef myshipr_Bridging_Header_h
#define myshipr_Bridging_Header_h

#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>
#import <React/RCTUIManager.h>
// Deep links. RCTLinkingManager is what turns an incoming URL — custom scheme
// or Universal Link — into the JS `url` event that DeepLinkService listens for.
// It is not part of the React Swift module, so AppDelegate reaches it here.
#import <React/RCTLinkingManager.h>

#endif /* myshipr_Bridging_Header_h */