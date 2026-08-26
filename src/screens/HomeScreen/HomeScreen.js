import React, {useMemo, useRef, useState} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import styles from './HomeScreen.styles';
import StatusBar from '../../component/StatusBar/StatusBar';
import DashboardHeader from '../../component/DashboardHeader/DashboardHeader';
import {DASHBOARD_STATS_OVERLAP} from '../../component/DashboardHeader/DashboardHeader.styles';
import FloatingMap from '../../component/FloatingMap/FloatingMap';
import Button from '../../component/Button/Button';
import {colors} from '../../theme/colors';
import {IS_TABLET} from '../../theme/device';
import AppText from '../../theme/AppText';
import TruckIcon from '../../assets/svg_icon/Frame_black.svg';
import Right_Arrow from '../../assets/svg_icon/right_Arrow.svg';
// import Strech_arrow_bottom from '../../assets/svg_icon/Strech_arrow_bottom.svg';
import StarIcon from '../../assets/svg_icon/Star_Vector.svg';
import Dropdown_icon from '../../assets/svg_icon/Dropdown_icon.svg';
import RouteStops from '../../component/RouteStops/RouteStops';
import LoadRoute from '../../component/LoadRoute/LoadRoute';
import DieselBadge from '../../component/DieselBadge/DieselBadge';
import Skeleton from '../../component/Skeleton/Skeleton';
import {
  HOS_CARD_BONES,
  REWARD_POINTS_BONES,
  TRIP_CARD_BONES,
  upcomingLoadBones,
} from '../../component/Skeleton/Skeleton.layouts';
import {logout} from '../../config/api';
import {
  syncTripSession,
  useTripSession,
} from '../../services/TripSessionService';
import {ms} from '../../theme/scale';
import Setting_Icon from '../../assets/svg_icon/Setting_Icon.svg';
import Logout_Icon from '../../assets/svg_icon/Logout_Icon.svg';
import Circle_two_way from '../../assets/svg_icon/circle_two_way.svg';
import Earning_sign from '../../assets/svg_icon/earning_sign.svg';
import Total_trip_Icon from '../../assets/svg_icon/Total_trip_Icon.svg';
import Notifcation_Icon from '../../assets/svg_icon/Notifcation_Icon.svg'
import useDriverRole from '../../hooks/useDriverRole';
import {
  CURRENT_TRIP_ID,
  formatMoney,
  startsInLabel,
  toDestination,
  toHosProgress,
  toRouteStops,
  toTripStats,
  tripStatusPill,
  useCurrentTrip,
} from './currentTrip';
import {useFuelReward} from './fuelReward';
import {toDutyPill, toHosBar, toHosDetails, useHosCard} from './hosCard';
import {
  toUpcomingLoads,
  useUpcomingShipments,
} from '../../services/upcomingShipments';

const {width: SCREEN_W} = Dimensions.get('window');

const FUEL_PUMP = require('../../assets/Image/fuel_pump.png');

const PRIMARY_GRADIENT = ['#00033E', '#0008A4'];

const STAT_ICON_SIZE = IS_TABLET ? 26 : 22;

const MILES_STAT = {
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
};

// Single drivers see what they made; fleet drivers are paid a salary, so the
// second card shows their trip count instead.
const EARNINGS_STAT = {
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
};

const TRIPS_STAT = {
  key: 'trips',
  icon: <Total_trip_Icon width={STAT_ICON_SIZE} height={STAT_ICON_SIZE} />,
  label: 'Total Trips',
  range: 'July',
  value: '12',
  delta: '8.9%',
  deltaUp: false,
  deltaNote: 'from Last Month',
  chartColor: colors.danger,
  chart: [50, 40, 52, 44, 54, 42, 50, 60],
};

const FLEET_STATS = [MILES_STAT, TRIPS_STAT];
const SINGLE_STATS = [MILES_STAT, EARNINGS_STAT];

