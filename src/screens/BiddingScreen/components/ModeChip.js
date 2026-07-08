import React from 'react';
import {View} from 'react-native';

import styles from '../BiddingScreen.styles';
import AppText from '../../../theme/AppText';
import TruckIcon from '../../../assets/svg_icon/Truck_Frame.svg';

export default function ModeChip({mode}) {
  return (
    <View style={styles.modeChip}>
      <TruckIcon width={12} height={12} />
      <AppText style={styles.modeChipText}>{mode}</AppText>
    </View>
  );
}
