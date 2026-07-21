import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import styles from '../BiddingScreen.styles';
import ModeChip from './ModeChip';
import StopList from './StopList';
import AppText from '../../../theme/AppText';
import {select} from '../../../theme/device';
import CalendarIcon from '../../../assets/svg_icon/Schedule.svg';

const CHIP_ICON = select({phone: 12, tablet: 15});

export default function GridCard({item}) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('ActiveBidding', {item})}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardRouteWrap}>
          {/* every stop on the load, same treatment as the table's Load column */}
          <StopList stops={item.stops} textStyle={styles.cardStopCity} />
        </View>
        <AppText style={styles.cardAmount}>{item.amount}</AppText>
      </View>

      {/* pinned to the bottom of the card so the divider sits on the same line
          as the neighbouring card's, whatever each one's stop count is */}
      <View style={styles.cardFooter}>
        <View style={styles.cardChipsRow}>
          <ModeChip
            mode={item.mode}
            style={styles.cardChip}
            textStyle={styles.cardChipText}
            iconSize={CHIP_ICON}
          />
          <View style={[styles.metaChip, styles.cardChip]}>
            <CalendarIcon width={CHIP_ICON} height={CHIP_ICON} />
            <AppText style={styles.cardChipMuted} numberOfLines={1}>
              {item.date}
            </AppText>
          </View>
          <View style={[styles.pillSoft, styles.cardChip]}>
            <AppText style={styles.cardChipSoft} numberOfLines={1}>
              {item.auctionType}
            </AppText>
          </View>
          <AppText style={[styles.cardDistance, styles.cardChip]} numberOfLines={1}>
            {item.tripDistance}
          </AppText>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardBottomRow}>
          <AppText style={styles.cardTimeLabel} >
            Pickup Time : {item.pickupClock}
          </AppText>
          <AppText style={styles.cardTimeLabel}>
            Drop Time : {item.dropClock}
          </AppText>
        </View>
      </View>
    </TouchableOpacity>
  );
}
