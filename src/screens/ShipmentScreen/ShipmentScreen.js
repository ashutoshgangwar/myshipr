import React, {useMemo, useState} from 'react';
import {View, FlatList, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import styles from './ShipmentScreen.styles';
import StatusBar from '../../component/StatusBar/StatusBar';
import DashboardHeader from '../../component/DashboardHeader/DashboardHeader';
import LoadRoute from '../../component/LoadRoute/LoadRoute';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import {ms} from '../../theme/scale';
import ScheduleIcon from '../../assets/svg_icon/Schedule.svg';
import GrayTruck from '../../assets/svg_icon/gray_truck.svg';
import {IS_TABLET} from '../../theme/device';

// Week strip — `dot` marks days that have a scheduled pickup.
const WEEK = [
  {key: 'd8', day: 'Mon', date: 8, dot: true},
  {key: 'd9', day: 'Tue', date: 9, dot: false},
  {key: 'd10', day: 'Wed', date: 10, dot: false},
  {key: 'd11', day: 'Thur', date: 11, dot: false},
  {key: 'd12', day: 'Fri', date: 12, dot: true},
  {key: 'd13', day: 'Sat', date: 13, dot: false},
  {key: 'd14', day: 'Sun', date: 14, dot: false},
];

const TABS = [
  {key: 'upcoming', label: 'UPCOMING'},
  {key: 'past', label: 'PAST'},
];

const COLUMNS = ['AWB Number', 'Route', 'Payout', 'Pickup Time'];

// Stops carry an explicit pickup/drop type so multi-pickup loads collapse their
// middle stops behind a "+N More Pickups" chip until the row is tapped.
const pickup = city => ({city, type: 'pickup'});
const drop = city => ({city, type: 'drop'});

const ROUTE = [
  pickup('Jersey City, NJ'),
  pickup('Newark, NJ'),
  pickup('Trenton, NJ'),
  drop('Baltimore, ND'),
];

const trip = (id, overrides) => ({
  id,
  awb: 'AWB-125',
  type: 'FTL',
  stops: ROUTE,
  payout: '$900',
  miles: '180 Miles',
  pickupAt: '6:00PM JUL 12',
  ...overrides,
});

// `today` flips the pickup pill green — the load leaves within the day.
const SHIPMENTS = {
  upcoming: [
    trip('u1', {pickupAt: '6:00PM TODAY', today: true}),
    trip('u2'),
    trip('u3'),
    trip('u4'),
    trip('u5'),
    trip('u6'),
    trip('u7'),
    trip('u8', {
      type: 'LTL',
      stops: [pickup('San Jose CA'), drop('Newark NJ')],
    }),
  ],
  past: [
    trip('p1', {pickupAt: '6:00PM JUL 04'}),
    trip('p2', {pickupAt: '6:00PM JUL 02'}),
    trip('p3', {
      type: 'LTL',
      stops: [pickup('San Jose CA'), drop('Newark NJ')],
      pickupAt: '6:00PM JUN 28',
    }),
  ],
};

export default function ShipmentScreen() {
  const [selectedKey, setSelectedKey] = useState('d8');
  const [tab, setTab] = useState('upcoming');
  // Tapping a row (or its "+N More …" chip) reveals every pickup and drop.
  const [expandedRows, setExpandedRows] = useState({});

  const shipments = useMemo(() => SHIPMENTS[tab] ?? [], [tab]);

  const toggleRow = id => setExpandedRows(prev => ({...prev, [id]: !prev[id]}));

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
          icon={<ScheduleIcon width={18} height={18} color={colors.primary} />}
          title="SHIPMENT"
          subtitle="Jun 2026 • 3 Bids"
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
          {/* WEEK STRIP */}
          <View style={styles.weekRow}>
            {WEEK.map(d => {
              const active = d.key === selectedKey;
              return (
                <TouchableOpacity
                  key={d.key}
                  activeOpacity={0.8}
                  style={[styles.dayPill, active && styles.dayPillActive]}
                  onPress={() => setSelectedKey(d.key)}>
                  <AppText
                    style={[styles.dayLabel, active && styles.dayLabelActive]}>
                    {d.day}
                  </AppText>
                  <AppText style={styles.dayNumber}>{d.date}</AppText>
                  <View
                    style={d.dot ? styles.dayDot : styles.dayDotPlaceholder}
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
            renderItem={({item, index}) => (
              <View
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
              </View>
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
