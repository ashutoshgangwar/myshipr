import React, {useCallback, useEffect, useRef, useState} from 'react';
import {View, TouchableOpacity} from 'react-native';
import {useIsFocused} from '@react-navigation/native';

import styles from './LiveTripMap.styles';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import {ms} from '../../theme/scale';

import {HereMapView, HereNavigation, NavigationEvents} from '../../here';
import {buildTripInfo, fitCameraToRoute} from '../../utils/here/mapHelpers';
import {
  formatManeuverDistance,
  maneuverLabel,
} from '../../utils/here/maneuverFormat';
import {NAVIGATION_ROUTE_WIDTH} from '../../screens/HereMapScreen/constants/navigationConstants';
import ManeuverIcon from '../../screens/ActiveTripScreen/components/ManeuverIcon';
import GpsIcon from '../../assets/svg_icon/gps-svg.svg';

// Matches ActiveTripScreen's driving view, so the picture does not jump scale
// when the session moves between the two maps.
const CAMERA_DISTANCE_METERS = 350;

/**
 * The trip that is already running, in a small map.
 *
 * This does **not** start a second navigation session. Guidance lives in the
 * HERE SDK and keeps running when ActiveTripScreen unmounts, so this hands that
 * same session's rendering to its own map view (`attachToMapView`) and lets the
 * SDK draw the route, the maneuver arrows and the vehicle exactly as it does
 * full-screen. Everything on top of the map is fed by the session's own
 * guidance events, so the readouts stay in step with the big screen.
 *
 * When the trip has a route but guidance was never started, there is nothing to
 * attach to — it falls back to drawing that route and framing it, so the card
 * still shows the trip rather than an empty map.
 *
 * @param {object}   props
 * @param {object}   props.trip       the live session (see TripSessionService)
 * @param {object}   [props.style]    style for the map surface
 * @param {function} [props.onExpand] tapping the card returns to the trip screen
 */
