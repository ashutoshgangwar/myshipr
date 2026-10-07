/**
 * Shipments, stops and the live trip.
 *
 * Every field below is transcribed from the response shapes documented on the
 * endpoints in `config/driverApi.js` — not invented. Where the backend is
 * known to send a field only sometimes (`lat`/`lon` on a stop, the whole of
 * `remainingETA` when no coordinate was sent) the field is optional or
 * nullable here, so the `?? NOT_IN_API` fallbacks in `services/` type-check
 * instead of needing casts.
 *
 * Types only: this module emits no runtime code.
 */

import type {Coordinates, DateString, MapLocation, Nullable} from './common';

/**
 * Whether a stop is a pickup or a delivery. The backend is not consistent in
 * its casing or wording, which is why `services/shipmentDetail` matches with
 * `/DROP|DELIVER/i` rather than comparing to a literal — so this is a
 * documented hint, widened with `string`, not a closed union that would
 * reject a value the server is entitled to send.
 */
export type StopType = 'PICKUP' | 'DROP' | 'DELIVERY' | (string & {});

/**
 * One stop on a route.
 *
 * The list, detail and trip endpoints each name the same concepts slightly
 * differently — `from`/`fromTime`, `lng`/`lon`/`longitude` — and the services
 * read every spelling. All of them are modelled rather than normalised away,
 * because normalising would mean changing runtime behaviour.
 */
export interface ShipmentStop {
  sequence?: number;
  /** Present on trip stops, where a trip spans several shipments. */
  tripSequence?: number;
  shipmentId?: string;
  type?: StopType;
  address?: string;
  location?: string;
  city?: string;
  state?: string;
  dock?: string;

  lat?: number;
  latitude?: number;
  lng?: number;
  lon?: number;
  longitude?: number;

  /** Some rows carry the day on the stop rather than on the shipment. */
  date?: DateString;

  /** Appointment window on the list and trip endpoints. */
  from?: string;
  to?: string;
  /** The same window on the detail endpoint. */
  fromTime?: string;
  toTime?: string;
}

/** A pickup or drop contact on the shipment-detail payload. */
export interface ShipmentContact {
  name?: string;
  phone?: string;
  dock?: string;
}

/** The trailer terms block of the shipment-detail payload. */
export interface TrailerTerms {
  trailer?: string;
  trailerNumber?: string;
  dimensions?: string;
}

/** The load itself, as the detail screen's "Load Details" panel reads it. */
export interface ShipmentLoadDetails {
  equipment?: string;
  truckClass?: string;
  commodity?: string;
  weightLbs?: number;
  totalPallets?: number;
  palletCapacity?: number;
  distanceMiles?: number;
}

/**
 * A row in the upcoming/past shipment lists.
 *
 * `GET /drivers/shipments/upcoming` and `…/past` share this shape.
 */
export interface ShipmentSummary {
  tripId?: string;
  shipmentId?: string;
  /** Some payloads key the row on a bare `id` instead. */
  id?: string;
  awb?: string;
  date?: DateString;
  shipmentType?: string;
  type?: string;
  stops?: ShipmentStop[];

  // The Shipment table's own cells. Documented from what the table reads
  // rather than from the endpoint comment, which lists only the core fields.
  pickupTime?: string;
  startTime?: string;
  loadPayout?: number;
  shipmentDistanceMiles?: number;
  totalMiles?: number;
}

/**
 * The full shipment as the details screen draws it.
 *
 * `GET /drivers/shipments/{shipmentId}/detail`
 */
export interface ShipmentDetailPayload {
  shipmentId?: string;
  shipmentType?: string;
  routeFrom?: string;
  routeTo?: string;
  pickupDate?: DateString;
  pickupTime?: string;
  pickupCount?: number;
  dropCount?: number;
  route?: ShipmentStop[];
  pickupContact?: ShipmentContact;
  dropContact?: ShipmentContact;
  trailerTerms?: TrailerTerms;
  shipmentDetails?: ShipmentLoadDetails;
}

