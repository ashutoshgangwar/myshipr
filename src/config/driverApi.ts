import type {AxiosError} from 'axios';

import apiClient, {createApiLogger, serviceUrl} from './api';
import type {ApiErrorBody} from '../types/api';
import type {ErrorLike} from '../types/common';
import type {
  CurrentTrip,
  CurrentTripParams,
  ShipmentDetailParams,
  ShipmentDetailPayload,
  ShipmentListParams,
  ShipmentSummary,
  TripProgress,
  TripProgressParams,
  UpdateTripProgressParams,
  GpsPingParams,
  GpsPingResult,
  SendStopOtpParams,
  SendStopOtpResult,
  VerifyStopOtpParams,
  VerifyStopOtpResult,
  DeliveryProofParams,
  DeliveryProofResult,
  DeliveryProofStatus,
  DeliveryProofStatusParams,
} from '../types/shipment';
import type {
  CallContactsPayload,
  CallReservation,
  CallSessionParams,
  CallSessionResult,
  ReserveCallParams,
} from '../types/call';
import type {
  SaveFavoriteDestinationParams,
  SavedFavoriteDestination,
} from '../types/favoriteDestination';
import type {DriverBank, DriverProfile} from '../types/driver';
import type {
  AutoBidParams,
  AutoBidResult,
  BidDetail,
  BidDetailParams,
  BidSearchItem,
  BidSearchParams,
  BidSearchResult,
  PlaceBidParams,
  PlaceBidResult,
} from '../types/bidding';
import type {
  DriverEarnings,
  DriverEarningsParams,
  EarningsPeriod,
  PaymentDetails,
  PaymentDetailsParams,
  FuelPriceEntryParams,
  FuelPriceEntryResult,
  FuelPriceParams,
  FuelPriceResult,
  FuelReward,
  HosCard,
  MonthlyEarnings,
  MonthlyMiles,
  MonthlyTrips,
} from '../types/earnings';

type DriverApiError = AxiosError<ApiErrorBody> & ErrorLike;

const log = createApiLogger('[DriverAPI]');

export const DRIVER_ENDPOINTS = {

  shipment: (tripId: string) =>
    serviceUrl('drivers', `/drivers/shipments/${encodeURIComponent(tripId)}`),
  shipmentDetail: (shipmentId: string) =>
    serviceUrl(
      'drivers',
      `/drivers/shipments/${encodeURIComponent(shipmentId)}/detail`,
    ),
  shipmentProgress: (shipmentId: string) =>
    serviceUrl(
      'drivers',
      `/drivers/shipments/${encodeURIComponent(shipmentId)}/progress`,
    ),
  /** The stop's one-time code check — see `verifyDeliveryStopOtp`. */
  deliveryStopVerifyOtp: (shipmentId: string, sequence: number) =>
    serviceUrl(
      'drivers',
      `/drivers/shipments/${encodeURIComponent(shipmentId)}/delivery/stops/${encodeURIComponent(String(sequence))}/verify-otp`,
    ),
  /** Issues that stop a fresh code — see `sendDeliveryStopOtp`. */
  deliveryStopSendOtp: (shipmentId: string, sequence: number) =>
    serviceUrl(
      'drivers',
      `/drivers/shipments/${encodeURIComponent(shipmentId)}/delivery/stops/${encodeURIComponent(String(sequence))}/send-otp`,
    ),
  /** The stop's proof-of-delivery documents — see `submitDeliveryStopProof`. */
  deliveryStopProofs: (shipmentId: string, sequence: number) =>
    serviceUrl(
      'drivers',
      `/drivers/shipments/${encodeURIComponent(shipmentId)}/delivery/stops/${encodeURIComponent(String(sequence))}/proofs`,
    ),
  /** Who the driver may ring on a load — see `getShipmentCallContacts`. */
  shipmentCallContacts: (shipmentId: string) =>
    serviceUrl(
      'drivers',
      `/drivers/shipments/${encodeURIComponent(shipmentId)}/call-contacts`,
    ),
  /** Books a bridge number for one of them — see `reserveShipmentCall`. */
  shipmentCallReserve: (shipmentId: string) =>
    serviceUrl(
      'drivers',
      `/drivers/shipments/${encodeURIComponent(shipmentId)}/call/reserve`,
    ),
  /** Opens the reserved bridge — see `startDriverCall`. */
  callStart: (sessionId: string) =>
    serviceUrl('drivers', `/drivers/call/${encodeURIComponent(sessionId)}/start`),
  /** One position fix from the truck — see `updateDriverGps`. */
  gpsUpdate: () => serviceUrl('drivers', '/drivers/gps/update'),
  /** The driver's own record — see `getDriverProfile`. */
  profile: () => serviceUrl('drivers', '/drivers/profile'),
  /** The payout account behind the Bank details section — see `getDriverBank`. */
  bank: () => serviceUrl('drivers', '/drivers/bank'),
  upcomingShipments: () => serviceUrl('drivers', '/drivers/shipments/upcoming'),
  pastShipments: () => serviceUrl('drivers', '/drivers/shipments/past'),
  fuelReward: () => serviceUrl('drivers', '/drivers/fuel/reward'),
  fuelPrice: () => serviceUrl('drivers', '/drivers/fuel/price'),
  /** A price the driver reports — see `submitFuelPriceEntry`. */
  fuelPriceEntry: () => serviceUrl('drivers', '/drivers/fuel/price-entry'),
  hosCard: () => serviceUrl('drivers', '/drivers/hos/card'),
  /** Starts the driver's HOS clock for a load — see `startHosTrip`. */
  hosTripStart: () => serviceUrl('drivers', '/drivers/hos/trip-start'),
  monthlyMiles: () =>
    serviceUrl('drivers', '/drivers/shipments/get-monthly-miles'),

  monthlyEarnings: () =>
    serviceUrl('drivers', '/drivers/shipments/get-monthly-earnings'),

  monthlyTrips: () =>
    serviceUrl('drivers', '/drivers/shipments/get-monthly-trips'),

  earnings: () => serviceUrl('drivers', '/drivers/earnings'),

  /** Where the driver likes to end up — see `saveFavoriteDestination`. */
  favoriteDestinationSaveCoordinates: () =>
    serviceUrl('drivers', '/drivers/favorite-destinations/save-coordinates'),

  /** One load's payout breakdown — see `getPaymentDetails`. */
  paymentDetails: (shipmentId: string) =>
    serviceUrl(
      'drivers',
      `/drivers/earnings/${encodeURIComponent(shipmentId)}/payment-details`,
    ),

  /** A bid on one auction — see `placeBid`. */
  placeBid: (auctionId: string) =>
    serviceUrl('drivers', `/drivers/bids/${encodeURIComponent(auctionId)}/bid`),
  /** Set up auto-bidding on one auction — see `setAutoBid`. */
  autoBid: (auctionId: string) =>
    serviceUrl(
      'drivers',
      `/drivers/bids/${encodeURIComponent(auctionId)}/auto-bid`,
    ),
  /** The Bidding screen's list + header — see `searchBids`. */
  searchBids: () => serviceUrl('drivers', '/drivers/bids/search'),
  /** One auction's full detail — see `getBidDetail`. */
  bidDetail: (auctionId: string) =>
    serviceUrl(
      'drivers',
      `/drivers/bids/${encodeURIComponent(auctionId)}/detail`,
    ),
};

