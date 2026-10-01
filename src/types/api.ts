import type {Nullable} from './common';

/** The envelope the gateway wraps most service responses in. */
export interface ApiEnvelope<T> {
  status?: number | string;
  message?: string;
  data?: T;
}

export type MaybeEnveloped<T> = T | ApiEnvelope<T>;

export interface PagedPayload<T> {
  content?: T[];
  items?: T[];
  shipments?: T[];
}

/** A list endpoint's body: a bare array, a paged object, or either enveloped. */
export type ListResponse<T> = MaybeEnveloped<T[] | PagedPayload<T>>;

export interface ApiErrorBody {
  message?: string;
  status?: number | string;
  error?: string;
}

export interface AppApiError extends Error {
  /** HTTP status, when the server actually answered. */
  status?: number;
  /** Set on a 429 so the screen can drop its Retry action. */
  rateLimited?: boolean;
  /** Seconds left on the rate-limit window; `null` when unknown. */
  retryAfterSeconds?: Nullable<number>;
  /** The stored tokens are dead — sign the user out rather than retrying. */
  sessionInvalid?: boolean;
  /**
   * The invite link has already been used, so the account exists and has a
   * password. Retrying can never succeed — the screen sends the driver to
   * sign in instead of leaving them on a form that will keep failing.
   */
  invitationUsed?: boolean;
}

/**
 * What `acceptInvitation()` resolves to.
 *
 * Accepting sets the password but does NOT sign the driver in: the account is
 * still unverified at that point, so any session block the backend may send is
 * deliberately ignored. The two identifiers are what the OTP step needs — the
 * verify endpoints are keyed on the phone number and the email address, not on
 * the invite token — so the screen reads them from here rather than making the
 * driver retype what the invite already knows. Both are optional: a backend
 * that answers with a bare message leaves the OTP step to ask for them.
 */
export interface AcceptInvitationResult {
  message: string;
  email?: string;
  phoneNumber?: string;
}

/** What `verifyPhoneOtp()` and `verifyEmailOtp()` resolve to. */
export interface VerifyOtpResult {
  message: string;
}

/** What `requestPasswordReset()` resolves to. */
export interface PasswordResetResult {
  message: string;
}

/**
 * Axios tags a request it has already replayed after a token refresh, so the
 * 401 handler retries exactly once and a genuinely-rejected token cannot loop.
 * Declared here because it is a property this app adds, not one axios ships.
 */
export interface RetriableRequestConfig {
  _retriedAfterRefresh?: boolean;
}

/** The `platform` value `/auth/devices/register` expects. */
export type DevicePlatform = 'IOS' | 'ANDROID';

/** Body of `POST /auth/devices/register`. */
export interface RegisterDeviceBody {
  fcmRegistrationToken: string;
  platform: DevicePlatform;
  deviceName: string;
  firebaseInstallationId?: string;
}

/** Arguments accepted by `registerDevice()`; every one is optional. */
export interface RegisterDeviceParams {
  /** `getFcmToken()` resolves to `null` when permission is denied. */
  fcmRegistrationToken?: string | null;
  firebaseInstallationId?: string;
  /**
   * Passed straight from a fresh login response, so the call does not depend
   * on the write to AsyncStorage having landed yet.
   */
  accessToken?: string;
}
