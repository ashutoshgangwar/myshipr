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
} from '../types/shipment';
import type {
  DriverEarnings,
  DriverEarningsParams,
  EarningsPeriod,
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
  upcomingShipments: () => serviceUrl('drivers', '/drivers/shipments/upcoming'),
  pastShipments: () => serviceUrl('drivers', '/drivers/shipments/past'),
  fuelReward: () => serviceUrl('drivers', '/drivers/fuel/reward'),
  fuelPrice: () => serviceUrl('drivers', '/drivers/fuel/price'),
  hosCard: () => serviceUrl('drivers', '/drivers/hos/card'),
  monthlyMiles: () =>
    serviceUrl('drivers', '/drivers/shipments/get-monthly-miles'),

  monthlyEarnings: () =>
    serviceUrl('drivers', '/drivers/shipments/get-monthly-earnings'),

  monthlyTrips: () =>
    serviceUrl('drivers', '/drivers/shipments/get-monthly-trips'),

  earnings: () => serviceUrl('drivers', '/drivers/earnings'),
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
  return body?.data ?? body;
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
