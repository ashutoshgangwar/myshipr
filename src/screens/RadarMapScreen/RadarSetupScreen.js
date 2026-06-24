import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {moderateScale, verticalScale} from 'react-native-size-matters';

import ScreenHeader from '../../component/ScreenHeader/ScreenHeader';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import {
  getCurrentLocation,
} from '../../services/LocationService';

import SearchPanel from './components/SearchPanel';
import TruckParamsForm from './components/TruckParamsForm';
import {
  fetchAutocomplete,
  reverseGeocode,
  placeToCoord,
} from './helpers/radarPlaces';

// Setup screen for the Radar truck flow: capture the truck parameters and the
// source / destination, then hand everything to RadarMapScreen which runs the
// HERE truck route + live navigation.
export default function RadarSetupScreen({navigation}) {
  const [truckDetails, setTruckDetails] = useState({});

  // Source + destination autocomplete state (mirrors RadarMapScreen).
  const [srcQuery, setSrcQuery] = useState('');
  const [dstQuery, setDstQuery] = useState('');
  const [srcResults, setSrcResults] = useState([]);
  const [dstResults, setDstResults] = useState([]);
  const [srcCoord, setSrcCoord] = useState(null);
  const [dstCoord, setDstCoord] = useState(null);
  const [activeField, setActiveField] = useState(null);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  const nearRef = useRef(null); // current location, biases autocomplete
  const searchTimer = useRef(null);

  // Prefill the source with the current location on mount.
  useEffect(() => {
    locateMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function locateMe() {
    setLocating(true);
    try {
      const {latitude, longitude} = await getCurrentLocation();
      nearRef.current = {latitude, longitude};
      const label = (await reverseGeocode(latitude, longitude)) || 'Current location';
      setSrcCoord({latitude, longitude, label});
      setSrcQuery(label);
      setSrcResults([]);
    } catch (e) {
      // best effort — the user can still type a source manually
    } finally {
      setLocating(false);
    }
  }

  function onChangeQuery(field, text) {
    if (field === 'src') {
      setSrcQuery(text);
      setSrcCoord(null);
    } else {
      setDstQuery(text);
      setDstCoord(null);
    }
    setActiveField(field);

    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }
    const q = text.trim();
    if (q.length < 3) {
      field === 'src' ? setSrcResults([]) : setDstResults([]);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const addresses = await fetchAutocomplete(q, nearRef.current);
        field === 'src' ? setSrcResults(addresses) : setDstResults(addresses);
      } catch (e) {
        field === 'src' ? setSrcResults([]) : setDstResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  }

  function selectPlace(field, item) {
    const coord = placeToCoord(item);
    if (field === 'src') {
      setSrcCoord(coord);
      setSrcQuery(coord.label);
      setSrcResults([]);
    } else {
      setDstCoord(coord);
      setDstQuery(coord.label);
      setDstResults([]);
    }
    setActiveField(null);
  }

  const canContinue = !!srcCoord && !!dstCoord;

  function onContinue() {
    if (!canContinue) return;
    navigation.navigate('RadarMapScreen', {
      srcCoord,
      dstCoord,
      truckDetails,
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader
        title="Plan Truck Route"
        subtitle="Enter details & route"
        onBack={navigation ? () => navigation.goBack() : undefined}
      />

      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>
          <SearchPanel
            srcQuery={srcQuery}
            dstQuery={dstQuery}
            srcCoord={srcCoord}
            dstCoord={dstCoord}
            srcResults={srcResults}
            dstResults={dstResults}
            activeField={activeField}
            searching={searching}
            locating={locating}
            onChangeQuery={onChangeQuery}
            onFocusField={setActiveField}
            onSelectPlace={selectPlace}
            onLocate={locateMe}
          />

          <TruckParamsForm
            truckDetails={truckDetails}
            setTruckDetails={setTruckDetails}
          />
        </ScrollView>

        <TouchableOpacity
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
          onPress={onContinue}
          disabled={!canContinue}
          activeOpacity={0.85}>
          {locating ? (
            <ActivityIndicator color={colors.text_color_button} />
          ) : (
            <AppText style={styles.continueText}>Continue to Navigation</AppText>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    paddingBottom: verticalScale(90),
  },
  continueBtn: {
    position: 'absolute',
    bottom: verticalScale(16),
    left: moderateScale(16),
    right: moderateScale(16),
    backgroundColor: colors.button_color,
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(26),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  continueBtnDisabled: {
    opacity: 0.5,
  },
  continueText: {
    color: colors.text_color_button,
    fontSize: moderateScale(15),
    fontWeight: '700',
  },
});
