import axios from 'axios';
import type {AxiosError, InternalAxiosRequestConfig} from 'axios';
import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import {API_BASE_URL, API_TIMEOUT, DEBUG} from '@env';
import {getFcmToken} from '../services/FirebaseMessagingService';
import type {
  ApiErrorBody,
  AppApiError,
  PasswordResetResult,
  PasswordTokenInfo,
  RegisterDeviceBody,
  RegisterDeviceParams,
  RetriableRequestConfig,
  SetPasswordResult,
} from '../types/api';
import type {
  LoginCredentials,
  LoginRequestBody,
  SessionPayload,
  SessionExpiredHandler,
  SessionRestoreResult,
  SetPasswordParams,
  Unsubscribe,
} from '../types/auth';
import type {ErrorLike, ValidationResult} from '../types/common';

/** The request config plus the one-shot replay flag this file sets on it. */
type ApiRequestConfig = InternalAxiosRequestConfig & RetriableRequestConfig;

type LinkFailure = AxiosError<ApiErrorBody> & AppApiError;

// --- Config --------------------------------------------------------------

const BASE_URL = (API_BASE_URL || '').replace(/\/+$/, '');

const API_PREFIX = 'api/v1';

export const REQUEST_TIMEOUT_MS = Number(API_TIMEOUT) || 30000;

export const serviceUrl = (service: string, path: string): string =>
  `${BASE_URL}/${service}/${API_PREFIX}${path}`;

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    registerDevice: '/auth/devices/register',
    // Driver-invite link flow. Both are unauthenticated: the emailed token IS
    // the credential, so no bearer token is attached.
    verifyPasswordToken: '/auth/password/token/verify',
    setPassword: '/auth/password/set',
    // Used by the in-app "Forgot Password" (OTP) screen, not by any link.
    forgotPassword: '/auth/password/forgot',
  },
};

// The single debug switch for API traffic. Set DEBUG=false in .env.production.
const DEBUG_ENABLED = String(DEBUG).toLowerCase() === 'true';

const safe = (value: unknown): unknown => {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(safe);
  return Object.fromEntries(
    Object.entries(value).map(([key, val]) => [
      key,
      /pass|token|secret|authorization/i.test(key) ? '***' : safe(val),
    ]),
  );
};

/** Logs under the shared DEBUG switch. `tag` names the calling module. */
export const createApiLogger =
  (tag: string) =>
  (...args: unknown[]): void => {
  if (DEBUG_ENABLED) console.log(tag, ...args);
};

const log = createApiLogger('[API]');

log('base url', `${BASE_URL}/${API_PREFIX}`);

if (!BASE_URL) {
  console.warn('[API] API_BASE_URL is not set in .env — requests will fail.');
}

// --- Token storage -------------------------------------------------------

export const AUTH_STORAGE_KEYS = {
  accessToken: 'auth_access_token',
  refreshToken: 'auth_refresh_token',
  userId: 'auth_user_id',
  organizationId: 'auth_organization_id',
  organizationType: 'auth_organization_type',
  expiresAt: 'auth_expires_at',
};

export const ACCESS_TOKEN_KEY = AUTH_STORAGE_KEYS.accessToken;

/** Persists the `data` block of a login/refresh response. */
export const saveSession = async (
  data: SessionPayload | null | undefined,
): Promise<void> => {
  if (!data) return;

  const expiresAt =
    data.expiresIn != null ? Date.now() + Number(data.expiresIn) * 1000 : null;

  const entries = [
    [AUTH_STORAGE_KEYS.accessToken, data.accessToken],
    [AUTH_STORAGE_KEYS.refreshToken, data.refreshToken],
    [AUTH_STORAGE_KEYS.userId, data.userId],
    [AUTH_STORAGE_KEYS.organizationId, data.organizationId],
    [AUTH_STORAGE_KEYS.organizationType, data.organizationType],
    [AUTH_STORAGE_KEYS.expiresAt, expiresAt],
  ].filter(([, value]) => value != null && value !== '');

  if (entries.length) {
    await AsyncStorage.multiSet(
      entries.map(([k, v]): [string, string] => [String(k), String(v)]),
    );
  }
};

export const getAccessToken = () =>
  AsyncStorage.getItem(AUTH_STORAGE_KEYS.accessToken);

export const getRefreshToken = () =>
  AsyncStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);

export const hasSession = async (): Promise<boolean> =>
  Boolean(await getAccessToken());

