import React from 'react';
import {TouchableOpacity} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';

/**
 * Full-width call-to-action that replaces the milestone card once the driver
 * has confirmed the step — "VERIFY PICKUP" / "VERIFY DROP".
 *
 * Floats directly above the trip-progress card; `barHeight` is that card's
 * measured height, so the two never overlap on any device.
 */
export interface VerifyStopButtonProps {
  visible?: boolean;
  label?: string;
  /** Height of the progress card this button floats above. */
  barHeight?: number;
  gap?: number;
  onPress?: () => void;
}

export default function VerifyStopButton({
  visible = false,
  label = 'VERIFY PICKUP',
  barHeight = 0,
  gap = 10,
  onPress,
}: VerifyStopButtonProps) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  return (
    <TouchableOpacity
      style={[
        styles.verifyActionBtn,
        {bottom: styles.verifyActionBtn.bottom + insets.bottom + barHeight + gap},
      ]}
      onPress={onPress}
      activeOpacity={0.85}>
      <AppText style={styles.verifyActionText}>{label}</AppText>
    </TouchableOpacity>
  );
}
