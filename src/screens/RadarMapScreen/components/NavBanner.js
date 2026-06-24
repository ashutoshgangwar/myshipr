import React from 'react';
import {View, StyleSheet} from 'react-native';
import {moderateScale, verticalScale} from 'react-native-size-matters';

import AppText from '../../../theme/AppText';
import {MANEUVER_ICON, formatDistance} from '../helpers/radarNav';

// The blue turn-by-turn banner pinned to the top while navigating. Shows the
// upcoming maneuver arrow, instruction and distance to the turn.
export default function NavBanner({step, info}) {
  if (!step) return null;
  return (
    <View style={styles.navBanner}>
      <AppText style={styles.navArrow}>
        {MANEUVER_ICON[step.maneuver] || '↑'}
      </AppText>
      <View style={styles.navBannerInfo}>
        <AppText style={styles.navBannerText} numberOfLines={2}>
          {step.banner || step.voice || step.instructions}
        </AppText>
        {info ? (
          <AppText style={styles.navBannerDist}>
            {formatDistance(info.distanceToManeuver)}
            {step.streetName ? ` · ${step.streetName}` : ''}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a73e8',
    marginHorizontal: moderateScale(12),
    marginTop: verticalScale(8),
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(12),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 20,
  },
  navArrow: {
    color: '#fff',
    fontSize: moderateScale(34),
    fontWeight: '700',
    marginRight: moderateScale(14),
  },
  navBannerInfo: {
    flex: 1,
  },
  navBannerText: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  navBannerDist: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: moderateScale(13),
    marginTop: verticalScale(2),
  },
});
