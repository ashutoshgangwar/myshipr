import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import styles from './NavigationScreen.styles';
import {moderateScale, verticalScale, scale} from 'react-native-size-matters';

import Navigation_Icon from '../../assets/svg_icon/navigation.svg';
import GPS_Icon from '../../assets/svg_icon/gps-svg.svg';
import Arrow_left_right from '../../assets/svg_icon/arrow-right-lef.svg';
import Location_Icon from '../../assets/svg_icon/location.svg';

import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import {
  getCurrentLocation,
  watchCurrentLocation,
  clearWatchLocation,
} from '../../utils/LocationService';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import {GOOGLE_MAPS_API_KEY} from '@env';

const NavigationScreen = () => {
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [loading, setLoading] = useState(true);
  const [hasLocation, setHasLocation] = useState(false);
  const [source, setSource] = useState(null);
  const [destination, setDestination] = useState(null);
  const [directions, setDirections] = useState([]);
  const [navigationStarted, setNavigationStarted] = useState(false);
  const [followUser, setFollowUser] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [mapRegion, setMapRegion] = useState(currentLocation);
  const [remainingDistance, setRemainingDistance] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [bearing, setBearing] = useState(0);
  const [fetchingSourceAddress, setFetchingSourceAddress] = useState(false);
  const [fetchingDestinationAddress, setFetchingDestinationAddress] =
    useState(false);

  const [sourceText, setSourceText] = useState('');
  const [destinationText, setDestinationText] = useState('');
  const [activeInput, setActiveInput] = useState(null);
  const [pickupAddress, setPickupAddress] = useState('Pickup location');
  const [dropAddress, setDropAddress] = useState('Drop location');
  const [travelMode, setTravelMode] = useState('driving'); 

  const sourceAutocompleteRef = useRef(null);
  const destinationAutocompleteRef = useRef(null);

  useEffect(() => {
    let watcher;
    const startWatching = async () => {
      try {
        // Get initial location quickly
        const initialLocation = await getCurrentLocation();
        setCurrentLocation({
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        setHasLocation(true);
        setLoading(false);

        // Then start watching for updates
        watcher = await watchCurrentLocation(
          position => {
            const {latitude, longitude} = position.coords;
            setCurrentLocation({
              latitude,
              longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
            setHasLocation(true);
          },
          error => {
            console.log('Location error:', error);
          },
          {
            enableHighAccuracy: true,
            distanceFilter: 10,
            interval: 5000,
            fastestInterval: 2000,
          },
        );
      } catch (error) {
        console.log('Failed to get location:', error);
        setLoading(false);
      }
    };

    startWatching();

    return () => {
      if (watcher) {
        clearWatchLocation(watcher);
      }
    };
  }, []);

  const centerOnCurrentLocation = async () => {
    // If an input is active, fill it with current location address
    if (activeInput) {
      if (activeInput === 'source') {
        await setCurrentLocationAsSource();
      } else if (activeInput === 'destination') {
        await setCurrentLocationAsDestination();
      }
      setActiveInput(null); // Reset active input after filling
    } else {
      // Otherwise, just center the map
      setMapRegion({
        ...currentLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      // re-enable following when user explicitly centers map
      setFollowUser(true);
    }
  };

  const setCurrentAsSource = () => {
    setSource({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      description: 'Current Location',
    });
  };

  const swapSourceDestination = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);

    // Swap the text states as well
    const tempText = sourceText;
    setSourceText(destinationText);
    setDestinationText(tempText);
  };

  // Function to get address from coordinates using Google Geocoding API
  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`,
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      return 'Current Location';
    } catch (error) {
      console.log('Error getting address:', error);
      return 'Current Location';
    }
  };

  // Enhanced function to set current location as source with address
  const setCurrentLocationAsSource = async () => {
    setFetchingSourceAddress(true);
    try {
      const address = await getAddressFromCoordinates(
        currentLocation.latitude,
        currentLocation.longitude,
      );
      setSource({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        description: address,
      });
      setSourceText(address);
      // Set the text in the autocomplete component
      if (sourceAutocompleteRef.current) {
        sourceAutocompleteRef.current.setAddressText(address);
      }
    } catch (error) {
      console.log('Error setting current location as source:', error);
      setCurrentAsSource(); // Fallback to basic function
    } finally {
      setFetchingSourceAddress(false);
    }
  };

  // Enhanced function to set current location as destination with address
  const setCurrentLocationAsDestination = async () => {
    setFetchingDestinationAddress(true);
    try {
      const address = await getAddressFromCoordinates(
        currentLocation.latitude,
        currentLocation.longitude,
      );
      setDestination({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        description: address,
      });
      setDestinationText(address);
      // Set the text in the autocomplete component
      if (destinationAutocompleteRef.current) {
        destinationAutocompleteRef.current.setAddressText(address);
      }
    } catch (error) {
      console.log('Error setting current location as destination:', error);
      // Fallback - set basic destination
      setDestination({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        description: 'Current Location',
      });
    } finally {
      setFetchingDestinationAddress(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance * 1000; // Convert to meters
  };

  const calculateBearing = (lat1, lon1, lat2, lon2) => {
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    const bearing = (Math.atan2(y, x) * 180) / Math.PI;
    return (bearing + 360) % 360;
  };

  const updateRemaining = () => {
    if (directions.length > 0) {
      let totalDist = 0;
      let totalTime = 0;
      for (let i = currentStep; i < directions.length; i++) {
        const step = directions[i];
        // Assuming distance is in meters, but text might be '1.2 km', need to parse
        const distText = step.distance;
        let dist = 0;
        if (distText.includes('km')) {
          dist = parseFloat(distText) * 1000;
        } else if (distText.includes('m')) {
          dist = parseFloat(distText);
        }
        totalDist += dist;

        const timeText = step.duration;
        let time = 0;
        if (timeText.includes('hour')) {
          const hours = parseFloat(timeText);
          time = hours * 3600;
        } else if (timeText.includes('min')) {
          time = parseFloat(timeText) * 60;
        }
        totalTime += time;
      }
      setRemainingDistance(totalDist);
      setRemainingTime(totalTime);
    }
  };

  const fetchDirections = async (origin, dest) => {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${dest.latitude},${dest.longitude}&key=${GOOGLE_MAPS_API_KEY}&mode=driving&departure_time=now&traffic_model=best_guess`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (
        data.routes &&
        data.routes.length > 0 &&
        data.routes[0].legs &&
        data.routes[0].legs[0].steps
      ) {
        const steps = data.routes[0].legs[0].steps.map(step => ({
          instruction: step.html_instructions
            ? step.html_instructions.replace(/<[^>]*>/g, '')
            : 'Continue straight',
          distance: step.distance?.text || 'N/A',
          duration: step.duration?.text || 'N/A',
          start_location: step.start_location,
          end_location: step.end_location,
        }));
        setDirections(steps);
      } else {
        setDirections([]);
      }
    } catch (error) {
      console.error('Error fetching directions:', error);
    }
  };

  useEffect(() => {
    const startLocation =
      source ||
      (hasLocation
        ? {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            description: 'Current Location',
          }
        : null);
    if (startLocation && destination) {
      fetchDirections(startLocation, destination);
    } else {
      setDirections([]);
    }
  }, [source, destination, currentLocation, hasLocation]);

  useEffect(() => {
    updateRemaining();
  }, [directions, currentStep]);

  useEffect(() => {
    if (
      navigationStarted &&
      directions.length > 0 &&
      currentStep < directions.length
    ) {
      const step = directions[currentStep];
      if (step.end_location) {
        const distance = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          step.end_location.lat,
          step.end_location.lng,
        );
        if (distance < 50) {
          // If within 50 meters, advance to next step
          setCurrentStep(prev => Math.min(directions.length - 1, prev + 1));
        }
        // Update bearing to next point
        const newBearing = calculateBearing(
          currentLocation.latitude,
          currentLocation.longitude,
          step.end_location.lat,
          step.end_location.lng,
        );
        setBearing(newBearing);
      }
    }
  }, [currentLocation, navigationStarted, currentStep, directions]);

  useEffect(() => {
    // Only auto-center the map while navigation if followUser is enabled.
    if (navigationStarted && followUser) {
      setMapRegion({
        ...currentLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [currentLocation, navigationStarted]);

  const navigateToDestination = () => {
    const startLocation = source || {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      description: 'Current Location',
    };
    if (destination && directions.length > 0) {
      setSource(startLocation);
      setNavigationStarted(true);
      // Enable following when navigation starts so map centers on user.
      setFollowUser(true);
      setCurrentStep(0);
      setMapRegion({
        ...currentLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  useEffect(() => {
    if (source?.description) {
      setPickupAddress(source.description);
    }
  }, [source]);

  useEffect(() => {
    if (destination?.description) {
      setDropAddress(destination.description);
    }
  }, [destination]);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={() => {
        setActiveInput(null);
        Keyboard.dismiss();
      }}>
        <View style={styles.mapWrapper}>
        <MapView
          style={styles.map}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          mapType="standard"
          showsUserLocation={false}
          followsUserLocation={navigationStarted}
          onPanDrag={() => setFollowUser(false)}
          onTouchStart={() => setFollowUser(false)}>
          {hasLocation && !navigationStarted && (
            <Marker
              coordinate={currentLocation}
              pinColor="blue"
              title="You are here"
              onPress={setCurrentAsSource}>
              <View style={styles.markerGlow}>
                <View style={styles.markerInner} />
              </View>
            </Marker>
          )}

          {navigationStarted && (
            <Marker
              coordinate={currentLocation}
              anchor={{x: 0.5, y: 0.5}}
              rotation={bearing}>
              <View style={styles.arrowContainer}>
                <Navigation_Icon width={30} height={30} />
              </View>
            </Marker>
          )}

          {source && (
            <Marker coordinate={source} pinColor="green" title="Source" />
          )}

          {destination && (
            <Marker
              coordinate={destination}
              pinColor="red"
              title="Destination"
            />
          )}

          {source && destination && (
            <MapViewDirections
              origin={source}
              destination={destination}
              apikey={GOOGLE_MAPS_API_KEY}
              strokeWidth={4}
              strokeColor="#3B82F6"
            />
          )}
        </MapView>
        {/* LOADING STATE */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Getting your location...</Text>
          </View>
        )}

        {/* LOAD CARD */}
        <View style={styles.loadCard}>
          <View style={styles.loadCardRow}>
            {/* LEFT CONTENT */}
            <View style={styles.loadLeft}>
              <Text style={styles.cardTitle}>Current Load</Text>

              <Text style={styles.cardText}>Pickup: {pickupAddress}</Text>

              <Text style={styles.cardText}>Drop: {dropAddress}</Text>

              <Text style={styles.cardText}>
                {navigationStarted
                  ? `Remaining: ${(remainingDistance / 1000).toFixed(
                      1,
                    )} km • ETA: ${Math.ceil(remainingTime / 60)} min`
                  : 'ETA: N/A'}
              </Text>
            </View>

            {/* RIGHT CONTENT */}
            <View style={styles.loadRight}>
              <Text
                style={[
                  styles.status,
                  navigationStarted && {
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#EF4444',
                  },
                ]}>
                {navigationStarted ? 'Navigating' : 'On Route'}
              </Text>
            </View>
            
          </View>
          {destination && (
            <TouchableOpacity
              style={styles.navigateButton}
              onPress={navigateToDestination}
              activeOpacity={0.8}>
              <Text style={styles.navigateText}>Start Navigation</Text>
              <View style={styles.iconCircle}>
                <Navigation_Icon width={25} height={25} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* SEARCH CARD */}
        <View style={styles.searchCard}>
          <View style={styles.labelRow}>
            <Location_Icon width={scale(18)} height={scale(18)} />
            <Text style={styles.labelText}>Source</Text>
          </View>
          <View style={styles.searchInputContainer}>
            <TouchableOpacity
              style={styles.swapIconLeft}
              onPress={swapSourceDestination}>
              <Arrow_left_right width={25} height={25} />
            </TouchableOpacity>
            <GooglePlacesAutocomplete
              ref={sourceAutocompleteRef}
              placeholder="Enter pickup location"
              textInputProps={{
                onFocus: () => setActiveInput('source'),
              }}
              fetchDetails
              onPress={(data, details = null) => {
                setSource({
                  latitude: details.geometry.location.lat,
                  longitude: details.geometry.location.lng,
                  description: data.description,
                });
                const address = data?.description;
                setPickupAddress(address);
                setSourceText(data.description);
                setActiveInput(null);
                Keyboard.dismiss();
              }}
              query={{
                key: GOOGLE_MAPS_API_KEY,
                language: 'en',
              }}
              styles={{
                container: {flex: 1},
                textInput: [
                  styles.searchInput,
                  activeInput === 'source' && styles.searchInputActive,
                ],
                listView: {
                  position: 'absolute',
                  top: verticalScale(48),
                  left: 0,
                  right: 0,
                  backgroundColor: '#fff',
                  borderRadius: moderateScale(8),
                  elevation: 6,
                  shadowColor: '#000',
                  shadowOpacity: 0.15,
                  shadowRadius: moderateScale(6),
                  zIndex: 1000,
                },
              }}
            />
          </View>

          <View style={styles.labelRow}>
            <Location_Icon width={scale(18)} height={scale(18)} />
            <Text style={styles.labelText}>Destination</Text>
          </View>
          <View style={styles.searchInputContainer}>
            <TouchableOpacity
              style={styles.swapIconLeft}
              onPress={swapSourceDestination}>
              <Arrow_left_right width={25} height={25} />
            </TouchableOpacity>
            <GooglePlacesAutocomplete
              ref={destinationAutocompleteRef}
              placeholder="Enter drop location"
              textInputProps={{
                onFocus: () => setActiveInput('destination'),
              }}
              fetchDetails
              onPress={(data, details = null) => {
                setDestination({
                  latitude: details.geometry.location.lat,
                  longitude: details.geometry.location.lng,
                  description: data.description,
                });
                const address = data?.description;
                setDropAddress(address);
                setDestinationText(data.description);
                setActiveInput(null); // Clear active input when selection is made
                Keyboard.dismiss(); // Dismiss keyboard after selection
              }}
              query={{
                key: GOOGLE_MAPS_API_KEY,
                language: 'en',
              }}
              styles={{
                container: {flex: 1},
                textInput: [
                  styles.searchInput,
                  activeInput === 'destination' && styles.searchInputActive,
                ],
                listView: {
                  position: 'absolute',
                  top: verticalScale(48),
                  left: 0,
                  right: 0,
                  backgroundColor: '#fff',
                  borderRadius: moderateScale(8),
                  elevation: 6,
                  shadowColor: '#000',
                  shadowOpacity: 0.15,
                  shadowRadius: moderateScale(6),
                  zIndex: 1000,
                },
              }}
            />
          </View>
        </View>

        {/* FLOATING BUTTON */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fab}
            onPress={centerOnCurrentLocation}
            disabled={fetchingSourceAddress || fetchingDestinationAddress}>
            {fetchingSourceAddress || fetchingDestinationAddress ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <GPS_Icon width={28} height={28} />
            )}
          </TouchableOpacity>
        </View>

        {/* CURRENT NAVIGATION INSTRUCTION */}
        {navigationStarted && directions[currentStep] && (
          <View style={styles.navigationBanner}>
            <Text style={styles.navigationInstruction}>
              {directions[currentStep].instruction}
            </Text>
            <Text style={styles.navigationDetails}>
              {directions[currentStep].distance} •{' '}
              {directions[currentStep].duration}
            </Text>
          </View>
        )}
      </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default NavigationScreen;
