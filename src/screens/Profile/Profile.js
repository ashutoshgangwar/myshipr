import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import styles from './Profile.styles';
import StatusBar from '../../component/StatusBar/StatusBar';
import { colors } from '../../theme/colors';

const Profile = () => {
  return (
    <SafeAreaView style={styles.container}>
       <StatusBar
            backgroundColor={colors.primary}
            barStyle="dark-content"
            translucent={false}
          />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar} />
          <Text style={styles.name}>Ashutosh Gangwar</Text>
          <Text style={styles.subTitle}>CDL Class A • ID: DRV-4521</Text>

          <View style={styles.badgeRow}>
            <View style={styles.verifiedBadge}>
              <Text style={styles.badgeText}>Verified</Text>
            </View>
            <View style={styles.ratingBadge}>
              <Text style={styles.badgeText}>⭐ 4.9</Text>
            </View>
          </View>
        </View>

        {/* Stats Card */}
        <View style={styles.card}>
          <View style={styles.statRow}>
            <Stat title="247" subtitle="Total Deliveries" />
            <Stat title="98.5%" subtitle="On-Time Rate" />
          </View>

          <View style={styles.statRow}>
            <Stat title="$156k" subtitle="Total Earnings" />
            <Stat title="5 yrs" subtitle="Experience" />
          </View>
        </View>

        {/* Documents */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Documents & Verification</Text>

          <DocItem
            title="CDL License"
            subtitle="Expires: May 20, 2028"
            status="Verified"
          />

          <DocItem
            title="DOT Medical"
            subtitle="Expires: Jan 15, 2027"
            status="Verified"
          />

          <DocItem
            title="Insurance"
            subtitle="Expires: Dec 31, 2026"
            status="Verified"
          />

          <DocItem
            title="Vehicle Registration"
            status="Pending"
            pending
          />
        </View>

        {/* Vehicle */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Assigned Vehicle</Text>
          <Text style={styles.vehicleTitle}>Semi-Truck 18-Wheeler</Text>
          <Text style={styles.vehicleSub}>CA • ABC1234</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/* ---------- Components ---------- */

const Stat = ({ title, subtitle }) => (
  <View style={styles.statBox}>
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statSub}>{subtitle}</Text>
  </View>
);

const DocItem = ({ title, subtitle, status, pending }) => (
  <View style={styles.docRow}>
    <View>
      <Text style={styles.docTitle}>{title}</Text>
      {subtitle && <Text style={styles.docSub}>{subtitle}</Text>}
    </View>
    <View
      style={[
        styles.statusBadge,
        pending ? styles.pending : styles.verified,
      ]}
    >
      <Text style={styles.statusText}>{status}</Text>
    </View>
  </View>
);

export default Profile;

// import React, {useState} from 'react';
// import {View, Text, ScrollView, Image, TouchableOpacity, SafeAreaView} from 'react-native';
// import styles from './Profile.styles';
// import {colors} from '../../theme/colors';
// import ScreenHeader from '../../component/ScreenHeader/ScreenHeader';
// import ActionButton from '../../component/ActionButton/ActionButton';
// import {useNavigation} from '@react-navigation/native';
// import {getCurrentLocation} from '../../services/LocationService';
// import CoreButton from '../../component/CoreButton/CoreButton';
// import {GOOGLE_MAPS_API_KEY} from '@env';

// const Profile = () => {
//   const driver = {
//     name: 'Ashutosh Gangwar',
//     dob: '02/05/1994',
//     license: 'DL-0420110149646',
//     state: 'Uttar Pradesh',
//     expiry: '02/05/2034',
//     completion: 80,
//   };

//   const navigation = useNavigation();
//   const [loading, setLoading] = useState(false);
//   const [address, setAddress] = useState('');

//   const handleScan = () => {
//     navigation.navigate('DriverOnboarding');
//   };
//   const fetchLocation = async () => {
//     setLoading(true);
//     try {
//       const loc = await getCurrentLocation();
//       console.log('Lat Long:', loc.latitude, loc.longitude);

//       const fetchedAddress = await getAddressFromLatLng(
//         loc.latitude,
//         loc.longitude,
//       );

//       setAddress(fetchedAddress);
//     } catch (e) {
//       console.log('Location error:', e.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getAddressFromLatLng = async (latitude, longitude) => {
//     try {
//       const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;

//       const response = await fetch(url);
//       const data = await response.json();

//       if (data.status === 'OK' && data.results.length > 0) {
//         return data.results[0].formatted_address;
//       } else {
//         console.log('Reverse geocode failed:', data.status);
//         return '';
//       }
//     } catch (error) {
//       console.error('Reverse geocode error:', error);
//       return '';
//     }
//   };

//   return (
//     <SafeAreaView style={styles.safeArea}>
//     <View style={styles.screen}>
//       <ScreenHeader title="Driver Profile" />

//       <ScrollView contentContainerStyle={styles.container}>
//         <View style={styles.profileCard}>
//           <Image
//             source={require('../../assets/Image/profile.jpeg')}
//             style={styles.avatar}
//           />

//           <Text style={styles.name}>{driver.name}</Text>

//           <View style={styles.badgeRow}>
//             <Text style={styles.verifiedBadge}>✅ AI Verified</Text>
//             <Text style={styles.progressBadge}>
//               {driver.completion}% Complete
//             </Text>
//           </View>
//           <View style={styles.progressBar}>
//             <View
//               style={[styles.progressFill, {width: `${driver.completion}%`}]}
//             />
//           </View>
//         </View>

//         <View style={styles.featureCard}>
//           <View style={styles.iconCircle}>
//             <Text style={{fontSize: 22}}>📷</Text>
//           </View>

//           <Text style={styles.title}>myShipr OCR</Text>
//           <Text style={styles.subtitle}>
//             Scan tickets, invoices & documents instantly
//           </Text>

//           <TouchableOpacity style={styles.primaryButton} onPress={handleScan}>
//             <Text style={styles.primaryButtonText}>Scan with Camera</Text>
//           </TouchableOpacity>

//           <CoreButton
//             title={loading ? 'Fetching location...' : 'Get Location'}
//             onPress={fetchLocation}
//             loading={loading}
//             disabled={loading}
//           />

//           {address ? (
//             <View style={{marginTop: 12}}>
//               <Text style={{fontSize: 14, color: colors.textSecondary}}>
//                 📍 Current Location
//               </Text>
//               <Text style={{fontSize: 15, color: colors.textPrimary}}>
//                 {address}
//               </Text>
//             </View>
//           ) : null}

//           <Text style={styles.footerText}>Supports English & Hindi</Text>
//         </View>

//         <View style={styles.card}>
//           <InfoRow label="Date of Birth" value={driver.dob} />
//           <InfoRow label="License Number" value={driver.license} />
//           <InfoRow label="Issuing State" value={driver.state} />
//           <InfoRow label="Expiry Date" value={driver.expiry} />
//         </View>

//         <ActionButton
//           title="Continue"
//           bgColor={colors.primary}
//           textColor="#fff"
//         />
//       </ScrollView>
//     </View>
//     </SafeAreaView>
//   );
// };

// const InfoRow = ({label, value}) => (
//   <View style={styles.row}>
//     <Text style={styles.label}>{label}</Text>
//     <Text style={styles.value}>{value}</Text>
//   </View>
// );

// export default Profile;
