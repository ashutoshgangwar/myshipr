import React, {useState} from 'react';
import {Modal, View, Text, TouchableOpacity} from 'react-native';
import styles from './ConsentModal.styles';
import AppText from '../../theme/AppText';

const ConsentModal = ({visible, onAgree, onCancel}) => {
  const [checked, setChecked] = useState(false);

  const handleAgree = () => {
    if (!checked) return;
    onAgree();
    setChecked(false);
  };

  const handleCancel = () => {
    setChecked(false);
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <AppText style={styles.title}>Background Check Consent</AppText>

          <AppText  Text style={styles.description}>
            By proceeding, you authorize us to perform a background verification
            as part of the driver onboarding process.
          </AppText>

          {/* ✅ Custom Checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            activeOpacity={0.8}
            onPress={() => setChecked(!checked)}>
            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
              {checked && <AppText style={styles.tick}>✓</AppText>}
            </View>

            <AppText style={styles.checkboxText}>
              I have read and agree to the background check
            </AppText>
          </TouchableOpacity>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelBtn]}
              onPress={handleCancel}>
              <AppText style={styles.cancelText}>Cancel</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                checked ? styles.agreeBtn : styles.disabledBtn,
              ]}
              disabled={!checked}
              onPress={handleAgree}>
              <AppText style={styles.agreeText}>I Agree</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConsentModal;
