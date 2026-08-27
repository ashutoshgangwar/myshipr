import React from 'react';
import {View, ScrollView, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import styles from './EarningsDetails.styles';
import {PAYMENT, STATUS_COLOR, STEP_STATE, ms} from './constants';
import StatusBar from '../../component/StatusBar/StatusBar';
import DashboardHeader from '../../component/DashboardHeader/DashboardHeader';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import BackArrow from '../../assets/svg_icon/Back_arrow_map.svg';
import BlueTruckIcon from '../../assets/svg_icon/Truck_Frame.svg';
import CalendarIcon from '../../assets/svg_icon/Schedule.svg';
import Bank_Icon_Svg from '../../assets/svg_icon/Bank_Icon.svg';
import {IS_TABLET} from '../../theme/device';
import type {RootStackScreenProps} from '../../types/navigation';
import type {DetailRow} from '../../types/common';

// One size for the chip icons so they scale together, as on ShipmentDetails.
const CHIP_ICON = IS_TABLET ? ms(12) : ms(15);

// Where a payout step sits in the pipeline: settled, in flight, not started.
const STEP_DOT_COLOR = {
  [STEP_STATE.DONE]: colors.success,
  [STEP_STATE.PENDING]: colors.warning,
  [STEP_STATE.UPCOMING]: colors.status,
};

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
          <AppText style={styles.gridValue}>{cell.value}</AppText>
          {cell.sub ? (
            <AppText style={styles.gridSub}>{cell.sub}</AppText>
          ) : null}
        </View>
      ))}
    </View>
  );
};

export default function EarningsDetails({navigation, route}: RootStackScreenProps<'Earningsdetails'>) {
  // The payout comes from the earnings row the user tapped; fall back to the sample.
  const data = route?.params?.payment || PAYMENT;

  const goBack = () => (navigation ? navigation.goBack() : null);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar
        backgroundColor={colors.primary}
        barStyle="light-content"
        translucent={false}
      />

      <View style={styles.page}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* HEADER — the payout card rides up over its bottom edge, so the
              header scrolls with the content instead of sitting above it. */}
          <DashboardHeader
            title="PAYMENT DETAILS"
            headerStyle={styles.dashboardHeader}
            titleStyle={styles.headerTitle}
            icon={
              <TouchableOpacity
                style={styles.backBtn}
                activeOpacity={0.8}
                onPress={goBack}>
                <BackArrow
                  width={IS_TABLET ? 24 : 18}
                  height={IS_TABLET ? 24 : 18}
                />
              </TouchableOpacity>
            }
          />

          {/* PAYOUT SUMMARY */}
          <View style={styles.payoutCard}>
            <View style={styles.payoutTopRow}>
              <View style={styles.payoutHeading}>
                <AppText style={styles.payoutLabel}>{data.amountLabel}</AppText>
                <AppText style={styles.payoutAmount}>{data.amount}</AppText>
              </View>

              <View style={styles.chipsRight}>
                {data.mode ? (
                  <View style={styles.modePill}>
                    <BlueTruckIcon width={CHIP_ICON} height={CHIP_ICON} />
                    <AppText style={styles.modePillText}>{data.mode}</AppText>
                  </View>
                ) : null}
                {data.date ? (
                  <View style={styles.metaChip}>
                    <CalendarIcon width={CHIP_ICON} height={CHIP_ICON} />
                    <AppText style={styles.metaChipText}>{data.date}</AppText>
                  </View>
                ) : null}
                {data.status ? (
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          STATUS_COLOR[data.status] ?? colors.button_color,
                      },
                    ]}>
                    <AppText style={styles.statusBadgeText}>
                      {data.status}
                    </AppText>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.payoutDivider} />

            <View style={styles.payoutBottomRow}>
              <AppText style={styles.awbText}>{data.awb}</AppText>
              <AppText style={styles.routeText} numberOfLines={1}>
                {data.origin} → {data.dest}
              </AppText>
            </View>
          </View>

          <View style={styles.body}>
            {/* BILL OF LADING */}
            <AppText style={styles.sectionLabel}>
              Bill of Lading Details
            </AppText>
            <DetailGrid cells={data.bol} />

            {/* PAYMENT STATUS */}
            <AppText style={styles.sectionLabel}>Payment Status</AppText>
            <View style={styles.statusCard}>
              {data.steps.map((step, index) => (
                <View
                  key={step.id}
                  style={[
                    styles.statusRow,
                    index === data.steps.length - 1 && styles.statusRowLast,
                  ]}>
                  <View
                    style={[
                      styles.stepDot,
                      {
                        backgroundColor:
                          STEP_DOT_COLOR[step.state] ?? colors.status,
                      },
                    ]}
                  />
                  <AppText
                    style={[
                      styles.stepLabel,
                      step.state === STEP_STATE.UPCOMING &&
                        styles.stepLabelMuted,
                    ]}
                    numberOfLines={1}>
                    {step.label}
                  </AppText>
                  <AppText style={styles.stepWhen}>{step.when}</AppText>
                </View>
              ))}
            </View>

            {/* PAYOUT ACCOUNT */}
            <AppText style={styles.sectionLabel}>Payout Account</AppText>
            <View style={styles.accountCard}>
              <Bank_Icon_Svg />
              {/* <BankGlyph /> */}
              <AppText style={styles.accountText}>
                {data.account.label} ···· {data.account.mask}
              </AppText>
            </View>
            <AppText style={styles.accountNote}>{data.account.note}</AppText>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
