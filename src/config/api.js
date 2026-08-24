import axios from 'axios';
import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import {API_BASE_URL, API_TIMEOUT, DEBUG} from '@env';
import {getFcmToken} from '../services/FirebaseMessagingService';

// --- Config --------------------------------------------------------------

const BASE_URL = (API_BASE_URL || '').replace(/\/+$/, '');

const API_PREFIX = 'api/v1';

export const REQUEST_TIMEOUT_MS = Number(API_TIMEOUT) || 30000;

/**
 * The gateway fronts each backend service under its own prefix and only then
 * the shared `/api/v1` path — the driver service answers at
 * `…/drivers/api/v1/drivers/…`. Auth is the exception: it sits at the root,
 * which is what `apiClient`'s baseURL is set to. An absolute URL built here
 * overrides that baseURL while keeping every interceptor (bearer token, 401
 * refresh, logging) in play.
 */
export const serviceUrl = (service, path) =>
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

/** Logs under the shared DEBUG switch. `tag` names the calling module. */
export const createApiLogger = tag => (...args) => {
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
const AUTH_FREE_PATHS = [
  API_ENDPOINTS.auth.login,
  API_ENDPOINTS.auth.refresh,
  // A driver setting their first password has no session at all. Sending a
  // stale bearer token here — or letting a 401 kick off a refresh — would turn
  // "this link expired" into a spurious sign-out of whoever used the phone last.
  API_ENDPOINTS.auth.verifyPasswordToken,
  API_ENDPOINTS.auth.setPassword,
  API_ENDPOINTS.auth.forgotPassword,
];
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
 * - refresh failed offline        → STILL authenticated: the tokens are kept
 *                                   and the refresh is retried by the request
 *                                   interceptor once there is a connection
 *
 * Only the server gets to end a session. A driver who opens the app in a dead
 * zone — which is most of a long haul — stays signed in.
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
    // No answer at all (offline / timeout). The refresh token was never
    // judged, so it is probably still good: keep the session and let the
    // request interceptor retry the refresh when the first call goes out.
    log('session restore failed offline — staying signed in');
    return {authenticated: true, refreshed: false, reason: 'offline'};
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
        // A refresh the server REJECTED means the session is genuinely dead —
        // clear it and send the user back to login. A refresh that never
        // reached the server (offline, timeout) says nothing about the token,
        // so the request simply fails and the tokens stay put for the retry.
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
 * Registers this device for push notifications against the logged-in user.
 *
 * POST /api/v1/auth/devices/register
 * → { fcmRegistrationToken, platform: 'ANDROID' | 'IOS', deviceName,
 *     firebaseInstallationId? }
 *
 * The endpoint is authenticated: pass the `accessToken` the login response just
 * returned and it goes out as `Authorization: Bearer <token>`. Without it the
 * request interceptor still attaches whatever token is in storage, so an
 * already-logged-in caller can omit it.
 *
 * `firebaseInstallationId` is optional and is only sent when a caller supplies
 * one; reading it would need the @react-native-firebase/installations package,
 * which is not part of this app.
 *
 * @param {{fcmRegistrationToken?: string, firebaseInstallationId?: string,
 *          accessToken?: string}} [params]
 * @returns {Promise<object|null>} the response body, or null when there is no
 *   FCM token to register (permission denied / token minting failed)
 */
export const registerDevice = async ({
  fcmRegistrationToken,
  firebaseInstallationId,
  accessToken,
} = {}) => {
  // The caller usually already has the token; fall back to asking FCM for it.
  const token = fcmRegistrationToken || (await getFcmToken());
  if (!token) {
    log('device register skipped — no FCM token');
    return null;
  }

  // getDeviceName() is the user-set name ("Ashutosh's iPhone", "Pixel 8"); it
  // is the only async call here and a native failure must not break the flow,
  // so we fall back to the model name.
  const deviceName =
    (await DeviceInfo.getDeviceName().catch(() => null)) || DeviceInfo.getModel();

  const body = {
    fcmRegistrationToken: token,
    platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
    deviceName,
  };
  if (firebaseInstallationId) {
    body.firebaseInstallationId = firebaseInstallationId;
  }

  // Explicit header when the caller hands us the token straight from the login
  // response — it removes any dependency on the write to storage having landed.
  // Otherwise the request interceptor fills in the stored one.
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

  // Registers this device for push at login time. getFcmToken() never throws —
  // it returns null when permission is denied or the token can't be minted, and
  // a missing token must not block the login, so the key is simply omitted.
  const fcmRegistrationToken = await getFcmToken();
  if (fcmRegistrationToken) {
    payload.fcmRegistrationToken = fcmRegistrationToken;
  }

  // getDeviceName() is the only async one (it reads the user-set name, e.g.
  // "Ashutosh's iPhone") and needs a permission-free native call, so a failure
  // must not take the login down with it.
  const deviceName = await DeviceInfo.getDeviceName().catch(() => null);
  const deviceInfo = {
    deviceName,
    devicePlatform: Platform.OS, // 'android' | 'ios'
    deviceOsVersion: DeviceInfo.getSystemVersion(),
    deviceModel: DeviceInfo.getModel(),
    isTablet: DeviceInfo.isTablet(),
  };

  // safe() masks every *token key, so the FCM token is put back in full — it is
  // a device address, not a credential, and seeing it is the point of this log.
  // The password stays masked.
  log('login payload', {...safe(payload), fcmRegistrationToken});
  log('device info', deviceInfo);

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
    // DEV ONLY — the raw bearer token, printed so it can be copied into curl
    // while endpoints are being wired up. safe() is deliberately bypassed
    // here; drop this line (or keep DEBUG=false outside development) before
    // anything ships, since it puts a live credential in the Metro log.
    log('access token (dev only)\n' + data.accessToken);

    // Push registration is a side effect of logging in, not part of it: it runs
    // after the session is stored (the endpoint needs the bearer token) and is
    // deliberately not awaited, so a slow or failing /devices/register can
    // neither delay the user nor turn a successful login into an error.
    registerDevice({
      fcmRegistrationToken,
      accessToken: data.accessToken,
    }).catch(err =>
      log('device register failed', err?.response?.status || err?.message),
    );

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

// --- Password link flow (driver activation) ------------------------------

// One digit and one special character, at least 8 long. Kept here rather than
// in the screen so the invite flow and the OTP flow cannot drift apart.
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_HAS_DIGIT = /[0-9]/;
const PASSWORD_HAS_SYMBOL = /[^A-Za-z0-9]/;

/**
 * Checks a new password the way the user reads the two fields.
 * The screen only renders the result — it holds no rules of its own.
 *
 * @param {string} password
 * @param {string} confirmPassword
 * @returns {{ok: true} | {ok: false, title: string, message: string}}
 */
export const validateNewPassword = (password, confirmPassword) => {
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

/**
 * Wording for a rejected invite/reset link. The three failures the driver can
 * actually do something about — expired, already used, never valid — must read
 * differently, because the fix differs: ask for a new link, just sign in, or
 * contact the carrier.
 */
const messageForLinkStatus = (status, body) => {
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
const linkError = err => {
  if (err.response) {
    const {status, data} = err.response;
    const error = new Error(messageForLinkStatus(status, data));
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
 * Trades the emailed token for the account it belongs to, before showing the
 * password form. Doing this up front means an expired link is caught while the
 * driver still has an empty form, not after they typed a password twice — and
 * it lets the screen greet them by name so they can see the link is theirs.
 *
 * POST /api/v1/auth/password/token/verify  → { token }
 * ← { status, message, data: { valid, purpose: 'ACTIVATION',
 *                              email, phoneNumber, fullName, expiresAt } }
 *
 * @param {string} token
 * @returns {Promise<{purpose: string, email?: string, phoneNumber?: string,
 *                    fullName?: string, expiresAt?: string}>}
 * @throws {Error} `.linkDead` is true when a new link is the only way forward
 */
export const verifyPasswordToken = async token => {
  if (!token) {
    const error = new Error('This link is not valid.');
    error.linkDead = true;
    throw error;
  }

  try {
    const {data: body} = await apiClient.post(
      API_ENDPOINTS.auth.verifyPasswordToken,
      {token},
    );
    const data = body?.data || {};

    // A 200 that says `valid: false` is still a dead link — some gateways
    // answer this way rather than with a 4xx.
    if (data.valid === false) {
      const error = new Error(
        body?.message ||
          'This link is not valid or has expired. Please ask your carrier to send a new invite.',
      );
      error.linkDead = true;
      throw error;
    }

    log('password token verified', {purpose: data.purpose, email: data.email});
    return data;
  } catch (err) {
    if (err.linkDead) throw err;
    throw linkError(err);
  }
};

/**
 * Sets the password the token authorises and, when the backend answers with a
 * session, signs the driver straight in — coming back to a login screen to
 * retype credentials they just chose is the one thing this flow exists to
 * avoid. A backend that deliberately does not auto-login simply omits the
 * tokens, and the caller sends the driver to the login screen instead.
 *
 * POST /api/v1/auth/password/set  → { token, newPassword }
 * ← { status, message, data: { userId, accessToken, refreshToken, expiresIn,
 *                              organizationId, organizationType } }
 *
 * @param {{token: string, newPassword: string}} params
 * @returns {Promise<{session: object|null, message: string}>}
 */
export const setPasswordWithToken = async ({token, newPassword}) => {
  try {
    const {data: body} = await apiClient.post(API_ENDPOINTS.auth.setPassword, {
      token,
      newPassword,
    });

    const session = body?.data?.accessToken ? body.data : null;

    if (session) {
      // Drop anything left over from a previous account on this device before
      // writing the new session — the same rule login follows.
      await clearSession();
      await saveSession(session);
      log('session stored from password setup');

      // Push registration is a side effect, not part of setting the password:
      // it must not delay the driver or turn success into an error.
      registerDevice({accessToken: session.accessToken}).catch(err =>
        log('device register failed', err?.response?.status || err?.message),
      );
    }

    return {session, message: body?.message || 'Password set successfully.'};
  } catch (err) {
    throw linkError(err);
  }
};

/**
 * Asks the backend to email a fresh reset link.
 *
 * POST /api/v1/auth/password/forgot  → { email } or { phoneNumber }
 *
 * Resolves even when the address is unknown: the backend answers 202 either
 * way so the screen cannot be used to find out which drivers exist.
 *
 * @param {string} identifier email address or phone number
 * @returns {Promise<{message: string}>}
 */
export const requestPasswordReset = async identifier => {
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
  } catch (err) {
    throw linkError(err);
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
