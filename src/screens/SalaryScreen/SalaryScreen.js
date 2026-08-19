import React, {useMemo, useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import styles from './SalaryScreen.styles';
import {
  DEFAULT_MONTH,
  PAID_MONTHS,
  PAY_STATUS,
  SALARY_BY_MONTH,
  SALARY_HISTORY,
  money,
  moneyShort,
} from './constants';
import StatusBar from '../../component/StatusBar/StatusBar';
import DashboardHeader from '../../component/DashboardHeader/DashboardHeader';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import useDeviceType from '../../hooks/useDeviceType';
import TruckIcon from '../../assets/svg_icon/Truck_Frame.svg';
import DropdownIcon from '../../assets/svg_icon/Dropdown_icon.svg';

const COLUMNS = ['Month', 'Total Earnings', 'Net Pay', 'Status'];

const STATUS_COLOR = {
  [PAY_STATUS.PAID]: colors.success,
  [PAY_STATUS.PROCESSING]: colors.warning,
  [PAY_STATUS.PENDING]: colors.status,
};

const StatusPill = ({status, style, textStyle}) => (
  <View
    style={[
      style,
      {backgroundColor: STATUS_COLOR[status] ?? colors.textMuted},
    ]}>
    <AppText style={textStyle} numberOfLines={1}>
      {status}
    </AppText>
  </View>
);

const BreakdownRow = ({label, value, emphasis, negative}) => (
  <View style={styles.breakdownRow}>
    <AppText
      style={[
        styles.breakdownLabel,
        emphasis && styles.totalLabel,
        negative && styles.deductionText,
      ]}>
      {label}
    </AppText>
    <AppText
      style={[
        styles.breakdownValue,
        emphasis && styles.totalValue,
        negative && styles.deductionText,
      ]}>
      {negative ? money(-value) : money(value)}
    </AppText>
  </View>
);

export default function SalaryScreen() {
  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [menuOpen, setMenuOpen] = useState(false);
  const {isTablet, isLandscape} = useDeviceType();

  // A landscape tablet has room to read the payslip and its breakdown at a
  // glance; phones and portrait tablets stack them.
  const twoColumn = isTablet && isLandscape;

  const data = useMemo(() => SALARY_BY_MONTH[month], [month]);

  const summaryCard = (
    <View style={[styles.card, styles.summaryCard]}>
      <View style={styles.summaryTitleBlock}>
        <AppText style={styles.summaryTitle}>Total Salary</AppText>
        <AppText style={styles.summaryMonth}>{data.month}</AppText>
      </View>

      <View style={[styles.divider, styles.summaryDivider]} />

      <View style={styles.summaryTopRow}>
        <View style={styles.summaryHeading}>
          <AppText style={styles.summaryAmount} numberOfLines={1}>
            {money(data.netPay)}
          </AppText>

          <View style={styles.summaryMetaRow}>
            <View style={styles.metaItem}>
              <AppText style={styles.metaLabel}>Base:</AppText>
              <AppText style={styles.metaValue}>
                {moneyShort(data.base)}
              </AppText>
            </View>
            <View style={styles.metaItem}>
              <AppText style={styles.metaLabel}>Bonus:</AppText>
              <AppText style={styles.metaValue}>
                {moneyShort(data.bonus)}
              </AppText>
            </View>
            <View style={styles.metaItem}>
              <AppText style={styles.metaLabel}>Ded:</AppText>
              <AppText style={styles.metaValueNegative}>
                {moneyShort(-data.deductions)}
              </AppText>
            </View>
          </View>
        </View>

        <StatusPill
          status={data.status}
          style={styles.statusPill}
          textStyle={styles.statusPillText}
        />
      </View>
    </View>
  );

  const breakdownCard = (
    <View
      style={[
        styles.card,
        styles.breakdownCard,
        twoColumn && styles.breakdownCardWide,
      ]}>
      <AppText style={styles.cardTitle}>Salary Break Down</AppText>

      {data.breakdown.map(item => (
        <BreakdownRow key={item.key} label={item.label} value={item.value} />
      ))}

      <View style={styles.divider} />

      <BreakdownRow label="Total Earnings" value={data.totalEarnings} emphasis />
      <BreakdownRow label="Deductions" value={data.deductions} negative />

      <View style={styles.divider} />

      <View style={styles.breakdownRow}>
        <AppText style={styles.netLabel}>Net Pay</AppText>
        <AppText style={styles.netValue}>{money(data.netPay)}</AppText>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar
        backgroundColor={colors.primary}
        barStyle="light-content"
        translucent={false}
      />

      <View style={styles.page}>
        {/* The summary card rides up over the header's bottom edge, so the
            header scrolls with the content instead of sitting above it. */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <DashboardHeader
            title="SALARY"
            headerStyle={styles.dashboardHeader}
            icon={<TruckIcon width={isTablet ? 24 : 18} height={isTablet ? 24 : 18} />}
            right={
              <TouchableOpacity
                style={styles.monthBtn}
                activeOpacity={0.8}
                onPress={() => setMenuOpen(true)}>
                <AppText style={styles.monthBtnText}>{month}</AppText>
                <DropdownIcon width={16} height={16} />
              </TouchableOpacity>
            }
          />

          <View style={styles.body}>
            {twoColumn ? (
              <View style={styles.topRowWide}>
                <View style={styles.colFlex}>{summaryCard}</View>
                <View style={styles.colFlex}>{breakdownCard}</View>
              </View>
            ) : (
              <>
                {summaryCard}
                {breakdownCard}
              </>
            )}

            {/* SALARY HISTORY */}
            <AppText style={styles.sectionTitle}>Salary History</AppText>

            <View style={styles.historyCard}>
              <View style={styles.tableHead}>
                <AppText style={[styles.tableHeadText, styles.colMonth]}>
                  {COLUMNS[0]}
                </AppText>
                <AppText
                  numberOfLines={1}
                  style={[styles.tableHeadText, styles.colEarnings]}>
                  {COLUMNS[1]}
                </AppText>
                <AppText
                  numberOfLines={1}
                  style={[styles.tableHeadText, styles.colNet]}>
                  {COLUMNS[2]}
                </AppText>
                <AppText
                  numberOfLines={1}
                  style={[styles.tableHeadText, styles.colStatusHead]}>
                  {COLUMNS[3]}
                </AppText>
              </View>

              {SALARY_HISTORY.map((row, index) => (
                <TouchableOpacity
                  key={row.month}
                  activeOpacity={0.7}
                  onPress={() => setMonth(row.month)}
                  style={[
                    styles.historyRow,
                    row.month === month && styles.historyRowActive,
                    index === SALARY_HISTORY.length - 1 && styles.historyRowLast,
                  ]}>
                  <AppText style={[styles.historyMonth, styles.colMonth]}>
                    {row.month}
                  </AppText>
                  <AppText
                    numberOfLines={1}
                    style={[styles.historyValue, styles.colEarnings]}>
                    {money(row.totalEarnings)}
                  </AppText>
                  <AppText
                    numberOfLines={1}
                    style={[styles.historyValue, styles.colNet]}>
                    {money(row.netPay)}
                  </AppText>
                  <View style={styles.colStatus}>
                    <StatusPill
                      status={row.status}
                      style={styles.historyPill}
                      textStyle={styles.historyPillText}
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* MONTH MENU */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}>
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setMenuOpen(false)}>
          <View style={styles.menu}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {PAID_MONTHS.map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.menuItem, m === month && styles.menuItemActive]}
                  onPress={() => {
                    setMonth(m);
                    setMenuOpen(false);
                  }}>
                  <AppText
                    style={[
                      styles.menuItemText,
                      m === month && styles.menuItemTextActive,
                    ]}>
                    {m}
                  </AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
