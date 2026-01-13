import React from 'react';
import { View, Text } from 'react-native';
import { colors } from '../../theme/colors';
import spacing from '../../theme/spacing';


const InfoRow = ({ label, value }) => (
  <View style={{ marginBottom: spacing.sm }}>
    <Text style={{ color: colors.muted, fontSize: 13 }}>{label}</Text>
    <Text style={{ fontWeight: '500', fontSize: 15 }}>
      {value || '--'}
    </Text>
  </View>
);

export default InfoRow;
