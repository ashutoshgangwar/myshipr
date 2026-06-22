import React, {useMemo, useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import styles from './EarningsScreen.styles';
import StatusBar from '../../component/StatusBar/StatusBar';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import EarningsIcon from '../../assets/svg_icon/Earnings.svg';
import DropdownIcon from '../../assets/svg_icon/Dropdown_icon.svg';

const PERIODS = ['Weekly', 'Monthly', 'Yearly'];

// Per-period header copy + chart shape. Bar heights are 0-1 fractions.
const PERIOD_DATA = {
  Weekly: {
    range: '8 Jun – 14 Jun',
    gross: '$844',
    grossLabel: 'Gross earning this Week',
    labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    bars: [0.45, 0.32, 0.55, 0.72, 0.4, 0.5, 0.3],
  },
  Monthly: {
    range: 'June 2026',
    gross: '$1244',
    grossLabel: 'Gross earning this month',
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week4'],
    bars: [0.6, 0.62, 0.6, 0.6],
  },
  Yearly: {
    range: '2026 – now',
    gross: '$12344',
    grossLabel: 'Gross earning this Year',
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'June', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'],
    bars: [0.55, 0.5, 0.6, 0.5, 0.55, 0.6, 0.5, 0.55, 0.6, 0.55, 0.6, 0.55],
  },
};

const STATS = [
  {label: 'Net Profit', value: '$1,234', note: 'after $324 cost', accent: colors.warning},
  {label: 'Miles Driven', value: '1,234', note: '$0.97/mile average', accent: colors.danger},
  {label: 'Loads Done', value: '9', note: '$234 avg /per load', accent: colors.accentBlue},
];

const STATUS = {
  Paid: colors.success,
  'In-Progress': colors.warning,
  Cancelled: colors.danger,
};

const TRANSACTIONS = [
  {id: 't1', route: 'San Jose, CA → Newark, NJ', meta: 'Yesterday • 4h 10 m', amount: '$234', status: 'Paid'},
  {id: 't2', route: 'San Jose, CA → Newark, NJ', meta: 'Yesterday • 4h 10 m', amount: '$234', status: 'In-Progress'},
  {id: 't3', route: 'San Jose, CA → Newark, NJ', meta: 'Yesterday • 4h 10 m', amount: '$234', status: 'Cancelled'},
  {id: 't4', route: 'San Jose, CA → Newark, NJ', meta: 'Yesterday • 4h 10 m', amount: '$234', status: 'In-Progress'},
  {id: 't5', route: 'San Jose, CA → Newark, NJ', meta: 'Yesterday • 4h 10 m', amount: '$234', status: 'Paid'},
  {id: 't6', route: 'San Jose, CA → Newark, NJ', meta: 'Yesterday • 4h 10 m', amount: '$234', status: 'Paid'},
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View style={styles.brandRow}>
              <View style={styles.brandBadge}>
                <EarningsIcon width={18} height={18} color={colors.primary} />
              </View>
              <View>
                <AppText style={styles.brandText}>EARNINGS</AppText>
                <AppText style={styles.brandSub}>{data.range}</AppText>
              </View>
            </View>

            <TouchableOpacity
              style={styles.periodBtn}
              activeOpacity={0.8}
              onPress={() => setMenuOpen(true)}>
              <AppText style={styles.periodBtnText}>{period}</AppText>
              <DropdownIcon width={16} height={16} />
            </TouchableOpacity>
          </View>

          <AppText style={styles.grossValue}>{data.gross}</AppText>
          <AppText style={styles.grossLabel}>{data.grossLabel}</AppText>

          {/* BAR CHART */}
          <View style={styles.chartWrap}>
            <View style={styles.chartRow}>
              {data.bars.map((h, i) => (
                <View
                  key={`${period}-bar-${i}`}
                  style={[styles.bar, {height: `${Math.round(h * 100)}%`}]}
                />
              ))}
            </View>
            <View style={styles.chartLabelsRow}>
              {data.labels.map((label, i) => (
                <AppText
                  key={`${period}-label-${i}`}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={styles.chartLabel}>
                  {label}
                </AppText>
              ))}
            </View>
          </View>
        </View>

        {/* STAT CARDS */}
        <View style={styles.statsRow}>
          {STATS.map(stat => (
            <View
              key={stat.label}
              style={[styles.statCard, {borderLeftColor: stat.accent}]}>
              <AppText numberOfLines={1} adjustsFontSizeToFit style={styles.statLabel}>
                {stat.label}
              </AppText>
              <AppText numberOfLines={1} adjustsFontSizeToFit style={styles.statValue}>
                {stat.value}
              </AppText>
              <AppText numberOfLines={1} adjustsFontSizeToFit style={styles.statNote}>
                {stat.note}
              </AppText>
            </View>
          ))}
        </View>

        {/* TRANSACTIONS */}
        <View style={styles.listCard}>
          {TRANSACTIONS.map((tx, index) => (
            <View
              key={tx.id}
              style={[styles.row, index === TRANSACTIONS.length - 1 && styles.rowLast]}>
              <View style={styles.rowLeft}>
                <AppText style={styles.rowRoute}>{tx.route}</AppText>
                <AppText style={styles.rowMeta}>{tx.meta}</AppText>
              </View>
              <View style={styles.rowRight}>
                <AppText style={styles.rowAmount}>{tx.amount}</AppText>
                <View style={[styles.pill, {backgroundColor: STATUS[tx.status]}]}>
                  <AppText style={styles.pillText}>{tx.status}</AppText>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* PERIOD MENU */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
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
                  style={[styles.menuItemText, p === period && styles.menuItemTextActive]}>
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
