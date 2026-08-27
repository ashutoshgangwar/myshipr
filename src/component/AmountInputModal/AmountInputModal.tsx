import React, { useState } from 'react';
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { colors } from '../../theme/colors';
import AppText from '../../theme/AppText';

export interface AmountInputModalProps {
  visible?: boolean;
  onClose: () => void;
  /** Receives the raw text the driver typed, not a parsed number. */
  onSubmit: (amount: string) => void;
}

const AmountInputModal = ({
  visible,
  onClose,
  onSubmit,
}: AmountInputModalProps) => {
  const [amount, setAmount] = useState('');

  const handleSubmit = () => {
    if (!amount) return;
    onSubmit(amount);
    setAmount('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose} />

      <View style={styles.modalContainer}>
        <AppText style={styles.title}>Enter Approximate Amount</AppText>

        <TextInput
          placeholder="₹ Enter amount"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          style={styles.input}
        />

        <AppText style={styles.note}>
          ⚠ This is an approximate amount.  
          Final amount may change after delivery.
        </AppText>

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <AppText style={styles.cancelText}>Cancel</AppText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <AppText style={styles.submitText}>Submit</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AmountInputModal;

/* ================= STYLES ================= */

const styles = {
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  modalContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    padding: moderateScale(20),
  },

  title: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    marginBottom: verticalScale(12),
    color: '#111827',
  },

  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    fontSize: moderateScale(16),
    marginBottom: verticalScale(10),
  },

  note: {
    fontSize: moderateScale(12),
    color: '#6B7280',
    marginBottom: verticalScale(16),
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  cancelBtn: {
    flex: 1,
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(10),
    backgroundColor: '#E5E7EB',
    marginRight: moderateScale(8),
    alignItems: 'center',
  },

  cancelText: {
    fontWeight: '600',
    color: '#111827',
  },

  submitBtn: {
    flex: 1,
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(10),
    backgroundColor: colors.button_color,
    marginLeft: moderateScale(8),
    alignItems: 'center',
  },

  submitText: {
    fontWeight: '700',
    color: '#fff',
  },
} as const;
