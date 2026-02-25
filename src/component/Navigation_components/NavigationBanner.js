import React from 'react';
import {View, Text} from 'react-native';
import styles from '../../screens/NavigationScreen/NavigationScreen.styles';
import AppText from '../../theme/AppText';

const NavigationBanner = ({instruction, distance, duration}) => {
  if (!instruction || !distance || !duration) {
    return null;
  }

  return (
    <View style={styles.navigationBanner}>
      <AppText style={styles.navigationInstruction}>{instruction}</AppText>
      <AppText style={styles.navigationDetails}>
        {distance} • {duration}
      </AppText>
    </View>
  );
};

export default NavigationBanner;
