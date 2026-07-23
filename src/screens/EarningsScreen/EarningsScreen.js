import React, {useMemo, useState} from 'react';
import {View, FlatList, TouchableOpacity, Modal, Pressable} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import styles from './EarningsScreen.styles';
import StatusBar from '../../component/StatusBar/StatusBar';
import DashboardHeader from '../../component/DashboardHeader/DashboardHeader';
import LoadRoute from '../../component/LoadRoute/LoadRoute';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import {ms} from '../../theme/scale';
import EarningsIcon from '../../assets/svg_icon/Earning_1.svg';
import DropdownIcon from '../../assets/svg_icon/Dropdown_icon.svg';
import GrayTruck from '../../assets/svg_icon/gray_truck.svg';
import {IS_TABLET} from '../../theme/device';

const PERIODS = ['Weekly', 'Monthly', 'Yearly'];

// Per-period header copy + floating chart cards.
const PERIOD_DATA = {
  Weekly: {
    range: '8 Jun – 14 Jun',
    gross: '$844',
    grossLabel: 'Gross earning this Week',
    stats: [
      {
        key: 'miles',
        label: 'Miles • Week',
        value: '1,234',
        note: '↑ 8% vs last week',
        noteColor: colors.success,
        accent: colors.warning,
        chartColor: colors.success,
        chart: [30, 42, 38, 55, 50, 62, 72],
      },
      {
        key: 'earnings',
        label: 'Earnings',
        value: '$1,234',
        note: '↓ $200 this week',
        noteColor: colors.danger,
        accent: colors.warning,
        chartColor: colors.danger,
        chart: [50, 40, 52, 44, 54, 42, 50, 60],
      },
    ],
  },
  Monthly: {
    range: 'June 2026',
    gross: '$1,244',
    grossLabel: 'Gross earning this Month',
    stats: [
      {
        key: 'miles',
        label: 'Miles • Month',
        value: '5,120',
        note: '↑ 12% vs last month',
        noteColor: colors.success,
        accent: colors.warning,
        chartColor: colors.success,
        chart: [40, 48, 52, 60],
      },
      {
        key: 'earnings',
        label: 'Earnings',
        value: '$4,980',
        note: '↑ $420 this month',
        noteColor: colors.success,
        accent: colors.warning,
        chartColor: colors.success,
        chart: [42, 46, 50, 58],
      },
    ],
  },
  Yearly: {
    range: '2026 – now',
    gross: '$12,344',
    grossLabel: 'Gross earning this Year',
    stats: [
      {
        key: 'miles',
        label: 'Miles • Year',
        value: '61,300',
        note: '↑ 6% vs last year',
        noteColor: colors.success,
        accent: colors.warning,
        chartColor: colors.success,
        chart: [45, 50, 48, 55, 52, 60, 58, 62, 60, 65, 63, 70],
      },
      {
        key: 'earnings',
        label: 'Earnings',
        value: '$58,900',
        note: '↓ $1.2k this year',
        noteColor: colors.danger,
        accent: colors.warning,
        chartColor: colors.danger,
        chart: [55, 52, 58, 54, 60, 56, 50, 58, 54, 60, 56, 52],
      },
    ],
  },
};

// Filled status pill colours.
const STATUS_COLOR = {
  Paid: colors.success,
  'In - Transit': colors.warning,
  Cancelled: colors.danger,
};

