#import <React/RCTViewManager.h>
#import <React/RCTLog.h>
#import <React/RCTUIManager.h>

// HERE SDK Map View Manager - manages the HereMapContainer which wraps HERE SDK MapView

@interface HereMapViewManager : RCTViewManager
@end

@implementation HereMapViewManager

RCT_EXPORT_MODULE(HereMapView)

- (UIView *)view {
  // Import the HereMapContainer class which handles HERE SDK initialization
  // This uses Swift but can be called from Objective-C
  
  // Try multiple class name variations (Swift module naming)
  NSArray *classNames = @[
    @"myshipr.HereMapContainer",
    @"HereMapContainer",
    @"_TtC7myshiprN18HereMapContainerE",  // Mangled Swift name (less common)
  ];
  
  Class containerClass = nil;
  
  for (NSString *className in classNames) {
    containerClass = NSClassFromString(className);
    if (containerClass) {
      RCTLogInfo(@"[HereMapViewManager] ✅ Found HereMapContainer as: %@", className);
      break;
    }
  }
  
  if (!containerClass) {
    RCTLogError(@"[HereMapViewManager] ❌ HereMapContainer class not found!");
    RCTLogError(@"[HereMapViewManager] Ensure:");
    RCTLogError(@"  1. myshipr-Bridging-Header.h exists in build settings");
    RCTLogError(@"  2. HEREMapView.swift is added to target and contains HereMapContainer");
    RCTLogError(@"  3. Module is set to 'myshipr' in build settings");
    
    // Return error view
    UIView *errorView = [[UIView alloc] initWithFrame:CGRectZero];
    errorView.backgroundColor = [UIColor colorWithRed:0.95 green:0.95 blue:0.95 alpha:1];
    
    UILabel *label = [[UILabel alloc] init];
    label.text = @"Map Framework Error\n(HereMapContainer not found)";
    label.numberOfLines = 0;
    label.textAlignment = NSTextAlignmentCenter;
    label.textColor = [UIColor darkGrayColor];
    label.font = [UIFont systemFontOfSize:12];
    label.translatesAutoresizingMaskIntoConstraints = NO;
    [errorView addSubview:label];
    
    [errorView addConstraints:@[
      [NSLayoutConstraint constraintWithItem:label
                                   attribute:NSLayoutAttributeCenterX
                                   relatedBy:NSLayoutRelationEqual
                                      toItem:errorView
                                   attribute:NSLayoutAttributeCenterX
                                  multiplier:1.0
                                    constant:0],
      [NSLayoutConstraint constraintWithItem:label
                                   attribute:NSLayoutAttributeCenterY
                                   relatedBy:NSLayoutRelationEqual
                                      toItem:errorView
                                   attribute:NSLayoutAttributeCenterY
                                  multiplier:1.0
                                    constant:0],
    ]];
    
    return errorView;
  }
  
  UIView *container = [[containerClass alloc] initWithFrame:CGRectZero];
  if (container) {
    RCTLogInfo(@"[HereMapViewManager] ✅ Created HereMapContainer instance");
    return container;
  } else {
    RCTLogError(@"[HereMapViewManager] ❌ Failed to allocate HereMapContainer instance");
    return nil;
  }
}

RCT_EXPORT_VIEW_PROPERTY(centerLat, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(centerLng, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(zoomLevel, NSNumber)

@end

