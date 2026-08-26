/**
 * Driver-service API.
 *
 * Kept apart from `api.js`, which owns the session: tokens, refresh, login,
 * logout. This module only makes calls, and reuses that file's `apiClient` so
 * every request still picks up the bearer token, the 401-refresh-and-replay,
 * and the shared DEBUG logging.
 *
 * The gateway mounts this service under its own `/drivers` prefix, ahead of
 * the shared `/api/v1` — hence `serviceUrl('drivers', …)` rather than a plain
 * path. Auth is the odd one out in sitting at the root.
 */
import apiClient, {createApiLogger, serviceUrl} from './api';

const log = createApiLogger('[DriverAPI]');

export const DRIVER_ENDPOINTS = {
  /**
   * One trip as the driver sees it. `lat`/`lon` are optional query params —
   * sending the truck's position makes the backend answer with distance, ETA
   * and dead miles measured from where it actually is.
   */
  shipment: tripId =>
    serviceUrl('drivers', `/drivers/shipments/${encodeURIComponent(tripId)}`),

  /**
   * The signed-in driver's upcoming shipments — the Home "Upcoming Shipment"
   * list. `date` is an optional query param; without it the backend decides
   * the window itself, so nothing is sent by default.
   */
  upcomingShipments: () =>
    serviceUrl('drivers', '/drivers/shipments/upcoming'),

  /**
   * The signed-in driver's completed shipments — the PAST tab of the Shipment
   * table. Same shape and same optional `date` param as its upcoming twin.
   */
  pastShipments: () => serviceUrl('drivers', '/drivers/shipments/past'),

  /**
   * The signed-in driver's fuel-reward balance. The driver is read from the
   * bearer token, so the call takes no id and no query params.
   */
  fuelReward: () => serviceUrl('drivers', '/drivers/fuel/reward'),

  /**
   * The signed-in driver's hours-of-service card — duty status, minutes
   * driven against the daily driving limit, and when the 34-hour reset comes
   * available. Read from the bearer token, so it takes no id.
   */
  hosCard: () => serviceUrl('drivers', '/drivers/hos/card'),

  /**
   * The miles the signed-in driver has run this month — the dashboard's
   * "Monthly Miles" stat card, total plus a per-day breakdown. Read from the
   * bearer token, so it takes no id and no query params.
   */
  monthlyMiles: () =>
    serviceUrl('drivers', '/drivers/shipments/get-monthly-miles'),
};

/**
 * The driver's upcoming shipments — the Home "Upcoming Shipment" card.
 *
 * GET /drivers/api/v1/drivers/shipments/upcoming?date=YYYY-MM-DD
 * ← [{ tripId, awb, date, stops: [{sequence, type, address, from, to, ...}] }]
 *   (or the same list wrapped in an envelope: {data: {content|items: [...]}})
 *
 * The driver comes from the bearer token. `date` is optional and not defaulted
 * here — sent empty, the backend returns whatever it considers upcoming; sent
 * with a date, it filters to that day. Callers decide which they want.
 *
 * @param {{date?: string}} params `date` as YYYY-MM-DD
 * @returns {Promise<object[]>} the shipment list (envelope unwrapped)
 */
export const getUpcomingShipments = ({date} = {}) =>
  getShipmentList(DRIVER_ENDPOINTS.upcomingShipments(), 'upcoming', date);

/**
 * The driver's completed shipments — the PAST tab of the Shipment table.
 *
 * GET /drivers/api/v1/drivers/shipments/past?date=YYYY-MM-DD
 * ← the same list shape the upcoming endpoint returns.
 *
 * `date` is optional here too: without it the backend picks the window it
 * considers past, and with it the list narrows to that one day.
 *
 * @param {{date?: string}} params `date` as YYYY-MM-DD
 * @returns {Promise<object[]>} the shipment list (envelope unwrapped)
 */
export const getPastShipments = ({date} = {}) =>
  getShipmentList(DRIVER_ENDPOINTS.pastShipments(), 'past', date);

/**
 * The GET the two shipment-list endpoints share: an optional `date` query
 * param, a logged request and response, and the envelope unwrapped to an
 * array. `label` only names the endpoint in the log lines.
 *
 * @param {string} url
 * @param {string} label
 * @param {string} [date] YYYY-MM-DD
 * @returns {Promise<object[]>}
 */