export const EARNINGS_PERIODS = [
  'ALL',
  'WEEKLY',
  'MONTHLY',
  'YEARLY',
] as const satisfies readonly EarningsPeriod[];

/**
 * @param {{date?: string}} params `date` as YYYY-MM-DD
 * @returns {Promise<object[]>} the shipment list (envelope unwrapped)
 */
export const getUpcomingShipments = ({
  date,
}: ShipmentListParams = {}): Promise<ShipmentSummary[]> =>
  getShipmentList(DRIVER_ENDPOINTS.upcomingShipments(), 'upcoming', date);

/**
 * @param {{date?: string}} params `date` as YYYY-MM-DD
 * @returns {Promise<object[]>} the shipment list (envelope unwrapped)
 */
export const getPastShipments = ({
  date,
}: ShipmentListParams = {}): Promise<ShipmentSummary[]> =>
  getShipmentList(DRIVER_ENDPOINTS.pastShipments(), 'past', date);

/**
 * @param {{shipmentId: string}} params
 * @returns {Promise<object>} the detail payload (envelope unwrapped)
 */
export const getShipmentDetail = async ({
  shipmentId,
}: Partial<ShipmentDetailParams> = {}): Promise<ShipmentDetailPayload> => {
  if (!shipmentId) {
    throw new Error('getShipmentDetail: shipmentId is required');
  }

  const url = DRIVER_ENDPOINTS.shipmentDetail(shipmentId);

  log('shipment detail request', {url, shipmentId});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.get(url));
  } catch (e) {
    const err = e as DriverApiError;
    log('shipment detail failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  log(`shipment detail response (${status})\n` + JSON.stringify(body, null, 2));

  const data = body?.data ?? body;
  console.log(
    '[DriverAPI] shipment detail data',
    JSON.stringify(data, null, 2),
  );
  return data;
};

/**
 * How far through the trip the driver is: the pre-trip inspection, plus every
 * stop with the status it currently carries. Called when the map screen opens,
 * and again each time a stop is verified.
 *
 * @param {{shipmentId: string}} params
 * @returns {Promise<object>} the progress payload (envelope unwrapped)
 */
export const getShipmentProgress = async ({
  shipmentId,
}: Partial<TripProgressParams> = {}): Promise<TripProgress> => {
  if (!shipmentId) {
    throw new Error('getShipmentProgress: shipmentId is required');
  }

  const url = DRIVER_ENDPOINTS.shipmentProgress(shipmentId);

  log('shipment progress request', {url, shipmentId});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.get(url));
  } catch (e) {
    const err = e as DriverApiError;
    log('shipment progress failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  log(
    `shipment progress response (${status})\n` + JSON.stringify(body, null, 2),
  );

  return body?.data ?? body;
};

