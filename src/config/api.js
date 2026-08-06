import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_BASE_URL, API_TIMEOUT, DEBUG} from '@env';

// --- Config --------------------------------------------------------------

const BASE_URL = (API_BASE_URL || '').replace(/\/+$/, '');

const API_PREFIX = 'api/v1';

export const REQUEST_TIMEOUT_MS = Number(API_TIMEOUT) || 30000;

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
  },
};

// The single debug switch for API traffic. Set DEBUG=false in .env.production.
const DEBUG_ENABLED = String(DEBUG).toLowerCase() === 'true';

// Masks passwords/tokens so credentials can never reach a Metro log. Walks
// nested objects — login responses carry the tokens under `data`, so a
// top-level-only pass would print them in full.
const safe = value => {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(safe);
  return Object.fromEntries(
    Object.entries(value).map(([key, val]) => [
      key,
      /pass|token|secret|authorization/i.test(key) ? '***' : safe(val),
    ]),
  );
};

const log = (...args) => {
  if (DEBUG_ENABLED) console.log('[API]', ...args);
};

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
export const saveSession = async data => {
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
    await AsyncStorage.multiSet(entries.map(([k, v]) => [k, String(v)]));
  }
};

export const getAccessToken = () =>
  AsyncStorage.getItem(AUTH_STORAGE_KEYS.accessToken);

export const getRefreshToken = () =>
  AsyncStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);

/** True when an access token exists — it may still be expired. */
export const hasSession = async () => Boolean(await getAccessToken());

/** Epoch-ms the stored access token stops being valid, or null when unknown. */
export const getSessionExpiresAt = async () => {
  const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.expiresAt);
  const value = Number(raw);
  return raw && Number.isFinite(value) ? value : null;
};

// Treat the token as dead slightly early, so a request never leaves with one
// that expires while it is still in flight.
const EXPIRY_SKEW_MS = 60 * 1000;

/**
 * True when the stored access token is past (or nearly past) its expiry.
 * With no recorded expiry we say "not expired" and let a 401 decide instead.
 */
export const isAccessTokenExpired = async () => {
  const expiresAt = await getSessionExpiresAt();
  if (expiresAt == null) return false;
  return Date.now() >= expiresAt - EXPIRY_SKEW_MS;
};

export const clearSession = () =>
  AsyncStorage.multiRemove(Object.values(AUTH_STORAGE_KEYS));

// --- Axios client --------------------------------------------------------

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
const AUTH_FREE_PATHS = [API_ENDPOINTS.auth.login, API_ENDPOINTS.auth.refresh];
const isAuthFree = url => AUTH_FREE_PATHS.some(path => (url || '').includes(path));

