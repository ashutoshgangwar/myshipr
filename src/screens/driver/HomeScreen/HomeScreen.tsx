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
import StatusBar from '../../../component/StatusBar/StatusBar';
import DashboardHeader from '../../../component/DashboardHeader/DashboardHeader';
import {DASHBOARD_STATS_OVERLAP} from '../../../component/DashboardHeader/DashboardHeader.styles';
import FloatingMap from '../../../component/FloatingMap/FloatingMap';
import Button from '../../../component/Button/Button';
import {colors} from '../../../theme/colors';
import {IS_TABLET} from '../../../theme/device';
import AppText from '../../../theme/AppText';
import TruckIcon from '../../../assets/svg_icon/Frame_black.svg';
import Right_Arrow from '../../../assets/svg_icon/right_Arrow.svg';
// import Strech_arrow_bottom from '../../../assets/svg_icon/Strech_arrow_bottom.svg';
import StarIcon from '../../../assets/svg_icon/Star_Vector.svg';
import Dropdown_icon from '../../../assets/svg_icon/Dropdown_icon.svg';
import RouteStops from '../../../component/RouteStops/RouteStops';
import LoadRoute from '../../../component/LoadRoute/LoadRoute';
import DieselPriceBadge from '../../../component/DieselBadge/DieselPriceBadge';
import Skeleton from '../../../component/Skeleton/Skeleton';
import {
  HOS_CARD_BONES,
  REWARD_POINTS_BONES,
  TRIP_CARD_BONES,
  upcomingLoadBones,
} from '../../../component/Skeleton/Skeleton.layouts';
import {logout} from '../../../config/api';
import {startHosTrip} from '../../../config/driverApi';
import {
  syncTripSession,
  useTripSession,
} from '../../../services/TripSessionService';
import {ms} from '../../../theme/scale';
import Setting_Icon from '../../../assets/svg_icon/Setting_Icon.svg';
import Logout_Icon from '../../../assets/svg_icon/Logout_Icon.svg';
import Circle_two_way from '../../../assets/svg_icon/circle_two_way.svg';
import Earning_sign from '../../../assets/svg_icon/earning_sign.svg';
import Total_trip_Icon from '../../../assets/svg_icon/Total_trip_Icon.svg';
import Notifcation_Icon from '../../../assets/svg_icon/Notifcation_Icon.svg'
import useDriverRole from '../../../hooks/useDriverRole';
import useOrganizationType from '../../../hooks/useOrganizationType';
import {
  CURRENT_TRIP_ID,
  formatMoney,
  startsInLabel,
  toDestination,
  toHosProgress,
  toRouteStops,
  toTripStats,
  toTripStopTargets,
  toTruckDetails,
  tripShipmentId,
  tripStatusPill,
  useCurrentTrip,
} from './currentTrip';
import {useCurrentLocationLabel} from '../../../services/currentLocation';
import {useFuelReward} from '../../../services/fuelReward';
import {refreshFuelPrice} from '../../../services/fuelPrice';
import {openFuelPriceEntry} from '../../../services/fuelPricePrompt';
import {toDutyPill, toHosBar, toHosDetails, useHosCard} from './hosCard';
import {
  todayIso,
  toUpcomingLoads,
  useUpcomingShipments,
} from '../../../services/upcomingShipments';
import {toMilesCard, useMonthlyMiles} from '../../../services/monthlyMiles';
import {
  toEarningsCard,
  useMonthlyEarnings,
} from '../../../services/monthlyEarnings';
import {toTripsCard, useMonthlyTrips} from '../../../services/monthlyTrips';

const {width: SCREEN_W} = Dimensions.get('window');

const FUEL_PUMP = require('../../../assets/Image/fuel_pump.png');

const PRIMARY_GRADIENT = [colors.primary, colors.primaryGradientEnd];

const STAT_ICON_SIZE = IS_TABLET ? 26 : 22;

// Value, month, sparkline and delta pill are all spread over this from
// `toMilesCard`; what stays here is the design's own furniture.
const MILES_STAT = {
  key: 'miles',
  icon: <Circle_two_way width={STAT_ICON_SIZE} height={STAT_ICON_SIZE} />,
  label: 'Monthly Miles',
  deltaNote: 'from Last Month',
  chartColor: colors.success,
};

// Fed the same way as the miles card above, from `toEarningsCard`.
const EARNINGS_STAT = {
  key: 'earnings',
  icon: <Earning_sign width={STAT_ICON_SIZE} height={STAT_ICON_SIZE} />,
  label: 'Monthly Earnings',
  deltaNote: 'from Last Month',
  chartColor: colors.danger,
};

