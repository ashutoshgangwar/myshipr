import React, {useState} from 'react';
import {View, TextInput, TouchableOpacity} from 'react-native';
import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';
import {colors} from '../../../theme/colors';
import PanelShell from './PanelShell';
import useKeyboardShift from '../hooks/useKeyboardShift';

const FUEL_TYPES = ['Diesel', 'Regular', 'Premium'];

/**
 * "Enter fuel price" card opened from the fuel (dock) toolbar button. Lets the
 * driver report the current price of a fuel type at a nearby station.
 */
export default function FuelPricePanel({onClose, onSubmit}) {
  const [station, setStation] = useState('');
  const [price, setPrice] = useState('');
  const [fuelType, setFuelType] = useState('Diesel');

  const {keyboardShift, onPanelLayout} = useKeyboardShift();

  const canSubmit = price.trim().length > 0 && Number(price) > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit?.({
      station: station.trim(),
      price: Number(price),
      fuelType,
    });
    onClose?.();
  };

  return (
    <PanelShell
      title="Enter fuel price"
      subtitle="Enter the fuel price near you"
      onClose={onClose}
      onLayout={onPanelLayout}
      wrapStyle={[
        styles.fuelPanelWrap,
        {transform: [{translateY: -keyboardShift}]},
      ]}>
      <View style={styles.fuelBody}>
        <AppText style={styles.fuelSectionTitle}>
          Current {fuelType.toLowerCase()} price near you
        </AppText>

        <TextInput
          style={styles.fuelInput}
          placeholder="Station Name"
          placeholderTextColor={colors.textMuted}
          value={station}
          onChangeText={setStation}
        />

        <View style={styles.fuelPriceRow}>
          <AppText style={styles.fuelPriceCurrency}>$</AppText>
          <TextInput
            style={styles.fuelPriceInput}
            placeholder="0.00"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            value={price}
            onChangeText={setPrice}
          />
          <AppText style={styles.fuelPriceUnit}>/per gallon</AppText>
        </View>

        <View style={styles.fuelChipsRow}>
          {FUEL_TYPES.map(type => {
            const active = fuelType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.fuelChip, active && styles.fuelChipActive]}
                onPress={() => setFuelType(type)}
                activeOpacity={0.8}>
                <AppText
                  style={[
                    styles.fuelChipText,
                    active && styles.fuelChipTextActive,
                  ]}>
                  {type}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.fuelSubmitBtn, !canSubmit && styles.fuelSubmitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.85}>
          <AppText style={styles.fuelSubmitText}>Submit</AppText>
        </TouchableOpacity>
      </View>
    </PanelShell>
  );
}
