import Foundation

#if canImport(heresdk)
import heresdk
#endif

/// Keeps calculated routes alive natively and hands JS a string id for them.
///
/// A HERE `Route` cannot cross the bridge, but navigation needs the exact
/// object routing produced — so routing stores it here and returns `routeId`,
/// and `HereNavigation.startNavigation(routeId)` looks it back up.
///
/// Bounded, so a screen that recalculates on every GPS fix cannot leak routes:
/// the least recently *used* entry is evicted first.
///
/// iOS counterpart of `android/.../heremap/RouteStore.kt`.
final class HereRouteStore {

    static let shared = HereRouteStore()

    private let maxEntries = 10
    private let lock = NSLock()
    private var counter: Int = 0
    private var lastRouteId: String?

#if canImport(heresdk)
    private var routes: [String: Route] = [:]
    /// Most-recently-used last; the head is evicted when the store is full.
    private var usageOrder: [String] = []

    @discardableResult
    func put(_ route: Route) -> String {
        lock.lock(); defer { lock.unlock() }

        counter += 1
        let id = "route-\(counter)"
        routes[id] = route
        touch(id)
        lastRouteId = id

        while usageOrder.count > maxEntries, let oldest = usageOrder.first {
            usageOrder.removeFirst()
            routes.removeValue(forKey: oldest)
        }
        return id
    }

    /// Resolves `routeId`, falling back to the most recent route when nil/empty.
    func get(_ routeId: String?) -> Route? {
        lock.lock(); defer { lock.unlock() }

        let key = (routeId?.isEmpty == false) ? routeId! : (lastRouteId ?? "")
        guard let route = routes[key] else { return nil }
        touch(key)
        return route
    }

    /// The id `get` would resolve — `routeId` itself, or the most recent one
    /// when it is nil. Lets a caller that accepted "<latest>" report back the
    /// concrete id it ended up using.
    func resolveId(_ routeId: String?) -> String? {
        lock.lock(); defer { lock.unlock() }

        let key = (routeId?.isEmpty == false) ? routeId! : (lastRouteId ?? "")
        return routes[key] != nil ? key : nil
    }

    func remove(_ routeId: String) {
        lock.lock(); defer { lock.unlock() }
        routes.removeValue(forKey: routeId)
        usageOrder.removeAll { $0 == routeId }
        if lastRouteId == routeId { lastRouteId = usageOrder.last }
    }

    func clear() {
        lock.lock(); defer { lock.unlock() }
        routes.removeAll()
        usageOrder.removeAll()
        lastRouteId = nil
    }

    private func touch(_ id: String) {
        usageOrder.removeAll { $0 == id }
        usageOrder.append(id)
    }
#else
    func clear() {}
#endif
}
