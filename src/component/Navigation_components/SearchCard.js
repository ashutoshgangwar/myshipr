import React from 'react';
import {View, Text, TouchableOpacity, Keyboard} from 'react-native';
import {moderateScale, verticalScale, scale} from 'react-native-size-matters';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import Location_Icon from '../../assets/svg_icon/location.svg';
import Arrow_left_right from '../../assets/svg_icon/arrow-right-lef.svg';
import styles from '../../screens/NavigationScreen/NavigationScreen.styles';

const SearchCard = ({
  sourceRef,
  destinationRef,
  activeInput,
  onActiveInputChange,
  onSourceSelect,
  onDestinationSelect,
  onSwap,
  apiKey,
}) => {
  return (
    <View style={styles.searchCard}>
      <View style={styles.labelRow}>
        <Location_Icon width={scale(18)} height={scale(18)} />
        <Text style={styles.labelText}>Source</Text>
      </View>
      <View style={styles.searchInputContainer}>
        <TouchableOpacity style={styles.swapIconLeft} onPress={onSwap}>
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
            onSourceSelect(data, details);
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
        <Text style={styles.labelText}>Destination</Text>
      </View>
      <View style={styles.searchInputContainer}>
        <TouchableOpacity style={styles.swapIconLeft} onPress={onSwap}>
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
            onDestinationSelect(data, details);
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
