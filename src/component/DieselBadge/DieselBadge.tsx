import React from 'react';
import {Alert, View, TouchableOpacity} from 'react-native';

import AppText from '../../theme/AppText';
import Skeleton from '../Skeleton/Skeleton';
import {DIESEL_VALUE_BONES} from '../Skeleton/Skeleton.layouts';
import styles, {MAX_FONT_SCALE} from './DieselBadge.styles';
import type {StyleProp, TextStyle, ViewStyle} from 'react-native';

/**
 * The DIESEL chip in the dashboard header — the pump price where the driver
 * is, per gallon.
 *
 * The chip always shows a figure — the newest price, the last one that came
 * back, or $0.00/gal before there has ever been one. `message` is why, when
 * the figure is not a fresh one: the chip has no room for the backend's
 * sentence ("Fuel price is available for US states only"), so that is offered
 * on tap instead of truncated. `muted` marks the $0.00 stand-in, which is an
 * absence rather than a price and is printed as one.
 *
 * `loading` shimmers a bone where the price goes. The price is re-fetched on a
 * 20-second poll, so the bone stands in the chip's own value slot rather than
 * anywhere that would move the header around it.
 *
 * That slot is a fixed box (see VALUE_SLOT_WIDTH and VALUE_SLOT_HEIGHT),
 * because the chip shares the header with the notification bell and the
 * avatar and cannot be allowed to re-measure every time the poll answers. The
 * box is cut for the widest price a pump prints at the largest the type is
 * allowed to get, so the price is always set at its design size — it is the
 * slot that was sized around the type, not the type squeezed into the slot.
 */
export interface DieselBadgeProps {
  label?: string;
  value?: string;
  /** Shown in an alert on tap when no `onPress` is supplied. */
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
  const explain = message
    ? () => Alert.alert('Diesel price', message)
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
    </Container>
  );
};

// Memoised, so the traffic runs one way only: the chip redraws when its own
// price changes, and a screen re-rendering for its own reasons — a filter, a
// list landing — leaves it alone. Every prop it takes is a primitive or a
// stylesheet entry, so the shallow compare is the right one.
export default React.memo(DieselBadge);
