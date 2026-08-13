import React, {useEffect, useRef} from 'react';
import {View, TouchableOpacity, Animated, Easing} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';

/**
 * The fill ramp. It starts pale on a fresh leg and deepens as the driver closes
 * on the stop, so how far along they are reads from the colour alone — a glance
 * from the driving position, without parsing the percentage.
 */
const FILL_EARLY = '#A5DEB1';
const FILL_MID = '#5BBF74';
const FILL_LATE = '#2E9E44';

/**
 * Bottom trip-progress card: one continuous bar from the last stop to the next,
 * the leg's distance/ETA under it, and the Reached / End Trip button.
 * `withCheckbox` renders the bidding-variant checkbox before the label.
 */
export default function TripProgressBar({
  progress = 0.63,
  // The stop just cleared and the one being driven to (e.g. "Current" → "P1").
  fromLabel = 'Current',
  toLabel = '',
  // Leg summary line, e.g. "12 min · 18 km · ETA 5:38 PM". This is also where a
  // routing failure surfaces, in which case `summaryIsError` colours it.
  summary = '',
  summaryIsError = false,
  withCheckbox = false,
  // "Reached" while stops remain (it opens the stop's verify flow), "End Trip"
  // on the last leg (it opens POD). The screen owns which one applies.
  endLabel = 'End Trip',
  onEndTrip,
  // Reports this card's rendered height, so anything floating above it (the
  // verify-stop button) can sit flush without a hard-coded offset.
  onMeasure,
}) {
  const pct = Math.max(0, Math.min(1, progress));

  // Progress arrives in jumps (a location fix, a cleared stop); the bar grows
  // into each new value rather than snapping, which is what makes the colour
  // deepening read as movement.
  const fill = useRef(new Animated.Value(pct)).current;
  useEffect(() => {
    Animated.timing(fill, {
      toValue: pct,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      // Width and backgroundColor are not native-drivable.
      useNativeDriver: false,
    }).start();
  }, [fill, pct]);

  // RN 0.83 draws Android edge-to-edge, so without the bottom inset the card
  // would overlap the system nav/gesture bar (and the iOS home indicator).
  // Stack it on top of the card's own gap so the visible gap stays even.
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bottomBar,
        {bottom: styles.bottomBar.bottom + insets.bottom},
      ]}
      onLayout={e => onMeasure?.(e.nativeEvent.layout.height)}>
      <View style={styles.progressInfo}>
        <View style={styles.progressTopRow}>
          <AppText style={styles.progressLabel}>Trip Progress</AppText>
          <AppText style={styles.progressPercent}>
            {Math.round(pct * 100)}%
          </AppText>
        </View>

        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: fill.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: fill.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [FILL_EARLY, FILL_MID, FILL_LATE],
                }),
              },
            ]}
          />
        </View>

        <View style={styles.progressStopRow}>
          <AppText style={styles.progressStopLabel} numberOfLines={1}>
            {fromLabel}
          </AppText>
          <AppText
            style={[
              styles.progressSummary,
              summaryIsError && styles.progressSummaryError,
            ]}
            numberOfLines={2}>
            {summary}
          </AppText>
          <AppText
            style={[styles.progressStopLabel, styles.progressStopLabelEnd]}
            numberOfLines={1}>
            {toLabel}
          </AppText>
        </View>
      </View>

      <TouchableOpacity style={styles.endTripBtn} onPress={onEndTrip} activeOpacity={0.85}>
        {withCheckbox && <View style={styles.endTripCheckbox} />}
        <AppText style={styles.endTripText}>{endLabel}</AppText>
      </TouchableOpacity>
    </View>
  );
}
