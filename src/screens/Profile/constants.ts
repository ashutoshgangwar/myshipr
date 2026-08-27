import {select} from '../../theme/device';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';

// Same phone down-scale as NotificationScreen / EarningsDetails so a label and
// an input read at one size across the detail screens.
const PHONE_FACTOR = select({phone: 0.82, tablet: 1});

// verticalScale keys off screen height, so a tablet inflates every vertical
// value by half again while ms() barely moves — the form ends up floating in
// its own padding. Trim the vertical rhythm back on tablets only.
const VERTICAL_FACTOR = PHONE_FACTOR * select({phone: 1, tablet: 0.7});

export const ms = (n: number): number => baseMs(n) * PHONE_FACTOR;
export const vs = (n: number): number => baseVs(n) * VERTICAL_FACTOR;

// The onboarding sections lay out three fields to a row on a tablet; a phone
// only has room for two before the labels start wrapping.
export const GRID_COLUMNS = select({phone: 2, tablet: 3});

// The only two fields the driver can edit from the app — everything below the
// notice is owned by the Carrier Portal.
export const CONTACT_FIELDS = [
  {
    key: 'phone',
    label: 'Phone Number',
    placeholder: '+1 (555) 000-0000',
    keyboardType: 'phone-pad',
  },
  {
    key: 'email',
    label: 'Email Address',
    placeholder: 'name@carrier.com',
    keyboardType: 'email-address',
  },
] as const;

// Read-only detail sections. Values arrive with the driver profile; the field
// list is fixed so an empty response still renders the full form.
export const DETAIL_SECTIONS = [
  {
    key: 'license',
    title: 'License details',
    fields: [
      {key: 'cdlNumber', label: 'CDL number'},
      {key: 'issuingState', label: 'Issuing state'},
      {key: 'cdlClass', label: 'CDL Class'},
      {key: 'cdlExpiry', label: 'CDL Expiry'},
    ],
  },
  {
    key: 'personal',
    title: 'Personal details',
    fields: [
      {key: 'dateOfBirth', label: 'Date of Birth'},
      {key: 'driverType', label: 'Driver Type'},
      {key: 'hireDate', label: 'Hire Date'},
      {key: 'yearsOfExperience', label: 'Years of Experience'},
    ],
  },
  {
    key: 'bank',
    title: 'Bank details',
    fields: [
      {key: 'bankName', label: 'Bank Name'},
      {key: 'accountNumber', label: 'Account Number'},
      {key: 'accountHolderName', label: 'Account Holder Name'},
    ],
  },
  {
    key: 'address',
    title: 'Address Details',
    fields: [
      // A street address needs the whole row; the rest sit on the grid.
      {key: 'address', label: 'Address', full: true},
      {key: 'city', label: 'City'},
      {key: 'state', label: 'State'},
      {key: 'zipCode', label: 'Zip Code'},
    ],
  },
];

// Not a field grid — a single statement with a yes/no pill.
export const INSURANCE = {
  title: 'Insured under company policy',
  subtitle: 'Covered under your company auto liability',
};

// Stand-in for the profile the API returns. Missing keys fall back to the
// "Not provided" placeholder, so a partial profile still renders.
// Shown under the driver's name on the identity card.
export const ROLE_LABELS = {
  fleet: 'Company driver',
  single: 'Single driver',
};

export const DRIVER = {
  name: 'Ashutosh Gangwar',
  phone: '',
  email: '',
  avatarUri: null,
  companyInsured: true,
  details: {},
};

export const ONBOARDING_NOTICE =
  'All details below are set during onboarding. To update them, log in to the Carrier Portal.';

// A company driver has no Carrier Portal login of their own — their record is
// maintained by the fleet owner, so they are pointed at them instead.
export const FLEET_ONBOARDING_NOTICE =
  'Everything below is entered by your fleet owner. Reach out to them if anything needs to change.';

// Bank and insurance are the fleet owner's business, not the company driver's:
// both are hidden from that profile.
export const FLEET_HIDDEN_SECTIONS = ['bank'];

/** The two editable contact fields, derived from CONTACT_FIELDS. */
export type ContactFieldKey = (typeof CONTACT_FIELDS)[number]['key'];
