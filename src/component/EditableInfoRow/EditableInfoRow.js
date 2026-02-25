import React from 'react';
import { View, Text, TextInput } from 'react-native';
import styles from './EditableInfoRow.styles';
import AppText from '../../theme/AppText';

const EditableInfoRow = ({
  label,
  value,
  onChangeText,
  placeholder,
}) => {
  return (
    <View style={styles.wrapper}>
      <AppText style={styles.label}>{label}</AppText>

      <View style={styles.inputBox}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#ADB5BD"
          style={styles.input}
        />
      </View>
    </View>
  );
};

export default EditableInfoRow;
