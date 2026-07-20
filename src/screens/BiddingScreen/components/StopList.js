import React from 'react';
import {View} from 'react-native';

import styles from '../BiddingScreen.styles';
import {stopSummary} from '../constants';
import AppText from '../../../theme/AppText';

/* Renders every stop on a load as its own dotted line (blue = pickup,
   green = drop) followed by the "1 Pickup 2 Drop" summary. */
export default function StopList({stops, textStyle, summaryStyle}) {
  return (
    <View>
      {stops.map((s, i) => (
        <View key={`${s.city}-${i}`} style={styles.stopRow}>
          <View style={[styles.stopDot, s.type === 'drop' && styles.stopDotDrop]} />
          <AppText style={[styles.stopCity, textStyle]} numberOfLines={1}>
            {s.city}
          </AppText>
        </View>
      ))}
      <AppText style={[styles.stopSummary, summaryStyle]} numberOfLines={1}>
        {stopSummary(stops)}
      </AppText>
    </View>
  );
}