/** How far off the trip is, and whether that is early, late or on time. */
export interface TripStatus {
  startsIn?: string;
  timeStatus?: string;
}

/**
 * The driver's current trip — the Home "Current Trip" card.
 *
 * `GET /drivers/shipments/{tripId}?lat=&lon=`
 *
 * The three truck-relative figures (`remainingDistance`, `remainingETA`,
 * `deadMiles`) come back `null` when the request carried no coordinate, which
 * is a supported case rather than an error — hence `Nullable`, not optional.
 */
/**
 * The tractor/trailer the load is assigned to.
 *
 * `GET /drivers/shipments/{tripId}` → `equipmentDetail`
 *
 * NOTE the units: the backend sends US customary (pounds, feet) while the HERE
 * SDK's `VehicleSpecification` is metric (kilograms, centimetres). Nothing here
 * is handed to the router as-is — `utils/here/vehicleSpec` converts it first.
 */
export interface EquipmentDetail {
  /** `DRY_VAN`, `REEFER`, `FLATBED`, `BOX_TRUCK`, … */
  equipmentType?: string;
  grossWeightLbs?: Nullable<number>;
  weightPerAxleLbs?: Nullable<number>;
  heightFt?: Nullable<number>;
  lengthFt?: Nullable<number>;
  widthFt?: Nullable<number>;
  trailerCount?: Nullable<number>;
  axleCount?: Nullable<number>;
}

export interface CurrentTrip {
  tripId?: string;
  awb?: string;
  loadPayout?: number;
  tripStatus?: TripStatus;
  remainingHosMinutes?: number;
  estimatedTripMinutes?: number;
  deadMiles?: Nullable<number>;
  shipmentType?: string;
  remainingDistance?: Nullable<number>;
  remainingETA?: Nullable<string>;
  totalMiles?: number;
  date?: DateString;
  stops?: ShipmentStop[];
  /** The vehicle the trip runs on — what the truck route is calculated for. */
  equipmentDetail?: Nullable<EquipmentDetail>;
}

/** Params for `getCurrentTrip()`. `tripId` is required; the fix is not. */
export interface CurrentTripParams {
  tripId: string;
  lat?: number;
  lon?: number;
}

/**
 * One stop of the trip reduced to what the map needs to drive to it.
 *
 * The trip endpoint is the only one that carries coordinates — the progress
 * endpoint names the same stops but sends no `lat`/`lon` — so these are built
 * once from the trip payload and handed to the map screen as a route param.
 * `tripSequence` is the join key between the two payloads, and the order the
 * driver works the stops in: 1, 2, 3 …
 */
export interface TripStopTarget {
  tripSequence: number;
  sequence: Nullable<number>;
  shipmentId: Nullable<string>;
  type: StopType;
  address: string;
  /** Where to route to, in the naming the map screens already speak. */
  location: MapLocation;
  /** The appointment window, e.g. "4:00 AM – 5:00 AM". */
  window: string;
}

/**
 * A stop on the trip-progress payload.
 *
 * `GET /drivers/shipments/{shipmentId}/progress`
 *
 * Note the two spellings the backend uses for the same concept: the trip
 * endpoint sends `type`, this one sends `stopType`. Both are modelled rather
 * than normalised away, and `tripSequence` is what joins a row here to the
 * stop on the trip payload that carries its coordinates.
 *
 * Whether a stop is finished is a per-kind question. A pickup is done when it
 * has been procured, a drop when it has been completed — which is why the flag
 * pairs below are optional rather than a single shared `done`.
 */
export interface TripProgressStop {
  sequence?: number;
  tripSequence?: number;
  shipmentId?: string;
  stopType?: StopType;
  /** Also sent as `type` on some rows — both spellings are read. */
  type?: StopType;
  address?: string;
  /** Raw server status, e.g. `SHIPMENT_PROCURED`, `COMPLETED`, `PENDING`. */
  status?: string;

  /** Pickups. */
  shipmentProcured?: boolean;
  shipmentProcuredAt?: Nullable<string>;

  /** Drops. */
  completed?: boolean;
  completedAt?: Nullable<string>;
}

