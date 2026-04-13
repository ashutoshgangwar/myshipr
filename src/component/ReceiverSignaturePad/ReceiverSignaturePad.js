import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SignatureCanvas from 'react-native-signature-canvas';

import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import styles from './ReceiverSignaturePad.styles';

const SIGNATURE_STORAGE_KEY = '@myshipr/receiver-signature';

const DEFAULT_TITLE = 'Receiver Signature';
const DEFAULT_SUBTITLE = 'Ask the receiving person to sign below and save it as proof.';

const ReceiverSignaturePad = ({
  visible = true,
  useModal = false,
  onClose,
  onSaved,
  persistKey = SIGNATURE_STORAGE_KEY,
  title = DEFAULT_TITLE,
  subtitle = DEFAULT_SUBTITLE,
  closeLabel = 'Close',
  initialValue = null,
}) => {
  const signatureRef = useRef(null);
  const [receiverName, setReceiverName] = useState(initialValue?.receiverName || '');
  const [signatureData, setSignatureData] = useState(initialValue?.signature || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      setReceiverName(initialValue?.receiverName || '');
      setSignatureData(initialValue?.signature || '');
      setIsSaving(false);
      signatureRef.current?.clearSignature();
    }
  }, [initialValue?.receiverName, initialValue?.signature, visible]);

  const webStyle = useMemo(
    () => `
      .m-signature-pad {
        box-shadow: none;
        border: none;
        background-color: #FFFFFF;
      }
      .m-signature-pad--body {
        border: none;
      }
      .m-signature-pad--footer {
        display: none;
        margin: 0;
      }
      body,html {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        background-color: #FFFFFF;
      }
    `,
    [],
  );

  const closeView = () => {
    onClose?.();
  };

  const handleSignature = async signature => {
    const trimmedName = receiverName.trim();

    if (!trimmedName) {
      Alert.alert('Receiver name required', 'Please enter the receiver name before saving the signature.');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        receiverName: trimmedName,
        signature,
        capturedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(persistKey, JSON.stringify(payload));
      setSignatureData(signature);
      onSaved?.(payload);
      Alert.alert('Signature saved', 'Receiver signature has been captured successfully.', [
        {
          text: 'OK',
          onPress: closeView,
        },
      ]);
    } catch (error) {
      Alert.alert('Save failed', 'Unable to save the signature right now. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmpty = () => {
    Alert.alert('Signature required', 'Please ask the receiver to sign in the box before saving.');
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setSignatureData('');
  };

  const handleSave = () => {
    signatureRef.current?.readSignature();
  };

  const formContent = (
    <>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.closeButton} onPress={closeView}>
          <AppText style={styles.closeButtonText}>{closeLabel}</AppText>
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <AppText style={styles.title}>{title}</AppText>
          <AppText style={styles.subtitle}>{subtitle}</AppText>
        </View>
      </View>

      <View style={styles.card}>
        <AppText style={styles.label}>Receiver name</AppText>
        <TextInput
          value={receiverName}
          onChangeText={setReceiverName}
          placeholder="Enter receiver full name"
          placeholderTextColor="#94A3B8"
          style={styles.input}
        />

        <AppText style={styles.label}>Signature pad</AppText>
        <View style={styles.signatureBox}>
          <SignatureCanvas
            ref={signatureRef}
            onOK={handleSignature}
            onEmpty={handleEmpty}
            descriptionText="Receiver sign here"
            clearText="Clear"
            confirmText="Save"
            webStyle={webStyle}
            backgroundColor={colors.white}
            penColor={colors.primary}
            autoClear={false}
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.secondaryButton, styles.buttonSpacingRight]}
            onPress={handleClear}>
            <AppText style={styles.secondaryButtonText}>Clear Pad</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, isSaving && styles.primaryButtonDisabled]}
            onPress={handleSave}
            disabled={isSaving}>
            <AppText style={styles.primaryButtonText}>
              {isSaving ? 'Saving...' : 'Save Signature'}
            </AppText>
          </TouchableOpacity>
        </View>
      </View>

      {signatureData ? (
        <View style={styles.previewCard}>
          <AppText style={styles.previewTitle}>Latest preview</AppText>
          <Image source={{uri: signatureData}} style={styles.previewImage} resizeMode="contain" />
        </View>
      ) : null}
    </>
  );

  const content = (
    <KeyboardAvoidingView
      style={useModal ? styles.keyboardWrapModal : styles.keyboardWrap}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {useModal ? (
        <View style={styles.content}>{formContent}</View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {formContent}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );

  if (!useModal) {
    return content;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={closeView}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>{content}</View>
      </View>
    </Modal>
  );
};

export default ReceiverSignaturePad;
export {SIGNATURE_STORAGE_KEY};
