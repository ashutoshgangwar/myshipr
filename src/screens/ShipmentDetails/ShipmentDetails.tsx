import React, {useMemo, useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import styles from './ShipmentDetails.styles';
import {ms} from './constants';
import StatusBar from '../../component/StatusBar/StatusBar';
import RouteStops from '../../component/RouteStops/RouteStops';
import RouteMapThumb from '../ActiveBidding/components/RouteMapThumb';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import BackArrow from '../../assets/svg_icon/Back_arrow_map.svg';
import BlueTruckIcon from '../../assets/svg_icon/Truck_Frame.svg';
import CalendarIcon from '../../assets/svg_icon/Schedule.svg';
import TimeIcon from '../../assets/svg_icon/Time_Icon.svg';
import CallIcon from '../../assets/svg_icon/call_icon.svg';
import {IS_TABLET} from '../../theme/device';
import {
  NOT_IN_API,
  toShipmentDetail,
  useShipmentDetail,
} from '../../services/shipmentDetail';
import type {RootStackScreenProps} from '../../types/navigation';
import type {DetailRow} from '../../types/common';

// One size for the chip icons so they scale together, as on ActiveBidding.
// Stepped down with the chip text/padding so the glyph doesn't outgrow its pill.
const CHIP_ICON = IS_TABLET ? ms(12) : ms(15);
// The handset sits on the phone number's baseline, so it stays a notch smaller.
const PHONE_ICON = IS_TABLET ? ms(12) : ms(15);

const DetailGrid = ({cells}: {cells: DetailRow[]}) => {
  const lastRow = Math.floor((cells.length - 1) / 2);

  return (
    <View style={styles.grid}>
      {cells.map((cell: DetailRow, i: number) => (
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
              // A slot the endpoint does not fill is greyed rather than shown
              // in the same weight as a real figure — the driver should be
              // able to tell the two apart at a glance.
              cell.value === NOT_IN_API && styles.gridValueMissing,
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

export default function ShipmentDetails({navigation, route}: RootStackScreenProps<'Shipmentdetails'>) {
  // The row the driver tapped carries only the id; the page is the response to
  // `GET /drivers/shipments/{shipmentId}/detail`.
  const shipmentId = route?.params?.shipmentId;
  const {detail, loading, error} = useShipmentDetail(shipmentId);

  // Mapped even while the call is out: `toShipmentDetail(null)` hands back the
  // same shape filled with placeholders, so the sheet keeps its layout instead
  // of collapsing and jumping when the payload lands.
  const data = useMemo(() => toShipmentDetail(detail), [detail]);

  // Dragging the route map must pan the map, not scroll the page.
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const goBack = () => (navigation ? navigation.goBack() : null);

  const callContact = (phone: string | null | undefined) => {
    const dialled = String(phone ?? '').replace(/[^\d+]/g, '');
    if (!dialled) return;
    Linking.openURL(`tel:${dialled}`).catch(() => {});
  };

  // The thumbnail draws a single leg, so it frames the first pickup → the drop;
  // any middle pickups still show in the stop list beside it.
  const firstPickup = data.stops.find(s => s.kind === 'pickup');
  const finalDrop = [...data.stops].reverse().find(s => s.kind === 'drop');

  // This endpoint sends addresses, not coordinates. Without a pair to place
  // the leg on, the thumbnail would sit spinning forever — which reads as a
  // broken map rather than as data the backend has not sent — so the box says
  // so instead. If lat/lon ever arrive, the real map comes back on its own.
  const hasMapCoords =
    Number.isFinite(firstPickup?.lat) &&
    Number.isFinite(firstPickup?.lng) &&
    Number.isFinite(finalDrop?.lat) &&
    Number.isFinite(finalDrop?.lng);

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
          <BackArrow width={IS_TABLET ? 24 : 18} height={IS_TABLET ? 24 : 18} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator size="large" color={colors.accentBlue} />
        </View>
      ) : error ? (
        <View style={styles.stateBox}>
          <AppText style={styles.stateText}>{error}</AppText>
        </View>
      ) : (
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
            <View
              style={[
                styles.statusBadge,
                data.status === NOT_IN_API && styles.statusBadgeMissing,
              ]}>
              <AppText
                style={[
                  styles.statusBadgeText,
                  data.status === NOT_IN_API && styles.statusBadgeTextMissing,
                ]}>
                {data.status}
              </AppText>
            </View>
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
            {hasMapCoords ? (
              <RouteMapThumb
                pickup={firstPickup}
                drop={finalDrop}
                style={styles.mapThumb}
                onInteractStart={() => setScrollEnabled(false)}
                onInteractEnd={() => setScrollEnabled(true)}
              />
            ) : (
              <View style={[styles.mapThumb, styles.mapMissing]}>
                <AppText style={styles.mapMissingText}>
                  Map coordinates{'\n'}
                  {NOT_IN_API}
                </AppText>
              </View>
            )}
          </View>

          {/* PICKUP / DROP CONTACTS */}
          <View style={styles.contactsRow}>
            {data.contacts.map(contact => (
              <View key={contact.id} style={styles.contactCard}>
                <AppText style={styles.contactKicker}>{contact.kicker}</AppText>
                <AppText style={styles.contactName}>{contact.name}</AppText>
                <AppText
                  style={[
                    styles.contactRole,
                    contact.role === NOT_IN_API && styles.textMissing,
                  ]}>
                  {contact.role}
                </AppText>

                <TouchableOpacity
                  style={styles.phoneRow}
                  activeOpacity={0.7}
                  disabled={contact.phone === NOT_IN_API}
                  onPress={() => callContact(contact.phone)}>
                  <CallIcon width={PHONE_ICON} height={PHONE_ICON} />
                  <AppText style={styles.phoneText}>{contact.phone}</AppText>
                </TouchableOpacity>

                <AppText
                  style={[
                    styles.contactAccess,
                    contact.access === NOT_IN_API && styles.textMissing,
                  ]}>
                  {contact.access}
                </AppText>

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
          <AppText style={styles.sectionLabel}>
            Trailer and Loading Terms
          </AppText>
          <DetailGrid cells={data.terms} />

          {/* THE LOAD ITSELF */}
          <AppText style={styles.sectionLabel}>Shipment Details</AppText>
          <DetailGrid cells={data.load} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
