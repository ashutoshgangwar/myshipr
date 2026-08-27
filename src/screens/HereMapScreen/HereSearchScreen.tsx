import React, {useRef, useState} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';
import HereSearchCard from './hereSearchCard';
import {calculateRouteTolls} from './services/hereTruckService';
import { colors } from '../../theme/colors';
import type {ErrorLike, MapLocation} from '../../types/common';
import type {TruckDetails} from '../../types/navigation';
import type {AddressInputHandle, HereSearchCardProps} from './hereSearchCard';
import type {RootStackScreenProps} from '../../types/navigation';

export default function HereSearchScreen() {
  const navigation = useNavigation();
  const route = useRoute<RootStackScreenProps<'HereSearchScreen'>['route']>();

  const sourceRef = useRef<AddressInputHandle | null>(null);
  const destinationRef = useRef<AddressInputHandle | null>(null);

  const normalizeLocation = (
    loc: {latitude?: unknown; longitude?: unknown; description?: string} | null | undefined,
  ): MapLocation | null => {
    if (!loc) return null;
    const lat = Number(loc.latitude);
    const lng = Number(loc.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }
    return {
      latitude: lat,
      longitude: lng,
      description: loc.description || '',
    };
  };

  const [activeInput, setActiveInput] =
    useState<NonNullable<HereSearchCardProps['activeInput']>>('destination');
  const [sourceLocation, setSourceLocation] = useState(
    normalizeLocation(route.params?.sourceLocation),
  );
  const [destinationLocation, setDestinationLocation] = useState(
    normalizeLocation(route.params?.destinationLocation),
  );
  const [sourceText, setSourceText] = useState(route.params?.sourceText || '');
  const [destinationText, setDestinationText] = useState(
    route.params?.destinationText || '',
  );

  const handleDestinationSelected = async (
    location: MapLocation,
    truckDetails?: TruckDetails | null,
  ) => {
    if (
      !location ||
      !Number.isFinite(location.latitude) ||
      !Number.isFinite(location.longitude)
    ) {
      Alert.alert(
        'Invalid destination',
        'Selected destination does not contain valid coordinates. Please try again.',
      );
      return;
    }

    const safeDestination = {
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      description: location.description || '',
    };

    setDestinationLocation(safeDestination);
    setDestinationText(safeDestination.description);

    let tollsData = null;
    try {
      if (sourceLocation) {
        const resp = await calculateRouteTolls(
          sourceLocation,
          safeDestination,
          'USD',
          truckDetails || {},
        );
        tollsData = resp || null;
      }
    } catch (e) {
      console.warn('Toll calculation failed', (e as ErrorLike)?.message || e);
    }

    navigation.navigate('HereMapScreen', {
      sourceLocation,
      sourceText,
      destinationLocation: safeDestination,
      destinationText: safeDestination.description,
      truckDetails: truckDetails || null,
      tollsData,
    });
  };

  const handleSourceSelected = (location: MapLocation) => {
    if (
      !location ||
      !Number.isFinite(location.latitude) ||
      !Number.isFinite(location.longitude)
    ) {
      Alert.alert(
        'Invalid source',
        'Selected source location does not contain valid coordinates. Please try again.',
      );
      return;
    }

    setSourceLocation({
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      description: location.description || '',
    });
    setSourceText(location.description || '');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Search location</Text>
      </View>
      <View style={{flex: 1}}>
        <HereSearchCard
          sourceRef={sourceRef}
          destinationRef={destinationRef}
          activeInput={activeInput}
          // The card can clear the active field; this screen always keeps one
          // selected, so a null is ignored rather than stored.
          onActiveInputChange={field => field && setActiveInput(field)}
          sourceLocation={sourceLocation}
          destinationLocation={destinationLocation}
          sourceText={sourceText}
          destinationText={destinationText}
          setSourceLocation={setSourceLocation}
          setDestinationLocation={setDestinationLocation}
          setSourceText={setSourceText}
          setDestinationText={setDestinationText}
          onCoordinateSelect={() => {}}
          onSourceSelected={handleSourceSelected}
          onDestinationSelected={handleDestinationSelected}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: scale(14),
    paddingTop: verticalScale(14),
    paddingBottom: verticalScale(10),
    borderBottomWidth: 1,
    backgroundColor: '#ffffff',
  },
  backButton: {
    width: scale(38),
    height: scale(38),
    borderRadius: moderateScale(12),
    backgroundColor: colors.nearBlack,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(14),
  },
  backButtonText: {
    color: colors.white,
    fontSize: moderateScale(18),
    fontWeight: '800',
    marginBottom: verticalScale(8),
  },
  title: {
    color: colors.nearBlack,
    fontSize: moderateScale(18),
    fontWeight: '800',
  },
});
