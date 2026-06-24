import React from 'react';
import {TouchableOpacity, StyleSheet} from 'react-native';
import {moderateScale, verticalScale} from 'react-native-size-matters';

import AppText from '../../../theme/AppText';

// Green "you have arrived" banner shown after navigation completes. Tap to
// dismiss.
export default function ArrivedBanner({onDismiss}) {
  return (
    <TouchableOpacity
      style={styles.arrivedBanner}
      onPress={onDismiss}
      activeOpacity={0.85}>
      <AppText style={styles.arrivedText}>🏁 You have arrived</AppText>
      <AppText style={styles.arrivedDismiss}>Tap to dismiss</AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  arrivedBanner: {
    marginHorizontal: moderateScale(12),
    marginTop: verticalScale(8),
    backgroundColor: '#2ecc71',
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    zIndex: 20,
  },
  arrivedText: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  arrivedDismiss: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: moderateScale(11),
    marginTop: verticalScale(2),
  },
});
