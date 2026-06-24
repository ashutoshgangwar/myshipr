import React from 'react';
import {View, TextInput, StyleSheet} from 'react-native';
import {moderateScale, verticalScale} from 'react-native-size-matters';

import AppText from '../../../theme/AppText';
import {colors} from '../../../theme/colors';

// Truck parameters captured for the HERE truck routing / toll request. Weight is
// in kilograms and dimensions in centimetres — the units the HERE router
// expects (see hereTruckService.appendTruckVehicleParams).
const FIELDS = [
  {label: 'Current Weight', unit: 'kg', key: 'currentWeight'},
  {label: 'Gross Weight', unit: 'kg', key: 'grossWeight'},
  {label: 'Length', unit: 'cm', key: 'length'},
  {label: 'Height', unit: 'cm', key: 'height'},
  {label: 'Axle Count', unit: '', key: 'axleCount'},
  {label: 'Trailer Count', unit: '', key: 'trailerCount'},
];

// Presentational truck-detail entry. State lives in the parent (RadarSetupScreen)
// so the values can be forwarded to the map screen as navigation params.
export default function TruckParamsForm({truckDetails, setTruckDetails}) {
  return (
    <View style={styles.container}>
      <AppText style={styles.title}>Truck details</AppText>
      <View style={styles.grid}>
        {FIELDS.map(field => (
          <View key={field.key} style={styles.field}>
            <AppText style={styles.label}>{field.label}</AppText>
            <View style={styles.inputRow}>
              <TextInput
                value={truckDetails?.[field.key] || ''}
                keyboardType="numeric"
                placeholder="Enter value"
                placeholderTextColor="#9CA3AF"
                onChangeText={text =>
                  setTruckDetails(prev => ({...prev, [field.key]: text}))
                }
                style={styles.input}
              />
              {!!field.unit && (
                <AppText style={styles.unit}>{field.unit}</AppText>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: moderateScale(12),
    marginTop: verticalScale(10),
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: colors.text_dark,
    marginBottom: verticalScale(8),
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  field: {
    width: '48%',
    marginBottom: verticalScale(10),
  },
  label: {
    fontSize: moderateScale(12),
    color: '#666',
    marginBottom: verticalScale(4),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: moderateScale(8),
    paddingHorizontal: moderateScale(10),
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    fontSize: moderateScale(14),
    color: colors.text_dark,
    paddingVertical: verticalScale(8),
  },
  unit: {
    fontSize: moderateScale(12),
    color: '#999',
    marginLeft: moderateScale(6),
  },
});
