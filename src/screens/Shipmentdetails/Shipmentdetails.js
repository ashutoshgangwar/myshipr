import React, {useState} from 'react';
import {View, ScrollView, TouchableOpacity, Linking} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import styles from './ShipmentDetails.styles';
import {SHIPMENT, ms} from './constants';
import StatusBar from '../../component/StatusBar/StatusBar';
import RouteStops from '../../component/RouteStops/RouteStops';
import RouteMapThumb from '../ActiveBidding/components/RouteMapThumb';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import BackArrow from '../../assets/svg_icon/Back_arrow_map.svg';
import Bank_Icon from '../../assets/svg_icon/Bank_Icon.svg'
import BlueTruckIcon from '../../assets/svg_icon/Truck_Frame.svg';
import CalendarIcon from '../../assets/svg_icon/Schedule.svg';
import TimeIcon from '../../assets/svg_icon/Time_Icon.svg';
import CallIcon from '../../assets/svg_icon/call_icon.svg';
import { IS_TABLET } from '../../theme/device';

// One size for the chip icons so they scale together, as on ActiveBidding.
// Stepped down with the chip text/padding so the glyph doesn't outgrow its pill.
const CHIP_ICON = IS_TABLET ? ms(12) : ms(15);
// The handset sits on the phone number's baseline, so it stays a notch smaller.
const PHONE_ICON = IS_TABLET ? ms(12) : ms(15);

const DetailGrid = ({cells}) => {
  const lastRow = Math.floor((cells.length - 1) / 2);

  return (
    <View style={styles.grid}>
      {cells.map((cell, i) => (
        <View
          key={cell.label}
          style={[
            styles.gridCell,
            i % 2 === 0 && styles.gridCellRightBorder,
            Math.floor(i / 2) !== lastRow && styles.gridCellBottomBorder,
          ]}>
          <AppText style={styles.gridLabel}>{cell.label}</AppText>
          <AppText
            style={[
              styles.gridValue,
              cell.tone === 'success' && styles.gridValueSuccess,
            ]}>
            {cell.value}
          </AppText>
          {cell.sub ? (
            <AppText style={styles.gridSub}>{cell.sub}</AppText>
          ) : null}
        </View>
      ))}
    </View>
  );
};

export default function ShipmentDetails({navigation, route}) {
  // The load comes from the shipment row the user tapped; fall back to the sample.
  const data = route?.params?.shipment || SHIPMENT;

  // Dragging the route map must pan the map, not scroll the page.
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const goBack = () => (navigation ? navigation.goBack() : null);

  const callContact = phone =>
    Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`).catch(() => {});

  // The thumbnail draws a single leg, so it frames the first pickup → the drop;
  // any middle pickups still show in the stop list beside it.
  const firstPickup = data.stops.find(s => s.kind === 'pickup');
  const finalDrop = [...data.stops].reverse().find(s => s.kind === 'drop');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar
        backgroundColor={colors.primary}
        barStyle="light-content"
        translucent={false}
      />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.8}
          onPress={goBack}>
          <BackArrow width={ IS_TABLET ? 24 : 18} height={ IS_TABLET ? 24 : 18} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={scrollEnabled}
        showsVerticalScrollIndicator={false}>
        {/* MODE / SCHEDULE CHIPS + LIVE STATUS */}
        <View style={styles.topRow}>
          <View style={styles.chipsLeft}>
            <View style={styles.modePill}>
              <BlueTruckIcon width={CHIP_ICON} height={CHIP_ICON} />
              <AppText style={styles.modePillText}>{data.mode}</AppText>
            </View>
            <View style={styles.metaChip}>
              <CalendarIcon width={CHIP_ICON} height={CHIP_ICON} />
              <AppText style={styles.metaChipText}>{data.date}</AppText>
            </View>
            <View style={styles.metaChip}>
              <TimeIcon width={CHIP_ICON} height={CHIP_ICON} />
              <AppText style={styles.metaChipText}>{data.time}</AppText>
            </View>
          </View>
          {data.status ? (
            <View style={styles.statusBadge}>
              <AppText style={styles.statusBadgeText}>{data.status}</AppText>
            </View>
          ) : null}
        </View>

        <AppText style={styles.routeTitle}>
          {data.origin} <AppText style={styles.routeArrow}>→</AppText>{' '}
          {data.dest}
        </AppText>

        {/* ROUTE + MAP */}
        <View style={styles.routeBlock}>
          <RouteStops
            stops={data.stops}
            showSummary
            style={styles.routeStopsCol}
          />
          <RouteMapThumb
            pickup={firstPickup}
            drop={finalDrop}
            style={styles.mapThumb}
            onInteractStart={() => setScrollEnabled(false)}
            onInteractEnd={() => setScrollEnabled(true)}
          />
        </View>

        {/* PICKUP / DROP CONTACTS */}
        <View style={styles.contactsRow}>
          {data.contacts.map(contact => (
            <View key={contact.id} style={styles.contactCard}>
              <AppText style={styles.contactKicker}>{contact.kicker}</AppText>
              <AppText style={styles.contactName}>{contact.name}</AppText>
              <AppText style={styles.contactRole}>{contact.role}</AppText>

              <TouchableOpacity
                style={styles.phoneRow}
                activeOpacity={0.7}
                onPress={() => callContact(contact.phone)}>
                <CallIcon width={PHONE_ICON} height={PHONE_ICON} />
                <AppText style={styles.phoneText}>{contact.phone}</AppText>
              </TouchableOpacity>

              <AppText style={styles.contactAccess}>{contact.access}</AppText>

              {contact.remarks ? (
                <>
                  <AppText style={styles.remarksLabel}>Remarks:</AppText>
                  <AppText style={styles.remarksText}>
                    {contact.remarks}
                  </AppText>
                </>
              ) : null}
            </View>
          ))}
        </View>

        {/* TRAILER AND LOADING TERMS */}
        <AppText style={styles.sectionLabel}>Trailer and Loading Terms</AppText>
        <DetailGrid cells={data.terms} />

        {/* BILL OF LADING */}
        <AppText style={styles.sectionLabel}>Bill of Lading Details</AppText>
        <DetailGrid cells={data.bol} />
      </ScrollView>
    </SafeAreaView>
  );
}
