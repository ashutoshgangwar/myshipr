import {useCallback, useSyncExternalStore} from 'react';

import {HereNavigation} from '../here';
import type {MapLocation} from '../types/common';
import type {TruckDetails} from '../types/navigation';

/**
 * The trip the driver is currently on. Mirrors the JSDoc typedef this file
 * already carried, now enforced.
 */
export interface TripSession {
  destinationLocation: MapLocation | null;
  /** Label for the trip banner / map card. */
  destinationText: string;
  /** Explicit pickup, if the trip had one. */
  sourceLocation: MapLocation | null;
  /** Vehicle profile the route was built for. */
  truckDetails: TruckDetails | null;
  /** The route guidance is following. */
  routeId: string | null;
  /** Guidance started, as opposed to merely previewed. */
  navigating: boolean;
  /**
   * The leg's total distance, banked when guidance starts so the progress bar
   * can resume where it was instead of resetting when the screen re-mounts.
   */
  totalDistanceMeters?: number | null;
}

/**
 * The trip the driver is currently on, shared across screens.
 *
 * Guidance runs inside the HERE SDK, not inside React: it keeps driving,
 * speaking and emitting events after ActiveTripScreen unmounts. So "is a trip
 * running?" cannot live in that screen's state — Home needs the answer to float
 * its live map, and the trip screen itself needs it to re-adopt the session
 * instead of starting a second one when the driver comes back.
 *
 * This is that answer, plus the trip params needed to re-open the full screen.
 * It is deliberately module state rather than a store/context: it mirrors a
 * native singleton, so a second copy of it would be a bug, and every screen
 * that cares can subscribe without a provider above it.
 *
 *     startTripSession({destinationLocation, destinationText, routeId});
 *     const trip = useTripSession();     // re-renders on every change
 *     endTripSession();
 */

/**
 * @typedef {Object} TripSession
 * @property {?Object} destinationLocation `{latitude, longitude, description}`
 * @property {string}  destinationText     label for the trip banner / map card
 * @property {?Object} sourceLocation      explicit pickup, if the trip had one
 * @property {?Object} truckDetails        vehicle profile the route was built for
 * @property {?string} routeId             the route guidance is following
 * @property {boolean} navigating          guidance started (vs. merely previewed)
 */

let session: TripSession | null = null;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach(listener => listener());
}

/** Subscribes to session changes. Returns the unsubscribe. */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** The live session, or null when no trip is on. */
export function getTripSession(): TripSession | null {
  return session;
}

/**
 * Opens (or replaces) the session. Pass the params the trip screen was given,
 * so it can be re-opened from anywhere the driver taps "return to trip".
 *
 * @param trip see {@link TripSession}
 */
export function startTripSession(trip: Partial<TripSession> | null | undefined): void {
  session = {
    destinationLocation: trip?.destinationLocation ?? null,
    destinationText: trip?.destinationText || 'Destination',
    sourceLocation: trip?.sourceLocation ?? null,
    truckDetails: trip?.truckDetails ?? null,
    routeId: trip?.routeId ?? null,
    navigating: Boolean(trip?.navigating),
  };
  emit();
}

/**
 * Folds a change into the live session — the route that a reroute produced,
 * or `{navigating: true}` once guidance actually starts. A no-op when no trip
 * is open, so a late event cannot resurrect a finished one.
 */
export function updateTripSession(patch: Partial<TripSession> | null | undefined): void {
  if (!session || !patch) return;
  session = {...session, ...patch};
  emit();
}

/** Ends the session. Guidance itself is stopped by whoever ends the trip. */
export function endTripSession(): void {
  if (!session) return;
  session = null;
  emit();
}

/**
 * Drops the session if the SDK says nothing is navigating any more.
 *
 * Covers the cases React cannot see: guidance torn down natively (arrival, an
 * engine dispose) while no screen was mounted to notice, or a JS reload that
 * left this module empty while the native navigator kept running.
 *
 * @returns the session as it stands afterwards
 */
export async function syncTripSession(): Promise<TripSession | null> {
  // Shape comes from HereNavigation.getSessionState(); only these two are read.
  let state: Awaited<ReturnType<typeof HereNavigation.getSessionState>> | undefined;
  try {
    state = await HereNavigation.getSessionState();
  } catch {
    // Native unavailable (unrebuilt app / simulator without the SDK): leave
    // whatever JS believes rather than wiping a trip on a bridge hiccup.
    return session;
  }

  if (!state?.navigating) {
    // A session that was only ever previewed has no guidance to lose — keep it
    // so the trip screen can still re-open it.
    if (session?.navigating) endTripSession();
    return session;
  }

  if (session) {
    updateTripSession({
      navigating: true,
      routeId: state.routeId ?? session.routeId,
    });
  }
  return session;
}

/**
 * The live session as React state.
 *
 * @returns re-renders the caller whenever it changes
 */
export function useTripSession(): TripSession | null {
  const getSnapshot = useCallback(() => session, []);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export default {
  subscribe,
  getTripSession,
  startTripSession,
  updateTripSession,
  endTripSession,
  syncTripSession,
  useTripSession,
};
