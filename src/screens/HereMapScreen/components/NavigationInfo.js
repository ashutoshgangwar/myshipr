import React from 'react';
import {View, TouchableOpacity, Text} from 'react-native';
import styles from '../HereMapScreen.styles';

export function NavigationInfo({navigationInfo, routeSummary, isNavigating, onStop}) {
  // Navigation info bar during active navigation
  if (isNavigating && navigationInfo) {
    return (
      <View style={styles.navInfoBar}>
        <View style={styles.navInfoRow}>
          <View style={styles.navInfoEta}>
            <Text style={styles.navInfoEtaText}>{navigationInfo.etaText}</Text>
          </View>
          <View style={styles.navInfoDivider} />
          <View style={styles.navInfoDetails}>
            <Text style={styles.navInfoDistText}>
              {navigationInfo.distKm} km remaining
            </Text>
            <Text style={styles.navInfoArrivalText}>
              Arrival at {navigationInfo.arrivalStr}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.navStopButton}
            onPress={onStop}
            activeOpacity={0.75}>
            <Text style={styles.navStopButtonText}>Stop</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
}

