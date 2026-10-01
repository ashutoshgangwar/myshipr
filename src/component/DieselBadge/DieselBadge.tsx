import React from 'react';
import {View, TouchableOpacity} from 'react-native';

import AppText from '../../theme/AppText';
import Skeleton from '../Skeleton/Skeleton';
import {DIESEL_VALUE_BONES} from '../Skeleton/Skeleton.layouts';
import styles, {MAX_FONT_SCALE} from './DieselBadge.styles';
import ErrorModal from '../ErrorModal/ErrorModal';
import useErrorModal from '../../hooks/useErrorModal';
import type {StyleProp, TextStyle, ViewStyle} from 'react-native';

export interface DieselBadgeProps {
  label?: string;
  value?: string;
  /** Shown in the shared modal on tap when no `onPress` is supplied. */
  message?: string | null;
  muted?: boolean;
  loading?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  valueStyle?: StyleProp<TextStyle>;
}

const DieselBadge = ({
  label = 'DIESEL',
  value = '$0.00/gal',
  message,
  muted = false,
  loading = false,
  onPress,
  style,
  labelStyle,
  valueStyle,
}: DieselBadgeProps) => {
  // The app's one dialog — see `hooks/useErrorModal`. One badge per screen
  // rather than one per row, so it carries its own.
  const {modalProps, showMessage} = useErrorModal();
  const explain = message
    ? () => showMessage({title: 'Diesel price', message, closeText: 'OK'})
    : undefined;
  const handlePress = onPress ?? explain;
  const Container = handlePress ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.badge, style]}
      {...(handlePress && {activeOpacity: 0.85, onPress: handlePress})}>
      <AppText
        numberOfLines={1}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        style={[styles.label, labelStyle]}>
        {label}
      </AppText>
      <Skeleton
        isLoading={loading}
        layout={DIESEL_VALUE_BONES}
        containerStyle={styles.valueSkeleton}
        onDark>
        <AppText
          numberOfLines={1}
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          style={[styles.value, muted && styles.valueMuted, valueStyle]}>
          {value}
        </AppText>
      </Skeleton>

      <ErrorModal {...modalProps} />
    </Container>
  );
};

// Memoised, so the traffic runs one way only: the chip redraws when its own
// price changes, and a screen re-rendering for its own reasons — a filter, a
// list landing — leaves it alone. Every prop it takes is a primitive or a
// stylesheet entry, so the shallow compare is the right one.
export default React.memo(DieselBadge);
