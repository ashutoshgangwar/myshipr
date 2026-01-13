import React from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';

import styles from './ScreenHeader.styles';

const ScreenHeader = ({ title, subtitle, onBack }) => {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={styles.container.backgroundColor} barStyle="light-content" />
      
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
     
        </TouchableOpacity>
      )}
      
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
};

export default ScreenHeader;
