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
