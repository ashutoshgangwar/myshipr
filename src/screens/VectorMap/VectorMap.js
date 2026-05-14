//VectorMap.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, TouchableOpacity, Text, View, ScrollView } from "react-native";
import styles from "./VectorMap.styles";
import MapLibreGL from "@maplibre/maplibre-react-native";
import Gps_Icon from "../../assets/svg_icon/gps-svg.svg";
import Location_Icon from "../../assets/svg_icon/location.svg";
import { getCurrentLocation } from "../../services/LocationService";  
import SearchCard from "../../component/Navigation_components/SearchCard";
import { GOOGLE_MAPS_API_KEY } from "@env";
import { getRouteBetweenPoints } from "../../apiservices/ptvRoutingService";
import AppText from "../../theme/AppText";
import { colors } from "../../theme/colors";

const MAP_STYLE_URL = "https://vectormaps-resources.myptv.com/styles/latest/standard.json";
const INITIAL_COORDINATE = [8.4055677, 49.0070036];
const CITY_ZOOM_LEVELS = [5, 8, 11, 13, 15, 17];
const INITIAL_ZOOM = 11;
const NAVIGATE_ZOOM = 13;
const MIN_ZOOM = 1;
const MAX_ZOOM = 18;

const ZOOM_LABELS = {
  1: "World", 2: "World", 3: "Continent", 4: "Continent",
  5: "Country", 6: "Country", 7: "State", 8: "State",
  9: "Region", 10: "Region", 11: "City", 12: "City",
  13: "District", 14: "District", 15: "Streets", 16: "Streets",
  17: "Buildings", 18: "Buildings",
};

MapLibreGL.setAccessToken(null);

