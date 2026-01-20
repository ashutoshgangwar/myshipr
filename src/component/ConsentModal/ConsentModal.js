import React, {useState} from 'react';
import {Modal, View, Text, TouchableOpacity} from 'react-native';
import styles from './ConsentModal.styles';

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
          <Text style={styles.title}>Background Check Consent</Text>

          <Text style={styles.description}>
            By proceeding, you authorize us to perform a background verification
            as part of the driver onboarding process.
          </Text>

          {/* ✅ Custom Checkbox */}
          <TouchableOpacity
            style={styles.checkboxRow}
            activeOpacity={0.8}
            onPress={() => setChecked(!checked)}>
            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
              {checked && <Text style={styles.tick}>✓</Text>}
            </View>

            <Text style={styles.checkboxText}>
              I have read and agree to the background check
            </Text>
          </TouchableOpacity>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelBtn]}
              onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                checked ? styles.agreeBtn : styles.disabledBtn,
              ]}
              disabled={!checked}
              onPress={handleAgree}>
              <Text style={styles.agreeText}>I Agree</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConsentModal;
