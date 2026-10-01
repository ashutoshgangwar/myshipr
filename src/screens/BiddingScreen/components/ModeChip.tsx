import React from 'react';
import {View} from 'react-native';

import styles from '../BiddingScreen.styles';
import AppText from '../../../theme/AppText';
import TruckIcon from '../../../assets/svg_icon/Truck_Frame.svg';
import type {StyleProp, TextStyle, ViewStyle} from 'react-native';
import {colors} from '../../../theme/colors';

// Multileg gets its own tint so it reads apart from the FTL/LTL chips.
const TINT: Record<string, {bg: string; text: string}> = {
  Multileg: {bg: colors.white, text: colors.card_drive_load},
};

export default function ModeChip({
  mode,
  style,
  textStyle,
  iconSize = 12,
}: {
  mode?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  iconSize?: number;
}) {
  const tint = mode ? TINT[mode] : undefined;
  return (
    <View style={[styles.modeChip, tint && {backgroundColor: tint.bg}, style]}>
      <TruckIcon width={iconSize} height={iconSize} />
      <AppText
        style={[styles.modeChipText, tint && {color: tint.text}, textStyle]}>
        {mode}
      </AppText>
    </View>
  );
}
