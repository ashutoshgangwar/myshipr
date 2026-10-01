/**
 * One load's payout — `GET /drivers/earnings/{shipmentId}/payment-details` —
 * and the mappers that turn its payload into the Earnings Details screen: the
 * payout headline, the bill of lading grid, the payment-status timeline and
 * the payout account.
 *
 * The id is mandatory and is a path segment, so the screen must be opened from
 * an earnings row; `usePaymentDetails` rejects rather than calling without it.
 *
 * Same rule as the shipment mappers: every field of this payload is nullable
 * while the back office settles the load, so a cell the response did not carry
 * reads `NOT_IN_API` instead of collapsing the layout around it.
 *
 * ← { shipmentId, awb, shipmentType, date, totalPayout, paymentStatus,
 *     routeFrom, routeTo,
 *     billOfLading: {shipperName, shipperAddress, carrierName, carrierMc,
 *                    carrierDot, bolNumber, bolDate},
 *     paymentTimeline: [{label, at, expected, state}],
 *     bankLast4 }
 */

import {useMemo} from 'react';

import {getPaymentDetails} from '../config/driverApi';
import {
  clock,
  formatMoney,
  isNumber,
  MONTHS_LONG,
  MONTHS_SHORT,
} from '../utils/format';
import {TTL, useCachedResource} from './resourceCache';
import {statusLabel} from './driverEarnings';
import {loadType} from './upcomingShipments';
import type {AsyncResource, DetailRow, Nullable} from '../types/common';
import type {PaymentDetails, PaymentTimelineStep} from '../types/earnings';

/** Everything below reads a payload that may not have arrived yet. */
type Payment = PaymentDetails | null | undefined;

/** What a cell shows in place of a value the response did not carry. */
export const NOT_IN_API = '—';

const ERROR = 'Could not load this payment.';

/** Where a payout step sits in the pipeline — the screen's dot colours. */
export const STEP_STATE = {
  DONE: 'done',
  PENDING: 'pending',
  UPCOMING: 'upcoming',
} as const;

export type StepState = (typeof STEP_STATE)[keyof typeof STEP_STATE];

/** One row of the payment-status card. */
export interface PayoutStep {
  id: string;
  label: string;
  when: string;
  state: StepState;
}

/** A value the payload actually carried, trimmed, or ''. */
const text = (raw: unknown): string => String(raw ?? '').trim();

/** A value the payload actually carried, or the placeholder. */
const value = (raw: unknown): string => text(raw) || NOT_IN_API;

/** "2026-08-11…" → "Aug 11". Read off the string, never through `Date`. */
const dayLabel = (raw: unknown): string => {
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text(raw));
  if (!iso) return '';
  const month = MONTHS_SHORT[Number(iso[2]) - 1];
  return month ? `${month} ${Number(iso[3])}` : '';
};

/** "2026-08-11" → "August 11, 2026", for the BOL date cell. */
const longDate = (raw: unknown): string => {
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text(raw));
  if (!iso) return value(raw);
  const month = MONTHS_LONG[Number(iso[2]) - 1];
  return month ? `${month} ${Number(iso[3])}, ${iso[1]}` : value(raw);
};

/**
 * "2026-08-11" → "Aug, 11" — the payout chip's date, spelled the way the
 * shipment chip spells it. The characters are read straight off the string:
 * `new Date('2026-08-11')` is UTC midnight, which reads as the 10th for a
 * driver west of Greenwich.
 */
export const chipDate = (raw: unknown): string => {
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text(raw));
  if (!iso) return value(raw);
  const month = MONTHS_SHORT[Number(iso[2]) - 1];
  return month ? `${month}, ${iso[3]}` : value(raw);
};

/**
 * An address split into its parts, with a postal code that was sent on its own
 * folded back onto the state in front of it: "New Delhi, Delhi, 110020" and
 * "New Delhi, Delhi 110020" both come out as ["New Delhi", "Delhi 110020"].
 */
