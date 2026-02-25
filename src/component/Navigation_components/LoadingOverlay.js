import React from 'react';
import {View, Text, ActivityIndicator} from 'react-native';
import styles from '../../screens/NavigationScreen/NavigationScreen.styles';
import AppText from '../../theme/AppText';

const LoadingOverlay = ({loading}) => {
  if (!loading) {
    return null;
  }

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <AppText style={styles.loadingText}>Getting your location...</AppText>
    </View>
  );
};

export default LoadingOverlay;
