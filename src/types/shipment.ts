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

import type {DateString, Nullable} from './common';

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
}

/** Params for `getCurrentTrip()`. `tripId` is required; the fix is not. */
export interface CurrentTripParams {
  tripId: string;
  lat?: number;
  lon?: number;
}

/** Params for the two list endpoints — `date` optional, as `YYYY-MM-DD`. */
export interface ShipmentListParams {
  date?: DateString;
}

/** Params for `getShipmentDetail()`. */
export interface ShipmentDetailParams {
  shipmentId: string;
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
