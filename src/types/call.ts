import type {Maybe, Nullable} from './common';

// ── Wire shapes ───────────────────────────────────────────────────────────

/** One person on the shipment, as `call-contacts` sends them. */
export interface CallContactPayload {
  fullName?: Nullable<string>;
  primaryPhone?: Nullable<string>;
  alternatePhone?: Nullable<string>;
  email?: Nullable<string>;
}

/** A stop with the person attached to it — the LTL half of the payload. */
export interface CallContactStop {
  sequence?: Nullable<number>;
  /** `PICKUP` or `DROP`. */
  stopType?: Nullable<string>;
  contact?: Nullable<CallContactPayload>;
}

export interface CallContactsPayload {
  shipmentId?: Nullable<string>;
  shipmentType?: Nullable<string>;
  senderContact?: Nullable<CallContactPayload>;
  receiverContact?: Nullable<CallContactPayload>;
  stops?: Nullable<CallContactStop[]>;
}

/** Which end of the shipment the person stands on. */
export type CallContactType = 'SENDER' | 'RECEIVER';

/** Which of the person's two numbers the bridge should ring. */
export type CallPhoneType = 'PRIMARY' | 'ALTERNATE';

/** Query params for `POST /drivers/shipments/{shipmentId}/call/reserve`. */
export interface ReserveCallParams {
  shipmentId: string;
  type: CallContactType;
  phoneType: CallPhoneType;
  /** The contact's stop; only multi-stop loads carry one. Sent as a string. */
  sequence?: Maybe<number | string>;
}

/** What `reserve` answers with — everything `start` needs, plus the number. */
export interface CallReservation {
  sessionId?: Nullable<string>;
  /** The bridge number to dial. Never the contact's own. */
  callNumber?: Nullable<string>;
  /** Proves this device owns the session; replayed on `start`. */
  fencingToken?: Nullable<string>;
  /** ISO — the reservation lapses if `start` has not been called by then. */
  reservedUntil?: Nullable<string>;
  /** Seconds the bridge will stay up before the backend drops it. */
  maxDurationSecs?: Nullable<number>;
}

/** Query params for `POST /drivers/call/{sessionId}/start`. */
export interface CallSessionParams {
  sessionId: string;
  fencingToken: string;
}

/** What `start` answers with. Optional throughout — a 2xx is the confirmation. */
export interface CallSessionResult {
  sessionId?: Nullable<string>;
  status?: Nullable<string>;
  message?: Nullable<string>;
  startedAt?: Nullable<string>;
  endedAt?: Nullable<string>;
  durationSecs?: Nullable<number>;
}

/** One of a contact's numbers. `phoneType` is what `reserve` is keyed on. */
export interface CallNumber {
  phoneType: CallPhoneType;
  /** "Primary" / "Alternate" — the picker's label. */
  label: string;
  phone: string;
}

/** A person the driver can ring, with every number the payload gave them. */
export interface CallTarget {
  id: string;
  name: string;
  /** "Shipper" / "Receiver". */
  role: string;
  contactType: CallContactType;
  /** Primary first. Never empty — a contact with no number is not listed. */
  numbers: CallNumber[];
  /** Passed straight through to `reserve`; absent on single-stop loads. */
  sequence?: Maybe<number>;
}

/** A stop, with the lines attached to it. */
export interface CallTargetGroup {
  id: string;
  /** "P1", "D2" — pickups and drops numbered separately, in stop order. */
  badge: string;
  kind: 'pickup' | 'drop';
  label: string;
  targets: CallTarget[];
}
