import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, ScrollView, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import AppText from '../../theme/AppText';
import ScreenHeader from '../../component/ScreenHeader/ScreenHeader';
import {
  HereMapView,
  HereNavigation,
  HereRouting,
  HereSdk,
  NavigationEvents,
} from '../../here';
import styles from './HereNavigationDemo.styles';

/**
 * End-to-end example of the HERE SDK Navigate bridge:
 * initialise → show map → calculate route → draw route → simulated navigation.
 *
 * Frankfurt → Munich is used as the fixed sample trip so the screen works on an
 * emulator with no GPS fix.
 */

// const ORIGIN = {latitude: 38.5281383, longitude: -121.4089137, label: 'Frankfurt'};
// const DESTINATION = {latitude: 38.6434742, longitude: -90.5102509, label: 'Munich'};
const ORIGIN = {latitude: 40.708282, longitude: -74.0873504, label: 'US. 202, New Jersey'};
const DESTINATION = {latitude: 40.9036133, longitude:-74.3779209, label: 'US. 202, New Jersey'};

const formatDistance = meters =>
  meters == null ? '—' : `${(meters / 1000).toFixed(1)} km`;

const formatDuration = seconds => {
  if (seconds == null) {
    return '—';
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
};

export default function HereNavigationDemo({navigation}) {
  const mapRef = useRef(null);

  const [sdkReady, setSdkReady] = useState(false);
  const [busy, setBusy] = useState('Initialising HERE SDK…');
  const [error, setError] = useState(null);

  const [route, setRoute] = useState(null);
  const [navigating, setNavigating] = useState(false);

  // Live guidance state, fed by the native event stream.
  const [maneuver, setManeuver] = useState(null);
  const [progress, setProgress] = useState(null);
  const [speedLimitKph, setSpeedLimitKph] = useState(null);
  const [speeding, setSpeeding] = useState(false);
  const [voiceText, setVoiceText] = useState(null);

  // ── 1. Initialise the SDK, then show the map ──────────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await HereSdk.initialize();
        if (cancelled) {
          return;
        }
        setSdkReady(true);

        // <HereMapView> only mounts the native surface once initialize()
        // resolves, so the camera calls wait for it to appear. Failures here
        // are not fatal — the map renders its own status.
        try {
          await mapRef.current?.loadMap();
          await mapRef.current?.setCenter(ORIGIN.latitude, ORIGIN.longitude, 6);
        } catch (mapErr) {
          console.warn('[demo] initial camera setup skipped:', mapErr.message);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message);
        }
      } finally {
        if (!cancelled) {
          setBusy(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── 2. Subscribe to navigation events for the whole screen lifetime ───────
  useEffect(() => {
    const unsubscribe = HereNavigation.addListeners({
      [NavigationEvents.MANEUVER]: setManeuver,
      [NavigationEvents.ROUTE_PROGRESS]: setProgress,
      [NavigationEvents.SPEED_LIMIT]: event =>
        setSpeedLimitKph(event.effectiveSpeedLimitKph ?? event.speedLimitKph),
      [NavigationEvents.SPEED_WARNING]: event => setSpeeding(event.isSpeeding),
      [NavigationEvents.VOICE_GUIDANCE]: event => setVoiceText(event.text),
      [NavigationEvents.ROUTE_DEVIATION]: event =>
        console.log('[demo] off route by', event.deviationDistanceMeters, 'm'),
      [NavigationEvents.DESTINATION_REACHED]: () => {
        setNavigating(false);
        setVoiceText('You have arrived.');
      },
    });

    return unsubscribe;
  }, []);

  // Leaving the screen must stop guidance — it keeps running natively otherwise.
  useEffect(
    () => () => {
      HereNavigation.stopNavigation().catch(() => {});
    },
    [],
  );

  // ── 3. Calculate a truck route and 4. draw it on the map ──────────────────
  const handleCalculateRoute = useCallback(async () => {
    setBusy('Calculating route…');
    setError(null);
    try {
      const calculated = await HereRouting.calculateTruckRoute(
        ORIGIN.latitude,
        ORIGIN.longitude,
        DESTINATION.latitude,
        DESTINATION.longitude,
        {grossWeight: 18000, height: 400, width: 255, length: 1600, axleCount: 4},
      );
      setRoute(calculated);

      await mapRef.current?.drawRoute({routeId: calculated.routeId});
      await mapRef.current?.setCenter(ORIGIN.latitude, ORIGIN.longitude, 8);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }, []);

  // ── 5. Start simulated navigation ─────────────────────────────────────────
  const handleStartNavigation = useCallback(async () => {
    if (!route) {
      return;
    }
    setBusy('Starting navigation…');
    setError(null);
    try {
      await HereNavigation.startNavigation(route.routeId, {
        simulate: true,
        speedFactor: 4,
        voiceGuidance: true,
      });
      setNavigating(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }, [route]);

  const handleStopNavigation = useCallback(async () => {
    try {
      await HereNavigation.stopNavigation();
    } catch (e) {
      setError(e.message);
    }
    setNavigating(false);
    setManeuver(null);
    setProgress(null);
    setVoiceText(null);
    setSpeeding(false);
  }, []);

  const handleClearRoute = useCallback(async () => {
    await handleStopNavigation();
    await mapRef.current?.clearRoute().catch(() => {});
    setRoute(null);
  }, [handleStopNavigation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title="HERE Navigate demo"
        subtitle={`${ORIGIN.label} → ${DESTINATION.label}`}
        onBack={() => navigation?.goBack?.()}
      />

      <View style={styles.mapWrapper}>
        <HereMapView
          ref={mapRef}
          style={styles.map}
          centerLat={ORIGIN.latitude}
          centerLng={ORIGIN.longitude}
          zoomLevel={6}
          mapScheme="normalDay"
        />

        {navigating && maneuver ? (
          <View style={styles.maneuverCard}>
            <AppText style={styles.maneuverAction}>
              {maneuver.direction
                ? `${maneuver.action} ${maneuver.direction}`
                : maneuver.action}
            </AppText>
            <AppText style={styles.maneuverText} numberOfLines={2}>
              {maneuver.instruction}
            </AppText>
            <AppText style={styles.maneuverDistance}>
              in {formatDistance(maneuver.distanceMeters)}
            </AppText>
          </View>
        ) : null}

        {speedLimitKph ? (
          <View style={[styles.speedBadge, speeding && styles.speedBadgeAlert]}>
            <AppText style={styles.speedValue}>
              {Math.round(speedLimitKph)}
            </AppText>
            <AppText style={styles.speedUnit}>km/h</AppText>
          </View>
        ) : null}
      </View>

      <ScrollView
        style={styles.panel}
        contentContainerStyle={styles.panelContent}>
        {error ? (
          <View style={styles.errorBox}>
            <AppText style={styles.errorText}>{error}</AppText>
          </View>
        ) : null}

        <View style={styles.statusRow}>
          <AppText style={styles.statusLabel}>SDK</AppText>
          <AppText style={styles.statusValue}>
            {sdkReady ? 'initialised' : 'not ready'}
          </AppText>
        </View>

        <View style={styles.statusRow}>
          <AppText style={styles.statusLabel}>Trip</AppText>
          <AppText style={styles.statusValue}>
            {ORIGIN.label} → {DESTINATION.label}
          </AppText>
        </View>

        {route ? (
          <>
            <View style={styles.statusRow}>
              <AppText style={styles.statusLabel}>Route</AppText>
              <AppText style={styles.statusValue}>
                {formatDistance(route.distanceMeters)} ·{' '}
                {formatDuration(route.durationSeconds)} ·{' '}
                {route.maneuvers.length} turns
              </AppText>
            </View>
            <View style={styles.statusRow}>
              <AppText style={styles.statusLabel}>Route handle</AppText>
              <AppText style={styles.statusValue} numberOfLines={1}>
                {route.routeHandle ?? 'not returned'}
              </AppText>
            </View>
          </>
        ) : null}

        {navigating && progress ? (
          <View style={styles.statusRow}>
            <AppText style={styles.statusLabel}>Remaining</AppText>
            <AppText style={styles.statusValue}>
              {formatDistance(progress.remainingDistanceMeters)} ·{' '}
              {formatDuration(progress.remainingDurationSeconds)}
            </AppText>
          </View>
        ) : null}

        {voiceText ? (
          <View style={styles.voiceBox}>
            <AppText style={styles.voiceText}>🔊 {voiceText}</AppText>
          </View>
        ) : null}

        {busy ? (
          <View style={styles.busyRow}>
            <ActivityIndicator size="small" color="#00033E" />
            <AppText style={styles.busyText}>{busy}</AppText>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.button, (!sdkReady || !!busy) && styles.buttonDisabled]}
          disabled={!sdkReady || !!busy}
          onPress={handleCalculateRoute}>
          <AppText style={styles.buttonText}>Calculate truck route</AppText>
        </TouchableOpacity>

        {navigating ? (
          <TouchableOpacity
            style={[styles.button, styles.buttonDanger]}
            onPress={handleStopNavigation}>
            <AppText style={styles.buttonText}>Stop navigation</AppText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, (!route || !!busy) && styles.buttonDisabled]}
            disabled={!route || !!busy}
            onPress={handleStartNavigation}>
            <AppText style={styles.buttonText}>
              Start simulated navigation
            </AppText>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.buttonGhost, !route && styles.buttonDisabled]}
          disabled={!route}
          onPress={handleClearRoute}>
          <AppText style={[styles.buttonText, styles.buttonGhostText]}>
            Clear route
          </AppText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
