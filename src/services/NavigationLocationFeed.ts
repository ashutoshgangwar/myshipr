import {HereNavigation} from '../here';
import {clearWatchLocation, watchCurrentLocation} from './LocationService';
import type {LocationResult} from '../types/location';
import type {ErrorLike} from '../types/common';

/**
 * Drives the running guidance session from the app's own location feed.
 *
 * The HERE SDK can locate the vehicle itself — that is what
 * `locationSource: 'device'` leaves it doing — but its locator is not the one
 * the rest of the app uses. Every other position on screen (the route origin,
 * the preview marker, the "centre on me" button, the header's city) comes from
 * `LocationService`, and on a real device the two disagreed by more than a
 * kilometre: the route was drawn correctly from where the driver was and the
 * vehicle marker sat somewhere else entirely, because only the marker was
 * HERE's to place.
 *
 * Two providers cannot both be right, and the one that is right is the one the
 * driver has already been shown and believed all through the preview. So
 * guidance starts with `locationSource: 'app'` and this pumps that same feed
 * into the navigator. Map matching, the marker, maneuver timing, route
 * progress and the follow camera all run off it unchanged — the SDK does not
 * care which provider produced a fix.
 *
 * Module state rather than a hook, and deliberately: guidance outlives
 * ActiveTripScreen — backing out to Home keeps the trip running behind a
 * floating map — so a feed tied to that screen's lifetime would cut the
 * navigator off the moment the driver looked at anything else.
 */

/** The running watch, or null when the feed is stopped. */
let watchId: number | null = null;

/**
 * Whether a feed is wanted. Read after the `await` in `start`, so a `stop`
 * that lands mid-start does not leave an orphaned watch running forever.
 */
let wanted = false;

/** In-flight start, so two callers cannot register two watches. */
let starting: Promise<void> | null = null;

/** Throttles the "feed is running" log to one line per session. */
let logged = false;

const pushFix = (fix: LocationResult): void => {
  HereNavigation.updateLocation({
    latitude: fix.latitude,
    longitude: fix.longitude,
    // The device reports these as null when it cannot measure them — parked,
    // or a first fix with no track yet. Passed through as-is: the SDK treats a
    // missing bearing as unknown, which is honest, where a zero would be read
    // as "pointing due north".
    bearing: fix.heading,
    speed: fix.speed,
    accuracy: fix.accuracy,
    timestamp: fix.timestamp,
  }).catch(() => {
    // Guidance stopped between the fix arriving and it being pushed. Not worth
    // reporting: the next stop() takes the watch down anyway.
  });

  if (!logged) {
    logged = true;
    console.log(
      '[NavigationLocationFeed] feeding the navigator from the app location service',
      {lat: fix.latitude, lng: fix.longitude, accuracy: fix.accuracy},
    );
  }
};

/**
 * Starts pushing device fixes into the running navigator.
 *
 * Safe to call when already running. Resolves true once a watch is registered.
 * Uses the location service's `watch` preset — high accuracy, no cached fixes,
 * a 1 m distance filter — which is the feed this app already tuned for
 * navigation.
 */
export async function startNavigationLocationFeed(): Promise<boolean> {
  wanted = true;
  if (watchId !== null) return true;
  if (starting) {
    await starting;
    return watchId !== null;
  }

  starting = (async () => {
    try {
      const id = await watchCurrentLocation(pushFix, (error: Error) => {
        console.warn(
          '[NavigationLocationFeed] location watch failed:',
          (error as ErrorLike)?.message ?? error,
        );
      });
      // Guidance ended while the watch was being registered.
      if (!wanted) {
        clearWatchLocation(id);
        return;
      }
      watchId = id;
    } catch (e) {
      const err = e as ErrorLike;
      console.warn(
        '[NavigationLocationFeed] could not start the feed:',
        err?.message ?? err,
      );
    }
  })();

  try {
    await starting;
  } finally {
    starting = null;
  }
  return watchId !== null;
}

/** Stops the feed. Safe to call when it is not running. */
export function stopNavigationLocationFeed(): void {
  wanted = false;
  logged = false;
  if (watchId === null) return;
  clearWatchLocation(watchId);
  watchId = null;
}

/** Whether fixes are currently being pushed to the navigator. */
export function isNavigationLocationFeedRunning(): boolean {
  return watchId !== null;
}