// Fallback destination for START TRIP, used until the current-trip call
// answers (or when its last stop carries no coordinate). Only the drop is
// given — the pickup is always the driver's live GPS position.
const STATIC_TRIP = {
  destinationLocation: {
    latitude: 28.6050923,
    longitude: 77.2776434,
    description: 'Mayur Vihar Phase 1, Delhi, India',
  },
  destinationText: 'Mayur Vihar Phase 1, Delhi, India',
};

// `tripStatus.startsIn` is null on this backend for now. The pill still shows,
// but with no countdown invented — a made-up "1h 28 mins" reads as real data
// to a driver, where the ellipsis plainly says the time is not known yet.
const STARTS_IN_FALLBACK = 'Starts in …';

// The Upcoming Shipment card's placeholder rows. Fixed, so built once.
const LOAD_BONES = upcomingLoadBones(4);

const HomeScreen = () => {
  const navigation = useNavigation();
  const {isFleet} = useDriverRole();
  const stats = isFleet ? FLEET_STATS : SINGLE_STATS;
  const [mapVisible, setMapVisible] = useState(false);
  // A trip is "on" for as long as the HERE session is — that lives in the SDK,
  // not in this screen, so it survives ActiveTripScreen unmounting and is what
  // the floating map and the return banner both key off.
  const trip = useTripSession();
  const tripStarted = Boolean(trip);
  // The assigned trip itself, from the API. The id is fixed for now; it will
  // come from the driver's assignment once that endpoint lands.
  const {
    trip: currentTrip,
    loading: tripLoading,
    refresh: refreshCurrentTrip,
  } = useCurrentTrip(CURRENT_TRIP_ID);
  // Fuel Rewards balance. Its own call — the trip payload does not carry it.
  const {
    points: rewardPoints,
    loading: rewardLoading,
    refresh: refreshFuelReward,
  } = useFuelReward();
  // Hours of service — its own ELD-backed call, separate from the trip.
  const {
    hos: hosCard,
    loading: hosLoading,
    refresh: refreshHos,
  } = useHosCard();
  // Upcoming loads. The endpoint's `date` filter is left unset: no argument
  // means "whatever is next", which is what this card is for.
  const {
    shipments: upcoming,
    loading: upcomingLoading,
    error: upcomingError,
    refresh: refreshUpcoming,
  } = useUpcomingShipments();
  const upcomingLoads = useMemo(() => toUpcomingLoads(upcoming), [upcoming]);

  // Skeletons stand in for the first load of each call only. Every refresh
  // after that (coming back to Home, a reported fuel price) flips `loading`
  // again, and blanking a card the driver is already reading to shimmer at
  // them is worse than letting the figure update in place.
  const tripPending = tripLoading && !currentTrip;
  const rewardPending = rewardLoading && rewardPoints === null;
  const hosPending = hosLoading && !hosCard;
  const upcomingPending = upcomingLoading && !upcomingLoads.length;

  const statusPill = tripStatusPill(currentTrip);
  const startsIn = startsInLabel(currentTrip);
  const routeStops = toRouteStops(currentTrip);
  const tripStats = toTripStats(currentTrip);
  const hos = toHosProgress(currentTrip);
  // The standalone Hours of Service card, all of it from `/drivers/hos/card`.
  const dutyPill = toDutyPill(hosCard);
  const hosBar = toHosBar(hosCard);
  const hosDetails = toHosDetails(hosCard);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({top: 0, right: 0});
  // Upcoming loads collapse their middle stops; tapping a row (or its
  // "+N More …" chip) reveals every pickup and drop for that load.
  const [expandedLoads, setExpandedLoads] = useState({});
  const avatarRef = useRef(null);
  const firstFocusRef = useRef(true);

  const toggleLoad = id =>
    setExpandedLoads(prev => ({...prev, [id]: !prev[id]}));

  // Opening the trip screen is what starts the session; this only has to get
  // the driver there, whether the trip is new or already running.
  const openMap_Here = () => {
    navigation.navigate('ActiveTripScreen', {
      ...STATIC_TRIP,
      ...toDestination(currentTrip),
      ...(trip?.destinationLocation
        ? {
            destinationLocation: trip.destinationLocation,
            destinationText: trip.destinationText,
            sourceLocation: trip.sourceLocation,
            truckDetails: trip.truckDetails,
          }
        : null),
    });
  };

  const openMenu = () => {
    const node = avatarRef.current;
    if (node?.measureInWindow) {
      node.measureInWindow((x, y, width, height) => {
        setMenuPos({top: y + height + 8, right: SCREEN_W - (x + width)});
        setMenuOpen(true);
      });
    } else {
      setMenuOpen(true);
    }
  };

  const closeMenu = () => setMenuOpen(false);

  const goAccountSettings = () => {
    closeMenu();
    navigation.navigate('Profile');
  };

  const handleLogout = async () => {
    closeMenu();
    try {
      // Revokes the refresh token server-side, then clears local storage —
      // otherwise the stored refresh token would outlive the sign-out.
      await logout();
    } catch (e) {
      // Even if that fails, still return the user to login.
    }
    navigation.reset({index: 0, routes: [{name: 'LoginScreen'}]});
  };

  // Coming back to Home mid-trip: float the map, which picks the running HERE
  // navigation up and carries on showing it. The session is re-checked against
  // the SDK first, so a trip that ended while we were away (arrival, a stop
  // from the trip screen) does not leave a map floating over Home.
  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      syncTripSession().then(live => {
        if (!cancelled && live) setMapVisible(true);
      });
      // The hook already fetched on mount; every focus after that is a return
      // from somewhere else, where the ETA and hours left have moved on.
      if (firstFocusRef.current) {
        firstFocusRef.current = false;
      } else {
        refreshCurrentTrip();
        // A fuel price reported from the trip screen earns points, so the
        // balance has moved by the time the driver lands back here.
        refreshFuelReward();
        // A load that started while we were away is no longer upcoming.
        refreshUpcoming();
        // Driving minutes only ever move on, so the card is stale the moment
        // the driver leaves this screen.
        refreshHos();
      }
      return () => {
        cancelled = true;
      };
    }, [refreshCurrentTrip, refreshFuelReward, refreshHos, refreshUpcoming]),
  );

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
          icon={
            <TruckIcon
              width={IS_TABLET ? 28 : 16}
              height={IS_TABLET ? 28 : 16}
            />
          }
          title="CARRIER"
          headerStyle={styles.dashboardHeader}
          statsOffset={-DASHBOARD_STATS_OVERLAP}
          statsVariant="chart"
          right={
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.notificationBtn}
                activeOpacity={0.8}
                hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                onPress={() => navigation.navigate('NotificationScreen')}>
                <Notifcation_Icon
                  width={IS_TABLET ? 35 : 25}
                  height={IS_TABLET ? 35 : 25}
                />
              </TouchableOpacity>
              <DieselBadge value="$3.89/gal" />
              <TouchableOpacity
                ref={avatarRef}
                style={styles.avatarBtn}
                activeOpacity={0.85}
                onPress={openMenu}>
                <View style={styles.avatarCircle}>
                  <AppText style={styles.avatarInitials}>AG</AppText>
                </View>
                <Dropdown_icon
                  width={IS_TABLET ? 20 : 15}
                  height={IS_TABLET ? 20 : 15}
                  style={menuOpen && styles.avatarCaretOpen}
                />
              </TouchableOpacity>
            </View>
          }
          stats={stats}>
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
                {statusPill ? (
                  <View
                    style={[
                      styles.pill,
                      statusPill.late ? styles.pillDelayed : styles.pillOnTime,
                    ]}>
                    <AppText
                      style={
                        statusPill.late
                          ? styles.pillDelayedText
                          : styles.pillOnTimeText
                      }>
                      {statusPill.label}
                    </AppText>
                  </View>
                ) : null}
              </View>

              <Skeleton
                isLoading={tripPending}
                layout={TRIP_CARD_BONES}
                hasFadeIn>
                <View style={[styles.pill, styles.pillStartsIn]}>
                  <AppText style={styles.pillStartsInText}>
                    {startsIn || STARTS_IN_FALLBACK}
                  </AppText>
                </View>

                <View style={styles.payoutRow}>
                  <AppText style={styles.payoutValue}>
                    {formatMoney(currentTrip?.loadPayout)}
                  </AppText>
                  <AppText style={styles.payoutLabel}>Load payout</AppText>
                </View>

                <View style={styles.routeBox}>
                  <RouteStops
                    stops={routeStops || []}
                    showSummary
                    liveCurrentLocation
                  />
                </View>

                <View style={styles.tripStatsDivider} />
                <View style={styles.tripStatsRow}>
                  {tripStats.map((item, index) => (
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
                    {hos.label}
                  </AppText>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[styles.progressFill, {width: hos.width}]}
                  />
                </View>
              </Skeleton>

              <Button
                title={tripStarted ? 'TRIP ONGOING' : 'START TRIP'}
                onPress={openMap_Here}
                backgroundColor={
                  tripStarted ? colors.warning_text : colors.accentBlueLight
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
                {/* No pill at all until the duty status is known — an
                    invented one is a compliance figure the driver would act
                    on. */}
                {dutyPill && (
                  <View
                    style={[
                      styles.pill,
                      dutyPill.active
                        ? styles.pillOnDuty
                        : styles.pillOffDuty,
                    ]}>
                    <AppText
                      style={
                        dutyPill.active
                          ? styles.pillOnDutyText
                          : styles.pillOffDutyText
                      }>
                      {dutyPill.label}
                    </AppText>
                  </View>
                )}
              </View>

              <Skeleton loading={hosPending} bones={HOS_CARD_BONES}>
                <View style={styles.hosDrivenRow}>
                  <AppText style={styles.hosDrivenText}>
                    {hosBar.driven}
                  </AppText>
                  <AppText style={styles.hosRemText}>{hosBar.total}</AppText>
                </View>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      hosBar.critical
                        ? styles.progressFillDanger
                        : styles.progressFillWarn,
                      {width: hosBar.width},
                    ]}
                  />
                </View>

                {hosDetails.map((item, index) => (
                  <View
                    key={item.label}
                    style={[
                      styles.detailRow,
                      index === hosDetails.length - 1 && styles.detailRowLast,
                    ]}>
                    <AppText style={styles.detailLabel}>{item.label}</AppText>
                    <AppText style={styles.detailValue}>{item.value}</AppText>
                  </View>
                ))}
              </Skeleton>
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
                <AppText style={styles.rewardsLabel}>Fuel Rewards </AppText>
              </View>
              <AppText style={styles.rewardsTitle}>
                Report your fuel price, earn points
              </AppText>
              <AppText style={styles.rewardsBody} numberOfLines={3}>
                Enter the diesel price at your nearest{'\n'}
                station. Every verified report earns you{'\n'}
                points — redeem for bonuses & perks.
              </AppText>

              <View style={styles.rewardsBalanceRow}>
                <View style={styles.rewardsStarBadge}>
                  <View style={styles.rewardsStarRing}>
                    <StarIcon
                      width={IS_TABLET ? ms(10) : ms(8)}
                      height={IS_TABLET ? ms(10) : ms(8)}
                    />
                  </View>
                </View>
                <View style={styles.rewardsBalanceTextWrap}>
                  <AppText style={styles.rewardsBalanceLabel}>
                    Your Points Balance
                  </AppText>
                  <Skeleton
                    isLoading={rewardPending}
                    layout={REWARD_POINTS_BONES}
                    onDark
                    hasFadeIn>
                    <AppText style={styles.rewardsPoints}>
                      {rewardPoints ?? 0}
                      <AppText style={styles.rewardsPointsUnit}> pts</AppText>
                    </AppText>
                  </Skeleton>
                </View>
              </View>
            </View>

            {/* Upcoming loads */}
            <View style={[styles.card, styles.loadsCard]}>
              <View style={styles.loadsHeader}>
                <AppText style={styles.loadsHeaderText}>
                  Upcoming Shipment
                </AppText>
              </View>
              <View style={styles.loadsScrollWrap}>
                <ScrollView
                  style={StyleSheet.absoluteFill}
                  nestedScrollEnabled
                  bounces
                  showsVerticalScrollIndicator={false}>
                  {upcomingLoads.map((load, index) => (
                    <TouchableOpacity
                      key={load.id}
                      activeOpacity={load.stops.length > 2 ? 0.7 : 1}
                      disabled={load.stops.length <= 2}
                      onPress={() => toggleLoad(load.id)}
                      style={[
                        styles.loadRow,
                        index === 0 && styles.loadRowFirst,
                      ]}>
                      <View style={styles.loadRouteCol}>
                        <LoadRoute
                          stops={load.stops}
                          typed
                          showSummary
                          stopGap
                          collapsed={!expandedLoads[load.id]}
                          onPressMore={() => toggleLoad(load.id)}
                        />
                      </View>

                      <AppText style={styles.loadWhen} numberOfLines={1}>
                        {load.when}
                      </AppText>
                    </TouchableOpacity>
                  ))}

                  {/* Still loading: rows the driver can see filling in,
                      shaped like the ones that are coming. */}
                  {upcomingPending && <Skeleton isLoading layout={LOAD_BONES} />}

                  {/* Answered with nothing (or failed): say which, rather than
                      leaving the driver an empty box. */}
                  {!upcomingPending && !upcomingLoads.length && (
                    <View style={styles.loadsEmpty}>
                      <AppText style={styles.loadsEmptyText}>
                        {upcomingError || 'No upcoming shipments'}
                      </AppText>
                    </View>
                  )}
                </ScrollView>
              </View>

              {/* The card has no padding of its own (the blue header bleeds to
                  its edges), so this supplies the bottom breathing room. */}
              <View style={styles.loadChevron} />
            </View>
          </View>
        </View>
      </ScrollView>

      {tripStarted && !mapVisible && (
        <TouchableOpacity
          style={styles.tripBanner}
          activeOpacity={0.85}
          onPress={openMap_Here}>
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

      {/* Profile dropdown anchored under the header avatar */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}>
        <View style={{flex: 1}}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeMenu}
          />
          <View
            style={[styles.menuCard, {top: menuPos.top, right: menuPos.right}]}>
            <View style={styles.menuHeaderRow}>
              <View style={styles.menuAvatar}>
                <AppText style={styles.menuAvatarText}>AG</AppText>
              </View>
              <AppText style={styles.menuName}>Ashutosh Gangwar</AppText>
            </View>

            <View style={styles.menuDivider} />

            {/* Fleet drivers reach Profile from their bottom Settings tab, so
                the dropdown only offers it to single drivers. */}
            {!isFleet && (
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={goAccountSettings}>
                <View style={styles.menuItemIcon}>
                  <Setting_Icon width={18} height={18} />
                </View>
                <AppText style={styles.menuItemText}>Account Settings</AppText>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={handleLogout}>
              <View style={styles.menuItemIcon}>
                <Logout_Icon width={18} height={18} />
              </View>
              <AppText style={[styles.menuItemText, styles.menuItemLogout]}>
                Logout
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Draggable floating HERE map — movable anywhere on the screen. While a
          trip is on it shows that trip's live HERE navigation, still guiding;
          tapping its footer returns to the full trip screen. */}
      <FloatingMap
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        onExpand={openMap_Here}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;
