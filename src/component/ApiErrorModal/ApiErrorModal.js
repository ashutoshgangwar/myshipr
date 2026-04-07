import React from 'react';
import {Modal, View, TouchableOpacity} from 'react-native';
import AppText from '../../theme/AppText';
import styles from './ApiErrorModal.styles';

const getApiErrorMessage = (error, fallbackMessage) => {
  if (!error) return fallbackMessage;

  if (typeof error === 'string') {
    return error;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.response?.data?.error) {
    return error.response.data.error;
  }

  if (error?.message) {
    return error.message;
  }

  return fallbackMessage;
};

const ApiErrorModal = ({
  visible,
  onClose,
  onRetry,
  error,
  title = 'Something went wrong',
  message = 'Unable to complete your request. Please try again.',
  retryText = 'Retry',
  closeText = 'Close',
}) => {
  const finalMessage = getApiErrorMessage(error, message);

  return (
    <Modal
      visible={Boolean(visible)}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <AppText style={styles.iconText}>!</AppText>
          </View>

          <AppText style={styles.title}>{title}</AppText>
          <AppText style={styles.message}>{finalMessage}</AppText>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onClose}>
              <AppText style={styles.secondaryText}>{closeText}</AppText>
            </TouchableOpacity>

            {typeof onRetry === 'function' && (
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={onRetry}>
                <AppText style={styles.primaryText}>{retryText}</AppText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ApiErrorModal;
