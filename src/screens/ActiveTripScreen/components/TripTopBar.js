import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';

/**
 * Top overlay bar: back button · ON DUTY dropdown · SOS.
 * Glyphs are placeholders – swap with project SVG icons later.
 */
export default function TripTopBar({status = 'ON DUTY', onBack, onToggleDuty, onSOS}) {
  return (
    <View style={styles.topBar}>
      <TouchableOpacity style={styles.circleBtn} onPress={onBack} activeOpacity={0.8}>
        <AppText style={styles.backGlyph}>‹</AppText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.dutyPill} onPress={onToggleDuty} activeOpacity={0.85}>
        <AppText style={styles.dutyText}>{status}</AppText>
        <AppText style={styles.dutyChevron}>▼</AppText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.sosBtn} onPress={onSOS} activeOpacity={0.85}>
        <AppText style={styles.sosText}>SOS</AppText>
      </TouchableOpacity>
    </View>
  );
}
