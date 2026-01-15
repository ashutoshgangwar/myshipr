import React from 'react';
import { View, Text, Image, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import styles from './NavigationScreen.styles';

import Weather_Icon from '../../assets/svg_icon/weather.svg';
import Traffic_Icon from '../../assets/svg_icon/traffic_icon.svg';
import Delayed_Icon from '../../assets/svg_icon/delayed.svg';
import Dock_Icon from '../../assets/svg_icon/dock.svg';
import SOS_Icon from '../../assets/svg_icon/sos.svg';

const NavigationScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Current Load Card */}
      <View style={styles.loadCard}>
        <Text style={styles.cardTitle}>Current Load</Text>
        <Text style={styles.cardText}>Pickup: Warehouse A</Text>
        <Text style={styles.cardText}>Drop: Station B</Text>
        <Text style={styles.cardText}>ETA: 45 min</Text>

        <View style={styles.iconRow}>
          <Weather_Icon width={28} height={28} />
          <Traffic_Icon  width={28} height={28} />
        </View>

        <Text style={styles.status}>Status: On Route</Text>
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        <Image
          source={require('../../assets/Image/map.jpeg')}
          style={styles.mapImage}
        />

        {/* Floating Action Buttons */}
        <View style={styles.floatingButtons}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#FBBF24' }]}>
            <Delayed_Icon width={24} height={24} />
            <Text style={styles.actionText}>Delayed</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}>
            <Dock_Icon width={24} height={24} />
            <Text style={styles.actionText}>Issue at Dock</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#DC2626' }]}>
            <SOS_Icon width={24} height={24} />
            <Text style={styles.actionText}>SOS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Geofence Notification */}
      <View style={styles.geofenceCard}>
        <Text style={styles.geofenceText}>
          ⚠️ Geofence Auto-Update: You are approaching Station B
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default NavigationScreen;
