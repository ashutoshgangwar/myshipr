import React from 'react';
import {View, TouchableOpacity, ActivityIndicator} from 'react-native';
import GPS_Icon from '../../assets/svg_icon/gps-svg.svg';
import styles from '../../screens/NavigationScreen/NavigationScreen.styles';

const GPSButton = ({onPress, disabled, loading}) => {
  return (
    <View style={styles.fabContainer}>
      <TouchableOpacity
        style={styles.fab}
        onPress={onPress}
        disabled={disabled}>
        {loading ? (
          <ActivityIndicator size="small" color="#3B82F6" />
        ) : (
          <GPS_Icon width={28} height={28} />
        )}
      </TouchableOpacity>
    </View>
  );
};

export default GPSButton;
