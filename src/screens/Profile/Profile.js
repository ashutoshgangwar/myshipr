import React, {useState} from 'react';
import {View, Text, ScrollView, Image, TouchableOpacity} from 'react-native';
import styles from './Profile.styles';
import {colors} from '../../theme/colors';
import ScreenHeader from '../../component/ScreenHeader/ScreenHeader';
import ActionButton from '../../component/ActionButton/ActionButton';
import {useNavigation} from '@react-navigation/native';
import {getCurrentLocation} from '../../services/LocationService';
import CoreButton from '../../component/CoreButton/CoreButton';
import {GOOGLE_MAPS_API_KEY} from '@env';

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
  const [address, setAddress] = useState('');

  const handleScan = () => {
    navigation.navigate('DriverOnboarding');
  };
  const fetchLocation = async () => {
    setLoading(true);
    try {
      const loc = await getCurrentLocation();
      console.log('Lat Long:', loc.latitude, loc.longitude);

      const fetchedAddress = await getAddressFromLatLng(
        loc.latitude,
        loc.longitude,
      );

      setAddress(fetchedAddress);
    } catch (e) {
      console.log('Location error:', e.message);
    } finally {
      setLoading(false);
    }
  };

  const getAddressFromLatLng = async (latitude, longitude) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      } else {
        console.log('Reverse geocode failed:', data.status);
        return '';
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
      return '';
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
              style={[styles.progressFill, {width: `${driver.completion}%`}]}
            />
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.iconCircle}>
            <Text style={{fontSize: 22}}>📷</Text>
          </View>

          <Text style={styles.title}>myShipr OCR</Text>
          <Text style={styles.subtitle}>
            Scan tickets, invoices & documents instantly
          </Text>

          <TouchableOpacity style={styles.primaryButton} onPress={handleScan}>
            <Text style={styles.primaryButtonText}>Scan with Camera</Text>
          </TouchableOpacity>

          <CoreButton
            title={loading ? 'Fetching location...' : 'Get Location'}
            onPress={fetchLocation}
            loading={loading}
            disabled={loading}
          />

          {address ? (
            <View style={{marginTop: 12}}>
              <Text style={{fontSize: 14, color: colors.textSecondary}}>
                📍 Current Location
              </Text>
              <Text style={{fontSize: 15, color: colors.textPrimary}}>
                {address}
              </Text>
            </View>
          ) : null}

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

const InfoRow = ({label, value}) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

export default Profile;
