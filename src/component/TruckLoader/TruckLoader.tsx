import React, {useEffect, useRef} from 'react';
import {View, Animated, Easing, Image, useWindowDimensions, StyleSheet} from 'react-native';
import {moderateScale as ms, verticalScale as vs} from 'react-native-size-matters';
import MovingTruck from '../../assets/svg_icon/Moving_Truck.svg';
import RoadImage from '../../assets/Image/Road_image.png';

// Moving_Truck.svg is authored at 406 × 106 → keep this aspect ratio.
const TRUCK_ASPECT = 406 / 106;

export interface TruckLoaderProps {
  duration?: number;
  truckW?: number;
  truckH?: number;
  loop?: boolean;
  /** Fired at the end of each pass; the single-shot screens navigate on it. */
  onCycle?: () => void;
}

export default function TruckLoader({
  duration = 3000,
  truckW = ms(405),
  truckH = ms(200) / TRUCK_ASPECT,
  loop = true,
  onCycle,
}: TruckLoaderProps) {
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
      {/* Only the asphalt road (rows ~207-240 of the 280px scene) is shown.
          The scene is drawn tall and pushed down so the clip band exposes just
          the road — sky/hills above and grass below are hidden. */}
      <View style={styles.roadClip}>
        <Image source={RoadImage} style={styles.road} resizeMode="stretch" />
      </View>

      <Animated.View style={[styles.truck, {transform: [{translateX: x}]}]}>
        <MovingTruck width={truckW} height={truckH} />
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
  roadClip: {
    // Visible window = height of the asphalt band only.
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: vs(22),
    overflow: 'hidden',
  },
  road: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -vs(27),
    width: '100%',
    height: vs(185),
  },
  truck: {
    position: 'absolute',
    left: 0,
    bottom: vs(20),
  },
});
