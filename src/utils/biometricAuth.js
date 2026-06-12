// src/utils/biometricAuth.js
import ReactNativeBiometrics from 'react-native-biometrics';

let rnBiometrics = null;
try {
  // allowDeviceCredentials: lets the prompt fall back to the device PIN/pattern/passcode.
  // This is required on Android because many phones' face unlock is a "weak" (Class 2)
  // biometric, which the library's default STRONG-only check rejects as "none enrolled".
  // With the fallback enabled, a face-only (or PIN) user can still authenticate.
  rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });
} catch (e) {
  rnBiometrics = null;
}

/**
 * Checks if biometric authentication is available and returns type.
 * @returns {Promise<{available: boolean, biometryType: string|null, error?: string}>}
 */
export async function checkBiometricAvailability() {
  if (!rnBiometrics) {
    return { available: false, biometryType: null, error: 'Biometric module not available. Please rebuild the app.', code: 'UNAVAILABLE' };
  }
  try {
    const { available, biometryType, error } = await rnBiometrics.isSensorAvailable();
    if (!available) {
      // Distinguish "no biometric enrolled" from "no hardware" so the UI can guide the user.
      const notEnrolled = /not enrolled|none enrolled|NONE_ENROLLED/i.test(error || '');
      return {
        available: false,
        biometryType: biometryType || null,
        error: notEnrolled
          ? 'No biometrics are set up on this device. Add a fingerprint or Face ID in your device settings.'
          : 'Biometric authentication is not supported on this device.',
        code: notEnrolled ? 'NOT_ENROLLED' : 'NO_HARDWARE',
      };
    }
    return { available, biometryType };
  } catch (e) {
    return { available: false, biometryType: null, error: e.message || 'Error checking biometric availability.', code: 'ERROR' };
  }
}

/**
 * Prompts user for biometric authentication.
 * @param {string} promptMessage
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function authenticateWithBiometric(promptMessage = 'Authenticate with Biometrics') {
  if (!rnBiometrics) {
    return { success: false, error: 'Biometric module not available. Please rebuild the app.', code: 'UNAVAILABLE' };
  }
  // Re-check enrollment right before prompting. isSensorAvailable() can report
  // available:true on some devices even when nothing is enrolled, so guard here
  // to give a clear message instead of a generic "Authentication failed".
  const { available, error: availabilityError, code: availabilityCode } = await checkBiometricAvailability();
  if (!available) {
    return { success: false, error: availabilityError, code: availabilityCode || 'NOT_ENROLLED' };
  }
  try {
    const { success } = await rnBiometrics.simplePrompt({ promptMessage });
    if (success) {
      return { success: true };
    }
    // success:false here means the user dismissed the prompt — treat as cancel, not failure.
    return { success: false, error: 'Authentication cancelled.', code: 'CANCELLED' };
  } catch (e) {
    const msg = e.message || '';
    if (e.name === 'UserCancel' || /user cancel/i.test(msg)) {
      return { success: false, error: 'Authentication cancelled.', code: 'CANCELLED' };
    }
    if (/not enrolled|none enrolled|no.*enrolled|NONE_ENROLLED/i.test(msg)) {
      return { success: false, error: 'No biometrics are set up on this device. Add a fingerprint or Face ID in your device settings.', code: 'NOT_ENROLLED' };
    }
    if (/lockout|too many/i.test(msg)) {
      return { success: false, error: 'Too many attempts. Please try again later or use your credentials.', code: 'LOCKOUT' };
    }
    return { success: false, error: msg || 'Biometric authentication error.', code: 'ERROR' };
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