/**
 * How far through the trip the driver is — what the map screen's status strip
 * and its verify flow both read.
 *
 * `GET /drivers/shipments/{shipmentId}/progress`
 */
export interface TripProgress {
  tripId?: string;
  preTripInspection?: boolean;
  preTripInspectionAt?: Nullable<string>;
  stops?: TripProgressStop[];
}

/** Params for `getShipmentProgress()`. */
export interface TripProgressParams {
  shipmentId: string;
}

/**
 * The milestone a progress update reports.
 *
 * Only the pre-trip inspection is driver-confirmed from the map — every stop
 * moves on its OTP instead — so this is the one value the app sends today.
 */
export type TripProgressStatus = 'PRE_TRIP_INSPECTION';

/** Params for `updateShipmentProgress()`. */
export interface UpdateTripProgressParams {
  /** The trip's id — the same path key `/progress` is read on. */
  tripId: string;
  status: TripProgressStatus;
}

/**
 * Params for `sendDeliveryStopOtp()`.
 *
 * `POST /drivers/shipments/{shipmentId}/delivery/stops/{sequence}/send-otp`
 *
 * The same two path parts the verify call is keyed on, and nothing else: the
 * endpoint takes no body, and works out who to text from the stop itself.
 */
export interface SendStopOtpParams {
  shipmentId: string;
  sequence: number;
}

/**
 * What the send-otp endpoint answers with.
 *
 * Every field is optional — a 2xx is itself the confirmation. `message` is the
 * only one the sheet shows, and `sentTo` is a masked contact when the backend
 * cares to say who the code went to.
 */
export interface SendStopOtpResult {
  sent?: boolean;
  message?: string;
  sentTo?: string;
  expiresAt?: Nullable<string>;
}

/**
 * Params for `verifyDeliveryStopOtp()`.
 *
 * `POST /drivers/shipments/{shipmentId}/delivery/stops/{sequence}/verify-otp`
 *
 * All three are mandatory. Note that `sequence` is the stop's place within its
 * own shipment — the `sequence` field on the stop, not the trip-wide
 * `tripSequence`, which is what the path is keyed on alongside `shipmentId`.
 */
export interface VerifyStopOtpParams {
  shipmentId: string;
  sequence: number;
  otp: string;
}

/**
 * What the verify-otp endpoint answers with.
 *
 * Every field is optional: a 2xx is itself the confirmation, and the body is
 * only ever used for the status the stop moved to and a message to show.
 */
export interface VerifyStopOtpResult {
  verified?: boolean;
  status?: string;
  message?: string;
  shipmentId?: string;
  sequence?: number;
  completedAt?: Nullable<string>;
}

/**
 * Which piece of paperwork a proof is: `RECEIPT` for the signed delivery
 * receipt the POD sheet photographs first, `DELIVERED_GOODS` for the shot of
 * the cargo that follows it.
 *
 * These two are the whole of the backend's `ProofType` enum, and it answers a
 * 500 rather than a 400 for anything else:
 *
 *     Cannot deserialize value of type ProofType from String "pod": not one
 *     of the values accepted for Enum class: [RECEIPT, DELIVERED_GOODS]
 */
export type DeliveryProofType = 'RECEIPT' | 'DELIVERED_GOODS';

/**
 * Params for `submitDeliveryStopProof()`.
 *
 * `POST /drivers/shipments/{shipmentId}/delivery/stops/{sequence}/proofs`
 *
 * The photo itself never travels here — it is filed with the document service
 * first, and `docId` is the id that upload answered with. As with the OTP
 * calls, `sequence` is the stop's place within its own shipment.
 */
export interface DeliveryProofParams {
  shipmentId: string;
  sequence: number;
  type?: DeliveryProofType;
  /** The document service's id for the uploaded photo. */
  docId: string;
  /** When the photo was taken, ISO-8601. Defaults to now. */
  capturedAt?: string;
}

/**
 * What the proofs endpoint answers with. Every field is optional — a 2xx is
 * the confirmation, and the body is only read back for logging so far.
 */
