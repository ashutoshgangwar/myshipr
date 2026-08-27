import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {View, FlatList, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';

import styles from './ShipmentScreen.styles';
import StatusBar from '../../component/StatusBar/StatusBar';
import DashboardHeader from '../../component/DashboardHeader/DashboardHeader';
import LoadRoute from '../../component/LoadRoute/LoadRoute';
import Skeleton from '../../component/Skeleton/Skeleton';
import {shipmentRowBones} from '../../component/Skeleton/Skeleton.layouts';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import {ms} from '../../theme/scale';
import ScheduleIcon from '../../assets/svg_icon/Schedule.svg';
import GrayTruck from '../../assets/svg_icon/gray_truck.svg';
import {IS_TABLET} from '../../theme/device';
import {
  formatLoadDate,
  shipmentDate,
  toShipmentRows,
  usePastShipments,
  useUpcomingShipments,
} from '../../services/upcomingShipments';
import {MONTHS_SHORT} from '../../utils/format';

// Sunday-first, matching Date#getDay. "Thur" rather than "Thu" is what the
// strip already read.
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];

// Days the strip offers. Seven pills is what the row fits across a phone.
const WEEK_LENGTH = 7;

const pad = n => String(n).padStart(2, '0');

/** A Date → the "YYYY-MM-DD" the API filters on, in the device's own zone. */
const toIso = date =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/**
 * The date strip: today first, then the six days after it.
 *
 * Built by day-of-month arithmetic on a local Date, so a week that runs over
 * the end of a month (or a year) rolls over with it. Nothing before today is
 * offered — the tab lists what is still to come.
 *
 * @param {Date} from today
 */
const buildWeek = from =>
  Array.from({length: WEEK_LENGTH}, (_, index) => {
    const day = new Date(
      from.getFullYear(),
      from.getMonth(),
      from.getDate() + index,
    );
    return {iso: toIso(day), day: DAY_LABELS[day.getDay()], date: day.getDate()};
  });

/** "Aug 2026", or "Aug – Sep 2026" for a week that straddles two months. */
const weekLabel = week => {
  if (!week.length) return '';
  const month = iso => MONTHS_SHORT[Number(iso.slice(5, 7)) - 1];
  const first = week[0].iso;
  const last = week[week.length - 1].iso;
  const months =
    month(first) === month(last)
      ? month(first)
      : `${month(first)} – ${month(last)}`;
  return `${months} ${last.slice(0, 4)}`;
};

const TABS = [
  {key: 'upcoming', label: 'UPCOMING'},
  {key: 'past', label: 'PAST'},
];

const COLUMNS = ['AWB Number', 'Route', 'Payout', 'Pickup Time'];

// Placeholder rows shown while a tab's call is in flight. Fixed content, so
// built once rather than on every render.
const ROW_BONES = shipmentRowBones(6);