/**
 * @param params the trip's `tripId` and the `status` to record
 * @returns the progress payload the update replies with (envelope unwrapped)
 */
export const updateShipmentProgress = async ({
  tripId,
  status: nextStatus,
}: Partial<UpdateTripProgressParams> = {}): Promise<TripProgress> => {
  if (!tripId) {
    throw new Error('updateShipmentProgress: tripId is required');
  }
  if (!nextStatus) {
    throw new Error('updateShipmentProgress: status is required');
  }

  const url = DRIVER_ENDPOINTS.shipmentProgress(tripId);

  log('update shipment progress request', {url, tripId, status: nextStatus});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.post(url, {status: nextStatus}));
  } catch (e) {
    const err = e as DriverApiError;
    log('update shipment progress failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  log(
    `update shipment progress response (${status})\n` +
      JSON.stringify(body, null, 2),
  );

  return body?.data ?? body;
};

/**
 * @param params `shipmentId` and the stop's `sequence`, both required
 * @returns the send payload (envelope unwrapped)
 */
export const sendDeliveryStopOtp = async ({
  shipmentId,
  sequence,
}: Partial<SendStopOtpParams> = {}): Promise<SendStopOtpResult> => {
  if (!shipmentId) {
    throw new Error('sendDeliveryStopOtp: shipmentId is required');
  }
  if (!Number.isFinite(Number(sequence))) {
    throw new Error('sendDeliveryStopOtp: sequence is required');
  }

  const url = DRIVER_ENDPOINTS.deliveryStopSendOtp(shipmentId, Number(sequence));

  log('send stop otp request', {url, shipmentId, sequence});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.post(url));
  } catch (e) {
    const err = e as DriverApiError;
    log('send stop otp failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  log(`send stop otp response (${status})\n` + JSON.stringify(body, null, 2));

  return body?.data ?? body ?? {};
};

/**

 * @param params `shipmentId`, the stop's `sequence` and the 6-digit `otp` —
 *   all three required
 * @returns the verification payload (envelope unwrapped)
 */
export const verifyDeliveryStopOtp = async ({
  shipmentId,
  sequence,
  otp,
}: Partial<VerifyStopOtpParams> = {}): Promise<VerifyStopOtpResult> => {
  if (!shipmentId) {
    throw new Error('verifyDeliveryStopOtp: shipmentId is required');
  }
  if (!Number.isFinite(Number(sequence))) {
    throw new Error('verifyDeliveryStopOtp: sequence is required');
  }
  const code = String(otp ?? '').trim();
  if (!code) {
    throw new Error('verifyDeliveryStopOtp: otp is required');
  }

  const url = DRIVER_ENDPOINTS.deliveryStopVerifyOtp(shipmentId, Number(sequence));

  // The code itself is a credential — logged as its length, never its digits.
  log('verify stop otp request', {url, shipmentId, sequence, otpLength: code.length});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.post(url, {otp: code}));
  } catch (e) {
    const err = e as DriverApiError;
    log('verify stop otp failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  log(`verify stop otp response (${status})\n` + JSON.stringify(body, null, 2));

  return body?.data ?? body ?? {};
};

/**
 * Files one photographed document against a delivery stop, once the document
 * service has stored the photo and given it an id.
 *
 * `POST /drivers/shipments/{shipmentId}/delivery/stops/{sequence}/proofs`
 *
 * @param params `shipmentId`, the stop's `sequence` and the `docId` the
 *   upload answered with; `type` defaults to the signed receipt and
 *   `capturedAt` to now
 * @returns the stored proof (envelope unwrapped)
 */
export const submitDeliveryStopProof = async ({
  shipmentId,
  sequence,
  type = 'RECEIPT',
  docId,
  capturedAt,
}: Partial<DeliveryProofParams> = {}): Promise<DeliveryProofResult> => {
  if (!shipmentId) {
    throw new Error('submitDeliveryStopProof: shipmentId is required');
  }
  if (!Number.isFinite(Number(sequence))) {
    throw new Error('submitDeliveryStopProof: sequence is required');
  }
  if (!docId) {
    throw new Error('submitDeliveryStopProof: docId is required');
  }

  const url = DRIVER_ENDPOINTS.deliveryStopProofs(shipmentId, Number(sequence));
  const payload = {
    type,
    docId,
    capturedAt: capturedAt || new Date().toISOString(),
  };

  log('delivery proof request', {url, ...payload});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.post(url, payload));
  } catch (e) {
    const err = e as DriverApiError;
    log('delivery proof failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  log(`delivery proof response (${status})\n` + JSON.stringify(body, null, 2));

  return body?.data ?? body ?? {};
};

/**
 * Which of a stop's proofs of delivery the backend already holds.
 *
 * `GET /drivers/shipments/{shipmentId}/delivery/stops/{sequence}/proofs`
 *
 * Asked before the POD sheet opens, so a driver who has already photographed
 * the receipt — on an earlier attempt, or from another device — is not made
 * to photograph it a second time. The sheet opens on the first step the stop
 * is still missing.
 *
 * @param params `shipmentId` and the stop's `sequence`, both required
 * @returns the stop's proof flags (envelope unwrapped)
 */
export const getDeliveryStopProofStatus = async ({
  shipmentId,
  sequence,
}: Partial<DeliveryProofStatusParams> = {}): Promise<DeliveryProofStatus> => {
  if (!shipmentId) {
    throw new Error('getDeliveryStopProofStatus: shipmentId is required');
  }
  if (!Number.isFinite(Number(sequence))) {
    throw new Error('getDeliveryStopProofStatus: sequence is required');
  }

  const url = DRIVER_ENDPOINTS.deliveryStopProofs(shipmentId, Number(sequence));

  log('delivery proof status request', {url, shipmentId, sequence});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.get(url));
  } catch (e) {
    const err = e as DriverApiError;
    log('delivery proof status failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  log(
    `delivery proof status response (${status})\n` +
      JSON.stringify(body, null, 2),
  );

  return body?.data ?? body ?? {};
};

