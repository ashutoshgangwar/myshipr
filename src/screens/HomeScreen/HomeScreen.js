import React, {useState} from 'react';
import {View, SafeAreaView, ScrollView, TouchableOpacity} from 'react-native';
import styles from './HomeScreen.styles';
import StatusBar from '../../component/StatusBar/StatusBar';
import FloatingMap from '../../component/FloatingMap/FloatingMap';
import {colors} from '../../theme/colors';
import AppText from '../../theme/AppText';
import TruckIcon from '../../assets/svg_icon/Frame_black.svg';

const STATS = [
  {label: 'Miles • Week', value: '1,234', note: '↑ 8% vs last week', color: colors.success, accent: colors.warning},
  {label: 'Earnings', value: '$1,234', note: '↓ $200 this week', color: colors.danger, accent: colors.success},
  {label: 'Net Profit', value: '$879', note: 'after all costs', color: colors.textMuted, accent: colors.accentBlue},
  {label: 'Fuel Saved', value: '$1,234', note: 'Route Optimization', color: colors.accentBlue, accent: colors.warning},
];

const TRIP_STATS = [
  {value: '245 mi', label: 'Distance'},
  {value: '4h 10m', label: 'Est. time'},
  {value: 'I-45 S', label: 'Route'},
  {value: '12:10 PM', label: 'ETA'},
];

const HOS_DETAILS = [
  {label: 'Cycle Remaining', value: '34h 10m'},
  {label: 'Break Available In', value: '2h 10m'},
  {label: 'Reset Available', value: 'Tomorrow 8:00 AM'},
  {label: 'Driving Status', value: 'On DUTY', strong: true},
];

const UPCOMING_LOADS = [
  {id: 'u1', route: 'San Jose, CA → Newark, NJ', pickup: 'Tomorrow • 6:00 AM pickup', pay: '$980', miles: '180 mil'},
  {id: 'u2', route: 'San Jose, CA → Newark, NJ', pickup: 'Wed • 2:00 PM pickup', pay: '$980', miles: '180 mil'},
  {id: 'u3', route: 'San Jose, CA → Newark, NJ', pickup: 'Wed • 2:00 PM pickup', pay: '$980', miles: '180 mil'},
  {id: 'u4', route: 'San Jose, CA → Newark, NJ', pickup: 'Wed • 2:00 PM pickup', pay: '$980', miles: '180 mil'},
  {id: 'u5', route: 'San Jose, CA → Newark, NJ', pickup: 'Wed • 2:00 PM pickup', pay: '$980', miles: '180 mil'},
];

