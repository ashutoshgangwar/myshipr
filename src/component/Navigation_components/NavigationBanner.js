import React from 'react';
import {View, Text} from 'react-native';
import styles from '../../screens/NavigationScreen/NavigationScreen.styles';

const NavigationBanner = ({instruction, distance, duration}) => {
  if (!instruction || !distance || !duration) {
    return null;
  }

  return (
    <View style={styles.navigationBanner}>
      <Text style={styles.navigationInstruction}>{instruction}</Text>
      <Text style={styles.navigationDetails}>
        {distance} • {duration}
      </Text>
    </View>
  );
};

export default NavigationBanner;
