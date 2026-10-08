import React, {useMemo, useState} from 'react';
import {View, ScrollView, TouchableOpacity, Linking} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import styles from './ShipmentDetails.styles';
import {ms} from './constants';
import StatusBar from '../../../component/StatusBar/StatusBar';
import Skeleton from '../../../component/Skeleton/Skeleton';
import {SHIPMENT_DETAIL_BONES} from '../../../component/Skeleton/Skeleton.layouts';
import RouteStops from '../../../component/RouteStops/RouteStops';
import RouteMapThumb from '../ActiveBidding/components/RouteMapThumb';
import AppText from '../../../theme/AppText';
import {colors} from '../../../theme/colors';
import BackArrow from '../../../assets/svg_icon/Back_arrow_map.svg';
import BlueTruckIcon from '../../../assets/svg_icon/Truck_Frame.svg';
import CalendarIcon from '../../../assets/svg_icon/Schedule.svg';
import TimeIcon from '../../../assets/svg_icon/Time_Icon.svg';
import CallIcon from '../../../assets/svg_icon/call_icon.svg';
import {IS_TABLET} from '../../../theme/device';
import {
  NOT_IN_API,
  toShipmentDetail,
  useShipmentDetail,
} from '../../../services/shipmentDetail';
import type {RootStackScreenProps} from '../../../types/navigation';
import type {DetailRow, LatLng, Nullable} from '../../../types/common';
import type {DetailStop} from '../../../types/shipment';

// One size for the chip icons so they scale together, as on ActiveBidding.
// Stepped down with the chip text/padding so the glyph doesn't outgrow its pill.
const CHIP_ICON = IS_TABLET ? ms(12) : ms(15);
// The handset sits on the phone number's baseline, so it stays a notch smaller.
const PHONE_ICON = IS_TABLET ? ms(12) : ms(15);

// The copy the map wears when the load carries no point to draw.
const NO_COORDS = 'No lat/long available';

/** A route stop's coordinate, or null when the payload carried no number. */
const stopPoint = (stop: DetailStop | undefined): Nullable<LatLng> =>
  stop && Number.isFinite(stop.lat) && Number.isFinite(stop.lng)
    ? {lat: stop.lat, lng: stop.lng}
    : null;

/**
 * A label/value grid, `columns` wide. Trailer Terms wants 2 (the default);
 * Shipment Details and Reefer Details want 3, as the design draws them.
 */
