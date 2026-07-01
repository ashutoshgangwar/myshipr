import React from 'react';
import {View, StyleSheet, StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {verticalScale as vs, moderateScale as ms} from 'react-native-size-matters';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import TruckLoader from '../../component/TruckLoader/TruckLoader';

/**
 * Full-screen transition shown while a trip is being finalised — a truck
 * drives across the road on a loop. Auto-advances after `holdMs` if a
 * `next` route is provided via params.
 */
export default function TruckAnimationScreen({navigation, route}) {
  const {
    title = 'Completing your trip…',
    subtitle = 'Hang tight while we wrap things up.',
    next,
    holdMs = 3200,
  } = route?.params || {};

  React.useEffect(() => {
    if (!next) return;
    const t = setTimeout(() => navigation?.replace?.(next), holdMs);
    return () => clearTimeout(t);
  }, [navigation, next, holdMs]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <View style={styles.body}>
        <TruckLoader />
        <AppText style={styles.title}>{title}</AppText>
        <AppText style={styles.subtitle}>{subtitle}</AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.white},
  body: {flex: 1, justifyContent: 'center'},
  title: {
    color: colors.text_dark,
    fontSize: ms(18),
    fontWeight: '700',
    textAlign: 'center',
    marginTop: vs(24),
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: ms(13),
    textAlign: 'center',
    marginTop: vs(6),
  },
});
