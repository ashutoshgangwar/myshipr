import React from 'react';
import {View} from 'react-native';

import styles from '../BiddingScreen.styles';
import AppText from '../../../theme/AppText';
import type {StyleProp, ViewStyle} from 'react-native';

// `lines` lets a merged column (e.g. Trip Distance / Dead Mile) wrap its label
// instead of ellipsising it; every other header stays on a single line.
export default function HeaderCell({
  label,
  colStyle,
  center,
  lines = 1,
}: {
  label?: string;
  colStyle?: StyleProp<ViewStyle>;
  center?: boolean;
  lines?: number;
  /** Accepted for parity with the column config; the cell has no sort UI. */
  sortable?: boolean;
}) {
  return (
    <View style={[styles.thCell, colStyle, center && styles.thCellCenter]}>
      <AppText
        style={[styles.thText, lines > 1 && styles.thTextWrap]}
        numberOfLines={lines}>
        {label}
      </AppText>
    </View>
  );
}