export default function LiveTripMap({trip, style, onExpand}) {
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [attached, setAttached] = useState(false);
  const isFocused = useIsFocused();
  const [navInfo, setNavInfo] = useState(null);
  const [maneuver, setManeuver] = useState(null);
  const [metersToNext, setMetersToNext] = useState(null);

  const destination = trip?.destinationLocation ?? null;

  /**
   * Takes the running session's rendering, or — when guidance is not running —
   * draws the trip's route so the card is not blank.
   *
   * `{mode: 'fixed'}` is re-asserted rather than inherited: if the driver had
   * panned the previous map the SDK handed them the camera, and without this
   * the new map would keep that and never follow the vehicle.
   */
  const bindToSession = useCallback(
    async api => {
      const map = api ?? mapRef.current;
      try {
        const rendering = await HereNavigation.attachToMapView(map?.getTag(), {
          mode: 'fixed',
          distanceMeters: CAMERA_DISTANCE_METERS,
        });
        setAttached(Boolean(rendering));
        if (rendering) return;
      } catch (_) {
        setAttached(false);
        // Nothing is navigating — fall through to the preview below.
      }

      if (!trip?.routeId || !map) return;
      try {
        await map.drawRoute({
          routeId: trip.routeId,
          color: colors.accentBlue,
          width: NAVIGATION_ROUTE_WIDTH,
        });
        if (destination) {
          await map.addMarker({
            latitude: destination.latitude,
            longitude: destination.longitude,
            color: '#FF3366',
          });
          await map.moveCamera({
            lat: destination.latitude,
            lng: destination.longitude,
            zoom: 12,
            animate: true,
          });
        }
      } catch (_) {
        // The route may have been evicted from the native store; the map still
        // renders, it just has no line on it.
      }
    },
    [destination, trip?.routeId],
  );

  /**
   * Bind on every focus, not just once on mount.
   *
   * This card lives on a screen that stays mounted underneath the trip screen,
   * so it is still here — map and all — when the driver opens the trip and the
   * navigator moves its rendering over there. Coming back leaves this map alive
   * but unbound, and a mount-only bind would never notice. Re-binding on focus
   * is what takes the session back each time.
   *
   * `attachToMapView` no-ops when this map is already the one being rendered
   * into, so the extra call on the first focus costs nothing.
   */
  useEffect(() => {
    if (!mapReady || !isFocused) return;
    bindToSession(mapRef.current);
  }, [mapReady, isFocused, bindToSession]);

  // Guidance is already emitting — subscribing just tees the same events into
  // this card, so nothing here drives the session.
  useEffect(() => {
    const unsubscribe = HereNavigation.addListeners({
      [NavigationEvents.ROUTE_PROGRESS]: progress => {
        setNavInfo(
          buildTripInfo(
            progress.remainingDistanceMeters,
            progress.remainingDurationSeconds,
          ),
        );
        setMetersToNext(
          Number.isFinite(progress.distanceToNextManeuverMeters)
            ? progress.distanceToNextManeuverMeters
            : null,
        );
      },
      [NavigationEvents.MANEUVER]: next => setManeuver(next),
      [NavigationEvents.DESTINATION_REACHED]: () => {
        setManeuver(null);
        setMetersToNext(null);
      },
    });
    return unsubscribe;
  }, []);

  /** Re-locks the follow camera after the driver has panned this small map. */
  const recenter = useCallback(() => {
    if (attached) {
      HereNavigation.setCameraBehavior({
        mode: 'fixed',
        distanceMeters: CAMERA_DISTANCE_METERS,
      }).catch(() => {});
      return;
    }
    if (destination) {
      fitCameraToRoute(mapRef, [
        {lat: destination.latitude, lng: destination.longitude},
      ]).catch(() => {});
    }
  }, [attached, destination]);

  const turnLabel = maneuver
    ? maneuverLabel(maneuver.action, maneuver.direction)
    : null;
  const turnDistance = formatManeuverDistance(
    Number.isFinite(metersToNext) ? metersToNext : maneuver?.distanceMeters,
  );

  return (
    <View style={styles.container}>
      <HereMapView
        ref={mapRef}
        style={[styles.map, style]}
        centerLat={destination?.latitude ?? 0}
        centerLng={destination?.longitude ?? 0}
        zoomLevel={13}
        onMapReady={() => setMapReady(true)}
      />

      {/* Next turn — the same wording as the full-screen card. */}
      {turnLabel ? (
        <View style={styles.turnStrip} pointerEvents="none">
          <ManeuverIcon
            action={maneuver.action}
            direction={maneuver.direction}
            size={ms(16)}
            color={colors.white}
          />
          <AppText style={styles.turnLabel} numberOfLines={1}>
            {turnLabel}
          </AppText>
          {turnDistance ? (
            <AppText style={styles.turnDistance}>{turnDistance}</AppText>
          ) : null}
        </View>
      ) : null}

      {/* Trip readout + the way back to the full screen. */}
      <TouchableOpacity
        style={styles.footer}
        activeOpacity={onExpand ? 0.8 : 1}
        onPress={onExpand}
        disabled={!onExpand}>
        <View style={styles.footerText}>
          <AppText style={styles.footerTitle} numberOfLines={1}>
            {trip?.destinationText || 'Trip in progress'}
          </AppText>
          <AppText style={styles.footerMeta} numberOfLines={1}>
            {navInfo
              ? `${navInfo.etaText} · ${navInfo.distKm} km · ETA ${navInfo.arrivalStr}`
              : 'Following your trip…'}
          </AppText>
        </View>
        {onExpand ? <AppText style={styles.footerChevron}>›</AppText> : null}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.gpsBtn}
        onPress={recenter}
        activeOpacity={0.8}>
        <GpsIcon width={ms(16)} height={ms(16)} fill={colors.navy} />
      </TouchableOpacity>
    </View>
  );
}
