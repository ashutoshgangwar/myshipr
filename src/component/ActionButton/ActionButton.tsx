import React from 'react';
import { TouchableOpacity } from 'react-native';
import styles from './ActionButton.styles';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';

export interface ActionButtonProps {
  title?: string;
  onPress?: () => void;
  bgColor?: string;
  textColor?: string;
  disabled?: boolean;
}

const ActionButton = ({
  title,
  onPress,
  bgColor = colors.accentBlue,
  textColor = colors.white,
  disabled = false,
}: ActionButtonProps) => {
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
