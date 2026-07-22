import React from 'react';
import {View} from 'react-native';

import styles, {STOP_LINE_H} from '../BiddingScreen.styles';
import {stopSummary, ms} from '../constants';
import AppText from '../../../theme/AppText';
import DropPin from '../../../assets/svg_icon/stop_pin_green.svg';
import CityRing from '../../../assets/svg_icon/city_ring.svg';
import RouteDashedLine from '../../../assets/svg_icon/RouteDashedLine.svg';

/* The connector's Svg top/bottom align to each marker's CENTRE, so inset the
   line by ~the marker radius to make it start at the edge (corner) of the icon
   instead of overlapping it, plus a touch of breathing room. */
const STOP_GAP = ms(6);

/* One line per stop, joined by a dashed connector: every stop but the last is a
   blue ring, the final drop is a green pin. Ends with "1 Pickup 2 Drop". */
export default function StopList({stops, textStyle, summaryStyle}) {
  const last = stops.length - 1;

  return (
    <View>
      <View style={styles.stopsWrap}>
        {/* Reuse the shared dashed-line asset once per gap between consecutive
            markers, each inset by STOP_GAP so every ring/pin gets clear space. */}
        {Array.from({length: last}).map((_, i) => (
          <RouteDashedLine
            key={i}
            width={2}
            height={STOP_LINE_H - 2 * STOP_GAP}
            preserveAspectRatio="none"
            style={[
              styles.stopConnector,
              {top: STOP_LINE_H / 2 + i * STOP_LINE_H + STOP_GAP},
            ]}
          />
        ))}

        {stops.map((s, i) => (
          <View key={`${s.city}-${i}`} style={styles.stopRow}>
            <View style={styles.stopIcon}>
              {i === last ? (
                <DropPin width={13} height={15} />
              ) : (
                <CityRing width={ms(11)} height={ms(11)} />
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
