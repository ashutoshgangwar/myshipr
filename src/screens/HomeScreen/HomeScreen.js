import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  FlatList,
  StatusBar,
} from 'react-native';
import styles from './HomeScreen.styles';
import {useNavigation} from '@react-navigation/native';
import {getCurrentLocation} from '../../utils/LocationService';
import CoreButton from '../../component/CoreButton/CoreButton';
import Profile_Icon from '../../assets/svg_icon/profile_icon.svg';
import Notification_Icon from '../../assets/svg_icon/notification.svg';
import {colors} from '../../theme/colors';
import AmountInputModal from '../../component/AmountInputModal/AmountInputModal';

const bookings = [
  {
    id: 'B001',
    pickup: 'Station A',
    drop: 'Station B',
    distance: '5 km',
    status: 'Pending',
  },
  {
    id: 'B002',
    pickup: 'Station C',
    drop: 'Station D',
    distance: '12 km',
    status: 'Paid',
  },
  {
    id: 'B003',
    pickup: 'Station E',
    drop: 'Station F',
    distance: '18 km',
    status: 'Paid',
  },
];

const documents = [
  {type: 'CDL', expiry: '2026-01-20'},
  {type: 'Insurance', expiry: '2026-02-05'},
  {type: 'Medical Card', expiry: '2026-01-15'},
];

const HomeScreen = () => {
  const navigation = useNavigation();
  const [availability, setAvailability] = useState('Available');
  const [loading, setLoading] = useState(false);
  const [amountModalVisible, setAmountModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

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

  const renderBookingCard = ({item}) => (
    <View style={styles.bookingCard}>
      <Text style={styles.bookingId}>Booking ID: {item.id}</Text>
      <Text style={styles.bookingRoute}>
        {item.pickup} ➜ {item.drop}
      </Text>
      <Text style={styles.bookingDistance}>Distance: {item.distance}</Text>

      <Text
        style={[
          styles.bookingStatus,
          item.status === 'Pending' ? styles.statusPending : styles.statusPaid,
        ]}>
        {item.status}
      </Text>

      {item.status === 'Pending' && (
        <CoreButton
          title="Fill Amount"
          onPress={() => {
            setSelectedBooking(item);
            setAmountModalVisible(true);
          }}
          backgroundColor={colors.button_color}
          textColor="#fff"
          style={{marginTop: 10}}
        />
      )}
    </View>
  );

  const renderDocumentCard = ({item}) => {
    const diffDays = Math.ceil(
      (new Date(item.expiry) - new Date()) / (1000 * 60 * 60 * 24),
    );
    const bgColor = diffDays <= 7 ? '#DC2626' : '#F97316';

    return (
      <View style={[styles.documentCard, {backgroundColor: bgColor}]}>
        <Text style={styles.documentText}>{item.type}</Text>
        <Text style={styles.documentExpiry}>Expires: {item.expiry}</Text>
      </View>
    );
  };

  return (
    <>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <Image
            source={require('../../assets/Image/logo.png')}
            style={styles.logo}
          />

          <View style={styles.topIcons}>
            <TouchableOpacity style={styles.iconWrapper}>
              <Notification_Icon width={22} height={22} />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView contentContainerStyle={{paddingBottom: 40}}>
          {/* AVAILABILITY */}
          <View style={styles.availabilityContainer}>
            {['Available', 'Busy', 'Off'].map(status => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.availabilityButton,
                  availability === status && styles.availabilitySelected,
                ]}
                onPress={() => setAvailability(status)}>
                <Text
                  style={[
                    styles.availabilityText,
                    availability === status && styles.availabilityTextSelected,
                  ]}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* <ScrollView contentContainerStyle={{paddingBottom: 40}}> */}
          {/* BOOKINGS */}
          <Text style={styles.sectionTitle}>Upcoming Bookings</Text>
          <FlatList
            data={bookings}
            renderItem={renderBookingCard}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingHorizontal: 16}}
          />

          {/* EARNINGS */}
          <View style={styles.earningsCard}>
            <Text style={styles.earningTitle}>Quick Earnings</Text>
            <Text style={styles.earningsText}>Today: ₹1,500</Text>
            <Text style={styles.earningsText}>This Week: ₹10,000</Text>
            <Text style={styles.earningsText}>This Month: ₹40,000</Text>
          </View>

          {/* DOCUMENT ALERTS */}
          <Text style={styles.sectionTitle}>Document Expiry Alerts</Text>
          <FlatList
            data={documents}
            renderItem={renderDocumentCard}
            keyExtractor={item => item.type}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingHorizontal: 16}}
          />

          {/* ACTION BUTTON */}
          <View style={styles.actionContainer}>
            <CoreButton
              title="Go to Delivery"
              loading={loading}
              // onPress={() => navigation.navigate('DeliveryConfirmation')}
              // onPress={() => navigation.navigate('AvailableLoadsScreen')}
              onPress={() => navigation.navigate('NavigationScreen')}
            />
          </View>
        </ScrollView>
        <AmountInputModal
          visible={amountModalVisible}
          onClose={() => setAmountModalVisible(false)}
          onSubmit={amount => {
            console.log('Booking:', selectedBooking?.id);
            console.log('Entered Amount:', amount);
          }}
        />
      </SafeAreaView>
    </>
  );
};

export default HomeScreen;