const HomeScreen = () => {
  const [mapVisible, setMapVisible] = useState(false);

  const openMap_Here = () => setMapVisible(true);

  return (
    <SafeAreaView style={styles.safe}>
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
                <TruckIcon width={20} height={20} />
              </View>
              <AppText style={styles.brandText}>CARRIER</AppText>
            </View>

            <View style={styles.dieselBadge}>
              <AppText style={styles.dieselLabel}>DIESEL</AppText>
              <AppText style={styles.dieselValue}>$3.89/gal</AppText>
            </View>
          </View>

          <AppText style={styles.headerLocation}>Dallas, TX</AppText>
          <AppText style={styles.headerWelcome}>Welcome Back, Ashutosh</AppText>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          {STATS.map(stat => (
            <View
              key={stat.label}
              style={[styles.statCard, {borderLeftColor: stat.accent}]}>
              <AppText style={styles.statLabel}>{stat.label}</AppText>
              <AppText style={styles.statValue}>{stat.value}</AppText>
              <AppText style={[styles.statNote, {color: stat.color}]}>
                {stat.note}
              </AppText>
            </View>
          ))}
        </View>

        {/* MAIN GRID */}
        <View style={styles.grid}>
          {/* LEFT COLUMN */}
          <View style={styles.column}>
            {/* Current Trip */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <AppText style={styles.cardTitle}>Current Trip</AppText>
                <View style={[styles.pill, styles.pillOnTime]}>
                  <AppText style={styles.pillOnTimeText}>On time</AppText>
                </View>
              </View>

              <View style={styles.payoutRow}>
                <AppText style={styles.payoutValue}>$1,250</AppText>
                <AppText style={styles.payoutLabel}>load payout</AppText>
              </View>

              <View style={styles.routeBox}>
                <View style={styles.routeTimeline}>
                  <View style={styles.routeDotStart} />
                  <View style={styles.routeLine} />
                  <View style={styles.routeDotEnd} />
                </View>
                <View style={{flex: 1}}>
                  <AppText style={styles.routeStopLabel}>FROM</AppText>
                  <AppText style={styles.routeStopCity}>Dallas, TX</AppText>
                  <AppText style={styles.routeStopLabel}>TO</AppText>
                  <AppText style={[styles.routeStopCity, {marginBottom: 0}]}>
                    Houston, TX
                  </AppText>
                </View>
              </View>

              <View style={styles.tripStatsRow}>
                {TRIP_STATS.map(item => (
                  <View key={item.label} style={styles.tripStatItem}>
                    <AppText style={styles.tripStatValue}>{item.value}</AppText>
                    <AppText style={styles.tripStatLabel}>{item.label}</AppText>
                  </View>
                ))}
              </View>

              <View style={styles.progressHeaderRow}>
                <AppText style={styles.progressCaption}>Hours of Service</AppText>
                <AppText style={styles.progressCaptionAccent}>2h 23m left</AppText>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, {width: '60%'}]} />
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                activeOpacity={0.9}
                onPress={openMap_Here}>
                <AppText style={styles.primaryBtnText}>START TRIP</AppText>
              </TouchableOpacity>
            </View>

            {/* Hours of Service */}
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <AppText style={styles.cardTitle}>Hours of Service</AppText>
                <View style={[styles.pill, styles.pillOnDuty]}>
                  <AppText style={styles.pillOnDutyText}>On Duty</AppText>
                </View>
              </View>

              <View style={styles.hosDrivenRow}>
                <AppText style={styles.hosDrivenText}>8h 23m Driven</AppText>
                <AppText style={styles.hosRemText}>2h 37m rem</AppText>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, styles.progressFillWarn, {width: '77%'}]}
                />
              </View>

              {HOS_DETAILS.map(item => (
                <View key={item.label} style={styles.detailRow}>
                  <AppText style={styles.detailLabel}>{item.label}</AppText>
                  <AppText
                    style={item.strong ? styles.detailValueStrong : styles.detailValue}>
                    {item.value}
                  </AppText>
                </View>
              ))}
            </View>
          </View>

          {/* RIGHT COLUMN */}
          <View style={styles.column}>
            {/* Fuel Rewards */}
            <View style={styles.rewardsCard}>
              <AppText style={styles.rewardsLabel}>Fuel Rewards Points</AppText>
              <AppText style={styles.rewardsTitle}>
                Report your fuel price, earn points
              </AppText>
              <AppText style={styles.rewardsBody}>
                Enter the diesel price at your nearest station. Every verified
                report earns you points — redeem for bonuses & perks.
              </AppText>

              <AppText style={styles.rewardsBalanceLabel}>
                Your points balance
              </AppText>
              <View style={styles.rewardsPointsRow}>
                <AppText style={styles.rewardsPoints}>1234pts</AppText>
              </View>
              <View style={styles.rewardsTrack}>
                <View style={[styles.rewardsFill, {width: '66%'}]} />
              </View>
              <View style={styles.rewardsFooterRow}>
                <AppText style={styles.rewardsFooterText}>
                  2983 points to next reward
                </AppText>
                <AppText style={styles.rewardsFooterText}>2000</AppText>
              </View>
            </View>

            {/* Upcoming loads */}
            <View style={styles.card}>
              <AppText style={styles.cardTitle}>Upcoming loads</AppText>

              {UPCOMING_LOADS.map((load, index) => (
                <View
                  key={load.id}
                  style={[styles.loadRow, index === 0 && styles.loadRowFirst]}>
                  <View style={{flex: 1, paddingRight: 8}}>
                    <AppText style={styles.loadRoute}>{load.route}</AppText>
                    <AppText style={styles.loadPickup}>{load.pickup}</AppText>
                  </View>
                  <View style={styles.loadRight}>
                    <AppText style={styles.loadPay}>{load.pay}</AppText>
                    <AppText style={styles.loadMiles}>{load.miles}</AppText>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.loadChevron} activeOpacity={0.7}>
                <AppText style={styles.loadChevronGlyph}>⌄</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Draggable floating HERE map — movable anywhere on the screen */}
      <FloatingMap visible={mapVisible} onClose={() => setMapVisible(false)} />
    </SafeAreaView>
  );
};

export default HomeScreen;
