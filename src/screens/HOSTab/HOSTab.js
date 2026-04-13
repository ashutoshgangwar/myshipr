import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import styles from './HOSTab.styles';
import StatusBar from '../../component/StatusBar/StatusBar';
import { colors } from '../../theme/colors';
import AppText from '../../theme/AppText';

const HOSTab = () => {
  return (
    <SafeAreaView style={styles.safe}>
       <StatusBar
            backgroundColor={colors.primary}
            barStyle="light-content"
            translucent={false}
          />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <AppText style={styles.headerTitle}>Hours of Service</AppText>
          <AppText style={styles.headerSubtitle}>Track your driving hours</AppText>
        </View>

        {/* TIME REMAINING */}
        <View style={styles.card}>
          <AppText style={styles.cardTitle}>Time Remaining</AppText>

          <ProgressRow
            label="Drive Time"
            value="8.5h / 11h"
            percent={77}
            color="#2563EB"
          />

          <ProgressRow
            label="Shift Time"
            value="10.2h / 14h"
            percent={73}
            color="#F97316"
          />

          <ProgressRow
            label="Cycle Time"
            value="42.0h / 70h"
            percent={60}
            color="#16A34A"
          />
        </View>

        {/* CURRENT STATUS */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <AppText style={styles.statusTitle}>Current Status</AppText>
            <View style={styles.statusBadge}>
              <AppText style={styles.statusBadgeText}>On Duty - Driving</AppText>
            </View>
          </View>

          <AppText  style={styles.statusInfo}>
            Started: 6:30 AM • Duration: 4h 25m
          </AppText>
        </View>

        {/* ELD DATA */}
        <View style={styles.card}>
          <View style={styles.eldRow}>
            <View style={styles.eldIcon}>
              <AppText style={{ fontSize: 18 }}>📄</AppText>
            </View>
            <View>
              <AppText style={styles.eldTitle}>ELD Data</AppText>
              <AppText style={styles.eldSub}>Last synced: 2 hours ago</AppText>
            </View>
          </View>

          <TouchableOpacity style={styles.uploadBtn}>
            <AppText style={styles.uploadBtnText}>Upload ELD File</AppText>
          </TouchableOpacity>
        </View>

        {/* TODAY ACTIVITY */}
        <View style={styles.card}>
          <AppText style={styles.cardTitle}>Today's Activity</AppText>

          <ActivityRow
            title="On Duty - Driving"
            time="6:30 AM"
            duration="4h 25m"
          />

          <ActivityRow
            title="Sleeper Berth"
            time="2:05 AM"
            duration="4h 25m"
          />

          <ActivityRow
            title="Off Duty"
            time="10:30 PM"
            duration="3h 35m"
            hideDivider
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default HOSTab;

/* ---------- Components ---------- */

const ProgressRow = ({ label, value, percent, color }) => (
  <View style={{ marginTop: 16 }}>
    <View style={styles.progressHeader}>
      <AppText style={styles.progressLabel}>{label}</AppText>
      <AppText style={styles.progressValue}>{value}</AppText>
    </View>

    <View style={styles.progressTrack}> 
      <View
        style={[
          styles.progressFill,
          { width: `${percent}%`, backgroundColor: color },
        ]}
      />
    </View>
  </View>
);

const ActivityRow = ({ title, time, duration, hideDivider }) => (
  <>
    <View style={styles.activityRow}>
      <View style={styles.activityLeft}>
        <View style={styles.activityDot} />
        <View>
          <AppText style={styles.activityTitle}>{title}</AppText>
          <AppText style={styles.activityTime}>{time}</AppText>
        </View>
      </View>
      <AppText style={styles.activityDuration}>{duration}</AppText>
    </View>

    {!hideDivider && <View style={styles.divider} />}
  </>
);
