/**
 * The driver's own record — `GET /drivers/profile` and `GET /drivers/bank` —
 * and the mappers that turn the two payloads into the Profile screen: the
 * identity card, the editable contact pair, the read-only onboarding grids and
 * the insurance pill.
 *
 * Both calls are identified by the access token alone and take no parameters,
 * so each is cached under a flat key.
 *
 * Same rule as the shipment and payout mappers: every field of either payload
 * is optional while the back office is still filling the record in, so a cell
 * the response did not carry reads `NOT_AVAILABLE` instead of collapsing the
 * grid around it.
 *
 * ← profile { fullName, driverImage, driverType, phoneNumber, email,
 *             cdlNumber, cdlState, cdlClass, cdlExpiry, dateOfBirth, hireDate,
 *             yearsOfExperience, address, city, state, zipCode,
 *             insuredUnderCompanyPolicy }
 * ← bank    { bankName, bankLast4, accountHolderName }
 */

import {getDriverBank, getDriverProfile} from '../config/driverApi';
import {MONTHS_SHORT} from '../utils/format';
import {TTL, useCachedResource} from './resourceCache';
import type {DriverBank, DriverProfile} from '../types/driver';

/** What a cell shows in place of a value the response did not carry. */
export const NOT_AVAILABLE = 'No API data';

/**
 * The same thing where a cell has no room for a sentence — the insurance
 * pill is a chip a few characters wide, and the long form would stretch it
 * across the card.
 */
export const NOT_AVAILABLE_SHORT = 'N/A';

const PROFILE_ERROR = 'Could not load your profile.';
const BANK_ERROR = 'Could not load your bank details.';

/** A value the payload actually carried, trimmed, or ''. */
const text = (raw: unknown): string => String(raw ?? '').trim();

/**
 * "OWNER_OPERATOR" → "Owner Operator". The backend names driver types in
 * screaming snake case; the field under "Driver Type" is read by a person.
 */
const titleCase = (raw: unknown): string =>
  text(raw)
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

/**
 * "2026-09-23" → "Sep 23, 2026", which is as long as a grid cell takes.
 *
 * Read off the string's own characters, not through `Date`:
 * `new Date('2026-09-23')` is UTC midnight, which reads as the 22nd for a
 * driver west of Greenwich — and a CDL that expires a day early is a stop at
 * the scale house. Anything not ISO passes through as sent.
 */
export const profileDate = (raw: unknown): string => {
  const value = text(raw);
  if (!value) return '';
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!iso) return value;
  const month = MONTHS_SHORT[Number(iso[2]) - 1];
  return month ? `${month} ${Number(iso[3])}, ${iso[1]}` : value;
};

/**
 * 0 → "0 Years", 1 → "1 Year".
 *
 * Zero is a figure, not a gap: a driver hired this month has no years behind
 * them yet and the cell says so rather than claiming the record is missing.
 */
export const experienceLabel = (raw: unknown): string => {
  const years = Number(raw);
  if (raw === null || raw === undefined || text(raw) === '' || !Number.isFinite(years)) {
    return '';
  }
  return `${years} ${years === 1 ? 'Year' : 'Years'}`;
};

/**
 * The last four of the payout account, as the Account Number cell shows it —
 * "···· 4521". The account number itself never leaves the back office.
 */
export const accountMask = (raw: unknown): string => {
  const last4 = text(raw);
  return last4 ? `···· ${last4}` : '';
};

/**
 * The two payloads → the value for every field key `DETAIL_SECTIONS` lists.
 *
 * Keyed by the constants' own field keys, so the screen reads a cell by the
 * key it already renders with and every section keeps its full set of rows
 * whether or not the record behind it is filled in. A key whose value did not
 * arrive is left out entirely — the screen shows `NOT_AVAILABLE` for it.
 *
 * @param profile the payload from `getDriverProfile`
 * @param bank the payload from `getDriverBank`
 */
export const toProfileDetails = (
  profile: DriverProfile | null | undefined,
  bank: DriverBank | null | undefined,
): Record<string, string> => {
  const details: Record<string, string> = {
    // License details
    cdlNumber: text(profile?.cdlNumber),
    // The constants call it `issuingState`; the payload calls it `cdlState`.
    issuingState: text(profile?.cdlState),
    cdlClass: text(profile?.cdlClass),
    cdlExpiry: profileDate(profile?.cdlExpiry),

    // Personal details
    dateOfBirth: profileDate(profile?.dateOfBirth),
    driverType: titleCase(profile?.driverType),
    hireDate: profileDate(profile?.hireDate),
    yearsOfExperience: experienceLabel(profile?.yearsOfExperience),

    // Bank details — a second call, so these stay blank until it lands.
    bankName: text(bank?.bankName),
    accountNumber: accountMask(bank?.bankLast4),
    accountHolderName: text(bank?.accountHolderName),

    // Address details
    address: text(profile?.address),
    city: text(profile?.city),
    state: text(profile?.state),
    zipCode: text(profile?.zipCode),
  };

  // An empty string and a missing key would render the same, but dropping it
  // keeps the object to what the record actually carries.
  Object.keys(details).forEach(key => {
    if (!details[key]) delete details[key];
  });

  return details;
};

/**
 * The identity card — the name over the avatar, and the photo behind it.
 *
 * `avatarUri` is null rather than a placeholder string: the card draws an
 * empty circle for a driver with no photo, and `Image` cannot take a sentence
 * as a source.
 */
export const toProfileIdentity = (profile: DriverProfile | null | undefined) => ({
  name: text(profile?.fullName) || NOT_AVAILABLE,
  avatarUri: text(profile?.driverImage) || null,
});

/**
 * Whether the driver is covered by the company policy, as the pill's three
 * states: yes, no, or a record that does not say.
 */
export const insuranceLabel = (raw: unknown): string => {
  if (raw === true) return 'Yes';
  if (raw === false) return 'No';
  return NOT_AVAILABLE_SHORT;
};

/**
 * The signed-in driver's profile, read through the shared cache.
 *
 * Onboarding details change when the back office edits them, which is rare
 * and never from this app, so the record is held for the same window as the
 * other near-static reads.
 */
export function useDriverProfile() {
  const {data, ...rest} = useCachedResource<DriverProfile>(
    'driver-profile',
    getDriverProfile,
    {ttl: TTL.DETAIL, message: PROFILE_ERROR},
  );
  return {profile: data, ...rest};
}

/**
 * The driver's payout account, read through the shared cache.
 *
 * @param enabled false parks the hook — a company driver's payout is the fleet
 *        owner's business and that profile hides the Bank details section
 *        entirely, so the call is not worth making for them.
 */
export function useDriverBank(enabled: boolean = true) {
  const {data, ...rest} = useCachedResource<DriverBank>(
    'driver-bank',
    getDriverBank,
    {ttl: TTL.DETAIL, message: BANK_ERROR, enabled},
  );
  return {bank: data, ...rest};
}
