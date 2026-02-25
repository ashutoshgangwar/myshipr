import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import styles from './Profile.styles';
import StatusBar from '../../component/StatusBar/StatusBar';
import { colors } from '../../theme/colors';
import AppText from '../../theme/AppText';

const Profile = () => {
  return (
    <SafeAreaView style={styles.container}>
       <StatusBar
            backgroundColor={colors.primary}
            barStyle="dark-content"
            translucent={false}
          />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar} />
          <AppText style={styles.name}>Ashutosh Gangwar</AppText>
          <AppText style={styles.subTitle}>CDL Class A • ID: DRV-4521</AppText>

          <View style={styles.badgeRow}>
            <View style={styles.verifiedBadge}>
              <AppText style={styles.badgeText}>Verified</AppText>
            </View>
            <View style={styles.ratingBadge}>
              <AppText style={styles.badgeText}>⭐ 4.9</AppText>
            </View>
          </View>
        </View>

        {/* Stats Card */}
        <View style={styles.card}>
          <View style={styles.statRow}>
            <Stat title="247" subtitle="Total Deliveries" />
            <Stat title="98.5%" subtitle="On-Time Rate" />
          </View>

          <View style={styles.statRow}>
            <Stat title="$156k" subtitle="Total Earnings" />
            <Stat title="5 yrs" subtitle="Experience" />
          </View>
        </View>

        {/* Documents */}
        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Documents & Verification</AppText>

          <DocItem
            title="CDL License"
            subtitle="Expires: May 20, 2028"
            status="Verified"
          />

          <DocItem
            title="DOT Medical"
            subtitle="Expires: Jan 15, 2027"
            status="Verified"
          />

          <DocItem
            title="Insurance"
            subtitle="Expires: Dec 31, 2026"
            status="Verified"
          />

          <DocItem
            title="Vehicle Registration"
            status="Pending"
            pending
          />
        </View>

        {/* Vehicle */}
        <View style={styles.card}>
          <AppText style={styles.sectionTitle}>Assigned Vehicle</AppText>
          <AppText style={styles.vehicleTitle}>Semi-Truck 18-Wheeler</AppText>
          <AppText style={styles.vehicleSub}>CA • ABC1234</AppText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/* ---------- Components ---------- */

const Stat = ({ title, subtitle }) => (
  <View style={styles.statBox}>
    <AppText style={styles.statTitle}>{title}</AppText>
    <AppText style={styles.statSub}>{subtitle}</AppText>
  </View>
);

const DocItem = ({ title, subtitle, status, pending }) => (
  <View style={styles.docRow}>
    <View>
      <AppText style={styles.docTitle}>{title}</AppText>
      {subtitle && <AppText style={styles.docSub}>{subtitle}</AppText>}
    </View>
    <View
      style={[
        styles.statusBadge,
        pending ? styles.pending : styles.verified,
      ]}
    >
      <AppText style={styles.statusText}>{status}</AppText>
    </View>
  </View>
);

export default Profile;