import React, {useEffect, useRef} from 'react';
import {View, Animated, Easing, useWindowDimensions, StyleSheet} from 'react-native';
import {moderateScale as ms, verticalScale as vs} from 'react-native-size-matters';
import {colors} from '../../theme/colors';
import SideTruck from './SideTruck';

/**
 * Looping truck animation: a side-view truck drives across a road from the
 * left edge to off the right edge, then repeats. Drop it anywhere as a
 * loading / transition visual.
 *
 *   duration  ms for one left→right pass (default 2600)
 *   truckW    rendered truck width (default 180)
 *   loop      keep repeating (default true)
 *   onCycle   called each time the truck exits the right edge
 */
export default function TruckLoader({
  duration = 2600,
  truckW = ms(180),
  truckH = ms(78),
  loop = true,
  onCycle,
}) {
  const {width} = useWindowDimensions();
  const x = useRef(new Animated.Value(-truckW)).current;

  useEffect(() => {
    const run = () => {
      x.setValue(-truckW);
      Animated.timing(x, {
        toValue: width,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(({finished}) => {
        if (finished) {
          onCycle?.();
          if (loop) run();
        }
      });
    };
    run();
    return () => x.stopAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, duration, truckW, loop]);

  return (
    <View style={styles.stage}>
      {/* Road line the truck rides on */}
      <View style={styles.road} />

      <Animated.View style={[styles.truck, {transform: [{translateX: x}]}]}>
        <SideTruck width={truckW} height={truckH} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    width: '100%',
    height: vs(120),
    justifyContent: 'center',
    overflow: 'hidden',
  },
  road: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: vs(28),
    height: vs(3),
    backgroundColor: colors.textMuted,
  },
  truck: {
    position: 'absolute',
    left: 0,
    bottom: vs(28),
  },
});
