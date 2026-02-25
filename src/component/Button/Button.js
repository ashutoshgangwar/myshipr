import { TouchableOpacity, Text, Image, View } from 'react-native';
import React from 'react';
import styles from './Button.styles';
import AppText from '../../theme/AppText';


const Button = ({
  title,
  onPress,
  backgroundColor = '#000',
  textColor = '#fff',
  icon,
  borderColor,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor,
          borderColor: borderColor || backgroundColor,
        },
      ]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      {icon && <Image source={icon} style={styles.icon} />}
      <AppText style={[styles.text, { color: textColor }]}>{title}</AppText>
    </TouchableOpacity>
  );
};

export default Button;
