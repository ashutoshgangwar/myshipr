import React, {useMemo, useState} from 'react';
import {View, FlatList, TouchableOpacity, Modal, Pressable} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import styles from './EarningsScreen.styles';
import StatusBar from '../../component/StatusBar/StatusBar';
import DashboardHeader from '../../component/DashboardHeader/DashboardHeader';
import {DASHBOARD_STATS_OVERLAP} from '../../component/DashboardHeader/DashboardHeader.styles';
import LoadRoute from '../../component/LoadRoute/LoadRoute';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import {ms} from '../../theme/scale';
import EarningsIcon from '../../assets/svg_icon/Earning_1.svg';
import DropdownIcon from '../../assets/svg_icon/Dropdown_icon.svg';
import GrayTruck from '../../assets/svg_icon/gray_truck.svg';
import Circle_two_way from '../../assets/svg_icon/circle_two_way.svg';
import Earning_sign from '../../assets/svg_icon/earning_sign.svg';
import {IS_TABLET} from '../../theme/device';

const PERIODS = ['Weekly', 'Monthly', 'Yearly'];

// Only the header copy switches with the period; the two floating cards always
// report the month, the same way the Home dashboard does.
const PERIOD_DATA = {
  Weekly: {
    range: '8 Jun – 14 Jun',
    gross: '$844',
    grossLabel: 'Gross earning this Week',
  },
  Monthly: {
    range: 'June 2026',
    gross: '$1,244',
    grossLabel: 'Gross earning this Month',
  },
  Yearly: {
    range: '2026 – now',
    gross: '$12,344',
    grossLabel: 'Gross earning this Year',
  },
};

const STAT_ICON_SIZE = IS_TABLET ? 26 : 22;

const STATS = [
  {
    key: 'miles',
    icon: <Circle_two_way width={STAT_ICON_SIZE} height={STAT_ICON_SIZE} />,
    label: 'Monthly Miles',
    range: 'July',
    value: '20,000',
    delta: '8.9%',
    deltaUp: true,
    deltaNote: 'from Last Month',
    chartColor: colors.success,
    chart: [30, 42, 38, 55, 50, 62, 72],
  },
  {
    key: 'earnings',
    icon: <Earning_sign width={STAT_ICON_SIZE} height={STAT_ICON_SIZE} />,
    label: 'Monthly Earnings',
    range: 'July',
    value: '$26,000',
    delta: '8.9%',
    deltaUp: false,
    deltaNote: 'from Last Month',
    chartColor: colors.danger,
    chart: [50, 40, 52, 44, 54, 42, 50, 60],
  },
];

// Filled status pill colours.
const STATUS_COLOR = {
  Paid: colors.success,
  'In - Transit': colors.warning,
  Cancelled: colors.danger,
};

const COLUMNS = ['AWB Number', 'Route', 'Distance/ Date', 'Status'];

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

const TRANSACTIONS = [
  {
    id: 't1',
    awb: 'AWB-125',
    type: 'FTL',
    stops: ROUTE,
    miles: '184 MILES',
    when: '12 AUGUST 2026',
    amount: '$900',
    status: 'Paid',
  },
  {
    id: 't2',
    awb: 'AWB-125',
    stops: ROUTE,
    miles: '184 MILES',
    when: '4h 20 minutes',
    amount: '$900',
    status: 'In - Transit',
  },
  {
    id: 't3',
    awb: 'AWB-125',
    type: 'FTL',
    stops: ROUTE,
    miles: '184 MILES',
    when: '4h 20 minutes',
    amount: '$900',
    status: 'In - Transit',
  },
  {
    id: 't4',
    awb: 'AWB-125',
    type: 'FTL',
    stops: ROUTE,
    miles: '184 MILES',
    when: '4h 20 minutes',
    amount: '$900',
    status: 'In - Transit',
  },
  {
    id: 't5',
    awb: 'AWB-125',
    type: 'FTL',
    stops: ROUTE,
    miles: '184 MILES',
    when: '4h 20 minutes',
    amount: '$900',
    status: 'In - Transit',
  },
  {
    id: 't6',
    awb: 'AWB-125',
    type: 'FTL',
    stops: ROUTE,
    miles: '184 MILES',
    when: '4h 20 minutes',
    amount: '$900',
    status: 'In - Transit',
  },
  {
    id: 't7',
    awb: 'AWB-125',
    type: 'FTL',
    stops: ROUTE,
    miles: '184 MILES',
    when: '4h 20 minutes',
    amount: '$900',
    status: 'In - Transit',
  },
  {
    id: 't8',
    awb: 'AWB-125',
    type: 'FTL',
    stops: [pickup('San Jose CA'), drop('Newark NJ')],
    miles: '184 MILES',
    when: '4h 20 minutes',
    amount: '$900',
    status: 'Paid',
  },
  {
    id: 't9',
    awb: 'AWB-125',
    type: 'FTL',
    stops: [pickup('San Jose CA'), drop('Newark NJ')],
    miles: '184 MILES',
    when: '4h 20 minutes',
    amount: '$900',
    status: 'Cancelled',
  },
];

