import React from 'react';
import {View, TouchableOpacity} from 'react-native';

import styles from '../BiddingScreen.styles';
import ModeChip from './ModeChip';
import StatusBadge from './StatusBadge';
import AppText from '../../../theme/AppText';
import CalendarIcon from '../../../assets/svg_icon/Schedule.svg';
import ClockIcon from '../../../assets/svg_icon/Info_Icon.svg';

export default function GridCard({item}) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardRouteWrap}>
          <AppText style={styles.cardRoute}>
            {item.origin} <AppText style={styles.arrow}>→</AppText> {item.dest}
          </AppText>
          <AppText style={styles.cardRef}>{item.ref}</AppText>
        </View>
        <View style={styles.cardAmountWrap}>
          <AppText style={styles.cardAmount}>{item.amount}</AppText>
          {item.awardedAt ? (
            <AppText style={styles.cardAwardedAt}>Awarded at {item.awardedAt}</AppText>
          ) : null}
        </View>
      </View>

      <View style={styles.cardChipsRow}>
        <ModeChip mode={item.mode} />
        <View style={styles.metaChip}>
          <CalendarIcon width={12} height={12} />
          <AppText style={styles.metaChipText}>{item.date}</AppText>
        </View>
        <View style={styles.metaChip}>
          <ClockIcon width={12} height={12} />
          <AppText style={styles.metaChipText}>{item.time}</AppText>
        </View>
        <View style={styles.cardStatusPush}>
          <StatusBadge status={item.status} />
        </View>
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardBottomRow}>
        <AppText style={styles.cardLowestLabel}>
          Lowest bid : <AppText style={styles.cardLowestValue}>{item.lowestBid}</AppText>
        </AppText>
        <AppText style={styles.cardRank}>{item.rank || '-'}</AppText>
      </View>
    </TouchableOpacity>
  );
}
