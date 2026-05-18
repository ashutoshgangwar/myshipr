import React, {useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Keyboard,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {moderateScale, verticalScale, scale} from 'react-native-size-matters';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import Location_Icon from '../assets/svg_icon/location.svg';
import Arrow_left_right from '../assets/svg_icon/arrow-right-lef.svg';
import styles from '../screens/NavigationScreen/NavigationScreen.styles';
import AppText from '../theme/AppText';

const PtvSearchCard = ({
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
  ptvApiKey,
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

  // --- PTV autocomplete implementation ---
  const [sourceQuery, setSourceQuery] = useState('');
  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [sourceLoading, setSourceLoading] = useState(false);
  const sourceTimerRef = useRef(null);

  const [destQuery, setDestQuery] = useState('');
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [destLoading, setDestLoading] = useState(false);
  const destTimerRef = useRef(null);

  const fetchPtvSuggestions = useCallback(async (q, ptvApiKey) => {
    if (!q || !ptvApiKey) return [];
    try {
      const url = `https://api.myptv.com/geocoding/v1/locations/by-text?searchText=${encodeURIComponent(
        q,
      )}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {ApiKey: ptvApiKey, 'Content-Type': 'application/json'},
      });
      if (!res.ok) return [];
      const json = await res.json();
      return (json.locations || []).map(loc => ({
        id: loc.feedbackId || `${loc.referencePosition.latitude}_${loc.referencePosition.longitude}`,
        title: loc.formattedAddress || loc.address?.city || '',
        latitude: loc.referencePosition?.latitude,
        longitude: loc.referencePosition?.longitude,
      }));
    } catch (err) {
      console.warn('PTV suggestions error', err);
      return [];
    }
  }, []);

  const onSourceChange = useCallback(
    q => {
      setSourceQuery(q);
      if (!ptvApiKey) return;
      if (sourceTimerRef.current) clearTimeout(sourceTimerRef.current);
      sourceTimerRef.current = setTimeout(async () => {
        setSourceLoading(true);
        const items = await fetchPtvSuggestions(q, ptvApiKey);
        setSourceSuggestions(items);
        setSourceLoading(false);
      }, 300);
    },
    [fetchPtvSuggestions, ptvApiKey],
  );

  const onDestChange = useCallback(
    q => {
      setDestQuery(q);
      if (!ptvApiKey) return;
      if (destTimerRef.current) clearTimeout(destTimerRef.current);
      destTimerRef.current = setTimeout(async () => {
        setDestLoading(true);
        const items = await fetchPtvSuggestions(q, ptvApiKey);
        setDestSuggestions(items);
        setDestLoading(false);
      }, 300);
    },
    [fetchPtvSuggestions, ptvApiKey],
  );

  const handlePtvSourceSelect = item => {
    const location = {
      latitude: item.latitude,
      longitude: item.longitude,
      description: item.title,
    };
    setSourceLocation?.(location);
    setSourceText?.(item.title);
    onCoordinateSelect?.(item.latitude, item.longitude);
    setSourceSuggestions([]);
    setSourceQuery(item.title);
    Keyboard.dismiss();
  };

  const handlePtvDestSelect = item => {
    const location = {
      latitude: item.latitude,
      longitude: item.longitude,
      description: item.title,
    };
    setDestinationLocation?.(location);
    setDestinationText?.(item.title);
    onCoordinateSelect?.(item.latitude, item.longitude);
    setDestSuggestions([]);
    setDestQuery(item.title);
    Keyboard.dismiss();
  };

  // expose minimal setAddressText API on refs when using PTV inputs
  React.useEffect(() => {
    if (!ptvApiKey) return;
    try {
      if (sourceRef && typeof sourceRef === 'object') {
        sourceRef.current = sourceRef.current || {};
        sourceRef.current.setAddressText = text => setSourceQuery(text || '');
      }
      if (destinationRef && typeof destinationRef === 'object') {
        destinationRef.current = destinationRef.current || {};
        destinationRef.current.setAddressText = text => setDestQuery(text || '');
      }
    } catch (err) {
      console.warn('PTV ref wiring failed', err);
    }
    return () => {
      try {
        if (sourceRef && sourceRef.current) delete sourceRef.current.setAddressText;
        if (destinationRef && destinationRef.current) delete destinationRef.current.setAddressText;
      } catch (err) {}
    };
  }, [ptvApiKey, sourceRef, destinationRef]);

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
        {ptvApiKey ? (
          <View style={{flex: 1}}>
            <TextInput
              style={[styles.searchInput, activeInput === 'source' && styles.searchInputActive]}
              placeholder="Enter pickup location"
              value={sourceQuery}
              onFocus={() => onActiveInputChange('source')}
              onChangeText={onSourceChange}
            />
            {sourceLoading && <ActivityIndicator size="small" />}
            {sourceSuggestions.length > 0 && (
              <FlatList
                data={sourceSuggestions}
                keyExtractor={i => i.id}
                style={{position: 'absolute', top: verticalScale(48), left: 0, right: 0, backgroundColor: '#fff', borderRadius: moderateScale(8), elevation: 6, zIndex: 1000}}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={{padding: 10, borderBottomWidth: 1, borderColor: '#eee'}}
                    onPress={() => handlePtvSourceSelect(item)}>
                    <Text>{item.title}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        ) : (
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
        )}
      </View>

      <View style={styles.labelRow}>
        <Location_Icon width={scale(18)} height={scale(18)} />
        <AppText style={styles.labelText}>Destination</AppText>
      </View>
      <View style={styles.searchInputContainer}>
        <TouchableOpacity style={styles.swapIconLeft} onPress={handleSwapPress}>
          <Arrow_left_right width={25} height={25} />
        </TouchableOpacity>
        {ptvApiKey ? (
          <View style={{flex: 1}}>
            <TextInput
              style={[styles.searchInput, activeInput === 'destination' && styles.searchInputActive]}
              placeholder="Enter drop location"
              value={destQuery}
              onFocus={() => onActiveInputChange('destination')}
              onChangeText={onDestChange}
            />
            {destLoading && <ActivityIndicator size="small" />}
            {destSuggestions.length > 0 && (
              <FlatList
                data={destSuggestions}
                keyExtractor={i => i.id}
                style={{position: 'absolute', top: verticalScale(48), left: 0, right: 0, backgroundColor: '#fff', borderRadius: moderateScale(8), elevation: 6, zIndex: 1000}}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={{padding: 10, borderBottomWidth: 1, borderColor: '#eee'}}
                    onPress={() => handlePtvDestSelect(item)}>
                    <Text>{item.title}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        ) : (
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
        )}
      </View>
    </View>
  );
};

export default PtvSearchCard;
