import {useCallback, useEffect, useRef, useState} from 'react';

import {getCurrentTrip} from '../config/driverApi';
import {getCachedLocation, getCurrentLocation} from '../services/LocationService';

/**
 * Best-effort coordinate for the request. `lat`/`lon` are optional on the
 * endpoint, so this never alerts, never asks for a permission the driver has
 * not already given, and never throws — a missing fix simply means the trip is
 * fetched without one.
 *
 * @returns {Promise<{lat: number, lon: number}|null>}
 */
const resolveCoordinates = async () => {
  const cached = getCachedLocation();
  if (cached) {
    return {lat: cached.latitude, lon: cached.longitude};
  }

  try {
    const fix = await getCurrentLocation({
      // The map and the route card already own the permission/GPS prompts.
      skipGPSCheck: true,
      skipPermissionCheck: true,
      highAccuracy: false,
      preferCacheMs: 60000,
    });
    return fix ? {lat: fix.latitude, lon: fix.longitude} : null;
  } catch (_) {
    return null;
  }
};

/**
 * Loads the driver's current trip and keeps it in state.
 *
 * @param {string} tripId trip to load; nothing is fetched while it is empty
 * @returns {{trip: object|null, loading: boolean, error: string|null,
 *            refresh: () => Promise<object|null>}}
 */
export default function useCurrentTrip(tripId) {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(Boolean(tripId));
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const requestRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (!tripId) {
      setTrip(null);
      setLoading(false);
      return null;
    }

    const requestId = ++requestRef.current;
    setLoading(true);
    setError(null);

    try {
      const coordinates = await resolveCoordinates();
      const data = await getCurrentTrip({tripId, ...coordinates});

      if (!mountedRef.current || requestId !== requestRef.current) return data;
      setTrip(data ?? null);
      return data;
    } catch (err) {
      if (mountedRef.current && requestId === requestRef.current) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            'Could not load your current trip.',
        );
      }
      return null;
    } finally {
      if (mountedRef.current && requestId === requestRef.current) {
        setLoading(false);
      }
    }
  }, [tripId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {trip, loading, error, refresh};
}
