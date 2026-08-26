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
  upcomingShipments: () => serviceUrl('drivers', '/drivers/shipments/upcoming'),

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
   * The pump price of diesel where the driver is standing — the header's
   * DIESEL badge. `latitude`/`longitude` are both required query params, and
   * the backend only holds prices for US states.
   */
  fuelPrice: () => serviceUrl('drivers', '/drivers/fuel/price'),

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

  /**
   * What the signed-in driver has earned this month — the dashboard's
   * "Monthly Earnings" stat card, total plus a per-day breakdown. The miles
   * endpoint's twin, and read from the bearer token the same way.
   */
  monthlyEarnings: () =>
    serviceUrl('drivers', '/drivers/shipments/get-monthly-earnings'),

  /**
   * The trips the signed-in driver has run this month — the dashboard's
   * "Total Trips" stat card, total plus a per-day breakdown. The third of the
   * monthly trio, and read from the bearer token the same way.
   */
  monthlyTrips: () =>
    serviceUrl('drivers', '/drivers/shipments/get-monthly-trips'),

  /**
   * The signed-in driver's earnings ledger — the Earnings screen's gross
   * figure and the loads behind it. `period` is an optional query param
   * (ALL / WEEKLY / MONTHLY / YEARLY); the driver is read from the bearer
   * token, so there is no id.
   */
  earnings: () => serviceUrl('drivers', '/drivers/earnings'),
};

/** The periods `GET /drivers/earnings` filters by. */
export const EARNINGS_PERIODS = ['ALL', 'WEEKLY', 'MONTHLY', 'YEARLY'];

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
  console.log(('url', url), body);
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
 * The pump price of diesel where the driver is — the DIESEL badge in the
 * dashboard header.
 *
 * GET /drivers/api/v1/drivers/fuel/price?latitude=&longitude=
 * ← { stateCode, stateName, addressLabel, pricePerGallon, fscPerMile,
 *     fetchedAt, stale, source }
 *
 * Both coordinates are required — the backend resolves them to a state and
 * only holds prices for the US, answering 400 ("Fuel price is available for US
 * states only (got IND)") anywhere else. That is a fact about where the truck
 * is parked, not a failure, so it comes back as `{available: false, message}`
 * rather than thrown: the badge reads the message and shows N/A. Every other
 * status still throws, the way the rest of this file does.
 *
 * @param {{latitude: number, longitude: number}} params
 * @returns {Promise<object>} the payload plus `available`, or
 *   `{available: false, message}` when the driver is outside the US
 */
export const getFuelPrice = async ({latitude, longitude} = {}) => {
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
  } catch (err) {
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

/**
 * The driver's earnings for the current month — the "Monthly Earnings" stat
 * card on both the Home dashboard and the Earnings screen.
 *
 * GET /drivers/api/v1/drivers/shipments/get-monthly-earnings
 * ← { totalEarnings, dailyEarnings: [{ earnings, date: "YYYY-MM-DD" }] }
 *
 * The miles endpoint's twin in every respect: no params, the driver read from
 * the bearer token, and a daily list covering only the days that earned
 * anything rather than the whole month.
 *
 * @returns {Promise<{totalEarnings: number, dailyEarnings: object[]}>} the
 *   payload (envelope unwrapped)
 */
export const getMonthlyEarnings = async () => {
  const url = DRIVER_ENDPOINTS.monthlyEarnings();
  log('monthly earnings request', {url});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.get(url));
  } catch (err) {
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
 * The trips the driver has run this month — the "Total Trips" stat card the
 * Home dashboard shows a fleet driver in place of their earnings.
 *
 * GET /drivers/api/v1/drivers/shipments/get-monthly-trips
 * ← { totalTrips, dailyTrips: [{ trip, date: "YYYY-MM-DD" }] }
 *
 * The miles and earnings endpoints' sibling: no params, the driver read from
 * the bearer token, and a daily list covering only the days that carried a
 * trip rather than the whole month. Note the daily figure is `trip`, singular,
 * where the other two are plural.
 *
 * @returns {Promise<{totalTrips: number, dailyTrips: object[]}>} the payload
 *   (envelope unwrapped)
 */
export const getMonthlyTrips = async () => {
  const url = DRIVER_ENDPOINTS.monthlyTrips();
  log('monthly trips request', {url});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.get(url));
  } catch (err) {
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
 * The driver's earnings for a period — the Earnings screen's header figure
 * and the transactions table under it.
 *
 * GET /drivers/api/v1/drivers/earnings?period=ALL|WEEKLY|MONTHLY|YEARLY
 * ← { period, grossEarnings,
 *     shipments: [{ shipmentId, awb, shipmentType, distanceMiles, date,
 *                   payout, paymentStatus,
 *                   stops: [{sequence, type, address, lat, lon, from, to}] }] }
 *
 * `period` is optional — sent empty the backend answers ALL — but the screen
 * always names one, since its dropdown is exactly this parameter. An unknown
 * value is dropped rather than passed on, so a typo asks for everything
 * instead of 400-ing the screen.
 *
 * @param {{period?: string}} params
 * @returns {Promise<{period: string, grossEarnings: number,
 *                    shipments: object[]}>} the payload (envelope unwrapped)
 */
export const getDriverEarnings = async ({period} = {}) => {
  const url = DRIVER_ENDPOINTS.earnings();
  const wanted = String(period ?? '').toUpperCase();
  const params = EARNINGS_PERIODS.includes(wanted) ? {period: wanted} : {};

  log('earnings request', {url, ...params});

  let status;
  let body;
  try {
    ({status, data: body} = await apiClient.get(url, {params}));
  } catch (err) {
    log('earnings failed', {
      url,
      status: err?.response?.status ?? null,
      body: err?.response?.data ?? err?.message,
    });
    throw err;
  }

  // Flat on this endpoint, but the gateway wraps some services in `data` —
  // take whichever came back.
  const earnings = body?.data ?? body;

  log(`earnings response (${status})\n` + JSON.stringify(body, null, 2));

  return earnings;
};
