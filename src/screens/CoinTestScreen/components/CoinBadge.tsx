import React from 'react';
import {View, StyleSheet} from 'react-native';
import {moderateScale as ms} from 'react-native-size-matters';
import CoinIcon from '../../../assets/svg_icon/coin.svg';
import AppText from '../../../theme/AppText';
import {colors} from '../../../theme/colors';

/**
 * A single coin: the gold `coin.svg` asset with a backend-driven numeric value
 * rendered on top of it. The SVG stays a fixed reusable graphic; only the
 * `value` label changes (10, 12, 23, … 1000, or any number).
 *
 * Props:
 *  - value:    number|string shown in the centre of the coin
 *  - size:     coin diameter in px (defaults to 88)
 *  - selected: draws a highlight ring when true
 *  - onPress:  optional — omit to render a static (non-tappable) coin
 */
export default function CoinBadge({
  value,
  size = ms(88),
  selected = false,
}: {
  value: number | string;
  size?: number;
  selected?: boolean;
}) {
  // Scale the label down for longer numbers so "1000" still fits the coin.
  const digits = String(value).length;
  const fontSize = size * (digits >= 4 ? 0.26 : digits === 3 ? 0.32 : 0.4);

  return (
    <View
      style={[
        styles.wrap,
        {width: size, height: size, borderRadius: size / 2},
        selected && styles.selected,
      ]}>
      <CoinIcon width={size} height={size} />
      <View style={styles.label} pointerEvents="none">
        <AppText style={[styles.value, {fontSize}]} numberOfLines={1}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {alignItems: 'center', justifyContent: 'center'},
  selected: {
    borderWidth: ms(3),
    borderColor: colors.success,
  },
  label: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    color: '#936413',
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
});