export default function EarningsScreen() {
  const [period, setPeriod] = useState('Weekly');
  const [menuOpen, setMenuOpen] = useState(false);
  // Tapping a row (or its "+N More …" chip) reveals every pickup and drop.
  const [expandedRows, setExpandedRows] = useState({});

  const data = useMemo(() => PERIOD_DATA[period], [period]);

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
          icon={
            <EarningsIcon
              width={IS_TABLET ? 28 : 16}
              height={IS_TABLET ? 28 : 16}
              color={colors.primary}
            />
          }
          title="EARNINGS"
          titleStyle={styles.brandTitle}
          subtitle={data.range}
          subtitleStyle={styles.brandSubTight}
          headerStyle={styles.dashboardHeader}
          statsOffset={-DASHBOARD_STATS_OVERLAP}
          statsVariant="chart"
          right={
            <TouchableOpacity
              style={styles.periodBtn}
              activeOpacity={0.8}
              onPress={() => setMenuOpen(true)}>
              <AppText style={styles.periodBtnText}>{period}</AppText>
              <DropdownIcon width={16} height={16} />
            </TouchableOpacity>
          }
          stats={STATS}>
          <AppText style={styles.grossValue}>{data.gross}</AppText>
          <AppText style={styles.grossLabel}>{data.grossLabel}</AppText>
        </DashboardHeader>

        {/* TRANSACTIONS TABLE */}
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
            data={TRANSACTIONS}
            keyExtractor={tx => tx.id}
            contentContainerStyle={styles.scrollContent}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            renderItem={({item: tx, index}) => (
              <TouchableOpacity
                activeOpacity={tx.stops.length > 2 ? 0.7 : 1}
                disabled={tx.stops.length <= 2}
                onPress={() => toggleRow(tx.id)}
                style={[
                  styles.row,
                  index === TRANSACTIONS.length - 1 && styles.rowLast,
                ]}>
                {/* AWB number + load type */}
                <View style={[styles.col0, styles.cellCenter]}>
                  <AppText style={styles.awbText} numberOfLines={1}>
                    {tx.awb}
                  </AppText>
                  {tx.type ? (
                    <View style={styles.typeBadge}>
                      <GrayTruck
                        width={ms(14)}
                        height={ms(14)}
                        style={styles.typeIcon}
                      />
                      <AppText style={styles.typeText}>{tx.type}</AppText>
                    </View>
                  ) : null}
                </View>

                {/* Route */}
                <View style={styles.col1}>
                  <LoadRoute
                    stops={tx.stops}
                    typed
                    showSummary
                    collapsed={!expandedRows[tx.id]}
                    onPressMore={() => toggleRow(tx.id)}
                  />
                </View>

                {/* Distance / date */}
                <View style={[styles.col2, styles.cellCenter]}>
                  <AppText style={styles.centerMiles} numberOfLines={1}>
                    {tx.miles}
                  </AppText>
                  <AppText style={styles.centerTime} numberOfLines={1}>
                    {tx.when}
                  </AppText>
                </View>

                {/* Amount + status */}
                <View style={[styles.col3, styles.cellCenter]}>
                  <AppText style={styles.rowAmount}>{tx.amount}</AppText>
                  <View
                    style={[
                      styles.pill,
                      {
                        backgroundColor:
                          STATUS_COLOR[tx.status] ?? colors.textMuted,
                      },
                    ]}>
                    <AppText style={styles.pillText} numberOfLines={1}>
                      {tx.status}
                    </AppText>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>

      {/* PERIOD MENU */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}>
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setMenuOpen(false)}>
          <View style={styles.menu}>
            {PERIODS.map(p => (
              <TouchableOpacity
                key={p}
                style={[styles.menuItem, p === period && styles.menuItemActive]}
                onPress={() => {
                  setPeriod(p);
                  setMenuOpen(false);
                }}>
                <AppText
                  style={[
                    styles.menuItemText,
                    p === period && styles.menuItemTextActive,
                  ]}>
                  {p}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
