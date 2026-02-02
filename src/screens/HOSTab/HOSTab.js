import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import styles from './HOSTab.styles';

const HOSTab = () => {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hours of Service</Text>
          <Text style={styles.headerSubtitle}>Track your driving hours</Text>
        </View>

        {/* TIME REMAINING */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Time Remaining</Text>

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
            <Text style={styles.statusTitle}>Current Status</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>On Duty - Driving</Text>
            </View>
          </View>

          <Text style={styles.statusInfo}>
            Started: 6:30 AM • Duration: 4h 25m
          </Text>
        </View>

        {/* ELD DATA */}
        <View style={styles.card}>
          <View style={styles.eldRow}>
            <View style={styles.eldIcon}>
              <Text style={{ fontSize: 18 }}>📄</Text>
            </View>
            <View>
              <Text style={styles.eldTitle}>ELD Data</Text>
              <Text style={styles.eldSub}>Last synced: 2 hours ago</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.uploadBtn}>
            <Text style={styles.uploadBtnText}>Upload ELD File</Text>
          </TouchableOpacity>
        </View>

        {/* TODAY ACTIVITY */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today's Activity</Text>

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
      <Text style={styles.progressLabel}>{label}</Text>
      <Text style={styles.progressValue}>{value}</Text>
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
          <Text style={styles.activityTitle}>{title}</Text>
          <Text style={styles.activityTime}>{time}</Text>
        </View>
      </View>
      <Text style={styles.activityDuration}>{duration}</Text>
    </View>

    {!hideDivider && <View style={styles.divider} />}
  </>
);
