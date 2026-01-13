import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import styles from './CoreButton.styles';

const CoreButton = ({
  title,
  onPress,
  backgroundColor = '#000',
  textColor = '#fff',
  borderColor,
  icon = null,
  loading = false,
  disabled = false,
}) => {
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
          <Text style={[styles.text, { color: textColor }]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default CoreButton;