/**
 * @param params `shipmentId`, required
 * @returns the contacts payload (envelope unwrapped)
 */
export const getShipmentCallContacts = async ({
  shipmentId,
}: {shipmentId?: string} = {}): Promise<CallContactsPayload> => {
  if (!shipmentId) {
    throw new Error('getShipmentCallContacts: shipmentId is required');
  }

  const url = DRIVER_ENDPOINTS.shipmentCallContacts(shipmentId);

  log('call contacts request', {url, shipmentId});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.get(url));
  } catch (e) {
    const err = e as DriverApiError;
    log('call contacts failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  log(`call contacts response (${status})\n` + JSON.stringify(body, null, 2));

  return body?.data ?? body ?? {};
};

/**
 * @param params `shipmentId`, the contact's `type` and `phoneType`, and the
 *   stop's `sequence` on a multi-stop load
 * @returns the reservation (envelope unwrapped)
 */
export const reserveShipmentCall = async ({
  shipmentId,
  type,
  phoneType,
  sequence,
}: Partial<ReserveCallParams> = {}): Promise<CallReservation> => {
  if (!shipmentId) {
    throw new Error('reserveShipmentCall: shipmentId is required');
  }
  if (!type) {
    throw new Error('reserveShipmentCall: type is required');
  }
  if (!phoneType) {
    throw new Error('reserveShipmentCall: phoneType is required');
  }

  const url = DRIVER_ENDPOINTS.shipmentCallReserve(shipmentId);

  // Query params, not a body — the same shape the rest of this controller
  // takes (`start` and `end` carry `fencingToken` the same way).
  const params: {
    type: string;
    phoneType: string;
    sequence?: string;
  } = {type, phoneType};

  // The endpoint declares `sequence` as a string even though the contacts
  // payload sends it as a number, so the conversion happens here rather than
  // leaking a stringly-typed stop number through the app.
  const stop = String(sequence ?? '').trim();
  if (stop) {
    params.sequence = stop;
  }

  log('reserve call request', {url, shipmentId, ...params});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.post(url, undefined, {params}));
  } catch (e) {
    const err = e as DriverApiError;
    log('reserve call failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  // `callNumber` is the bridge, not the contact's own line, so it is safe to
  // log — `fencingToken` is a credential and is logged as present/absent only.
  const reservation = body?.data ?? body ?? {};
  log(`reserve call response (${status})`, {
    sessionId: reservation?.sessionId ?? null,
    callNumber: reservation?.callNumber ?? null,
    fencingToken: reservation?.fencingToken ? '***' : null,
    reservedUntil: reservation?.reservedUntil ?? null,
    maxDurationSecs: reservation?.maxDurationSecs ?? null,
  });

  return reservation;
};

/**
 * @param params the `sessionId` and `fencingToken` the reservation answered with
 * @returns the session payload (envelope unwrapped)
 */
export const startDriverCall = async ({
  sessionId,
  fencingToken,
}: Partial<CallSessionParams> = {}): Promise<CallSessionResult> => {
  if (!sessionId) {
    throw new Error('startDriverCall: sessionId is required');
  }
  if (!fencingToken) {
    throw new Error('startDriverCall: fencingToken is required');
  }

  const url = DRIVER_ENDPOINTS.callStart(sessionId);

  // The token is a credential — logged as present, never as its value.
  log('start call request', {url, sessionId, fencingToken: '***'});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.post(url, undefined, {
      params: {fencingToken},
    }));
  } catch (e) {
    const err = e as DriverApiError;
    log('start call failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  log(`start call response (${status})\n` + JSON.stringify(body, null, 2));

  return body?.data ?? body ?? {};
};

/**
 * @param {string} url
 * @param {string} label
 * @param {string} [date] YYYY-MM-DD
 * @returns {Promise<object[]>}
 */
const getShipmentList = async (
  url: string,
  label: string,
  date?: string,
): Promise<ShipmentSummary[]> => {
  const params: {date?: string} = {};
  if (date) params.date = date;

  log(`${label} shipments request`, {url, ...params});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.get(url, {params}));
  } catch (e) {
    const err = e as DriverApiError;
    log(`${label} shipments failed`, {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  log(
    `${label} shipments response (${status})\n` + JSON.stringify(body, null, 2),
  );

  // The list may arrive bare, under `data`, or paged under `content`/`items` —
  // unwrap whichever envelope the gateway used and always hand back an array.
  const payload = body?.data ?? body;
  const list = Array.isArray(payload)
    ? payload
    : payload?.content ?? payload?.items ?? payload?.shipments ?? [];

  return Array.isArray(list) ? list : [];
};

/**
 * @param {{tripId: string, lat?: number, lon?: number}} params
 * @returns {Promise<object>} the trip payload (envelope unwrapped)
 */
export const getCurrentTrip = async ({
  tripId,
  lat,
  lon,
}: Partial<CurrentTripParams> = {}): Promise<CurrentTrip> => {
  if (!tripId) {
    throw new Error('getCurrentTrip: tripId is required');
  }

  const params: {lat?: number; lon?: number} = {};
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    params.lat = lat;
    params.lon = lon;
  }

  const url = DRIVER_ENDPOINTS.shipment(tripId);
  log('current trip request', {url, ...params});

  let body;
  try {
    ({data: body} = await apiClient.get(url, {params}));
  } catch (e) {
    const err = e as DriverApiError;
    const unroutable = err?.response?.status === 400 && params.lat != null;
    if (!unroutable) throw err;

    log('current trip: coordinate unroutable, retrying without it');
    ({data: body} = await apiClient.get(url));
  }
  const trip = body?.data ?? body;

  log('current trip response\n' + JSON.stringify(trip, null, 2));

  return trip;
};

/**
 * @param params `truckId`, `shipmentId` and the coordinate, all required
 * @returns what the server filed the fix as (envelope unwrapped)
 */
export const updateDriverGps = async ({
  truckId,
  shipmentId,
  latitude,
  longitude,
}: Partial<GpsPingParams> = {}): Promise<GpsPingResult> => {
  if (!truckId) {
    throw new Error('updateDriverGps: truckId is required');
  }
  if (!shipmentId) {
    throw new Error('updateDriverGps: shipmentId is required');
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('updateDriverGps: latitude and longitude are required');
  }

  const url = DRIVER_ENDPOINTS.gpsUpdate();
  const payload = {truckId, shipmentId, latitude, longitude};

  log('gps update request', {url, ...payload});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.post(url, payload));
  } catch (e) {
    const err = e as DriverApiError;
    log('gps update failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  log(
    `gps update response (${status})\n` +
      (body == null || body === '' ? '(no body)' : JSON.stringify(body, null, 2)),
  );

  return body?.data ?? body ?? {};
};

