import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  MapView,
  Camera,
  UserLocation,
  setAccessToken,
} from '@maplibre/maplibre-react-native';
import Radar from 'react-native-radar';
import {RADAR_PUBLISHABLE_KEY} from '@env';

import ScreenHeader from '../../component/ScreenHeader/ScreenHeader';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import {moderateScale, verticalScale} from 'react-native-size-matters';

setAccessToken(null);

// console.log('RADAR_PUBLISHABLE_KEY =', RADAR_PUBLISHABLE_KEY);
const KEY_OK =
  typeof RADAR_PUBLISHABLE_KEY === 'string' &&
  RADAR_PUBLISHABLE_KEY.includes('_pk_');
const RADAR_STYLE_URL = `https://api.radar.io/maps/styles/radar-default-v1?publishableKey=${RADAR_PUBLISHABLE_KEY}`;

const DEFAULT_CENTER = [-122.4194, 37.7749]; // [longitude, latitude]

export default function RadarMapScreen({navigation}) {
  const cameraRef = useRef(null);
  const [status, setStatus] = useState('Not started');
  const [coords, setCoords] = useState(null); // {latitude, longitude}
  const [mapStatus, setMapStatus] = useState(
    KEY_OK ? 'Loading map…' : 'Missing/invalid Radar key — reset Metro cache',
  );

  useEffect(() => {
    Radar.initialize(RADAR_PUBLISHABLE_KEY);
    Radar.setUserId('user-123'); // any id for this user
    Radar.setMetadata({plan: 'free'});
    requestAndTrack();
  }, []);

  async function requestAndTrack() {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        setStatus('Location permission denied');
        return;
      }
    } else {
      // iOS: Radar SDK drives the CLLocationManager prompt (foreground/when-in-use).
      const ios = await Radar.requestPermissions(false);
      if (ios !== 'GRANTED_FOREGROUND' && ios !== 'GRANTED_BACKGROUND') {
        setStatus('Location permission denied');
        return;
      }
    }
    setStatus('Locating…');
    try {
      const result = await Radar.trackOnce();
      const {latitude, longitude} = result.location;
      setCoords({latitude, longitude});
      setStatus('Got location');
      cameraRef.current?.setCamera({
        centerCoordinate: [longitude, latitude],
        zoomLevel: 14,
        animationDuration: 800,
      });
    } catch (e) {
      setStatus('Error: ' + String(e));
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader
        title="Radar Demo"
        subtitle="Location SDK"
        onBack={navigation ? () => navigation.goBack() : undefined}
      />

      <View style={styles.map}>
        <MapView
          style={StyleSheet.absoluteFill}
          mapStyle={RADAR_STYLE_URL}
          logoEnabled
          attributionEnabled
          onDidFinishLoadingMap={() => setMapStatus('Map loaded')}
          onDidFailLoadingMap={() =>
            setMapStatus('Map failed to load — check key / network')
          }>
          <Camera
            ref={cameraRef}
            defaultSettings={{centerCoordinate: DEFAULT_CENTER, zoomLevel: 11}}
          />
          <UserLocation visible />
        </MapView>

        <View style={styles.badge}>
          <AppText style={styles.badgeText}>{mapStatus}</AppText>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    flex: 1,
  },
  badge: {
    position: 'absolute',
    top: verticalScale(10),
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(16),
  },
  badgeText: {
    color: '#fff',
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  footer: {
    padding: moderateScale(16),
    gap: verticalScale(8),
  },
  row: {
    fontSize: moderateScale(16),
    color: colors.text_dark,
  },
  button: {
    marginTop: verticalScale(4),
    backgroundColor: colors.button_color,
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(10),
    alignItems: 'center',
  },
  buttonText: {
    color: colors.text_color_button,
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
});
