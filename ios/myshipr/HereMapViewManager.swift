import Foundation
import React

@objc(HereMapViewManager)
class HereMapViewManager: RCTViewManager {

    override func view() -> UIView! {
        return HereMapView()
    }

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
}