import React, {useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Keyboard,
  TextInput,
  ActivityIndicator,
  ScrollView,
  useWindowDimensions,
  Modal,
} from 'react-native';
import {scale} from 'react-native-size-matters';
import Location_Icon from '../../assets/svg_icon/location.svg';
import Arrow_left_right from '../../assets/svg_icon/arrow-right-lef.svg';
import styles from './hereSearchCard.styles';
import AppText from '../../theme/AppText';
import {
  autosuggest,
  calculateTruckRouteREST,
  calculateRouteTolls,
} from './services/hereTruckService';

const HERE_SEARCH_MIN_CHARS = 3;
const HERE_SEARCH_DEBOUNCE_MS = 700;
const HERE_SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
const HERE_DEFAULT_COORDS = {latitude: 28.6139, longitude: 77.209};

const MAP_STYLE_OPTIONS = [
  {label: 'Silica',      value: 'explore.day'},
  {label: 'Blackmarble', value: 'explore.night'},
  {label: 'Classic',     value: 'lite.day'},
  {label: 'Amber',       value: 'lite.night'},
  {label: 'Satellite',   value: 'satellite.day'},
];

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
  onSourceSelected,
  onDestinationSelected,
}) => {
  const {height: screenHeight} = useWindowDimensions();
  const cardMaxHeight = Math.max(320, screenHeight * 0.68);

  const [sourceQuery, setSourceQuery]           = useState('');
  const [sourceSuggestions, setSourceSuggestions] = useState([]);
  const [sourceLoading, setSourceLoading]       = useState(false);
  const [focusedField, setFocusedField]         = useState('source');
  const sourceTimerRef                          = useRef(null);
  const [sourceCoords, setSourceCoords]         = useState(null);

  const [destQuery, setDestQuery]               = useState('');
  const [destSuggestions, setDestSuggestions]   = useState([]);
  const [destLoading, setDestLoading]           = useState(false);
  const destTimerRef                            = useRef(null);
  const [destCoords, setDestCoords]             = useState(null);

  const suggestionCacheRef  = useRef(new Map());
  const lastRouteKeyRef     = useRef('');
  const [routeLoading, setRouteLoading]   = useState(false);
  const [routeError, setRouteError]       = useState('');
  const [routeResponse, setRouteResponse] = useState(null);
  const [routeTollData, setRouteTollData] = useState(null);
  const [tollModalVisible, setTollModalVisible] = useState(false);
  const [mapStyle, setMapStyle]           = useState('explore.day');

  // ─── helpers ────────────────────────────────────────────────────────────
  const clearRoutePreview = useCallback(() => {
    lastRouteKeyRef.current = '';
    setRouteResponse(null);
    setRouteError('');
    setRouteLoading(false);
  }, []);

  const formatDistance = v =>
    Number.isFinite(v) ? `${(v / 1000).toFixed(1)} km` : 'N/A';

  const formatDuration = v =>
    Number.isFinite(v) ? `${Math.ceil(v / 60)} min` : 'N/A';

  const getCurrencySymbol = currency => {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'INR': return '₹';
      default: return currency || '$';
    }
  };

  // ─── route fetch ─────────────────────────────────────────────────────────
  const fetchHereRoute = useCallback(async (origin, destination) => {
     console.log('🚀 [Route] Request Start');
     console.log('📍 Origin:', origin);
     console.log('📍 Destination:', destination);

    if (
      !Number.isFinite(origin?.latitude)      || !Number.isFinite(origin?.longitude) ||
      !Number.isFinite(destination?.latitude) || !Number.isFinite(destination?.longitude)
    ) return;

    setRouteLoading(true);
    setRouteError('');
    setRouteResponse(null);
    setRouteTollData(null);

    try {
      const [json, tollJson] = await Promise.all([
        calculateTruckRouteREST(
          {latitude: origin.latitude,      longitude: origin.longitude},
          {latitude: destination.latitude, longitude: destination.longitude},
        ),
        calculateRouteTolls(
          {latitude: origin.latitude,      longitude: origin.longitude},
          {latitude: destination.latitude, longitude: destination.longitude},
        ).catch(err => {
          console.warn('🚧 Toll preview failed', err);
          return null;
        }),
      ]);

      console.log('✅ Route API Response:', json);
      if (tollJson) {
        console.log('✅ Toll API Response:', tollJson);
      }
      setRouteResponse(json);
      setRouteTollData(tollJson);
    } catch (error) {
       console.log('❌ Route API Error:', error);
      setRouteResponse(null);
      setRouteTollData(null);
      setRouteError(error?.message || 'Unable to fetch route');
    } finally {
      setRouteLoading(false);
    }
  }, []);

  // ─── autocomplete ────────────────────────────────────────────────────────
  const fetchHereSuggestions = useCallback(async (q, coords = null) => {
    const query = (q || '').trim();
     console.log('🔍 [Search] Query:', query);
     console.log('📍 Coords:', coords);
    if (!query || query.length < HERE_SEARCH_MIN_CHARS) return [];

    const searchCoords =
      coords && Number.isFinite(coords.latitude) && Number.isFinite(coords.longitude)
        ? coords : HERE_DEFAULT_COORDS;

    const cacheKey = `${query.toLowerCase()}@${searchCoords.latitude},${searchCoords.longitude}`;
    const cached = suggestionCacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < HERE_SEARCH_CACHE_TTL_MS) return cached.items;

    console.log('🌐 Calling HERE autosuggest API...');

    try {
      const items = await autosuggest(query, searchCoords, 5);
        console.log('✅ Suggestions Response:', items);
      suggestionCacheRef.current.set(cacheKey, {items, timestamp: Date.now()});
      return items;
    } catch (err) {
      console.warn('HERE API suggestions error', err);
      return [];
    }
  }, []);

  const onSourceChange = useCallback(q => {
    console.log('⌨️ Source Input:', q);
    setFocusedField('source');
    setSourceQuery(q);
    setSourceCoords(null);
     console.log('🧹 Clearing route due to source change');
    setDestSuggestions([]);
    setDestLoading(false);
    clearRoutePreview();
    if (sourceTimerRef.current) clearTimeout(sourceTimerRef.current);
    const normalized = (q || '').trim();
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
  }, [clearRoutePreview, fetchHereSuggestions, sourceCoords]);

  const onDestChange = useCallback(q => {
      console.log('⌨️ Destination Input:', q);
    setFocusedField('destination');
    setDestQuery(q);
    setDestCoords(null);
      console.log('🧹 Clearing route due to destination change');
    setSourceSuggestions([]);
    setSourceLoading(false);
    clearRoutePreview();
    if (destTimerRef.current) clearTimeout(destTimerRef.current);
    const normalized = (q || '').trim();
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
  }, [clearRoutePreview, fetchHereSuggestions, destCoords]);

  // ─── selection handlers ──────────────────────────────────────────────────
  const handleHereSourceSelect = item => {
     console.log('✅ Source Selected:', item);
    const location = {latitude: item.latitude, longitude: item.longitude, description: item.title};
    setSourceLocation?.(location);
    setSourceText?.(item.title);
    setSourceCoords({latitude: item.latitude, longitude: item.longitude});
    onCoordinateSelect?.(item.latitude, item.longitude);
    onSourceSelected?.(location);
    setSourceSuggestions([]);
    setSourceQuery(item.title);
    Keyboard.dismiss();
  };

  const handleHereDestSelect = item => {
    console.log('✅ Destination Selected:', item);
    const location = {latitude: item.latitude, longitude: item.longitude, description: item.title};
    setDestinationLocation?.(location);
    setDestinationText?.(item.title);
    setDestCoords({latitude: item.latitude, longitude: item.longitude});
    onCoordinateSelect?.(item.latitude, item.longitude);
    onDestinationSelected?.(location);
    setDestSuggestions([]);
    setDestQuery(item.title);
    Keyboard.dismiss();
  };

  // ─── ref wiring ──────────────────────────────────────────────────────────
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
    } catch (err) { console.warn('HERE ref wiring failed', err); }
    return () => {
      try {
        if (sourceRef?.current)      delete sourceRef.current.setAddressText;
        if (destinationRef?.current) delete destinationRef.current.setAddressText;
      } catch (_) {}
    };
  }, [sourceRef, destinationRef]);

  // ─── sync text from parent ───────────────────────────────────────────────
  React.useEffect(() => { setSourceQuery(sourceText || ''); }, [sourceText]);
  React.useEffect(() => { setDestQuery(destinationText || ''); }, [destinationText]);

  // ─── FIX: sync coords from parent props (GPS auto-fill, swap, etc.) ──────
  React.useEffect(() => {
    if (sourceLocation && Number.isFinite(sourceLocation.latitude) && Number.isFinite(sourceLocation.longitude)) {
      setSourceCoords({latitude: sourceLocation.latitude, longitude: sourceLocation.longitude});
    } else {
      setSourceCoords(null);
    }
  }, [sourceLocation]);

  React.useEffect(() => {
    if (destinationLocation && Number.isFinite(destinationLocation.latitude) && Number.isFinite(destinationLocation.longitude)) {
      setDestCoords({latitude: destinationLocation.latitude, longitude: destinationLocation.longitude});
    } else {
      setDestCoords(null);
    }
  }, [destinationLocation]);

  // ─── route preview trigger ───────────────────────────────────────────────
  React.useEffect(() => {
     console.log('🧭 Checking route trigger...');
  console.log('SourceCoords:', sourceCoords);
  console.log('DestCoords:', destCoords);
    if (
      !Number.isFinite(sourceCoords?.latitude)  || !Number.isFinite(sourceCoords?.longitude) ||
      !Number.isFinite(destCoords?.latitude)    || !Number.isFinite(destCoords?.longitude)
    ) return;

    const routeKey = `${sourceCoords.latitude},${sourceCoords.longitude}:${destCoords.latitude},${destCoords.longitude}`;
    if (lastRouteKeyRef.current === routeKey) return;
    lastRouteKeyRef.current = routeKey;
    fetchHereRoute(sourceCoords, destCoords);
  }, [destCoords, fetchHereRoute, sourceCoords]);

  // ─── swap ────────────────────────────────────────────────────────────────
  const handleSwapPress = () => {
    const canHandleInternally =
      typeof setSourceLocation === 'function' &&
      typeof setDestinationLocation === 'function' &&
      typeof setSourceText === 'function' &&
      typeof setDestinationText === 'function';

    if (!canHandleInternally) { onSwap?.(); return; }

    const nextSrc  = destinationLocation ?? null;
    const nextDest = sourceLocation ?? null;

    setSourceLocation(nextSrc);
    setDestinationLocation(nextDest);
    setSourceCoords(
      Number.isFinite(nextSrc?.latitude) && Number.isFinite(nextSrc?.longitude)
        ? {latitude: nextSrc.latitude, longitude: nextSrc.longitude} : null,
    );
    setDestCoords(
      Number.isFinite(nextDest?.latitude) && Number.isFinite(nextDest?.longitude)
        ? {latitude: nextDest.latitude, longitude: nextDest.longitude} : null,
    );
    setSourceText(destinationText || '');
    setDestinationText(sourceText || '');
    sourceRef?.current?.setAddressText(destinationText || '');
    destinationRef?.current?.setAddressText(sourceText || '');

    if (
      typeof onCoordinateSelect === 'function' &&
      Number.isFinite(nextDest?.latitude) && Number.isFinite(nextDest?.longitude)
    ) onCoordinateSelect(nextDest.latitude, nextDest.longitude);
  };

  // ─── route data helpers ──────────────────────────────────────────────────
  const routeSection      = routeResponse?.routes?.[0]?.sections?.[0];
  const routeSummary      = routeSection?.summary;
  const routeDepartureTime = routeSection?.departure?.time
    ? new Date(routeSection.departure.time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
    : 'N/A';
  const routeArrivalTime  = routeSection?.arrival?.time
    ? new Date(routeSection.arrival.time).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
    : 'N/A';

  const tollSections = routeTollData?.routes?.[0]?.sections || [];
  const tollList = tollSections.flatMap(section => section.tolls || []);
  const tollCurrency = tollList[0]?.fares?.[0]?.price?.currency || 'USD';
  const tollTotal = tollList.reduce((sum, toll) => {
    const price = toll?.fares?.[0]?.price?.value;
    return sum + (Number.isFinite(price) ? price : 0);
  }, 0);
  const tollLabel = tollList.length
    ? `${getCurrencySymbol(tollCurrency)}${tollTotal.toFixed(2)} · ${tollList.length} booth${tollList.length > 1 ? 's' : ''}`
    : 'No tolls';

  const isSuggestionOpen =
    (focusedField === 'source'      && sourceSuggestions.length > 0) ||
    (focusedField === 'destination' && destSuggestions.length > 0);

  // ─── render ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.overlayRoot} pointerEvents="box-none">
      <View style={styles.backgroundMapLayer} pointerEvents="none" />

      <View style={[styles.searchCardStack, {maxHeight: cardMaxHeight}]}>
        <ScrollView
          style={styles.searchCardScroll}
          contentContainerStyle={styles.searchCardContent}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}>

          {/* ── Combined source + destination card ── */}
          <View style={styles.floatingSectionCard}>
            <View style={styles.topHandle} />

            {/* Source row */}
            <View style={styles.labelRow}>
              <Location_Icon width={scale(14)} height={scale(14)} />
              <AppText style={styles.labelText}>From</AppText>
            </View>
            <View style={[
              styles.searchInputContainer,
              focusedField === 'source' && styles.searchInputContainerActive,
            ]}>
              <TouchableOpacity style={styles.swapIconLeft} onPress={handleSwapPress} activeOpacity={0.7}>
                <Arrow_left_right width={18} height={18} />
              </TouchableOpacity>
              <View style={{flex: 1}}>
                <TextInput
                  ref={sourceRef}
                  style={[styles.searchInput, focusedField === 'source' && styles.searchInputActive]}
                  placeholder="Current location"
                  value={sourceQuery}
                  onFocus={() => {
                    setFocusedField('source');
                    onActiveInputChange?.('source');
                    setDestSuggestions([]);
                  }}
                  onChangeText={onSourceChange}
                  placeholderTextColor="#A5B4FC"
                />
                {sourceLoading && (
                  <ActivityIndicator size="small" style={styles.loadingIndicator} color="#6366F1" />
                )}
                {focusedField === 'source' && sourceSuggestions.length > 0 && (
                  <View style={styles.suggestionList}>
                    {sourceSuggestions.map(item => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.suggestionItem}
                        onPress={() => handleHereSourceSelect(item)}
                        activeOpacity={0.7}>
                        <Text style={styles.suggestionTitle}>{item.title}</Text>
                        <Text style={styles.suggestionAddress}>{item.address}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Divider */}
            <View style={styles.inputDivider} />

            {/* Destination row */}
            <View style={styles.labelRowCompact}>
              <Location_Icon width={scale(14)} height={scale(14)} />
              <AppText style={styles.labelText}>To</AppText>
            </View>
            <View style={[
              styles.searchInputContainer,
              focusedField === 'destination' && styles.searchInputContainerActive,
            ]}>
              <TouchableOpacity style={styles.swapIconLeft} onPress={handleSwapPress} activeOpacity={0.7}>
                <Arrow_left_right width={18} height={18} />
              </TouchableOpacity>
              <View style={{flex: 1}}>
                <TextInput
                  ref={destinationRef}
                  style={[styles.searchInput, focusedField === 'destination' && styles.searchInputActive]}
                  placeholder="Where to?"
                  value={destQuery}
                  onFocus={() => {
                    setFocusedField('destination');
                    onActiveInputChange?.('destination');
                    setSourceSuggestions([]);
                  }}
                  onChangeText={onDestChange}
                  placeholderTextColor="#A5B4FC"
                />
                {destLoading && (
                  <ActivityIndicator size="small" style={styles.loadingIndicator} color="#6366F1" />
                )}
                {focusedField === 'destination' && destSuggestions.length > 0 && (
                  <View style={styles.suggestionList}>
                    {destSuggestions.map(item => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.suggestionItem}
                        onPress={() => handleHereDestSelect(item)}
                        activeOpacity={0.7}>
                        <Text style={styles.suggestionTitle}>{item.title}</Text>
                        <Text style={styles.suggestionAddress}>{item.address}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* ── Route loading ── */}
          {routeLoading && (
            <View style={styles.routeLoadingRowCompact}>
              <ActivityIndicator size="small" color="#6366F1" />
              <AppText style={styles.routeLoadingText}>Calculating best route…</AppText>
            </View>
          )}

          {/* ── Route error ── */}
          {!!routeError && (
            <AppText style={styles.routeError}>{routeError}</AppText>
          )}

          {/* ── Route preview helper message ── */}
          {!routeLoading && !routeResponse && !routeError && (
            <View style={styles.routeEmptyCard}>
              <Text style={styles.routeEmptyTitle}>Select both points to preview your route.</Text>
              <Text style={styles.routeEmptyText}>
                Choose a start and destination to see estimated distance, duration, and toll information.
              </Text>
            </View>
          )}

          {/* ── Route preview card ── */}
          {routeResponse && (
            <View style={styles.floatingSectionCard}>
              <View style={styles.routeSummaryCard}>

                {/* Header */}
                <View style={styles.routeSummaryHeader}>
                  <View style={styles.routeTitleRow}>
                    <AppText style={styles.routeTitle}>Route Preview</AppText>
                  </View>
                  <View style={styles.routeHeaderBadges}>
                    <View style={styles.routeBadgeCompact}>
                      <AppText style={styles.routeBadgeText}>ON ROUTE</AppText>
                    </View>
                    <TouchableOpacity
                      style={styles.routeBadgeSmall}
                      onPress={() => setTollModalVisible(true)}
                      activeOpacity={0.7}>
                      <AppText style={styles.routeBadgeSmallText}>{tollLabel}</AppText>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Scrollable pills */}
                <View style={styles.routeMessageCard}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.routeInfoScroller}>

                    <View style={styles.routeInfoPill}>
                      <AppText style={styles.routeInfoPillLabel}>Departure</AppText>
                      <AppText style={styles.routeInfoPillValue}>{routeDepartureTime}</AppText>
                    </View>

                    <View style={styles.routeInfoPill}>
                      <AppText style={styles.routeInfoPillLabel}>Arrival</AppText>
                      <AppText style={styles.routeInfoPillValue}>{routeArrivalTime}</AppText>
                    </View>

                    <View style={styles.routeInfoPill}>
                      <AppText style={styles.routeInfoPillLabel}>Distance</AppText>
                      <AppText style={styles.routeInfoPillValue}>
                        {formatDistance(routeSummary?.length)}
                      </AppText>
                    </View>

                    <View style={styles.routeInfoPill}>
                      <AppText style={styles.routeInfoPillLabel}>Duration</AppText>
                      <AppText style={styles.routeInfoPillValue}>
                        {formatDuration(routeSummary?.duration)}
                      </AppText>
                    </View>

                    <View style={styles.routeInfoPillWide}>
                      <AppText style={styles.routeInfoPillLabel}>Toll Estimate</AppText>
                      <AppText style={styles.routeInfoPillValue}>{tollLabel}</AppText>
                    </View>

                  </ScrollView>
                </View>

              </View>
            </View>
          )}

        </ScrollView>
      </View>

      {/* ── Map style pills (bottom, hidden when suggestions open) ── */}
      {!isSuggestionOpen && (
        <View style={styles.bottomControlsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bottomControlsContent}>
            {MAP_STYLE_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.pillButtonBottom,
                  mapStyle === option.value && styles.pillButtonActive,
                ]}
                onPress={() => setMapStyle(option.value)}
                activeOpacity={0.75}>
                <Text style={[
                  styles.pillText,
                  mapStyle === option.value && styles.pillTextActive,
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Toll Details Modal ── */}
      <Modal
        visible={tollModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setTollModalVisible(false)}>
        <TouchableOpacity
          style={styles.tollModalOverlay}
          activeOpacity={1}
          onPress={() => setTollModalVisible(false)}>
          <View style={styles.tollModalContent}>
            <View style={styles.tollModalHeader}>
              <Text style={styles.tollModalTitle}>Toll Breakdown</Text>
              <TouchableOpacity
                onPress={() => setTollModalVisible(false)}
                activeOpacity={0.7}>
                <Text style={styles.tollModalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.tollModalScroll}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              decelerationRate="fast"
              bounces={true}>
              {routeTollData?.routes?.[0]?.sections?.map((section, si) =>
                section.tolls?.map((toll, ti) => {
                  const fares = toll.fares || [];
                  const singleFares = fares.filter(f => {
                    if (!f.pass) return true;
                    if (f.pass.returnJourney === true) return false;
                    if (f.pass.validityPeriod != null) return false;
                    return true;
                  });
                  const best = (singleFares.length ? singleFares : fares)[0];
                  const amount = best?.price?.value || 0;
                  const currency = best?.price?.currency || 'USD';

                  return (
                    <View key={`${si}-${ti}`} style={styles.tollItem}>
                      <Text style={styles.tollItemName}>{toll.tollSystem}</Text>
                      <Text style={styles.tollItemAmount}>
                        {getCurrencySymbol(currency)}{amount.toFixed(2)}
                      </Text>
                    </View>
                  );
                }) || [],
              )}
              <View style={styles.tollItemTotal}>
                <Text style={styles.tollItemTotalLabel}>Total Estimate</Text>
                <Text style={styles.tollItemTotalAmount}>
                  {getCurrencySymbol(tollCurrency)}{tollTotal.toFixed(2)}
                </Text>
              </View>
              <Text style={styles.tollModalNote}>
                * Cheapest one-way per booth
              </Text>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default HereSearchCard;