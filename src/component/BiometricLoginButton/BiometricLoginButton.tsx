// src/components/BiometricLoginButton.js
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { checkBiometricAvailability, authenticateWithBiometric } from '../../utils/biometricAuth';
import {scale, verticalScale, moderateScale} from 'react-native-size-matters';
import { BiometryTypes } from 'react-native-biometrics';
import FaceIdIcon from '../../assets/svg_icon/faceid.svg';
import FingerprintIcon from '../../assets/svg_icon/fingerprint.svg';
import ErrorModal from '../ErrorModal/ErrorModal';
import useErrorModal from '../../hooks/useErrorModal';
import type {StyleProp, TextStyle, ViewStyle} from 'react-native';
import type {BiometryType} from 'react-native-biometrics';
import {colors} from '../../theme/colors';

/**
 * Biometric Login Button Component
 * @param {Object} props
 * @param {function} props.onSuccess - Called on successful authentication
 * @param {function} props.onError - Called on authentication error
 */
export interface BiometricLoginButtonProps {
  onSuccess?: () => void;
  onError?: (message?: string) => void;
  buttonStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  iconColor?: string;
  loaderColor?: string;
}

const BiometricLoginButton = ({
  onSuccess,
  onError,
  buttonStyle,
  textStyle,
  iconColor = colors.white,
  loaderColor = colors.white,
}: BiometricLoginButtonProps) => {
  // "Biometrics are not set up on this handset" is this button's own message
  // to give — see the two call sites below — so it shows it in the app's one
  // dialog rather than handing it to `onError`, whose parents head it "Login
  // Failed". That is a different thing and reads as the driver's fault.
  const {modalProps, showWarning} = useErrorModal();
  const [biometryType, setBiometryType] = useState<BiometryType | null>(null);
  const [loadingType, setLoadingType] = useState<string | null>(null);
  // Persistent availability error from the mount-time check (e.g. not enrolled / no hardware).
  const [availabilityError, setAvailabilityError] = useState<
    string | null | undefined
  >(null);

  useEffect(() => {
    (async () => {
      const { available, biometryType: type, error } = await checkBiometricAvailability();
      if (available && type) {
        setBiometryType(type);
        setAvailabilityError(null);
      } else {
        setAvailabilityError(error);
      }
    })();
  }, []);

  const handlePress = async (type: BiometryType | null) => {
    if (loadingType) return;
    // Already known to be unavailable from the mount-time check — guide the user without prompting.
    if (availabilityError) {
      showWarning('Biometric Login Unavailable', availabilityError);
      return;
    }
    // Pass custom prompt message for clarity
    const prompt = type === BiometryTypes.FaceID ? 'Authenticate with Face ID' : type === BiometryTypes.TouchID ? 'Authenticate with Fingerprint' : 'Authenticate with Biometrics';

    setLoadingType(type || 'Biometrics');
    const { success, error, code } = await authenticateWithBiometric(prompt);
    setLoadingType(null);

    if (success) {
      onSuccess && onSuccess();
      return;
    }
    // User dismissed the prompt — not an error, stay silent.
    if (code === 'CANCELLED') {
      return;
    }
    // Device-level problem (not enrolled / no hardware): show a clear, actionable message
    // here instead of surfacing it as a generic "login failed".
    if (code === 'NOT_ENROLLED' || code === 'NO_HARDWARE' || code === 'UNAVAILABLE') {
      setAvailabilityError(error);
      showWarning(
        'Biometric Login Unavailable',
        error || 'Biometrics are not available on this device.',
      );
      return;
    }
    // Genuine authentication failure (wrong face/finger, lockout, etc.)
    onError && onError(error);
  };

  // Always show a single button reflecting the active type.
  // - Fingerprint (TouchID) or Android Biometrics -> "Login with Fingerprint"
  // - Face ID active, or nothing enabled -> "Login with Face ID"
  const isFingerprint = biometryType === BiometryTypes.TouchID || biometryType === BiometryTypes.Biometrics;
  const Icon = isFingerprint ? FingerprintIcon : FaceIdIcon;
  const buttonText = isFingerprint ? 'Login with Fingerprint' : 'Login with Face ID';

  return (
    <>
      <TouchableOpacity style={[styles.button, buttonStyle]} onPress={() => handlePress(biometryType)} disabled={!!loadingType}>
        <Icon width={24} height={24} color={iconColor} fill={iconColor} style={styles.icon} />
        <Text style={[styles.buttonText, textStyle]}>{loadingType ? <ActivityIndicator color={loaderColor} /> : buttonText}</Text>
      </TouchableOpacity>

      <ErrorModal {...modalProps} />
    </>
  );
};

const styles = StyleSheet.create({
  dualButtonContainer: {
    flexDirection: 'column',
    gap: verticalScale(14),
    marginTop: verticalScale(16),
    alignItems: 'stretch',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentBlue,
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(8),
    marginTop: verticalScale(10),
    justifyContent: 'center',
    marginBottom: 0,
  },
  icon: {
    marginRight: scale(10),
  },
  buttonText: {
    color: colors.white,
    fontSize: moderateScale(16),
    fontWeight: '400',
  },
  errorContainer: {
    marginTop: verticalScale(16),
    padding: scale(12),
    backgroundColor: colors.red50,
    borderRadius: moderateScale(8),
  },
  errorText: {
    color: colors.danger,
    fontSize: moderateScale(14),
  },
});

export default BiometricLoginButton;
