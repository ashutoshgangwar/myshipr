import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  ImageBackground,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import styles, {ICON_SIZE} from './FavoriteDestination.styles';
import ErrorModal from '../../component/ErrorModal/ErrorModal';
import useErrorModal from '../../hooks/useErrorModal';
import Location_Icon from '../../assets/svg_icon/current_location_icon.svg';
import Manual_icon_Icon from '../../assets/svg_icon/Manual_icon.svg';
import TruckIcon from '../../assets/svg_icon/Frame.svg';
import {colors} from '../../theme/colors';
import AppText from '../../theme/AppText';
import StatusBar from '../../component/StatusBar/StatusBar';
import HereMapPicker from '../../component/HereMapPicker/HereMapPicker';
import Button from '../../component/Button/Button';
import {ms} from '../../theme/scale';
import type {
  HereMapPickerHandle,
  PickedLocation,
} from '../../component/HereMapPicker/HereMapPicker';
import type {FavoriteDestinationHandoff} from '../../types/navigation';
import {submitFavoriteDestination} from './saveDestination';

/** The manual-entry form's fields, derived from EMPTY_FORM. */
type FormField = keyof typeof EMPTY_FORM;

const HERO_IMAGE = require('../../assets/Image/bg_image_login.jpg');

// Muted grey shared by the placeholder text and the un-selected pin icon.
const PLACEHOLDER_COLOR = colors.textMuted;

const EMPTY_FORM = {
  street: '',
  landmark: '',
  city: '',
  state: '',
  zip: '',
};

const FavoriteDestination = () => {
  const navigation = useNavigation();
  // The app's one dialog — see `hooks/useErrorModal`.
  const {modalProps, showError, showWarning} = useErrorModal();

  const pickerRef = useRef<HereMapPickerHandle | null>(null);

  const [mode, setMode] = useState<'map' | 'manual'>('map');
  const [picked, setPicked] = useState<PickedLocation | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<FormField, string>>>({});
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Guards the state updates that follow the save, in case the screen was
  // reset out from under it while the request was still running.
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const setField = (key: FormField, value: string) => {
    setForm(prev => ({...prev, [key]: value}));
    if (errors[key]) setErrors(prev => ({...prev, [key]: undefined}));
  };

  const validateManual = () => {
    const next: Partial<Record<FormField, string>> = {};
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

  // This screen sits between login and the tabs, so confirming resets the
  // stack onto MainApp — Back must not return here or to Login.
  const goToHome = (favoriteDestination: FavoriteDestinationHandoff) => {
    navigation.reset({
      index: 0,
      routes: [{name: 'MainApp', params: {favoriteDestination}}],
    });
  };

  // Saved first, moved on second: the destination is the only reason this
  // screen exists, so a failed save keeps the driver here with their input
  // intact rather than dropping them on Home having silently lost it.
  const handleConfirm = useCallback(async () => {
    if (saving) return;

    let handoff: FavoriteDestinationHandoff;
    if (mode === 'manual') {
      if (!validateManual()) return;
      handoff = {type: 'manual', address: form};
    } else {
      if (!picked) {
        showWarning(
          'Pick a destination',
          'Tap the map to drop a destination pin.',
        );
        return;
      }
      handoff = {type: 'map', coordinate: picked};
    }

    setSaving(true);
    try {
      const result = await submitFavoriteDestination(handoff);
      if (!isMounted.current) return;

      if (!result.ok) {
        showWarning(
          'Address Not Found',
          'We could not place that address on the map. Check the details, or switch to the map tab and drop a pin instead.',
        );
        return;
      }

      goToHome(handoff);
    } catch (e) {
      if (!isMounted.current) return;
      showError(e as Parameters<typeof showError>[0], {
        title: 'Could Not Save Destination',
        confirmText: 'Retry',
        onConfirm: handleConfirm,
      });
    } finally {
      if (isMounted.current) setSaving(false);
    }
    // `validateManual` and `goToHome` are re-made every render and both only
    // read state already listed here, so they are left out on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saving, mode, form, picked, showError, showWarning]);

  // Tapping the row asks the picker for a GPS fix; the map recenters and the
  // resulting pin is emitted back through onPick.
  const handleUseCurrentLocation = async () => {
    if (locating) return;
    setLocating(true);
    try {
      const loc = await pickerRef.current?.recenterToCurrentLocation();
      if (!loc) {
        showWarning(
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
    // 'padding' on both platforms: the view measures its own overlap with the
    // keyboard, so it adds nothing where the window has already resized and
    // lifts the manual-entry fields clear of the keyboard where it has not.
    <KeyboardAvoidingView style={styles.safe} behavior="padding">
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
                color={mode === 'map' ? colors.textStrong : colors.white}
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
                color={mode === 'manual' ? colors.textStrong : colors.white}
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
                  placeholderTextColor={colors.textMuted}
                  value={form.street}
                  onChangeText={t => setField('street', t)}
                />
              </Field>

              <Field label="Landmark (Optional)">
                <TextInput
                  style={styles.input}
                  placeholder="Eg. near ABC"
                  placeholderTextColor={colors.textMuted}
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
                      placeholderTextColor={colors.textMuted}
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
                      placeholderTextColor={colors.textMuted}
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
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  value={form.zip}
                  onChangeText={t => setField('zip', t)}
                />
              </Field>
            </>
          )}

          {/* Confirm */}
          <Button
            title={saving ? 'Saving…' : 'Confirm Destination'}
            onPress={handleConfirm}
            disabled={!canConfirm || saving}
            backgroundColor={canConfirm ? colors.primary : colors.textMuted}
            textColor={colors.white}
            style={styles.confirmBtn}
            textStyle={styles.confirmBtnText}
          />
        </View>
      </ScrollView>

      <ErrorModal {...modalProps} />
    </KeyboardAvoidingView>
  );
};

const Field = ({
  label,
  required,
  error,
  children,
}: {
  label?: string;
  required?: boolean;
  error?: string | null;
  children?: React.ReactNode;
}) => (
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
