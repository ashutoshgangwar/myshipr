import Foundation
import React

#if canImport(heresdk)
import heresdk
#endif

/// Owns the lifetime of the shared `SDKNativeEngine`.
///
/// iOS counterpart of `android/.../heremap/HereSdkModule.kt` — same method
/// names, same resolved shapes, so `src/here/HereSdk.js` drives both platforms
/// without branching.
@objc(HereSdkModule)
class HereSdkModule: NSObject {

    /// The Optimized Client Map — the only catalog the Navigate edition renders
    /// from. Used by the entitlement probe below.
    private static let ocmCatalogHrn = "hrn:here:data::olp-here:ocm"
    private static let httpForbidden = 403

    /// True once the shared engine exists.
    static func isReady() -> Bool {
#if canImport(heresdk)
        return SDKNativeEngine.sharedInstance != nil
#else
        return false
#endif
    }

    // MARK: - Lifecycle

    /// Resolves `true` when this call created the engine, `false` when it
    /// already existed, so repeated calls are safe.
    @objc(initialize:accessKeySecret:scope:resolver:rejecter:)
    func initialize(
        _ accessKeyId: String,
        accessKeySecret: String,
        scope: NSString?,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
#if canImport(heresdk)
        if Self.isReady() {
            resolve(false)
            return
        }
        guard !accessKeyId.isEmpty, !accessKeySecret.isEmpty else {
            reject("INVALID_ARGS", "accessKeyId and accessKeySecret are required", nil)
            return
        }

        let authMode = AuthenticationMode.withKeySecret(
            accessKeyId: accessKeyId,
            accessKeySecret: accessKeySecret
        )
        var options = SDKOptions(authenticationMode: authMode)
        // Credentials issued inside a HERE project only carry that project's
        // entitlements when the scope is set; without it the map-data catalog
        // answers 403 and the base map stays blank while routing still works.
        if let scope = scope as String?, !scope.isEmpty {
            options.scope = scope
        }

        do {
            try SDKNativeEngine.makeSharedInstance(options: options)
            resolve(true)
        } catch {
            reject("HERE_INIT_ERROR", "HERE SDK initialisation failed", error)
        }
#else
        reject("SDK_MISSING", "HERE SDK is not embedded in the Xcode project", nil)
#endif
    }

    @objc(isInitialized:rejecter:)
    func isInitialized(
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        resolve(Self.isReady())
    }

    /// Releases the engine. Navigation is stopped and cached routes dropped
    /// first — tearing the engine down under a live `VisualNavigator` crashes
    /// inside the SDK.
    @objc(dispose:rejecter:)
    func dispose(
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
#if canImport(heresdk)
        DispatchQueue.main.async {
            HereNavigationModule.shared?.releaseForShutdown()
            HereRouteStore.shared.clear()
            SDKNativeEngine.sharedInstance = nil
            resolve(true)
        }
#else
        resolve(false)
#endif
    }

    // MARK: - Map data entitlement

    /// Answers whether these credentials may read the map-data catalog the
    /// Navigate edition renders from.
    ///
    /// The SDK gives no callback for this: an unlicensed catalog simply draws
    /// nothing, so the map looks broken while routing keeps working. Only an
    /// explicit 403 is reported as "no access" — any other outcome resolves
    /// `hasMapDataAccess: true` rather than blame the licence for a network
    /// blip.
    @objc(checkMapDataAccess:rejecter:)
    func checkMapDataAccess(
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
#if canImport(heresdk)
        guard let engine = SDKNativeEngine.sharedInstance else {
            resolve(Self.unknownAccessResult())
            return
        }

        DispatchQueue.global(qos: .utility).async {
            guard let token = try? Authentication.authenticate(sdkNativeEngine: engine).token else {
                resolve(Self.unknownAccessResult())
                return
            }

            guard let url = URL(
                string: "https://config.data.api.platform.here.com/config/v1/catalogs/\(Self.ocmCatalogHrn)"
            ) else {
                resolve(Self.unknownAccessResult())
                return
            }

            var request = URLRequest(url: url, timeoutInterval: 10)
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

            URLSession.shared.dataTask(with: request) { _, response, _ in
                let status = (response as? HTTPURLResponse)?.statusCode ?? 0
                if status == Self.httpForbidden {
                    resolve([
                        "hasMapDataAccess": false,
                        "httpStatus": status,
                        "message":
                            "These HERE credentials cannot read the map data catalog "
                            + "(\(Self.ocmCatalogHrn)), so the base map cannot render. "
                            + "Routing and guidance still work. Check that the key pair "
                            + "is licensed for HERE SDK Navigate, and that HERE_SCOPE is "
                            + "set when the credentials belong to a HERE project.",
                    ])
                } else {
                    resolve([
                        "hasMapDataAccess": true,
                        "httpStatus": status,
                        "message": NSNull(),
                    ])
                }
            }.resume()
        }
#else
        resolve(Self.unknownAccessResult())
#endif
    }

    private static func unknownAccessResult() -> [String: Any] {
        ["hasMapDataAccess": true, "httpStatus": 0, "message": NSNull()]
    }

    @objc static func requiresMainQueueSetup() -> Bool { false }
}
