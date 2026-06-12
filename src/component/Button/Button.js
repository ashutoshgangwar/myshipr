import {TouchableOpacity, Image, Platform} from 'react-native';
import React, {useMemo} from 'react';
import { moderateScale} from 'react-native-size-matters';
import makeStyles from './Button.styles';
import AppText from '../../theme/AppText';
import useDeviceType from '../../hooks/useDeviceType';


const Button = ({
  title,
  onPress,
  backgroundColor = '#000',
  textColor = '#fff',
  icon,
  IconComponent,
  iconSize = moderateScale(20),
  borderColor,
  disabled = false,
  style,
  textStyle,
  activeOpacity,
  platformType,
}) => {
  const {isTablet} = useDeviceType();
  const styles = useMemo(() => makeStyles(isTablet), [isTablet]);
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