export interface DeliveryProofResult {
  id?: string;
  type?: string;
  docId?: string;
  capturedAt?: Nullable<string>;
  message?: string;
  [key: string]: unknown;
}

/**
 * Params for `getDeliveryStopProofStatus()`.
 *
 * `GET /drivers/shipments/{shipmentId}/delivery/stops/{sequence}/proofs`
 *
 * Same two path parts as the POST — `sequence` is the stop's place within its
 * own shipment.
 */
export interface DeliveryProofStatusParams {
  shipmentId: string;
  sequence: number;
}

/**
 * Which of a stop's proofs the backend already holds.
 *
 * This is what decides where the POD sheet opens: a stop with its receipt
 * already filed skips straight to the goods photo, and one with both filed
 * skips to the receiver's code. Every field is optional — a stop with nothing
 * filed yet may answer with an empty body, which reads the same as all false.
 */
export interface DeliveryProofStatus {
  sequence?: number;
  /** The signed delivery receipt — step 1 of the POD sheet. */
  proofReceipt?: boolean;
  /** The shot of the unloaded cargo — step 2. */
  proofDeliveredGoods?: boolean;
  /** The backend's own read of "both filed, the code can go in now". */
  readyForOtp?: boolean;
}

/**
 * Params for `getDeliveryConfirmation()`.
 *
 * `GET /drivers/shipments/{shipmentId}/delivery/stops/{sequence}/delivery-confirmation`
 *
 * Same two path parts as the OTP and proofs calls — `sequence` is the stop's
 * place within its own shipment.
 */
export interface DeliveryConfirmationParams {
  shipmentId: string;
  sequence: number;
}

/**
 * The drop's confirmed-delivery summary, read once `verify-otp` has cleared
 * it — what the POD sheet's step 4 shows in place of a placeholder recap.
 */
export interface DeliveryConfirmation {
  shipmentId?: string;
  sequence?: number;
  awb?: string;
  deliveredTo?: Nullable<string>;
  completed?: boolean;
  completedAt?: Nullable<string>;
  verifiedBy?: Nullable<string>;
  deliveredAt?: Nullable<string>;
  distanceMiles?: number;
  payout?: Nullable<number>;
  proofs?: DeliveryProofResult[];
}

/** Params for the two list endpoints — `date` optional, as `YYYY-MM-DD`. */
export interface ShipmentListParams {
  date?: DateString;
}

/** Params for `getShipmentDetail()`. */
export interface ShipmentDetailParams {
  shipmentId: string;
}

/**
 * Body of one GPS ping — `updateDriverGps()`.
 *
 * `POST /drivers/gps/update`
 *
 * The backend keys the trace on the truck and the load it is running, so both
 * ids travel with every fix; the coordinate is the driver's position at the
 * moment the fix was taken, not when the request left the handset.
 */
export interface GpsPingParams extends Coordinates {
  truckId: string;
  shipmentId: string;
}

/**
 * What the ping endpoint answers with.
 *
 * Nothing on screen reads any of it — a 2xx is the whole point — so every
 * field is optional. `gpsPingId` and `recordedAt` are what the server filed
 * the fix as, and are logged so a trace can be matched up against the handset.
 */
export interface GpsPingResult {
  gpsPingId?: string;
  message?: string;
  recordedAt?: Nullable<string>;
}

// ── View models ──────────────────────────────────────────────────────────
// What `services/shipmentDetail` maps the payload INTO. Kept beside the wire
// shapes so a change on one side shows up as a type error on the other.

/**
 * A stop reduced to what the route strip renders.
 *
 * A `type` alias rather than an `interface` so it satisfies `RouteStop`'s
 * index signature — `<RouteStops>` is what draws these.
 */
export type DetailStop = {
  kind: 'pickup' | 'drop';
  /** The stop's street address; absent when the payload carried none. */
  label?: string;
  sub: string;
  lat: number;
  lng: number;
};

/** A contact card on the details screen. */
export interface DetailContact {
  id: 'pickup' | 'drop';
  kicker: string;
  name: string;
  role: string;
  phone: string;
  access: string;
  remarks: Nullable<string>;
}
