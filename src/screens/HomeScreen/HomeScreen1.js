import React, {useState} from 'react';
import {
  Image,
  View,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import styles from './HomeScreen1.styles';
import StatusBar from '../../component/StatusBar/StatusBar';
import {colors} from '../../theme/colors';
import SOS_Icon from './../../assets/svg_icon/sos.svg';
import Mechanic_call_Icon from './../../assets/svg_icon/mechanic_call.svg';
import AppText from '../../theme/AppText';
import MapSection from '../../component/MapSection/MapSection';
import ReceiverSignaturePad, {
  SIGNATURE_STORAGE_KEY,
} from '../../component/ReceiverSignaturePad/ReceiverSignaturePad';


const INITIAL_REGION = {
  latitude: 27.55,
  longitude: 78.35,
  latitudeDelta: 6,
  longitudeDelta: 6,
};

const FULLSCREEN_REGION = {
  latitude: 28.6139,
  longitude: 77.209,
  latitudeDelta: 0.045,
  longitudeDelta: 0.045,
};

const UPCOMING_STOPS = [
  {
    id: 'pickup',
    type: 'pickup',
    label: 'Pickup',
    place: 'Delhi, IN',
    coordinate: {latitude: 28.6139, longitude: 77.209},
    dateTime: '08 Apr • 10:30 AM IST',
  },
  {
    id: 'service',
    type: 'service',
    label: 'Service',
    place: 'Jaipur, IN',
    coordinate: {latitude: 26.9124, longitude: 75.7873},
    dateTime: '08 Apr • 01:45 PM IST',
  },
  {
    id: 'delivery',
    type: 'delivery',
    label: 'Delivery',
    place: 'Lucknow, IN',
    coordinate: {latitude: 26.8467, longitude: 80.9462},
    dateTime: '08 Apr • 06:15 PM IST',
  },
];


const HomeScreen = () => {
  const navigation = useNavigation();

  const [isJobStarted, setIsJobStarted] = useState(false);
  const [isSignaturePadVisible, setIsSignaturePadVisible] = useState(false);
  const [receiverSignature, setReceiverSignature] = useState(null);

  const loadSavedSignature = async () => {
    try {
      const stored = await AsyncStorage.getItem(SIGNATURE_STORAGE_KEY);
      setReceiverSignature(stored ? JSON.parse(stored) : null);
    } catch (err) {
      console.log('Unable to load saved signature:', err?.message || err);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadSavedSignature();
    }, []),
  );

  const handleSignatureSaved = signaturePayload => {
    setReceiverSignature(signaturePayload);
  };

  const openMap_Here = () => navigation.navigate('HereSearchScreen');

  const openSignatureCapture  = () => setIsSignaturePadVisible(true);
  const closeSignatureCapture = () => setIsSignaturePadVisible(false);

  const toggleJobStatus = () => setIsJobStarted(prev => !prev);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        backgroundColor={colors.primary}
        barStyle="light-content"
        translucent={false}
      />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <AppText style={styles.welcome}>Welcome back after update,</AppText>
            <AppText style={styles.username}>Ashutosh Gangwar</AppText>
          </View>
          <TouchableOpacity style={styles.profileCircle}>
            <Mechanic_call_Icon width={30} height={30} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileCircle}>
            <SOS_Icon width={30} height={30} />
          </TouchableOpacity>
        </View>

        {/* STATS */}
        <View style={styles.statsCard}>
          <StatItem title="Active Loads" value="12"     color="#2563EB" />
          <Divider />
          <StatItem title="This Week"    value="$8,450" color="#16A34A" />
          <Divider />
          <StatItem title="HOS Left"     value="42h"    color="#EA580C" />
        </View>

        {/* LIVE MAP */}
        <View style={styles.sectionRow}>
          <AppText style={styles.sectionTitle}>Live Map</AppText>
        </View>

        <MapSection
          stops={UPCOMING_STOPS}
          expandable
          style={styles.mapCard}
          initialRegion={INITIAL_REGION}
          fullscreenRegion={FULLSCREEN_REGION}
        />

        <View style={styles.mapHintRow}>
          <TouchableOpacity
            style={[
              styles.currentLoadJobBtn,
              isJobStarted && styles.currentLoadJobBtnStop,
            ]}
            onPress={toggleJobStatus}
            activeOpacity={0.9}>
            <AppText style={styles.currentLoadJobBtnText}>
              {isJobStarted ? 'Stop Job' : 'Start Job'}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* <View style={styles.mapNavigatorRow}>
          <TouchableOpacity
            style={styles.mapNavigatorBtn}
            onPress={openMap}
            activeOpacity={0.9}>
            <AppText style={styles.mapNavigatorBtnText}>Open PTV Navigator Map</AppText>
          </TouchableOpacity>
        </View> */}


        <View style={styles.mapNavigatorRow}>
          <TouchableOpacity
            style={styles.mapNavigatorBtn}
            onPress={openMap_Here}
            activeOpacity={0.9}>
            <AppText style={styles.mapNavigatorBtnText}>Open Here Navigator Map</AppText>
          </TouchableOpacity>
        </View>

        {/* RECEIVER SIGNATURE */}
        <View style={styles.signatureSectionHeader}>
          <AppText style={styles.currentLoadTitle}>Receiver Signature</AppText>
        </View>

        <View style={styles.signatureCard}>
          <View style={styles.signatureInfoRow}>
            <View style={styles.signatureTextWrap}>
              <AppText style={styles.signatureStatusTitle}>
                {receiverSignature ? 'Signature captured' : 'Signature pending'}
              </AppText>
              <AppText style={styles.signatureStatusSubtitle}>
                {receiverSignature
                  ? `${receiverSignature.receiverName} • ${new Date(
                      receiverSignature.capturedAt,
                    ).toLocaleString()}`
                  : "Collect the receiving person's signature before delivery handoff."}
              </AppText>
            </View>
            <TouchableOpacity
              style={styles.signatureActionBtn}
              onPress={openSignatureCapture}>
              <AppText style={styles.signatureActionBtnText}>
                {receiverSignature ? 'Retake' : 'Take Signature'}
              </AppText>
            </TouchableOpacity>
          </View>

          {receiverSignature?.signature ? (
            <Image
              source={{uri: receiverSignature.signature}}
              style={styles.signaturePreview}
              resizeMode="contain"
            />
          ) : null}
        </View>

        {/* CURRENT LOAD */}
        <View style={styles.currentLoadHeaderRow}>
          <AppText style={styles.currentLoadTitle}>Current Load</AppText>
        </View>

        <View style={styles.loadCard}>
          <View style={styles.loadHeader}>
            <View>
              <AppText style={styles.loadId}>Load #SH-245</AppText>
              <AppText style={styles.loadSub}>Electronics • 12,500 lbs</AppText>
            </View>
            <View style={styles.inTransitBadge}>
              <AppText style={styles.badgeText}>In Transit</AppText>
            </View>
          </View>

          <Location color="#22C55E" city="Delhi, IN"   info="Picked up 4 hours ago" />
          <Location color="#EF4444" city="Lucknow, IN" info="ETA: 2 hours" />

          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <AppText style={styles.progressLabel}>Progress</AppText>
              <AppText style={styles.progressPercent}>72%</AppText>
            </View>
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, {width: '72%'}]} />
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, {width: '72%'}]} />
          </View>

          {/* <View style={styles.actionRow}>
            <TouchableOpacity onPress={openMap_navigation} style={styles.primaryBtn}>
              <AppText style={styles.primaryBtnText}>Navigation</AppText>
            </TouchableOpacity>
          </View> */}
        </View>

      </ScrollView>

      {/* SIGNATURE PAD */}
      <ReceiverSignaturePad
        visible={isSignaturePadVisible}
        useModal
        onClose={closeSignatureCapture}
        onSaved={handleSignatureSaved}
        initialValue={receiverSignature}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;


const StatItem = ({title, value, color}) => (
  <View style={styles.statItem}>
    <AppText style={[styles.statValue, {color}]}>{value}</AppText>
    <AppText style={styles.statLabel}>{title}</AppText>
  </View>
);

const Divider = () => <View style={styles.divider} />;

const Location = ({color, city, info}) => (
  <View style={styles.locationRow}>
    <View style={[styles.locationIcon, {backgroundColor: color + '22'}]}>
      <AppText style={{color}}>📍</AppText>
    </View>
    <View>
      <AppText style={styles.city}>{city}</AppText>
      <AppText style={styles.info}>{info}</AppText>
    </View>
  </View>
);
