import React, {useRef, useState} from 'react';
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
import FloatingMap from '../../component/FloatingMap/FloatingMap';
import Button from '../../component/Button/Button';
import {colors} from '../../theme/colors';
import {IS_TABLET} from '../../theme/device';
import AppText from '../../theme/AppText';
import TruckIcon from '../../assets/svg_icon/Frame_black.svg';
import Right_Arrow from '../../assets/svg_icon/right_Arrow.svg';
import Strech_arrow_bottom from '../../assets/svg_icon/Strech_arrow_bottom.svg';
import StarIcon from '../../assets/svg_icon/Star_Vector.svg';
import Dropdown_icon from '../../assets/svg_icon/Dropdown_icon.svg';
import Profile_icon from '../../assets/svg_icon/profile_icon.svg';
import RouteStops from '../../component/RouteStops/RouteStops';
import LoadRoute from '../../component/LoadRoute/LoadRoute';
import DieselBadge from '../../component/DieselBadge/DieselBadge';
import {clearSession} from '../../services/api/AuthService';
import { ms } from '../../theme/scale';
import Gray_truck from '../../assets/svg_icon/gray_truck.svg';
import Ltl_Arrow from '../../assets/svg_icon/Ltl_Arrow.svg';
import Multileg_icon from '../../assets/svg_icon/multileg_icon.svg';
import Setting_Icon from '../../assets/svg_icon/Setting_Icon.svg';
import Logout_Icon from '../../assets/svg_icon/Logout_Icon.svg'


const {width: SCREEN_W} = Dimensions.get('window');

const FUEL_PUMP = require('../../assets/Image/fuel_pump.png');

const PRIMARY_GRADIENT = ['#00033E', '#0008A4'];

const STATS = [
  {
    key: 'miles',
    label: 'Weekly Miles',
    range: '13 July - 19 July',
    value: '1,234',
    note: '↑ 8% vs last week',
    noteColor: colors.success,
    accent: colors.warning,
    chartColor: colors.success,
    chart: [30, 42, 38, 55, 50, 62, 72],
  },
  {
    key: 'earnings',
    label: 'Weekly Earnings',
    range: '13 July - 19 July',
    value: '$1,234',
    note: '↓ $200 this week',
    noteColor: colors.danger,
    accent: colors.warning,
    chartColor: colors.danger,
    chart: [50, 40, 52, 44, 54, 42, 50, 60],
  },
];

const TRIP_STATS = [
  {value: '245 mi', label: 'Distance'},
  {value: '4h 10m', label: 'Est. time'},
  {value: 'I-45 S', label: 'Route'},
  {value: '12:10 PM', label: 'ETA'},
];

const CURRENT_TRIP_STOPS = [
  {kind: 'current'},
  {kind: 'pickup', sub: '8.00–8.30 AM'},
  {kind: 'pickup', sub: '9.00–9.30 AM'},
  {kind: 'drop', sub: '2.30 PM'},
];

const HOS_DETAILS = [
  {label: 'Remaining Driving Hours', value: '34h 10m'},
  {label: 'Cycle Remaining', value: '2h 10m'},
  {label: 'Reset Available', value: 'Tomorrow 8:00 AM'},
];

const UPCOMING_LOADS = [
  {
    id: 'u1',
    type: 'FTL',
    time: '6.00 Pm',
    date: 'Today',
    urgent: true,
    pay: '$900',
    miles: '180 miles',
    stops: ['San Jose CA', 'Newark NJ'],
  },
  {
    id: 'u2',
    type: 'LTL',
    time: '6.00 Pm',
    date: '17 July',
    urgent: false,
    pay: '$900',
    miles: '180 miles',
    stops: ['San Jose CA', 'Newark NJ', 'Newark NJ'],
  },
  {
    id: 'u3',
    type: 'Multileg',
    time: '6.00 Pm',
    date: '17 July',
    urgent: false,
    pay: '$900',
    miles: '180 miles',
    stops: ['San Jose CA', 'San Jose CA', 'Newark NJ', 'Newark NJ'],
  },
];

const LOAD_TYPE_ICON = {
  FTL: Gray_truck,
  LTL: Ltl_Arrow,
  Multileg: Multileg_icon,
};

