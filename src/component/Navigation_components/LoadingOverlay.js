import React from 'react';
import {View, Text, ActivityIndicator} from 'react-native';
import styles from '../../screens/NavigationScreen/NavigationScreen.styles';

const LoadingOverlay = ({loading}) => {
  if (!loading) {
    return null;
  }

  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text style={styles.loadingText}>Getting your location...</Text>
    </View>
  );
};

export default LoadingOverlay;
