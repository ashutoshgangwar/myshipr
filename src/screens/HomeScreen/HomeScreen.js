import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import styles from './HomeScreen.styles';
import StatusBar from '../../component/StatusBar/StatusBar';
import {colors} from '../../theme/colors';
import {useNavigation} from '@react-navigation/native';
import SOS_Icon from './../../assets/svg_icon/sos.svg';
import Mechanic_call_Icon from './../../assets/svg_icon/mechanic_call.svg';
import AppText from '../../theme/AppText';
import {
  getBackgroundTrackingDebugEvents,
  getLastBackgroundLocation,
} from '../../services/BackgroundLocationService';

const LIVE_AUCTIONS = [
  {
    id: 'SH-401',
    type: 'Auto Parts',
    weight: '14,200 lbs',
    from: 'Chicago, IL',
    to: 'Detroit, MI',
    currentBid: '$720',
    endsIn: '1h 42m',
    totalBids: 5,
    estimatedPay: '$720',
    route: 'Chicago, IL → Detroit, MI',
  },
  {
    id: 'SH-402',
    type: 'Electronics',
    weight: '9,800 lbs',
    from: 'Atlanta, GA',
    to: 'Nashville, TN',
    currentBid: '$480',
    endsIn: '2h 15m',
    totalBids: 3,
    estimatedPay: '$480',
    route: 'Atlanta, GA → Nashville, TN',
  },
];

const HomeScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(true);

  useEffect(() => {
    const logLastLocation = async () => {
      const location = await getLastBackgroundLocation();
      const events = await getBackgroundTrackingDebugEvents();

      if (location?.latitude != null && location?.longitude != null) {
        console.log(
          '[HomeScreen Last BG Location]',
          location.latitude,
          location.longitude,
        );
      } else {
        console.log('[HomeScreen Last BG Location] No location yet');
      }

      if (events.length) {
        console.log('[BG Debug Events]', events.slice(0, 10));
      } else {
        console.log('[BG Debug Events] No events yet');
      }
    };

    logLastLocation();
  }, []);

  const handlePendingVerification = () => {
    if (loading || isVerified) return;

    navigation.navigate('CreateAccount');
  };

  const openMap = () => {
    navigation.navigate('NavigationScreen');
  };

  const openAvailableLoads = () => {
    navigation.navigate('AvailableLoadsScreen');
  };

  const openPlaceBid = () => {
    navigation.navigate('PlaceBidScreen', {
      load: {
        id: 'SH-301',
        route: 'Dallas, TX → Houston, TX',
        estimatedPay: '$650',
      },
    });
  };
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        backgroundColor={colors.primary}
        barStyle="dark-content"
        translucent={false}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <AppText style={styles.welcome}>Welcome back,</AppText>
            <AppText style={styles.username}>Ashutosh Gangwar</AppText>
          </View>

          <TouchableOpacity style={styles.profileCircle}>
            <Mechanic_call_Icon width={30} height={30} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileCircle}>
            <SOS_Icon width={30} height={30} />
          </TouchableOpacity>
        </View>

        {/* LIVE AUCTIONS */}
        <View style={styles.sectionRow}>
          <AppText style={styles.sectionTitle}>Live Auctions</AppText>
        </View>
        <View style={styles.auctionCard}>
          {LIVE_AUCTIONS.map(auction => (
            <AuctionNotifCard key={auction.id} auction={auction} />
          ))}
          <TouchableOpacity>
            <AppText style={styles.seeAll}>See All</AppText>
          </TouchableOpacity>
        </View>

        {/* STATS */}
        <View style={styles.statsCard}>
          <StatItem title="Active Loads" value="12" color="#2563EB" />
          <Divider />
          <StatItem title="This Week" value="$8,450" color="#16A34A" />
          <Divider />
          <StatItem title="HOS Left" value="42h" color="#EA580C" />
        </View>

        {/* CURRENT LOAD */}
        <AppText style={styles.sectionTitle}>Current Load</AppText>

        <View style={styles.loadCard}>
          <View style={styles.loadHeader}>
            <View>
              <AppText style={styles.loadId}>Load #SH-245</AppText>
              <AppText style={styles.loadSub}>Electronics • 12,500 lbs</AppText>
            </View>

            <View style={styles.inTransitBadge}>
              <AppText style={styles.badgeText}>In Transit</AppText>
            </View>
          </View>

          <Location
            color="#22C55E"
            city="Los Angeles, CA"
            info="Picked up 4 hours ago"
          />

          <Location color="#EF4444" city="Phoenix, AZ" info="ETA: 2 hours" />

          <View style={styles.progressContainer}>
            {/* Header */}
            <View style={styles.progressHeader}>
              <AppText style={styles.progressLabel}>Progress</AppText>
              <AppText style={styles.progressPercent}>72%</AppText>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, {width: '72%'}]} />
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {width: '72%'}]} />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity onPress={openMap} style={styles.primaryBtn}>
              <AppText style={styles.primaryBtnText}>View Map</AppText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn}>
              <AppText style={styles.secondaryBtnText}>Update Status</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

/* ---------- Small Components ---------- */

const StatItem = ({title, value, color}) => (
  <View style={styles.statItem}>
    <AppText style={[styles.statValue, {color}]}>{value}</AppText>
    <AppText style={styles.statLabel}>{title}</AppText>
  </View>
);

const Divider = () => <View style={styles.divider} />;

const Location = ({color, city, info}) => (
  <View style={styles.locationRow}>
    <View style={[styles.locationIcon, {backgroundColor: color + '22'}]}>
      <AppText style={{color}}>📍</AppText>
    </View>
    <View>
      <AppText style={styles.city}>{city}</AppText>
      <AppText style={styles.info}>{info}</AppText>
    </View>
  </View>
);

const AuctionNotifCard = ({auction}) => (
  <View style={styles.auctionNotifCard}>
    <View style={styles.auctionNotifLeft}>
      <View style={styles.liveBadge}>
        <AppText style={styles.badgeText}>🟢 LIVE</AppText>
      </View>
      <View style={styles.auctionNotifInfo}>
        <AppText style={styles.auctionNotifId}>Load #{auction.id}</AppText>
        <AppText style={styles.auctionNotifRoute}>
          {auction.from} → {auction.to}
        </AppText>
      </View>
    </View>
    <View style={styles.auctionTimerBox}>
      <AppText style={styles.auctionTimerLabel}>⏱ Ends in</AppText>
      <AppText style={styles.auctionTimerValue}>{auction.endsIn}</AppText>
    </View>
  </View>
);
