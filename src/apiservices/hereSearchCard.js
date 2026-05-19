import React, {useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Keyboard,
  TextInput,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import {scale} from 'react-native-size-matters';
import Location_Icon from '../assets/svg_icon/location.svg';
import Arrow_left_right from '../assets/svg_icon/arrow-right-lef.svg';
import styles from './hereSearchCard.styles';
import AppText from '../theme/AppText';

const HERE_SEARCH_MIN_CHARS = 3;
const HERE_SEARCH_DEBOUNCE_MS = 700;
const HERE_SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
const HERE_API_KEY = '3nXPL2aYbn53qdzDc0rQ8Qbuhhtr8QjHR68m6XmFiwQ';
const HERE_DEFAULT_COORDS = {
  latitude: 28.6139,
  longitude: 77.209,
};

const HereSearchCard = ({
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
  onSwap,
}) => {
  // --- HERE API autocomplete implementation ---
  const [sourceQuery, setSourceQuery] = useState('');
  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [focusedField, setFocusedField] = useState('source');
  const sourceTimerRef = useRef(null);
  const [sourceCoords, setSourceCoords] = useState(null);

  const [destQuery, setDestQuery] = useState('');
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [destLoading, setDestLoading] = useState(false);
  const destTimerRef = useRef(null);
  const [destCoords, setDestCoords] = useState(null);
  const suggestionCacheRef = useRef(new Map());
  const lastRouteKeyRef = useRef('');
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [routeResponse, setRouteResponse] = useState(null);

  const clearRoutePreview = useCallback(() => {
    lastRouteKeyRef.current = '';
    setRouteResponse(null);
    setRouteError('');
    setRouteLoading(false);
  }, []);

  const formatDistance = value => {
    if (!Number.isFinite(value)) {
      return 'N/A';
    }

    return `${(value / 1000).toFixed(2)} km`;
  };

  const formatDuration = value => {
    if (!Number.isFinite(value)) {
      return 'N/A';
    }

    return `${Math.ceil(value / 60)} min`;
  };

  const fetchHereRoute = useCallback(async (origin, destination) => {
    if (
      !Number.isFinite(origin?.latitude) ||
      !Number.isFinite(origin?.longitude) ||
      !Number.isFinite(destination?.latitude) ||
      !Number.isFinite(destination?.longitude)
    ) {
      return;
    }

    setRouteLoading(true);
    setRouteError('');

    try {
      const routeUrl =
        `https://router.hereapi.com/v8/routes?transportMode=car` +
        `&origin=${origin.latitude},${origin.longitude}` +
        `&destination=${destination.latitude},${destination.longitude}` +
        `&return=summary` +
        `&apiKey=${HERE_API_KEY}`;

      const response = await fetch(routeUrl, {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HERE route error ${response.status}: ${errorText}`);
      }

      const json = await response.json();
      console.log('HERE route response:', json);
      setRouteResponse(json);
    } catch (error) {
      console.warn('HERE route fetch failed:', error);
      setRouteResponse(null);
      setRouteError(error?.message || 'Unable to fetch route');
    } finally {
      setRouteLoading(false);
    }
  }, []);

  const fetchHereSuggestions = useCallback(async (q, coords = null) => {
    const query = (q || '').trim();
    if (!query || query.length < HERE_SEARCH_MIN_CHARS) return [];

    const searchCoords =
      coords && Number.isFinite(coords.latitude) && Number.isFinite(coords.longitude)
        ? coords
        : HERE_DEFAULT_COORDS;

    const cacheKey = query.toLowerCase();
    const cached = suggestionCacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < HERE_SEARCH_CACHE_TTL_MS) {
      return cached.items;
    }

    try {
      let url = `https://autosuggest.search.hereapi.com/v1/autosuggest?q=${encodeURIComponent(
        query,
      )}&apiKey=${HERE_API_KEY}&limit=5&at=${searchCoords.latitude},${searchCoords.longitude}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {'Content-Type': 'application/json'},
      });
      
      if (!res.ok) {
        console.warn('HERE API error:', res.status);
        return [];
      }

      const json = await res.json();
      const items = (json.items || [])
        .filter(item => item?.title && item?.position?.lat && item?.position?.lng)
        .map(item => ({
          id: item.id,
          title: item.title,
          address: item.address?.label || item.title,
          latitude: item.position?.lat,
          longitude: item.position?.lng,
        }));

      suggestionCacheRef.current.set(cacheKey, {items, timestamp: Date.now()});
      return items;
    } catch (err) {
      console.warn('HERE API suggestions error', err);
      return [];
    }
  }, []);

  const onSourceChange = useCallback(
    q => {
      setFocusedField('source');
      setSourceQuery(q);
      setSourceCoords(null);
      setDestSuggestions([]);
      setDestLoading(false);
      clearRoutePreview();
      const normalized = (q || '').trim();
      if (sourceTimerRef.current) clearTimeout(sourceTimerRef.current);

      if (normalized.length < HERE_SEARCH_MIN_CHARS) {
        setSourceSuggestions([]);
        setSourceLoading(false);
        return;
      }

      sourceTimerRef.current = setTimeout(async () => {
        setSourceLoading(true);
        const items = await fetchHereSuggestions(normalized, sourceCoords);
        setSourceSuggestions(items);
        setSourceLoading(false);
      }, HERE_SEARCH_DEBOUNCE_MS);
    },
    [clearRoutePreview, fetchHereSuggestions, sourceCoords],
  );

  const onDestChange = useCallback(
    q => {
      setFocusedField('destination');
      setDestQuery(q);
      setDestCoords(null);
      setSourceSuggestions([]);
      setSourceLoading(false);
      clearRoutePreview();
      const normalized = (q || '').trim();
      if (destTimerRef.current) clearTimeout(destTimerRef.current);

      if (normalized.length < HERE_SEARCH_MIN_CHARS) {
        setDestSuggestions([]);
        setDestLoading(false);
        return;
      }

      destTimerRef.current = setTimeout(async () => {
        setDestLoading(true);
        const items = await fetchHereSuggestions(normalized, destCoords);
        setDestSuggestions(items);
        setDestLoading(false);
      }, HERE_SEARCH_DEBOUNCE_MS);
    },
    [clearRoutePreview, fetchHereSuggestions, destCoords],
  );

  const handleHereSourceSelect = item => {
    const location = {
      latitude: item.latitude,
      longitude: item.longitude,
      description: item.title,
    };
    console.log('HERE source selected:', {
      latitude: item.latitude,
      longitude: item.longitude,
      title: item.title,
    });
    setSourceLocation?.(location);
    setSourceText?.(item.title);
    setSourceCoords({latitude: item.latitude, longitude: item.longitude});
    onCoordinateSelect?.(item.latitude, item.longitude);
    setSourceSuggestions([]);
    setSourceQuery(item.title);
    Keyboard.dismiss();
  };

  const handleHereDestSelect = item => {
    const location = {
      latitude: item.latitude,
      longitude: item.longitude,
      description: item.title,
    };
    console.log('HERE destination selected:', {
      latitude: item.latitude,
      longitude: item.longitude,
      title: item.title,
    });
    setDestinationLocation?.(location);
    setDestinationText?.(item.title);
    setDestCoords({latitude: item.latitude, longitude: item.longitude});
    onCoordinateSelect?.(item.latitude, item.longitude);
    setDestSuggestions([]);
    setDestQuery(item.title);
    Keyboard.dismiss();
  };

  // expose minimal setAddressText API on refs when using HERE inputs
  React.useEffect(() => {
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
      console.warn('HERE ref wiring failed', err);
    }
    return () => {
      try {
        if (sourceRef && sourceRef.current) delete sourceRef.current.setAddressText;
        if (destinationRef && destinationRef.current) delete destinationRef.current.setAddressText;
      } catch (err) {}
    };
  }, [sourceRef, destinationRef]);

  React.useEffect(() => {
    setSourceQuery(sourceText || '');
  }, [sourceText]);

  React.useEffect(() => {
    setDestQuery(destinationText || '');
  }, [destinationText]);

  React.useEffect(() => {
    if (
      !Number.isFinite(sourceCoords?.latitude) ||
      !Number.isFinite(sourceCoords?.longitude) ||
      !Number.isFinite(destCoords?.latitude) ||
      !Number.isFinite(destCoords?.longitude)
    ) {
      return;
    }

    const routeKey = `${sourceCoords.latitude},${sourceCoords.longitude}:${destCoords.latitude},${destCoords.longitude}`;
    if (lastRouteKeyRef.current === routeKey) {
      return;
    }

    lastRouteKeyRef.current = routeKey;
    fetchHereRoute(sourceCoords, destCoords);
  }, [destCoords, fetchHereRoute, sourceCoords]);

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
    setSourceCoords(
      Number.isFinite(nextSourceLocation?.latitude) &&
        Number.isFinite(nextSourceLocation?.longitude)
        ? {
            latitude: nextSourceLocation.latitude,
            longitude: nextSourceLocation.longitude,
          }
        : null,
    );
    setDestCoords(
      Number.isFinite(nextDestinationLocation?.latitude) &&
        Number.isFinite(nextDestinationLocation?.longitude)
        ? {
            latitude: nextDestinationLocation.latitude,
            longitude: nextDestinationLocation.longitude,
          }
        : null,
    );
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

  const routeSection = routeResponse?.routes?.[0]?.sections?.[0];
  const routeSummary = routeSection?.summary;

  return (
    <View style={styles.searchCard}>
      <View style={styles.labelRow}>
        <Location_Icon width={scale(18)} height={scale(18)} />
        <AppText style={styles.labelText}>Source</AppText>
      </View>
      <View
        style={[
          styles.searchInputContainer,
          focusedField === 'source' && styles.searchInputContainerActive,
        ]}>
        <TouchableOpacity style={styles.swapIconLeft} onPress={handleSwapPress}>
          <Arrow_left_right width={25} height={25} />
        </TouchableOpacity>
        <View style={{flex: 1}}>
          <TextInput
            ref={sourceRef}
            style={[styles.searchInput, activeInput === 'source' && styles.searchInputActive]}
            placeholder="Enter pickup location"
            value={sourceQuery}
            onFocus={() => {
              setFocusedField('source');
              onActiveInputChange?.('source');
              setDestSuggestions([]);
            }}
            onChangeText={onSourceChange}
            placeholderTextColor="#999"
          />
          {sourceLoading && (
            <ActivityIndicator size="small" style={styles.loadingIndicator} />
          )}
          {focusedField === 'source' && sourceSuggestions.length > 0 && (
            <FlatList
              data={sourceSuggestions}
              keyExtractor={i => i.id}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              style={styles.suggestionList}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleHereSourceSelect(item)}>
                  <Text style={styles.suggestionTitle}>{item.title}</Text>
                  <Text style={styles.suggestionAddress}>{item.address}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>

      <View style={styles.labelRow}>
        <Location_Icon width={scale(18)} height={scale(18)} />
        <AppText style={styles.labelText}>Destination</AppText>
      </View>
      <View
        style={[
          styles.searchInputContainer,
          focusedField === 'destination' && styles.searchInputContainerActive,
        ]}>
        <TouchableOpacity style={styles.swapIconLeft} onPress={handleSwapPress}>
          <Arrow_left_right width={25} height={25} />
        </TouchableOpacity>
        <View style={{flex: 1}}>
          <TextInput
            ref={destinationRef}
            style={[styles.searchInput, activeInput === 'destination' && styles.searchInputActive]}
            placeholder="Enter drop location"
            value={destQuery}
            onFocus={() => {
              setFocusedField('destination');
              onActiveInputChange?.('destination');
              setSourceSuggestions([]);
            }}
            onChangeText={onDestChange}
            placeholderTextColor="#999"
          />
          {destLoading && (
            <ActivityIndicator size="small" style={styles.loadingIndicator} />
          )}
          {focusedField === 'destination' && destSuggestions.length > 0 && (
            <FlatList
              data={destSuggestions}
              keyExtractor={i => i.id}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              style={styles.suggestionList}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleHereDestSelect(item)}>
                  <Text style={styles.suggestionTitle}>{item.title}</Text>
                  <Text style={styles.suggestionAddress}>{item.address}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>

      {routeLoading && (
        <View style={styles.routeLoadingRow}>
          <ActivityIndicator size="small" color="#1D4ED8" />
          <AppText style={styles.routeLoadingText}>Fetching HERE route...</AppText>
        </View>
      )}

      {!!routeError && <AppText style={styles.routeError}>{routeError}</AppText>}

      {routeResponse && (
        <View style={styles.routeCard}>
          <View style={styles.routeHeaderRow}>
            <AppText style={styles.routeTitle}>HERE Route Response</AppText>
            <View style={styles.routeBadge}>
              <AppText style={styles.routeBadgeText}>CAR</AppText>
            </View>
          </View>

          <View style={styles.routeGrid}>
            <View style={styles.routeInfoItem}>
              <AppText style={styles.routeInfoLabel}>Distance</AppText>
              <AppText style={styles.routeInfoValue}>
                {formatDistance(routeSummary?.length)}
              </AppText>
            </View>
            <View style={styles.routeInfoItem}>
              <AppText style={styles.routeInfoLabel}>Duration</AppText>
              <AppText style={styles.routeInfoValue}>
                {formatDuration(routeSummary?.duration)}
              </AppText>
            </View>
            <View style={styles.routeInfoItem}>
              <AppText style={styles.routeInfoLabel}>Base Duration</AppText>
              <AppText style={styles.routeInfoValue}>
                {formatDuration(routeSummary?.baseDuration)}
              </AppText>
            </View>
            <View style={styles.routeInfoItem}>
              <AppText style={styles.routeInfoLabel}>Route Id</AppText>
              <AppText style={styles.routeInfoValue}>
                {routeResponse?.routes?.[0]?.id || 'N/A'}
              </AppText>
            </View>
          </View>        
          </View>
      )}
    </View>
  );
};

export default HereSearchCard;
