import {TouchableOpacity, Image, Platform} from 'react-native';
import React from 'react';
import styles from './Button.styles';
import AppText from '../../theme/AppText';


const Button = ({
  title,
  onPress,
  backgroundColor = '#000',
  textColor = '#fff',
  icon,
  IconComponent,
  iconSize = 20,
  borderColor,
  disabled = false,
  style,
  textStyle,
  activeOpacity,
  platformType,
}) => {
  const resolvedPlatform = platformType || Platform.OS;
  const isIOS = resolvedPlatform === 'ios';
  const resolvedActiveOpacity = activeOpacity ?? (isIOS ? 0.75 : 0.85);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isIOS ? styles.iosButton : styles.androidButton,
        disabled && styles.disabledButton,
        {
          backgroundColor,
          borderColor: borderColor || backgroundColor,
        },
        style,
      ]}
      activeOpacity={resolvedActiveOpacity}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
    >
      {IconComponent ? (
        <IconComponent width={iconSize} height={iconSize} style={styles.icon} />
      ) : (
        icon && <Image source={icon} style={styles.icon} />
      )}
      <AppText style={[styles.text, {color: textColor}, textStyle]}>{title}</AppText>
    </TouchableOpacity>
  );
};

export default Button;
