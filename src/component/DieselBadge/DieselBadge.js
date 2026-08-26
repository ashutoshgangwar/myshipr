import React from 'react';
import {Alert, View, TouchableOpacity} from 'react-native';

import AppText from '../../theme/AppText';
import Skeleton from '../Skeleton/Skeleton';
import {DIESEL_VALUE_BONES} from '../Skeleton/Skeleton.layouts';
import styles from './DieselBadge.styles';

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
 */
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
}) => {
  const explain = message
    ? () => Alert.alert('Diesel price', message)
    : undefined;
  const handlePress = onPress ?? explain;
  const Container = handlePress ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.badge, style]}
      {...(handlePress && {activeOpacity: 0.85, onPress: handlePress})}>
      <AppText style={[styles.label, labelStyle]}>{label}</AppText>
      <Skeleton
        isLoading={loading}
        layout={DIESEL_VALUE_BONES}
        containerStyle={styles.valueSkeleton}
        onDark>
        <AppText
          style={[styles.value, muted && styles.valueMuted, valueStyle]}>
          {value}
        </AppText>
      </Skeleton>
    </Container>
  );
};

export default DieselBadge;
