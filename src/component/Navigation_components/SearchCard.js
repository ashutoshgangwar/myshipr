import React from 'react';
import {View, Text, TouchableOpacity, Keyboard} from 'react-native';
import {moderateScale, verticalScale, scale} from 'react-native-size-matters';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import Location_Icon from '../../assets/svg_icon/location.svg';
import Arrow_left_right from '../../assets/svg_icon/arrow-right-lef.svg';
import styles from '../../screens/NavigationScreen/NavigationScreen.styles';
import AppText from '../../theme/AppText';

const SearchCard = ({
  sourceRef,
  destinationRef,
  activeInput,
  onActiveInputChange,
  sourceLocation,
  destinationLocation,
  sourceText,
  destinationText,
  setSourceLocation,
  setDestinationLocation,
  setSourceText,
  setDestinationText,
  onCoordinateSelect,
  onSourceSelect,
  onDestinationSelect,
  onSwap,
  apiKey,
}) => {
  const getLatLngFromPlaceDetails = details => {
    const rawLat = details?.geometry?.location?.lat;
    const rawLng = details?.geometry?.location?.lng;

    const latitudeValue = typeof rawLat === 'function' ? rawLat() : rawLat;
    const longitudeValue = typeof rawLng === 'function' ? rawLng() : rawLng;

    if (!Number.isFinite(latitudeValue) || !Number.isFinite(longitudeValue)) {
      return null;
    }

    return {
      latitude: latitudeValue,
      longitude: longitudeValue,
    };
  };

  const handleSourcePress = (data, details) => {
    const canHandleInternally =
      typeof setSourceLocation === 'function' &&
      typeof setSourceText === 'function' &&
      typeof onCoordinateSelect === 'function';

    if (!canHandleInternally) {
      onSourceSelect?.(data, details);
      return;
    }

    const latLng = getLatLngFromPlaceDetails(details);
    if (!latLng) return;

    const location = {
      ...latLng,
      description: data?.description ?? 'Source',
    };

    setSourceLocation(location);
    setSourceText(location.description);
    onCoordinateSelect(latLng.latitude, latLng.longitude);
  };

  const handleDestinationPress = (data, details) => {
    const canHandleInternally =
      typeof setDestinationLocation === 'function' &&
      typeof setDestinationText === 'function' &&
      typeof onCoordinateSelect === 'function';

    if (!canHandleInternally) {
      onDestinationSelect?.(data, details);
      return;
    }

    const latLng = getLatLngFromPlaceDetails(details);
    if (!latLng) return;

    const location = {
      ...latLng,
      description: data?.description ?? 'Destination',
    };

    setDestinationLocation(location);
    setDestinationText(location.description);
    onCoordinateSelect(latLng.latitude, latLng.longitude);
  };

  const handleSwapPress = () => {
    const canHandleInternally =
      typeof setSourceLocation === 'function' &&
      typeof setDestinationLocation === 'function' &&
      typeof setSourceText === 'function' &&
      typeof setDestinationText === 'function';

    if (!canHandleInternally) {
      onSwap?.();
      return;
    }

    const nextSourceLocation = destinationLocation ?? null;
    const nextDestinationLocation = sourceLocation ?? null;

    setSourceLocation(nextSourceLocation);
    setDestinationLocation(nextDestinationLocation);
    setSourceText(destinationText || '');
    setDestinationText(sourceText || '');

    sourceRef?.current?.setAddressText(destinationText || '');
    destinationRef?.current?.setAddressText(sourceText || '');

    if (
      typeof onCoordinateSelect === 'function' &&
      Number.isFinite(nextDestinationLocation?.latitude) &&
      Number.isFinite(nextDestinationLocation?.longitude)
    ) {
      onCoordinateSelect(
        nextDestinationLocation.latitude,
        nextDestinationLocation.longitude,
      );
    }
  };

  return (
    <View style={styles.searchCard}>
      <View style={styles.labelRow}>
        <Location_Icon width={scale(18)} height={scale(18)} />
        <AppText style={styles.labelText}>Source</AppText>
      </View>
      <View style={styles.searchInputContainer}>
        <TouchableOpacity style={styles.swapIconLeft} onPress={handleSwapPress}>
          <Arrow_left_right width={25} height={25} />
        </TouchableOpacity>
        <GooglePlacesAutocomplete
          ref={sourceRef}
          placeholder="Enter pickup location"
          textInputProps={{
            onFocus: () => onActiveInputChange('source'),
          }}
          fetchDetails
          onPress={(data, details = null) => {
            handleSourcePress(data, details);
            onActiveInputChange(null);
            Keyboard.dismiss();
          }}
          query={{
            key: apiKey,
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
        <AppText style={styles.labelText}>Destination</AppText>
      </View>
      <View style={styles.searchInputContainer}>
        <TouchableOpacity style={styles.swapIconLeft} onPress={handleSwapPress}>
          <Arrow_left_right width={25} height={25} />
        </TouchableOpacity>
        <GooglePlacesAutocomplete
          ref={destinationRef}
          placeholder="Enter drop location"
          textInputProps={{
            onFocus: () => onActiveInputChange('destination'),
          }}
          fetchDetails
          onPress={(data, details = null) => {
            handleDestinationPress(data, details);
            onActiveInputChange(null);
            Keyboard.dismiss();
          }}
          query={{
            key: apiKey,
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
  );
};

export default SearchCard;
