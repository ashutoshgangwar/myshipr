
import type {Nullable} from './common';

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

export type AuthStateHandler = (signedIn: boolean) => void;

/** `onSessionExpired()` hands back its own unsubscribe. */
export type Unsubscribe = () => void;

export type DriverRole = 'fleet_driver' | 'single_driver';

export interface AuthUser {
  userId: Nullable<string>;
  organizationId: Nullable<string>;
  organizationType: Nullable<string>;
}

export interface AcceptInvitationParams {
  token: string;
  password: string;
}

/** Body of `POST /auth/verify/phone`. */
export interface VerifyPhoneOtpParams {
  phoneNumber: string;
  otp: string;
}

/** Body of `POST /auth/verify/email`. */
export interface VerifyEmailOtpParams {
  email: string;
  otp: string;
}
