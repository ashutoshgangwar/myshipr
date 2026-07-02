import React, {useEffect, useRef} from 'react';
import {View, Animated, Easing, StyleSheet} from 'react-native';
import {moderateScale as ms} from 'react-native-size-matters';
import Success_Tick from '../../assets/svg_icon/tick_success.svg';

// Pixel-confetti that FALLS from behind the badge toward the bottom of the
// screen, then fades out. Each particle starts at the badge centre and drops
// by `fall` while drifting sideways by `x`; sized/tinted to mimic the design.
const TEAL = '#2FBFAE';
const TEAL_DARK = '#1E7F79';
const NAVY = '#00033E';

// `x` is the horizontal offset from the badge centre (± = spread across) and
// `fall` is how far BELOW the badge each particle drops (down side). Every
// particle emanates FROM the badge icon, falls to the down side, then hides.
//
// Each particle owns its slice of the timeline: `start` is when (0–1 of the
// sparkle phase) it begins, `win` is how long its fall lasts. Both vary per
// particle so they DON'T all drop on the same schedule or for the same
// duration — the confetti reads as a scattered, organic fall.
const PARTICLES = [
  {x: -150, fall: 120, size: 7, color: TEAL, start: 0.06, win: 0.44},
  {x: -60, fall: 160, size: 6, color: NAVY, start: 0.20, win: 0.42},
  {x: 30, fall: 100, size: 8, color: TEAL_DARK, start: 0.10, win: 0.46},
  {x: 110, fall: 150, size: 6, color: NAVY, start: 0.32, win: 0.42},
  {x: 175, fall: 110, size: 7, color: TEAL, start: 0.16, win: 0.44},
  // fanned wide to the left/right edges
  {x: -260, fall: 150, size: 9, color: TEAL, start: 0.04, win: 0.48},
  {x: -175, fall: 220, size: 6, color: NAVY, start: 0.26, win: 0.42},
  {x: -145, fall: 120, size: 7, color: TEAL_DARK, start: 0.12, win: 0.50},
  {x: -118, fall: 260, size: 5, color: NAVY, start: 0.40, win: 0.40},
  {x: -90, fall: 170, size: 8, color: TEAL, start: 0.08, win: 0.46},
  {x: -60, fall: 240, size: 6, color: TEAL_DARK, start: 0.34, win: 0.44},
  {x: -32, fall: 130, size: 9, color: NAVY, start: 0.02, win: 0.44},
  {x: -10, fall: 300, size: 5, color: TEAL, start: 0.50, win: 0.38},
  {x: 14, fall: 190, size: 8, color: NAVY, start: 0.16, win: 0.48},
  {x: 40, fall: 140, size: 7, color: TEAL, start: 0.06, win: 0.46},
  {x: 66, fall: 270, size: 5, color: TEAL_DARK, start: 0.44, win: 0.40},
  {x: 94, fall: 200, size: 8, color: NAVY, start: 0.22, win: 0.44},
  {x: 122, fall: 120, size: 9, color: TEAL, start: 0.10, win: 0.50},
  {x: 150, fall: 250, size: 6, color: NAVY, start: 0.38, win: 0.42},
  {x: 178, fall: 165, size: 7, color: TEAL_DARK, start: 0.18, win: 0.46},
  {x: 205, fall: 230, size: 5, color: TEAL, start: 0.48, win: 0.40},
  {x: -195, fall: 200, size: 6, color: NAVY, start: 0.30, win: 0.42},
  {x: 195, fall: 135, size: 8, color: TEAL_DARK, start: 0.14, win: 0.48},
];

function Particle({progress, x, fall, size, color, start, win}) {
  const dx = ms(x);
  const dropY = ms(fall);

  // Confine everything to this particle's own [start, end] slice so its life
  // is independent of the others. Clamped outside the slice → invisible.
  const end = Math.min(start + win, 1);
  const at = f => start + (end - start) * f;

  // Drifts sideways a little as it falls.
  const translateX = progress.interpolate({
    inputRange: [start, end],
    outputRange: [0, dx],
    extrapolate: 'clamp',
  });
  // Accelerating drop (gravity feel): emanates FROM the badge icon (0), then
  // falls to the down side (+dropY) — slow at first, faster toward the bottom.
  const translateY = progress.interpolate({
    inputRange: [start, at(0.35), at(0.7), end],
    outputRange: [0, dropY * 0.15, dropY * 0.55, dropY],
    extrapolate: 'clamp',
  });
  // Pop in at the badge, then shrink slightly as it falls away.
  const scale = progress.interpolate({
    inputRange: [start, at(0.2), end],
    outputRange: [0.3, 1, 0.6],
    extrapolate: 'clamp',
  });
  // Fade in quickly, hold while falling, then hide before it reaches bottom.
  const opacity = progress.interpolate({
    inputRange: [start, at(0.15), at(0.7), end],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: ms(size),
          height: ms(size),
          backgroundColor: color,
          opacity,
          transform: [{translateX}, {translateY}, {scale}],
        },
      ]}
    />
  );
}

/**
 * Animated success badge: the scalloped "flower" tick spins/scales in while
 * pixel confetti flies out and falls toward the bottom of the screen at the
 * same time, then fades out. Purely decorative — fires once on mount (set
 * `loop` to replay).
 */
export default function SuccessBurst({size = ms(84), loop = false, style}) {
  const progress = useRef(new Animated.Value(0)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const badgeSpin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const run = () => {
      progress.setValue(0);
      badgeScale.setValue(0.6);
      badgeOpacity.setValue(0);
      badgeSpin.setValue(0);
      // Parallel: the badge spins/scales/fades in AND the flowers fly at the
      // same time — everything fires together.
      Animated.parallel([
        // Smooth scale + fade in, no spring bounce/overshoot.
        Animated.timing(badgeScale, {
          toValue: 1,
          duration: 620,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(badgeOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        // One smooth full spin that decelerates to a stop.
        Animated.timing(badgeSpin, {
          toValue: 1,
          duration: 720,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Flowers fly out at the same time as the spin.
        Animated.timing(progress, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({finished}) => {
        if (finished && loop) {
          setTimeout(run, 500);
        }
      });
    };
    run();
    return () => {
      progress.stopAnimation();
      badgeScale.stopAnimation();
      badgeOpacity.stopAnimation();
      badgeSpin.stopAnimation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loop]);

  return (
    <View style={[styles.stage, style]} pointerEvents="none">
      {PARTICLES.map((p, i) => (
        <Particle key={i} progress={progress} {...p} />
      ))}
      <Animated.View
        style={{
          opacity: badgeOpacity,
          transform: [
            {
              rotate: badgeSpin.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
            {scale: badgeScale},
          ],
        }}>
        <Success_Tick width={size} height={size} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    borderRadius: 1,
  },
});
