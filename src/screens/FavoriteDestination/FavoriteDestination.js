import React, {useRef, useState} from 'react';
import {
  View,
  ImageBackground,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import styles, {ICON_SIZE} from './FavoriteDestination.styles';
import Location_Icon from '../../assets/svg_icon/current_location_icon.svg';
import Manual_icon_Icon from '../../assets/svg_icon/Manual_icon.svg';
import TruckIcon from '../../assets/svg_icon/Frame.svg';
import {colors} from '../../theme/colors';
import AppText from '../../theme/AppText';
import StatusBar from '../../component/StatusBar/StatusBar';
import HereMapPicker from '../../component/HereMapPicker/HereMapPicker';
import Button from '../../component/Button/Button';
import {ms, vs} from '../../theme/scale';

const HERO_IMAGE = require('../../assets/Image/bg_image_login.jpg');

// Muted grey shared by the placeholder text and the un-selected pin icon.
const PLACEHOLDER_COLOR = '#9CA3AF';

const EMPTY_FORM = {
  street: '',
  landmark: '',
  city: '',
  state: '',
  zip: '',
};

const FavoriteDestination = () => {
  const navigation = useNavigation();

  const pickerRef = useRef(null);

  const [mode, setMode] = useState('map'); // 'map' | 'manual'
  const [picked, setPicked] = useState(null); // {latitude, longitude, description}
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [locating, setLocating] = useState(false);

  const setField = (key, value) => {
    setForm(prev => ({...prev, [key]: value}));
    if (errors[key]) setErrors(prev => ({...prev, [key]: undefined}));
  };

  const validateManual = () => {
    const next = {};
    if (!form.street.trim()) next.street = 'Street address is required';
    if (!form.city.trim()) next.city = 'City is required';
    if (!form.state.trim()) next.state = 'State is required';
    if (!form.zip.trim()) next.zip = 'ZIP code is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const mapReady = mode === 'map' && !!picked;
  const manualReady =
    mode === 'manual' &&
    form.street.trim() &&
    form.city.trim() &&
    form.state.trim() &&
    form.zip.trim();
  const canConfirm = mapReady || manualReady;

  const handleConfirm = () => {
    if (mode === 'manual') {
      if (!validateManual()) return;
      navigation.navigate('MainApp', {
        favoriteDestination: {type: 'manual', address: form},
      });
      return;
    }

    if (!picked) {
      Alert.alert(
        'Pick a destination',
        'Tap the map to drop a destination pin.',
      );
      return;
    }
    navigation.navigate('MainApp', {
      favoriteDestination: {type: 'map', coordinate: picked},
    });
  };

  // Tapping the row asks the picker for a GPS fix; the map recenters and the
  // resulting pin is emitted back through onPick.
  const handleUseCurrentLocation = async () => {
    if (locating) return;
    setLocating(true);
    try {
      const loc = await pickerRef.current?.recenterToCurrentLocation();
      if (!loc) {
        Alert.alert(
          'Location unavailable',
          'We could not get your current location. Check that location access is on, or move the map to set your destination.',
        );
      }
    } finally {
      setLocating(false);
    }
  };

  // Only ever show a real address — never raw coordinates.
  const pickedAddress = picked?.description?.trim();
  const selectedLabel = locating
    ? 'Fetching current location…'
    : pickedAddress || (picked ? 'Fetching address…' : 'Select Current Location');

  return (
    <View style={styles.safe}>
      <StatusBar
          backgroundColor="transparent"
          barStyle="light-content"
          translucent={true}
        />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}>
        {/* HERO */}
        <ImageBackground
          source={HERO_IMAGE}
          style={styles.hero}
          imageStyle={styles.heroImage}>
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <AppText
              style={styles.heroTitle}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}>
              Pick Your Favourite Destination
            </AppText>
            <AppText
              style={styles.heroSubtitle}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}>
              Pick your destination on the map or enter the address manually.
            </AppText>
            <View style={styles.roleBadge}>
              <AppText style={styles.roleBadgeText}>CARRIER</AppText>
               <TruckIcon width={ms(20)} height={ms(20)} />
            </View>
          </View>
        </ImageBackground>

        {/* BODY CARD */}
        <View style={styles.card}>
          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, mode === 'map' && styles.tabActive]}
              onPress={() => setMode('map')}
              activeOpacity={0.9}>
              <Location_Icon
                width={ICON_SIZE.tab}
                height={ICON_SIZE.tab}
                color={mode === 'map' ? colors.textOnLightStrong : colors.splashText}
              />
              <AppText
                style={[
                  styles.tabText,
                  mode === 'map' && styles.tabTextActive,
                ]}>
                Select Current Location
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, mode === 'manual' && styles.tabActive]}
              onPress={() => setMode('manual')}
              activeOpacity={0.9}>
              <Manual_icon_Icon
                width={ICON_SIZE.tab}
                height={ICON_SIZE.tab}
                color={mode === 'manual' ? colors.textOnLightStrong : colors.splashText}
              />
              <AppText
                style={[
                  styles.tabText,
                  mode === 'manual' && styles.tabTextActive,
                ]}>
                Enter Manually
              </AppText>
            </TouchableOpacity>
          </View>

          {mode === 'map' ? (
            <>
              {/* Selected location — sits where the search bar used to be.
                  Tap it to drop onto the device's current location. */}
              <TouchableOpacity
                style={styles.selectedRow}
                onPress={handleUseCurrentLocation}
                disabled={locating}
                activeOpacity={0.8}>
                <Location_Icon
                  width={ICON_SIZE.tab}
                  height={ICON_SIZE.tab}
                  color={pickedAddress ? colors.primary : PLACEHOLDER_COLOR}
                />
                <AppText
                  style={[
                    styles.selectedText,
                    !pickedAddress && styles.selectedPlaceholder,
                  ]}
                  numberOfLines={1}>
                  {selectedLabel}
                </AppText>
                {locating && (
                  <ActivityIndicator size="small" color={colors.primary} />
                )}
              </TouchableOpacity>

              {/* HERE SDK map picker — no search, pin drives the selection */}
              <HereMapPicker
                ref={pickerRef}
                mapStyle={styles.mapCard}
                pickedLocation={picked}
                onPick={setPicked}
                showSearch={false}
              />
            </>
          ) : (
            <>
              {/* Manual form */}
              <Field label="Street Address" required error={errors.street}>
                <TextInput
                  style={[styles.input, errors.street && styles.inputError]}
                  placeholder="Eg. XYZ"
                  placeholderTextColor="#9CA3AF"
                  value={form.street}
                  onChangeText={t => setField('street', t)}
                />
              </Field>

              <Field label="Landmark (Optional)">
                <TextInput
                  style={styles.input}
                  placeholder="Eg. near ABC"
                  placeholderTextColor="#9CA3AF"
                  value={form.landmark}
                  onChangeText={t => setField('landmark', t)}
                />
              </Field>

              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <Field label="City" required error={errors.city}>
                    <TextInput
                      style={[styles.input, errors.city && styles.inputError]}
                      placeholder="Eg. ABC"
                      placeholderTextColor="#9CA3AF"
                      value={form.city}
                      onChangeText={t => setField('city', t)}
                    />
                  </Field>
                </View>
                <View style={styles.fieldHalf}>
                  <Field label="State" required error={errors.state}>
                    <TextInput
                      style={[styles.input, errors.state && styles.inputError]}
                      placeholder="Eg. Exyz"
                      placeholderTextColor="#9CA3AF"
                      value={form.state}
                      onChangeText={t => setField('state', t)}
                    />
                  </Field>
                </View>
              </View>

              <Field label="ZIP Code" required error={errors.zip}>
                <TextInput
                  style={[styles.input, errors.zip && styles.inputError]}
                  placeholder="299834"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="number-pad"
                  value={form.zip}
                  onChangeText={t => setField('zip', t)}
                />
              </Field>
            </>
          )}

          {/* Confirm */}
          <Button
            title="Confirm Destination"
            onPress={handleConfirm}
            disabled={!canConfirm}
            backgroundColor={canConfirm ? colors.primary : colors.primaryLight}
            textColor={colors.white}
            style={styles.confirmBtn}
            textStyle={styles.confirmBtnText}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const Field = ({label, required, error, children}) => (
  <View>
    <AppText style={styles.label}>
      {label}
      {required ? <AppText style={styles.required}> *</AppText> : null}
    </AppText>
    {children}
    {error ? <AppText style={styles.errorText}>{error}</AppText> : null}
  </View>
);

export default FavoriteDestination;
