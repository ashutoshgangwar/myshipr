import Foundation
import UIKit

@objcMembers
public class HERESDKManager: NSObject {
    @objc public static let shared = HERESDKManager()
    private override init() { super.init() }

    @objc public func initialize() {
        // Placeholder: actual implementation lives in HERESDKInitializer
        print("[HERESDKManager] placeholder initialize called")
    }

    @objc public func dispose() {
        // Placeholder dispose
        print("[HERESDKManager] placeholder dispose called")
    }
}
