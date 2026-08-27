import {select} from '../../theme/device';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';
import {colors} from '../../theme/colors';
import type {toEarningsRows} from '../../services/driverEarnings';

/** One row of the earnings table — exactly what `toEarningsRows` produces. */
type EarningsRow = ReturnType<typeof toEarningsRows>[number];

// Same phone down-scale as ShipmentDetails so a load reads at one size whether
// you open it from the shipment table or from an earnings row.
const PHONE_FACTOR = select({phone: 0.82, tablet: 1});
export const ms = (n: number): number => baseMs(n) * PHONE_FACTOR;
export const vs = (n: number): number => baseVs(n) * PHONE_FACTOR;

// Payout status drives the dot colour and how loud the row's label reads.
export const STEP_STATE = {
  DONE: 'done',
  PENDING: 'pending',
  UPCOMING: 'upcoming',
};

// The payout the screen is showing. In a real build this arrives as route
// params from the earnings row the user tapped / the backend.
export const PAYMENT = {
  amount: '$900.00',
  amountLabel: 'Total Payout',

  mode: 'FTL',
  date: 'Aug , 12',
  status: 'In - Transit',

  awb: 'AWB - 125',
  origin: 'Jersey City',
  dest: 'Baltimore',

  // Two cells per row, in reading order — same shape ShipmentDetails' grid takes.
  bol: [
    {label: 'SHIPPER', value: 'Meridian Import Co.', sub: 'San Jose, CA 95112'},
    {
      label: 'CONSIGNEE',
      value: 'Atlas Distribution LLC',
      sub: 'Newark, NJ 07105',
    },
    {
      label: 'CARRIER/ MC- DOT',
      value: 'Video Wave Logistics',
      sub: 'MC - 742110/ Dot - 2891765',
    },
    {
      label: 'BOL DATE/ NO.',
      value: 'July 8th, 2026',
      sub: 'BOL - 1000954',
    },
    {label: 'TRAILER NUMBER', value: 'TRL - 4471/ SL- 88213'},
    {label: 'DIMENSIONS', value: '48 x 40 x 36'},
  ],

  steps: [
    {
      id: 'delivered',
      label: 'Shipment Delivered',
      when: 'Jun 12, 6:40 PM',
      state: STEP_STATE.DONE,
    },
    {
      id: 'invoice',
      label: 'Invoice processing',
      when: 'Expected Jun 15',
      state: STEP_STATE.PENDING,
    },
    {
      id: 'payout',
      label: 'Payout to Bank',
      when: 'Expected Jun 15',
      state: STEP_STATE.UPCOMING,
    },
  ],

  account: {
    label: 'Bank',
    mask: '4821',
    note: '*you can change your bank details in the settings section.',
  },
};

// Filled status pill colours, mirroring the earnings table's own mapping.
export const STATUS_COLOR: Record<string, string> = {
  Paid: colors.success,
  'In - Transit': colors.warning,
  Cancelled: colors.danger,
};

const cityOf = (
  stop: string | {city?: string; label?: string} | null | undefined,
): string =>
  typeof stop === 'string' ? stop : String(stop?.city ?? stop?.label ?? '');

// The table renders amounts whole ("$900"); the payout headline carries cents.
// A row whose payout the backend has not sent yet shows a dash — left as it
// is, since "—.00" reads as a broken figure rather than a pending one.
const withCents = (amount: string | number | null | undefined): string => {
  const text = String(amount ?? '');
  if (!/\d/.test(text)) return text || PAYMENT.amount;
  return /\.\d{2}$/.test(text) ? text : `${text}.00`;
};

/**
 * Map an earnings-table row onto the payout shape this screen renders. Only
 * the load-specific fields come from the row — the bill of lading, status
 * timeline and bank account still fall back to the sample until the backend
 * returns them.
 */
export const paymentFromTransaction = (tx: EarningsRow | null | undefined) => {
  if (!tx) return PAYMENT;

  const stops = tx.stops ?? [];
  const firstPickup = stops.find(s => s?.type !== 'drop') ?? stops[0];
  const lastDrop = [...stops].reverse().find(s => s?.type === 'drop');

  return {
    ...PAYMENT,
    amount: withCents(tx.amount),
    mode: tx.type ?? PAYMENT.mode,
    date: tx.when ?? PAYMENT.date,
    status: tx.status ?? PAYMENT.status,
    // "AWB-125" reads better spaced out; a full "MAWB-FTL_STANDARD-2LZ…"
    // reference is left exactly as the backend issued it.
    awb: tx.awb
      ? tx.awb.replace(/^([A-Za-z]+)-(\w{1,6})$/, '$1 - $2')
      : PAYMENT.awb,
    origin: cityOf(firstPickup) || PAYMENT.origin,
    dest: cityOf(lastDrop ?? stops[stops.length - 1]) || PAYMENT.dest,
  };
};
