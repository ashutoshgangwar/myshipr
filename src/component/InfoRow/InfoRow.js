import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../theme/colors';
import spacing from '../../theme/spacing';
import AppText from '../../theme/AppText';


const InfoRow = ({ label, value }) => (
  <View style={{ marginBottom: spacing.sm }}>
    <AppText style={{ color: colors.muted, fontSize: 13 }}>{label}</AppText>
    <AppText style={{ fontWeight: '500', fontSize: 15 }}>
      {value || '--'}
    </AppText>
  </View>
);

export default InfoRow;
