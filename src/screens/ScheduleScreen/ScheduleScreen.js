import React, {useMemo, useState} from 'react';
import {View, FlatList, TouchableOpacity, Platform} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';

import styles from './ScheduleScreen.styles';
import StatusBar from '../../component/StatusBar/StatusBar';
import DashboardHeader from '../../component/DashboardHeader/DashboardHeader';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import ScheduleIcon from '../../assets/svg_icon/Schedule.svg';
import RightArrow from '../../assets/svg_icon/right_Arrow.svg';

const ICON_SIZE = 16;

// Week strip — `dot` marks days that have a scheduled pickup.
const WEEK = [
  {key: 'd8', day: 'Mon', date: 8, dot: true},
  {key: 'd9', day: 'Tue', date: 9, dot: true},
  {key: 'd10', day: 'Wed', date: 10, dot: false},
  {key: 'd11', day: 'Thur', date: 11, dot: false},
  {key: 'd12', day: 'Fri', date: 12, dot: true},
  {key: 'd13', day: 'Sat', date: 13, dot: false},
  {key: 'd14', day: 'Sun', date: 14, dot: false},
];

// The day's headline pickup. Days without an entry show the empty state.
const FEATURED = {
  d8: {
    route: 'San Jose, CA → Newark, NJ',
    pickup: '6:00 AM pickup',
    amount: '$990',
    miles: '180 mil',
    load: 'TX-8821-A',
    payout: '$1,250',
    driven: '168 mil',
  },
};

const TRIPS = [
  {id: 't1', route: 'San Jose, CA → Newark, NJ', meta: 'Tomorrow • 6:00PM', amount: '$990', miles: '180 mil'},
  {id: 't2', route: 'San Jose, CA → Newark, NJ', meta: 'Tomorrow • 6:00PM', amount: '$990', miles: '180 mil'},
  {id: 't3', route: 'San Jose, CA → Newark, NJ', meta: 'Tomorrow • 6:00PM', amount: '$990', miles: '180 mil'},
  {id: 't4', route: 'San Jose, CA → Newark, NJ', meta: 'Tomorrow • 6:00PM', amount: '$990', miles: '180 mil'},
  {id: 't5', route: 'San Jose, CA → Newark, NJ', meta: 'Tomorrow • 6:00PM', amount: '$990', miles: '180 mil'},
  {id: 't6', route: 'San Jose, CA → Newark, NJ', meta: 'Tomorrow • 6:00PM', amount: '$990', miles: '180 mil'},
  {id: 't7', route: 'San Jose, CA → Newark, NJ', meta: 'Tomorrow • 6:00PM', amount: '$990', miles: '180 mil'},
  {id: 't8', route: 'San Jose, CA → Newark, NJ', meta: 'Tomorrow • 6:00PM', amount: '$990', miles: '180 mil'},
  {id: 't9', route: 'San Jose, CA → Newark, NJ', meta: 'Tomorrow • 6:00PM', amount: '$990', miles: '180 mil'},
  {id: 't10', route: 'San Jose, CA → Newark, NJ', meta: 'Tomorrow • 6:00PM', amount: '$990', miles: '180 mil'},
  {id: 't11', route: 'San Jose, CA → Newark, NJ', meta: 'Tomorrow • 6:00PM', amount: '$990', miles: '180 mil'},
];

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const [selectedKey, setSelectedKey] = useState('d8');

  // iOS tab bar sits on top of the home-indicator safe area, so the list needs
  // extra bottom clearance there to avoid being hidden behind it.
  const listBottomGap = Platform.OS === 'ios' ? insets.bottom + 12 : 10;

  const featured = useMemo(() => FEATURED[selectedKey], [selectedKey]);
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
          title="Schedule"
          subtitle="Jun 2026 • 3 Bids"
          right={
            <TouchableOpacity style={styles.headerCalendarBtn} activeOpacity={0.8}>
              <ScheduleIcon width={20} height={20} color={colors.white} />
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
                  <AppText style={[styles.dayLabel, active && styles.dayLabelActive]}>
                    {d.day}
                  </AppText>
                  <AppText style={styles.dayNumber}>{d.date}</AppText>
                  <View style={d.dot ? styles.dayDot : styles.dayDotPlaceholder} />
                </TouchableOpacity>
              );
            })}
          </View>
        </DashboardHeader>

        {/* FEATURED CARD */}
        <View style={styles.featuredCard}>
          {featured ? (
            <>
              <View style={styles.featuredTopRow}>
                <View style={styles.featuredRouteWrap}>
                  <AppText style={styles.featuredRoute}>{featured.route}</AppText>
                  <AppText style={styles.featuredPickup}>{featured.pickup}</AppText>
                </View>
                <View>
                  <AppText style={styles.featuredAmount}>{featured.amount}</AppText>
                  <AppText style={styles.featuredMiles}>{featured.miles}</AppText>
                </View>
              </View>

              <View style={styles.featuredBottomRow}>
                <View style={styles.miniStatsGroup}>
                  <View style={styles.miniStat}>
                    <AppText style={styles.miniStatLabel}>Load</AppText>
                    <AppText style={styles.miniStatValue}>{featured.load}</AppText>
                  </View>
                  <View style={styles.miniStat}>
                    <AppText style={styles.miniStatLabel}>Payout</AppText>
                    <AppText style={styles.miniStatValue}>{featured.payout}</AppText>
                  </View>
                  <View style={styles.miniStat}>
                    <AppText style={styles.miniStatLabel}>Driven</AppText>
                    <AppText style={styles.miniStatValue}>{featured.driven}</AppText>
                  </View>
                </View>

                <TouchableOpacity style={styles.startBtn} activeOpacity={0.85}>
                  <AppText style={styles.startBtnText}>Start Trip</AppText>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <AppText style={styles.emptyTitle}>No Schedule Pickup</AppText>
              <AppText style={styles.emptySubtitle}>
                Trips that are scheduled for the day are shown here
              </AppText>
            </>
          )}
        </View>

        {/* TRANSACTIONS */}
        <FlatList
          data={TRIPS}
          keyExtractor={tx => tx.id}
          style={styles.listCard}
          contentContainerStyle={styles.listContent}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          renderItem={({item: tx, index}) => (
            <View
              style={[styles.row, index === TRIPS.length - 1 && styles.rowLast]}>
              <View style={styles.rowLeft}>
                <AppText style={styles.rowRoute}>{tx.route}</AppText>
                <AppText style={styles.rowMeta}>{tx.meta}</AppText>
              </View>
              <View style={styles.rowRight}>
                <AppText style={styles.rowAmount}>{tx.amount}</AppText>
                <AppText style={styles.rowMiles}>{tx.miles}</AppText>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
