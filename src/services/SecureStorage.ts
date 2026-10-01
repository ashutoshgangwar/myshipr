import * as Keychain from 'react-native-keychain';

import type {ErrorLike} from '../types/common';

export const SECURE_TOKEN_KEYS = {
  accessToken: 'auth_access_token',
  refreshToken: 'auth_refresh_token',
} as const;

export type SecureTokenKey =
  (typeof SECURE_TOKEN_KEYS)[keyof typeof SECURE_TOKEN_KEYS];

/** Namespaces our entries inside the app's keychain / keystore. */
const SERVICE_PREFIX = 'com.myshipr.auth.';

const serviceFor = (key: SecureTokenKey): string => `${SERVICE_PREFIX}${key}`;

const SET_OPTIONS: Keychain.SetOptions = {
  accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
};

const warn = (action: string, key: string, e: unknown): void => {
  const err = e as ErrorLike;
  console.warn(`[SecureStorage] ${action} failed for "${key}":`, err?.message);
};

/**
 * Stores `value` under `key` in the platform keychain/keystore.
 *
 * @returns `true` when the platform confirmed the write. `false` means the
 *   value is NOT stored — callers that must not silently lose a session should
 *   check it.
 */
export const setToken = async (
  key: SecureTokenKey,
  value: string,
): Promise<boolean> => {
  // An empty value would leave a stale entry behind on some platforms; treat
  // it as a removal so the store never disagrees with the caller's intent.
  if (!value) return removeToken(key);

  try {
    // The username slot is unused by this app — the key name goes in it so the
    // entry is identifiable in a keychain dump without exposing anything.
    const result = await Keychain.setGenericPassword(key, value, {
      ...SET_OPTIONS,
      service: serviceFor(key),
    });
    return result !== false;
  } catch (e) {
    warn('write', key, e);
    return false;
  }
};

/**
 * Reads `key` back.
 *
 * @returns the stored string, or `null` when nothing is stored *or* the
 *   platform store could not be reached. The two are deliberately not
 *   distinguished: every caller treats both as "no usable session".
 */
export const getToken = async (
  key: SecureTokenKey,
): Promise<string | null> => {
  try {
    const entry = await Keychain.getGenericPassword({service: serviceFor(key)});
    if (!entry || !entry.password) return null;
    return entry.password;
  } catch (e) {
    warn('read', key, e);
    return null;
  }
};

/** Deletes `key`. @returns `true` when the entry is gone. */
export const removeToken = async (key: SecureTokenKey): Promise<boolean> => {
  try {
    return await Keychain.resetGenericPassword({service: serviceFor(key)});
  } catch (e) {
    warn('remove', key, e);
    return false;
  }
};

/**
 * Deletes every key in `SECURE_TOKEN_KEYS`. Used by logout and by the
 * session-expired path.
 *
 * Each removal is independent, so one failing platform call cannot leave the
 * others behind.
 *
 * @returns `true` only when every entry was removed.
 */
export const clearTokens = async (): Promise<boolean> => {
  const results = await Promise.all(
    Object.values(SECURE_TOKEN_KEYS).map(key => removeToken(key)),
  );
  return results.every(Boolean);
};

/**
 * The service object the app codes against.
 *
 * Named exports are kept alongside it so a caller can pull in one method
 * without the whole surface; both point at the same functions.
 */
export const SecureStorage = {
  setToken,
  getToken,
  removeToken,
  clearTokens,
};

export default SecureStorage;
