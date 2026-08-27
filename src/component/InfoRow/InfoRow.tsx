import React from 'react';
import { View } from 'react-native';
import { colors } from '../../theme/colors';
import spacing from '../../theme/spacing';
import AppText from '../../theme/AppText';


export interface InfoRowProps {
  label?: string;
  value?: string | number | null;
}

const InfoRow = ({ label, value }: InfoRowProps) => (
  <View style={{ marginBottom: spacing.sm }}>
    <AppText style={{ color: colors.muted, fontSize: 13 }}>{label}</AppText>
    <AppText style={{ fontWeight: '500', fontSize: 15 }}>
      {value || '--'}
    </AppText>
  </View>
);

export default InfoRow;
