import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Modal, Platform, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MapView, {Marker} from 'react-native-maps';
import styles from './MapSection.styles';
import {colors} from '../../theme/colors';
import AppText from '../../theme/AppText';
import {useLocation} from '../../services/LocationService';
import Double_Arrow_Icon from '../../assets/svg_icon/arrow-double.svg';
import Gps_Icon from '../../assets/svg_icon/gps-svg.svg';

const DEFAULT_INITIAL_REGION = {
  latitude: 27.55,
  longitude: 78.35,
  latitudeDelta: 6,
  longitudeDelta: 6,
};

const DEFAULT_FULLSCREEN_REGION = {
  latitude: 28.6139,
  longitude: 77.209,
  latitudeDelta: 0.045,
  longitudeDelta: 0.045,
};

/**
 * Reusable live map. Self-contained: owns the location hook, the map refs and
 * the expand/fullscreen state. Used by both HomeScreen (route overview) and
 * FavoriteDestination (tap-to-pick a destination).
 *
 * @param {object}   props
 * @param {object[]} [props.stops]            Route stops to plot (pickup/service/delivery).
 * @param {boolean}  [props.expandable]       Show the expand-to-fullscreen toggle.
 * @param {boolean}  [props.showCurrentLocation]  Plot the live blue dot.
 * @param {function} [props.onMapPress]       Called with a {latitude, longitude} when the map is tapped.
 * @param {object}   [props.pickedLocation]   A {latitude, longitude} to mark as the chosen destination.
 * @param {string}   [props.pickedLabel]      Label shown on the picked marker.
 * @param {object}   [props.initialRegion]    Region for the inline card map.
 * @param {object}   [props.fullscreenRegion] Region for the expanded map.
 * @param {object}   [props.style]            Container style for the inline card.
 */