const TRANSACTIONS = [
  {
    id: 't1',
    type: 'FTL',
    stops: ['San Jose CA', 'Newark NJ'],
    miles: '184 MILES',
    time: '4h 20 minutes',
    amount: '$900',
    subMiles: '180 miles',
    status: 'Paid',
  },
  {
    id: 't2',
    type: 'FTL',
    stops: ['San Jose CA', 'Newark NJ'],
    miles: '184 MILES',
    time: '4h 20 minutes',
    amount: '$900',
    subMiles: '180 miles',
    status: 'In - Transit',
  },
  {
    id: 't3',
    type: 'FTL',
    stops: ['San Jose CA', 'Newark NJ'],
    miles: '184 MILES',
    time: '4h 20 minutes',
    amount: '$900',
    subMiles: '180 miles',
    status: 'In - Transit',
  },
  {
    id: 't4',
    type: 'FTL',
    stops: ['San Jose CA', 'Newark NJ'],
    miles: '184 MILES',
    time: '4h 20 minutes',
    amount: '$900',
    subMiles: '180 miles',
    status: 'In - Transit',
  },
  {
    id: 't5',
    type: 'FTL',
    stops: ['San Jose CA', 'Newark NJ'],
    miles: '184 MILES',
    time: '4h 20 minutes',
    amount: '$900',
    subMiles: '180 miles',
    status: 'In - Transit',
  },
  {
    id: 't6',
    type: 'FTL',
    stops: ['San Jose CA', 'Newark NJ'],
    miles: '184 MILES',
    time: '4h 20 minutes',
    amount: '$900',
    subMiles: '180 miles',
    status: 'In - Transit',
  },
  {
    id: 't7',
    type: 'FTL',
    stops: ['San Jose CA', 'Newark NJ'],
    miles: '184 MILES',
    time: '4h 20 minutes',
    amount: '$900',
    subMiles: '180 miles',
    status: 'In - Transit',
  },
  {
    id: 't8',
    type: 'FTL',
    stops: ['San Jose CA', 'Newark NJ'],
    miles: '184 MILES',
    time: '4h 20 minutes',
    amount: '$900',
    subMiles: '180 miles',
    status: 'Paid',
  },
  {
    id: 't9',
    type: 'FTL',
    stops: ['San Jose CA', 'Newark NJ'],
    miles: '184 MILES',
    time: '4h 20 minutes',
    amount: '$900',
    subMiles: '180 miles',
    status: 'Cancelled',
  },
];

export default function EarningsScreen() {
  const [period, setPeriod] = useState('Weekly');
  const [menuOpen, setMenuOpen] = useState(false);

  const data = useMemo(() => PERIOD_DATA[period], [period]);

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
              height={IS_TABLET? 28: 16}
              color={colors.primary}
            />
          }
          title="EARNINGS"
          titleStyle={styles.brandTitle}
          subtitle={data.range}
          subtitleStyle={styles.brandSubTight}
          headerStyle={styles.dashboardHeader}
          statsOffset={IS_TABLET ? -ms(115) : -ms(100)}
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
          stats={data.stats}>
          <AppText style={styles.grossValue}>{data.gross}</AppText>
          <AppText style={styles.grossLabel}>{data.grossLabel}</AppText>
        </DashboardHeader>

        {/* TRANSACTIONS */}
        <FlatList
          data={TRANSACTIONS}
          keyExtractor={tx => tx.id}
          style={styles.listCard}
          contentContainerStyle={styles.scrollContent}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          renderItem={({item: tx, index}) => (
            <View
              style={[
                styles.row,
                index === TRANSACTIONS.length - 1 && styles.rowLast,
              ]}>
              <View style={styles.rowLeft}>
                <LoadRoute stops={tx.stops} />
                <View style={styles.typeBadge}>
                  <GrayTruck
                    width={ms(14)}
                    height={ms(14)}
                    style={styles.typeIcon}
                  />
                  <AppText style={styles.typeText}>{tx.type}</AppText>
                </View>
              </View>

              <View style={styles.rowCenter}>
                <AppText style={styles.centerMiles} numberOfLines={1}>
                  {tx.miles}
                </AppText>
                <AppText style={styles.centerTime} numberOfLines={1}>
                  {tx.time}
                </AppText>
              </View>

              <View style={styles.rowRight}>
                <AppText style={styles.rowAmount}>{tx.amount}</AppText>
                <AppText style={styles.rowSubMiles}>{tx.subMiles}</AppText>
                <View
                  style={[
                    styles.pill,
                    {
                      backgroundColor:
                        STATUS_COLOR[tx.status] ?? colors.textMuted,
                    },
                  ]}>
                  <AppText style={styles.pillText}>{tx.status}</AppText>
                </View>
              </View>
            </View>
          )}
        />
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
