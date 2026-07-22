import React from 'react';
import {View, TouchableOpacity} from 'react-native';

import AppText from '../../theme/AppText';
import styles from './DieselBadge.styles';

const DieselBadge = ({
  label = 'DIESEL',
  value = '$3.89/gal',
  onPress,
  style,
  labelStyle,
  valueStyle,
}) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      style={[styles.badge, style]}
      {...(onPress && {activeOpacity: 0.85, onPress})}>
      <AppText style={[styles.label, labelStyle]}>{label}</AppText>
      <AppText style={[styles.value, valueStyle]}>{value}</AppText>
    </Container>
  );
};

export default DieselBadge;
