import React, {useState} from 'react';
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
import Notification_Icon from './../../assets/svg_icon/notification.svg';
import AppText from '../../theme/AppText';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(true);

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

          <View style={styles.profileCircle}>
            <Notification_Icon width={25} height={25} />
          </View>
        </View>

        {/* VERIFICATION */}
        <View style={styles.verifyCard}>
          <TouchableOpacity
            onPress={handlePendingVerification}
            activeOpacity={0.8}>
            <View style={styles.verifyRow}>
              <AppText style={styles.verifyText}>Verification Status</AppText>

              <View
                style={[
                  styles.verifiedBadge,
                  {backgroundColor: isVerified ? '#22C55E' : '#F59E0B'},
                ]}>
                <AppText style={styles.badgeText}>
                  {isVerified ? 'Verified' : 'Pending'}
                </AppText>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
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

        {/* AVAILABLE LOADS */}
        <View style={styles.sectionRow}>
          <AppText style={styles.sectionTitle}>Available Loads</AppText>
          <TouchableOpacity onPress={openAvailableLoads}>
            <AppText style={styles.seeAll}>See All</AppText>
          </TouchableOpacity>
        </View>

        <AvailableLoad onPlaceBid={openPlaceBid} />
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

const AvailableLoad = ({onPlaceBid}) => (
  <View style={styles.loadCard}>
    <View style={styles.loadHeader}>
      <View>
        <AppText style={styles.loadId}>Load #SH-301</AppText>
        <AppText style={styles.loadSub}>8,500 lbs • 239 miles</AppText>
      </View>
      <View style={styles.dateBadge}>
        <AppText>Feb 5</AppText>
      </View>
    </View>

    <AppText style={styles.route}>📍 Dallas, TX</AppText>
    <AppText style={styles.route}>📍 Houston, TX</AppText>

    <View style={styles.payRow}>
      <View>
        <AppText style={styles.payLabel}>Estimated Pay</AppText>
        <AppText style={styles.payAmount}>$650</AppText>
      </View>

      <TouchableOpacity style={styles.placeBtn} onPress={onPlaceBid}>
        <AppText style={styles.primaryBtnText}>Place Bid</AppText>
      </TouchableOpacity>
    </View>
  </View>
);
