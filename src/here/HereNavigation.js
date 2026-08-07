import {NativeEventEmitter, NativeModules} from 'react-native';
import HereSdk from './HereSdk';

const {HereNavigationModule} = NativeModules;

/**
 * Turn-by-turn guidance driven by the HERE SDK's VisualNavigator.
 *
 * Request/response calls return Promises; everything that happens *during*
 * navigation arrives as events — subscribe before you start.
 *
 *     const sub = HereNavigation.addListener('onManeuver', m => setTurn(m));
 *     await HereNavigation.startNavigation(route.routeId, {simulate: true});
 *     // …later
 *     sub.remove();
 *     await HereNavigation.stopNavigation();
 */

/** Event names emitted by the native module. */
export const NavigationEvents = {
  /** Next turn changed: `{ index, action, direction, instruction, roadName, distanceMeters, durationSeconds, coordinates }` */
  MANEUVER: 'onManeuver',
  /** Several times a second: `{ remainingDistanceMeters, remainingDurationSeconds, trafficDelaySeconds, maneuverIndex, distanceToNextManeuverMeters }` */
  ROUTE_PROGRESS: 'onRouteProgress',
  /** Posted limit changed: `{ speedLimitMps, speedLimitKph, effectiveSpeedLimitKph, … }` — values are null where HERE has no data */
  SPEED_LIMIT: 'onSpeedLimit',
  /** Crossed/returned under the limit: `{ status, isSpeeding }` */
  SPEED_WARNING: 'onSpeedWarning',
  /** Off route: `{ deviationDistanceMeters, currentLocation, lastLocationOnRoute }` — recalculate from here */
  ROUTE_DEVIATION: 'onRouteDeviation',
  /** Arrived: `{}` */
  DESTINATION_REACHED: 'onDestinationReached',
  /** Guidance text to speak: `{ text, type, distanceMeters }` */
  VOICE_GUIDANCE: 'onVoiceGuidance',
  /** Map-matched position: `{ latitude, longitude, bearing, speedKph, isMapMatched }` */
  LOCATION: 'onNavigationLocation',
};

const emitter = HereNavigationModule
  ? new NativeEventEmitter(HereNavigationModule)
  : null;

function requireModule() {
  if (!HereNavigationModule) {
    throw new Error(
      '[HereNavigation] Native HereNavigationModule is missing — rebuild the app',
    );
  }
  return HereNavigationModule;
}

async function withSdk(call) {
  await HereSdk.ensureInitialized();
  return call(requireModule());
}

/**
 * Subscribes to one navigation event.
 *
 * @param {string} eventName one of {@link NavigationEvents}
 * @param {Function} handler
 * @returns {{remove: Function}} call `remove()` to unsubscribe
 */
export function addListener(eventName, handler) {
  if (!emitter) {
    console.warn(
      `[HereNavigation] cannot subscribe to ${eventName} — native module missing`,
    );
    return {remove: () => {}};
  }
  return emitter.addListener(eventName, handler);
}

/**
 * Subscribes to several events at once and returns a single unsubscribe.
 *
 * @param {Object<string, Function>} handlers e.g. `{onManeuver, onRouteProgress}`
 * @returns {Function} call it to remove every subscription
 */
export function addListeners(handlers) {
  const subscriptions = Object.entries(handlers)
    .filter(([, handler]) => typeof handler === 'function')
    .map(([eventName, handler]) => addListener(eventName, handler));

  return () => subscriptions.forEach(subscription => subscription.remove());
}

/**
 * Starts guidance along a previously calculated route.
 *
 * @param {?string} routeId from `HereRouting.*` — null uses the latest route
 * @param {Object} [options]
 * @param {boolean} [options.simulate=true] drive the route with LocationSimulator
 *   instead of the device GPS
 * @param {number}  [options.speedFactor=1] simulation speed multiplier
 * @param {boolean} [options.voiceGuidance=true] produce guidance texts at all —
 *   both the spoken instruction and the `onVoiceGuidance` event
 * @param {boolean} [options.speak=true] say those texts aloud. Turn it off to
 *   keep the events and run your own TTS off them instead.
 * @param {string}  [options.language='EN_US'] HERE LanguageCode name
 * @param {string}  [options.unitSystem='metric'] 'metric'|'imperialUs'|'imperialUk'
 * @param {number}  [options.mapViewTag] specific <HereMapView> to render into;
 *   defaults to the mounted one
 * @param {Object}  [options.camera] driving-view camera — see
 *   {@link setCameraBehavior}. Worth passing `{mode: 'fixed'}`: the SDK default
 *   picks tilt and zoom from speed, so pulling away from a standstill opens
 *   flat and far out rather than on the road ahead.
 * @returns {Promise<{started:boolean, simulated:boolean, distanceMeters:number, durationSeconds:number}>}
 */
