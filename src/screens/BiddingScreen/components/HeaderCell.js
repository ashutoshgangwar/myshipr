import React from 'react';
import {View} from 'react-native';

import styles from '../BiddingScreen.styles';
import AppText from '../../../theme/AppText';

export default function HeaderCell({label, colStyle, center}) {
  return (
    <View style={[styles.thCell, colStyle, center && styles.thCellCenter]}>
      <AppText style={styles.thText} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}
