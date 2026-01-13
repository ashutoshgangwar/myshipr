import React, {useState} from 'react';
import {View, Text, TouchableOpacity, SafeAreaView} from 'react-native';
import styles from './HomeScreen.styles';
import {useNavigation} from '@react-navigation/native';
import {getCurrentLocation} from '../../utils/LocationService';
import CoreButton from '../../component/CoreButton/CoreButton';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);

  const handleScan = () => {
    navigation.navigate('DriverOnboarding');
  };

  const fetchLocation = async () => {
    setLoading(true);
    try {
      const loc = await getCurrentLocation();
      console.log('Lat Long:', loc);
    } catch (e) {
      console.log('Location error----:', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>myShipr OCR</Text>
        <Text style={styles.subtitle}>
          Scan tickets, invoices & documents instantly
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={handleScan}>
          <Text style={styles.primaryButtonText}>📷 Scan with Camera</Text>
        </TouchableOpacity>

        {/* LOCATION BUTTON */}
        <View style={{marginTop: 16}}>
          <CoreButton
            title={loading ? 'Fetching location...' : 'Get Location'}
            onPress={fetchLocation}
            loading={loading}
            disabled={loading}
          />
        </View>
        <Text style={styles.footerText}>Supports English & Hindi</Text>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;
