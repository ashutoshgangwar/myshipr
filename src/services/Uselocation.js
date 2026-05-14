import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getCurrentLocation,
  watchCurrentLocation,
  clearWatchLocation,
  LOCATION_ERRORS,
  PRESET_OPTIONS,
} from './LocationService';


/**
 * @param {object}  [opts]
 * @param {boolean} [opts.fetchOnMount=true] 
 * @param {Array}   [opts.retryStrategy]    
 * @param {boolean} [opts.detectMock=true]   
 * @param {boolean} [opts.skipGPSCheck=false] 
 * @param {boolean} [opts.skipPermissionCheck=false]
 * @param {object}  [opts.alertStrings]
 *
 * @returns {{
 *   location: LocationResult | null,
 *   loading:  boolean,
 *   error:    string | null,   // one of LOCATION_ERRORS or null
 *   refresh:  () => void,
 * }}
 */
export const useCurrentLocation = ({
  fetchOnMount        = true,
  retryStrategy,
  detectMock          = true,
  skipGPSCheck        = false,
  skipPermissionCheck = false,
  alertStrings        = {},
} = {}) => {
  const [location, setLocation] = useState(null);
  const [loading,  setLoading]  = useState(fetchOnMount);
  const [error,    setError]    = useState(null);

  const optsRef = useRef({});
  optsRef.current = { retryStrategy, detectMock, skipGPSCheck, skipPermissionCheck, alertStrings };

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getCurrentLocation(optsRef.current);
      setLocation(result);
    } catch (err) {
      setError(err.message ?? LOCATION_ERRORS.LOCATION_UNAVAILABLE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (fetchOnMount) fetch();
  }, [fetchOnMount, fetch]);

  return { location, loading, error, refresh: fetch };
};


/**
 * @param {object}  [opts]
 * @param {boolean} [opts.watchOnMount=true]  
 * @param {object}  [opts.geoOptions]         
 * @param {boolean} [opts.detectMock=true]
 * @param {boolean} [opts.skipGPSCheck=false]
 * @param {boolean} [opts.skipPermissionCheck=false]
 * @param {object}  [opts.alertStrings]
 *
 * @returns {{
 *   location:   LocationResult | null,
 *   error:      string | null,
 *   isWatching: boolean,
 *   start:      () => Promise<void>,
 *   stop:       () => void,
 * }}
 */
export const useWatchLocation = ({
  watchOnMount        = true,
  geoOptions          = PRESET_OPTIONS.watch,
  detectMock          = true,
  skipGPSCheck        = false,
  skipPermissionCheck = false,
  alertStrings        = {},
} = {}) => {
  const [location,   setLocation]   = useState(null);
  const [error,      setError]      = useState(null);
  const [isWatching, setIsWatching] = useState(false);

  const watchIdRef = useRef(null);
  const optsRef    = useRef({});
  optsRef.current  = { geoOptions, detectMock, skipGPSCheck, skipPermissionCheck, alertStrings };

  const stop = useCallback(() => {
    if (watchIdRef.current !== null) {
      clearWatchLocation(watchIdRef.current);
      watchIdRef.current = null;
      setIsWatching(false);
    }
  }, []);

  const start = useCallback(async () => {
    if (watchIdRef.current !== null) stop();

    setError(null);
    setIsWatching(true);

    try {
      const id = await watchCurrentLocation(
        position => setLocation(position),
        err      => setError(err.message ?? LOCATION_ERRORS.LOCATION_UNAVAILABLE),
        optsRef.current,
      );
      watchIdRef.current = id;
    } catch (err) {
      setError(err.message ?? LOCATION_ERRORS.LOCATION_UNAVAILABLE);
      setIsWatching(false);
    }
  }, [stop]);

  useEffect(() => {
    if (watchOnMount) start();
    return () => stop();
  }, [watchOnMount, start, stop]);

  return { location, error, isWatching, start, stop };
};

export { LOCATION_ERRORS, PRESET_OPTIONS };