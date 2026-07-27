import React, {useEffect, useRef, useState, useCallback} from 'react';
import {
  View,
  ActivityIndicator,
  StatusBar,
  Animated,
  Easing,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import {verticalScale} from 'react-native-size-matters';

import styles from './ActiveTripScreen.styles';
import {colors} from '../../theme/colors';
import AppText from '../../theme/AppText';

import {HereMapView, HereMapModule} from '../HereMapScreen/components/HereMap/index';
import {HERE_ACCESS_KEY_ID, HERE_ACCESS_KEY_SECRET} from '@env';
import {getCurrentLocation} from '../../services/LocationService';
import GpsIcon from '../../assets/svg_icon/gps-svg.svg';

const hasHereCredentials = Boolean(HERE_ACCESS_KEY_ID && HERE_ACCESS_KEY_SECRET);

import TripTopBar from './components/TripTopBar';
import SideToolbar from './components/SideToolbar';
import ChatPanel from './components/ChatPanel';
import DocumentsPanel from './components/DocumentsPanel';
import BiddingPanel from './components/BiddingPanel';
import HoursOfServicePanel from './components/HoursOfServicePanel';
import FuelPricePanel from './components/FuelPricePanel';
import TripProgressBar from './components/TripProgressBar';
import PodModal from './components/PodModal';

// San Francisco fallback (matches the design mock-up region).
const DEFAULT_CENTER = {lat: 37.7599, lng: -122.4469};

// Toolbar ids that open a centre panel.
const PANEL_IDS = ['chat', 'documents', 'bidding', 'navigate', 'dock'];

export default function ActiveTripScreen({navigation}) {
  // The bottom progress bar grows by the bottom inset (edge-to-edge on RN 0.83),
  // so the floating GPS button has to rise with it or the bar covers it.
  const insets = useSafeAreaInsets();

  const mapRef = useRef(null);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [sdkReady, setSdkReady] = useState(false);

  // Which floating panel is open (null = none). Drives the toolbar highlight.
  const [activePanel, setActivePanel] = useState(null);

  // Proof-of-Delivery flow shown after the driver taps "End Trip".
  const [podOpen, setPodOpen] = useState(false);

  // Whether the on-screen keyboard is up — used to show a full-screen backdrop
  // so tapping anywhere outside an input dismisses it (iOS + Android).
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Circular "reveal" transition played after the driver confirms delivery:
  // a white circle grows from the centre of the map to fill the screen, then
  // we hand off to the truck-animation screen (its white background lines up
  // seamlessly with the circle, so the jump is invisible).
  const [revealing, setRevealing] = useState(false);
  const revealScale = useRef(new Animated.Value(0)).current;

  const runReveal = useCallback(() => {
    revealScale.setValue(0);
    setRevealing(true);
    Animated.timing(revealScale, {
      toValue: 1,
      duration: 1050,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(({finished}) => {
      if (!finished) return;
      navigation?.navigate?.('TruckAnimationScreen', {
        title: 'Completing your trip…',
        subtitle: 'Finalising delivery and queuing your payout.',
        next: 'TripCompletedScreen',
      });
      // Drop the overlay once the truck screen is on top of it — the user
      // never sees it disappear, but it's cleared for the next trip.
      setTimeout(() => {
        setRevealing(false);
        revealScale.setValue(0);
      }, 400);
    });
  }, [navigation, revealScale]);

  // Initialise the HERE SDK before mounting the native map view.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!hasHereCredentials) {
        return;
      }
      try {
        await HereMapModule.initSDK(HERE_ACCESS_KEY_ID, HERE_ACCESS_KEY_SECRET);
        if (!cancelled) {
          setSdkReady(true);
        }
      } catch (e) {
        console.error('[ActiveTripScreen] HERE SDK init failed:', e?.message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Whether a location fetch is currently in flight (drives the GPS button spinner).
  const [locating, setLocating] = useState(false);

  // Fetch the driver's current position, drop the HERE current-location marker
  // there, and (optionally) glide the camera to it. Shared by the initial
  // placement effect and the floating GPS button.
  const showMyLocation = useCallback(async ({animate = true} = {}) => {
    setLocating(true);
    try {
      const pos = await getCurrentLocation({highAccuracy: false});
      if (!pos?.latitude || !pos?.longitude) return;
      setCenter({lat: pos.latitude, lng: pos.longitude});
      // Native HERE current-location marker (blue dot) at the live position.
      await mapRef.current?.showCurrentLocation({
        lat: pos.latitude,
        lng: pos.longitude,
        bearing: Number.isFinite(pos.heading) ? pos.heading : 0,
      });
      if (animate) {
        await mapRef.current?.moveCamera({
          lat: pos.latitude,
          lng: pos.longitude,
          zoom: 15,
          animate: true,
          animationDuration: 800,
        });
      }
    } catch (_) {
      // Keep the default centre / previous marker on failure.
    } finally {
      setLocating(false);
    }
  }, []);

  // Centre the map on the driver's current position once the SDK is ready and
  // the native map view has mounted, and place the current-location marker.
  useEffect(() => {
    if (!sdkReady) return undefined;
    const timer = setTimeout(() => {
      showMyLocation({animate: false});
    }, 700);
    return () => clearTimeout(timer);
  }, [sdkReady, showMyLocation]);

  const handleToolSelect = useCallback(id => {
    if (id === 'collapse') {
      setActivePanel(null);
      return;
    }
    // Only chat / documents / bidding have panels; others just close any open one.
    if (PANEL_IDS.includes(id)) {
      setActivePanel(prev => (prev === id ? null : id));
    } else {
      setActivePanel(null);
    }
  }, []);

  const closePanel = useCallback(() => setActivePanel(null), []);
  const goBack = useCallback(() => navigation?.goBack?.(), [navigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* ── HERE map (Android + iOS native) ── */}
      {sdkReady ? (
        <HereMapView
          ref={mapRef}
          style={styles.map}
          centerLat={center.lat}
          centerLng={center.lng}
          zoomLevel={13}
        />
      ) : (
        <View style={styles.mapLoading} pointerEvents="none">
          <ActivityIndicator color={colors.navy} />
          <AppText style={styles.mapLoadingText}>
            {hasHereCredentials
              ? 'Initializing HERE SDK…'
              : 'Add HERE credentials to .env'}
          </AppText>
        </View>
      )}

      {/* ── Top bar ── */}
      <TripTopBar onBack={goBack} onToggleDuty={() => {}} onSOS={() => {}} />

      {/* ── Left toolbar ── */}
      <SideToolbar panel={activePanel} onSelect={handleToolSelect} />

      {/* Tap-anywhere-outside backdrop to dismiss the keyboard. Sits above the
          map but below the floating panels, and only while the keyboard is up. */}
      {keyboardVisible && (
        <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
          <View style={styles.keyboardBackdrop} />
        </TouchableWithoutFeedback>
      )}

      {/* ── Centre panels ── */}
      {activePanel === 'chat' && <ChatPanel onClose={closePanel} />}
      {activePanel === 'documents' && <DocumentsPanel onClose={closePanel} />}
      {activePanel === 'bidding' && <BiddingPanel onClose={closePanel} />}
      {activePanel === 'navigate' && <HoursOfServicePanel onClose={closePanel} />}
      {activePanel === 'dock' && <FuelPricePanel onClose={closePanel} />}

      {/* ── Floating GPS re-center button ── */}
      {/* Sits behind the panels (low zIndex), so it stays put when one opens. */}
      <TouchableOpacity
        style={[
          styles.gpsButton,
          {bottom: styles.gpsButton.bottom + insets.bottom},
        ]}
        onPress={() => showMyLocation({animate: true})}
        disabled={locating}
        activeOpacity={0.8}>
        {locating ? (
          <ActivityIndicator size="small" color={colors.navy} />
        ) : (
          <GpsIcon width={verticalScale(26)} height={verticalScale(26)} fill={colors.navy} />
        )}
      </TouchableOpacity>

      {/* ── Bottom trip progress ── */}
      <TripProgressBar
        progress={0.63}
        withCheckbox={activePanel === 'bidding'}
        onEndTrip={() => setPodOpen(true)}
      />

      {/* ── Proof-of-Delivery flow ── */}
      <PodModal
        visible={podOpen}
        onClose={() => setPodOpen(false)}
        onComplete={() => {
          // The modal closes itself (slides out); once it's gone, grow the
          // white circle over the map and then jump to the truck animation.
          setTimeout(runReveal, 320);
        }}
      />

      {/* ── Circular reveal transition ── */}
      {revealing && (
        <Animated.View
          pointerEvents="none"
          style={[styles.revealCircle, {transform: [{scale: revealScale}]}]}
        />
      )}
    </SafeAreaView>
  );
}
