import {NativeModules, Platform} from 'react-native';
import {HERE_ACCESS_KEY_ID, HERE_ACCESS_KEY_SECRET, HERE_SCOPE} from '@env';

const {HereSdkModule} = NativeModules;

/**
 * HERE SDK lifetime.
 *
 * Everything else in this folder (routing, navigation, the map view) needs the
 * shared native engine, so call `initialize()` once before any of it. The call
 * is idempotent and de-duplicated, so screens can safely `await` it on mount.
 *
 * Implemented natively on both Android and iOS.
 */

export const isSupported = !!HereSdkModule;

function requireModule() {
  if (!HereSdkModule) {
    throw new Error(
      `[HereSdk] Native HereSdkModule is missing — rebuild the ${Platform.OS} app`,
    );
  }
  return HereSdkModule;
}

// Shared across callers so a screen that mounts twice does not race the engine
// into existence twice. Cleared on failure so a retry can succeed.
let initPromise = null;

/**
 * Creates the shared HERE engine.
 *
 * Credentials default to HERE_ACCESS_KEY_ID / HERE_ACCESS_KEY_SECRET from .env.
 *
 * HERE_SCOPE is optional and only needed when the credentials were issued
 * inside a HERE project — it is the project HRN
 * (`hrn:here:authorization::<realm>:project/<project-id>`). Without it, requests
 * carry no project entitlements and the map-data catalog answers 403, which
 * shows up as a blank base map while routing keeps working.
 *
 * @returns {Promise<boolean>} true if this call created the engine,
 *   false if it already existed.
 */
export function initialize(
  accessKeyId = HERE_ACCESS_KEY_ID,
  accessKeySecret = HERE_ACCESS_KEY_SECRET,
  scope = HERE_SCOPE,
) {
  if (initPromise) {
    return initPromise;
  }
  if (!accessKeyId || !accessKeySecret) {
    return Promise.reject(
      new Error(
        '[HereSdk] Missing HERE credentials — set HERE_ACCESS_KEY_ID and ' +
          'HERE_ACCESS_KEY_SECRET in .env, then restart Metro with --reset-cache',
      ),
    );
  }

  initPromise = Promise.resolve()
    .then(() =>
      requireModule().initialize(accessKeyId, accessKeySecret, scope || null),
    )
    .catch(error => {
      initPromise = null;
      throw error;
    });

  return initPromise;
}

/**
 * Checks whether these credentials may read the map-data catalog the Navigate
 * edition renders from.
 *
 * The SDK has no callback for this — an unlicensed catalog just logs
 * `kAccessDenied` and draws nothing, so the map looks broken while routing and
 * guidance keep working. `<HereMapView>` calls this to explain a blank map.
 *
 * Only an explicit HTTP 403 counts as "no access"; a failed probe (offline,
 * timeout) resolves `hasMapDataAccess: true` rather than blame the licence.
 *
 * @returns {Promise<{hasMapDataAccess: boolean, httpStatus: number, message: ?string}>}
 */
export function checkMapDataAccess() {
  if (!isSupported || typeof HereSdkModule.checkMapDataAccess !== 'function') {
    return Promise.resolve({hasMapDataAccess: true, httpStatus: 0, message: null});
  }
  return HereSdkModule.checkMapDataAccess();
}

/** @returns {Promise<boolean>} whether the shared engine currently exists. */
export function isInitialized() {
  if (!isSupported) {
    return Promise.resolve(false);
  }
  return HereSdkModule.isInitialized();
}

/**
 * Releases the engine. Navigation is stopped and cached routes dropped first.
 *
 * Only needed when you want to hand the SDK's memory back (e.g. logout); the
 * engine is otherwise fine to keep for the life of the process.
 */
export function dispose() {
  initPromise = null;
  if (!isSupported) {
    return Promise.resolve(false);
  }
  return HereSdkModule.dispose();
}

/** Resolves once the engine exists — the guard every other wrapper runs first. */
export function ensureInitialized() {
  return initialize();
}

export default {
  isSupported,
  initialize,
  isInitialized,
  checkMapDataAccess,
  dispose,
  ensureInitialized,
};