const getShipmentList = async (url, label, date) => {
  const params = {};
  if (date) params.date = date;

  log(`${label} shipments request`, {url, ...params});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.get(url, {params}));
  } catch (err) {
    log(`${label} shipments failed`, {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  log(
    `${label} shipments response (${status})\n` +
      JSON.stringify(body, null, 2),
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
 * The driver's current trip — everything the Home "Current Trip" card shows.
 *
 * GET /drivers/api/v1/drivers/shipments/{tripId}?lat=&lon=
 * ← { tripId, awb, loadPayout, tripStatus: {startsIn, timeStatus},
 *     remainingHosMinutes, estimatedTripMinutes, deadMiles, shipmentType,
 *     remainingDistance, remainingETA, totalMiles, date,
 *     stops: [{sequence, shipmentId, tripSequence, type, address,
 *              lat, lon, from, to}] }
 *
 * `tripId` is required. The coordinate pair is not: without it the backend
 * still answers, just with `remainingDistance`, `remainingETA` and `deadMiles`
 * null and distances measured trip-wide. So a driver who has denied location —
 * or whose fix has not landed yet — still gets a card.
 *
 * @param {{tripId: string, lat?: number, lon?: number}} params
 * @returns {Promise<object>} the trip payload (envelope unwrapped)
 */
export const getCurrentTrip = async ({tripId, lat, lon} = {}) => {
  if (!tripId) {
    throw new Error('getCurrentTrip: tripId is required');
  }

  const params = {};
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    params.lat = lat;
    params.lon = lon;
  }

  const url = DRIVER_ENDPOINTS.shipment(tripId);
  log('current trip request', {url, ...params});

  let body;
  try {
    ({data: body} = await apiClient.get(url, {params}));
  } catch (err) {
    // The backend routes from the truck to the load, and answers 400
    // ("Unable to calculate trip route") when no road route exists — a driver
    // on the wrong continent to this load, or a bad fix. The coordinate is
    // optional, so drop it and ask again: distances then come out trip-wide
    // instead of truck-relative, which beats showing the driver an error.
    const unroutable = err?.response?.status === 400 && params.lat != null;
    if (!unroutable) throw err;

    log('current trip: coordinate unroutable, retrying without it');
    ({data: body} = await apiClient.get(url));
  }

  // Most endpoints wrap the payload in `data`; this one returns it flat, so
  // fall back to the body itself.
  const trip = body?.data ?? body;

  // The whole payload, pretty-printed and unmasked — nothing in it is a
  // credential, and which fields came back null is exactly what matters while
  // the card is being wired up.
  log('current trip response\n' + JSON.stringify(trip, null, 2));

  return trip;
};

/**
 * The driver's fuel-reward points — the "Your Points Balance" figure on the
 * Home Fuel Rewards card.
 *
 * GET /drivers/api/v1/drivers/fuel/reward
 * ← { driverId, totalRewardPoints }
 *
 * @returns {Promise<{driverId: string, totalRewardPoints: number}>}
 */
export const getFuelReward = async () => {
  const url = DRIVER_ENDPOINTS.fuelReward();
  log('fuel reward request', {url});

  let status;
  let body;
   console.log(("url", url), body)
  try {
    ({status, data: body} = await apiClient.get(url));
  } catch (err) {
    // Logged here as well as by the shared interceptor, so a failed balance is
    // visible next to its own request line rather than hunted for.
    log('fuel reward failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  // Same as the trip endpoint: unwrap `data` when the gateway sends an
  // envelope, otherwise take the body as-is.
  const reward = body?.data ?? body;

  // The raw body first — whether the gateway wrapped it in `data` is exactly
  // what this line answers — then the figure the card actually renders.
  log(`fuel reward response (${status})\n` + JSON.stringify(body, null, 2));
  log('fuel reward points', {
    driverId: reward?.driverId ?? null,
    totalRewardPoints: reward?.totalRewardPoints ?? null,
  });

  return reward;
};

/**
 * The driver's hours-of-service card — the Home "Hours of Service" panel.
 *
 * GET /drivers/api/v1/drivers/hos/card
 * ← { dutyStatus: "OFF_DUTY" | "ON_DUTY" | "DRIVING" | "SLEEPER_BERTH",
 *     drivenMinutes, totalDrivingMinutes, remainingDrivingMinutes,
 *     resetAvailableAt: ISO-8601 }
 *
 * The driver comes from the bearer token; there are no params.
 *
 * @returns {Promise<object>} the HOS payload (envelope unwrapped)
 */
export const getHosCard = async () => {
  const url = DRIVER_ENDPOINTS.hosCard();
  log('hos card request', {url});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.get(url));
  } catch (err) {
    log('hos card failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  // Flat on this endpoint, but the gateway wraps some services in `data` —
  // take whichever came back.
  const hos = body?.data ?? body;

  log(`hos card response (${status})\n` + JSON.stringify(body, null, 2));

  return hos;
};

/**
 * The driver's miles for the current month — the "Monthly Miles" stat card on
 * both the Home dashboard and the Earnings screen.
 *
 * GET /drivers/api/v1/drivers/shipments/get-monthly-miles
 * ← { totalMiles, dailyMiles: [{ miles, date: "YYYY-MM-DD" }] }
 *
 * The driver comes from the bearer token; there are no params. `dailyMiles`
 * only carries the days the driver actually drove, so it is shorter than the
 * month and can come back with a single entry — the sparkline is built to
 * cope with that rather than the caller padding it here.
 *
 * @returns {Promise<{totalMiles: number, dailyMiles: object[]}>} the payload
 *   (envelope unwrapped)
 */
export const getMonthlyMiles = async () => {
  const url = DRIVER_ENDPOINTS.monthlyMiles();
  log('monthly miles request', {url});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.get(url));
  } catch (err) {
    log('monthly miles failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  // Flat on this endpoint, but the gateway wraps some services in `data` —
  // take whichever came back.
  const miles = body?.data ?? body;

  log(`monthly miles response (${status})\n` + JSON.stringify(body, null, 2));

  return miles;
};
