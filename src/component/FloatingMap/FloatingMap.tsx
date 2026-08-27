import React, {useRef} from 'react';
import {
  View,
  Animated,
  PanResponder,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

import styles, {CARD_WIDTH, CARD_HEIGHT} from './FloatingMap.styles';
import AppText from '../../theme/AppText';
import HereMapPicker from '../HereMapPicker/HereMapPicker';
import LiveTripMap from '../LiveTripMap/LiveTripMap';
import {useTripSession} from '../../services/TripSessionService';

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');
const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

/**
 * A floating, draggable HERE-map card that sits above the screen content.
 * Drag it anywhere by its top handle bar; close it with the X. The map area
 * itself stays interactive (pan/zoom) because only the handle starts a drag.
 *
 * What it shows depends on whether a trip is on:
 *   - trip running → the *same* HERE navigation session ActiveTripScreen was
 *     showing, still guiding, now rendered in here (see LiveTripMap). Leaving
 *     the trip screen does not end the trip, so this is a window onto it rather
 *     than a second map.
 *   - otherwise → the HERE destination picker, as before.
 *
 * @param {object}   props
 * @param {boolean}  props.visible    Show/hide the floating card.
 * @param {function} props.onClose    Called when the X is pressed.
 * @param {function} [props.onPick]   Forwarded to HereMapPicker.
 * @param {function} [props.onExpand] Called to return to the full trip screen.
 */
export interface FloatingMapProps {
  visible?: boolean;
  onClose?: () => void;
  /** Fired when the driver taps a point on the mini map. */
  onPick?: (point: unknown) => void;
  onExpand?: () => void;
}

const FloatingMap = ({
  visible,
  onClose,
  onPick,
  onExpand,
}: FloatingMapProps) => {
  const trip = useTripSession();
  // Start roughly centered.
  const startX = (SCREEN_W - CARD_WIDTH) / 2;
  const startY = (SCREEN_H - CARD_HEIGHT) / 3;
  const pan = useRef(new Animated.ValueXY({x: startX, y: startY})).current;
  const offset = useRef({x: startX, y: startY}).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gesture) =>
        Math.abs(gesture.dx) > 3 || Math.abs(gesture.dy) > 3,
      onPanResponderGrant: () => {
        pan.setOffset({x: offset.x, y: offset.y});
        pan.setValue({x: 0, y: 0});
      },
      onPanResponderMove: Animated.event([null, {dx: pan.x, dy: pan.y}], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_evt, gesture) => {
        pan.flattenOffset();
        const nextX = clamp(offset.x + gesture.dx, 0, SCREEN_W - CARD_WIDTH);
        const nextY = clamp(offset.y + gesture.dy, 0, SCREEN_H - CARD_HEIGHT);
        offset.x = nextX;
        offset.y = nextY;
        Animated.spring(pan, {
          toValue: {x: nextX, y: nextY},
          useNativeDriver: false,
          bounciness: 0,
        }).start();
      },
    }),
  ).current;

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.card,
        {transform: [{translateX: pan.x}, {translateY: pan.y}]},
      ]}>
      {/* Map only — no header bar */}
      <View style={styles.mapWrap}>
        {trip ? (
          <LiveTripMap
            trip={trip}
            style={styles.mapInner}
            onExpand={onExpand}
          />
        ) : (
          <HereMapPicker
            onPick={onPick}
            mapStyle={styles.mapInner}
            showSearch={false}
          />
        )}
      </View>

      {/* Thin drag strip overlaid on top of the map (keeps map pan usable) */}
      <View style={styles.dragStrip} {...panResponder.panHandlers}>
        <View style={styles.grip} />
      </View>

      {/* Close button floats over the map via zIndex */}
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={onClose}
        hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
        activeOpacity={0.7}>
        <AppText style={styles.closeGlyph}>✕</AppText>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default FloatingMap;
