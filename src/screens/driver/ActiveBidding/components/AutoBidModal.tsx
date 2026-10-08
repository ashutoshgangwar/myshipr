import React, {useEffect, useState} from 'react';
import {
  View,
  Modal,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';

import AppText from '../../../../theme/AppText';
import {colors} from '../../../../theme/colors';
import styles from '../ActiveBidding.styles';
import type {AutoBidMode} from '../../../../types/bidding';

/** The two auto-bid strategies, with the label each reads as. */
const MODES: {value: AutoBidMode; label: string}[] = [
  {value: 'GRADIENT', label: 'Gradient'},
  {value: 'NO_GRADIENT', label: 'No Gradient'},
];

/**
 * "Set Up Auto Bid" pop-up. Collects the strategy (Gradient / No Gradient) and
 * a Stop Loss — the floor the auto-bidder is never allowed to bid below.
 *
 * Props:
 *  - visible:  boolean
 *  - onClose:  called when the sheet is dismissed
 *  - onSave:   called with the chosen mode and the entered stop-loss value
 */
export interface AutoBidModalProps {
  visible?: boolean;
  onClose?: () => void;
  /** Receives the chosen mode and the parsed stop-loss (null when unusable). */
  onSave?: (payload: {mode: AutoBidMode; stopLoss: number | null}) => void;
  /** Pre-fills the sheet when editing an auto bid that is already on. */
  initialMode?: AutoBidMode;
  initialStopLoss?: number | null;
  title?: string;
}

export default function AutoBidModal({
  visible,
  onClose,
  onSave,
  initialMode = 'GRADIENT',
  initialStopLoss = null,
  title = 'Set Up Auto Bid',
}: AutoBidModalProps) {
  const [stopLoss, setStopLoss] = useState('');
  const [mode, setMode] = useState<AutoBidMode>(initialMode);

  // Each time the sheet opens it starts from the auto bid's current values.
  useEffect(() => {
    if (!visible) return;
    setMode(initialMode);
    setStopLoss(initialStopLoss != null ? String(initialStopLoss) : '');
  }, [visible, initialMode, initialStopLoss]);

  const handleSave = () => {
    const parsed = parseFloat(stopLoss.replace(/[^0-9.]/g, ''));
    onSave && onSave({mode, stopLoss: Number.isNaN(parsed) ? null : parsed});
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
                  <AppText style={styles.modalTitle}>{title}</AppText>
                  <TouchableOpacity
                    onPress={onClose}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                    <AppText style={styles.modalClose}>×</AppText>
                  </TouchableOpacity>
                </View>

                <AppText style={styles.modalLabel}>Mode</AppText>
                <View style={modeStyles.row}>
                  {MODES.map(m => {
                    const active = m.value === mode;
                    return (
                      <TouchableOpacity
                        key={m.value}
                        activeOpacity={0.85}
                        onPress={() => setMode(m.value)}
                        style={[
                          modeStyles.option,
                          active && modeStyles.optionActive,
                        ]}>
                        <AppText
                          style={[
                            modeStyles.optionText,
                            active && modeStyles.optionTextActive,
                          ]}>
                          {m.label}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
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
                    placeholderTextColor={colors.textMuted}
                  />
                </View>

                <AppText style={styles.modalHint}>
                  *your autobid will stop when it reaches stop loss
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

const modeStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border_Color,
    alignItems: 'center',
    marginRight: 8,
  },
  optionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textStrong,
  },
  optionTextActive: {
    color: colors.white,
  },
});
