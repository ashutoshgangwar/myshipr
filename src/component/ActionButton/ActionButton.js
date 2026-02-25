import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import styles from './ActionButton.styles';
import AppText from '../../theme/AppText';

const ActionButton = ({ 
  title, 
  onPress, 
  bgColor = '#0B5ED7', 
  textColor = '#fff', 
  disabled = false 
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, { backgroundColor: bgColor, opacity: disabled ? 0.6 : 1 }]}
      disabled={disabled}
    >
      <AppText style={[styles.buttonText, { color: textColor }]}>{title}</AppText>
    </TouchableOpacity>
  );
};

export default ActionButton;