const addressParts = (raw: unknown): string[] => {
  const parts = text(raw)
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);

  const last = parts[parts.length - 1] ?? '';
  if (parts.length > 1 && /^\d[\d\s-]*$/.test(last)) {
    return [...parts.slice(0, -2), `${parts[parts.length - 2]} ${last}`];
  }
  return parts;
};

/**
 * The tail of an address — city, state and postal code: "Okhla Industrial Area
 * Phase 1, New Delhi, Delhi 110020" → "New Delhi, Delhi 110020", "123 Main St,
 * Dallas, TX 75201" → "Dallas, TX 75201".
 *
 * The line under the shipper's name is one grid cell wide, so the street is
 * dropped and what places the shipper is kept.
 */
export const cityStatePostcode = (raw: unknown): string =>
  addressParts(raw).slice(-2).join(', ');

/**
 * The state alone: "…, Delhi 110020" → "Delhi", "…, TX 75201" → "TX".
 *
 * The payout card gives the whole leg one line, so it reads state → state.
 * Trailing digits are the postal code — an address that carries nothing else
 * is left as sent rather than being guessed at.
 */
export const stateOf = (raw: unknown): string => {
  const parts = addressParts(raw);
  const tail = parts[parts.length - 1] ?? '';
  if (!tail) return NOT_IN_API;
  return tail.replace(/[\s-]*\d[\d\s-]*$/, '').trim() || tail;
};
/**
 * When a step happened, or when it is due: "Jun 12, 6:40 PM" for a stamped
 * step, "Expected Jun 15" for a scheduled one.
 *
 * `at` wins over `expected` — once a step has actually happened, what it was
 * forecast for stops being news. A step carrying neither is one the back
 * office has not scheduled yet, so it reads as missing rather than as blank.
 */
export const stepWhen = (step: PaymentTimelineStep | null | undefined): string => {
  const at = text(step?.at);
  if (at) {
    const stamped = Date.parse(at);
    const time = Number.isFinite(stamped) ? clock(new Date(stamped)) : '';
    return [dayLabel(at), time].filter(Boolean).join(', ') || at;
  }

  const expected = text(step?.expected);
  if (expected) return `Expected ${dayLabel(expected) || expected}`;

  return NOT_IN_API;
};

/** The backend's step vocabulary → the three states the card draws. */
export const stepState = (raw: unknown): StepState => {
  const state = text(raw).toUpperCase().replace(/[\s-]+/g, '_');
  if (/^(DONE|COMPLETE|COMPLETED|PAID|SETTLED)$/.test(state)) {
    return STEP_STATE.DONE;
  }
  if (/^(PENDING|PROCESSING|IN_PROGRESS)$/.test(state)) {
    return STEP_STATE.PENDING;
  }
  return STEP_STATE.UPCOMING;
};

/**
 * The three rows of the payment-status card.
 *
 * The labels the response sends are the ones shown — this is the back office's
 * own pipeline, and it names its own steps. With no timeline at all the card
 * would collapse mid-screen, so the pipeline's three stages stand with their
 * times missing instead.
 */
export const toPayoutSteps = (payment: Payment): PayoutStep[] => {
  const timeline = Array.isArray(payment?.paymentTimeline)
    ? payment.paymentTimeline
    : [];

  if (!timeline.length) {
    return ['Shipment Delivered', 'Invoice processing', 'Payout to Bank'].map(
      (label, index) => ({
        id: `step-${index}`,
        label,
        when: NOT_IN_API,
        state: STEP_STATE.UPCOMING,
      }),
    );
  }

  return timeline.map((step, index) => ({
    id: `${text(step?.label) || 'step'}-${index}`,
    label: value(step?.label),
    when: stepWhen(step),
    state: stepState(step?.state),
  }));
};

/**
 * The bill of lading grid — two cells per row, in reading order.
 *
 * Only what this endpoint carries: the shipper, the carrier and the BOL's own
 * date and number. A cell whose value the response left null still draws, with
 * the placeholder in it, so the grid keeps its rows.
 */
