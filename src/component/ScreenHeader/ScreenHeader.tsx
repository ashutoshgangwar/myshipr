import React from 'react';
import { View, TouchableOpacity, StatusBar } from 'react-native';

import styles from './ScreenHeader.styles';
import AppText from '../../theme/AppText';

export interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  /** Omit to hide the back button entirely. */
  onBack?: () => void;
}

const ScreenHeader = ({ title, subtitle, onBack }: ScreenHeaderProps) => {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={styles.container.backgroundColor} barStyle="light-content" />
      
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
     
        </TouchableOpacity>
      )}
      
      <View style={styles.textContainer}>
        <AppText style={styles.title}>{title}</AppText>
        {subtitle ? <AppText style={styles.subtitle}>{subtitle}</AppText> : null}
      </View>
    </View>
  );
};

export default ScreenHeader;
