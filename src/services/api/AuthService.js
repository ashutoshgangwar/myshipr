import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { API_ENDPOINTS, ACCESS_TOKEN_KEY } from '../../config/api';

export const AUTH_STORAGE_KEYS = {
  accessToken: ACCESS_TOKEN_KEY,
  refreshToken: 'auth_refresh_token',
  userId: 'auth_user_id',
  role: 'auth_role',
};

// Map backend status codes to user-friendly messages.
const messageForStatus = (status, body) => {
  const serverMessage = body?.message;
  switch (status) {
    case 400:
      return serverMessage || 'Invalid credentials. Please try again.';
    case 401:
    case 404:
      return serverMessage || 'Incorrect email/phone or password.';
    case 423:
      return serverMessage || 'Account locked. Please try again later.';
    case 429:
      return serverMessage || 'Too many requests. Please try again later.';
    default:
      return serverMessage || 'Login failed. Please try again.';
  }
};

const persistSession = async data => {
  const entries = [
    [AUTH_STORAGE_KEYS.accessToken, data?.accessToken],
    [AUTH_STORAGE_KEYS.refreshToken, data?.refreshToken],
    [AUTH_STORAGE_KEYS.userId, data?.userId],
    [AUTH_STORAGE_KEYS.role, data?.role],
  ].filter(([, value]) => value != null);
  if (entries.length) {
    await AsyncStorage.multiSet(entries.map(([k, v]) => [k, String(v)]));
  }
};

const post = async (url, payload) => {
  try {
    const { data } = await apiClient.post(url, payload);
    return data;
  } catch (err) {
    if (err.response) {
      // Server responded with a non-2xx status.
      const { status, data } = err.response;
      const error = new Error(messageForStatus(status, data));
      error.status = status;
      error.body = data;
      throw error;
    }
    if (err.code === 'ECONNABORTED') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw new Error('Network error. Please check your connection and try again.');
  }
};

/**
 * Password-mode login.
 * @param {{ identifier: string, password: string, role?: string }} params
 *   identifier is treated as an email if it contains '@', otherwise a phone number.
 * @returns {Promise<object>} the `data` payload (userId, accessToken, refreshToken, role, expiresIn)
 */
export const loginWithPassword = async ({ identifier, password, role }) => {
  const trimmed = (identifier || '').trim();
  const isEmail = trimmed.includes('@');

  const payload = {
    ...(isEmail ? { email: trimmed } : { phoneNumber: trimmed }),
    password,
    ...(role ? { role } : {}),
  };

  const body = await post(API_ENDPOINTS.auth.login, payload);
  await persistSession(body?.data);
  return body?.data;
};

export const getAccessToken = () =>
  AsyncStorage.getItem(AUTH_STORAGE_KEYS.accessToken);

export const clearSession = () =>
  AsyncStorage.multiRemove(Object.values(AUTH_STORAGE_KEYS));

export default {
  loginWithPassword,
  getAccessToken,
  clearSession,
  AUTH_STORAGE_KEYS,
};
