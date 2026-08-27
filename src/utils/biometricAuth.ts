// src/utils/biometricAuth.ts
import ReactNativeBiometrics from 'react-native-biometrics';
import type {BiometryType} from 'react-native-biometrics';

import type {ErrorLike} from '../types/common';

/**
 * Why a biometric call did not succeed. A closed union rather than `string`,
 * so the screens that branch on it (`useBiometricAutoLogin`, the login button)
 * cannot test for a code that is never produced.
 */
export type BiometricErrorCode =
  | 'UNAVAILABLE'
  | 'NOT_ENROLLED'
  | 'NO_HARDWARE'
  | 'CANCELLED'
  | 'LOCKOUT'
  | 'ERROR';

export interface BiometricAvailability {
  available: boolean;
  /**
   * `undefined` is kept alongside `null` deliberately: on the success path the
   * library's own value is passed straight through (it is optional there),
   * while the failure paths normalise it to `null`. Collapsing the two would
   * be a behaviour change, however small, so the type records the difference
   * instead. Consumers only ever compare it for equality.
   */
  biometryType: BiometryType | null | undefined;
  error?: string;
  code?: BiometricErrorCode;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  code?: BiometricErrorCode;
}

export interface BiometricKeysResult {
  publicKey: string | null;
  error?: string;
}

export interface BiometricDeleteResult {
  deleted: boolean;
  error?: string;
}

let rnBiometrics: ReactNativeBiometrics | null = null;
try {
  // allowDeviceCredentials: lets the prompt fall back to the device PIN/pattern/passcode.
  // This is required on Android because many phones' face unlock is a "weak" (Class 2)
  // biometric, which the library's default STRONG-only check rejects as "none enrolled".
  // With the fallback enabled, a face-only (or PIN) user can still authenticate.
  rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });
} catch {
  // Optional catch binding — the reason the module failed to construct is not
  // used; a null `rnBiometrics` is what every function below branches on.
  rnBiometrics = null;
}

/**
 * Checks if biometric authentication is available and returns type.
 */
export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
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
    const err = e as ErrorLike;
    return { available: false, biometryType: null, error: err.message || 'Error checking biometric availability.', code: 'ERROR' };
  }
}

/**
 * Prompts user for biometric authentication.
 */
export async function authenticateWithBiometric(
  promptMessage: string = 'Authenticate with Biometrics',
): Promise<BiometricAuthResult> {
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
    const err = e as ErrorLike;
    const msg = err.message || '';
    if (err.name === 'UserCancel' || /user cancel/i.test(msg)) {
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
 */
export async function createBiometricKeys(): Promise<BiometricKeysResult> {
  if (!rnBiometrics) {
    return { publicKey: null, error: 'Biometric module not available. Please rebuild the app.' };
  }
  try {
    const { publicKey } = await rnBiometrics.createKeys();
    return { publicKey };
  } catch (e) {
    const err = e as ErrorLike;
    return { publicKey: null, error: err.message || 'Failed to create biometric keys.' };
  }
}

/**
 * Deletes biometric keys.
 */
export async function deleteBiometricKeys(): Promise<BiometricDeleteResult> {
  if (!rnBiometrics) {
    return { deleted: false, error: 'Biometric module not available. Please rebuild the app.' };
  }
  try {
    const { keysDeleted } = await rnBiometrics.deleteKeys();
    return { deleted: keysDeleted };
  } catch (e) {
    const err = e as ErrorLike;
    return { deleted: false, error: err.message || 'Failed to delete biometric keys.' };
  }
}