export const toBillOfLading = (payment: Payment): DetailRow[] => {
  const bol = payment?.billOfLading;

  const mcDot = [
    text(bol?.carrierMc) && `MC - ${text(bol?.carrierMc)}`,
    text(bol?.carrierDot) && `Dot - ${text(bol?.carrierDot)}`,
  ]
    .filter(Boolean)
    .join('/ ');

  return [
    {
      label: 'SHIPPER',
      value: value(bol?.shipperName),
      // Cut down to city, state and postal code: the name above it is the
      // cell's headline, and a full street address wraps over three lines.
      sub: cityStatePostcode(bol?.shipperAddress) || null,
    },
    // {label: 'CONSIGNEE', value: NOT_IN_API, sub: null},
    {
      label: 'CARRIER/ MC- DOT',
      value: value(bol?.carrierName),
      sub: mcDot || null,
    },
    {
      label: 'BOL DATE',
      value: bol?.bolDate ? longDate(bol.bolDate) : NOT_IN_API,
    },
    // The label already says which number this is, so the value is the number
    // as issued — no "BOL -" prefix repeating the heading.
    {label: 'BOL NUMBER', value: value(bol?.bolNumber)},
    // {label: 'DIMENSIONS', value: NOT_IN_API},
  ];
};

/**
 * The whole payload → everything the screen renders.
 *
 * `toPaymentDetails(null)` hands back the same shape filled with placeholders,
 * so the page keeps its layout while the call is out instead of collapsing and
 * jumping when the payout lands.
 *
 * @param payment the payload from `getPaymentDetails`
 */
export const toPaymentDetails = (payment: Payment) => ({
  amountLabel: 'Total Payout',
  // A load the back office has not settled sends `totalPayout: null`, and the
  // headline reads "$0" for it — nothing has been paid out yet, which is a
  // figure, not a gap. The placeholder is kept for the state before the call
  // answers, so the card does not flash a $0 the payload then contradicts.
  amount: !payment
    ? NOT_IN_API
    : formatMoney(isNumber(payment.totalPayout) ? payment.totalPayout : 0),

  mode: loadType(payment?.shipmentType) || NOT_IN_API,
  date: payment?.date ? chipDate(payment.date) : NOT_IN_API,
  // A load the back office has not settled sends `paymentStatus: null` — the
  // freight is still moving, so the badge reads "In - Transit". Spelled the
  // way the screen's `STATUS_COLOR` keys it, so the pill comes out amber.
  // The placeholder stands until the call answers, so the badge does not show
  // a status the payload then contradicts.
  status: !payment
    ? NOT_IN_API
    : statusLabel(payment.paymentStatus || 'IN_TRANSIT'),

  // "AWB-125" reads better spaced out; a full "MAWB-FTL_STANDARD-2LZ…"
  // reference is left exactly as the backend issued it.
  awb: payment?.awb
    ? String(payment.awb).replace(/^([A-Za-z]+)-(\w{1,6})$/, '$1 - $2')
    : NOT_IN_API,
  // The addresses are shown down to the state — the card's route line is one
  // line wide, and a full street address would be truncated mid-word.
  origin: stateOf(payment?.routeFrom),
  dest: stateOf(payment?.routeTo),

  bol: toBillOfLading(payment),
  steps: toPayoutSteps(payment),

  account: {
    label: 'Bank',
    mask: value(payment?.bankLast4),
    note: '*you can change your bank details in the settings section.',
  },
});

/**
 * Loads one load's payout and keeps the payload in state.
 *
 * @param shipmentId the id off the tapped earnings row
 */
export function usePaymentDetails(
  shipmentId: string | null | undefined,
): {payment: Nullable<PaymentDetails>} & Omit<
  AsyncResource<PaymentDetails>,
  'data'
> {
  const fetcher = useMemo(
    () => () =>
      shipmentId
        ? getPaymentDetails({shipmentId})
        : Promise.reject(new Error('No shipment was selected.')),
    [shipmentId],
  );
  const {data, ...rest} = useCachedResource<PaymentDetails>(
    `payment-details:${shipmentId ?? ''}`,
    fetcher,
    {ttl: TTL.DETAIL, message: ERROR},
  );
  return {payment: data, ...rest};
}