/**
 * @returns {Promise<{driverId: string, totalRewardPoints: number}>}
 */
export const getFuelReward = async (): Promise<FuelReward> => {
  const url = DRIVER_ENDPOINTS.fuelReward();
  log('fuel reward request', {url});

  let status;
  let body;
  console.log('url', url, body);
  try {
    ({status, data: body} = await apiClient.get(url));
  } catch (e) {
    const err = e as DriverApiError;
    log('fuel reward failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  const reward = body?.data ?? body;
  log(`fuel reward response (${status})\n` + JSON.stringify(body, null, 2));
  log('fuel reward points', {
    driverId: reward?.driverId ?? null,
    totalRewardPoints: reward?.totalRewardPoints ?? null,
  });

  return reward;
};

/**
 * @param {{latitude: number, longitude: number}} params
 * @returns {Promise<object>} the payload plus `available`, or
 *   `{available: false, message}` when the driver is outside the US
 */
export const getFuelPrice = async ({
  latitude,
  longitude,
}: Partial<FuelPriceParams> = {}): Promise<FuelPriceResult> => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('getFuelPrice: latitude and longitude are required');
  }

  const url = DRIVER_ENDPOINTS.fuelPrice();
  const params = {latitude, longitude};
  log('fuel price request', {url, ...params});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.get(url, {params}));
  } catch (e) {
    const err = e as DriverApiError;
    const failure = err?.response?.status ?? null;
    const message = err?.response?.data?.message ?? err?.message ?? null;
    log('fuel price failed', {url, status: failure, body: err?.response?.data ?? message});

    // 400 is how the backend says "not a US state" — the one refusal the badge
    // can render, so it is handed back rather than thrown.
    if (failure === 400) {
      return {available: false, message, pricePerGallon: null, fscPerMile: null};
    }
    throw err;
  }

  // Flat on this endpoint, but the gateway wraps some services in `data` —
  // take whichever came back.
  const price = body?.data ?? body;

  log(`fuel price response (${status})\n` + JSON.stringify(body, null, 2));

  return {...price, available: true};
};

