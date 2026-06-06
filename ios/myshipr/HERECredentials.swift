import Foundation

struct HERECredentials {
    let accessKeyID: String
    let accessKeySecret: String
    let apiKey: String
}

class HERECredentialsManager {
    static let shared = HERECredentialsManager()
    
    private init() {}
    
    func loadCredentials() -> HERECredentials? {
        guard let infoPlist = Bundle.main.infoDictionary else {
            print("❌ Failed to load Info.plist")
            return nil
        }
        
        guard let accessKeyID = infoPlist["HERE_ACCESS_KEY_ID"] as? String,
              let accessKeySecret = infoPlist["HERE_ACCESS_KEY_SECRET"] as? String,
              let apiKey = infoPlist["HERE_API_KEY"] as? String else {
            print("❌ HERE credentials not found in Info.plist")
            return nil
        }
        
        return HERECredentials(
            accessKeyID: accessKeyID,
            accessKeySecret: accessKeySecret,
            apiKey: apiKey
        )
    }
}
