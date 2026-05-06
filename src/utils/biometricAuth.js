// src/utils/biometricAuth.js
import ReactNativeBiometrics from 'react-native-biometrics';
import { Platform } from 'react-native';

let rnBiometrics = null;
try {
  rnBiometrics = new ReactNativeBiometrics();
} catch (e) {
  rnBiometrics = null;
}

/**
 * Checks if biometric authentication is available and returns type.
 * @returns {Promise<{available: boolean, biometryType: string|null, error?: string}>}
 */
export async function checkBiometricAvailability() {
  if (!rnBiometrics) {
    return { available: false, biometryType: null, error: 'Biometric module not available. Please rebuild the app.' };
  }
  try {
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();
    if (!available) {
      return { available: false, biometryType: null, error: 'Biometric authentication not supported on this device.' };
    }
    return { available, biometryType };
  } catch (e) {
    return { available: false, biometryType: null, error: e.message || 'Error checking biometric availability.' };
  }
}

/**
 * Prompts user for biometric authentication.
 * @param {string} promptMessage
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function authenticateWithBiometric(promptMessage = 'Authenticate with Biometrics') {
  if (!rnBiometrics) {
    return { success: false, error: 'Biometric module not available. Please rebuild the app.' };
  }
  try {
    const { success } = await rnBiometrics.simplePrompt({ promptMessage });
    if (success) {
      return { success: true };
    } else {
      return { success: false, error: 'Authentication failed.' };
    }
  } catch (e) {
    if (e.name === 'UserCancel' || e.message?.includes('User cancel')) {
      return { success: false, error: 'Authentication cancelled by user.' };
    }
    return { success: false, error: e.message || 'Biometric authentication error.' };
  }
}

/**
 * Creates biometric keys for secure authentication.
 * @returns {Promise<{publicKey: string|null, error?: string}>}
 */
export async function createBiometricKeys() {
  if (!rnBiometrics) {
    return { publicKey: null, error: 'Biometric module not available. Please rebuild the app.' };
  }
  try {
    const { publicKey } = await rnBiometrics.createKeys();
    return { publicKey };
  } catch (e) {
    return { publicKey: null, error: e.message || 'Failed to create biometric keys.' };
  }
}

/**
 * Deletes biometric keys.
 * @returns {Promise<{deleted: boolean, error?: string}>}
 */
export async function deleteBiometricKeys() {
  if (!rnBiometrics) {
    return { deleted: false, error: 'Biometric module not available. Please rebuild the app.' };
  }
  try {
    const { keysDeleted } = await rnBiometrics.deleteKeys();
    return { deleted: keysDeleted };
  } catch (e) {
    return { deleted: false, error: e.message || 'Failed to delete biometric keys.' };
  }
}
