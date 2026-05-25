import React, {useEffect, useRef, useState} from 'react';
import {
  Animated,
  Image,
  PanResponder,
  Platform,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import MapView, {Marker} from 'react-native-maps';
import styles from './HomeScreen.styles';
import StatusBar from '../../component/StatusBar/StatusBar';
import {colors} from '../../theme/colors';
import SOS_Icon from './../../assets/svg_icon/sos.svg';
import Double_Arrow_Icon from './../../assets/svg_icon/arrow-double.svg';
import Gps_Icon from './../../assets/svg_icon/gps-svg.svg';
import Mechanic_call_Icon from './../../assets/svg_icon/mechanic_call.svg';
import AppText from '../../theme/AppText';
import {setLocation} from '../../redux/slices/locationSlice';
import ReceiverSignaturePad, {
  SIGNATURE_STORAGE_KEY,
} from '../../component/ReceiverSignaturePad/ReceiverSignaturePad';
import {useCurrentLocation, LOCATION_ERRORS} from '../../services/Uselocation';


const INITIAL_REGION = {
  latitude: 27.55,
  longitude: 78.35,
  latitudeDelta: 6,
  longitudeDelta: 6,
};

const FULLSCREEN_REGION = {
  latitude: 28.6139,
  longitude: 77.209,
  latitudeDelta: 0.045,
  longitudeDelta: 0.045,
};

const UPCOMING_STOPS = [
  {
    id: 'pickup',
    type: 'pickup',
    label: 'Pickup',
    place: 'Delhi, IN',
    coordinate: {latitude: 28.6139, longitude: 77.209},
    dateTime: '08 Apr • 10:30 AM IST',
  },
  {
    id: 'service',
    type: 'service',
    label: 'Service',
    place: 'Jaipur, IN',
    coordinate: {latitude: 26.9124, longitude: 75.7873},
    dateTime: '08 Apr • 01:45 PM IST',
  },
  {
    id: 'delivery',
    type: 'delivery',
    label: 'Delivery',
    place: 'Lucknow, IN',
    coordinate: {latitude: 26.8467, longitude: 80.9462},
    dateTime: '08 Apr • 06:15 PM IST',
  },
];


const HomeScreen = () => {
  const isAndroid = Platform.OS === 'android';
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const [isVerified, setIsVerified] = useState(true);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isJobStarted, setIsJobStarted] = useState(false);
  const [isSignaturePadVisible, setIsSignaturePadVisible] = useState(false);
  const [receiverSignature, setReceiverSignature] = useState(null);

  const mapCardRef = useRef(null);
  const mapFullRef = useRef(null);
  const skipNextOverviewFitRef = useRef(false);

  const miniMapPan = useRef(new Animated.ValueXY({x: 12, y: 12})).current;

  const {
    location, 
    loading,   
    error,     
    refresh,   
  } = useCurrentLocation({
    fetchOnMount: true,  
  });


  const currentLocation = location
    ? {
        latitude:      location.latitude,
        longitude:     location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : null;

  useEffect(() => {
    if (!location) return;
    dispatch(
      setLocation({
        latitude:  location.latitude,
        longitude: location.longitude,
      }),
    );
  }, [location, dispatch]);

  useEffect(() => {
    if (!currentLocation) return;

    if (!isMapExpanded) {
      if (skipNextOverviewFitRef.current) {
        skipNextOverviewFitRef.current = false;
        return;
      }

      const overviewCoordinates = [
        ...UPCOMING_STOPS.map(s => s.coordinate),
        {latitude: currentLocation.latitude, longitude: currentLocation.longitude},
      ];

      requestAnimationFrame(() => {
        mapCardRef.current?.fitToCoordinates(overviewCoordinates, {
          edgePadding: {top: 50, right: 50, bottom: 50, left: 50},
          animated: true,
        });
      });
      return;
    }

    mapFullRef.current?.animateToRegion(currentLocation, 800);
  }, [currentLocation, isMapExpanded]);

  const miniMapResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        miniMapPan.setOffset({
          x: miniMapPan.x.__getValue(),
          y: miniMapPan.y.__getValue(),
        });
        miniMapPan.setValue({x: 0, y: 0});
      },
      onPanResponderMove: Animated.event(
        [null, {dx: miniMapPan.x, dy: miniMapPan.y}],
        {useNativeDriver: false},
      ),
      onPanResponderRelease: () => {
        miniMapPan.flattenOffset();
      },
    }),
  ).current;

  const loadSavedSignature = async () => {
    try {
      const stored = await AsyncStorage.getItem(SIGNATURE_STORAGE_KEY);
      setReceiverSignature(stored ? JSON.parse(stored) : null);
    } catch (err) {
      console.log('Unable to load saved signature:', err?.message || err);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadSavedSignature();
    }, []),
  );

  const handleSignatureSaved = signaturePayload => {
    setReceiverSignature(signaturePayload);
  };


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

  const handlePendingVerification = () => {
    if (loading || isVerified) return;
    navigation.navigate('CreateAccount');
  };

  const openMap_navigation = () => navigation.navigate('NavigationScreen');
  const openMap            = () => navigation.navigate('VectorMap');
    const openMap_Here            = () => navigation.navigate('HereMapScreen');

  const openSignatureCapture  = () => setIsSignaturePadVisible(true);
  const closeSignatureCapture = () => setIsSignaturePadVisible(false);

  const toggleJobStatus = () => setIsJobStarted(prev => !prev);

  const fullscreenTopPadding = Math.max(
    insets.top + 8,
    Platform.OS === 'android' ? 16 : 10,
  );
  const fullscreenBottomPadding = Math.max(insets.bottom + 10, 12);

  const renderMapSection = (containerStyle, isExpandedView = false) => (
    <View style={containerStyle}>
      <MapView
        ref={isExpandedView ? mapFullRef : mapCardRef}
        style={styles.mainMap}
        initialRegion={isExpandedView ? FULLSCREEN_REGION : INITIAL_REGION}>

        {UPCOMING_STOPS.map(stop => (
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
                  stop.type === 'pickup'   && styles.stopMarkerPickup,
                  stop.type === 'service'  && styles.stopMarkerService,
                  stop.type === 'delivery' && styles.stopMarkerDelivery,
                ]}>
                <AppText style={styles.stopMarkerLabel}>{stop.label}</AppText>
                <AppText style={styles.stopMarkerDate}>{stop.dateTime}</AppText>
              </View>
              <View
                style={[
                  styles.stopMarkerPin,
                  stop.type === 'pickup'   && styles.stopMarkerPinPickup,
                  stop.type === 'service'  && styles.stopMarkerPinService,
                  stop.type === 'delivery' && styles.stopMarkerPinDelivery,
                ]}
              />
            </View>
          </Marker>
        ))}

        {currentLocation && (
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

      {isExpandedView && (
        <View style={[styles.mapExpandedHeader, {top: fullscreenTopPadding}]}>
          <AppText style={styles.mapExpandedTitle}>Live Tracking Map</AppText>
          <AppText style={styles.mapExpandedHint}>
            Tap the icon again to return normal size
          </AppText>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.mapToggleBtn,
          isExpandedView && {top: fullscreenTopPadding},
        ]}
        onPress={() => setIsMapExpanded(!isExpandedView)}>
        <Double_Arrow_Icon width={18} height={18} />
      </TouchableOpacity>

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
    <SafeAreaView style={styles.safe}>
      <StatusBar
        backgroundColor={colors.primary}
        barStyle="light-content"
        translucent={false}
      />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <AppText style={styles.welcome}>Welcome back after update,</AppText>
            <AppText style={styles.username}>Ashutosh Gangwar</AppText>
          </View>
          <TouchableOpacity style={styles.profileCircle}>
            <Mechanic_call_Icon width={30} height={30} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileCircle}>
            <SOS_Icon width={30} height={30} />
          </TouchableOpacity>
        </View>

        {/* STATS */}
        <View style={styles.statsCard}>
          <StatItem title="Active Loads" value="12"     color="#2563EB" />
          <Divider />
          <StatItem title="This Week"    value="$8,450" color="#16A34A" />
          <Divider />
          <StatItem title="HOS Left"     value="42h"    color="#EA580C" />
        </View>

        {/* LIVE MAP */}
        <View style={styles.sectionRow}>
          <AppText style={styles.sectionTitle}>Live Map</AppText>
        </View>

        {renderMapSection(styles.mapCard, false)}

        <View style={styles.mapHintRow}>
          <TouchableOpacity
            style={[
              styles.currentLoadJobBtn,
              isJobStarted && styles.currentLoadJobBtnStop,
            ]}
            onPress={toggleJobStatus}
            activeOpacity={0.9}>
            <AppText style={styles.currentLoadJobBtnText}>
              {isJobStarted ? 'Stop Job' : 'Start Job'}
            </AppText>
          </TouchableOpacity>
        </View>

        <View style={styles.mapNavigatorRow}>
          <TouchableOpacity
            style={styles.mapNavigatorBtn}
            onPress={openMap}
            activeOpacity={0.9}>
            <AppText style={styles.mapNavigatorBtnText}>Open PTV Navigator Map</AppText>
          </TouchableOpacity>
        </View>


        <View style={styles.mapNavigatorRow}>
          <TouchableOpacity
            style={styles.mapNavigatorBtn}
            onPress={openMap_Here}
            activeOpacity={0.9}>
            <AppText style={styles.mapNavigatorBtnText}>Open Here Navigator Map</AppText>
          </TouchableOpacity>
        </View>

        {/* RECEIVER SIGNATURE */}
        <View style={styles.signatureSectionHeader}>
          <AppText style={styles.currentLoadTitle}>Receiver Signature</AppText>
        </View>

        <View style={styles.signatureCard}>
          <View style={styles.signatureInfoRow}>
            <View style={styles.signatureTextWrap}>
              <AppText style={styles.signatureStatusTitle}>
                {receiverSignature ? 'Signature captured' : 'Signature pending'}
              </AppText>
              <AppText style={styles.signatureStatusSubtitle}>
                {receiverSignature
                  ? `${receiverSignature.receiverName} • ${new Date(
                      receiverSignature.capturedAt,
                    ).toLocaleString()}`
                  : "Collect the receiving person's signature before delivery handoff."}
              </AppText>
            </View>
            <TouchableOpacity
              style={styles.signatureActionBtn}
              onPress={openSignatureCapture}>
              <AppText style={styles.signatureActionBtnText}>
                {receiverSignature ? 'Retake' : 'Take Signature'}
              </AppText>
            </TouchableOpacity>
          </View>

          {receiverSignature?.signature ? (
            <Image
              source={{uri: receiverSignature.signature}}
              style={styles.signaturePreview}
              resizeMode="contain"
            />
          ) : null}
        </View>

        {/* CURRENT LOAD */}
        <View style={styles.currentLoadHeaderRow}>
          <AppText style={styles.currentLoadTitle}>Current Load</AppText>
        </View>

        <View style={styles.loadCard}>
          <View style={styles.loadHeader}>
            <View>
              <AppText style={styles.loadId}>Load #SH-245</AppText>
              <AppText style={styles.loadSub}>Electronics • 12,500 lbs</AppText>
            </View>
            <View style={styles.inTransitBadge}>
              <AppText style={styles.badgeText}>In Transit</AppText>
            </View>
          </View>

          <Location color="#22C55E" city="Delhi, IN"   info="Picked up 4 hours ago" />
          <Location color="#EF4444" city="Lucknow, IN" info="ETA: 2 hours" />

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <AppText style={styles.progressLabel}>Progress</AppText>
              <AppText style={styles.progressPercent}>72%</AppText>
            </View>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, {width: '72%'}]} />
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {width: '72%'}]} />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity onPress={openMap_navigation} style={styles.primaryBtn}>
              <AppText style={styles.primaryBtnText}>Navigation</AppText>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* FULLSCREEN MAP OVERLAY */}
      {isMapExpanded && (
        <View style={styles.mapFullscreenOverlay}>
          {renderMapSection(styles.mapFullscreenCard, true)}
        </View>
      )}

      {/* SIGNATURE PAD */}
      <ReceiverSignaturePad
        visible={isSignaturePadVisible}
        useModal
        onClose={closeSignatureCapture}
        onSaved={handleSignatureSaved}
        initialValue={receiverSignature}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;


const StatItem = ({title, value, color}) => (
  <View style={styles.statItem}>
    <AppText style={[styles.statValue, {color}]}>{value}</AppText>
    <AppText style={styles.statLabel}>{title}</AppText>
  </View>
);

const Divider = () => <View style={styles.divider} />;

const Location = ({color, city, info}) => (
  <View style={styles.locationRow}>
    <View style={[styles.locationIcon, {backgroundColor: color + '22'}]}>
      <AppText style={{color}}>📍</AppText>
    </View>
    <View>
      <AppText style={styles.city}>{city}</AppText>
      <AppText style={styles.info}>{info}</AppText>
    </View>
  </View>
);