/**
 * @returns the entry's id, the points it earned, and the server's message
 */
export const submitFuelPriceEntry = async ({
  pricePerGallon,
  latitude,
  longitude,
  stationName,
  hereStationId,
}: Partial<FuelPriceEntryParams> = {}): Promise<FuelPriceEntryResult> => {
  if (!Number.isFinite(pricePerGallon) || (pricePerGallon as number) <= 0) {
    throw new Error('submitFuelPriceEntry: pricePerGallon must be above zero');
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('submitFuelPriceEntry: latitude and longitude are required');
  }

  const url = DRIVER_ENDPOINTS.fuelPriceEntry();
  const name = stationName?.trim();
  const placeId = hereStationId?.trim();
  // Both are optional: an empty one is left out rather than sent as "".
  const payload = {
    pricePerGallon,
    latitude,
    longitude,
    ...(name ? {stationName: name} : {}),
    ...(placeId ? {hereStationId: placeId} : {}),
  };
  log('fuel price entry request', {url, ...payload});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.post(url, payload));
  } catch (e) {
    const err = e as DriverApiError;
    log('fuel price entry failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  log(`fuel price entry response (${status})\n` + JSON.stringify(body, null, 2));

  return body?.data ?? body ?? {};
};

/**
 * @returns {Promise<object>} the HOS payload (envelope unwrapped)
 */
export const getHosCard = async (): Promise<HosCard> => {
  const url = DRIVER_ENDPOINTS.hosCard();
  log('hos card request', {url});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.get(url));
  } catch (e) {
    const err = e as DriverApiError;
    log('hos card failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  const hos = body?.data ?? body;

  log(`hos card response (${status})\n` + JSON.stringify(body, null, 2));

  return hos;
};

export const startHosTrip = async (): Promise<void> => {
  const url = DRIVER_ENDPOINTS.hosTripStart();

  log('hos trip start request', {url});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.post(url));
  } catch (e) {
    const err = e as DriverApiError;
    log('hos trip start failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  // A 200 with an empty body is this endpoint's success, so most of the time
  // the status is the whole answer — said in as many words rather than logged
  // as an empty string, which reads like the body went missing.
  log(
    `hos trip start response (${status})\n` +
      (body == null || body === '' ? '(no body)' : JSON.stringify(body, null, 2)),
  );
};

/**
 * @returns {Promise<{totalMiles: number, dailyMiles: object[]}>} the payload
 *   (envelope unwrapped)
 */
export const getMonthlyMiles = async (): Promise<MonthlyMiles> => {
  const url = DRIVER_ENDPOINTS.monthlyMiles();
  log('monthly miles request', {url});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.get(url));
  } catch (e) {
    const err = e as DriverApiError;
    log('monthly miles failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  const miles = body?.data ?? body;

  log(`monthly miles response (${status})\n` + JSON.stringify(body, null, 2));

  return miles;
};

/**
 * @returns {Promise<{totalEarnings: number, dailyEarnings: object[]}>} the
 *   payload (envelope unwrapped)
 */
export const getMonthlyEarnings = async (): Promise<MonthlyEarnings> => {
  const url = DRIVER_ENDPOINTS.monthlyEarnings();
  log('monthly earnings request', {url});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.get(url));
  } catch (e) {
    const err = e as DriverApiError;
    log('monthly earnings failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  // Flat on this endpoint, but the gateway wraps some services in `data` —
  // take whichever came back.
  const earnings = body?.data ?? body;

  log(
    `monthly earnings response (${status})\n` + JSON.stringify(body, null, 2),
  );

  return earnings;
};

/**
 * @returns {Promise<{totalTrips: number, dailyTrips: object[]}>} the payload
 *   (envelope unwrapped)
 */
export const getMonthlyTrips = async (): Promise<MonthlyTrips> => {
  const url = DRIVER_ENDPOINTS.monthlyTrips();
  log('monthly trips request', {url});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.get(url));
  } catch (e) {
    const err = e as DriverApiError;
    log('monthly trips failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  // Flat on this endpoint, but the gateway wraps some services in `data` —
  // take whichever came back.
  const trips = body?.data ?? body;

  log(`monthly trips response (${status})\n` + JSON.stringify(body, null, 2));

  return trips;
};

/**
 * @param {{period?: string}} params
 * @returns {Promise<{period: string, grossEarnings: number,
 *                    shipments: object[]}>} the payload (envelope unwrapped)
 */
export const getDriverEarnings = async ({
  period,
}: DriverEarningsParams = {}): Promise<DriverEarnings> => {
  const url = DRIVER_ENDPOINTS.earnings();
  const wanted = String(period ?? '').toUpperCase() as EarningsPeriod;
  const params: {period?: EarningsPeriod} = EARNINGS_PERIODS.includes(wanted)
    ? {period: wanted}
    : {};

  log('earnings request', {url, ...params});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.get(url, {params}));
  } catch (e) {
    const err = e as DriverApiError;
    log('earnings failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  const earnings = body?.data ?? body;

  log(`earnings response (${status})\n` + JSON.stringify(body, null, 2));

  return earnings;
};

/**
 * @param {{shipmentId: string}} params the id off the tapped earnings row
 * @returns {Promise<object>} the payment-details payload (envelope unwrapped)
 */
export const getPaymentDetails = async ({
  shipmentId,
}: Partial<PaymentDetailsParams> = {}): Promise<PaymentDetails> => {
  if (!shipmentId) {
    throw new Error('getPaymentDetails: shipmentId is required');
  }

  const url = DRIVER_ENDPOINTS.paymentDetails(shipmentId);

  log('payment details request', {url, shipmentId});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.get(url));
  } catch (e) {
    const err = e as DriverApiError;
    log('payment details failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  log(
    `payment details response (${status})\n` + JSON.stringify(body, null, 2),
  );

  const data = body?.data ?? body;
  console.log(
    '[DriverAPI] payment details data',
    JSON.stringify(data, null, 2),
  );
  return data;
};

