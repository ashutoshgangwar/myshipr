import React from 'react';
import {View, Text, Image} from 'react-native';
import LogoImage from '../../assets/Image/logo.png';
import styles from '../../screens/NavigationScreen/NavigationScreen.styles';
import AppText from '../../theme/AppText';

const CustomMarker = ({type = 'default', title, showLogo = false}) => {
  const getMarkerStyle = () => {
    switch (type) {
      case 'source':
        return styles.markerSourceStyle;
      case 'destination':
        return styles.markerDestinationStyle;
      case 'waypoint':
        return styles.markerWaypointStyle;
      default:
        return styles.markerDefaultStyle;
    }
  };

  if (showLogo) {
    return (
      <View style={getMarkerStyle()}>
        <Image source={LogoImage} style={styles.markerImage} />
      </View>
    );
  }

  const getMarkerLabel = () => {
    switch (type) {
      case 'source':
        return 'S';
      case 'destination':
        return 'D';
      case 'waypoint':
        return 'W';
      default:
        return '•';
    }
  };

  return (
    <View style={getMarkerStyle()}>
      <AppText style={styles.markerLabel}>{getMarkerLabel()}</AppText>
    </View>
  );
};

export default CustomMarker;
