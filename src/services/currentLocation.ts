import {useEffect, useRef, useState} from 'react';

import {useLocation} from './LocationService';
import {reverseGeocode} from './hereSdkService';

/** Shown while the fix — or the address behind it — is still on its way. */
export const LOCATING_LABEL = 'Locating…';

export const LOCATION_UNKNOWN_LABEL = 'Location unavailable';

/** The address block both native bridges attach to a reverse-geocoded place. */
interface PlaceAddress {
  city?: string | null;
  district?: string | null;
  county?: string | null;
  state?: string | null;
  stateCode?: string | null;
  country?: string | null;
  countryCode?: string | null;
  label?: string | null;
}

/** As much of a HERE place as this module reads. */
interface ReverseGeocodedPlace {
  title?: string | null;
  address?: string | null;
  addressDetails?: PlaceAddress | null;
}

const clean = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const fromAddressText = (raw: unknown): string => {
  const parts = clean(raw)
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
  if (!parts.length) return '';

  const tail = parts
    .slice(-2)
    .map(part => part.replace(/[\s-]*\d[\d\s-]*$/, '').trim())
    .filter(Boolean);
  return tail.join(', ');
};

export const toLocationLabel = (
  place: ReverseGeocodedPlace | null | undefined,
): string => {
  const address = place?.addressDetails;
  const city =
    clean(address?.city) || clean(address?.district) || clean(address?.county);
  const region =
    clean(address?.stateCode) ||
    clean(address?.state) ||
    clean(address?.countryCode);

  if (city && region) return `${city}, ${region}`;
  if (city) return city;
  if (region) return region;

  return fromAddressText(address?.label ?? place?.address ?? place?.title);
};

/**
 * Two decimals — about a kilometre. The header names a city, so a fix that has
 * only crept down the road is the same answer, and re-asking the SDK for it on
 * every GPS update would spend a search call to redraw the same two words.
 */
const coordKeyOf = (
  location: {latitude: number; longitude: number} | null | undefined,
): string =>
  location
    ? `${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}`
    : '';

/**
 * Where the driver is, ready to print: the device's own fix, reverse-geocoded
 * to "City, ST".
 *
 * Cache-first, like every other caller of `useLocation` — a returning driver
 * sees the last-known city immediately while the fresh fix is still in flight,
 * and the label already on screen is never blanked back to "Locating…" by a
 * later fix, since only a resolved name ever replaces it.
 *
 * @returns {{label: string, location: object|null, refresh: function}}
 */
export function useCurrentLocationLabel() {
  const {location, loading, refresh} = useLocation();
  const [label, setLabel] = useState('');
  // The SDK answered, but with nothing this header can print. Tracked so a
  // failed lookup settles on the fallback instead of saying "Locating…" for
  // the rest of the session.
  const [unresolved, setUnresolved] = useState(false);

  // The effect keys off the rounded coordinate rather than the fix object, so
  // it re-runs on a real move and not on every refresh; the fix itself is read
  // through a ref, which always holds the one that key was built from.
  const fixRef = useRef(location);
  fixRef.current = location;
  const coordKey = coordKeyOf(location);

  useEffect(() => {
    const fix = fixRef.current;
    if (!coordKey || !fix) return undefined;

    let active = true;
    setUnresolved(false);
    reverseGeocode({latitude: fix.latitude, longitude: fix.longitude})
      .then((place: ReverseGeocodedPlace | null) => {
        if (!active) return;
        const next = toLocationLabel(place);
        if (next) setLabel(next);
        else setUnresolved(true);
      })
      .catch(() => {
        if (active) setUnresolved(true);
      });

    return () => {
      active = false;
    };
  }, [coordKey]);

  // No fix and nothing still being fetched means the device refused; a fix the
  // SDK could not name means there is nothing to print either.
  const stalled = unresolved || (!location && !loading);

  return {
    label: label || (stalled ? LOCATION_UNKNOWN_LABEL : LOCATING_LABEL),
    location,
    refresh,
  };
}
