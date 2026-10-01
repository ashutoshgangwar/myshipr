import React from 'react';
import {TouchableOpacity} from 'react-native';
import type {Insets, StyleProp, ViewStyle} from 'react-native';

import styles from './RetryButton.styles';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import RefreshIcon from '../../assets/svg_icon/Refresh.svg';

export interface RetryButtonProps {
  onPress?: () => void;
  label?: string;
  size?: number;
  /** Overrides the tint that `onDark` would otherwise pick. */
  color?: string;
  onDark?: boolean;
  style?: StyleProp<ViewStyle>;
  hitSlop?: Insets;
  accessibilityLabel?: string;
}

const RetryButton = ({
  onPress,
  label,
  size = 18,
  color,
  onDark = false,
  style,
  hitSlop = {top: 10, bottom: 10, left: 10, right: 10},
  accessibilityLabel = 'Try again',
}: RetryButtonProps) => {
  const tint = color ?? (onDark ? colors.white : colors.textMuted);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      hitSlop={hitSlop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[styles.button, style]}>
      <RefreshIcon width={size} height={size} color={tint} />
      {label ? (
        <AppText style={[styles.label, {color: tint}]} numberOfLines={1}>
          {label}
        </AppText>
      ) : null}
    </TouchableOpacity>
  );
};

export default RetryButton;
