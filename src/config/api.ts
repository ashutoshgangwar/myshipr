import axios from 'axios';
import type {AxiosError, InternalAxiosRequestConfig} from 'axios';
import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import {API_BASE_URL, API_TIMEOUT, DEBUG} from '@env';
import {getFcmToken} from '../services/FirebaseMessagingService';
import {invalidateResource} from '../services/resourceCache';
import SecureStorage, {SECURE_TOKEN_KEYS} from '../services/SecureStorage';
import type {SecureTokenKey} from '../services/SecureStorage';
import type {
  AcceptInvitationResult,
  ApiErrorBody,
  AppApiError,
  PasswordResetResult,
  RegisterDeviceBody,
  RegisterDeviceParams,
  RetriableRequestConfig,
  VerifyOtpResult,
} from '../types/api';
import type {
  AcceptInvitationParams,
  AuthStateHandler,
  LoginCredentials,
  LoginRequestBody,
  SessionPayload,
  SessionExpiredHandler,
  SessionRestoreResult,
  VerifyEmailOtpParams,
  VerifyPhoneOtpParams,
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
    // Driver-invite link flow, all three unauthenticated: for `acceptInvitation`
    // the emailed token IS the credential, and the two verify calls happen
    // before the driver has ever signed in. No bearer token is attached to any
    // of them.
    acceptInvitation: '/auth/invitations/accept',
    verifyPhone: '/auth/verify/phone',
    verifyEmail: '/auth/verify/email',
    // Used by the in-app "Forgot Password" (OTP) screen, not by any link.
    forgotPassword: '/auth/password/forgot',
  },
};

// The single debug switch for API traffic. Set DEBUG=false in .env.production.
const DEBUG_ENABLED = String(DEBUG).toLowerCase() === 'true';

const REDACTED_KEY = /secret|authorization/i;

/**
 * Keys whose string value is kept in full even when longer than
 * MAX_LOGGED_STRING. The FCM token (~142 chars) needs to be copied whole for
 * testing, so it must not be clipped. Only reaches the console in DEBUG builds.
 */
const NEVER_CLIP_KEY = /^fcmRegistrationToken$/;

/**
 * Longest string a logged body keeps in full. A base64 photo runs to millions
 * of characters — printing one wedges the debugger and buries every other
 * line, so anything past this is clipped down to its head and its length.
 */
const MAX_LOGGED_STRING = 120;