export const VectorMap = (props) => {
  const {
    latitude,
    longitude,
    zoomLevel,
    showMarker = true,
    markerColor = "#E53935",
  } = props;

  const cameraRef = useRef(null);
  const sourceAutocompleteRef = useRef(null);
  const destinationAutocompleteRef = useRef(null);

  const [currentZoom, setCurrentZoom] = useState(INITIAL_ZOOM);
  const [selectedCoordinate, setSelectedCoordinate] = useState(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [activeInput, setActiveInput] = useState(null);
  const [sourceLocation, setSourceLocation] = useState(null);
  const [destinationLocation, setDestinationLocation] = useState(null);
  const [sourceText, setSourceText] = useState("");
  const [destinationText, setDestinationText] = useState("");
  const [routeData, setRouteData] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState(null);
  const [isRouteExpanded, setIsRouteExpanded] = useState(false);

  const hasActiveCoordinate =
    selectedCoordinate != null || (latitude != null && longitude != null);



  useEffect(() => {
    const fetchRoute = async () => {
      if (!sourceLocation || !destinationLocation) return;

      setIsLoadingRoute(true);
      setRouteError(null);
      setRouteData(null);

      try {
        const response = await getRouteBetweenPoints(
          sourceLocation.latitude,
          sourceLocation.longitude,
          destinationLocation.latitude,
          destinationLocation.longitude
        );

        setRouteData(response);

        console.log("Route Data:", {
          distance: response.distance,
          travelTime: response.travelTime,
          violated: response.violated,
          trafficDelay: response.trafficDelay,
        });
      } catch (error) {
        console.log("Route Fetch Error:", error);
        
        // Parse error message for better UX
        let errorMessage = "Failed to fetch route";
        if (error.message) {
          if (error.message.includes("ROUTING_ROUTE_NOT_FOUND")) {
            errorMessage = "No route found between these locations. Try selecting closer destinations.";
          } else if (error.message.includes("HTTP 400")) {
            errorMessage = "Invalid route. Please check your locations.";
          } else if (error.message.includes("HTTP 401") || error.message.includes("HTTP 403")) {
            errorMessage = "API authentication failed. Please check configuration.";
          } else {
            errorMessage = error.message;
          }
        }
        
        setRouteError(errorMessage);
      } finally {
        setIsLoadingRoute(false);
      }
    };

    fetchRoute();
  }, [sourceLocation, destinationLocation]);

  // Fly the camera whenever the parent passes new lat/long
  useEffect(() => {
    if (latitude != null && longitude != null) {
      const targetZoom = zoomLevel ?? NAVIGATE_ZOOM;
      const nextCoordinate = [longitude, latitude];
      setSelectedCoordinate(nextCoordinate);
      setCurrentZoom(targetZoom);
      cameraRef.current?.flyTo(nextCoordinate, 900);
      cameraRef.current?.zoomTo(targetZoom, 900);
    }
  }, [latitude, longitude, zoomLevel]);

  const handleUseCurrentLocation = useCallback(async () => {
    try {
      setIsGpsLoading(true);
      const location = await getCurrentLocation();
      const nextCoordinate = [location.longitude, location.latitude];

      setSelectedCoordinate(nextCoordinate);
      setCurrentZoom(NAVIGATE_ZOOM);
      cameraRef.current?.flyTo(nextCoordinate, 900);
      cameraRef.current?.zoomTo(NAVIGATE_ZOOM, 900);

      if (typeof props.onCurrentLocationSelected === "function") {
        props.onCurrentLocationSelected({
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp,
        });
      }
    } catch (error) {
      console.warn("Failed to fetch current location:", error);
    } finally {
      setIsGpsLoading(false);
    }
  }, [props]);

  const flyToCoordinate = useCallback((latitudeValue, longitudeValue) => {
    const nextCoordinate = [longitudeValue, latitudeValue];
    setSelectedCoordinate(nextCoordinate);
    setCurrentZoom(NAVIGATE_ZOOM);
    cameraRef.current?.flyTo(nextCoordinate, 900);
    cameraRef.current?.zoomTo(NAVIGATE_ZOOM, 900);
  }, []);

  const transformRequest = useCallback(
    (url) => {
      const apiKey = typeof props.apiKey === "string" ? props.apiKey.trim() : "";

      if (!apiKey) {
        return { url, headers: {} };
      }

      const isPtvResource =
        url.includes("vectormaps-resources.myptv.com") ||
        url.includes("api.myptv.com");

      if (!isPtvResource) {
        return { url, headers: {} };
      }

      return { url, headers: { ApiKey: apiKey } };
    },
    [props.apiKey]
  );

  const handleZoomIn = () => {
    // Jump to the next city zoom level above current
    const next = CITY_ZOOM_LEVELS.find((z) => z > currentZoom);
    const newZoom = next !== undefined ? next : Math.min(currentZoom + 1, MAX_ZOOM);
    setCurrentZoom(newZoom);
    cameraRef.current?.zoomTo(newZoom, 400);
  };

  const handleZoomOut = () => {
    // Jump to the next city zoom level below current
    const prev = [...CITY_ZOOM_LEVELS].reverse().find((z) => z < currentZoom);
    const newZoom = prev !== undefined ? prev : Math.max(currentZoom - 1, MIN_ZOOM);
    setCurrentZoom(newZoom);
    cameraRef.current?.zoomTo(newZoom, 400);
  };

  // Derive the active center from props, selected GPS position, or default
  const centerCoordinate = useMemo(
    () =>
      selectedCoordinate ??
      (latitude != null && longitude != null ? [longitude, latitude] : INITIAL_COORDINATE),
    [selectedCoordinate, latitude, longitude]
  );

  // Format distance in kilometers or meters
  const formatDistance = (meters) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  // Format time in hours and minutes
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        styleURL={MAP_STYLE_URL}
        transformRequest={transformRequest}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          zoomLevel={INITIAL_ZOOM}
          centerCoordinate={centerCoordinate}
          pitch={0}
          heading={0}
        />

        {/* Render route polyline if available */}
        {routeData?.polylineCoordinates && (
          <MapLibreGL.ShapeSource
            id="route-source"
            shape={{
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: routeData.polylineCoordinates,
              },
            }}
          >
            <MapLibreGL.LineLayer
              id="route-line"
              style={{
                lineColor: "#2563EB",
                lineWidth: 4,
                lineOpacity: 0.8,
              }}
            />
          </MapLibreGL.ShapeSource>
        )}

        {/* Source location marker */}
        {sourceLocation && (
          <MapLibreGL.PointAnnotation
            id="source-marker"
            coordinate={[sourceLocation.longitude, sourceLocation.latitude]}
          >
            <View style={[styles.markerOuter, { borderColor: "#10b981" }]}>
              <AppText style={{ fontSize: 12, fontWeight: "bold", color: "#10b981" }}>📍</AppText>
            </View>
            <MapLibreGL.Callout title="Start" />
          </MapLibreGL.PointAnnotation>
        )}

        {/* Destination location marker */}
        {destinationLocation && (
          <MapLibreGL.PointAnnotation
            id="destination-marker"
            coordinate={[destinationLocation.longitude, destinationLocation.latitude]}
          >
            <View style={[styles.markerOuter, { borderColor: markerColor }]}>
              <AppText style={{ fontSize: 12, fontWeight: "bold", color: markerColor }}>📍</AppText>
            </View>
            <MapLibreGL.Callout title="Destination" />
          </MapLibreGL.PointAnnotation>
        )}

        {/* Pin marker at the target / current location */}
        {showMarker && hasActiveCoordinate && !sourceLocation && !destinationLocation && (
          <MapLibreGL.PointAnnotation
            id="selected-marker"
            coordinate={centerCoordinate}
          >
            <View style={[styles.markerOuter, { borderColor: markerColor }]}>
              <Location_Icon width={14} height={14} />
            </View>
            <MapLibreGL.Callout title="Destination" />
          </MapLibreGL.PointAnnotation>
        )}
      </MapLibreGL.MapView>

      {/* Zoom level label */}
      <View style={styles.zoomLabel}>
        <Text style={styles.zoomLabelText}>
          {ZOOM_LABELS[Math.round(currentZoom)] ?? "Map"}
        </Text>
      </View>

      {/* Zoom Controls */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomIn} activeOpacity={0.8}>
          <Text style={styles.zoomButtonText}>+</Text>
        </TouchableOpacity>
        <View style={styles.zoomDivider} />
        <TouchableOpacity style={styles.zoomButton} onPress={handleZoomOut} activeOpacity={0.8}>
          <Text style={styles.zoomButtonText}>−</Text>
        </TouchableOpacity>
      </View>

      {/* Current location / GPS button */}
      <View style={styles.gpsButtonWrap}>
        <TouchableOpacity
          style={styles.gpsButton}
          onPress={handleUseCurrentLocation}
          activeOpacity={0.8}
          disabled={isGpsLoading}
        >
          {isGpsLoading ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <Gps_Icon width={24} height={24} />
          )}
        </TouchableOpacity>
      </View>

      {/* Search Location Button */}
      <SearchCard
        sourceRef={sourceAutocompleteRef}
        destinationRef={destinationAutocompleteRef}
        activeInput={activeInput}
        onActiveInputChange={setActiveInput}
        sourceLocation={sourceLocation}
        destinationLocation={destinationLocation}
        sourceText={sourceText}
        destinationText={destinationText}
        setSourceLocation={setSourceLocation}
        setDestinationLocation={setDestinationLocation}
        setSourceText={setSourceText}
        setDestinationText={setDestinationText}
        onCoordinateSelect={flyToCoordinate}
        apiKey={GOOGLE_MAPS_API_KEY}
      />

      {/* Left mini-card and Right mini-card */}
      <View style={[styles.sideCard, styles.sideCardLeft]}>
        <AppText style={styles.sideCardTitle}>From</AppText>
        <AppText numberOfLines={2} style={styles.sideCardSubtitle}>{sourceText || "--"}</AppText>
      </View>

      <View style={[styles.sideCard, styles.sideCardRight]}>
        <AppText style={styles.sideCardTitle}>To</AppText>
        <AppText numberOfLines={2} style={styles.sideCardSubtitle}>{destinationText || "--"}</AppText>
      </View>

      {/* Route Information Card */}
      {(isLoadingRoute || routeData || routeError) && sourceLocation && destinationLocation && (
        <View style={[styles.routeInfoCard, isRouteExpanded ? { maxHeight: 420 } : {}]}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => setIsRouteExpanded(v => !v)}>
            <View style={styles.routeHandle} />
          </TouchableOpacity>
          {isLoadingRoute ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary || "#2563EB"} />
              <AppText style={styles.loadingText}>Calculating route...</AppText>
            </View>
          ) : routeError ? (
            <View style={styles.errorContainer}>
              <AppText style={styles.errorText}>⚠ {routeError}</AppText>
            </View>
          ) : routeData ? (
            <ScrollView style={styles.routeDataContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.routeHeader}>
                <View style={styles.routeHeaderRow}>
                  <View>
                    <AppText style={styles.routeTitle}>🗺️ Route Summary</AppText>
                    <AppText style={styles.routeSubtitle}>{sourceText} → {destinationText}</AppText>
                  </View>
                </View>
              </View>

              {/* Primary Info - Distance & Time */}
              <View style={styles.routePrimaryInfo}>
                <View style={styles.primaryInfoItem}>
                  <View style={[styles.primaryIconBg, { backgroundColor: "#dbeafe" }]}>
                    <AppText style={styles.primaryIcon}>📏</AppText>
                  </View>
                  <View style={styles.primaryInfoContent}>
                    <AppText style={styles.primaryLabel}>Distance</AppText>
                    <AppText style={styles.primaryValue}>
                      {formatDistance(routeData.distance)}
                    </AppText>
                    <AppText style={styles.infoHint}>Total route distance</AppText>
                  </View>
                </View>

                <View style={styles.primaryInfoItem}>
                  <View style={[styles.primaryIconBg, { backgroundColor: "#fef3c7" }]}>
                    <AppText style={styles.primaryIcon}>⏱️</AppText>
                  </View>
                  <View style={styles.primaryInfoContent}>
                    <AppText style={styles.primaryLabel}>Travel Time</AppText>
                    <AppText style={styles.primaryValue}>
                      {formatTime(routeData.travelTime)}
                    </AppText>
                    <AppText style={styles.infoHint}>Estimated with traffic</AppText>
                  </View>
                </View>
              </View>

              {/* Secondary Info - Traffic & Status */}
              <View style={styles.secondaryInfoContainer}>
                {/* Traffic Delay */}
                <View style={styles.secondaryInfoItem}>
                  <View style={styles.secondaryItemHeader}>
                    <AppText style={styles.secondaryIcon}>🚗</AppText>
                    <AppText style={styles.secondaryLabel}>Traffic Impact</AppText>
                  </View>
                  <AppText style={styles.secondaryValue}>
                    {routeData.trafficDelay > 0 ? formatTime(routeData.trafficDelay) : "—"}
                  </AppText>
                  {routeData.trafficDelay === 0 && (
                    <AppText style={styles.noDelayText}>✨ Clear roads ahead</AppText>
                  )}
                  {routeData.trafficDelay > 0 && (
                    <AppText style={styles.delayText}>Additional time due to traffic</AppText>
                  )}
                </View>

                {/* Route Status */}
                <View style={[
                  styles.secondaryInfoItem,
                  {
                    backgroundColor: routeData.violated ? "#fee2e2" : "#f0fdf4",
                    borderLeftColor: routeData.violated ? "#dc2626" : "#16a34a",
                  }
                ]}>
                  <View style={styles.secondaryItemHeader}>
                    <AppText style={styles.secondaryIcon}>
                      {routeData.violated ? "⚠️" : "✅"}
                    </AppText>
                    <AppText style={styles.secondaryLabel}>Route Status</AppText>
                  </View>
                  <AppText style={[
                    styles.secondaryValue,
                    { color: routeData.violated ? "#dc2626" : "#16a34a" }
                  ]}>
                    {routeData.violated ? "Route Violated" : "Route Valid"}
                  </AppText>
                  <AppText style={[
                    styles.statusHint,
                    { color: routeData.violated ? "#dc2626" : "#16a34a" }
                  ]}>
                    {routeData.violated ? "Route constraints exceeded" : "All constraints met"}
                  </AppText>
                </View>
              </View>
            </ScrollView>
          ) : null}
        </View>
      )}
    </View>
  );
};
