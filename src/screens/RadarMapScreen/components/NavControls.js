import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import {moderateScale, verticalScale} from 'react-native-size-matters';

import AppText from '../../../theme/AppText';
import {colors} from '../../../theme/colors';
import {formatDistance, formatDuration} from '../helpers/radarNav';

// The floating action controls over the map. While navigating it shows the live
// ETA card + Exit button; otherwise (until a route exists and the RouteCard
// sheet takes over) the Match Route button.
export default function NavControls({
  navActive,
  navInfo,
  matching,
  canMatch,
  showMatch,
  onMatch,
  onExit,
}) {
  if (navActive) {
    return (
      <>
        {navInfo ? (
          <View style={styles.etaCard}>
            <AppText style={styles.etaPrimary}>
              {formatDuration(navInfo.remainingDuration)}
            </AppText>
            <AppText style={styles.etaSecondary}>
              {formatDistance(navInfo.remainingDistance)} left
            </AppText>
          </View>
        ) : null}
        <TouchableOpacity
          style={[styles.matchButton, styles.exitButton]}
          onPress={onExit}
          activeOpacity={0.85}>
          <AppText style={styles.matchButtonText}>Exit</AppText>
        </TouchableOpacity>
      </>
    );
  }

  if (!showMatch) return null;

  return (
    <TouchableOpacity
      style={[styles.matchButton, !canMatch && styles.matchButtonDisabled]}
      onPress={onMatch}
      disabled={!canMatch}
      activeOpacity={0.85}>
      <AppText style={styles.matchButtonText}>
        {matching ? 'Matching…' : 'Match Route'}
      </AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  matchButton: {
    position: 'absolute',
    bottom: verticalScale(16),
    right: moderateScale(16),
    backgroundColor: colors.button_color,
    paddingHorizontal: moderateScale(18),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(24),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  matchButtonDisabled: {
    opacity: 0.6,
  },
  matchButtonText: {
    color: colors.text_color_button,
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  exitButton: {
    backgroundColor: '#e74c3c',
  },
  etaCard: {
    position: 'absolute',
    bottom: verticalScale(16),
    left: moderateScale(16),
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(10),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  etaPrimary: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#2ecc71',
  },
  etaSecondary: {
    fontSize: moderateScale(12),
    color: '#888',
    marginTop: verticalScale(1),
  },
});
