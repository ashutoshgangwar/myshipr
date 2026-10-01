import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {IS_TABLET} from '../../theme/device';
import {colors} from '../../theme/colors';
import AppText from '../../theme/AppText';

const FALCON = require('../../assets/gif/falcov_icon.gif');

// The artwork is 500x350, so the height follows from whatever width we pick.
const ASPECT = 500 / 350;

const SAMPLES = 28;

/** One axis of a cubic Bezier, evaluated at `t`. */
const bezier = (t: number, a: number, b: number, c: number, d: number) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};

/** A point in window coordinates, as `measureInWindow` reports them. */
export interface FlightOrigin {
  x: number;
  y: number;
}

export interface FalconFlightProps {

  trigger: number;
  origin?: FlightOrigin | null;
  label?: string | null;
  size?: number;
  duration?: number;
  onDone?: () => void;
}

export default function FalconFlight({
  trigger,
  origin,
  label,
  size,
  duration = 2200,
  onDone,
}: FalconFlightProps) {
  const {width, height} = useWindowDimensions();

  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const overlay = useRef<View>(null);
  const overlayOffset = useRef<FlightOrigin>({x: 0, y: 0});
  const [hatched, setHatched] = useState(false);

  const span = size ?? Math.min(width * 0.5, IS_TABLET ? 320 : 200);
  const wingHeight = span / ASPECT;
  const pop = Math.min(0.12, 450 / duration);

  useEffect(() => {
    if (!trigger) return;

    setHatched(true);
    progress.setValue(0);
    fade.setValue(1);

    const flight = Animated.sequence([
      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: Easing.bezier(0.3, 0, 0.6, 0.65),
        useNativeDriver: true,
      }),
      Animated.delay(120),
      Animated.timing(fade, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    flight.start(({finished}) => {
      if (finished && onDone) onDone();
    });

    // Leaving the screen mid-flight must not leave a stale animation running.
    return () => flight.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const measureOverlay = () => {
    overlay.current?.measureInWindow((x, y) => {
      if (typeof x === 'number' && typeof y === 'number') {
        overlayOffset.current = {x, y};
      }
    });
  };

  // Launch point, converted from window coordinates to overlay-local ones.
  const startX = origin
    ? origin.x - overlayOffset.current.x
    : width + span * 0.4;
  const startY = origin ? origin.y - overlayOffset.current.y : height * 0.34;

  // Where the swoop finishes: horizontally centred, high enough that the
  // falcon sits in the status bar row rather than under the header.
  const endX = width / 2;
  const endY = wingHeight * 0.55;

  // The swoop as a cubic Bezier: out of the coin, pulled left and down, wide
  // to the left edge while climbing, then curving back in to the top centre.
  // The two control points are what bend it; moving them reshapes the whole
  // arc without any waypoint needing to be kept in sync by hand.
  const path = useMemo(() => {
    const stops: number[] = [];
    const xs: number[] = [];
    const ys: number[] = [];

    for (let i = 0; i < SAMPLES; i++) {
      const t = i / (SAMPLES - 1);
      stops.push(t);
      xs.push(bezier(t, startX, width * 0.62, width * 0.02, endX));
      ys.push(
        bezier(t, startY, startY + height * 0.18, height * 0.34, endY),
      );
    }

    // Tilt is read off the curve itself rather than keyframed separately, so
    // the falcon can never lean the wrong way for the direction it is moving:
    // nose down while dropping, up while climbing, level where the path flattens.
    const tilts = xs.map((_, i) => {
      const j = Math.min(i + 1, SAMPLES - 1);
      const dx = xs[j] - xs[i];
      const dy = ys[j] - ys[i];
      const travelled = Math.hypot(dx, dy);
      const slope = travelled > 0 ? dy / travelled : 0;
      return `${(slope * 14).toFixed(2)}deg`;
    });

    return {stops, xs, ys, tilts};
  }, [startX, startY, endX, endY, width, height]);

  const translateX = progress.interpolate({
    inputRange: path.stops,
    outputRange: path.xs,
  });

  const translateY = progress.interpolate({
    inputRange: path.stops,
    outputRange: path.ys,
  });

  const rotate = progress.interpolate({
    inputRange: path.stops,
    outputRange: path.tilts,
  });

  // Coin-sized at the launch, full span once it is clear of the panel, then
  // easing back to a settled size for the landing rather than shrinking away.
  const scale = progress.interpolate({
    inputRange: [0, pop, pop * 2.5, 0.7, 1],
    outputRange: [0.12, 0.45, 1.05, 0.9, 0.75],
  });

  // Fade-in only. The exit is driven by `fade`, which runs after the landing,
  // and the two are multiplied so neither has to know about the other.
  const opacity = Animated.multiply(
    progress.interpolate({
      inputRange: [0, pop * 0.4, 1],
      outputRange: [0, 1, 1],
    }),
    fade,
  );

  // The amount pops with the bird but shrinks far less as the bird pulls away,
  // so the number stays legible for the whole flight instead of vanishing.
  const labelScale = progress.interpolate({
    inputRange: [0, pop, pop * 2.5, 1],
    outputRange: [0.2, 0.8, 1.1, 1],
  });

  return (
    <View
      ref={overlay}
      collapsable={false}
      pointerEvents="none"
      onLayout={measureOverlay}
      style={[styles.overlay, {top: -insets.top, bottom: -insets.bottom}]}>
      {hatched ? (
        // Outer view owns the flight path, so anything nested in it travels
        // together. Bird and amount then each get their own character on top.
        <Animated.View
          pointerEvents="none"
          style={[
            styles.flight,
            {
              width: span,
              height: wingHeight,
              // Centred on the flight point so it grows out of the coin rather
              // than away from its top-left corner.
              marginLeft: -span / 2,
              marginTop: -wingHeight / 2,
              opacity,
              transform: [{translateX}, {translateY}],
            },
          ]}>
          <Animated.View
            style={[
              styles.bird,
              {transform: [{rotate}, {scale}]},
            ]}>
            <Image
              source={FALCON}
              style={styles.image}
              resizeMode="contain"
              // Android cross-fades images in by default, which reads as a
              // stutter on the first GIF frame.
              fadeDuration={0}
            />
          </Animated.View>

          {label ? (
            // Deliberately outside the bird's transform: it rides the same path
            // but never tilts with the wings, which would make it unreadable.
            <Animated.View
              style={[
                styles.label,
                {top: wingHeight * 0.62, transform: [{scale: labelScale}]},
              ]}>
              <AppText
                style={[styles.labelText, {fontSize: span * 0.15}]}
                numberOfLines={1}>
                {label}
              </AppText>
            </Animated.View>
          ) : null}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    elevation: 30,
  },
  flight: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  bird: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  label: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  labelText: {
    color: colors.white,
    fontWeight: '800',
    // Same treatment as the value printed on the coin, so the number stays
    // readable over the map, cards and anything else it flies across.
    textShadowColor: colors.textMuted,
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
});
