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
          <Text style={styles.name}>Ashutosh Gangwar</Text>
          <Text style={styles.subTitle}>CDL Class A • ID: DRV-4521</Text>

          <View style={styles.badgeRow}>
            <View style={styles.verifiedBadge}>
              <Text style={styles.badgeText}>Verified</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Text style={styles.badgeText}>⭐ 4.9</Text>
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
          <Text style={styles.sectionTitle}>Documents & Verification</Text>

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
          <Text style={styles.sectionTitle}>Assigned Vehicle</Text>
          <Text style={styles.vehicleTitle}>Semi-Truck 18-Wheeler</Text>
          <Text style={styles.vehicleSub}>CA • ABC1234</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/* ---------- Components ---------- */

const Stat = ({ title, subtitle }) => (
  <View style={styles.statBox}>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statSub}>{subtitle}</Text>
  </View>
);

const DocItem = ({ title, subtitle, status, pending }) => (
  <View style={styles.docRow}>
    <View>
      <Text style={styles.docTitle}>{title}</Text>
      {subtitle && <Text style={styles.docSub}>{subtitle}</Text>}
    </View>
    <View
      style={[
        styles.statusBadge,
        pending ? styles.pending : styles.verified,
      ]}
    >
      <Text style={styles.statusText}>{status}</Text>
    </View>
  </View>
);

export default Profile;