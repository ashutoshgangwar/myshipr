import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, Easing, StyleSheet, useWindowDimensions, View} from 'react-native';
import type {StyleProp, ViewStyle} from 'react-native';

import {colors} from '../../theme/colors';
import {ms} from '../../theme/scale';
import {playAppSound} from '../../services/notificationSound';
import type {AppSound} from '../../services/notificationSound';

/**
 * Party colours, cycled by a stride so no two neighbours in a fan match.
 * Pass `colors` to celebrate in a different palette.
 */
export const CONFETTI_COLORS = [
  colors.success,
  colors.button_color,
  colors.accentBlue,
  colors.card_drive_load,
  colors.successdark,
  colors.primaryGradientEnd,
  colors.danger,
  colors.paleBlue,
];

/** Where a popper sits and which way it throws. */
export interface Popper {
  /** Muzzle position, as a fraction of the layer's width. */
  x: number;
  /** Muzzle position, as a fraction of its height. */
  y: number;
  /** 1 throws to the right, -1 to the left. */
  aim: 1 | -1;
  /** Scales the throw's height — a shallow popper barely lobs before falling. */
  rise: number;
  /** Scales the drop, so every ribbon clears the bottom edge. */
  fall: number;
}

/** The muzzle layouts worth naming. */
export type PopperPreset = 'corners' | 'bottom' | 'top' | 'sides';

const PRESETS: Record<PopperPreset, Popper[]> = {
  /** One in each corner, all firing inward — the fullest of the four. */
  corners: [
    {x: 0.06, y: 0.82, aim: 1, rise: 1, fall: 0.5},
    {x: 0.94, y: 0.82, aim: -1, rise: 1, fall: 0.5},
    {x: 0.04, y: 0.16, aim: 1, rise: 0.34, fall: 1.35},
    {x: 0.96, y: 0.16, aim: -1, rise: 0.34, fall: 1.35},
  ],
  /** The classic pair thrown up from the lower corners. */
  bottom: [
    {x: 0.06, y: 0.82, aim: 1, rise: 1, fall: 0.5},
    {x: 0.94, y: 0.82, aim: -1, rise: 1, fall: 0.5},
  ],
  /** Rains down from the upper corners, for a screen with content below. */
  top: [
    {x: 0.04, y: 0.12, aim: 1, rise: 0.3, fall: 1.4},
    {x: 0.96, y: 0.12, aim: -1, rise: 0.3, fall: 1.4},
  ],
  /** Thrown inward from halfway up, so nothing crosses the middle twice. */
  sides: [
    {x: 0.02, y: 0.5, aim: 1, rise: 0.6, fall: 0.85},
    {x: 0.98, y: 0.5, aim: -1, rise: 0.6, fall: 0.85},
  ],
};

/** Ribbons per popper, when the caller names no other number. */
const DEFAULT_COUNT = 18;

/** How long one burst takes, end to end. */
const DEFAULT_DURATION = 3000;

/** The streamer's short side, in dp before scaling. */
const DEFAULT_SIZE = 7;

/** When each wave leaves the muzzle, as a fraction of the burst. */
const WAVES = [0, 0.24];

/** The pop that goes with a throw, when the caller names no other sound. */
const DEFAULT_SOUND: AppSound = 'celebration';

/** One ribbon's flight, as fractions of the layer so it scales with it. */
interface Ribbon {
  /** Which popper threw it. */
  popper: Popper;
  /** Sideways travel, as a fraction of the width. */
  dx: number;
  /** How high the throw carries it, as a fraction of the height. */
  rise: number;
  /** How far below the muzzle it ends up — off the bottom edge. */
  fall: number;
  width: number;
  height: number;
  color: string;
  /** Where in the 0→1 burst this ribbon leaves the popper. */
  start: number;
  /** How much of the burst its flight spans. */
  span: number;
  /** Total spin over that flight. */
  spin: number;
  /** Round ribbons are the paper dots mixed in with the streamers. */
  round: boolean;
}

/**
 * A fan built from a fixed seed rather than a fresh random one per burst: the
 * throw was tuned to fill the screen without burying what is under it, and
 * re-rolling it on every mount would lose that.
 */
const buildRibbons = (
  poppers: Popper[],
  count: number,
  palette: string[],
  size: number,
): Ribbon[] => {
  let seed = 0x5eed;
  const next = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  const ribbons: Ribbon[] = [];
  poppers.forEach((popper, p) => {
    for (let i = 0; i < count; i++) {
      // Spread the fan evenly, then nudge each one so it is not a comb.
      const spread = (i + next() * 0.7) / count;
      const wave = WAVES[i % WAVES.length];
      const round = i % 3 === 0;
      const side = size - 2 + Math.round(next() * 5);
      ribbons.push({
        popper,
        dx: 0.14 + spread * 0.82,
        rise: (0.4 + next() * 0.44) * popper.rise,
        fall: (0.45 + next() * 0.3) * popper.fall,
        width: round ? side : side - 2,
        height: round ? side : side + 7,
        color: palette[(i * 3 + p) % palette.length],
        start: wave + next() * 0.14,
        // A late ribbon gets a shorter flight, so the burst still ends together.
        span: (0.6 + next() * 0.24) * (wave > 0 ? 0.82 : 1),
        spin: (next() > 0.5 ? 1 : -1) * (540 + Math.round(next() * 720)),
        round,
      });
    }
  });
  return ribbons;
};

