import Foundation

@objcMembers
class HERECredentials: NSObject {
    @objc static func accessKeyId() -> String? { return Bundle.main.infoDictionary?["HERE_ACCESS_KEY_ID"] as? String }
    @objc static func accessKeySecret() -> String? { return Bundle.main.infoDictionary?["HERE_ACCESS_KEY_SECRET"] as? String }
}
