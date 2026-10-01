import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {View, FlatList, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';

import styles from './ShipmentScreen.styles';
import StatusBar from '../../component/StatusBar/StatusBar';
import DashboardHeader from '../../component/DashboardHeader/DashboardHeader';
import LoadRoute from '../../component/LoadRoute/LoadRoute';
import CalendarModal from '../../component/CalendarModal/CalendarModal';
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
import type {MainTabScreenProps} from '../../types/navigation';

/** One day of the date strip. */
interface WeekDay {
  iso: string;
  day: string;
  date: number;
}

// Sunday-first, matching Date#getDay. "Thur" rather than "Thu" is what the
// strip already read.
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat'];

// Days the strip offers. Seven pills is what the row fits across a phone.
const WEEK_LENGTH = 7;

const pad = (n: number): string => String(n).padStart(2, '0');

/** A Date → the "YYYY-MM-DD" the API filters on, in the device's own zone. */
const toIso = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

/**
 * The date strip: today first, then the six days after it.
 *
 * Built by day-of-month arithmetic on a local Date, so a week that runs over
 * the end of a month (or a year) rolls over with it. Nothing before today is
 * offered — the tab lists what is still to come.
 *
 * @param from today
 */
const buildWeek = (from: Date): WeekDay[] =>
  Array.from({length: WEEK_LENGTH}, (_, index) => {
    const day = new Date(
      from.getFullYear(),
      from.getMonth(),
      from.getDate() + index,
    );
    return {iso: toIso(day), day: DAY_LABELS[day.getDay()], date: day.getDate()};
  });

/** "Aug 2026", or "Aug – Sep 2026" for a week that straddles two months. */
const weekLabel = (week: WeekDay[]): string => {
  if (!week.length) return '';
  const month = (iso: string): string => MONTHS_SHORT[Number(iso.slice(5, 7)) - 1];
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

const ROW_BONES = shipmentRowBones(6);

export default function ShipmentScreen({navigation}: MainTabScreenProps<'ShipmentTab'>) {
  const [today, setToday] = useState(() => toIso(new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [tab, setTab] = useState('upcoming');
  const [weekStart, setWeekStart] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>(
    {},
  );
  const week = useMemo(() => {
    const [year, month, day] = (weekStart ?? today).split('-').map(Number);
    return buildWeek(new Date(year, month - 1, day));
  }, [today, weekStart]);

  const upcomingDate = selectedDate || today;

  const {
    shipments: upcoming,
    loadedDate: upcomingLoadedDate,
    loading: upcomingLoading,
    error: upcomingError,
  } = useUpcomingShipments(upcomingDate);
  const upcomingRows = useMemo(() => toShipmentRows(upcoming), [upcoming]);

  useEffect(() => {
    if (upcomingLoading) return;
    console.log(
      '[GET /api/v1/drivers/shipments/upcoming]',
      JSON.stringify(
        {
          date: upcomingDate,
          loadedDate: upcomingLoadedDate,
          error: upcomingError,
          count: Array.isArray(upcoming) ? upcoming.length : 0,
          shipments: upcoming,
        },
        null,
        2,
      ),
    );
  }, [upcoming, upcomingDate, upcomingLoadedDate, upcomingLoading, upcomingError]);

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
      const same =
        next.size === prev.size && [...next].every(day => prev.has(day));
      return same ? prev : next;
    });
  }, [upcoming, upcomingLoadedDate, upcomingLoading]);

  const toggleRow = (id: string) =>
    setExpandedRows(prev => ({...prev, [id]: !prev[id]}));

  useFocusEffect(
    useCallback(() => {
      const now = toIso(new Date());
      setToday(current => (current === now ? current : now));
      setSelectedDate(current => (current && current < now ? null : current));
      setWeekStart(current => (current && current < now ? null : current));
    }, []),
  );

  const pickDate = (iso: string) => {
    if (selectedDate === iso) {
      setSelectedDate(null);
      setWeekStart(null);
    } else {
      setSelectedDate(iso);
    }
  };

  const pickCalendarDate = (iso: string) => {
    setCalendarOpen(false);
    setSelectedDate(iso);
    setTab('upcoming');
    if (!week.some(day => day.iso === iso)) setWeekStart(iso === today ? null : iso);
  };

  const staleFilter =
    loadedDate !== undefined &&
    loadedDate !== (isUpcoming ? upcomingDate : null);
  const pending = loading && (!shipments.length || staleFilter);
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
          icon={
            <TouchableOpacity
              activeOpacity={0.8}
              hitSlop={8}
              onPress={() => setCalendarOpen(true)}>
              <ScheduleIcon
                width={IS_TABLET ? 28 : 16}
                height={IS_TABLET ? 28 : 16}
                color={colors.primary}
              />
            </TouchableOpacity>
          }
          title="SHIPMENT"
          subtitle={weekLabel(week)}
          right={
            <TouchableOpacity
              style={styles.headerCalendarBtn}
              activeOpacity={0.8}
              onPress={() => setCalendarOpen(true)}>
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
                style={[
                  styles.tableHeadText,
                  styles[`col${index}` as keyof typeof styles],
                ]}>
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
                // Only UPCOMING rows open the details screen; a PAST row is
                // inert, so the tap gives no feedback and goes nowhere.
                disabled={!isUpcoming}
                activeOpacity={isUpcoming ? 0.7 : 1}
                onPress={
                  isUpcoming
                    ? () =>
                        navigation?.navigate('Shipmentdetails', {
                          shipmentId: String(item.shipmentId),
                          pickupCoord: item.route.pickup,
                          dropCoord: item.route.drop,
                        })
                    : undefined
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

      <CalendarModal
        visible={calendarOpen}
        selected={upcomingDate}
        minDate={today}
        onSelect={pickCalendarDate}
        onClose={() => setCalendarOpen(false)}
      />
    </SafeAreaView>
  );
}
