import React, {useEffect, useRef, useState, useCallback} from 'react';
import {View, ActivityIndicator, StatusBar} from 'react-native';
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
        onComplete={() =>
          navigation?.navigate?.('TruckAnimationScreen', {
            title: 'Completing your trip…',
            subtitle: 'Finalising delivery and queuing your payout.',
            next: 'TripCompletedScreen',
          })
        }
      />
    </SafeAreaView>
  );
}