function Piece({
  ribbon,
  progress,
  width,
  height,
}: {
  ribbon: Ribbon;
  progress: Animated.Value;
  width: number;
  height: number;
}) {
  const {popper, start, span} = ribbon;
  const end = Math.min(start + span, 1);
  /** A point inside this ribbon's own slice of the burst. */
  const at = (f: number) => start + (end - start) * f;

  const dx = popper.aim * ribbon.dx * width;
  const rise = ribbon.rise * height;
  const fall = ribbon.fall * height;

  // Thrown out and up, slowing as it goes — most of the sideways travel is
  // spent before gravity takes over.
  const translateX = progress.interpolate({
    inputRange: [start, at(0.45), end],
    outputRange: [0, dx * 0.72, dx],
    extrapolate: 'clamp',
  });
  const translateY = progress.interpolate({
    inputRange: [start, at(0.22), at(0.42), end],
    outputRange: [0, -rise * 0.78, -rise, fall],
    extrapolate: 'clamp',
  });
  const rotate = progress.interpolate({
    inputRange: [start, end],
    outputRange: ['0deg', `${ribbon.spin}deg`],
    extrapolate: 'clamp',
  });
  // A streamer turning edge-on to the eye; the dots keep their width.
  const scaleX = progress.interpolate({
    inputRange: [start, at(0.25), at(0.5), at(0.75), end],
    outputRange: ribbon.round ? [1, 1, 1, 1, 1] : [1, 0.25, 1, 0.35, 1],
    extrapolate: 'clamp',
  });
  const opacity = progress.interpolate({
    inputRange: [start, at(0.05), at(0.78), end],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: popper.x * width,
          top: popper.y * height,
          width: ms(ribbon.width),
          height: ms(ribbon.height),
          borderRadius: ribbon.round ? ms(ribbon.width) : ms(1.5),
          backgroundColor: ribbon.color,
          opacity,
          transform: [{translateX}, {translateY}, {rotate}, {scaleX}],
        },
      ]}
    />
  );
}

export interface ConfettiPoppersProps {
  /** Fires the burst; going false→true throws a fresh one. */
  active?: boolean;
  /** Keeps throwing, for a screen that stays up a while. */
  loop?: boolean;
  /** Which muzzles fire. Ignored when `poppers` is given. */
  preset?: PopperPreset;
  /** Muzzles of your own, when no preset sits where you want them. */
  poppers?: Popper[];
  /** Ribbons per popper — the whole layer is `poppers.length * count` views. */
  count?: number;
  /** How long one burst lasts, in ms. */
  duration?: number;
  /** The palette to throw, cycled across the fan. */
  colors?: string[];
  /** The streamer's short side in dp; everything else is sized off it. */
  size?: number;
  /**
   * Throws again whenever this value changes, for a screen that celebrates
   * more than once without unmounting.
   */
  burstKey?: number | string;
  /**
   * The pop heard as the burst leaves the muzzles. `true` is the app's
   * celebration sound, `false` throws in silence, and a name picks another of
   * the app's bundled sounds.
   *
   * It plays once per run rather than once per throw, so `loop` does not turn
   * into a repeating chime. A new `burstKey` is a new run, and sounds again.
   *
   * Follows the device's volume, and stays silent in silent mode.
   */
  sound?: boolean | AppSound;
  /** Runs when a burst finishes — never called while looping. */
  onDone?: () => void;
  /**
   * Layers over whatever it is dropped on. Android stacks by `elevation`
   * rather than render order, so to fly in FRONT of a raised card pass
   * `{zIndex, elevation}` above that card's own elevation.
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Party poppers throwing streamers and paper dots in two waves across
 * whatever is beneath them, then letting them fall out of the bottom, with a
 * pop as they go.
 *
 *     <ConfettiPoppers />                          // all four corners
 *     <ConfettiPoppers preset="bottom" loop />     // the classic pair
 *     <ConfettiPoppers active={saved} burstKey={saveCount} />
 *     <ConfettiPoppers sound={false} />            // seen and not heard
 *
 * It fills its parent, so drop it in a container that is already the size you
 * want covered — a `flex: 1` screen, or a modal's root. Decorative only: it
 * never takes a touch, so it can sit over buttons.
 */
export default function ConfettiPoppers({
  active = true,
  loop = false,
  preset = 'corners',
  poppers,
  count = DEFAULT_COUNT,
  duration = DEFAULT_DURATION,
  colors: palette = CONFETTI_COLORS,
  size = DEFAULT_SIZE,
  burstKey,
  sound = true,
  onDone,
  style,
}: ConfettiPoppersProps) {
  const {width, height} = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;

  const muzzles = poppers?.length ? poppers : PRESETS[preset] || PRESETS.corners;
  const ribbons = useMemo(
    () => buildRibbons(muzzles, count, palette, size),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [muzzles, count, size, palette.join()],
  );

  // `onDone` is read at the end of a burst rather than captured when it starts,
  // so a caller need not memoise it to avoid re-firing the whole throw.
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  // Read at the throw rather than depended on, so changing it mid-burst does
  // not restart one — and so a caller need not memoise anything to avoid that.
  const soundRef = useRef(sound);
  soundRef.current = sound;

  useEffect(() => {
    if (!active) {
      progress.setValue(0);
      return;
    }
    const heard = soundRef.current;
    if (heard) playAppSound(heard === true ? DEFAULT_SOUND : heard);

    const run = () => {
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({finished}) => {
        if (!finished) return;
        if (loop) run();
        else doneRef.current?.();
      });
    };
    run();
    return () => progress.stopAnimation();
  }, [active, loop, duration, burstKey, progress]);

  if (!active) return null;

  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      {ribbons.map((ribbon, i) => (
        <Piece
          key={i}
          ribbon={ribbon}
          progress={progress}
          width={width}
          height={height}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
  },
});