// The fleet driver's second card, fed the same way from `toTripsCard` — the
// sparkline included, which used to be the placeholder line below.
const TRIPS_STAT = {
  key: 'trips',
  icon: <Total_trip_Icon width={STAT_ICON_SIZE} height={STAT_ICON_SIZE} />,
  label: 'Total Trips',
  deltaNote: 'from Last Month',
  chartColor: colors.danger,
};
const STATIC_TRIP = {
  destinationLocation: {
    latitude: 28.6050923,
    longitude: 77.2776434,
    description: 'Mayur Vihar Phase 1, Delhi, India',
  },
  destinationText: 'Mayur Vihar Phase 1, Delhi, India',
};

const STARTS_IN_FALLBACK = 'Starts in …';

const LOAD_BONES = upcomingLoadBones(4);

const HomeScreen = () => {
  const navigation = useNavigation();
  const {isFleet} = useDriverRole();
  const organizationType = useOrganizationType();
  const [mapVisible, setMapVisible] = useState(false);
  const trip = useTripSession();
  const tripStarted = Boolean(trip);
  const {
    trip: currentTrip,
    loading: tripLoading,
    refresh: refreshCurrentTrip,
  } = useCurrentTrip(CURRENT_TRIP_ID);
  // The fix refreshes itself off the device; the header does not re-ask for
  // one on every focus, which was a GPS read and a reverse-geocode per visit.
  const {label: locationLabel} = useCurrentLocationLabel();
  // The rewards card's balance. A price report credits it, and the prompt that
  // files the report (`component/FuelPricePrompt`) re-reads it; this card is
  // subscribed through the shared cache, so it redraws on its own.
  const {
    points: rewardPoints,
    loading: rewardLoading,
    refresh: refreshFuelReward,
  } = useFuelReward();
  const {
    hos: hosCard,
    loading: hosLoading,
    refresh: refreshHos,
  } = useHosCard();
  const today = useMemo(() => todayIso(), []);
  const {
    shipments: upcoming,
    loading: upcomingLoading,
    error: upcomingError,
    refresh: refreshUpcoming,
  } = useUpcomingShipments(today);
  const upcomingLoads = useMemo(() => toUpcomingLoads(upcoming), [upcoming]);


  const {
    miles: monthlyMiles,
    loading: milesLoading,
    refresh: refreshMonthlyMiles,
  } = useMonthlyMiles();
  const {
    earnings: monthlyEarnings,
    loading: monthlyEarningsLoading,
    refresh: refreshMonthlyEarnings,
  } = useMonthlyEarnings();
  const {
    trips: monthlyTrips,
    loading: monthlyTripsLoading,
    refresh: refreshMonthlyTrips,
  } = useMonthlyTrips();
  const stats = useMemo(() => {
    const milesStat = {
      ...MILES_STAT,
      ...toMilesCard(monthlyMiles),
      loading: milesLoading && !monthlyMiles,
    };
    if (isFleet)
      return [
        milesStat,
        {
          ...TRIPS_STAT,
          ...toTripsCard(monthlyTrips),
          loading: monthlyTripsLoading && !monthlyTrips,
        },
      ];
    return [
      milesStat,
      {
        ...EARNINGS_STAT,
        ...toEarningsCard(monthlyEarnings),
        loading: monthlyEarningsLoading && !monthlyEarnings,
      },
    ];
  }, [
    isFleet,
    milesLoading,
    monthlyEarnings,
    monthlyEarningsLoading,
    monthlyMiles,
    monthlyTrips,
    monthlyTripsLoading,
  ]);

  const tripPending = tripLoading && !currentTrip;

  const canStartTrip = Boolean(currentTrip) || tripStarted;
  const hasCurrentTrip = Boolean(currentTrip);
  const rewardPending = rewardLoading && rewardPoints === null;
  const hosPending = hosLoading && !hosCard;
  const upcomingPending = upcomingLoading && !upcomingLoads.length;

  const statusPill = tripStatusPill(currentTrip);
  const startsIn = startsInLabel(currentTrip);
  const routeStops = toRouteStops(currentTrip);
  const tripStats = toTripStats(currentTrip);
  const hos = toHosProgress(currentTrip);
  const dutyPill = toDutyPill(hosCard);
  const hosBar = toHosBar(hosCard);
  const hosDetails = toHosDetails(hosCard);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({top: 0, right: 0});
  const [expandedLoads, setExpandedLoads] = useState<Record<string, boolean>>(
    {},
  );
  const avatarRef = useRef<React.ComponentRef<typeof View> | null>(null);

  const toggleLoad = (id: string) =>
    setExpandedLoads(prev => ({...prev, [id]: !prev[id]}));

  const openMap_Here = () => {
    if (!canStartTrip) return;

    navigation.navigate('ActiveTripScreen', {
      ...STATIC_TRIP,
      ...toDestination(currentTrip),
      tripId: currentTrip?.tripId || CURRENT_TRIP_ID,
      shipmentId: tripShipmentId(currentTrip) || CURRENT_TRIP_ID,
      stops: toTripStopTargets(currentTrip),
      awb: currentTrip?.awb,
      ...(trip?.destinationLocation
        ? {
            destinationLocation: trip.destinationLocation,
            destinationText: trip.destinationText,
            sourceLocation: trip.sourceLocation,
          }
        : null),
      // The load's own equipment is what the truck route is built for. The
      // running session's copy wins when there is one — it is the profile the
      // route already on screen was calculated with, and swapping it mid-trip
      // would reroute the driver for a different vehicle.
      truckDetails: trip?.truckDetails ?? toTruckDetails(currentTrip),
    });
  };


  const startTrip = () => {
    if (!canStartTrip) return;

    if (!tripStarted) {
      startHosTrip()
        // Forced past the TTL: the card must show the trip that was just
        // started, not the pre-trip figures cached seconds ago.
        .then(() => refreshHos({force: true}))
        .catch(() => {});
    }

    openMap_Here(); 
  };

  const openMenu = () => {
    const node = avatarRef.current;
    if (node?.measureInWindow) {
      node.measureInWindow((x: number, y: number, width: number, height: number) => {
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
      await logout();
    } catch {
    }
    navigation.reset({index: 0, routes: [{name: 'LoginScreen'}]});
  };

  // Every call below is behind a TTL of its own, so this asks each card
  // whether it has gone stale rather than re-fetching the dashboard. Coming
  // back from the trip screen a minute later costs nothing; coming back after
  // a long run refreshes only the cards whose window has actually passed.
  // That is what the first-focus guard here used to approximate — badly, since
  // it skipped the mount's own focus and then refetched everything on every
  // one after it.
  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      syncTripSession().then(live => {
        if (!cancelled && live) setMapVisible(true);
      });
      refreshCurrentTrip();
      refreshFuelReward();
      refreshUpcoming();
      refreshHos();
      refreshFuelPrice();
      refreshMonthlyMiles();
      refreshMonthlyEarnings();
      refreshMonthlyTrips();
      return () => {
        cancelled = true;
      };
    }, [
      refreshCurrentTrip,
      refreshFuelReward,
      refreshHos,
      refreshMonthlyEarnings,
      refreshMonthlyMiles,
      refreshMonthlyTrips,
      refreshUpcoming,
    ]),
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
          title={organizationType ?? ''}
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

              <DieselPriceBadge onPress={openFuelPriceEntry} />
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
          <AppText style={styles.headerLocation} numberOfLines={1}>
            {locationLabel}
          </AppText>
          <AppText style={styles.headerWelcome}>Welcome Back, Ashutosh Gangwar</AppText>
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
                {hasCurrentTrip && (
                  <View style={[styles.pill, styles.pillStartsIn]}>
                    <AppText style={styles.pillStartsInText}>
                      {startsIn || STARTS_IN_FALLBACK}
                    </AppText>
                  </View>
                )}

                {hasCurrentTrip ? (
                  <>
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
                  </>
                ) : (
                  <View style={styles.tripEmpty}>
                    <AppText style={styles.tripEmptyText}>
                      You do not have any trip currently
                    </AppText>
                  </View>
                )}

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
                onPress={startTrip}
                disabled={!canStartTrip}
                backgroundColor={
                  tripStarted
                    ? colors.amber800
                    : canStartTrip
                    ? colors.accentBlue
                    : colors.textMuted
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

              <Skeleton isLoading={hosPending} layout={HOS_CARD_BONES}>
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

                  {upcomingPending && <Skeleton isLoading layout={LOAD_BONES} />}

                  {!upcomingPending && !upcomingLoads.length && (
                    <View style={styles.loadsEmpty}>
                      <AppText style={styles.loadsEmptyText}>
                        {upcomingError || 'No upcoming shipments'}
                      </AppText>
                    </View>
                  )}
                </ScrollView>
              </View>
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
      
      <FloatingMap
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        onExpand={openMap_Here}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;
