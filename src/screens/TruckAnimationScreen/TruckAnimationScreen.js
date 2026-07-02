import React from 'react';
import {View, StyleSheet, StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {verticalScale as vs, moderateScale as ms} from 'react-native-size-matters';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import TruckLoader from '../../component/TruckLoader/TruckLoader';

/**
 * Full-screen transition shown while a trip is being finalised — a truck
 * drives across the road once, then advances to the `next` route (defaults
 * to the login screen) as soon as that single animation cycle completes.
 */
export default function TruckAnimationScreen({navigation, route}) {
  const {
    title = 'Completing your trip…',
    subtitle = 'Hang tight while we wrap things up.',
    next = 'TripCompletedScreen',
    nextParams,
  } = route?.params || {};

  const advanced = React.useRef(false);

  const handleCycleComplete = React.useCallback(() => {
    if (advanced.current || !next) return;
    advanced.current = true;
    navigation?.replace?.(next, nextParams);
  }, [navigation, next, nextParams]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <View style={styles.body}>
        <TruckLoader loop={false} onCycle={handleCycleComplete} />
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
