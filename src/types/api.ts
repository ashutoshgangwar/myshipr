/**
 * The transport-level shapes every API module shares.
 *
 * The gateway is inconsistent on purpose-built endpoints: some wrap the
 * payload in `{status, message, data}`, others answer flat, and the list
 * endpoints may additionally page it under `content`/`items`/`shipments`.
 * `config/driverApi.js` already unwraps all of those (`body?.data ?? body`) —
 * these types describe what it unwraps FROM, so the unwrapping can be typed
 * instead of returning `any`.
 *
 * Types only: this module emits no runtime code.
 */

import type {Nullable} from './common';

/** The envelope the gateway wraps most service responses in. */
export interface ApiEnvelope<T> {
  status?: number | string;
  message?: string;
  data?: T;
}

/**
 * What a driver-service endpoint can actually put on the wire: the payload
 * bare, or the same payload inside an envelope. Every reader in `driverApi`
 * collapses this with `body?.data ?? body`.
 */
export type MaybeEnveloped<T> = T | ApiEnvelope<T>;

/**
 * A list payload as the gateway may page it. The three keys are alternatives,
 * not a union of contents — `getShipmentList()` tries them in this order and
 * falls back to `[]`.
 */
export interface PagedPayload<T> {
  content?: T[];
  items?: T[];
  shipments?: T[];
}

/** A list endpoint's body: a bare array, a paged object, or either enveloped. */
export type ListResponse<T> = MaybeEnveloped<T[] | PagedPayload<T>>;

/**
 * An error body as the backend sends it on a non-2xx. Only `message` is
 * relied on — it is what the error modals display when present.
 */
export interface ApiErrorBody {
  message?: string;
  status?: number | string;
  error?: string;
}

/**
 * An `Error` carrying the extra fields `api.js` attaches before throwing.
 *
 * These are optional because they are set per failure mode: `status` on a
 * server answer, `rateLimited`/`retryAfterSeconds` only on a 429, and
 * `sessionInvalid` only when the session itself is unrecoverable (as opposed
 * to the network merely failing — the distinction the 401 handler turns on).
 *
 * An interface extending `Error` rather than a class: the code creates these
 * with `new Error()` and assigns the fields, and this describes that value
 * without changing how it is built.
 */
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
   * Set by the driver-invite link flow: the token can never work again, so the
   * screen swaps the password form for a dead end instead of offering Retry.
   */
  linkDead?: boolean;
}

/**
 * What `verifyPasswordToken()` resolves to — the account behind an emailed
 * invite link, so the screen can greet the driver by name and prove the link
 * is theirs before they type a password.
 */
export interface PasswordTokenInfo {
  valid?: boolean;
  purpose?: string;
  email?: string;
  phoneNumber?: string;
  fullName?: string;
  expiresAt?: string;
}

/** What `setPasswordWithToken()` resolves to. */
export interface SetPasswordResult {
  /** Present when the backend signed the driver in as part of setting it. */
  session?: SessionPayloadLike;
  message: string;
}

/** The session block, kept structural here to avoid a circular type import. */
export interface SessionPayloadLike {
  accessToken?: string;
  refreshToken?: string;
  [key: string]: unknown;
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
