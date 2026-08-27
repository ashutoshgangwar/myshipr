/**
 * Earnings, the monthly stat cards, fuel and hours-of-service.
 *
 * Transcribed from the endpoint documentation in `config/driverApi.js`.
 * Note the deliberate inconsistency preserved below: the daily figure is
 * `miles`, `earnings` and — singular — `trip`, which is how the backend sends
 * them and how the sparklines read them.
 *
 * Types only: this module emits no runtime code.
 */

import type {DateString, IsoDateTimeString, Nullable} from './common';
import type {ShipmentStop} from './shipment';

/**
 * The `period` query param the Earnings screen's dropdown maps onto.
 * `driverApi` drops any value outside this set rather than passing it on, so
 * a bad value asks for everything instead of 400-ing the screen.
 */
export type EarningsPeriod = 'ALL' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

/** Whether a shipment's payout has actually been paid out. */
export type PaymentStatus = string;

/** One earning row in the Earnings screen's transactions table. */
export interface EarningsShipment {
  shipmentId?: string;
  tripId?: string;
  awb?: string;
  /** Some rows spell the load type `type` rather than `shipmentType`. */
  type?: string;
  totalMiles?: number;
  shipmentType?: string;
  distanceMiles?: number;
  date?: DateString;
  payout?: number;
  paymentStatus?: PaymentStatus;
  stops?: ShipmentStop[];
}

/**
 * `GET /drivers/earnings?period=…`
 * The screen's header figure plus the table beneath it.
 */
export interface DriverEarnings {
  period?: EarningsPeriod;
  grossEarnings?: number;
  shipments?: EarningsShipment[];
}

export interface DriverEarningsParams {
  period?: EarningsPeriod;
}

// ── Monthly stat cards ───────────────────────────────────────────────────
// Three sibling endpoints with the same shape: a total plus a sparse daily
// list covering ONLY the days that carried activity, so it is shorter than the
// month and may hold a single entry.

/** One day of the monthly miles breakdown. */
// Declared as a `type` rather than an `interface` on purpose: only a type
// alias gets an implicit index signature, which is what lets it be passed
// to `toChart`/`toRange` (they read the daily figure by a runtime key).
export type DailyMiles = {
  miles?: number;
  date?: DateString;
};

/** `GET /drivers/shipments/get-monthly-miles` */
export interface MonthlyMiles {
  totalMiles?: number;
  dailyMiles?: DailyMiles[];
}

/** One day of the monthly earnings breakdown. */
// Declared as a `type` rather than an `interface` on purpose: only a type
// alias gets an implicit index signature, which is what lets it be passed
// to `toChart`/`toRange` (they read the daily figure by a runtime key).
export type DailyEarnings = {
  earnings?: number;
  date?: DateString;
};

/** `GET /drivers/shipments/get-monthly-earnings` */
export interface MonthlyEarnings {
  totalEarnings?: number;
  dailyEarnings?: DailyEarnings[];
}

/** One day of the monthly trips breakdown — note `trip`, singular. */
// Declared as a `type` rather than an `interface` on purpose: only a type
// alias gets an implicit index signature, which is what lets it be passed
// to `toChart`/`toRange` (they read the daily figure by a runtime key).
export type DailyTrips = {
  trip?: number;
  date?: DateString;
};

/** `GET /drivers/shipments/get-monthly-trips` */
export interface MonthlyTrips {
  totalTrips?: number;
  dailyTrips?: DailyTrips[];
}

// ── Fuel ─────────────────────────────────────────────────────────────────

/** `GET /drivers/fuel/reward` — the Home "Your Points Balance" figure. */
export interface FuelReward {
  driverId?: string;
  totalRewardPoints?: number;
}

/** The pump-price payload, before `driverApi` stamps `available` onto it. */
export interface FuelPricePayload {
  stateCode?: string;
  stateName?: string;
  addressLabel?: string;
  pricePerGallon?: Nullable<number>;
  fscPerMile?: Nullable<number>;
  fetchedAt?: IsoDateTimeString;
  stale?: boolean;
  source?: string;
  /** The backend sometimes explains a partial answer even on the happy path. */
  message?: string;
}

/**
 * What `getFuelPrice()` actually returns.
 *
 * A union rather than one object with optional fields, because the two cases
 * are genuinely different outcomes: a price, or the backend's "US states only"
 * refusal — which is a fact about where the truck is parked, not an error, so
 * it is returned rather than thrown. Narrowing on `available` gives the badge
 * a `message` in the unavailable case without optional-chaining a price that
 * cannot be there.
 */
export type FuelPriceResult =
  | (FuelPricePayload & {available: true})
  | {
      available: false;
      message: Nullable<string>;
      // Optional because the "no location fix" path in `services/fuelPrice`
      // builds this shape with the message alone, while `driverApi`'s 400
      // handler spells both out as null.
      pricePerGallon?: null;
      fscPerMile?: null;
    };

/** Both coordinates are required by the endpoint. */
export interface FuelPriceParams {
  latitude: number;
  longitude: number;
}

// ── Hours of service ─────────────────────────────────────────────────────

/** The four duty states the HOS card reports. */
export type DutyStatus =
  | 'OFF_DUTY'
  | 'ON_DUTY'
  | 'DRIVING'
  | 'SLEEPER_BERTH';

/** `GET /drivers/hos/card` — the Home "Hours of Service" panel. */
export interface HosCard {
  dutyStatus?: DutyStatus;
  drivenMinutes?: number;
  totalDrivingMinutes?: number;
  remainingDrivingMinutes?: number;
  /** When the 34-hour reset becomes available. */
  resetAvailableAt?: IsoDateTimeString;
}
