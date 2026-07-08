import React from 'react';
import {View} from 'react-native';

import styles from '../BiddingScreen.styles';
import {STATUS} from '../constants';
import AppText from '../../../theme/AppText';

export default function StatusBadge({status}) {
  const s = STATUS[status] || STATUS.Open;
  return (
    <View style={[styles.statusBadge, {backgroundColor: s.bg}]}>
      <AppText style={[styles.statusBadgeText, {color: s.text}]}>{status}</AppText>
    </View>
  );
}
