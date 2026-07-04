import React, {useState} from 'react';
import {
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import styles from './HomeScreen.styles';
import StatusBar from '../../component/StatusBar/StatusBar';
import DashboardHeader from '../../component/DashboardHeader/DashboardHeader';
import FloatingMap from '../../component/FloatingMap/FloatingMap';
import Button from '../../component/Button/Button';
import {colors} from '../../theme/colors';
import {IS_TABLET} from '../../theme/device';
import AppText from '../../theme/AppText';
import TruckIcon from '../../assets/svg_icon/Frame_black.svg';
import Right_Arrow from '../../assets/svg_icon/right_Arrow.svg';
import Strech_arrow_bottom from '../../assets/svg_icon/Strech_arrow_bottom.svg';
import StarIcon from '../../assets/svg_icon/Star_Vector.svg';

const FUEL_PUMP = require('../../assets/Image/fuel_pump.png');

const PRIMARY_GRADIENT = ['#00033E', '#0008A4'];

const STATS = [
  {
    label: 'Miles • Week',
    value: '1,234',
    note: '↑ 8% vs last week',
    noteColor: colors.success,
    accent: colors.warning,
  },
  {
    label: 'Earnings',
    value: '$1,234',
    note: '↓ $200 this week',
    noteColor: colors.danger,
    accent: colors.success,
  },
  {
    label: 'Net Profit',
    value: '$879',
    note: 'after all costs',
    noteColor: colors.textMuted,
    accent: colors.accentBlue,
  },
  {
    label: 'Fuel Saved',
    value: '$1,234',
    note: 'Route Optimization',
    noteColor: colors.accentBlue,
    accent: colors.warning,
  },
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
  // {label: 'Driving Status', value: 'On DUTY', strong: true},
];

const UPCOMING_LOADS = [
  {
    id: 'u1',
    route: 'San Jose, CA → Newark, NJ',
    pickup: 'Tomorrow • 6:00 AM pickup',
    pay: '$980',
    miles: '180 mil',
  },
  {
    id: 'u2',
    route: 'San Jose, CA → Newark, NJ',
    pickup: 'Wed • 2:00 PM pickup',
    pay: '$980',
    miles: '180 mil',
  },
  {
    id: 'u3',
    route: 'San Jose, CA → Newark, NJ',
    pickup: 'Wed • 2:00 PM pickup',
    pay: '$980',
    miles: '180 mil',
  },
  {
    id: 'u4',
    route: 'San Jose, CA → Newark, NJ',
    pickup: 'Wed • 2:00 PM pickup',
    pay: '$980',
    miles: '180 mil',
  },
  {
    id: 'u5',
    route: 'San Jose, CA → Newark, NJ',
    pickup: 'Wed • 2:00 PM pickup',
    pay: '$980',
    miles: '180 mil',
  },
  {
    id: 'u6',
    route: 'San Jose, CA → Newark, NJ',
    pickup: 'Wed • 2:00 PM pickup',
    pay: '$980',
    miles: '180 mil',
  },
  {
    id: 'u7',
    route: 'San Jose, CA → Newark, NJ',
    pickup: 'Wed • 2:00 PM pickup',
    pay: '$980',
    miles: '180 mil',
  },
   {
    id: 'u8',
    route: 'San Jose, CA → Newark, NJ',
    pickup: 'Wed • 2:00 PM pickup',
    pay: '$980',
    miles: '180 mil',
  },
   {
    id: 'u9',
    route: 'San Jose, CA → Newark, NJ',
    pickup: 'Wed • 2:00 PM pickup',
    pay: '$9180',
    miles: '180 mil',
  },
];

const HomeScreen = () => {
  const navigation = useNavigation();
  const [mapVisible, setMapVisible] = useState(false);
  const [tripStarted, setTripStarted] = useState(false);

  const openMap_Here = () => {
    setTripStarted(true);
    navigation.navigate('ActiveTripScreen');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        backgroundColor={colors.primary}
        barStyle="light-content"
        translucent={false}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          tripStarted && !mapVisible && styles.scrollContentWithBanner,
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never">
        {/* HEADER */}
        <DashboardHeader
          icon={<TruckIcon width={20} height={20} />}
          title="CARRIER"
          right={
            <View style={styles.dieselBadge}>
              <AppText style={styles.dieselLabel}>DIESEL</AppText>
              <AppText style={styles.dieselValue}>$3.89/gal</AppText>
            </View>
          }
          stats={STATS}>
          <AppText style={styles.headerLocation}>Dallas, TX</AppText>
          <AppText style={styles.headerWelcome}>Welcome Back, Ashutosh</AppText>
        </DashboardHeader>

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
                <AppText style={styles.payoutLabel}>Load payout</AppText>
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

              <View style={styles.tripStatsDivider} />
              <View style={styles.tripStatsRow}>
                {TRIP_STATS.map((item, index) => (
                  <React.Fragment key={item.label}>
                    {index > 0 && <View style={styles.tripStatSeparator} />}
                    <View style={styles.tripStatItem}>
                      <AppText style={styles.tripStatValue}>
                        {item.value}
                      </AppText>
                      <AppText style={styles.tripStatLabel}>
                        {item.label}
                      </AppText>
                    </View>
                  </React.Fragment>
                ))}
              </View>

              <View style={styles.progressHeaderRow}>
                <AppText style={styles.progressCaption}>
                  Hours of Service
                </AppText>
                <AppText style={styles.progressCaptionAccent}>
                  2h 23m left
                </AppText>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, {width: '60%'}]} />
              </View>

              <Button
                title={tripStarted ? 'TRIP ONGOING' : 'START TRIP'}
                onPress={openMap_Here}
                backgroundColor={
                  tripStarted ? colors.warning_text : colors.accentBlue
                }
                textColor={colors.white}
                style={styles.primaryBtn}
                textStyle={styles.primaryBtnText}
              />
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
                  style={[
                    styles.progressFill,
                    styles.progressFillWarn,
                    {width: '77%'},
                  ]}
                />
              </View>

              {HOS_DETAILS.map(item => (
                <View key={item.label} style={styles.detailRow}>
                  <AppText style={styles.detailLabel}>{item.label}</AppText>
                  <AppText
                    style={
                      item.strong
                        ? styles.detailValueStrong
                        : styles.detailValue
                    }>
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
              <LinearGradient
                colors={PRIMARY_GRADIENT}
                start={{x: 1, y: 1}}
                end={{x: 0, y: 0}}
                style={StyleSheet.absoluteFill}
              />
              <Image
                source={FUEL_PUMP}
                style={styles.rewardsPumpImage}
                resizeMode="contain"
              />
              <View style={styles.rewardsBadge}>
                <AppText style={styles.rewardsLabel}>Fuel Rewards</AppText>
              </View>
              <AppText style={styles.rewardsTitle}>
                Report your fuel price, earn points
              </AppText>
              <AppText style={styles.rewardsBody}>
                Enter the diesel price at your nearest station. Every verified
                report earns you points — redeem for bonuses & perks.
              </AppText>

              <View style={styles.rewardsBalanceRow}>
                <View style={styles.rewardsStarBadge}>
                  <View style={styles.rewardsStarRing}>
                    <StarIcon width={16} height={15} />
                  </View>
                </View>
                <View style={styles.rewardsBalanceTextWrap}>
                  <AppText style={styles.rewardsBalanceLabel}>
                    Your Points Balance
                  </AppText>
                  <AppText style={styles.rewardsPoints}>
                    1,234
                    <AppText style={styles.rewardsPointsUnit}> pts</AppText>
                  </AppText>
                </View>
              </View>
              {/* points value sits inline beside the label icon */}
              <View style={styles.rewardsTrackRow}>
                <View style={styles.rewardsTrack}>
                  <View style={[styles.rewardsFill, {width: '61%'}]} />
                </View>
                <View style={styles.rewardsPercentBadge}>
                  <AppText style={styles.rewardsPercentText}>61%</AppText>
                </View>
              </View>
              <View style={styles.rewardsFooterRow}>
                <AppText style={styles.rewardsFooterText}>
                  <AppText style={styles.rewardsFooterAccent}>2,983</AppText>{' '}
                  points to next reward
                </AppText>
                <AppText style={styles.rewardsFooterValue}>2000 pts</AppText>
              </View>
            </View>

            {/* Upcoming loads */}
            <View style={[styles.card, styles.loadsCard]}>
              <AppText style={styles.cardTitle}>Upcoming loads</AppText>

              {/* flex:1 box sized by the column stretch; the absolute-fill
                  ScrollView fills it without inflating the column height. */}
              <View style={styles.loadsScrollWrap}>
                <ScrollView
                  style={StyleSheet.absoluteFill}
                  nestedScrollEnabled
                  bounces
                  showsVerticalScrollIndicator={false}>
                  {UPCOMING_LOADS.map((load, index) => (
                    <View
                      key={load.id}
                      style={[
                        styles.loadRow,
                        index === 0 && styles.loadRowFirst,
                      ]}>
                      <View style={{flex: 1, paddingRight: 8}}>
                        <AppText style={styles.loadRoute}>{load.route}</AppText>
                        <AppText style={styles.loadPickup}>
                          {load.pickup}
                        </AppText>
                      </View>
                      <View style={styles.loadRight}>
                        <AppText style={styles.loadPay}>{load.pay}</AppText>
                        <AppText style={styles.loadMiles}>{load.miles}</AppText>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>

              <TouchableOpacity style={styles.loadChevron} activeOpacity={0.7}>
                <Strech_arrow_bottom width={20} height={20} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {tripStarted && !mapVisible && (
        <TouchableOpacity
          style={styles.tripBanner}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('ActiveTripScreen')}>
          <View style={styles.tripBannerTextWrap}>
            <AppText style={styles.tripBannerTitle}>Trip in Progress</AppText>
            <AppText style={styles.tripBannerSubtitle}>TAP to return</AppText>
          </View>
          <Right_Arrow
            width={IS_TABLET ? 32 : 20}
            height={IS_TABLET ? 32 : 20}
          />
        </TouchableOpacity>
      )}

      {/* Draggable floating HERE map — movable anywhere on the screen */}
      <FloatingMap visible={mapVisible} onClose={() => setMapVisible(false)} />
    </SafeAreaView>
  );
};

export default HomeScreen;
