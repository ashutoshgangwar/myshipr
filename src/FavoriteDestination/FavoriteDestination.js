import React, {useState} from 'react';
import {
  View,
  ImageBackground,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import styles from './FavoriteDestination.styles';
import {colors} from '../theme/colors';
import AppText from '../theme/AppText';
import StatusBar from '../component/StatusBar/StatusBar';
import MapSection from '../component/MapSection/MapSection';
import Location_Icon from '../assets/svg_icon/location.svg';
import Truck_Icon from '../assets/svg_icon/truck-icon.svg';

const HERO_IMAGE = require('../assets/Image/truck_image.jpg');

const EMPTY_FORM = {
  street: '',
  landmark: '',
  city: '',
  state: '',
  zip: '',
};

const FavoriteDestination = () => {
  const navigation = useNavigation();

  const [mode, setMode] = useState('map'); // 'map' | 'manual'
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState(null); // {latitude, longitude}
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

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
      Alert.alert('Pick a destination', 'Tap the map to drop a destination pin.');
      return;
    }
    navigation.navigate('MainApp', {
      favoriteDestination: {type: 'map', coordinate: picked},
    });
  };

  const selectedLabel = picked
    ? `Selected: ${picked.latitude.toFixed(5)}, ${picked.longitude.toFixed(5)}`
    : search.trim() || 'Tap on the map to select a location';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        backgroundColor={colors.primary}
        barStyle="light-content"
        translucent={false}
      />

      <ScrollView
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
            <AppText style={styles.heroTitle}>Pick Your Favourite Destination</AppText>
            <AppText style={styles.heroSubtitle}>
              Pick your destination on the map or enter the address manually.
            </AppText>
            <View style={styles.roleBadge}>
              <AppText style={styles.roleBadgeText}>CARRIER</AppText>
              <Truck_Icon width={14} height={14} />
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
                width={14}
                height={14}
                color={mode === 'map' ? colors.primary : '#6B7280'}
              />
              <AppText
                style={[styles.tabText, mode === 'map' && styles.tabTextActive]}>
                Pick on Map
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, mode === 'manual' && styles.tabActive]}
              onPress={() => setMode('manual')}
              activeOpacity={0.9}>
              <AppText
                style={[styles.tabText, mode === 'manual' && styles.tabTextActive]}>
                ✎ Enter Manually
              </AppText>
            </TouchableOpacity>
          </View>

          {mode === 'map' ? (
            <>
              {/* Search */}
              <View style={styles.searchBox}>
                <AppText style={{color: '#9CA3AF'}}>🔍</AppText>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search a location"
                  placeholderTextColor="#9CA3AF"
                  value={search}
                  onChangeText={setSearch}
                  returnKeyType="search"
                />
              </View>

              {/* Map */}
              <MapSection
                style={styles.mapCard}
                pickedLocation={picked}
                pickedLabel="Destination"
                onMapPress={setPicked}
              />

              {/* Selected location */}
              <View style={styles.selectedRow}>
                <Location_Icon width={16} height={16} color={colors.primary} />
                <AppText
                  style={[
                    styles.selectedText,
                    !picked && styles.selectedPlaceholder,
                  ]}
                  numberOfLines={1}>
                  {selectedLabel}
                </AppText>
              </View>
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
          <TouchableOpacity
            style={[styles.confirmBtn, !canConfirm && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            activeOpacity={0.9}>
            <AppText style={styles.confirmBtnText}>Confirm Destination</AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
