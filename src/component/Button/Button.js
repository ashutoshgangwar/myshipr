import { TouchableOpacity, Text, Image, View } from 'react-native';
import React from 'react';
import styles from './Button.styles';


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
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
};

export default Button;
