import React from 'react';
import {Text, StyleSheet} from 'react-native';
import type {TextProps} from 'react-native';
import typography from './typography';

/**
 * `<Text>` with the Poppins family resolved from `fontWeight`.
 *
 * Props extend RN's own `TextProps`, so every `numberOfLines`, `onPress`,
 * `accessibilityLabel` and the rest keep working and stay typed — the
 * component only ever added behaviour to `style`, never removed props.
 */
const AppText: React.FC<TextProps> = ({style, children, ...props}) => {
  const flat = StyleSheet.flatten(style) || {};
  const {fontWeight, fontFamily, ...rest} = flat;
  const resolvedFamily = fontFamily || typography.fontFamilyForWeight(fontWeight);

  return (
    <Text {...props} style={[rest, {fontFamily: resolvedFamily}]}>
      {children}
    </Text>
  );
};

export default AppText;
