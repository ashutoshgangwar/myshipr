import React, {useMemo, useState} from 'react';
import {View, FlatList, TouchableOpacity, Modal, Pressable} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import styles from './EarningsScreen.styles';
import StatusBar from '../../component/StatusBar/StatusBar';
import DashboardHeader from '../../component/DashboardHeader/DashboardHeader';
import {DASHBOARD_STATS_OVERLAP} from '../../component/DashboardHeader/DashboardHeader.styles';
import LoadRoute from '../../component/LoadRoute/LoadRoute';
import Skeleton from '../../component/Skeleton/Skeleton';
import {shipmentRowBones} from '../../component/Skeleton/Skeleton.layouts';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import {ms} from '../../theme/scale';
import EarningsIcon from '../../assets/svg_icon/Earning_1.svg';
import DropdownIcon from '../../assets/svg_icon/Dropdown_icon.svg';
import GrayTruck from '../../assets/svg_icon/gray_truck.svg';
import Circle_two_way from '../../assets/svg_icon/circle_two_way.svg';
import Earning_sign from '../../assets/svg_icon/earning_sign.svg';
import {IS_TABLET} from '../../theme/device';
import {paymentFromTransaction} from '../EarningsDetails/constants';
import {toMilesCard, useMonthlyMiles} from '../../services/monthlyMiles';
import {
  toEarningsCard,
  useMonthlyEarnings,
} from '../../services/monthlyEarnings';
import {
  DEFAULT_PERIOD,
  PERIODS,
  toEarningsHeader,
  toEarningsRows,
  useDriverEarnings,
} from '../../services/driverEarnings';

const STAT_ICON_SIZE = IS_TABLET ? 26 : 22;

// The left card's figures — value, month and sparkline — come from
// `/drivers/shipments/get-monthly-miles` and overwrite the fields below. The
// delta pill stays as designed for now: that endpoint reports the current
// month alone, so there is no last-month total to measure it against yet.
const MILES_STAT = {
  key: 'miles',
  icon: <Circle_two_way width={STAT_ICON_SIZE} height={STAT_ICON_SIZE} />,
  label: 'Monthly Miles',
  delta: '8.9%',
  deltaUp: true,
  deltaNote: 'from Last Month',
  chartColor: colors.success,
};

// The right card, fed by `/drivers/shipments/get-monthly-earnings` the same
// way — value, month and sparkline overwritten from the call, delta pill left
// as designed until there is a last-month total behind it.
const EARNINGS_STAT = {
  key: 'earnings',
  icon: <Earning_sign width={STAT_ICON_SIZE} height={STAT_ICON_SIZE} />,
  label: 'Monthly Earnings',
  delta: '8.9%',
  deltaUp: false,
  deltaNote: 'from Last Month',
  chartColor: colors.danger,
};

// Filled status pill colours.
const STATUS_COLOR = {
  Paid: colors.success,
  'In - Transit': colors.warning,
  Cancelled: colors.danger,
};

const COLUMNS = ['AWB Number', 'Route', 'Distance/ Date', 'Status'];

// The table waits on the same call the header does, so it waits the way the
// Shipment table does: bones the width of the cells they stand in for.
const ROW_BONES = shipmentRowBones(6);

export default function EarningsScreen({navigation}) {
  const [period, setPeriod] = useState(DEFAULT_PERIOD);
  const [menuOpen, setMenuOpen] = useState(false);
  // Tapping the "+N More …" chip reveals every pickup and drop; tapping the
  // row itself opens the payout breakdown.
  const [expandedRows, setExpandedRows] = useState({});

  // The header figure and the table below it, both from
  // `GET /drivers/earnings?period=…`. The dropdown is that one query param, so
  // picking a period asks the backend again rather than filtering on device.
  const {earnings, loading, error} = useDriverEarnings(period);
  const data = useMemo(
    () => toEarningsHeader(earnings, period),
    [earnings, period],
  );
  const transactions = useMemo(() => toEarningsRows(earnings), [earnings]);

  const periodLabel =
    PERIODS.find(item => item.value === period)?.label ?? PERIODS[0].label;

  // The two floating cards, from the same pair of calls the Home dashboard
  // reads. The period dropdown does not reach them — those endpoints report
  // the month, and these cards report the month whichever period the table
  // below is showing.
  const {miles: monthlyMiles} = useMonthlyMiles();
  const {earnings: monthlyEarnings} = useMonthlyEarnings();
  const stats = useMemo(
    () => [
      {...MILES_STAT, ...toMilesCard(monthlyMiles)},
      {...EARNINGS_STAT, ...toEarningsCard(monthlyEarnings)},
    ],
    [monthlyEarnings, monthlyMiles],
  );

  const toggleRow = id => setExpandedRows(prev => ({...prev, [id]: !prev[id]}));

  const openPayment = tx =>
    navigation?.navigate('Earningsdetails', {
      payment: paymentFromTransaction(tx),
    });

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
          subtitle={data.range}
          headerStyle={styles.dashboardHeader}
          statsOffset={-DASHBOARD_STATS_OVERLAP}
          statsVariant="chart"
          right={
            <TouchableOpacity
              style={styles.periodBtn}
              activeOpacity={0.8}
              onPress={() => setMenuOpen(true)}>
              <AppText style={styles.periodBtnText}>{periodLabel}</AppText>
              <DropdownIcon width={16} height={16} />
            </TouchableOpacity>
          }
          stats={stats}>
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
            data={transactions}
            keyExtractor={tx => tx.id}
            contentContainerStyle={styles.scrollContent}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              loading ? (
                <Skeleton isLoading layout={ROW_BONES} />
              ) : (
                <View style={styles.listEmpty}>
                  <AppText style={styles.listEmptyText}>
                    {error || 'No earnings in this period'}
                  </AppText>
                </View>
              )
            }
            renderItem={({item: tx, index}) => (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openPayment(tx)}
                style={[
                  styles.row,
                  index === transactions.length - 1 && styles.rowLast,
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
            {PERIODS.map(({label, value}) => (
              <TouchableOpacity
                key={value}
                style={[
                  styles.menuItem,
                  value === period && styles.menuItemActive,
                ]}
                onPress={() => {
                  setPeriod(value);
                  setMenuOpen(false);
                }}>
                <AppText
                  style={[
                    styles.menuItemText,
                    value === period && styles.menuItemTextActive,
                  ]}>
                  {label}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
