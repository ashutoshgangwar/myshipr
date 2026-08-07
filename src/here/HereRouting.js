import {NativeModules} from 'react-native';
import HereSdk from './HereSdk';

const {HereRoutingModule} = NativeModules;

/**
 * Route calculation via the HERE SDK RoutingEngine.
 *
 * Every call resolves a {@link HereRoute}. The native route object stays on the
 * Android side; `routeId` is the handle you pass to
 * `HereNavigation.startNavigation()` or `mapRef.drawRoute()`.
 *
 * @typedef {Object} HereRoute
 * @property {string}  routeId              handle for navigation / drawing
 * @property {number}  distanceMeters
 * @property {number}  durationSeconds      including current traffic
 * @property {number}  baseDurationSeconds  excluding traffic delay
 * @property {number}  trafficDelaySeconds
 * @property {string}  transportMode        'CAR' | 'TRUCK' | …
 * @property {number}  alternativeCount
 * @property {?number} consumptionKwh       EV routes only
 * @property {?string} routeHandle          for refreshing/re-importing the route
 * @property {?Object} boundingBox          { northEast, southWest }
 * @property {Array<{lat:number,lng:number,latitude:number,longitude:number}>} polyline
 * @property {Array<Object>} maneuvers      turn-by-turn list
 */

function requireModule() {
  if (!HereRoutingModule) {
    throw new Error(
      '[HereRouting] Native HereRoutingModule is missing — rebuild the app',
    );
  }
  return HereRoutingModule;
}

/** Runs `call` with the SDK guaranteed to be initialised. */
async function withSdk(call) {
  await HereSdk.ensureInitialized();
  return call(requireModule());
}

/**
 * Fastest car route between two coordinates.
 *
 * @param {number} originLat
 * @param {number} originLng
 * @param {number} destLat
 * @param {number} destLng
 * @param {Object} [options] `{ vehicle, routeOptions, avoid }`
 * @returns {Promise<HereRoute>}
 */
export function calculateCarRoute(
  originLat,
  originLng,
  destLat,
  destLng,
  options = null,
) {
  return withSdk(mod =>
    mod.calculateCarRoute(originLat, originLng, destLat, destLng, options),
  );
}

/**
 * Truck route honouring vehicle dimensions and restrictions.
 *
 * @param {Object} [truckOptions] weights in kg, dimensions in cm:
 *   `{ grossWeight, currentWeight, weightPerAxle, height, width, length,
 *      axleCount, trailerCount, trailerAxleCount, payloadCapacity,
 *      isTruckLight, truckType: 'tractor'|'straight',
 *      tunnelCategory: 'B'|'C'|'D'|'E', hazardousMaterials: [],
 *      routeOptions, avoid }`
 * @returns {Promise<HereRoute>}
 */
export function calculateTruckRoute(
  originLat,
  originLng,
  destLat,
  destLng,
  truckOptions = null,
) {
  return withSdk(mod =>
    mod.calculateTruckRoute(
      originLat,
      originLng,
      destLat,
      destLng,
      truckOptions,
    ),
  );
}

/**
 * Electric-vehicle route, with charging stops inserted when the battery cannot
 * cover the distance.
 *
 * @param {Object} [evOptions]
 *   `{ transportMode: 'car'|'truck', ensureReachability, vehicle,
 *      battery: { totalCapacityKwh, initialChargeKwh, targetChargeKwh,
 *                 minChargeAtChargingStationKwh, minChargeAtDestinationKwh },
 *      consumption: { ascentWhPerMeter, descentWhPerMeter,
 *                     auxiliaryWhPerSecond, freeFlowSpeedTable,
 *                     trafficSpeedTable },
 *      routeOptions, avoid }`
 * @returns {Promise<HereRoute>} with `consumptionKwh` populated
 */
export function calculateEVRoute(
  originLat,
  originLng,
  destLat,
  destLng,
  evOptions = null,
) {
  return withSdk(mod =>
    mod.calculateEVRoute(originLat, originLng, destLat, destLng, evOptions),
  );
}

/**
 * Frees a route the native side is holding. Optional — the store keeps only the
 * 10 most recent routes — but worth calling when you know you are done.
 */
export function releaseRoute(routeId) {
  if (!routeId || !HereRoutingModule) {
    return Promise.resolve(false);
  }
  return HereRoutingModule.releaseRoute(routeId);
}

export default {
  calculateCarRoute,
  calculateTruckRoute,
  calculateEVRoute,
  releaseRoute,
};
