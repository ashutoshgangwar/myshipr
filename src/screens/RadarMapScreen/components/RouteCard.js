import React from 'react';
import {View, ScrollView, StyleSheet} from 'react-native';
import {moderateScale, verticalScale} from 'react-native-size-matters';

import AppText from '../../../theme/AppText';
import {colors} from '../../../theme/colors';

// Bottom-left summary card: total distance/duration plus the full turn-by-turn
// step list (with banner + voice instructions). Shown when a route exists and
// the user is not actively navigating.
export default function RouteCard({route}) {
  if (!route) return null;
  return (
    <View style={styles.routeCard}>
      <AppText style={styles.routeTitle}>Route</AppText>
      <View style={styles.routeStats}>
        {route.distance ? (
          <View style={styles.statItem}>
            <AppText style={styles.statValue}>{route.distance}</AppText>
            <AppText style={styles.statLabel}>distance</AppText>
          </View>
        ) : null}
        {route.duration ? (
          <View style={styles.statItem}>
            <AppText style={styles.statValue}>{route.duration}</AppText>
            <AppText style={styles.statLabel}>duration</AppText>
          </View>
        ) : null}
      </View>

      {route.steps?.length ? (
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
    </View>
  );
}

const styles = StyleSheet.create({
  routeCard: {
    position: 'absolute',
    bottom: verticalScale(16),
    left: moderateScale(16),
    width: '60%',
    maxHeight: verticalScale(200),
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  routeTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: colors.text_dark,
    marginBottom: verticalScale(8),
  },
  routeStats: {
    flexDirection: 'row',
  },
  statItem: {
    marginRight: moderateScale(20),
  },
  statValue: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: colors.button_color,
  },
  statLabel: {
    fontSize: moderateScale(11),
    color: '#888',
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
});