/**
 * @param params the coordinate, plus whichever address parts are known
 * @returns what the server filed (envelope unwrapped)
 */
export const saveFavoriteDestination = async ({
  latitude,
  longitude,
  address,
  landMark,
  city,
  state,
  zipCode,
}: Partial<SaveFavoriteDestinationParams> = {}): Promise<SavedFavoriteDestination> => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error(
      'saveFavoriteDestination: latitude and longitude are required',
    );
  }
  if (
    (latitude as number) < -90 ||
    (latitude as number) > 90 ||
    (longitude as number) < -180 ||
    (longitude as number) > 180
  ) {
    throw new Error('saveFavoriteDestination: coordinate is out of range');
  }

  const url = DRIVER_ENDPOINTS.favoriteDestinationSaveCoordinates();
  // Sent in full rather than pruned: the endpoint's own example carries every
  // key, and an empty string is how "the driver left it blank" is spelled.
  const payload = {
    latitude,
    longitude,
    address: address ?? '',
    landMark: landMark ?? '',
    city: city ?? '',
    state: state ?? '',
    zipCode: zipCode ?? '',
  };

  console.log(
    `[DriverAPI] favorite destination save request\nPOST ${url}\n` +
      JSON.stringify(payload, null, 2),
  );

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.post(url, payload));
  } catch (e) {
    const err = e as DriverApiError;
    console.log(
      `[DriverAPI] favorite destination save FAILED (${err?.response?.status ?? 'no status'})\n` +
        JSON.stringify(err?.response?.data ?? err?.message, null, 2),
    );
    throw err;
  }

  console.log(
    `[DriverAPI] favorite destination save response (${status})\n` +
      (body == null || body === '' ? '(no body)' : JSON.stringify(body, null, 2)),
  );

  return body?.data ?? body ?? {};
};

/**
 * The signed-in driver's profile — name, photo, licence, personal details and
 * address. The access token identifies the driver, so this takes nothing.
 *
 * @returns {Promise<DriverProfile>} the payload (envelope unwrapped)
 */
