// src/components/BiometricLoginButton.js
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View, Image } from 'react-native';
import { checkBiometricAvailability, authenticateWithBiometric } from '../../utils/biometricAuth';
import {scale, verticalScale, moderateScale} from 'react-native-size-matters';
import { BiometryTypes } from 'react-native-biometrics';
import FaceIdIcon from '../../assets/svg_icon/faceid.svg';
import FingerprintIcon from '../../assets/svg_icon/fingerprint.svg';
import BiometricsIcon from '../../assets/svg_icon/fingerprint.svg';

const getButtonText = (biometryType) => {
  switch (biometryType) {
    case BiometryTypes.FaceID:
      return 'Login with Face ID';
    case BiometryTypes.TouchID:
      return 'Login with Fingerprint';
    case BiometryTypes.Biometrics:
      return 'Login with Biometrics';
    default:
      if (biometryType?.toLowerCase().includes('face')) return 'Login with Face ID';
      if (biometryType?.toLowerCase().includes('fingerprint')) return 'Login with Fingerprint';
      return 'Login with Biometrics';
  }
};

const getIcon = (biometryType) => {
  switch (biometryType) {
    case BiometryTypes.FaceID:
      return FaceIdIcon;
    case BiometryTypes.TouchID:
      return FingerprintIcon;
    case BiometryTypes.Biometrics:
      return BiometricsIcon;
    default:
      if (biometryType?.toLowerCase().includes('face')) return FaceIdIcon;
      if (biometryType?.toLowerCase().includes('fingerprint')) return FingerprintIcon;
      return BiometricsIcon;
  }
};

/**
 * Biometric Login Button Component
 * @param {Object} props
 * @param {function} props.onSuccess - Called on successful authentication
 * @param {function} props.onError - Called on authentication error
 */
const BiometricLoginButton = ({ onSuccess, onError }) => {
  const [biometryTypes, setBiometryTypes] = useState([]); // Array of available types
  const [loadingType, setLoadingType] = useState(null); // 'FaceID' | 'TouchID' | ...
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      // Try to detect both FaceID and TouchID
      let types = [];
      const { available, biometryType, error } = await checkBiometricAvailability();
      if (available && biometryType) {
        // Some devices (iOS) can have both FaceID and TouchID, but most return only one
        // Try to detect both by checking BiometryTypes
        if (biometryType === BiometryTypes.FaceID) types.push(BiometryTypes.FaceID);
        if (biometryType === BiometryTypes.TouchID) types.push(BiometryTypes.TouchID);
        if (biometryType === BiometryTypes.Biometrics) {
          // Android: try to detect both
          // For demo, show both buttons if type is Biometrics
          types = [BiometryTypes.FaceID, BiometryTypes.TouchID];
        }
        // If only one detected, push it
        if (types.length === 0) types.push(biometryType);
        setBiometryTypes(types);
      } else {
        setError(error);
      }
    })();
  }, []);

  const handlePress = async (type) => {
    setLoadingType(type);
    setError(null);
    // Pass custom prompt message for clarity
    const prompt = type === BiometryTypes.FaceID ? 'Authenticate with Face ID' : type === BiometryTypes.TouchID ? 'Authenticate with Fingerprint' : 'Authenticate with Biometrics';
    const { success, error } = await authenticateWithBiometric(prompt);
    setLoadingType(null);
    if (success) {
      onSuccess && onSuccess();
    } else {
      setError(error);
      onError && onError(error);
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // If both FaceID and TouchID, show both buttons
  if (biometryTypes.length > 1) {
    return (
      <View style={styles.dualButtonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handlePress(BiometryTypes.FaceID)}
          disabled={loadingType === BiometryTypes.FaceID}
        >
          <FaceIdIcon width={24} height={24} style={styles.icon} />
          <Text style={styles.buttonText}>
            {loadingType === BiometryTypes.FaceID ? <ActivityIndicator color="#fff" /> : 'Login with Face ID'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => handlePress(BiometryTypes.TouchID)}
          disabled={loadingType === BiometryTypes.TouchID}
        >
          <FingerprintIcon width={24} height={24} style={styles.icon} />
          <Text style={styles.buttonText}>
            {loadingType === BiometryTypes.TouchID ? <ActivityIndicator color="#fff" /> : 'Login with Fingerprint'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Only one type available
  const type = biometryTypes[0];
  const Icon = getIcon(type);
  const buttonText = getButtonText(type);

  return (
    <TouchableOpacity style={styles.button} onPress={() => handlePress(type)} disabled={!!loadingType}>
      <Icon width={24} height={24} style={styles.icon} />
      <Text style={styles.buttonText}>{loadingType ? <ActivityIndicator color="#fff" /> : buttonText}</Text>
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
    fontWeight: '600',
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
