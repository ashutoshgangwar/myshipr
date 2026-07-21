import React from 'react';
import {View} from 'react-native';

import styles from '../BiddingScreen.styles';
import AppText from '../../../theme/AppText';
import TruckIcon from '../../../assets/svg_icon/Truck_Frame.svg';

// Multileg gets its own tint so it reads apart from the FTL/LTL chips.
const TINT = {
  Multileg: {bg: '#EFE9FF', text: '#5B3FD6'},
};

export default function ModeChip({mode, style, textStyle, iconSize = 12}) {
  const tint = TINT[mode];
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
