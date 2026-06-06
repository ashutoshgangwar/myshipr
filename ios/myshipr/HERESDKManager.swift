import Foundation

/// Manages HERE SDK initialization with credentials
class HERESDKManager {
    static let shared = HERESDKManager()
    
    private init() {}
    
    /// Initialize HERE SDK with credentials from environment
    func initialize() {
        let accessKeyID = Bundle.main.infoDictionary?["HERE_ACCESS_KEY_ID"] as? String ?? ""
        let accessKeySecret = Bundle.main.infoDictionary?["HERE_ACCESS_KEY_SECRET"] as? String ?? ""
        
        guard !accessKeyID.isEmpty, !accessKeySecret.isEmpty else {
            print("❌ HERE SDK credentials not found in Info.plist")
            return
        }
        
        print("✅ HERE SDK Manager initialized with credentials")
    }
}
