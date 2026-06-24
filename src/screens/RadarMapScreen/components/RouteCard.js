import React, {useState} from 'react';
import {View, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import {moderateScale, verticalScale} from 'react-native-size-matters';

import AppText from '../../../theme/AppText';
import {colors} from '../../../theme/colors';

// Bottom sheet anchored to the bottom edge of the map. Shows the route summary
// (distance / duration / toll) plus the full turn-by-turn step list, and hosts
// the Start / Re-match actions in its footer. Rendered when a route exists and
// the user is not actively navigating.
export default function RouteCard({route, toll, canStart, onStart, onRematch}) {
  const [expanded, setExpanded] = useState(true);
  if (!route) return null;
  return (
    <View style={styles.sheet}>
      <TouchableOpacity
        style={styles.handleHitArea}
        onPress={() => setExpanded(prev => !prev)}
        activeOpacity={0.7}>
        <View style={styles.handle} />
      </TouchableOpacity>

      <View style={styles.header}>
        {/* <AppText style={styles.routeTitle}>Route overview</AppText> */}
        <View style={styles.routeStats}>
          {route.distance ? (
            <View style={styles.statItem}>
              <AppText style={styles.statValue}>{route.distance}</AppText>
              <AppText style={styles.statLabel}>Distance</AppText>
            </View>
          ) : null}
          {route.duration ? (
            <View style={styles.statItem}>
              <AppText style={styles.statValue}>{route.duration}</AppText>
              <AppText style={styles.statLabel}>Duration</AppText>
            </View>
          ) : null}
          {toll ? (
            <View style={styles.statItem}>
              <AppText style={styles.statValue}>{toll}</AppText>
              <AppText style={styles.statLabel}>Toll</AppText>
            </View>
          ) : null}
        </View>
      </View>

      {expanded && route.steps?.length ? (
        <ScrollView
          style={styles.stepList}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled>
          {route.steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepDot} />
              <View style={styles.stepInfo}>
                <AppText style={styles.stepBanner} numberOfLines={2}>
                  {step.banner || step.voice || step.instructions}
                </AppText>
                {step.voice && step.voice !== step.banner ? (
                  <AppText style={styles.stepVoice} numberOfLines={2}>
                    🔊 {step.voice}
                  </AppText>
                ) : null}
                {step.distance ? (
                  <AppText style={styles.stepMeta}>
                    {step.distance}
                    {step.streetName ? ` · ${step.streetName}` : ''}
                  </AppText>
                ) : null}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : null}

      {expanded && (canStart || onRematch) ? (
        <View style={styles.footer}>
          {onRematch ? (
            <TouchableOpacity
              style={styles.rematchButton}
              onPress={onRematch}
              activeOpacity={0.85}>
              <AppText style={styles.rematchButtonText}>↻ Re-match</AppText>
            </TouchableOpacity>
          ) : null}
          {canStart && onStart ? (
            <TouchableOpacity
              style={styles.startButton}
              onPress={onStart}
              activeOpacity={0.85}>
              <AppText style={styles.startButtonText}>▶ Start navigation</AppText>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: verticalScale(320),
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    paddingHorizontal: moderateScale(16),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(18),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  handleHitArea: {
    alignItems: 'center',
    paddingVertical: verticalScale(6),
    marginBottom: verticalScale(4),
  },
  handle: {
    width: moderateScale(40),
    height: verticalScale(4),
    borderRadius: moderateScale(2),
    backgroundColor: '#ddd',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeTitle: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: colors.text_dark,
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: moderateScale(14),
  },
  statValue: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: colors.button_color,
  },
  statLabel: {
    fontSize: moderateScale(15),
    color: colors.textMuted,
    marginTop: verticalScale(1),
  },
  stepList: {
    marginTop: verticalScale(10),
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: verticalScale(6),
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: verticalScale(6),
    borderBottomWidth: 1,
    borderBottomColor: '#f3f3f3',
  },
  stepDot: {
    width: moderateScale(7),
    height: moderateScale(7),
    borderRadius: moderateScale(4),
    backgroundColor: colors.button_color,
    marginTop: verticalScale(4),
    marginRight: moderateScale(8),
  },
  stepInfo: {
    flex: 1,
  },
  stepBanner: {
    fontSize: moderateScale(13),
    color: colors.text_dark,
    fontWeight: '600',
  },
  stepVoice: {
    fontSize: moderateScale(11),
    color: '#666',
    marginTop: verticalScale(2),
  },
  stepMeta: {
    fontSize: moderateScale(11),
    color: '#888',
    marginTop: verticalScale(2),
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(12),
  },
  rematchButton: {
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(11),
    borderRadius: moderateScale(24),
    borderWidth: 1,
    borderColor: colors.button_color,
    marginRight: moderateScale(10),
  },
  rematchButtonText: {
    color: colors.button_color,
    fontSize: moderateScale(13),
    fontWeight: '700',
  },
  startButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#2ecc71',
    paddingVertical: verticalScale(11),
    borderRadius: moderateScale(24),
  },
  startButtonText: {
    color: '#fff',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
});
