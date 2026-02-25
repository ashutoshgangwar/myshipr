import React from 'react';
import { Text } from 'react-native';
import typography from './typography';


const AppText = ({ style, children, ...props }) => {
  return (
    <Text
      {...props}
      style={[{ fontFamily: typography.fontFamily }, style]}
    >
      {children}
    </Text>
  );
};

export default AppText;