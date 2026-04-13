import React, {useState, useEffect, useRef} from 'react';
import {
  Animated,
  Easing,
  View,
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import styles from './NavigationScreen.styles';

import Truck_Icon from '../../assets/svg_icon/truck-icon.svg';

import MapView, {Marker, Polyline, PROVIDER_GOOGLE} from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import {
  getCurrentLocation,
  watchCurrentLocation,
  clearWatchLocation,
} from '../../services/LocationService';
import {useDispatch, useSelector} from 'react-redux';
import {selectLocation, setLocation} from '../../redux/slices/locationSlice';
import {GOOGLE_MAPS_API_KEY} from '@env';

import {
  CustomMarker,
  LoadCard,
  SearchCard,
  NavigationBanner,
  GPSButton,
  LoadingOverlay,
} from '../../component/Navigation_components';
import StatusBar from '../../component/StatusBar/StatusBar';
import { colors } from '../../theme/colors';

const NavigationScreen = () => {
  const isAndroid = Platform.OS === 'android';
  const dispatch = useDispatch();
  const cachedLocation = useSelector(selectLocation);
  const hasCachedLocation =
    Number.isFinite(cachedLocation?.latitude) &&
    Number.isFinite(cachedLocation?.longitude);

  const initialCurrentLocation = hasCachedLocation
    ? {
        latitude: cachedLocation.latitude,
        longitude: cachedLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };

  const [currentLocation, setCurrentLocation] = useState({
    ...initialCurrentLocation,
  });
  const [loading, setLoading] = useState(!hasCachedLocation);
  const [hasLocation, setHasLocation] = useState(hasCachedLocation);
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

  const sourceAutocompleteRef = useRef(null);
  const destinationAutocompleteRef = useRef(null);
  const markerPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAndroid) {
      markerPulse.setValue(0);
      return;
    }

    const useNativeDriver = false;
    const pulseDuration = 1200;

    const markerPulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(markerPulse, {
          toValue: 1,
          duration: pulseDuration,
          easing: Easing.out(Easing.quad),
          useNativeDriver,
        }),
        Animated.timing(markerPulse, {
          toValue: 0,
          duration: pulseDuration,
          easing: Easing.in(Easing.quad),
          useNativeDriver,
        }),
      ]),
    );

    markerPulseLoop.start();

    return () => markerPulseLoop.stop();
  }, [isAndroid, markerPulse]);

  const pulseScale = markerPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 44],
  });

  const pulseRadius = markerPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 22],
  });

  const pulseOpacity = markerPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0.1],
  });

  useEffect(() => {
    let watcher;
    const startWatching = async () => {
      try {
        if (hasCachedLocation) {
          setCurrentLocation({
            latitude: cachedLocation.latitude,
            longitude: cachedLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
          setHasLocation(true);
          setLoading(false);
        } else {
          const initialLocation = await getCurrentLocation();
          setCurrentLocation({
            latitude: initialLocation.latitude,
            longitude: initialLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
          dispatch(
            setLocation({
              latitude: initialLocation.latitude,
              longitude: initialLocation.longitude,
            }),
          );
          setHasLocation(true);
          setLoading(false);
        }

        watcher = await watchCurrentLocation(
          position => {
            const {latitude, longitude} = position.coords;
            setCurrentLocation({
              latitude,
              longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            });
            dispatch(setLocation({latitude, longitude}));
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
    if (activeInput) {
      if (activeInput === 'source') {
        await setCurrentLocationAsSource();
      } else if (activeInput === 'destination') {
        await setCurrentLocationAsDestination();
      }
      setActiveInput(null);
    } else {
      setMapRegion({
        ...currentLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
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
    const tempText = sourceText;
    setSourceText(destinationText);
    setDestinationText(tempText);
  };

  const extractZipCodeFromPlaceDetails = details => {
    const components = details?.address_components || [];
    const postalCodeComponent = components.find(component =>
      component?.types?.includes('postal_code'),
    );
    return postalCodeComponent?.long_name || null;
  };

  const extractZipCodeFromDescription = description => {
    if (!description) return null;
    const match = description.match(/\b\d{5}(?:-\d{4})?\b|\b\d{6}\b/);
    return match?.[0] || null;
  };

  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`,
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const postalCodeComponent = result.address_components?.find(
          component => component?.types?.includes('postal_code'),
        );
        return {
          address: result.formatted_address,
          zipCode: postalCodeComponent?.long_name || null,
        };
      }
      return {address: 'Current Location', zipCode: null};
    } catch (error) {
      console.log('Error getting address:', error);
      return {address: 'Current Location', zipCode: null};
    }
  };

  const setCurrentLocationAsSource = async () => {
    setFetchingSourceAddress(true);
    try {
      const {address, zipCode} = await getAddressFromCoordinates(
        currentLocation.latitude,
        currentLocation.longitude,
      );
      console.log('Source ZIP code:', zipCode);
      setSource({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        description: address,
      });
      setSourceText(address);
      if (sourceAutocompleteRef.current) {
        sourceAutocompleteRef.current.setAddressText(address);
      }
    } catch (error) {
      console.log('Error setting current location as source:', error);
      setCurrentAsSource();
    } finally {
      setFetchingSourceAddress(false);
    }
  };

  const setCurrentLocationAsDestination = async () => {
    setFetchingDestinationAddress(true);
    try {
      const {address, zipCode} = await getAddressFromCoordinates(
        currentLocation.latitude,
        currentLocation.longitude,
      );
      console.log('Destination ZIP code:', zipCode);
      setDestination({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        description: address,
      });
      setDestinationText(address);
      if (destinationAutocompleteRef.current) {
        destinationAutocompleteRef.current.setAddressText(address);
      }
    } catch (error) {
      console.log('Error setting current location as destination:', error);
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
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance * 1000;
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
          setCurrentStep(prev => Math.min(directions.length - 1, prev + 1));
        }
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
    if (navigationStarted && followUser) {
      setMapRegion({
        ...currentLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [currentLocation, navigationStarted, followUser]);

  useEffect(() => {
    if (!hasLocation || navigationStarted || !followUser) return;

    setMapRegion({
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  }, [currentLocation, hasLocation, navigationStarted, followUser]);

  const navigateToDestination = async () => {
    const startLocation = source || {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      description: 'Current Location',
    };
    if (!destination) return;
    setSource(startLocation);
    setNavigationStarted(true);
    setFollowUser(true);
    setCurrentStep(0);
    setMapRegion({
      ...currentLocation,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    if (!directions || directions.length === 0) {
      fetchDirections(startLocation, destination);
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
       <StatusBar
        backgroundColor={colors.primary}
        barStyle="light-content"
        translucent={false}
      />
      <TouchableWithoutFeedback
        onPress={() => {
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
                coordinate={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                }}
                title="You are here"
                description="Current Location"
                pinColor="#2563EB"
                onPress={setCurrentAsSource}
                tracksViewChanges={false}
              />
            )}

            {navigationStarted && (
              <Marker
                coordinate={currentLocation}
                anchor={{x: 0.5, y: 0.5}}
                rotation={bearing}>
                <View style={styles.arrowContainer}>
                  <Truck_Icon width={30} height={30} />
                </View>
              </Marker>
            )}

            {source && (
              <Marker
                coordinate={source}
                title="Source"
                tracksViewChanges={false}
                onPress={() => console.log('Source marker pressed')}>
                <CustomMarker type="source" title="Pickup" showLogo={true} />
              </Marker>
            )}

            {destination && (
              <Marker
                coordinate={destination}
                title="Destination"
                tracksViewChanges={false}
                onPress={() => console.log('Destination marker pressed')}>
                <CustomMarker
                  type="destination"
                  title="Dropoff"
                  showLogo={true}
                />
              </Marker>
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

          <LoadingOverlay loading={loading} />

          <LoadCard
            navigationStarted={navigationStarted}
            remainingDistance={remainingDistance}
            remainingTime={remainingTime}
            pickupAddress={pickupAddress}
            dropAddress={dropAddress}
            destination={destination}
            onNavigatePress={navigateToDestination}
          />

          <SearchCard
            sourceRef={sourceAutocompleteRef}
            destinationRef={destinationAutocompleteRef}
            activeInput={activeInput}
            onActiveInputChange={setActiveInput}
            onSourceSelect={(data, details) => {
              const sourceZipCode =
                extractZipCodeFromPlaceDetails(details) ||
                extractZipCodeFromDescription(data?.description);
              console.log('Source ZIP code:', sourceZipCode);

              setSource({
                latitude: details.geometry.location.lat,
                longitude: details.geometry.location.lng,
                description: data.description,
              });
              setPickupAddress(data?.description);
              setSourceText(data.description);
            }}
            onDestinationSelect={(data, details) => {
              const destinationZipCode =
                extractZipCodeFromPlaceDetails(details) ||
                extractZipCodeFromDescription(data?.description);
              console.log('Destination ZIP code:', destinationZipCode);

              setDestination({
                latitude: details.geometry.location.lat,
                longitude: details.geometry.location.lng,
                description: data.description,
              });
              setDropAddress(data?.description);
              setDestinationText(data.description);
            }}
            onSwap={swapSourceDestination}
            apiKey={GOOGLE_MAPS_API_KEY}
          />

          <GPSButton
            onPress={centerOnCurrentLocation}
            disabled={fetchingSourceAddress || fetchingDestinationAddress}
            loading={fetchingSourceAddress || fetchingDestinationAddress}
          />

          {navigationStarted && directions[currentStep] && (
            <NavigationBanner
              instruction={directions[currentStep].instruction}
              distance={directions[currentStep].distance}
              duration={directions[currentStep].duration}
            />
          )}
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default NavigationScreen;
