import React, {useRef} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  type GestureResponderEvent,
} from 'react-native';

import CoinIcon from '../../../../assets/svg_icon/coin.svg';
import AppText from '../../../../theme/AppText';
import {ms} from '../constants';
import {colors} from '../../../../theme/colors';

/**
 * One coin on the "Bid NOW" panel. Uses the shared `coin.svg` asset (no per-coin
 * colour yet — that's a later pass) with the decrement value on top, e.g. -25.
 *
 * Props:
 *  - value:   amount this coin lowers the bid by (number)
 *  - size:    coin diameter in px
 *  - onPress: called with `value` and the coin's centre when tapped
 */
export interface BidCoinProps {
  /** How much this coin lowers the bid by. */
  value: number;
  size?: number;
  /**
   * `origin` is the coin's centre in window coordinates, so the caller can
   * launch an effect from the coin the user actually hit.
   */
  onPress?: (value: number, origin: {x: number; y: number}) => void;
}

export default function BidCoin({
  value,
  size = ms(46),
  onPress,
}: BidCoinProps) {
  const coin = useRef<React.ComponentRef<typeof TouchableOpacity>>(null);

  const handlePress = (e: GestureResponderEvent) => {
    if (!onPress) return;
    // The touch point is the fallback; measuring gives the coin's centre, which
    // keeps the launch identical wherever on the coin the user lands.
    const {pageX, pageY} = e.nativeEvent;
    const node = coin.current;
    if (!node || typeof node.measureInWindow !== 'function') {
      onPress(value, {x: pageX, y: pageY});
      return;
    }
    node.measureInWindow((x, y, w, h) => {
      const measured = typeof w === 'number' && w > 0;
      onPress(
        value,
        measured ? {x: x + w / 2, y: y + h / 2} : {x: pageX, y: pageY},
      );
    });
  };

  return (
    <TouchableOpacity
      ref={coin}
      activeOpacity={0.8}
      onPress={handlePress}
      style={[styles.wrap, {width: size, height: size, borderRadius: size / 2}]}>
      <CoinIcon width={size} height={size} />
      <View style={styles.label} pointerEvents="none">
        <AppText style={[styles.value, {fontSize: size * 0.28}]} numberOfLines={1}>
          -{value}
        </AppText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {alignItems: 'center', justifyContent: 'center'},
  label: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: colors.white,
    fontWeight: '700',
    textShadowColor: colors.blackAlpha45,
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
});
