import Foundation

struct AutosuggestItem {
    let id: String
    let title: String
    let address: String
    let latitude: Double?
    let longitude: Double?
    let access: [AccessPoint]?
}

struct AccessPoint: Codable {
    let lat: Double
    let lng: Double
}

struct AutosuggestResponse: Codable {
    let items: [AutosuggestItemResponse]?
}

struct AutosuggestItemResponse: Codable {
    let id: String
    let title: String
    let address: AddressResponse?
    let position: PositionResponse?
    let access: [AccessPoint]?
}

struct AddressResponse: Codable {
    let label: String?
}

struct PositionResponse: Codable {
    let lat: Double?
    let lng: Double?
}

class HEREAutosuggestService {
    static let shared = HEREAutosuggestService()
    private let session = URLSession.shared
    
    private init() {}
    
    /// Fetch autocomplete suggestions from HERE API
    /// - Parameters:
    ///   - query: Search query string
    ///   - coordinates: Optional coordinates to bias search
    ///   - limit: Maximum number of results
    /// - Returns: Array of AutosuggestItem
    func autosuggest(
        query: String,
        coordinates: (latitude: Double, longitude: Double)? = nil,
        limit: Int = 5
    ) async throws -> [AutosuggestItem] {
        guard let credentials = HERECredentialsManager.shared.loadCredentials() else {
            throw NSError(domain: "HEREAutosuggest", code: -1, userInfo: [NSLocalizedDescriptionKey: "HERE credentials not found"])
        }
        
        guard !query.trimmingCharacters(in: .whitespaces).isEmpty else {
            return []
        }
        
        let at: String
        if let coords = coordinates, !coords.latitude.isNaN, !coords.longitude.isNaN {
            at = "\(coords.latitude),\(coords.longitude)"
        } else {
            at = "0,0"
        }
        
        var components = URLComponents(string: "https://autosuggest.search.hereapi.com/v1/autosuggest")!
        components.queryItems = [
            URLQueryItem(name: "q", value: query),
            URLQueryItem(name: "at", value: at),
            URLQueryItem(name: "limit", value: String(limit)),
            URLQueryItem(name: "apiKey", value: credentials.apiKey)
        ]
        
        guard let url = components.url else {
            throw NSError(domain: "HEREAutosuggest", code: -2, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])
        }
        
        let (data, response) = try await session.data(from: url)
        
        guard (response as? HTTPURLResponse)?.statusCode == 200 else {
            throw NSError(domain: "HEREAutosuggest", code: -3, userInfo: [NSLocalizedDescriptionKey: "HTTP error"])
        }
        
        let decodedResponse = try JSONDecoder().decode(AutosuggestResponse.self, from: data)
        
        let items = (decodedResponse.items ?? [])
            .compactMap { item -> AutosuggestItem? in
                let latitude = item.position?.lat
                let longitude = item.position?.lng
                
                // Filter: must have coordinates or access points
                if (latitude == nil || longitude == nil) && (item.access?.isEmpty ?? true) {
                    return nil
                }
                
                return AutosuggestItem(
                    id: item.id,
                    title: item.title,
                    address: item.address?.label ?? item.title,
                    latitude: latitude,
                    longitude: longitude,
                    access: item.access
                )
            }
        
        return items
    }
    
    /// Lookup place details by ID
    /// - Parameter placeId: Place ID from autosuggest
    /// - Returns: Place details as dictionary
    func lookup(placeId: String) async throws -> [String: Any] {
        guard let credentials = HERECredentialsManager.shared.loadCredentials() else {
            throw NSError(domain: "HERELookup", code: -1, userInfo: [NSLocalizedDescriptionKey: "HERE credentials not found"])
        }
        
        guard !placeId.isEmpty else {
            throw NSError(domain: "HERELookup", code: -2, userInfo: [NSLocalizedDescriptionKey: "Place ID is empty"])
        }
        
        var components = URLComponents(string: "https://lookup.search.hereapi.com/v1/lookup")!
        components.queryItems = [
            URLQueryItem(name: "id", value: placeId),
            URLQueryItem(name: "apiKey", value: credentials.apiKey)
        ]
        
        guard let url = components.url else {
            throw NSError(domain: "HERELookup", code: -3, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])
        }
        
        let (data, response) = try await session.data(from: url)
        
        guard (response as? HTTPURLResponse)?.statusCode == 200 else {
            throw NSError(domain: "HERELookup", code: -4, userInfo: [NSLocalizedDescriptionKey: "HTTP error"])
        }
        
        guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw NSError(domain: "HERELookup", code: -5, userInfo: [NSLocalizedDescriptionKey: "Invalid JSON response"])
        }
        
        return json
    }
}
