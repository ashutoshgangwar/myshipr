import React, {useEffect, useRef, useState, useCallback} from 'react';
import {View, ActivityIndicator, StatusBar, Animated, Easing} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import styles from './ActiveTripScreen.styles';
import {colors} from '../../theme/colors';
import AppText from '../../theme/AppText';

import {HereMapView, HereMapModule} from '../HereMapScreen/components/HereMap/index';
import {HERE_ACCESS_KEY_ID, HERE_ACCESS_KEY_SECRET} from '@env';
import {getCurrentLocation} from '../../services/LocationService';

const hasHereCredentials = Boolean(HERE_ACCESS_KEY_ID && HERE_ACCESS_KEY_SECRET);

import TripTopBar from './components/TripTopBar';
import SideToolbar from './components/SideToolbar';
import ChatPanel from './components/ChatPanel';
import DocumentsPanel from './components/DocumentsPanel';
import BiddingPanel from './components/BiddingPanel';
import HoursOfServicePanel from './components/HoursOfServicePanel';
import TripProgressBar from './components/TripProgressBar';
import PodModal from './components/PodModal';

// San Francisco fallback (matches the design mock-up region).
const DEFAULT_CENTER = {lat: 37.7599, lng: -122.4469};

// Toolbar ids that open a centre panel.
const PANEL_IDS = ['chat', 'documents', 'bidding', 'navigate'];

export default function ActiveTripScreen({navigation}) {
  const mapRef = useRef(null);
  const [center, setCenter] = useState(DEFAULT_CENTER);
  const [sdkReady, setSdkReady] = useState(false);

  // Which floating panel is open (null = none). Drives the toolbar highlight.
  const [activePanel, setActivePanel] = useState(null);

  // Proof-of-Delivery flow shown after the driver taps "End Trip".
  const [podOpen, setPodOpen] = useState(false);

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

  // Centre the map on the driver's current position when available.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pos = await getCurrentLocation({highAccuracy: false});
        if (!cancelled && pos?.latitude && pos?.longitude) {
          setCenter({lat: pos.latitude, lng: pos.longitude});
        }
      } catch (_) {
        // Keep the default centre on failure.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

      {/* ── Centre panels ── */}
      {activePanel === 'chat' && <ChatPanel onClose={closePanel} />}
      {activePanel === 'documents' && <DocumentsPanel onClose={closePanel} />}
      {activePanel === 'bidding' && <BiddingPanel onClose={closePanel} />}
      {activePanel === 'navigate' && <HoursOfServicePanel onClose={closePanel} />}

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