const safe = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return value.length > MAX_LOGGED_STRING
      ? `${value.slice(0, MAX_LOGGED_STRING)}… (${value.length} chars)`
      : value;
  }
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(safe);
  return Object.fromEntries(
    Object.entries(value).map(([key, val]) => [
      key,
      REDACTED_KEY.test(key)
        ? '***'
        : NEVER_CLIP_KEY.test(key)
        ? val
        : safe(val),
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
export const AUTH_STORAGE_KEYS = {
  accessToken: SECURE_TOKEN_KEYS.accessToken,
  refreshToken: SECURE_TOKEN_KEYS.refreshToken,
  userId: 'auth_user_id',
  organizationId: 'auth_organization_id',
  organizationType: 'auth_organization_type',
  // The phone number the driver signed in with — only set by a successful
  // phone login, and wiped with the rest by `clearSession()`.
  phoneNumber: 'auth_phone_number',
  expiresAt: 'auth_expires_at',
};

export const ACCESS_TOKEN_KEY = AUTH_STORAGE_KEYS.accessToken;

/**
 * Set in AsyncStorage the first time this build reconciles the token stores.
 *
 * AsyncStorage is wiped by an uninstall; the iOS keychain is NOT. The absence
 * of this flag is therefore what tells the app "the sandbox is fresh" — see
 * `bootstrapSecureStorage()`.
 */
const SECURE_STORAGE_READY_KEY = 'auth_secure_storage_ready';

let secureStorageBootstrap: Promise<void> | null = null;

const bootstrapSecureStorage = (): Promise<void> => {
  if (secureStorageBootstrap) return secureStorageBootstrap;

  secureStorageBootstrap = (async () => {
    try {
      const [ready, ...legacy] = await AsyncStorage.multiGet([
        SECURE_STORAGE_READY_KEY,
        AUTH_STORAGE_KEYS.accessToken,
        AUTH_STORAGE_KEYS.refreshToken,
      ]);
      if (ready[1]) return;

      const found = legacy.filter(([, value]) => Boolean(value));

      if (found.length) {
        for (const [key, value] of found) {
          const secureKey = key as SecureTokenKey;
          // A token already in the keychain is the newer one (a login can have
          // landed before this ran) — never let the legacy copy overwrite it.
          if (await SecureStorage.getToken(secureKey)) continue;
          await SecureStorage.setToken(secureKey, String(value));
        }
        await AsyncStorage.multiRemove(found.map(([key]) => key));
        log('legacy tokens migrated to secure storage');
      } else {
        await SecureStorage.clearTokens();
      }

      await AsyncStorage.setItem(SECURE_STORAGE_READY_KEY, 'true');
    } catch {
      // Storage unavailable. Every caller treats an unreadable store as "no
      // session"; the flag stays unset so this is retried on the next start.
    }
  })();

  return secureStorageBootstrap;
};

const authStateHandlers = new Set<AuthStateHandler>();

const emitAuthState = (signedIn: boolean): void => {
  authStateHandlers.forEach(handler => {
    try {
      handler(signedIn);
    } catch (e) {
      const err = e as ErrorLike;
      log('auth state handler threw', err?.message ?? err);
    }
  });
};

/**
 * Subscribes to sign-in/sign-out. Fires on every save and every clear, which
 * means the same state can arrive twice (a token refresh re-emits `true`, and
 * `login` clears before it saves) — handlers must be idempotent.
 *
 * Does NOT fire for a session already on disk at app start: nothing was saved
 * or cleared. Ask `hasSession()` for that one.
 *
 * @returns the unsubscribe
 */
export const onAuthStateChange = (handler: AuthStateHandler): Unsubscribe => {
  authStateHandlers.add(handler);
  return () => {
    authStateHandlers.delete(handler);
  };
};

/**
 * Persists the `data` block of a login/refresh response.
 *
 * A refresh response often carries no new refresh token; as before, absent
 * values are skipped rather than written as empties, so the stored refresh
 * token survives an access-token rotation.
 */
export const saveSession = async (
  data: SessionPayload | null | undefined,
): Promise<void> => {
  if (!data) return;

  // Never write ahead of the bootstrap: on a fresh install its reinstall
  // branch clears the keychain, which would otherwise wipe what we just saved.
  await bootstrapSecureStorage();

  const expiresAt =
    data.expiresIn != null ? Date.now() + Number(data.expiresIn) * 1000 : null;

  const secureWrites: Promise<boolean>[] = [];
  if (data.accessToken) {
    secureWrites.push(
      SecureStorage.setToken(SECURE_TOKEN_KEYS.accessToken, data.accessToken),
    );
  }
  if (data.refreshToken) {
    secureWrites.push(
      SecureStorage.setToken(SECURE_TOKEN_KEYS.refreshToken, data.refreshToken),
    );
  }

  const entries = [
    [AUTH_STORAGE_KEYS.userId, data.userId],
    [AUTH_STORAGE_KEYS.organizationId, data.organizationId],
    [AUTH_STORAGE_KEYS.organizationType, data.organizationType],
    [AUTH_STORAGE_KEYS.expiresAt, expiresAt],
  ].filter(([, value]) => value != null && value !== '');

  const [secureResults] = await Promise.all([
    Promise.all(secureWrites),
    entries.length
      ? AsyncStorage.multiSet(
          entries.map(([k, v]): [string, string] => [String(k), String(v)]),
        ).catch(e => {
          const err = e as ErrorLike;
          log('session metadata not stored', err?.message);
        })
      : Promise.resolve(),
  ]);

  // Worth a line in the log — a failed keychain write means the next app start
  // has no session to restore. The values themselves are never logged.
  if (secureResults.some(ok => !ok)) {
    console.warn('[API] Secure token storage rejected the write.');
  }

  emitAuthState(true);
};

export const getAccessToken = async (): Promise<string | null> => {
  await bootstrapSecureStorage();
  return SecureStorage.getToken(SECURE_TOKEN_KEYS.accessToken);
};

export const getRefreshToken = async (): Promise<string | null> => {
  await bootstrapSecureStorage();
  return SecureStorage.getToken(SECURE_TOKEN_KEYS.refreshToken);
};

export const hasSession = async (): Promise<boolean> =>
  Boolean(await getAccessToken());

/**
 * Which kind of organization the signed-in account belongs to — `'CARRIER'`,
 * `'SHIPPER'`, … exactly as the login response spelled it.
 *
 * Stored by `saveSession()`; `null` until a login has landed, and again after
 * `clearSession()` wipes the metadata.
 */
export const getOrganizationType = async (): Promise<string | null> =>
  AsyncStorage.getItem(AUTH_STORAGE_KEYS.organizationType);

/**
 * The organization the signed-in account belongs to, as the login response
 * carried it. Every service that files something against the carrier — the
 * document blob service among them — is keyed on this id.
 *
 * Stored by `saveSession()`; `null` until a login has landed, and again after
 * `clearSession()` wipes the metadata.
 */
export const getPhoneNumber = async (): Promise<string | null> =>
  AsyncStorage.getItem(AUTH_STORAGE_KEYS.phoneNumber);

export const getOrganizationId = async (): Promise<string | null> =>
  AsyncStorage.getItem(AUTH_STORAGE_KEYS.organizationId);

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

/**
 * The cached endpoint answers go with the tokens. Without this a second
 * driver signing in on the same handset would be shown the first one's
 * figures out of the cache while their own calls were still in flight.
 */
export const clearSession = async (): Promise<void> => {
  invalidateResource();
  // Same ordering reason as `saveSession()`, and it marks the store reconciled
  // so a later read cannot re-run the bootstrap against an empty keychain.
  await bootstrapSecureStorage();
  await Promise.all([
    // Wipes both bearer credentials out of the keychain/keystore.
    SecureStorage.clearTokens(),
    // Metadata, plus the legacy plaintext token keys — an install that never
    // reached `bootstrapSecureStorage()` must not keep them across a logout.
    AsyncStorage.multiRemove(Object.values(AUTH_STORAGE_KEYS)).catch(e => {
      const err = e as ErrorLike;
      log('session metadata not cleared', err?.message);
    }),
  ]);

  emitAuthState(false);
};


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
  API_ENDPOINTS.auth.acceptInvitation,
  API_ENDPOINTS.auth.verifyPhone,
  API_ENDPOINTS.auth.verifyEmail,
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

  // `safe()` keeps fcmRegistrationToken in full (NEVER_CLIP_KEY), so the token
  // prints whole here. Only reaches the console in DEBUG builds.
  log('device register payload', safe(body));

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
  log('login payload', safe(payload));
  log('device info', deviceInfo);

  try {
    const {data: body} = await apiClient.post(API_ENDPOINTS.auth.login, payload);
    const data = body?.data;

    if (!data?.accessToken) {
      throw new Error(body?.message || 'Login failed. Please try again.');
    }
    await clearSession();
    // The number posted to /auth/login, kept only now that the login has
    // succeeded (and before `saveSession()` emits, so listeners read it).
    if (payload.phoneNumber) {
      await AsyncStorage.setItem(
        AUTH_STORAGE_KEYS.phoneNumber,
        payload.phoneNumber,
      ).catch(() => undefined);
    }
    await saveSession(data);
    log('session stored', {
      hasRefreshToken: Boolean(data.refreshToken),
      expiresIn: data.expiresIn,
    });
    // Printed in full (not through `safe`) so the token can be pasted into
    // Postman/curl while testing. Only ever reaches the console in DEBUG
    // builds — .env.production sets DEBUG=false.
    log('access token', data.accessToken);

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
      return serverMessage || 'Oops. Please try again.';
  }
};

/** What the driver is told when a one-time code is refused. */
const messageForOtpStatus = (
  status: number,
  body: ApiErrorBody | undefined,
): string => {
  const serverMessage = body?.message;
  switch (status) {
    case 400:
    case 401:
    case 404:
      return (
        serverMessage || 'That code is not correct. Please check it and try again.'
      );
    case 409:
      // Already verified. Not an error the driver can act on — the step is done.
      return serverMessage || 'This has already been verified.';
    case 410:
      return serverMessage || 'That code has expired. Please request a new one.';
    case 429:
      return (
        serverMessage ||
        'Too many attempts. Please wait a few minutes before trying again.'
      );
    default:
      return serverMessage || 'Could not verify that code. Please try again.';
  }
};

/**
 * Turns an axios failure on an unauthenticated endpoint into an Error worth
 * showing, using `messageFor` to phrase the server's status.
 */
const publicApiError = (
  err: AxiosError<ApiErrorBody> & ErrorLike,
  messageFor: (status: number, body: ApiErrorBody | undefined) => string,
): Error => {
  if (err.response) {
    const {status, data} = err.response;
    const error: AppApiError = new Error(messageFor(status, data));
    error.status = status;
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
 * Recognises "this invite is spent" in whatever the backend called it.
 *
 * Matching on prose is not something to do by choice, but the accept response
 * carries no code for this case — a used link and a malformed one differ only
 * in the sentence. A miss costs the driver the shortcut to the sign-in screen,
 * not correctness: the call still fails and still says why.
 */
const INVITATION_USED = /already\s+(been\s+)?(accepted|used|activated|registered)/i;

/** Turns an axios failure on a link endpoint into an Error worth showing. */
const linkError = (err: AxiosError<ApiErrorBody> & ErrorLike): Error =>
  publicApiError(err, messageForLinkStatus);

/** Turns an axios failure on an OTP endpoint into an Error worth showing. */
const otpError = (err: AxiosError<ApiErrorBody> & ErrorLike): Error =>
  publicApiError(err, messageForOtpStatus);

/**
 * Step 1 of the driver-invite flow: exchange the emailed token for a password.
 *
 * The token is checked only here — there is no separate "is this link still
 * good?" round trip before the form, so a dead link is reported once, against
 * a password the driver has already typed, rather than twice.
 *
 * This does NOT sign the driver in. The account still has to clear the phone
 * and email codes, so a session block in the response is ignored on purpose:
 * storing it would let an unverified account straight into the app.
 *
 * @param {{token: string, password: string}} params
 * @returns {Promise<{message: string, email?: string, phoneNumber?: string}>}
 *          the identifiers the OTP step verifies against, when the backend
 *          sends them
 */
export const acceptInvitation = async ({
  token,
  password,
}: AcceptInvitationParams): Promise<AcceptInvitationResult> => {
  // The request and the raw response are logged by the interceptors, token and
  // all — see REDACTED_KEY. Only the reconciled result is logged here, because
  // that is the one thing the interceptor cannot show.
  let body;
  try {
    ({data: body} = await apiClient.post(API_ENDPOINTS.auth.acceptInvitation, {
      token,
      password,
    }));
  } catch (e) {
    const failure = e as LinkFailure;
    const error = linkError(failure) as AppApiError;
    // 409 is this endpoint's "the link has already been used" — see
    // `messageForLinkStatus`. The message is checked too, for a backend that
    // says so under some other status.
    if (
      failure?.response?.status === 409 ||
      INVITATION_USED.test(error.message)
    ) {
      error.invitationUsed = true;
    }
    throw error;
  }

  // A dead or spent invite can also come back as a 2xx whose BODY carries the
  // failure — `{status: 'FAILED', message: 'Invitation has already been
  // accepted'}` — instead of as an HTTP error. Read as success it did real
  // damage: the driver was moved on to an OTP step for codes that were never
  // sent, under an alert headed "Password Set" that said the opposite of what
  // it was showing.
  if (String(body?.status ?? '').toUpperCase() === 'FAILED') {
    const error: AppApiError = new Error(
      body?.message ||
        'This link is no longer valid. Please ask your carrier to send a new invite.',
    );
    error.invitationUsed = INVITATION_USED.test(body?.message ?? '');
    log('invitation not accepted', {
      status: body?.status,
      message: error.message,
      invitationUsed: error.invitationUsed,
    });
    throw error;
  }

  const data = body?.data || {};
  // The identifiers may sit at the top of `data` or under a `user` block,
  // depending on which service answered — read both rather than assume.
  const user = data.user || {};

  const result = {
    message:
      body?.message ||
      'Password set. Verify your phone and email to finish activating your account.',
    email: data.email || user.email,
    phoneNumber: data.phoneNumber || user.phoneNumber,
  };
  // What the OTP step actually gets, after both response shapes are
  // reconciled. An empty email/phone here is why a verify block asks the
  // driver to type one, and is the first thing to check when it does.
  log('invitation accepted, OTP step will use', result);
  return result;
};

/**
 * Step 2a: confirm the code texted to the driver's phone.
 *
 * @param {{phoneNumber: string, otp: string}} params
 * @returns {Promise<{message: string}>}
 */
export const verifyPhoneOtp = async ({
  phoneNumber,
  otp,
}: VerifyPhoneOtpParams): Promise<VerifyOtpResult> => {
  // Spaces, brackets and dashes are how a phone keypad hands the number over;
  // the backend matches on digits. Built as a variable so the interceptor logs
  // exactly what goes on the wire — "the code was wrong" and "we sent a number
  // the backend does not recognise" look identical from the screen.
  const payload = {
    phoneNumber: (phoneNumber || '').replace(/[\s()-]/g, ''),
    otp,
  };

  try {
    const {data: body} = await apiClient.post(
      API_ENDPOINTS.auth.verifyPhone,
      payload,
    );
    return {message: body?.message || 'Phone number verified.'};
  } catch (e) {
    throw otpError(e as LinkFailure);
  }
};

/**
 * Step 2b: confirm the code emailed to the driver.
 *
 * @param {{email: string, otp: string}} params
 * @returns {Promise<{message: string}>}
 */
export const verifyEmailOtp = async ({
  email,
  otp,
}: VerifyEmailOtpParams): Promise<VerifyOtpResult> => {
  const payload = {email: (email || '').trim(), otp};

  try {
    const {data: body} = await apiClient.post(
      API_ENDPOINTS.auth.verifyEmail,
      payload,
    );
    return {message: body?.message || 'Email address verified.'};
  } catch (e) {
    throw otpError(e as LinkFailure);
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
