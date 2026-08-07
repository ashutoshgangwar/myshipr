import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';

// Trip milestones, in order: the origin, the pickups, then the drops. Each one
// owns an equal slice of the bar, so `progress` maps onto a milestone index.
const DEFAULT_STOPS = [
  {key: 'start', label: 'Start'},
  {key: 'p1', label: 'P1'},
  {key: 'p2', label: 'P2'},
  {key: 'd1', label: 'D1'},
  {key: 'd2', label: 'D2'},
];

/**
 * Bottom trip-progress bar: a segment per milestone (green = cleared,
 * blue = in progress, grey = still ahead) plus the End Trip button.
 * `withCheckbox` renders the bidding-variant checkbox before the label.
 */
export default function TripProgressBar({
  progress = 0.63,
  stops = DEFAULT_STOPS,
  withCheckbox = false,
  onEndTrip,
  // Reports this card's rendered height, so anything floating above it (the
  // verify-stop button) can sit flush without a hard-coded offset.
  onMeasure,
}) {
  const pct = Math.max(0, Math.min(1, progress));

  // Which milestone the driver is on. At 100% this lands past the last index so
  // every segment reads as cleared, which is what we want.
  const activeIndex = Math.floor(pct * stops.length);

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
          <AppText style={styles.progressPercent}>{Math.round(pct * 100)}%</AppText>
        </View>

        <View style={styles.segmentRow}>
          {stops.map((stop, i) => (
            <View key={stop.key} style={styles.segmentCol}>
              <View
                style={[
                  styles.segment,
                  i < activeIndex && styles.segmentDone,
                  i === activeIndex && styles.segmentActive,
                  i === stops.length - 1 && styles.segmentLast,
                ]}
              />
              {/* Left-aligned so each label sits under the start of its own
                  segment, the way the milestones read on the map. */}
              <AppText style={styles.segmentLabel} numberOfLines={1}>
                {stop.label}
              </AppText>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.endTripBtn} onPress={onEndTrip} activeOpacity={0.85}>
        {withCheckbox && <View style={styles.endTripCheckbox} />}
        <AppText style={styles.endTripText}>End Trip</AppText>
      </TouchableOpacity>
    </View>
  );
}
