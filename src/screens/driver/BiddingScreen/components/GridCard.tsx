import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import styles from '../BiddingScreen.styles';
import AppText from '../../../../theme/AppText';
import {select} from '../../../../theme/device';
import {colors} from '../../../../theme/colors';
import TruckIcon from '../../../../assets/svg_icon/Truck_Frame.svg';
import CommodityIcon from '../../../../assets/svg_icon/Load_DocIcon.svg';
import PickupPin from '../../../../assets/svg_icon/current_location_icon.svg';
import DropPin from '../../../../assets/svg_icon/map-pin-check.svg';
import RouteLine from '../../../../assets/svg_icon/Line_locationsvg.svg';
import CalendarIcon from '../../../../assets/svg_icon/Schedule.svg';
import LockIcon from '../../../../assets/svg_icon/lock.svg';
import type {BidRow} from '../constants';

const HEAD_ICON = select({phone: 18, tablet: 21});
const PIN_ICON = select({phone: 14, tablet: 18});
const COMMODITY_ICON = select({phone: 14, tablet: 16});
const FOOT_ICON = select({phone: 14, tablet: 14});
// The pickup→drop connector reads too thin at PIN_ICON on tablets, so it gets
// its own height that steps up there while phones stay as before.
const ROUTE_LINE_H = select({phone: 10, tablet: 12});

// Everything on the card is the live search row — nothing is sampled. Fields the
// bids API does not carry yet (commodity) fall back to the shared "—", the same
// rule the detail screen's grid follows, so the card never shows a made-up value.
const dash = (value: string | null | undefined): string =>
  value && value !== '—' ? value : '—';

export default function GridCard({item}: {item: BidRow}) {
  const navigation = useNavigation();

  const open = () =>
    navigation.navigate('ActiveBidding', {item, auction: item.auction});

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={open}>
      {/* HEADER — truck badge + shipment ref/mode, with the bid CTA */}
      <View style={styles.cardHead}>
        <View style={styles.cardTruckBadge}>
          <TruckIcon
            width={HEAD_ICON}
            height={HEAD_ICON}
            color={colors.accentBlue}
          />
        </View>
        <View style={styles.cardHeadText}>
          <AppText style={styles.cardRef} numberOfLines={1}>
            {dash(item.ref)}
          </AppText>
          <View style={styles.cardModePill}>
            <AppText style={styles.cardMode} numberOfLines={1}>
              {dash(item.shipmentType)}
            </AppText>
          </View>
        </View>
        <TouchableOpacity
          style={styles.cardBidBtn}
          activeOpacity={0.85}
          onPress={open}>
          <AppText style={styles.cardBidBtnText}>BID NOW</AppText>
        </TouchableOpacity>
      </View>

      {/* Divider between the header and the route */}
      <View style={styles.cardDivider} />

      {/* PICKUP → DROP */}
      <View style={styles.cardRouteRow}>
        <View style={styles.cardRoutePoint}>
          <PickupPin
            width={PIN_ICON}
            height={PIN_ICON}
            color={colors.textStrong}
          />
          <View style={styles.cardRoutePointText}>
            <AppText style={styles.cardRouteLabel}>PICKUP LOCATION</AppText>
            <AppText style={styles.cardRouteCity}>{dash(item.origin)}</AppText>
          </View>
        </View>

        <View style={styles.cardRouteLine}>
          <RouteLine
            width="100%"
            height={ROUTE_LINE_H}
            preserveAspectRatio="none"
          />
        </View>

        <View style={styles.cardRoutePoint}>
          <DropPin width={PIN_ICON} height={PIN_ICON} />
          <View style={styles.cardRoutePointText}>
            <AppText style={styles.cardRouteLabel}>DROP LOCATION</AppText>
            <AppText style={styles.cardRouteCity}>{dash(item.dest)}</AppText>
          </View>
        </View>
      </View>

      {/* FOOTER — pickup time / auction type / equipment type */}
      <View style={styles.cardStatsRow}>
        <View style={styles.cardStat}>
          <View style={styles.cardStatIcon}>
            <CalendarIcon
              width={FOOT_ICON}
              height={FOOT_ICON}
              color={colors.accentBlue}
            />
          </View>
          <AppText style={styles.cardStatValue} numberOfLines={1}>
            {dash(item.pickupClock)}
          </AppText>
          <AppText style={styles.cardStatLabel} numberOfLines={1}>
            {dash(item.date)}
          </AppText>
        </View>

        <View style={styles.cardStatSep} />

        <View style={styles.cardStat}>
          <View style={styles.cardStatIcon}>
            <LockIcon
              width={FOOT_ICON}
              height={FOOT_ICON}
              color={colors.accentBlue}
            />
          </View>
          <AppText style={styles.cardStatValue} numberOfLines={1}>
            {dash(item.auctionType).toUpperCase()}
          </AppText>
          <AppText style={styles.cardStatLabel} numberOfLines={1}>
            AUCTION TYPE
          </AppText>
        </View>

        <View style={styles.cardStatSep} />

        <View style={styles.cardStat}>
          <View style={styles.cardStatIcon}>
            <LockIcon
              width={FOOT_ICON}
              height={FOOT_ICON}
              color={colors.accentBlue}
            />
          </View>
          <AppText style={styles.cardStatValue} numberOfLines={1}>
            {dash(item.equipmentType).toUpperCase()}
          </AppText>
          <AppText style={styles.cardStatLabel} numberOfLines={1}>
            EQUIPMENT TYPE
          </AppText>
        </View>
      </View>
    </TouchableOpacity>
  );
}