const LoadTypeBadge = ({type}) => {
  const Icon = LOAD_TYPE_ICON[type];
  return (
    <View style={styles.loadTypeBadge}>
      {Icon ? (
        <Icon width={ms(12)} height={ms(12)} style={styles.loadTypeIcon} />
      ) : (
        <View style={styles.loadTypeIconPlaceholder} />
      )}
      <AppText style={styles.loadTypeText}>{type}</AppText>
    </View>
  );
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const [mapVisible, setMapVisible] = useState(false);
  const [tripStarted, setTripStarted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({top: 0, right: 0});
  const avatarRef = useRef(null);

  const openMap_Here = () => {
    setTripStarted(true);
    navigation.navigate('ActiveTripScreen');
  };

  // Anchor the dropdown under the avatar (works on both tablet and phone
  // regardless of safe-area insets) by measuring the button in-window.
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
      await clearSession();
    } catch (e) {
      // Even if clearing storage fails, still return the user to login.
    }
    navigation.reset({index: 0, routes: [{name: 'LoginScreen'}]});
  };

  // When the user comes back to Home while a trip is ongoing, float the map.
  useFocusEffect(
    React.useCallback(() => {
      if (tripStarted) {
        setMapVisible(true);
      }
    }, [tripStarted]),
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
          icon={<TruckIcon width={20} height={20} />}
          title="CARRIER"
          headerStyle={styles.dashboardHeader}
          statsOffset={IS_TABLET ? -ms(95) : -ms(80)}
          statsVariant="chart"
          right={
            <View style={styles.headerRight}>
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

              <View style={[styles.pill, styles.pillStartsIn]}>
                <AppText style={styles.pillStartsInText} numberOfLines={1}>
                  Starts in 1h 28 mins
                </AppText>
              </View>

              <View style={styles.payoutRow}>
                <AppText style={styles.payoutValue}>$1,250</AppText>
                <AppText style={styles.payoutLabel}>Load payout</AppText>
              </View>

              <View style={styles.routeBox}>
                <RouteStops stops={CURRENT_TRIP_STOPS} showSummary liveCurrentLocation />
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
                  tripStarted ? colors.warning_text :colors.accentBlueLight
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
                <AppText style={styles.hosRemText}>11h Total</AppText>
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

              {HOS_DETAILS.map((item, index) => (
                <View
                  key={item.label}
                  style={[
                    styles.detailRow,
                    index === HOS_DETAILS.length - 1 && styles.detailRowLast,
                  ]}>
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
                  <AppText style={styles.rewardsPoints}>
                    1,234
                    <AppText style={styles.rewardsPointsUnit}> pts</AppText>
                  </AppText>
                </View>
              </View>
            </View>

            {/* Upcoming loads */}
            <View style={[styles.card, styles.loadsCard]}>
              <AppText style={styles.cardTitle}>Upcoming loads</AppText>
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
                      <View style={styles.loadRouteCol}>
                        <LoadRoute stops={load.stops} />
                        <LoadTypeBadge type={load.type} />
                      </View>

                      <View
                        style={[
                          styles.loadTimeBadge,
                          load.urgent
                            ? styles.loadTimeBadgeUrgent
                            : styles.loadTimeBadgeDefault,
                        ]}>
                        <AppText
                          style={[
                            styles.loadTimeText,
                            load.urgent
                              ? styles.loadTimeTextUrgent
                              : styles.loadTimeTextDefault,
                          ]}>
                          {load.time}
                        </AppText>
                        <AppText
                          style={[
                            styles.loadTimeText,
                            load.urgent
                              ? styles.loadTimeTextUrgent
                              : styles.loadTimeTextDefault,
                          ]}>
                          {load.date}
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

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={goAccountSettings}>
              <View style={styles.menuItemIcon}>
                <Setting_Icon width={18} height={18} />
              </View>
              <AppText style={styles.menuItemText}>Account Settings</AppText>
            </TouchableOpacity>

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

      {/* Draggable floating HERE map — movable anywhere on the screen */}
      <FloatingMap visible={mapVisible} onClose={() => setMapVisible(false)} />
    </SafeAreaView>
  );
};

export default HomeScreen;
