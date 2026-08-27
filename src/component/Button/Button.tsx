import {TouchableOpacity, Image, Platform} from 'react-native';
import React, {useMemo} from 'react';
import { moderateScale} from 'react-native-size-matters';
import makeStyles from './Button.styles';
import AppText from '../../theme/AppText';
import useDeviceType from '../../hooks/useDeviceType';
import type {
  ImageSourcePropType,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import type {SvgProps} from 'react-native-svg';

export interface ButtonProps {
  title?: string;
  onPress?: () => void;
  backgroundColor?: string;
  textColor?: string;
  /** A bitmap icon, rendered through `<Image>`. */
  icon?: ImageSourcePropType;
  /** An SVG icon component, rendered instead of `icon` when given. */
  IconComponent?: React.FC<SvgProps>;
  iconSize?: number;
  borderColor?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  activeOpacity?: number;
  /** Forces the iOS or Android look regardless of the real platform. */
  platformType?: 'ios' | 'android';
}

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
}: ButtonProps) => {
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
