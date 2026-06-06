import Foundation
import React

@objc(HEREBridge)
class HEREBridge: NSObject {
  
  @objc
  func autosuggest(
    _ query: String,
    latitude: NSNumber?,
    longitude: NSNumber?,
    limit: NSNumber?,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    Task {
      await autosuggestAsync(
        query: query,
        latitude: latitude,
        longitude: longitude,
        limit: limit,
        resolver: resolver,
        rejecter: rejecter
      )
    }
  }
  
  private func autosuggestAsync(
    query: String,
    latitude: NSNumber?,
    longitude: NSNumber?,
    limit: NSNumber?,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) async {
    do {
      let coords: (latitude: Double, longitude: Double)? =
        latitude != nil && longitude != nil
          ? (latitude: latitude!.doubleValue, longitude: longitude!.doubleValue)
          : nil
      
      let results = try await HEREAutosuggestService.shared.autosuggest(
        query: query,
        coordinates: coords,
        limit: limit?.intValue ?? 5
      )
      
      let items = results.map { item -> [String: Any] in
        let accessItems = item.access?.map { accessPoint -> [String: Any] in
          ["lat": accessPoint.lat, "lng": accessPoint.lng]
        } ?? []
        
        return [
          "id": item.id,
          "title": item.title,
          "address": item.address,
          "latitude": item.latitude ?? NSNull(),
          "longitude": item.longitude ?? NSNull(),
          "access": accessItems
        ]
      }
      
      resolver(items)
    } catch {
      rejecter("AUTOSUGGEST_ERROR", error.localizedDescription, error)
    }
  }
  
  @objc
  func lookup(
    _ placeId: String,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    Task {
      await lookupAsync(placeId: placeId, resolver: resolver, rejecter: rejecter)
    }
  }
  
  private func lookupAsync(
    placeId: String,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) async {
    do {
      let result = try await HEREAutosuggestService.shared.lookup(placeId: placeId)
      resolver(result)
    } catch {
      rejecter("LOOKUP_ERROR", error.localizedDescription, error)
    }
  }
  
  @objc
  func calculateTruckRoute(
    _ originLat: NSNumber,
    originLng: NSNumber,
    destLat: NSNumber,
    destLng: NSNumber,
    vehicle: NSDictionary?,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    Task {
      await calculateTruckRouteAsync(
        originLat: originLat,
        originLng: originLng,
        destLat: destLat,
        destLng: destLng,
        vehicle: vehicle,
        resolver: resolver,
        rejecter: rejecter
      )
    }
  }
  
  private func calculateTruckRouteAsync(
    originLat: NSNumber,
    originLng: NSNumber,
    destLat: NSNumber,
    destLng: NSNumber,
    vehicle: NSDictionary?,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) async {
    do {
      var vehicleParams: VehicleParameters? = nil
      if let vehicle = vehicle {
        vehicleParams = VehicleParameters(
          currentWeight: vehicle["currentWeight"] as? Int,
          height: vehicle["height"] as? Int,
          width: vehicle["width"] as? Int,
          length: vehicle["length"] as? Int
        )
      }
      
      let route = try await HERERoutingService.shared.calculateTruckRoute(
        origin: (latitude: originLat.doubleValue, longitude: originLng.doubleValue),
        destination: (latitude: destLat.doubleValue, longitude: destLng.doubleValue),
        vehicle: vehicleParams
      )
      
      resolver(route)
    } catch {
      rejecter("ROUTING_ERROR", error.localizedDescription, error)
    }
  }
  
  @objc
  func calculateRouteTolls(
    _ originLat: NSNumber,
    originLng: NSNumber,
    destLat: NSNumber,
    destLng: NSNumber,
    currency: String?,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    Task {
      await calculateRouteTollsAsync(
        originLat: originLat,
        originLng: originLng,
        destLat: destLat,
        destLng: destLng,
        currency: currency,
        resolver: resolver,
        rejecter: rejecter
      )
    }
  }
  
  private func calculateRouteTollsAsync(
    originLat: NSNumber,
    originLng: NSNumber,
    destLat: NSNumber,
    destLng: NSNumber,
    currency: String?,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) async {
    do {
      let tolls = try await HERERoutingService.shared.calculateRouteTolls(
        origin: (latitude: originLat.doubleValue, longitude: originLng.doubleValue),
        destination: (latitude: destLat.doubleValue, longitude: destLng.doubleValue),
        currency: currency ?? "USD"
      )
      
      resolver(tolls)
    } catch {
      rejecter("TOLLS_ERROR", error.localizedDescription, error)
    }
  }
  
  @objc
  func searchLocationsByText(
    _ searchText: String,
    countryFilter: String?,
    language: String?,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    Task {
      await searchLocationsByTextAsync(
        searchText: searchText,
        countryFilter: countryFilter,
        language: language,
        resolver: resolver,
        rejecter: rejecter
      )
    }
  }
  
  private func searchLocationsByTextAsync(
    searchText: String,
    countryFilter: String?,
    language: String?,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) async {
    do {
      let results = try await HEREGeocodingService.shared.searchLocationsByText(
        searchText: searchText,
        countryFilter: countryFilter ?? "US,GB,DE,FR",
        language: language ?? "en"
      )
      
      let items = results.map { item -> [String: Any] in
        [
          "id": item.id ?? "",
          "title": item.title ?? "",
          "address": item.address?.label ?? "",
          "latitude": item.position?.lat ?? NSNull(),
          "longitude": item.position?.lng ?? NSNull(),
          "resultType": item.resultType ?? ""
        ]
      }
      
      resolver(items)
    } catch {
      rejecter("SEARCH_ERROR", error.localizedDescription, error)
    }
  }
  
  @objc
  func reverseGeocode(
    _ latitude: NSNumber,
    longitude: NSNumber,
    language: String?,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) {
    Task {
      await reverseGeocodeAsync(
        latitude: latitude.doubleValue,
        longitude: longitude.doubleValue,
        language: language,
        resolver: resolver,
        rejecter: rejecter
      )
    }
  }
  
  private func reverseGeocodeAsync(
    latitude: Double,
    longitude: Double,
    language: String?,
    resolver: @escaping RCTPromiseResolveBlock,
    rejecter: @escaping RCTPromiseRejectBlock
  ) async {
    do {
      let address = try await HEREGeocodingService.shared.reverseGeocode(
        latitude: latitude,
        longitude: longitude,
        language: language ?? "en"
      )
      
      guard let address = address else {
        resolver(NSNull())
        return
      }

      // Fix: break nested dictionary into sub-expressions so Swift's
      // type-checker doesn't time out (compiler error on line 281)
      let addressDict: [String: Any] = [
        "label": address.address?.label ?? "",
        "countryCode": address.address?.countryCode ?? "",
        "city": address.address?.city ?? "",
        "state": address.address?.state ?? "",
        "postalCode": address.address?.postalCode ?? "",
        "street": address.address?.street ?? "",
        "houseNumber": address.address?.houseNumber ?? ""
      ]
      let positionDict: [String: Any] = [
        "lat": address.position?.lat ?? NSNull(),
        "lng": address.position?.lng ?? NSNull()
      ]
      let result: [String: Any] = [
        "title": address.title ?? "",
        "address": addressDict,
        "position": positionDict
      ]
      
      resolver(result)
    } catch {
      rejecter("REVERSE_GEOCODE_ERROR", error.localizedDescription, error)
    }
  }
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
}