export const getSessionExpiresAt = async (): Promise<number | null> => {
  const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.expiresAt);
  const value = Number(raw);
  return raw && Number.isFinite(value) ? value : null;
};

const EXPIRY_SKEW_MS = 60 * 1000;

export const isAccessTokenExpired = async (): Promise<boolean> => {
  const expiresAt = await getSessionExpiresAt();
  if (expiresAt == null) return false;
  return Date.now() >= expiresAt - EXPIRY_SKEW_MS;
};

export const clearSession = () =>
  AsyncStorage.multiRemove(Object.values(AUTH_STORAGE_KEYS));


const apiClient = axios.create({
  baseURL: `${BASE_URL}/${API_PREFIX}`,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const refreshClient = axios.create({
  baseURL: `${BASE_URL}/${API_PREFIX}`,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Endpoints that must go out unauthenticated and must not trigger a refresh.
const AUTH_FREE_PATHS = [
  API_ENDPOINTS.auth.login,
  API_ENDPOINTS.auth.refresh,
  API_ENDPOINTS.auth.verifyPasswordToken,
  API_ENDPOINTS.auth.setPassword,
  API_ENDPOINTS.auth.forgotPassword,
];
const isAuthFree = (url?: string): boolean =>
  AUTH_FREE_PATHS.some(path => (url || '').includes(path));

// Attach the bearer token to every request when one is stored.
apiClient.interceptors.request.use(async (config: ApiRequestConfig) => {
  if (!isAuthFree(config.url)) {
    try {
      if (await isAccessTokenExpired()) {
        await refreshAccessToken().catch(() => {});
      }
      const token = await getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // No stored token / storage unavailable — send it unauthenticated.
    }
  }

  log(`→ ${String(config.method).toUpperCase()} ${config.url}`, safe(config.data));
  return config;
});

// Single in-flight refresh shared by every request that 401s at the same time.
let refreshPromise: Promise<string> | null = null;
const sessionExpiredError = (): AppApiError => {
  const error: AppApiError = new Error('Session expired. Please log in again.');
  error.sessionInvalid = true;
  return error;
};

/** Exchanges the refresh token for a new access token. @returns {Promise<string>} */
export const refreshAccessToken = (): Promise<string> => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      throw sessionExpiredError();
    }

    const {data} = await refreshClient.post(API_ENDPOINTS.auth.refresh, {
      refreshToken,
    });

    const session = data?.data || data;
    if (!session?.accessToken) {
      throw sessionExpiredError();
    }

    await saveSession(session);
    log('access token refreshed');
    return session.accessToken;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
};

const sessionExpiredHandlers = new Set<SessionExpiredHandler>();

/** @param {() => void} handler @returns {() => void} unsubscribe */
export const onSessionExpired = (
  handler: SessionExpiredHandler,
): Unsubscribe => {
  sessionExpiredHandlers.add(handler);
  return () => {
    sessionExpiredHandlers.delete(handler);
  };
};

/**
 * Decides at app start whether the user goes straight to the home screen.
 *
 *
 * @returns {Promise<{authenticated: boolean, refreshed: boolean,
 *                    reason: 'valid'|'refreshed'|'no-session'|'expired'|'offline'}>}
 */
export const restoreSession = async (): Promise<SessionRestoreResult> => {
  const [accessToken, refreshToken] = await Promise.all([
    getAccessToken(),
    getRefreshToken(),
  ]);

  if (!accessToken && !refreshToken) {
    return {authenticated: false, refreshed: false, reason: 'no-session'};
  }

  if (accessToken && !(await isAccessTokenExpired())) {
    log('session restored from storage');
    return {authenticated: true, refreshed: false, reason: 'valid'};
  }

  if (!refreshToken) {
    await clearSession();
    return {authenticated: false, refreshed: false, reason: 'expired'};
  }

  try {
    await refreshAccessToken();
    return {authenticated: true, refreshed: true, reason: 'refreshed'};
  } catch (e) {
    const err = e as AppApiError & {response?: unknown};
    if (err?.response || err?.sessionInvalid) {
      await clearSession();
      return {authenticated: false, refreshed: false, reason: 'expired'};
    }
    log('session restore failed offline — staying signed in');
    return {authenticated: true, refreshed: false, reason: 'offline'};
  }
};


apiClient.interceptors.response.use(
  response => {
    log(`← ${response.status} ${response.config.url}`, safe(response.data));
    return response;
  },
  async (error: AxiosError) => {
    const {response} = error;
    const config = error.config as ApiRequestConfig | undefined;

    log(
      `✗ ${response?.status || error.code || 'network'} ${config?.url || ''}`,
      response?.data || error.message,
    );

    if (
      response?.status === 401 &&
      config &&
      !config._retriedAfterRefresh &&
      !isAuthFree(config.url)
    ) {
      config._retriedAfterRefresh = true;
      try {
        const token = await refreshAccessToken();
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        } as typeof config.headers;
        return apiClient(config);
      } catch (e) {
        const refreshError = e as AppApiError & {response?: unknown};
        if (refreshError?.response || refreshError?.sessionInvalid) {
          await clearSession();
          sessionExpiredHandlers.forEach(handler => handler());
        } else {
          log('refresh failed without a server answer — session kept');
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// --- Auth API ------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?\d{10,15}$/;
const MIN_PASSWORD_LENGTH = 4;


const parseRetryAfter = (headers: unknown): number | null => {
  const bag = headers as Record<string, string | undefined> | undefined;
  const raw = bag?.['retry-after'] ?? bag?.['Retry-After'];
  if (raw == null || raw === '') return null;

  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return Math.max(0, Math.round(seconds));

  const retryAt = Date.parse(raw);
  if (!Number.isFinite(retryAt)) return null;
  return Math.max(0, Math.round((retryAt - Date.now()) / 1000));
};

const formatWait = (seconds: number | null | undefined): string => {
  if (!seconds) return '';
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
};

// Turns a backend status code into something worth showing the user.
const messageForStatus = (
  status: number,
  body: ApiErrorBody | undefined,
  retryAfterSeconds: number | null,
): string => {
  const serverMessage = body?.message;
  switch (status) {
    case 400:
      return serverMessage || 'Invalid credentials. Please try again.';
    case 401:
    case 404:
      return serverMessage || 'Incorrect email/phone or password.';
    case 423:
      return serverMessage || 'Account locked. Please try again later.';
    case 429: {
      const wait = formatWait(retryAfterSeconds);
      if (wait) return `Too many login attempts. Please try again in ${wait}.`;
      return (
        serverMessage ||
        'Too many login attempts. Please wait a few minutes before trying again.'
      );
    }
    default:
      return serverMessage || 'Login failed. Please try again.';
  }
};

/**
 * Checks what the login form collected, in the order the user reads the fields.
 * @param {string} identifier email address or phone number
 * @param {string} password
 * @returns {{ok: true} | {ok: false, title: string, message: string}}
 */
export const validateLogin = (
  identifier: string,
  password: string,
): ValidationResult => {
  const entered = (identifier || '').trim();

  if (!entered) {
    return {
      ok: false,
      title: 'Required Field',
      message: 'Please enter email or mobile number',
    };
  }

  const looksLikeEmail = entered.includes('@');
  const isValid = looksLikeEmail
    ? EMAIL_REGEX.test(entered)
    : PHONE_REGEX.test(entered.replace(/[\s()-]/g, ''));

  if (!isValid) {
    return {
      ok: false,
      title: looksLikeEmail ? 'Invalid Email' : 'Invalid Input',
      message: looksLikeEmail
        ? 'Please enter a valid email address'
        : 'Please enter a valid email or mobile number',
    };
  }

  if (!password) {
    return {
      ok: false,
      title: 'Required Field',
      message: 'Please enter your password',
    };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      title: 'Invalid Password',
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    };
  }

  return {ok: true};
};

/**
 * Registers this device for push notifications against the logged-in user.
 * @param {{fcmRegistrationToken?: string, firebaseInstallationId?: string,
 *          accessToken?: string}} [params]
 * @returns {Promise<object|null>} the response body, or null when there is no
 *   FCM token to register (permission denied / token minting failed)
 */
export const registerDevice = async ({
  fcmRegistrationToken,
  firebaseInstallationId,
  accessToken,
}: RegisterDeviceParams = {}): Promise<unknown> => {
  // The caller usually already has the token; fall back to asking FCM for it.
  const token = fcmRegistrationToken || (await getFcmToken());
  if (!token) {
    log('device register skipped — no FCM token');
    return null;
  }

  const deviceName =
    (await DeviceInfo.getDeviceName().catch(() => null)) || DeviceInfo.getModel();

  const body: RegisterDeviceBody = {
    fcmRegistrationToken: token,
    platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
    deviceName,
  };
  if (firebaseInstallationId) {
    body.firebaseInstallationId = firebaseInstallationId;
  }

  const config = accessToken
    ? {headers: {Authorization: `Bearer ${accessToken}`}}
    : undefined;

  log('device register payload', {...body, fcmRegistrationToken: token});

  const {data} = await apiClient.post(
    API_ENDPOINTS.auth.registerDevice,
    body,
    config,
  );
  log('device registered', {platform: body.platform, deviceName});
  return data;
};

/**
 * @param {{identifier: string, password: string}} params
 * @returns {Promise<object>} the `data` payload, already saved to storage
 * @throws {Error} with a message ready to show in the error modal
 */
export const login = async ({
  identifier,
  password,
}: LoginCredentials): Promise<SessionPayload> => {
  const entered = (identifier || '').trim();
  const payload: LoginRequestBody = entered.includes('@')
    ? {email: entered, password}
    : {phoneNumber: entered.replace(/[\s()-]/g, ''), password};
  const fcmRegistrationToken = await getFcmToken();
  if (fcmRegistrationToken) {
    payload.fcmRegistrationToken = fcmRegistrationToken;
  }
  const deviceName = await DeviceInfo.getDeviceName().catch(() => null);
  const deviceInfo = {
    deviceName,
    devicePlatform: Platform.OS, // 'android' | 'ios'
    deviceOsVersion: DeviceInfo.getSystemVersion(),
    deviceModel: DeviceInfo.getModel(),
    isTablet: DeviceInfo.isTablet(),
  };
  log('login payload', {...(safe(payload) as object), fcmRegistrationToken});
  log('device info', deviceInfo);

  try {
    const {data: body} = await apiClient.post(API_ENDPOINTS.auth.login, payload);
    const data = body?.data;

    if (!data?.accessToken) {
      throw new Error(body?.message || 'Login failed. Please try again.');
    }
    await clearSession();
    await saveSession(data);
    log('session stored', {
      hasRefreshToken: Boolean(data.refreshToken),
      expiresIn: data.expiresIn,
    });
    log('access token (dev only)\n' + data.accessToken);

    registerDevice({
      fcmRegistrationToken,
      accessToken: data.accessToken,
    }).catch((err: AxiosError & ErrorLike) =>
      log('device register failed', err?.response?.status || err?.message),
    );

    return data;
  } catch (e) {
    const err = e as AxiosError<ApiErrorBody> & ErrorLike;
    if (err.response) {
      // Server answered with a non-2xx status.
      const {status, data, headers} = err.response;
      const retryAfterSeconds =
        status === 429 ? parseRetryAfter(headers) : null;

      const error: AppApiError = new Error(
        messageForStatus(status, data, retryAfterSeconds),
      );
      error.status = status;
      if (status === 429) {
        error.rateLimited = true;
        error.retryAfterSeconds = retryAfterSeconds;
      }
      throw error;
    }
    if (err.code === 'ECONNABORTED') {
      throw new Error(
        'Request timed out. Please check your connection and try again.',
      );
    }
    // A thrown Error from the block above already carries a usable message.
    if (!err.request) throw err;
    throw new Error(
      'Network error. Please check your connection and try again.',
    );
  }
};

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_HAS_DIGIT = /[0-9]/;
const PASSWORD_HAS_SYMBOL = /[^A-Za-z0-9]/;

/**
 *
 * @param {string} password
 * @param {string} confirmPassword
 * @returns {{ok: true} | {ok: false, title: string, message: string}}
 */
export const validateNewPassword = (
  password: string,
  confirmPassword: string,
): ValidationResult => {
  if (!password) {
    return {ok: false, title: 'Required', message: 'Please enter a new password'};
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      title: 'Weak Password',
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    };
  }
  if (!PASSWORD_HAS_DIGIT.test(password) || !PASSWORD_HAS_SYMBOL.test(password)) {
    return {
      ok: false,
      title: 'Weak Password',
      message: 'Password must include a number and a special character',
    };
  }
  if (!confirmPassword) {
    return {ok: false, title: 'Required', message: 'Please confirm your password'};
  }
  if (password !== confirmPassword) {
    return {ok: false, title: 'Mismatch', message: 'Passwords do not match'};
  }
  return {ok: true};
};


const messageForLinkStatus = (
  status: number,
  body: ApiErrorBody | undefined,
): string => {
  const serverMessage = body?.message;
  switch (status) {
    case 410:
      return (
        serverMessage ||
        'This link has expired. Please ask your carrier to send a new invite.'
      );
    case 409:
      return (
        serverMessage ||
        'This link has already been used. Sign in with your password, or use Forgot Password.'
      );
    case 400:
    case 401:
    case 404:
      return (
        serverMessage ||
        'This link is not valid. Please ask your carrier to send a new invite.'
      );
    case 422:
      // The backend enforces the password policy too; show exactly what it said.
      return serverMessage || 'That password was rejected. Please choose another.';
    case 429:
      return (
        serverMessage ||
        'Too many attempts. Please wait a few minutes before trying again.'
      );
    default:
      return serverMessage || 'Something went wrong. Please try again.';
  }
};

/** Turns an axios failure on a link endpoint into an Error worth showing. */
const linkError = (err: AxiosError<ApiErrorBody> & ErrorLike): Error => {
  if (err.response) {
    const {status, data} = err.response;
    const error: AppApiError = new Error(messageForLinkStatus(status, data));
    error.status = status;
    // The screen swaps the password form for a dead end on these three: no
    // amount of retrying makes this token work again.
    error.linkDead = [400, 401, 404, 409, 410].includes(status);
    return error;
  }
  if (err.code === 'ECONNABORTED') {
    return new Error(
      'Request timed out. Please check your connection and try again.',
    );
  }
  if (!err.request) return err;
  return new Error('Network error. Please check your connection and try again.');
};

/**
 * @param {string} token
 * @returns {Promise<{purpose: string, email?: string, phoneNumber?: string,
 *                    fullName?: string, expiresAt?: string}>}
 * @throws {Error} `
 */
export const verifyPasswordToken = async (
  token: string,
): Promise<PasswordTokenInfo> => {
  if (!token) {
    const error: AppApiError = new Error('This link is not valid.');
    error.linkDead = true;
    throw error;
  }

  try {
    const {data: body} = await apiClient.post(
      API_ENDPOINTS.auth.verifyPasswordToken,
      {token},
    );
    const data = body?.data || {};
    if (data.valid === false) {
      const error: AppApiError = new Error(
        body?.message ||
          'This link is not valid or has expired. Please ask your carrier to send a new invite.',
      );
      error.linkDead = true;
      throw error;
    }

    log('password token verified', {purpose: data.purpose, email: data.email});
    return data;
  } catch (e) {
    const err = e as LinkFailure;
    if (err.linkDead) throw err;
    throw linkError(err);
  }
};

/**
 * @param {{token: string, newPassword: string}} params
 * @returns {Promise<{session: object|null, message: string}>}
 */
export const setPasswordWithToken = async ({
  token,
  newPassword,
}: SetPasswordParams): Promise<SetPasswordResult> => {
  try {
    const {data: body} = await apiClient.post(API_ENDPOINTS.auth.setPassword, {
      token,
      newPassword,
    });

    const session = body?.data?.accessToken ? body.data : null;

    if (session) {
      await clearSession();
      await saveSession(session);
      log('session stored from password setup');
      registerDevice({accessToken: session.accessToken}).catch(err =>
        log('device register failed', err?.response?.status || err?.message),
      );
    }

    return {session, message: body?.message || 'Password set successfully.'};
  } catch (e) {
    throw linkError(e as LinkFailure);
  }
};

/**
 * @param {string} identifier
 * @returns {Promise<{message: string}>}
 */
export const requestPasswordReset = async (
  identifier: string,
): Promise<PasswordResetResult> => {
  const entered = (identifier || '').trim();
  const payload = entered.includes('@')
    ? {email: entered}
    : {phoneNumber: entered.replace(/[\s()-]/g, '')};

  try {
    const {data: body} = await apiClient.post(
      API_ENDPOINTS.auth.forgotPassword,
      payload,
    );
    return {
      message:
        body?.message ||
        'If that account exists, we have sent a reset link to it.',
    };
  } catch (e) {
    throw linkError(e as LinkFailure);
  }
};

/**
 */
export const logout = async () => {
  try {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await apiClient.post(API_ENDPOINTS.auth.logout, {refreshToken});
    }
  } catch {
  } finally {
    await clearSession();
  }
};

export {BASE_URL, API_PREFIX};

export default apiClient;
