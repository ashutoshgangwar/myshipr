import Foundation

#if canImport(heresdk)
import heresdk
#endif

// Define these here since Swift can't see RCTBridgeModule.h directly
typealias RCTPromiseResolveBlock = (Any?) -> Void
typealias RCTPromiseRejectBlock = (String?, String?, Error?) -> Void

@objc(HereMapModule)
class HereMapModule: NSObject {

    private var sdkInitialized = false

    @objc(initSDK:secret:resolver:rejecter:)
    func initSDK(
        _ accessKeyId: String,
        secret accessKeySecret: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {

#if canImport(heresdk)
        if sdkInitialized {
            resolve(true)
            return
        }

        let authenticationMode = AuthenticationMode.withKeySecret(
            accessKeyId: accessKeyId,
            accessKeySecret: accessKeySecret
        )

        let options = SDKOptions(
            authenticationMode: authenticationMode
        )

        do {
            try SDKNativeEngine.makeSharedInstance(
                options: options
            )

            sdkInitialized = true
            print("✅ HERE SDK Initialized")
            resolve(true)
        } catch {
            reject(
                "INIT_ERROR",
                "Failed to initialize HERE SDK",
                error
            )
        }
#else
        reject(
            "SDK_MISSING",
            "HERE SDK is not embedded in the Xcode project. Add heresdk.xcframework to ios/Frameworks and set to Embed & Sign.",
            nil
        )
#endif
    }

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}