// Attach the bearer token to every request when one is stored.
apiClient.interceptors.request.use(async config => {
  if (!isAuthFree(config.url)) {
    try {
      // Access token already expired: trade the refresh token for a new one
      // before the request goes out, instead of paying for a 401 round-trip.
      // If that fails, fall through and send whatever is stored — the 401
      // handler below is the backstop.
      if (await isAccessTokenExpired()) {
        await refreshAccessToken().catch(() => {});
      }
      const token = await getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (_) {
      // No stored token / storage unavailable — send it unauthenticated.
    }
  }

  log(`→ ${String(config.method).toUpperCase()} ${config.url}`, safe(config.data));
  return config;
});

// Single in-flight refresh shared by every request that 401s at the same time.
let refreshPromise = null;

// Marks "the session itself is unusable" (as opposed to "the network failed"),
// so callers know whether the stored tokens are worth keeping.
const sessionExpiredError = () => {
  const error = new Error('Session expired. Please log in again.');
  error.sessionInvalid = true;
  return error;
};

/** Exchanges the refresh token for a new access token. @returns {Promise<string>} */
export const refreshAccessToken = () => {
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

// Callbacks fired when the session can no longer be recovered, so the app can
// send the user back to the login screen.
const sessionExpiredHandlers = new Set();

/** @param {() => void} handler @returns {() => void} unsubscribe */
export const onSessionExpired = handler => {
  sessionExpiredHandlers.add(handler);
  return () => sessionExpiredHandlers.delete(handler);
};

/**
 * Decides at app start whether the user goes straight to the home screen.
 *
 * - valid access token            → authenticated, no network call
 * - expired token + refresh token → refreshes first, then authenticated
 * - refresh rejected by server    → session cleared, back to login
 * - refresh failed offline        → back to login, tokens KEPT so the next
 *                                   launch with a connection still works
 *
 * @returns {Promise<{authenticated: boolean, refreshed: boolean,
 *                    reason: 'valid'|'refreshed'|'no-session'|'expired'|'offline'}>}
 */
export const restoreSession = async () => {
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
  } catch (err) {
    // The server answered — the refresh token really is dead, so drop it.
    if (err?.response || err?.sessionInvalid) {
      await clearSession();
      return {authenticated: false, refreshed: false, reason: 'expired'};
    }
    // No answer at all (offline / timeout): keep the tokens for the next try.
    log('session restore failed offline');
    return {authenticated: false, refreshed: false, reason: 'offline'};
  }
};

// On 401, refresh once and replay the original request.
apiClient.interceptors.response.use(
  response => {
    log(`← ${response.status} ${response.config.url}`, safe(response.data));
    return response;
  },
  async error => {
    const {config, response} = error;

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
        config.headers = {...config.headers, Authorization: `Bearer ${token}`};
        return apiClient(config);
      } catch (refreshError) {
        await clearSession();
        sessionExpiredHandlers.forEach(handler => handler());
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

/**
 * Seconds left on a rate-limit window. `Retry-After` is either a delay in
 * seconds or an HTTP date, and plenty of gateways send neither — null means
 * "rate limited, duration unknown".
 */
const parseRetryAfter = headers => {
  const raw = headers?.['retry-after'] ?? headers?.['Retry-After'];
  if (raw == null || raw === '') return null;

  const seconds = Number(raw);
  if (Number.isFinite(seconds)) return Math.max(0, Math.round(seconds));

  const retryAt = Date.parse(raw);
  if (!Number.isFinite(retryAt)) return null;
  return Math.max(0, Math.round((retryAt - Date.now()) / 1000));
};

/** "45 seconds" / "3 minutes" — rounded up so we never tell the user to retry early. */
const formatWait = seconds => {
  if (!seconds) return '';
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
};

// Turns a backend status code into something worth showing the user.
const messageForStatus = (status, body, retryAfterSeconds) => {
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
      // A concrete wait beats the server's wording — it tells the user when
      // trying again is actually worth it.
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
 * The screen only renders the result — it holds no rules of its own.
 *
 * @param {string} identifier email address or phone number
 * @param {string} password
 * @returns {{ok: true} | {ok: false, title: string, message: string}}
 */
export const validateLogin = (identifier, password) => {
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
 * Logs in with a phone number OR an email address, plus the password, and
 * stores the returned session.
 *
 * POST /api/v1/auth/login
 * → { status, message, data: { userId, accessToken, refreshToken, expiresIn,
 *                              organizationId, organizationType } }
 *
 * @param {{identifier: string, password: string}} params
 * @returns {Promise<object>} the `data` payload, already saved to storage
 * @throws {Error} with a message ready to show in the error modal
 */
export const login = async ({identifier, password}) => {
  const entered = (identifier || '').trim();
  // Whichever field the user filled in decides the payload key the API gets.
  const payload = entered.includes('@')
    ? {email: entered, password}
    : {phoneNumber: entered.replace(/[\s()-]/g, ''), password};

  try {
    const {data: body} = await apiClient.post(API_ENDPOINTS.auth.login, payload);
    const data = body?.data;

    // No token means no session, whatever the HTTP status said — the caller
    // must treat this as a failed login and stay on the screen.
    if (!data?.accessToken) {
      throw new Error(body?.message || 'Login failed. Please try again.');
    }

    // Drop anything left over from a previous account before writing the new
    // session, so a stale expiresAt/refreshToken can never survive a re-login.
    await clearSession();
    await saveSession(data);
    log('session stored', {
      hasRefreshToken: Boolean(data.refreshToken),
      expiresIn: data.expiresIn,
    });
    return data;
  } catch (err) {
    if (err.response) {
      // Server answered with a non-2xx status.
      const {status, data, headers} = err.response;
      const retryAfterSeconds =
        status === 429 ? parseRetryAfter(headers) : null;

      const error = new Error(messageForStatus(status, data, retryAfterSeconds));
      error.status = status;
      if (status === 429) {
        // Flagged so the screen can drop the Retry action — retrying inside
        // the window only spends another attempt on the same 429.
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

/**
 * Clears the local session. The server call is best-effort — the user is
 * logged out on device either way.
 */
export const logout = async () => {
  try {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      await apiClient.post(API_ENDPOINTS.auth.logout, {refreshToken});
    }
  } catch (_) {
    // Ignore: local sign-out must always succeed.
  } finally {
    await clearSession();
  }
};

export {BASE_URL, API_PREFIX};

export default apiClient;
