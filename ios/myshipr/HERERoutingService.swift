import Foundation

struct RouteSummary: Codable {
    let distance: Double?
    let travelTime: Double?
    let baseTravelTime: Double?
}

struct RoutePolyline: Codable {
    let type: String?
    let coordinates: [[Double]]?
}

struct HERERoute: Codable {
    let routes: [RouteDetails]?
}

struct RouteDetails: Codable {
    let id: String?
    let summary: RouteSummary?
    let polyline: RoutePolyline?
    let actions: [RouteAction]?
    let instructions: [RouteInstruction]?
}

struct RouteAction: Codable {
    let action: String?
    let instruction: String?
}

struct RouteInstruction: Codable {
    let duration: Double?
    let length: Double?
    let instruction: String?
}

class HERERoutingService {
    static let shared = HERERoutingService()
    private let session = URLSession.shared
    
    private init() {}
    
    /// Calculate truck route between origin and destination
    /// - Parameters:
    ///   - origin: Origin coordinates
    ///   - destination: Destination coordinates
    ///   - vehicle: Optional vehicle parameters (weight, height, width, length)
    /// - Returns: Route response with polyline and summary
    func calculateTruckRoute(
        origin: (latitude: Double, longitude: Double),
        destination: (latitude: Double, longitude: Double),
        vehicle: VehicleParameters? = nil
    ) async throws -> [String: Any] {
        guard let credentials = HERECredentialsManager.shared.loadCredentials() else {
            throw NSError(domain: "HERERouting", code: -1, userInfo: [NSLocalizedDescriptionKey: "HERE credentials not found"])
        }
        
        var components = URLComponents(string: "https://router.hereapi.com/v8/routes")!
        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "transportMode", value: "truck"),
            URLQueryItem(name: "routingMode", value: "fast"),
            URLQueryItem(name: "origin", value: "\(origin.latitude),\(origin.longitude)"),
            URLQueryItem(name: "destination", value: "\(destination.latitude),\(destination.longitude)"),
            URLQueryItem(name: "return", value: "summary,polyline,actions,instructions"),
            URLQueryItem(name: "apiKey", value: credentials.apiKey)
        ]
        
        if let vehicle = vehicle {
            if let weight = vehicle.currentWeight {
                queryItems.append(URLQueryItem(name: "vehicle[currentWeight]", value: String(weight)))
            }
            if let height = vehicle.height {
                queryItems.append(URLQueryItem(name: "vehicle[height]", value: String(height)))
            }
            if let width = vehicle.width {
                queryItems.append(URLQueryItem(name: "vehicle[width]", value: String(width)))
            }
            if let length = vehicle.length {
                queryItems.append(URLQueryItem(name: "vehicle[length]", value: String(length)))
            }
        }
        
        components.queryItems = queryItems
        
        guard let url = components.url else {
            throw NSError(domain: "HERERouting", code: -2, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])
        }
        
        let (data, response) = try await session.data(from: url)
        
        guard (response as? HTTPURLResponse)?.statusCode == 200 else {
            let errorText = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw NSError(domain: "HERERouting", code: -3, userInfo: [NSLocalizedDescriptionKey: "HERE route error: \(errorText)"])
        }
        
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw NSError(domain: "HERERouting", code: -4, userInfo: [NSLocalizedDescriptionKey: "Invalid JSON response"])
        }
        
        return json
    }
    
    /// Calculate toll fees for a route
    /// - Parameters:
    ///   - origin: Origin coordinates
    ///   - destination: Destination coordinates
    ///   - currency: Currency code (default: USD)
    /// - Returns: Toll information
    func calculateRouteTolls(
        origin: (latitude: Double, longitude: Double),
        destination: (latitude: Double, longitude: Double),
        currency: String = "USD"
    ) async throws -> [String: Any] {
        guard let credentials = HERECredentialsManager.shared.loadCredentials() else {
            throw NSError(domain: "HERETolls", code: -1, userInfo: [NSLocalizedDescriptionKey: "HERE credentials not found"])
        }
        
        var components = URLComponents(string: "https://router.hereapi.com/v8/routes")!
        components.queryItems = [
            URLQueryItem(name: "origin", value: "\(origin.latitude),\(origin.longitude)"),
            URLQueryItem(name: "destination", value: "\(destination.latitude),\(destination.longitude)"),
            URLQueryItem(name: "transportMode", value: "truck"),
            URLQueryItem(name: "routingMode", value: "fast"),
            URLQueryItem(name: "return", value: "tolls"),
            URLQueryItem(name: "currency", value: currency),
            URLQueryItem(name: "apiKey", value: credentials.apiKey)
        ]
        
        guard let url = components.url else {
            throw NSError(domain: "HERETolls", code: -2, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])
        }
        
        let (data, response) = try await session.data(from: url)
        
        guard (response as? HTTPURLResponse)?.statusCode == 200 else {
            throw NSError(domain: "HERETolls", code: -3, userInfo: [NSLocalizedDescriptionKey: "HTTP error"])
        }
        
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw NSError(domain: "HERETolls", code: -4, userInfo: [NSLocalizedDescriptionKey: "Invalid JSON response"])
        }
        
        return json
    }
    
    /// Find optimal sequence of waypoints
    /// - Parameter params: Parameters for sequence calculation
    /// - Returns: Optimized sequence
    func findSequence(params: [String: String]) async throws -> [String: Any] {
        guard let credentials = HERECredentialsManager.shared.loadCredentials() else {
            throw NSError(domain: "HERESequence", code: -1, userInfo: [NSLocalizedDescriptionKey: "HERE credentials not found"])
        }
        
        var queryItems: [URLQueryItem] = []
        for (key, value) in params {
            queryItems.append(URLQueryItem(name: key, value: value))
        }
        queryItems.append(URLQueryItem(name: "apiKey", value: credentials.apiKey))
        
        var components = URLComponents(string: "https://wps.hereapi.com/v8/findsequence2")!
        components.queryItems = queryItems
        
        guard let url = components.url else {
            throw NSError(domain: "HERESequence", code: -2, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])
        }
        
        let (data, response) = try await session.data(from: url)
        
        guard (response as? HTTPURLResponse)?.statusCode == 200 else {
            throw NSError(domain: "HERESequence", code: -3, userInfo: [NSLocalizedDescriptionKey: "HTTP error"])
        }
        
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw NSError(domain: "HERESequence", code: -4, userInfo: [NSLocalizedDescriptionKey: "Invalid JSON response"])
        }
        
        return json
    }
}

struct VehicleParameters {
    let currentWeight: Int?  // in kg
    let height: Int?         // in cm
    let width: Int?          // in cm
    let length: Int?         // in cm
}