export function startNavigation(routeId = null, options = null) {
  return withSdk(mod => mod.startNavigation(routeId, options));
}

/**
 * Swaps the route being followed without restarting the session — the reroute
 * primitive. Calculate a fresh route from the current position after
 * `onRouteDeviation`, then hand its `routeId` here.
 *
 * A running simulation is restarted against the new route automatically.
 */
export function setRoute(routeId) {
  if (!HereNavigationModule) {
    return Promise.resolve(false);
  }
  return HereNavigationModule.setRoute(routeId);
}

/**
 * Retunes the camera that follows the vehicle. Safe to call before guidance
 * starts — the settings are remembered and applied when it does.
 *
 * The SDK's own default derives tilt and zoom from speed, so a drive that
 * begins parked opens flat and zoomed out. Guidance therefore starts on a
 * `fixed` behaviour instead, and this is how you adjust it: a zoom step sends
 * `distanceMeters` alone, and every absent key keeps its current value.
 *
 * @param {Object} camera
 * @param {string}  [camera.mode] `'fixed'` follows at a constant tilt/zoom,
 *   `'dynamic'` lets the SDK vary them with speed, `'free'` releases the camera
 *   so the user's pan/pinch/rotate gestures stick.
 * @param {number}  [camera.tiltDegrees] 0 = top-down, ~60 = driving view
 * @param {number}  [camera.distanceMeters] camera-to-vehicle distance; clamped
 *   to 50–5000 m natively
 * @param {?number} [camera.bearingDegrees] null follows the vehicle heading,
 *   which is what makes the road run up the screen
 * @param {number}  [camera.principalPointY] 0–1; 0.75 puts the vehicle in the
 *   lower quarter so the road ahead fills the frame
 * @returns {Promise<Object>} the settings actually in force, post-clamping
 */
export function setCameraBehavior(camera) {
  if (!HereNavigationModule) {
    return Promise.resolve(null);
  }
  return HereNavigationModule.setCameraBehavior(camera ?? null);
}

/**
 * Mutes or unmutes spoken guidance mid-trip.
 *
 * The SDK writes the instruction text but never says it — the native speaker
 * added alongside it does. `onVoiceGuidance` keeps firing either way, so the
 * on-screen instruction stays live while the cab is quiet.
 *
 * @param {boolean} enabled
 * @returns {Promise<boolean>} the state actually applied
 */
export function setSpeechEnabled(enabled) {
  if (!HereNavigationModule) {
    return Promise.resolve(false);
  }
  return HereNavigationModule.setSpeechEnabled(!!enabled);
}

/** Ends guidance and stops the location feed. */
export function stopNavigation() {
  if (!HereNavigationModule) {
    return Promise.resolve(false);
  }
  return HereNavigationModule.stopNavigation();
}

/**
 * Route-less tracking (free driving): the map follows the vehicle and speed
 * events keep firing, but there are no maneuvers.
 *
 * Uses device positioning, so ACCESS_FINE_LOCATION must already be granted.
 *
 * @param {Object} [options] `{ mapViewTag }`
 */
export function startTracking(options = null) {
  return withSdk(mod => mod.startTracking(options));
}

export function stopTracking() {
  if (!HereNavigationModule) {
    return Promise.resolve(false);
  }
  return HereNavigationModule.stopTracking();
}

/**
 * Replaces the current location feed with synthetic fixes along a route — the
 * way to exercise guidance without driving.
 *
 * @param {?string} routeId null keeps the route already loaded in the navigator
 * @param {Object} [options] `{ speedFactor }` (1.0 = real-time)
 */
export function startSimulation(routeId = null, options = null) {
  return withSdk(mod => mod.startSimulation(routeId, options));
}

/** Stops the simulated feed. Guidance stays active but stops receiving fixes. */
export function stopSimulation() {
  if (!HereNavigationModule) {
    return Promise.resolve(false);
  }
  return HereNavigationModule.stopSimulation();
}

export default {
  NavigationEvents,
  addListener,
  addListeners,
  startNavigation,
  setRoute,
  setCameraBehavior,
  setSpeechEnabled,
  stopNavigation,
  startTracking,
  stopTracking,
  startSimulation,
  stopSimulation,
};
