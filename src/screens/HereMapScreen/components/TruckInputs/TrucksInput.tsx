import React from 'react';
import {
  View,
  TextInput,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Text,
} from 'react-native';
import styles from './TruckInputs.styles';

const TruckInputFields = [
  {label: 'Current Weight', unit: 'kg', key: 'currentWeight'},
  {label: 'Gross Weight', unit: 'kg', key: 'grossWeight'},
  {label: 'Length', unit: 'cm', key: 'length'},
  {label: 'Height', unit: 'cm', key: 'height'},
  {label: 'Axle Count', unit: '', key: 'axleCount'},
  {label: 'Trailer Count', unit: '', key: 'trailerCount'},
];

export interface TrucksInputProps {
  truckDetails?: Record<string, string> | null;
  setTruckDetails: React.Dispatch<
    React.SetStateAction<Record<string, string> | null>
  >;
  isLoading?: boolean;
  submitButtonText?: string;
  onSubmit?: () => void;
  onCancel?: () => void;
}

const TrucksInput = ({
  truckDetails,
  setTruckDetails,
  isLoading = false,
  submitButtonText = 'Apply',
  onSubmit,
  onCancel,
}: TrucksInputProps) => {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {TruckInputFields.map(field => (
          <View key={field.key} style={styles.field}>
            <Text style={styles.label}>{field.label}</Text>

            <View style={styles.inputContainer}>
              <TextInput
                value={truckDetails?.[field.key] || ''}
                keyboardType="numeric"
                placeholder="Enter value"
                placeholderTextColor="#9CA3AF"
                onChangeText={text =>
                  setTruckDetails((prev: Record<string, string> | null) => ({
                    ...prev,
                    [field.key]: text,
                  }))
                }
                style={styles.input}
              />

              {!!field.unit && (
                <Text style={styles.unitText}>{field.unit}</Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={isLoading}
          onPress={onSubmit}
          style={[styles.applyButton, isLoading && styles.applyButtonDisabled]}>
          {isLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.applyButtonText}>{submitButtonText}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TrucksInput;
