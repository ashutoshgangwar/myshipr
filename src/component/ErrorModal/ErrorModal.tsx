import React from 'react';
import {Modal, View, TouchableOpacity} from 'react-native';
import AppText from '../../theme/AppText';
import styles, {variantStyles} from './ErrorModal.styles';

export interface ErrorModalProps {
  visible?: boolean;
  onClose?: () => void;
  onConfirm?: () => void;
  /** Alias for `onConfirm`; whichever is given wins. */
  onRetry?: () => void;
  title?: string;
  message?: string;
  variant?: 'error' | 'success' | 'warning' | 'info';
  confirmText?: string;
  retryText?: string;
  closeText?: string;
  /** When false the backdrop and hardware back cannot dismiss the modal. */
  dismissable?: boolean;
}

const ErrorModal = ({
  visible,
  onClose,
  onConfirm,
  onRetry,
  title = 'Something went wrong',
  message = 'Unable to complete your request. Please try again.',
  variant = 'error',
  confirmText,
  retryText,
  closeText = 'Close',
  dismissable = true,
}: ErrorModalProps) => {
  const v = variantStyles[variant] || variantStyles.error;
  const confirmHandler = onConfirm || onRetry;
  const confirmLabel = confirmText || retryText || 'Retry';
  const requestClose = dismissable ? onClose : undefined;

  return (
    <Modal
      visible={Boolean(visible)}
      transparent
      animationType="fade"
      onRequestClose={requestClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={[styles.iconWrap, {backgroundColor: v.iconBg}]}>
            <AppText style={[styles.iconText, {color: v.iconColor}]}>
              {v.icon}
            </AppText>
          </View>

          <AppText style={styles.title}>{title}</AppText>
          <AppText style={styles.message}>{message}</AppText>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onClose}>
              <AppText style={styles.secondaryText}>{closeText}</AppText>
            </TouchableOpacity>

            {typeof confirmHandler === 'function' && (
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={confirmHandler}>
                <AppText style={styles.primaryText}>{confirmLabel}</AppText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ErrorModal;