export default function ShipmentScreen({navigation}) {
  // The strip is anchored to whatever "today" is. Stamped once here, then
  // re-checked on focus: this is a bottom tab that can sit mounted for days,
  // and a strip still starting on yesterday would file loads under the wrong
  // day. Storing the ISO string, not the Date, keeps the comparison cheap.
  const [today, setToday] = useState(() => toIso(new Date()));
  // The day the UPCOMING table is filtered to, or null for "no day picked",
  // which falls back to today rather than to an unfiltered call — the tab
  // lists what is still to come, and today is where that starts.
  const [selectedDate, setSelectedDate] = useState(null);
  const [tab, setTab] = useState('upcoming');
  // Tapping a row (or its "+N More …" chip) reveals every pickup and drop.
  const [expandedRows, setExpandedRows] = useState({});

  // Rebuilt from the ISO parts rather than `new Date(today)`: a bare
  // "2026-08-24" parses as UTC midnight, which is the day before for a driver
  // west of Greenwich — the same trap `formatLoadDate` documents.
  const week = useMemo(() => {
    const [year, month, day] = today.split('-').map(Number);
    return buildWeek(new Date(year, month - 1, day));
  }, [today]);

  // The day the UPCOMING call asks for. Always sent — a day picked off the
  // strip, or today when none is — so the backend never has to guess the
  // window and yesterday's loads can never come back under this tab.
  const upcomingDate = selectedDate || today;

  // The same call the Home card makes, filtered to `upcomingDate`; changing
  // the day refetches.
  const {
    shipments: upcoming,
    loadedDate: upcomingLoadedDate,
    loading: upcomingLoading,
    error: upcomingError,
  } = useUpcomingShipments(upcomingDate);
  const upcomingRows = useMemo(() => toShipmentRows(upcoming), [upcoming]);

  // PAST is its own endpoint, `GET /drivers/shipments/past`. It is asked
  // unfiltered: the strip only offers today and the six days after it, so
  // narrowing completed loads by one of those days would answer empty every
  // time. The tab lists the whole window the backend considers past.
  const {
    shipments: past,
    loadedDate: pastLoadedDate,
    loading: pastLoading,
    error: pastError,
  } = usePastShipments();
  const pastRows = useMemo(() => toShipmentRows(past), [past]);

  const isUpcoming = tab === 'upcoming';
  const shipments = isUpcoming ? upcomingRows : pastRows;
  const loading = isUpcoming ? upcomingLoading : pastLoading;
  const error = isUpcoming ? upcomingError : pastError;
  const loadedDate = isUpcoming ? upcomingLoadedDate : pastLoadedDate;

  // Days to mark with a dot on the strip. Every upcoming response now covers
  // one day, so each answer is the truth about that day alone: it lights the
  // dot when loads came back and puts it out when they did not. Days the
  // driver has not looked at yet keep whatever mark they already had, so the
  // strip fills in as they browse instead of collapsing to a single dot.
  const [pickupDates, setPickupDates] = useState(() => new Set());
  useEffect(() => {
    if (upcomingLoading || upcomingLoadedDate === undefined) return;
    const days = new Set(upcoming.map(shipmentDate).filter(Boolean));
    setPickupDates(prev => {
      const next = new Set(prev);
      days.forEach(day => next.add(day));
      if (upcomingLoadedDate && !days.has(upcomingLoadedDate)) {
        next.delete(upcomingLoadedDate);
      }
      // Same membership as before: hand back the old Set so the strip's rows
      // are not re-rendered for a response that changed nothing.
      const same =
        next.size === prev.size && [...next].every(day => prev.has(day));
      return same ? prev : next;
    });
  }, [upcoming, upcomingLoadedDate, upcomingLoading]);

  const toggleRow = id => setExpandedRows(prev => ({...prev, [id]: !prev[id]}));

  // Midnight passed while the tab was in the background: rebuild the strip
  // from the new today, and drop a filter that now points at a past day.
  useFocusEffect(
    useCallback(() => {
      const now = toIso(new Date());
      setToday(current => (current === now ? current : now));
      setSelectedDate(current => (current && current < now ? null : current));
    }, []),
  );

  // Tapping the selected day again clears the pick, which falls the table
  // back to today.
  const pickDate = iso =>
    setSelectedDate(current => (current === iso ? null : iso));

  // Rows on screen belong to a different day than the one now selected, so
  // they are about to be replaced wholesale rather than refreshed in place.
  const staleFilter =
    loadedDate !== undefined &&
    loadedDate !== (isUpcoming ? upcomingDate : null);

  // A plain refresh leaves the rows up and updates them in place; a first
  // load, or a change of day, shows bones instead of yesterday's loads under
  // today's heading.
  const pending = loading && (!shipments.length || staleFilter);

  // A day that came back empty says so by name — "nothing to show" over a
  // strip with a day lit up reads as a broken screen rather than a free day.
  const emptyText = isUpcoming
    ? `No shipments on ${formatLoadDate(upcomingDate)}`
    : 'No past shipments to show';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar
        backgroundColor={colors.primary}
        barStyle="light-content"
        translucent={false}
      />

      <View style={styles.page}>
        {/* HEADER */}
        <DashboardHeader
          icon={<ScheduleIcon  width={IS_TABLET ? 28 : 16}
                        height={IS_TABLET ? 28 : 16}
                         color={colors.primary} />}
          title="SHIPMENT"
          subtitle={weekLabel(week)}
          right={
            <TouchableOpacity
              style={styles.headerCalendarBtn}
              activeOpacity={0.8}>
              <ScheduleIcon
                width={IS_TABLET ? ms(25) : ms(20)}
                height={IS_TABLET ? ms(25) : ms(20)}
                color={colors.white}
              />
            </TouchableOpacity>
          }
          headerStyle={styles.headerPad}>
          {/* WEEK STRIP — today first, then the six days after it. Tapping a
              day filters the table to it; tapping it again clears back to the
              whole upcoming window. */}
          <View style={styles.weekRow}>
            {week.map(day => {
              // Lit for the day the table is actually showing, which is today
              // until the driver picks another. On PAST the strip filters
              // nothing, so only an explicit pick lights up there.
              const active =
                day.iso === (isUpcoming ? upcomingDate : selectedDate);
              return (
                <TouchableOpacity
                  key={day.iso}
                  activeOpacity={0.8}
                  style={[styles.dayPill, active && styles.dayPillActive]}
                  onPress={() => pickDate(day.iso)}>
                  <AppText
                    style={[styles.dayLabel, active && styles.dayLabelActive]}>
                    {day.day}
                  </AppText>
                  <AppText style={styles.dayNumber}>{day.date}</AppText>
                  <View
                    style={
                      pickupDates.has(day.iso)
                        ? styles.dayDot
                        : styles.dayDotPlaceholder
                    }
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </DashboardHeader>

        {/* UPCOMING / PAST */}
        <View style={styles.tabRow}>
          {TABS.map(t => {
            const active = t.key === tab;
            return (
              <TouchableOpacity
                key={t.key}
                activeOpacity={0.85}
                style={[
                  styles.tabBtn,
                  active ? styles.tabBtnActive : styles.tabBtnIdle,
                ]}
                onPress={() => setTab(t.key)}>
                <AppText style={styles.tabBtnText}>{t.label}</AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* SHIPMENTS TABLE */}
        <View style={styles.listCard}>
          <View style={styles.tableHead}>
            {COLUMNS.map((label, index) => (
              <AppText
                key={label}
                numberOfLines={1}
                style={[styles.tableHeadText, styles[`col${index}`]]}>
                {label}
              </AppText>
            ))}
          </View>

          <FlatList
            data={shipments}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              pending ? (
                <Skeleton isLoading layout={ROW_BONES} />
              ) : (
                <View style={styles.listEmpty}>
                  <AppText style={styles.listEmptyText}>
                    {error || emptyText}
                  </AppText>
                </View>
              )
            }
            renderItem={({item, index}) => (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() =>
                  navigation?.navigate('Shipmentdetails', {
                    shipmentId: item.shipmentId,
                  })
                }
                style={[
                  styles.row,
                  index === shipments.length - 1 && styles.rowLast,
                ]}>
                {/* AWB number + load type */}
                <View style={[styles.col0, styles.cellCenter]}>
                  <AppText style={styles.awbText} numberOfLines={1}>
                    {item.awb}
                  </AppText>
                  {item.type ? (
                    <View style={styles.typeBadge}>
                      <GrayTruck
                        width={ms(14)}
                        height={ms(14)}
                        style={styles.typeIcon}
                      />
                      <AppText style={styles.typeText}>{item.type}</AppText>
                    </View>
                  ) : null}
                </View>

                {/* Route */}
                <View style={styles.col1}>
                  <LoadRoute
                    stops={item.stops}
                    typed
                    showSummary
                    stopGap
                    collapsed={!expandedRows[item.id]}
                    onPressMore={() => toggleRow(item.id)}
                  />
                </View>

                {/* Payout + distance */}
                <View style={[styles.col2, styles.cellCenter]}>
                  <AppText style={styles.payoutAmount} numberOfLines={1}>
                    {item.payout}
                  </AppText>
                  <AppText style={styles.payoutMiles} numberOfLines={1}>
                    {item.miles}
                  </AppText>
                </View>

                {/* Pickup time */}
                <View style={[styles.col3, styles.cellCenter]}>
                  <View
                    style={[
                      styles.timePill,
                      item.today ? styles.timePillToday : styles.timePillLater,
                    ]}>
                    <AppText
                      numberOfLines={1}
                      style={[
                        styles.timePillText,
                        item.today
                          ? styles.timePillTextToday
                          : styles.timePillTextLater,
                      ]}>
                      {item.pickupAt}
                    </AppText>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