export const getDriverProfile = async (): Promise<DriverProfile> => {
  const url = DRIVER_ENDPOINTS.profile();
  log('driver profile request', {url});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.get(url));
  } catch (e) {
    const err = e as DriverApiError;
    log('driver profile failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  const profile = body?.data ?? body;
  log(`driver profile response (${status})\n` + JSON.stringify(body, null, 2));

  return profile ?? {};
};

/**
 * The driver's payout account. Only the bank, the holder and the last four
 * digits come back — the account number itself stays in the back office.
 *
 * @returns {Promise<DriverBank>} the payload (envelope unwrapped)
 */
export const getDriverBank = async (): Promise<DriverBank> => {
  const url = DRIVER_ENDPOINTS.bank();
  log('driver bank request', {url});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.get(url));
  } catch (e) {
    const err = e as DriverApiError;
    log('driver bank failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  const bank = body?.data ?? body;
  log(`driver bank response (${status})\n` + JSON.stringify(body, null, 2));

  return bank ?? {};
};

/**
 * Places the driver's bid on an auction. Only `auctionId` is required; the
 * body fields are all optional and any left unset are not sent.
 *
 * @returns the bid as the server recorded it (envelope unwrapped)
 */
export const placeBid = async ({
  auctionId,
  amountCents,
  assetId,
  idempotencyKey,
  correlationId,
}: PlaceBidParams): Promise<PlaceBidResult> => {
  if (!auctionId) {
    throw new Error('placeBid: auctionId is required');
  }

  const url = DRIVER_ENDPOINTS.placeBid(auctionId);
  const payload = {
    ...(Number.isFinite(amountCents) ? {amountCents} : {}),
    ...(Number.isFinite(assetId) ? {assetId} : {}),
    ...(idempotencyKey ? {idempotencyKey} : {}),
    ...(correlationId ? {correlationId} : {}),
  };
  log(
    `place bid request\nshipmentId (auctionId): ${auctionId}\nPOST ${url}\n` +
      JSON.stringify(payload, null, 2),
  );

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.post(url, payload));
  } catch (e) {
    const err = e as DriverApiError;
    log(
      `place bid failed (${err?.response?.status ?? 'no response'})\nPOST ${url}\n` +
        JSON.stringify(err?.response?.data ?? err?.message, null, 2),
    );
    throw err;
  }

  log(
    `place bid response (${status})\nPOST ${url}\n` +
      JSON.stringify(body, null, 2),
  );

  return body?.data ?? body;
};

/**
 * Sets up auto-bidding on an auction. `auctionId` (path) is required; `assetId`
 * is the truck from the eligible-vehicle picker and is only sent when known.
 *
 * @returns the auto-bid as the server recorded it (envelope unwrapped)
 */
export const setAutoBid = async ({
  auctionId,
  assetId,
  mode,
  stopLossCents,
}: AutoBidParams): Promise<AutoBidResult> => {
  if (!auctionId) {
    throw new Error('setAutoBid: auctionId is required');
  }

  const url = DRIVER_ENDPOINTS.autoBid(auctionId);
  const payload = {
    ...(Number.isFinite(assetId) ? {assetId} : {}),
    mode,
    stopLossCents,
  };
  log(`auto bid request\nPOST ${url}\n` + JSON.stringify(payload, null, 2));

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.post(url, payload));
  } catch (e) {
    const err = e as DriverApiError;
    log(
      `auto bid failed (${err?.response?.status ?? 'no response'})\nPOST ${url}\n` +
        JSON.stringify(err?.response?.data ?? err?.message, null, 2),
    );
    throw err;
  }

  log(`auto bid response (${status})\nPOST ${url}\n` + JSON.stringify(body, null, 2));

  return body?.data ?? body;
};

/**
 * Searches the driver's bids — the Bidding screen's list and the counts behind
 * its four header cards. `status` is always sent; the screen adds the search
 * text and filter fields only once the driver has set them.
 *
 * @returns `{summary, content}`, whichever envelope the gateway used unwrapped.
 *   `summary` is null when the backend sent none, and `content` is always an
 *   array — an empty one when there are no matching auctions.
 */
export const searchBids = async (
  params: BidSearchParams,
): Promise<BidSearchResult> => {
  const url = DRIVER_ENDPOINTS.searchBids();
  log(`search bids request\nPOST ${url}\n` + JSON.stringify(params, null, 2));

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.post(url, params));
  } catch (e) {
    const err = e as DriverApiError;
    log(
      `search bids failed (${err?.response?.status ?? 'no response'})\nPOST ${url}\n` +
        JSON.stringify(err?.response?.data ?? err?.message, null, 2),
    );
    throw err;
  }

  log(`search bids response (${status})\n` + JSON.stringify(body, null, 2));

  // The rows may arrive bare, under `data`, or paged under `content`/`items`.
  const payload = body?.data ?? body;
  const content: BidSearchItem[] = Array.isArray(payload)
    ? payload
    : payload?.content ?? payload?.items ?? [];

  return {
    summary: payload?.summary ?? null,
    content: Array.isArray(content) ? content : [],
  };
};

/**
 * Loads one auction's full detail — the ActiveBidding screen. `auctionId` is the
 * only required field, and it is the same id the bid is placed against.
 *
 * @returns the detail payload (envelope unwrapped)
 */
export const getBidDetail = async ({
  auctionId,
}: BidDetailParams): Promise<BidDetail> => {
  if (!auctionId) {
    throw new Error('getBidDetail: auctionId is required');
  }

  const url = DRIVER_ENDPOINTS.bidDetail(auctionId);
  log('bid detail request', {url});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.get(url));
  } catch (e) {
    const err = e as DriverApiError;
    log(
      `bid detail failed (${err?.response?.status ?? 'no response'})\nGET ${url}\n` +
        JSON.stringify(err?.response?.data ?? err?.message, null, 2),
    );
    throw err;
  }

  log(`bid detail response (${status})\n` + JSON.stringify(body, null, 2));

  return body?.data ?? body;
};
