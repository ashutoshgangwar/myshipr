import React from 'react';
import {View} from 'react-native';

import styles, {STOP_LINE_H} from '../BiddingScreen.styles';
import {stopSummary} from '../constants';
import AppText from '../../../theme/AppText';
import DropPin from '../../../assets/svg_icon/stop_pin_green.svg';

/* One line per stop, joined by a dashed connector: every stop but the last is a
   blue ring, the final drop is a green pin. Ends with "1 Pickup 2 Drop". */
export default function StopList({stops, textStyle, summaryStyle}) {
  const last = stops.length - 1;

  return (
    <View>
      <View style={styles.stopsWrap}>
        {/* connector runs icon-centre to icon-centre, behind the markers */}
        {stops.length > 1 ? (
          <View
            style={[
              styles.stopConnector,
              {top: STOP_LINE_H / 2, height: last * STOP_LINE_H},
            ]}
          />
        ) : null}

        {stops.map((s, i) => (
          <View key={`${s.city}-${i}`} style={styles.stopRow}>
            <View style={styles.stopIcon}>
              {i === last ? (
                <DropPin width={13} height={15} />
              ) : (
                <View style={styles.stopRing}>
                  <View style={styles.stopRingCore} />
                </View>
              )}
            </View>
            <AppText style={[styles.stopCity, textStyle]} numberOfLines={1}>
              {s.city}
            </AppText>
          </View>
        ))}
      </View>

      <AppText style={[styles.stopSummary, summaryStyle]} numberOfLines={1}>
        {stopSummary(stops)}
      </AppText>
    </View>
  );
}
