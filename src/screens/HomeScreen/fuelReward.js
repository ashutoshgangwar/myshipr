import {useCallback, useEffect, useRef, useState} from 'react';

import {getFuelReward} from '../../config/driverApi';

/**
 * Loads the driver's fuel-reward balance and keeps it in state.
 *
 * @returns {{points: number|null, loading: boolean, error: string|null,
 *            refresh: () => Promise<number|null>}}
 */
export function useFuelReward() {
  const [points, setPoints] = useState(null);
  const [loading, setLoading] = useState(true);
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
    const requestId = ++requestRef.current;
    setLoading(true);
    setError(null);

    try {
      const reward = await getFuelReward();
      const total = Number(reward?.totalRewardPoints);
      const value = Number.isFinite(total) ? total : null;

      if (!mountedRef.current || requestId !== requestRef.current) return value;
      setPoints(value);
      return value;
    } catch (err) {
      if (mountedRef.current && requestId === requestRef.current) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            'Could not load your reward points.',
        );
      }
      return null;
    } finally {
      if (mountedRef.current && requestId === requestRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {points, loading, error, refresh};
}
