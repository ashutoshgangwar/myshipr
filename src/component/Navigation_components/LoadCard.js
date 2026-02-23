import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import Truck_Icon from '../../assets/svg_icon/truck-icon.svg';
import styles from '../../screens/NavigationScreen/NavigationScreen.styles';

const LoadCard = ({
  navigationStarted,
  remainingDistance,
  remainingTime,
  pickupAddress,
  dropAddress,
  destination,
  onNavigatePress,
}) => {
  return (
    <View style={styles.loadCard}>
      <View style={styles.loadCardRow}>
        {/* LEFT CONTENT */}
        <View style={styles.loadLeft}>
          <Text style={styles.cardTitle}>Current Load</Text>

          <Text style={styles.cardText}>Pickup: {pickupAddress}</Text>

          <Text style={styles.cardText}>Drop: {dropAddress}</Text>

          <Text style={styles.cardText}>
            {navigationStarted
              ? `Remaining: ${(remainingDistance / 1000).toFixed(
                  1,
                )} km • ETA: ${Math.ceil(remainingTime / 60)} min`
              : 'ETA: N/A'}
          </Text>
        </View>

        {/* RIGHT CONTENT */}
        <View style={styles.loadRight}>
          <Text
            style={[
              styles.status,
              navigationStarted && {
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
              },
            ]}>
            {navigationStarted ? 'Navigating' : 'On Route'}
          </Text>
        </View>
      </View>
      {destination && (
        <TouchableOpacity
          style={styles.navigateButton}
          onPress={onNavigatePress}
          activeOpacity={0.8}>
          <Text style={styles.navigateText}>Start Navigation</Text>
          <View style={styles.iconCircle}>
            <Truck_Icon width={25} height={25} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default LoadCard;
