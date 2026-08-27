// src/hooks/useBiometricAutoLogin.js
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkBiometricAvailability, authenticateWithBiometric } from '../utils/biometricAuth';
import type { ErrorLike } from '../types/common';

/**
 * Custom hook to handle biometric auto-login on app start.
 *
 * @param onSuccess Called on successful biometric auth
 * @param onFailure Called on failure/cancel, with the reason
 */
export default function useBiometricAutoLogin(
  onSuccess?: () => void,
  onFailure?: (reason?: string) => void,
): {biometricChecked: boolean; loading: boolean} {
  const [biometricChecked, setBiometricChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const enabled = await AsyncStorage.getItem('biometric_enabled');
        if (enabled === 'true') {
          setLoading(true);
          const { available } = await checkBiometricAvailability();
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
        const err = e as ErrorLike;
        setLoading(false);
        setBiometricChecked(true);
        onFailure && onFailure(err.message || 'Biometric error');
      }
    })();
  }, []);

  return { biometricChecked, loading };
}
