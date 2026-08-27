/**
 * Session, credentials and the driver's own identity.
 *
 * Mirrors what `config/api.js` stores and hands back — nothing here is
 * aspirational, every field is one the login/refresh response actually
 * carries or that `AUTH_STORAGE_KEYS` persists.
 *
 * Types only: this module emits no runtime code.
 */

import type {Nullable} from './common';

/**
 * The `data` block of a login or refresh response, and the exact set of values
 * `saveSession()` persists.
 *
 * Only `accessToken` is required: it is the one field `login()` treats as
 * mandatory ("no token means no session, whatever the HTTP status said"), and
 * `saveSession()` filters out whatever else is missing rather than storing
 * empties.
 */
export interface SessionPayload {
  accessToken: string;
  refreshToken?: string;
  userId?: string;
  organizationId?: string;
  organizationType?: string;
  /** Lifetime in SECONDS; `saveSession()` turns it into an epoch-ms expiry. */
  expiresIn?: number;
}

/** The full login response, before `data` is pulled out of it. */
export interface LoginResponseBody {
  status?: number | string;
  message?: string;
  data?: SessionPayload;
}

/** What the login screen collects: an email OR a phone number, plus a password. */
export interface LoginCredentials {
  /** Email address or phone number — `login()` picks the payload key from it. */
  identifier: string;
  password: string;
}

/**
 * The request body `login()` builds. The identifier becomes exactly one of
 * `email` / `phoneNumber`, never both, which is why they are separate optional
 * keys rather than a single field.
 */
export interface LoginRequestBody {
  email?: string;
  phoneNumber?: string;
  password: string;
  fcmRegistrationToken?: string;
}

/** The device facts logged alongside a login attempt. */
export interface LoginDeviceInfo {
  deviceName: Nullable<string>;
  /** RN's `Platform.OS` — lower-case, unlike the register endpoint's value. */
  devicePlatform: string;
  deviceOsVersion: string;
  deviceModel: string;
  isTablet: boolean;
}

/**
 * Why `restoreSession()` reached its verdict.
 *
 * `'offline'` is the load-bearing one: the driver stays authenticated because
 * the refresh was never judged by the server, only unanswered.
 */
export type SessionRestoreReason =
  | 'valid'
  | 'refreshed'
  | 'no-session'
  | 'expired'
  | 'offline';

/** What the splash screen reads to decide where to send the driver. */
export interface SessionRestoreResult {
  authenticated: boolean;
  refreshed: boolean;
  reason: SessionRestoreReason;
}

/** Fired when the session can no longer be recovered. */
export type SessionExpiredHandler = () => void;

/** `onSessionExpired()` hands back its own unsubscribe. */
export type Unsubscribe = () => void;

/**
 * Which kind of driver is signed in — the switch behind the bottom-tab set and
 * the Home dropdown. The values are the strings in `constants/DriverRoles.js`.
 */
export type DriverRole = 'fleet_driver' | 'single_driver';

/**
 * The signed-in driver as the app knows them.
 *
 * Deliberately thin: the app reads identity from the bearer token on every
 * driver endpoint, so only the ids it actually persists are modelled here.
 * Grow this when a profile endpoint is wired up — do not guess fields ahead of
 * one existing.
 */
export interface AuthUser {
  userId: Nullable<string>;
  organizationId: Nullable<string>;
  organizationType: Nullable<string>;
}

/** Body of `POST /auth/password/set` — the driver-invite activation flow. */
export interface SetPasswordParams {
  token: string;
  newPassword: string;
}
