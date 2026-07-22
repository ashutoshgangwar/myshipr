// src/components/BiometricLoginButton.js
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { checkBiometricAvailability, authenticateWithBiometric } from '../../utils/biometricAuth';
import {scale, verticalScale, moderateScale} from 'react-native-size-matters';
import { BiometryTypes } from 'react-native-biometrics';
import FaceIdIcon from '../../assets/svg_icon/faceid.svg';
import FingerprintIcon from '../../assets/svg_icon/fingerprint.svg';

/**
 * Biometric Login Button Component
 * @param {Object} props
 * @param {function} props.onSuccess - Called on successful authentication
 * @param {function} props.onError - Called on authentication error
 */
const BiometricLoginButton = ({
  onSuccess,
  onError,
  buttonStyle,
  textStyle,
  iconColor = '#fff',
  loaderColor = '#fff',
}) => {
  const [biometryType, setBiometryType] = useState(null); // 'FaceID' | 'TouchID' | 'Biometrics' | null
  const [loadingType, setLoadingType] = useState(null);
  // Persistent availability error from the mount-time check (e.g. not enrolled / no hardware).
  const [availabilityError, setAvailabilityError] = useState(null);

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

  const handlePress = async (type) => {
    if (loadingType) return;
    // Already known to be unavailable from the mount-time check — guide the user without prompting.
    if (availabilityError) {
      Alert.alert('Biometric Login Unavailable', availabilityError);
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
      Alert.alert('Biometric Login Unavailable', error);
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
    <TouchableOpacity style={[styles.button, buttonStyle]} onPress={() => handlePress(biometryType)} disabled={!!loadingType}>
      <Icon width={24} height={24} color={iconColor} fill={iconColor} style={styles.icon} />
      <Text style={[styles.buttonText, textStyle]}>{loadingType ? <ActivityIndicator color={loaderColor} /> : buttonText}</Text>
    </TouchableOpacity>
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
    backgroundColor: '#2D6CDF',
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
    color: '#fff',
    fontSize: moderateScale(16),
    fontWeight: '400',
  },
  errorContainer: {
    marginTop: verticalScale(16),
    padding: scale(12),
    backgroundColor: '#f8d7da',
    borderRadius: moderateScale(8),
  },
  errorText: {
    color: '#721c24',
    fontSize: moderateScale(14),
  },
});

export default BiometricLoginButton;
