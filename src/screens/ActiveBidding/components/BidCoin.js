import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';

import CoinIcon from '../../../assets/svg_icon/coin.svg';
import AppText from '../../../theme/AppText';
import {ms} from '../constants';

/**
 * One coin on the "Bid NOW" panel. Uses the shared `coin.svg` asset (no per-coin
 * colour yet — that's a later pass) with the decrement value on top, e.g. -25.
 *
 * Props:
 *  - value:   amount this coin lowers the bid by (number)
 *  - size:    coin diameter in px
 *  - onPress: called with `value` when tapped
 */
export default function BidCoin({value, size = ms(46), onPress}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress && onPress(value)}
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
    color: '#FFFFFF',
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
});
