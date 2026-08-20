import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import styles from './PasswordPromptModal.styles';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import CrossIcon from '../../assets/svg_icon/Cross_Icon.svg';
import {ms} from '../../theme/scale';

const CLOSE_ICON = ms(26);

// Re-authentication sheet: the driver confirms their password before a change
// that would otherwise let anyone holding the unlocked phone through.
const PasswordPromptModal = ({
  visible,
  title = 'Enter your password',
  label = 'Enter your Password',
  placeholder = 'Enter your password',
  submitText = 'Submit',
  submitting = false,
  error,
  onSubmit,
  onClose,
}) => {
  const [password, setPassword] = useState('');

  // Never leave a typed password sitting in state once the sheet is dismissed.
  useEffect(() => {
    if (!visible) setPassword('');
  }, [visible]);

  const submit = () => {
    if (submitting) return;
    onSubmit?.(password);
  };

  const disabled = submitting || !password.trim();

  return (
    <Modal
      visible={Boolean(visible)}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Tapping the dimmed area closes, the card itself swallows the tap. */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.card}>
          <View style={styles.header}>
            <AppText style={styles.title} numberOfLines={1}>
              {title}
            </AppText>
            <TouchableOpacity
              style={styles.closeBtn}
              activeOpacity={0.8}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              onPress={onClose}>
              <CrossIcon width={CLOSE_ICON} height={CLOSE_ICON} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <AppText style={styles.label}>{label}</AppText>

            <TextInput
              style={[styles.input, Boolean(error) && styles.inputError]}
              value={password}
              onChangeText={setPassword}
              placeholder={placeholder}
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={submit}
            />

            {error ? <AppText style={styles.error}>{error}</AppText> : null}

            <TouchableOpacity
              style={[styles.submitBtn, disabled && styles.submitBtnDisabled]}
              activeOpacity={0.85}
              disabled={disabled}
              onPress={submit}>
              {submitting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <AppText style={styles.submitText}>{submitText}</AppText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default PasswordPromptModal;
