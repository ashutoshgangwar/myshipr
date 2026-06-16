import React from 'react';
import {View, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';

export default function BiddingScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <AppText style={styles.title}>Bidding</AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  title: {fontSize: 22, fontWeight: '700', color: colors.textStrong},
});
