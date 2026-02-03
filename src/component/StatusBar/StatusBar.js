import React, {useEffect, useState} from 'react';
import {
  StatusBar as RNStatusBar,
  Platform,
  View,
  StyleSheet,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const StatusBar = ({
  backgroundColor,
  barStyle = 'dark-content',
  translucent = false,
  hidden = false,
}) => {
  const insets = useSafeAreaInsets();
  const [statusBarHeight, setStatusBarHeight] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'android') {
      let height = 24;

      if (Platform.Version >= 21 && Platform.Version < 30) {
        height = translucent ? insets.top : 0;
      } else if (Platform.Version >= 30) {
        height = insets.top;
      }

      setStatusBarHeight(height);
    }
  }, [insets, translucent]);

  if (Platform.OS === 'ios') {
    return (
      <View
        style={[
          styles.statusBar,
          {
            backgroundColor,
            height: hidden ? 0 : insets.top,
          },
        ]}>
        <RNStatusBar
          translucent={translucent}
          backgroundColor={backgroundColor}
          barStyle={barStyle}
          hidden={hidden}
        />
      </View>
    );
  }

  return (
    <>
      {!hidden && (
        <View
          style={[
            styles.statusBar,
            {
              backgroundColor: translucent ? 'transparent' : backgroundColor,
              height: statusBarHeight,
            },
          ]}
        />
      )}

      <RNStatusBar
        translucent={translucent}
        backgroundColor={translucent ? 'transparent' : backgroundColor}
        barStyle={barStyle}
        hidden={hidden}
      />
    </>
  );
};

const styles = StyleSheet.create({
  statusBar: {
    zIndex: 9999,
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});

export default StatusBar;