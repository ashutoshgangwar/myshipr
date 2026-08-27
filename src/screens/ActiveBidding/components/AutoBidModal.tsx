import React, {useState} from 'react';
import {
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import AppText from '../../../theme/AppText';
import {colors} from '../../../theme/colors';
import styles from '../ActiveBidding.styles';

/**
 * "Set Up Auto Bid" pop-up. Collects a Stop Loss — the floor the auto-bidder is
 * never allowed to bid below.
 *
 * Props:
 *  - visible:  boolean
 *  - min:      minimum allowed stop-loss (number) shown in the hint
 *  - onClose:  called when the sheet is dismissed
 *  - onSave:   called with the entered stop-loss value (number|null)
 */
export interface AutoBidModalProps {
  visible?: boolean;
  /** The lowest bid currently standing, shown as guidance. */
  min?: number;
  onClose?: () => void;
  /** Receives the parsed stop-loss, or null when the field was unusable. */
  onSave?: (stopLoss: number | null) => void;
}

export default function AutoBidModal({
  visible,
  min,
  onClose,
  onSave,
}: AutoBidModalProps) {
  const [stopLoss, setStopLoss] = useState('');

  const handleSave = () => {
    const parsed = parseFloat(stopLoss.replace(/[^0-9.]/g, ''));
    onSave && onSave(Number.isNaN(parsed) ? null : parsed);
    onClose && onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              style={styles.modalKav}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={styles.modalCard}>
                <View style={styles.modalHeader}>
                  <AppText style={styles.modalTitle}>Set Up Auto Bid</AppText>
                  <TouchableOpacity
                    onPress={onClose}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                    <AppText style={styles.modalClose}>×</AppText>
                  </TouchableOpacity>
                </View>

                <AppText style={styles.modalLabel}>Stop Loss</AppText>
                <View style={styles.inputRow}>
                  <AppText style={styles.inputPrefix}>$</AppText>
                  <TextInput
                    style={styles.input}
                    value={stopLoss}
                    onChangeText={setStopLoss}
                    keyboardType="numeric"
                    placeholder=""
                    placeholderTextColor={colors.placeholder}
                  />
                </View>

                <AppText style={styles.modalHint}>
                  *min ${min?.toLocaleString()} — auto-bid never goes below this
                </AppText>

                <TouchableOpacity
                  style={styles.saveBtn}
                  activeOpacity={0.85}
                  onPress={handleSave}>
                  <AppText style={styles.saveBtnText}>Save</AppText>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
