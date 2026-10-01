/**
 * The driver's own record — what `GET /drivers/profile` and
 * `GET /drivers/bank` send. Both are read with the access token alone; neither
 * takes a parameter.
 *
 * Every field is optional: the back office fills this record during onboarding
 * and a driver part-way through it has most of these still unset, so the
 * screen must render a profile that carries only a name.
 */

import type {DateString, Nullable} from './common';

/** ← GET /drivers/profile */
export interface DriverProfile {
  fullName?: Nullable<string>;
  /** Absolute URL of the driver's photo, or null before one is uploaded. */
  driverImage?: Nullable<string>;
  driverType?: Nullable<string>;
  phoneNumber?: Nullable<string>;
  email?: Nullable<string>;
  cdlNumber?: Nullable<string>;
  cdlState?: Nullable<string>;
  cdlClass?: Nullable<string>;
  cdlExpiry?: Nullable<DateString>;
  dateOfBirth?: Nullable<DateString>;
  hireDate?: Nullable<DateString>;
  yearsOfExperience?: Nullable<number>;
  address?: Nullable<string>;
  city?: Nullable<string>;
  state?: Nullable<string>;
  zipCode?: Nullable<string>;
  insuredUnderCompanyPolicy?: Nullable<boolean>;
}

/**
 * ← GET /drivers/bank
 *
 * The account number itself never leaves the back office — only its last four
 * digits do, which is all the screen shows.
 */
export interface DriverBank {
  bankName?: Nullable<string>;
  bankLast4?: Nullable<string | number>;
  accountHolderName?: Nullable<string>;
}
