import Foundation

struct ReverseGeocodeResponse: Codable {
    let items: [ReverseGeocodeItem]?
}

struct ReverseGeocodeItem: Codable {
    let title: String?
    let address: AddressDetail?
    let position: PositionResponse?
}

struct AddressDetail: Codable {
    let label: String?
    let countryCode: String?
    let countryName: String?
    let stateCode: String?
    let state: String?
    let county: String?
    let city: String?
    let district: String?
    let postalCode: String?
    let street: String?
    let houseNumber: String?
}

struct SearchLocationResponse: Codable {
    let items: [SearchLocationItem]?
}

struct SearchLocationItem: Codable {
    let title: String?
    let id: String?
    let resultType: String?
    let address: AddressDetail?
    let position: PositionResponse?
    let access: [AccessPoint]?
}

class HEREGeocodingService {
    static let shared = HEREGeocodingService()
    private let session = URLSession.shared
    
    private init() {}
    
    /// Search for locations by text query
    /// - Parameters:
    ///   - searchText: Text to search for (address, place name, etc.)
    ///   - countryFilter: Comma-separated country codes to filter results
    ///   - language: Language code for results
    /// - Returns: Array of search results
    func searchLocationsByText(
        searchText: String,
        countryFilter: String = "US,GB,DE,FR",
        language: String = "en"
    ) async throws -> [SearchLocationItem] {
        guard let credentials = HERECredentialsManager.shared.loadCredentials() else {
            throw NSError(domain: "HEREGeocoding", code: -1, userInfo: [NSLocalizedDescriptionKey: "HERE credentials not found"])
        }
        
        var components = URLComponents(string: "https://geocode.search.hereapi.com/v1/geocode")!
        components.queryItems = [
            URLQueryItem(name: "q", value: searchText),
            URLQueryItem(name: "countryCode", value: countryFilter),
            URLQueryItem(name: "lang", value: language),
            URLQueryItem(name: "apiKey", value: credentials.apiKey)
        ]
        
        guard let url = components.url else {
            throw NSError(domain: "HEREGeocoding", code: -2, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])
        }
        
        let (data, response) = try await session.data(from: url)
        
        guard (response as? HTTPURLResponse)?.statusCode == 200 else {
            throw NSError(domain: "HEREGeocoding", code: -3, userInfo: [NSLocalizedDescriptionKey: "HTTP error"])
        }
        
        let decodedResponse = try JSONDecoder().decode(SearchLocationResponse.self, from: data)
        return decodedResponse.items ?? []
    }
    
    /// Reverse geocode coordinates to get address
    /// - Parameters:
    ///   - latitude: Latitude coordinate
    ///   - longitude: Longitude coordinate
    ///   - language: Language code for results
    /// - Returns: Address details at the given coordinates
    func reverseGeocode(
        latitude: Double,
        longitude: Double,
        language: String = "en"
    ) async throws -> ReverseGeocodeItem? {
        guard let credentials = HERECredentialsManager.shared.loadCredentials() else {
            throw NSError(domain: "HERERevGeocode", code: -1, userInfo: [NSLocalizedDescriptionKey: "HERE credentials not found"])
        }
        
        var components = URLComponents(string: "https://revgeocode.search.hereapi.com/v1/revgeocode")!
        components.queryItems = [
            URLQueryItem(name: "at", value: "\(latitude),\(longitude)"),
            URLQueryItem(name: "lang", value: language),
            URLQueryItem(name: "apiKey", value: credentials.apiKey)
        ]
        
        guard let url = components.url else {
            throw NSError(domain: "HERERevGeocode", code: -2, userInfo: [NSLocalizedDescriptionKey: "Invalid URL"])
        }
        
        let (data, response) = try await session.data(from: url)
        
        guard (response as? HTTPURLResponse)?.statusCode == 200 else {
            throw NSError(domain: "HERERevGeocode", code: -3, userInfo: [NSLocalizedDescriptionKey: "HTTP error"])
        }
        
        let decodedResponse = try JSONDecoder().decode(ReverseGeocodeResponse.self, from: data)
        return decodedResponse.items?.first
    }
    
    /// Format address from reverse geocode result
    /// - Parameter item: Reverse geocode item
    /// - Returns: Formatted address string
    func formatAddress(from item: ReverseGeocodeItem?) -> String {
        guard let item = item, let address = item.address else {
            return "Unknown Location"
        }
        
        var parts: [String] = []
        
        if let street = address.street, let houseNumber = address.houseNumber {
            parts.append("\(houseNumber) \(street)")
        } else if let street = address.street {
            parts.append(street)
        }
        
        if let city = address.city {
            parts.append(city)
        }
        
        if let state = address.state {
            parts.append(state)
        }
        
        if let postalCode = address.postalCode {
            parts.append(postalCode)
        }
        
        if let country = address.countryName {
            parts.append(country)
        }
        
        return parts.joined(separator: ", ")
    }
}
