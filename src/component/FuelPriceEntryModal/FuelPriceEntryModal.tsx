import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import styles from './FuelPriceEntryModal.styles';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import CrossIcon from '../../assets/svg_icon/Cross_Icon.svg';
import SearchIcon from '../../assets/svg_icon/Search_Icon.svg';
import {ms} from '../../theme/scale';

const CLOSE_ICON = ms(28);
const SEARCH_ICON = ms(20);

const FEET_PER_METRE = 3.28084;
const METRES_PER_MILE = 1609.344;

/** "150 ft away" up close, "0.4 mi away" beyond a tenth of a mile. */
export const formatStationDistance = (metres: number): string => {
  if (metres < METRES_PER_MILE / 10) {
    return `${Math.max(1, Math.round(metres * FEET_PER_METRE))} ft away`;
  }
  return `${(metres / METRES_PER_MILE).toFixed(1)} mi away`;
};

/** Above this a typed price is a slip (a missing decimal point), not a pump. */
const MAX_PRICE = 50;

/**
 * The typed text → a price, or null when it is not one. A comma is taken as
 * the decimal point, since that is what some keyboards put on the pad.
 */
export const parsePricePerGallon = (text: string): number | null => {
  const clean = text.trim().replace(',', '.');
  if (!/^\d*\.?\d{0,3}$/.test(clean) || !/\d/.test(clean)) return null;
  const price = Number(clean);
  return price > 0 && price <= MAX_PRICE ? price : null;
};

// The driver reports the diesel price at the pump they are standing at; the
// caller supplies the location and makes the call.
export interface FuelPriceEntryModalProps {
  visible?: boolean;
  submitting?: boolean;
  /** Shown under the field — the API's refusal, or no location fix. */
  error?: string | null;
  /**
   * The nearest fuel station's name from the HERE SDK. It prefills the Station
   * Name field until the driver types their own; the field is submitted.
   */
  stationName?: string;
  /** How far the driver is from that station, shown under its name. */
  stationDistanceMeters?: number;
  /** What the station sells, e.g. "Gas/Petrol + EV Charging". */
  stationType?: string;
  /** The nearest-station lookup is still running. */
  stationLoading?: boolean;
  /** Why no station was filled in, e.g. none found nearby. */
  stationMessage?: string | null;
  /** Looks the nearest station up again; shown while the field is empty. */
  onSearchStation?: () => void;
  /** Where the price will be filed, e.g. "Rock Springs, WY". */
  locationLabel?: string;
  /** The price, and the Station Name field as it stands ('' when empty). */
  onSubmit?: (pricePerGallon: number, stationName: string) => void;
  onClose?: () => void;
}

const FuelPriceEntryModal = ({
  visible,
  submitting = false,
  error,
  stationName = '',
  stationDistanceMeters,
  stationType,
  stationLoading = false,
  stationMessage,
  onSearchStation,
  locationLabel,
  onSubmit,
  onClose,
}: FuelPriceEntryModalProps) => {
  const [text, setText] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [station, setStation] = useState('');
  const [stationEdited, setStationEdited] = useState(false);

  // Each report starts from empty fields.
  useEffect(() => {
    if (!visible) {
      setText('');
      setInvalid(false);
      setStation('');
      setStationEdited(false);
    }
  }, [visible]);

  // The looked-up name fills the field, but never over what the driver typed.
  useEffect(() => {
    if (visible && !stationEdited) setStation(stationName);
  }, [visible, stationName, stationEdited]);

  const submit = () => {
    if (submitting) return;
    const price = parsePricePerGallon(text);
    if (price === null) {
      setInvalid(true);
      return;
    }
    onSubmit?.(price, station.trim());
  };

  const shownError = invalid
    ? `Enter a price per gallon between $0.01 and $${MAX_PRICE}.`
    : error;
  const disabled = submitting || !text.trim();
  const canSearchStation =
    Boolean(onSearchStation) && !stationLoading && !station.trim();

  const searchStation = () => {
    // A found name should fill the field again, even after the driver cleared it.
    setStationEdited(false);
    onSearchStation?.();
  };

  return (
    <Modal
      visible={Boolean(visible)}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.titleBlock}>
              <AppText style={styles.title} numberOfLines={1}>
                Enter Fuel Pricing To Earn Points
              </AppText>
              <AppText style={styles.subtitle} numberOfLines={1}>
             {shownError ? (
              <AppText style={styles.error}>{shownError}</AppText>
            ) : locationLabel ? (
              <AppText style={styles.hint} numberOfLines={1}>
              Current location · {locationLabel}
              </AppText>
            ) : null}
              </AppText>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              activeOpacity={0.8}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              onPress={onClose}>
              <CrossIcon width={CLOSE_ICON} height={CLOSE_ICON} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <AppText style={styles.label}>Station Name</AppText>
            <View style={[styles.field, styles.stationField]}>
              <TextInput
                style={styles.input}
                value={station}
                onChangeText={value => {
                  setStation(value);
                  setStationEdited(true);
                }}
                placeholder={
                  stationLoading ? 'Finding nearest station…' : 'Station Name'
                }
                placeholderTextColor={colors.textMuted}
                autoCapitalize="words"
                returnKeyType="next"
                maxLength={80}
              />
              {stationLoading && !stationEdited ? (
                <ActivityIndicator size="small" color={colors.textMuted} />
              ) : canSearchStation ? (
                <TouchableOpacity
                  style={styles.searchBtn}
                  activeOpacity={0.8}
                  hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
                  disabled={submitting}
                  onPress={searchStation}>
                  <SearchIcon width={SEARCH_ICON} height={SEARCH_ICON} />
                </TouchableOpacity>
              ) : null}
            </View>
            {canSearchStation && stationMessage ? (
              <AppText style={styles.stationDistance} numberOfLines={1}>
                {stationMessage}
              </AppText>
            ) : null}
            {!stationEdited &&
            station &&
            typeof stationDistanceMeters === 'number' &&
            Number.isFinite(stationDistanceMeters) ? (
              <AppText style={styles.stationDistance} numberOfLines={1}>
                {stationType || 'Nearest station'} ·{' '}
                {formatStationDistance(stationDistanceMeters)}
              </AppText>
            ) : null}

            <AppText style={styles.label}>Price</AppText>
            <View style={[styles.field, Boolean(shownError) && styles.fieldError]}>
              <AppText style={styles.affix}>$</AppText>
              <TextInput
                style={styles.input}
                value={text}
                onChangeText={value => {
                  setText(value);
                  setInvalid(false);
                }}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                returnKeyType="done"
                maxLength={6}
                autoFocus
                onSubmitEditing={submit}
              />
              <AppText style={styles.affix}>/gal</AppText>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, disabled && styles.submitBtnDisabled]}
              activeOpacity={0.85}
              disabled={disabled}
              onPress={submit}>
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <AppText style={styles.submitText}>Submit</AppText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default FuelPriceEntryModal;
