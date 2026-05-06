// src/hooks/useBiometricAutoLogin.js
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkBiometricAvailability, authenticateWithBiometric } from '../utils/biometricAuth';

/**
 * Custom hook to handle biometric auto-login on app start.
 * @param {function} onSuccess - Called on successful biometric auth
 * @param {function} onFailure - Called on failure/cancel
 */
export default function useBiometricAutoLogin(onSuccess, onFailure) {
  const [biometricChecked, setBiometricChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const enabled = await AsyncStorage.getItem('biometric_enabled');
        if (enabled === 'true') {
          setLoading(true);
          const { available, biometryType } = await checkBiometricAvailability();
          if (available) {
            const { success, error } = await authenticateWithBiometric();
            setLoading(false);
            setBiometricChecked(true);
            if (success) onSuccess && onSuccess();
            else onFailure && onFailure(error);
          } else {
            setLoading(false);
            setBiometricChecked(true);
            onFailure && onFailure('Biometric not available');
          }
        } else {
          setBiometricChecked(true);
        }
      } catch (e) {
        setLoading(false);
        setBiometricChecked(true);
        onFailure && onFailure(e.message || 'Biometric error');
      }
    })();
  }, []);

  return { biometricChecked, loading };
}