const DetailGrid = ({
  cells,
  columns = 2,
}: {
  cells: DetailRow[];
  columns?: number;
}) => {
  const lastRow = Math.floor((cells.length - 1) / columns);

  return (
    <View style={styles.grid}>
      {cells.map((cell: DetailRow, i: number) => (
        <View
          key={cell.label}
          style={[
            styles.gridCell,
            {width: `${100 / columns}%`},
            (i + 1) % columns !== 0 && styles.gridCellRightBorder,
            Math.floor(i / columns) !== lastRow && styles.gridCellBottomBorder,
          ]}>
          <AppText style={styles.gridLabel}>{cell.label}</AppText>
          <AppText
            style={[
              styles.gridValue,
              cell.tone === 'success' && styles.gridValueSuccess,
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

  // A section of nothing but placeholders tells the driver less than no
  // section at all — hidden until the payload actually carries one of these.
  const hasReefer = data.reefer.some(cell => cell.value !== NOT_IN_API);

  const goBack = () => (navigation ? navigation.goBack() : null);

  const callContact = (phone: string | null | undefined) => {
    const dialled = String(phone ?? '').replace(/[^\d+]/g, '');
    if (!dialled) return;
    Linking.openURL(`tel:${dialled}`).catch(() => {});
  };

  // The thumbnail draws a single leg, so it frames the first pickup → the drop;
  // any middle pickups still show in the stop list beside it.
  //
  // `…/detail` sends addresses, not coordinates, so its own stops rarely
  // place the leg. The row the driver tapped came off
  // `GET /drivers/shipments/upcoming`, which does send `lat`/`lon` on the
  // stops it could geocode, and it handed the leg's two ends over as params —
  // so the detail payload is preferred where it has a point and the tapped
  // row's coordinates stand in where it does not.
  //
  // Either end can still come back empty: the list sends `lat: null` for a
  // stop it could not geocode. That is data the backend has not sent rather
  // than a broken screen, so the map is mounted either way and says so over
  // itself.
  const pickupPoint = useMemo(
    () =>
      stopPoint(data.stops.find(s => s.kind === 'pickup')) ??
      route?.params?.pickupCoord ??
      null,
    [data.stops, route?.params?.pickupCoord],
  );
  const dropPoint = useMemo(
    () =>
      stopPoint([...data.stops].reverse().find(s => s.kind === 'drop')) ??
      route?.params?.dropCoord ??
      null,
    [data.stops, route?.params?.dropCoord],
  );

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
        // The sheet is one call's answer, so it waits as one. A spinner in
        // the middle of an empty white page said only that something was
        // happening; bones say what is coming and where — the chips, the
        // route beside its map, the two contacts, the two grids — in the
        // sheet's own padding, so nothing moves when the payload lands.
        <View style={[styles.scroll, styles.scrollContent]}>
          <Skeleton isLoading layout={SHIPMENT_DETAIL_BONES} />
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
            {/* <View
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
            </View> */}

            <View style={styles.winningBidBox}>
              <AppText
                style={[
                  styles.winningBidValue,
                  data.winningBid === NOT_IN_API &&
                    styles.winningBidValueMissing,
                ]}>
                {data.winningBid}
              </AppText>
              <AppText style={styles.winningBidLabel}>Your winning bid</AppText>
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
              // A full street address — "Okhla Industrial Area Phase 1, New
              // Delhi, Delhi 110020" — does not fit the column on one line, and
              // this sheet has the room to give it a second rather than cutting
              // it off mid-word.
              nameLines={2}
              style={styles.routeStopsCol}
            />
            <RouteMapThumb
              pickup={pickupPoint}
              drop={dropPoint}
              notice={NO_COORDS}
              style={styles.mapThumb}
              onInteractStart={() => setScrollEnabled(false)}
              onInteractEnd={() => setScrollEnabled(true)}
            />
          </View>

          {/* PICKUP / DROP CONTACTS */}
          <View style={styles.contactsRow}>
            {data.contacts.map(contact => {
              const isDrop = contact.id === 'drop';
              return (
                <View
                  key={contact.id}
                  style={[
                    styles.contactCard,
                    isDrop && styles.contactCardDrop,
                  ]}>
                  <View style={styles.contactTextCol}>
                    {/* The kicker is the card's only headline in this layout
                        — the design shows no separate contact-name line. */}
                    <AppText
                      style={[
                        styles.contactKicker,
                        isDrop && styles.contactKickerDrop,
                      ]}
                      numberOfLines={1}>
                      {contact.kicker}
                    </AppText>
                    {/* <AppText style={styles.contactName}>{contact.name}</AppText> */}
                    {/* <AppText
                      style={[
                        styles.contactRole,
                        contact.role === NOT_IN_API && styles.textMissing,
                      ]}>
                      {contact.role}
                    </AppText> */}

                    <AppText
                      style={[
                        styles.contactAccess,
                        isDrop && styles.contactAccessDrop,
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

                  <TouchableOpacity
                    style={styles.phoneBtn}
                    activeOpacity={0.7}
                    disabled={contact.phone === NOT_IN_API}
                    onPress={() => callContact(contact.phone)}>
                    <CallIcon width={PHONE_ICON} height={PHONE_ICON} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* TRAILER TERMS — neither cell exists on the payload yet, so both
              read NOT_IN_API until the backend adds them. */}
          <AppText style={styles.sectionLabel}>Trailer Terms</AppText>
          <DetailGrid cells={data.terms} />

          {/* THE LOAD ITSELF */}
          <AppText style={styles.sectionLabel}>Shipment Details</AppText>
          <DetailGrid cells={data.load} columns={3} />

          {/* REEFER DETAILS — hidden rather than shown as three placeholders
              when the payload carries none of them. */}
          {hasReefer ? (
            <>
              <AppText style={styles.sectionLabel}>Reefer Details</AppText>
              <DetailGrid cells={data.reefer} columns={3} />
            </>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