const MapSection = ({
  stops = [],
  expandable = false,
  showCurrentLocation = true,
  onMapPress,
  pickedLocation = null,
  pickedLabel = 'Destination',
  initialRegion = DEFAULT_INITIAL_REGION,
  fullscreenRegion = DEFAULT_FULLSCREEN_REGION,
  style,
}) => {
  const isAndroid = Platform.OS === 'android';
  const insets = useSafeAreaInsets();

  const [isExpanded, setIsExpanded] = useState(false);

  const mapCardRef = useRef(null);
  const mapFullRef = useRef(null);
  const skipNextOverviewFitRef = useRef(false);

  const {location, loading, error, refresh} = useLocation({fetchOnMount: true});

  const currentLocation = location
    ? {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : null;

  // Keep the inline map framed: fit all stops + the user when we have a route,
  // otherwise just centre on the user. The expanded map always tracks the user.
  useEffect(() => {
    if (!currentLocation) return;

    if (!isExpanded) {
      if (skipNextOverviewFitRef.current) {
        skipNextOverviewFitRef.current = false;
        return;
      }

      if (stops.length) {
        const overviewCoordinates = [
          ...stops.map(s => s.coordinate),
          {latitude: currentLocation.latitude, longitude: currentLocation.longitude},
        ];
        requestAnimationFrame(() => {
          mapCardRef.current?.fitToCoordinates(overviewCoordinates, {
            edgePadding: {top: 50, right: 50, bottom: 50, left: 50},
            animated: true,
          });
        });
      } else {
        mapCardRef.current?.animateToRegion(currentLocation, 600);
      }
      return;
    }

    mapFullRef.current?.animateToRegion(currentLocation, 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, isExpanded]);

  const centerOnCurrentLocation = async isExpandedView => {
    if (!isExpandedView) {
      skipNextOverviewFitRef.current = true;
    }

    if (currentLocation) {
      const activeMapRef = isExpandedView ? mapFullRef.current : mapCardRef.current;
      activeMapRef?.animateToRegion(
        {...currentLocation, latitudeDelta: 0.004, longitudeDelta: 0.004},
        700,
      );
    }

    await refresh();
  };

  const handleMapPress = event => {
    if (!onMapPress) return;
    const {coordinate} = event.nativeEvent;
    if (coordinate) onMapPress(coordinate);
  };

  const fullscreenTopPadding = Math.max(
    insets.top + 8,
    Platform.OS === 'android' ? 16 : 10,
  );
  const fullscreenBottomPadding = Math.max(insets.bottom + 10, 12);

  const renderMap = isExpandedView => (
    <View style={isExpandedView ? styles.fullscreenCard : [styles.card, style]}>
      <MapView
        ref={isExpandedView ? mapFullRef : mapCardRef}
        style={styles.mainMap}
        initialRegion={isExpandedView ? fullscreenRegion : initialRegion}
        onPress={handleMapPress}>
        {stops.map(stop => (
          <Marker
            key={stop.id}
            coordinate={stop.coordinate}
            title={`${stop.label} • ${stop.place}`}
            description={stop.dateTime}
            anchor={{x: 0.5, y: 1}}
            tracksViewChanges={false}>
            <View style={styles.stopMarkerWrap} collapsable={false}>
              <View
                style={[
                  styles.stopMarkerBadge,
                  stop.type === 'pickup' && styles.stopMarkerPickup,
                  stop.type === 'service' && styles.stopMarkerService,
                  stop.type === 'delivery' && styles.stopMarkerDelivery,
                ]}>
                <AppText style={styles.stopMarkerLabel}>{stop.label}</AppText>
                <AppText style={styles.stopMarkerDate}>{stop.dateTime}</AppText>
              </View>
              <View
                style={[
                  styles.stopMarkerPin,
                  stop.type === 'pickup' && styles.stopMarkerPinPickup,
                  stop.type === 'service' && styles.stopMarkerPinService,
                  stop.type === 'delivery' && styles.stopMarkerPinDelivery,
                ]}
              />
            </View>
          </Marker>
        ))}

        {pickedLocation && (
          <Marker
            coordinate={pickedLocation}
            anchor={{x: 0.5, y: 1}}
            tracksViewChanges={isAndroid}>
            <View style={styles.selectedMarkerContainer} collapsable={false}>
              <View style={styles.selectedMarkerInner}>
                <AppText style={styles.selectedMarkerText}>{pickedLabel}</AppText>
              </View>
              <View style={styles.selectedMarkerPin} />
            </View>
          </Marker>
        )}

        {showCurrentLocation && currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Current Location"
            anchor={{x: 0.5, y: 0.5}}
            tracksViewChanges={isAndroid}>
            <View style={styles.currentMarkerContainer} collapsable={false}>
              <View style={styles.currentMarkerOuter} />
              <View style={styles.currentMarkerInner} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Location status overlay — only while we have no location yet. */}
      {!currentLocation && loading && (
        <View style={styles.locationStatusOverlay} pointerEvents="none">
          <ActivityIndicator size="small" color={colors.primary || '#22C55E'} />
          <AppText style={styles.locationStatusText}>Fetching location…</AppText>
        </View>
      )}

      {!currentLocation && !loading && error && (
        <View style={styles.locationStatusOverlay}>
          <AppText style={styles.locationStatusText}>Unable to fetch location</AppText>
          <TouchableOpacity
            style={styles.locationRetryBtn}
            onPress={refresh}
            activeOpacity={0.8}>
            <AppText style={styles.locationRetryText}>Retry</AppText>
          </TouchableOpacity>
        </View>
      )}

      {isExpandedView && (
        <View style={[styles.mapExpandedHeader, {top: fullscreenTopPadding}]}>
          <AppText style={styles.mapExpandedTitle}>Live Tracking Map</AppText>
          <AppText style={styles.mapExpandedHint}>
            Tap the icon again to return normal size
          </AppText>
        </View>
      )}

      {expandable && (
        <TouchableOpacity
          style={[styles.mapToggleBtn, isExpandedView && {top: fullscreenTopPadding}]}
          onPress={() => setIsExpanded(!isExpandedView)}>
          <Double_Arrow_Icon width={18} height={18} />
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[
          styles.mapLocationBtn,
          isExpandedView && {bottom: fullscreenBottomPadding + 18},
        ]}
        onPress={() => centerOnCurrentLocation(isExpandedView)}>
        <Gps_Icon width={20} height={20} />
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      {renderMap(false)}

      {expandable && (
        <Modal
          visible={isExpanded}
          animationType="fade"
          onRequestClose={() => setIsExpanded(false)}>
          <View style={styles.fullscreenOverlay}>{renderMap(true)}</View>
        </Modal>
      )}
    </>
  );
};

export default MapSection;
