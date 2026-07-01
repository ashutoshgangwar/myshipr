import React from 'react';
import { Text, StyleSheet } from 'react-native';
import typography from './typography';

const AppText = ({ style, children, ...props }) => {
  const flat = StyleSheet.flatten(style) || {};
  const { fontWeight, fontFamily, ...rest } = flat;
  const resolvedFamily = fontFamily || typography.fontFamilyForWeight(fontWeight);

  return (
    <Text {...props} style={[rest, { fontFamily: resolvedFamily }]}>
      {children}
    </Text>
  );
};

export default AppText;
