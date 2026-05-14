// services/ptvRoutingService.js

const PTV_API_KEY = process.env.PTV_API_KEY;

/**
 * Parse polyline from GeoJSON to coordinate array
 * @param {string} polylineGeoJSON - GeoJSON LineString as string or object
 * @returns {Array} Array of [lng, lat] coordinates for MapLibre
 */
const parsePolylineCoordinates = (polylineGeoJSON) => {
  try {
    if (!polylineGeoJSON) return null;

    // Parse if string
    const parsed = typeof polylineGeoJSON === "string" 
      ? JSON.parse(polylineGeoJSON) 
      : polylineGeoJSON;

    // Extract coordinates from GeoJSON LineString
    if (parsed.type === "LineString" && Array.isArray(parsed.coordinates)) {
      return parsed.coordinates; // Already in [lng, lat] format
    }

    return null;
  } catch (error) {
    console.warn("⚠️ Failed to parse polyline:", error.message);
    return null;
  }
};

export const getRouteBetweenPoints = async (
  sourceLatitude,
  sourceLongitude,
  destinationLatitude,
  destinationLongitude
) => {
  try {
    const url =
      `https://api.myptv.com/routing/v1/routes` +
      `?waypoints=${sourceLatitude},${sourceLongitude}` +
      `&waypoints=${destinationLatitude},${destinationLongitude}` +
      `&results=POLYLINE` +
      `&options[trafficMode]=AVERAGE`;

    console.log("🚀 Fetching route from:", url);
    console.log("📌 Using API Key:", PTV_API_KEY);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        ApiKey: PTV_API_KEY,
        "Content-Type": "application/json",
      },
    });

    console.log("📡 Response Status:", response.status);
    console.log("📡 Response Headers:", response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("❌ Error Response:", errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    console.log("✅ PTV Route Response:", result);

    // Validate the response has the expected fields
    if (!result.distance || result.travelTime === undefined) {
      console.warn("⚠️ Response missing expected fields:", result);
    }

    // Parse polyline coordinates if available
    if (result.polyline) {
      const coordinates = parsePolylineCoordinates(result.polyline);
      result.polylineCoordinates = coordinates;
      console.log("✅ Polyline parsed:", coordinates?.length, "coordinate points");
    }

    return result;
  } catch (error) {
    console.log("❌ PTV Routing Error:", error.message);
    throw error;
  }
};