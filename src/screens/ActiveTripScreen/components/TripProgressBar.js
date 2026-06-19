import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';

/**
 * Bottom trip-progress bar with ETA and the End Trip button.
 * `withCheckbox` renders the bidding-variant checkbox before the label.
 */
export default function TripProgressBar({
  progress = 0.63,
  eta = 'ETA 12.48 • 18 min',
  withCheckbox = false,
  onEndTrip,
}) {
  const pct = Math.max(0, Math.min(1, progress));

  return (
    <View style={styles.bottomBar}>
      <View style={styles.progressInfo}>
        <View style={styles.progressTopRow}>
          <AppText style={styles.progressLabel}>Trip Progress</AppText>
          <AppText style={styles.progressPercent}>{Math.round(pct * 100)}%</AppText>
        </View>

        <View style={styles.track}>
          <View style={[styles.trackFill, {width: `${pct * 100}%`}]} />
        </View>

        <View style={styles.scaleRow}>
          <AppText style={styles.scaleEdge}>0%</AppText>
          <AppText style={styles.etaText}>{eta}</AppText>
          <AppText style={styles.scaleEdge}>100%</AppText>
        </View>
      </View>

      <TouchableOpacity style={styles.endTripBtn} onPress={onEndTrip} activeOpacity={0.85}>
        {withCheckbox && <View style={styles.endTripCheckbox} />}
        <AppText style={styles.endTripText}>End Trip</AppText>
      </TouchableOpacity>
    </View>
  );
}
