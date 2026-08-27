import React from 'react';
import {
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import styles from './CoreButton.styles';
import AppText from '../../theme/AppText';

export interface CoreButtonProps {
  title?: string;
  onPress?: () => void;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  /** Rendered to the left of the title; already an element, not a component. */
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}

const CoreButton = ({
  title,
  onPress,
  backgroundColor = '#000',
  textColor = '#fff',
  borderColor,
  icon = null,
  loading = false,
  disabled = false,
}: CoreButtonProps) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        { backgroundColor },
        borderColor && { borderWidth: 1, borderColor },
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <AppText style={[styles.text, { color: textColor }]}>
            {title}
          </AppText>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default CoreButton;
