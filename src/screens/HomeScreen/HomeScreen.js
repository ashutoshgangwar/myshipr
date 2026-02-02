import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import styles from './HomeScreen.styles';


const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>Welcome back,</Text>
            <Text style={styles.username}>John Miller</Text>
          </View>

          <View style={styles.profileCircle}>
            <Text style={styles.profileIcon}>👤</Text>
          </View>
        </View>

        {/* VERIFICATION */}
        <View style={styles.verifyCard}>
          <View style={styles.verifyRow}>
            <Text style={styles.verifyText}>Verification Status</Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.badgeText}>Verified</Text>
            </View>
          </View>

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
        <Text style={styles.sectionTitle}>Current Load</Text>

        <View style={styles.loadCard}>
          <View style={styles.loadHeader}>
            <View>
              <Text style={styles.loadId}>Load #SH-245</Text>
              <Text style={styles.loadSub}>Electronics • 12,500 lbs</Text>
            </View>

            <View style={styles.inTransitBadge}>
              <Text style={styles.badgeText}>In Transit</Text>
            </View>
          </View>

          <Location
            color="#22C55E"
            city="Los Angeles, CA"
            info="Picked up 4 hours ago"
          />

          <Location
            color="#EF4444"
            city="Phoenix, AZ"
            info="ETA: 2 hours"
          />

          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressPercent}>72%</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '72%' }]} />
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>View Map</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>Update Status</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* AVAILABLE LOADS */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Available Loads</Text>
          <Text style={styles.seeAll}>See All</Text>
        </View>

        <AvailableLoad />

      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

/* ---------- Small Components ---------- */

const StatItem = ({ title, value, color }) => (
  <View style={styles.statItem}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{title}</Text>
  </View>
);

const Divider = () => <View style={styles.divider} />;

const Location = ({ color, city, info }) => (
  <View style={styles.locationRow}>
    <View style={[styles.locationIcon, { backgroundColor: color + '22' }]}>
      <Text style={{ color }}>📍</Text>
    </View>
    <View>
      <Text style={styles.city}>{city}</Text>
      <Text style={styles.info}>{info}</Text>
    </View>
  </View>
);

const AvailableLoad = () => (
  <View style={styles.loadCard}>
    <View style={styles.loadHeader}>
      <View>
        <Text style={styles.loadId}>Load #SH-301</Text>
        <Text style={styles.loadSub}>8,500 lbs • 239 miles</Text>
      </View>
      <View style={styles.dateBadge}>
        <Text>Feb 5</Text>
      </View>
    </View>

    <Text style={styles.route}>📍 Dallas, TX</Text>
    <Text style={styles.route}>📍 Houston, TX</Text>

    <View style={styles.payRow}>
      <View>
        <Text style={styles.payLabel}>Estimated Pay</Text>
        <Text style={styles.payAmount}>$650</Text>
      </View>

      <TouchableOpacity style={styles.placeBtn}>
        <Text style={styles.primaryBtnText}>Place Bid</Text>
      </TouchableOpacity>
    </View>
  </View>
);
