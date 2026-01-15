import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import styles from './Profile.styles'
import { colors } from '../../theme/colors';
import ScreenHeader from '../../component/ScreenHeader/ScreenHeader';
import ActionButton from '../../component/ActionButton/ActionButton';
import { useNavigation } from '@react-navigation/native';
import { getCurrentLocation } from '../../services/LocationService';
import CoreButton from '../../component/CoreButton/CoreButton';

const Profile = () => {
  const driver = {
    name: 'Ashutosh Gangwar',
    dob: '02/05/1994',
    license: 'DL-0420110149646',
    state: 'Uttar Pradesh',
    expiry: '02/05/2034',
    completion: 80,
  };

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
        console.log('Location error:', e.message);
      } finally {
        setLoading(false);
      }
    };
  return (
    <View style={styles.screen}>
      <ScreenHeader title="Driver Profile" />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.profileCard}>
          <Image
            source={require('../../assets/Image/profile.jpeg')}
            style={styles.avatar}
          />

          <Text style={styles.name}>{driver.name}</Text>

          <View style={styles.badgeRow}>
            <Text style={styles.verifiedBadge}>✅ AI Verified</Text>
            <Text style={styles.progressBadge}>
              {driver.completion}% Complete
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${driver.completion}%` },
              ]}
            />
          </View>
        </View>

          <View style={styles.card}>
          <Text style={styles.title}>myShipr OCR</Text>
          <Text style={styles.subtitle}>
            Scan tickets, invoices & documents instantly
          </Text>

          {/* Camera Scan Button */}
          <TouchableOpacity style={styles.primaryButton} onPress={handleScan}>
            <Text style={styles.primaryButtonText}>📷 Scan with Camera</Text>
          </TouchableOpacity>

          {/* Location Button */}
          <View style={{ marginTop: 16 }}>
            <CoreButton
              title={loading ? 'Fetching location...' : 'Get Location'}
              onPress={fetchLocation}
              loading={loading}
              disabled={loading}
            />
          </View>

          <Text style={styles.footerText}>Supports English & Hindi</Text>
        </View>

        <View style={styles.card}>
          <InfoRow label="Date of Birth" value={driver.dob} />
          <InfoRow label="License Number" value={driver.license} />
          <InfoRow label="Issuing State" value={driver.state} />
          <InfoRow label="Expiry Date" value={driver.expiry} />
        </View>

        <ActionButton
          title="Continue"
          bgColor={colors.primary}
          textColor="#fff"
        />
      </ScrollView>
    </View>
  );
};

const InfoRow = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

export default Profile;
