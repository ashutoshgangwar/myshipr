import {useCallback, useRef, useState} from 'react';

import {submitFuelPriceEntry} from '../config/driverApi';
import {getCurrentLocation} from './LocationService';
import {searchPOIs} from './hereSdkService';
import type {HerePlaceLike} from './hereSdkService';
import type {FuelPriceEntryResult} from '../types/earnings';
import type {LocationResult} from '../types/location';
import type {ApiErrorBody} from '../types/api';
import type {ErrorLike, Nullable} from '../types/common';
import type {AxiosError} from 'axios';

const NO_LOCATION = 'Turn on location so the price can be filed where you are.';
const ERROR = 'Could not submit the diesel price. Please try again.';
const NO_STATION = 'No fuel station found near you.';
const NO_LOCATION_FOR_STATION = 'Turn on location to find a station near you.';

/** A fix this recent is still the pump the driver is standing at. */
const FRESH_FIX_MS = 30000;

const locate = (): Promise<Nullable<LocationResult>> =>
  getCurrentLocation({preferCacheMs: FRESH_FIX_MS}).catch(() => null);

/**
 * HERE place categories for somewhere to buy fuel: the whole "Fueling Station"
 * branch, plus truck stops, which is where most of our drivers fill up.
 */
const FUEL_STATION_CATEGORIES = ['700-7600', '700-7900-0131'];

/** What a station sells, as far as HERE's categories for it say. */
export type FuelStationKind = 'petrol' | 'electric' | 'truckStop';

const KIND_LABELS: Record<FuelStationKind, string> = {
  petrol: 'Gas/Petrol',
  electric: 'EV Charging',
  truckStop: 'Truck Stop',
};

/**
 * HERE ids first; the category's own name is the fallback, since a place can
 * carry a category id this list does not know yet.
 */
const KIND_MATCHERS: Array<{kind: FuelStationKind; ids: string[]; name: RegExp}> = [
  {kind: 'petrol', ids: ['700-7600-0116'], name: /petrol|gasoline|\bgas\b|diesel/i},
  {kind: 'electric', ids: ['700-7600-0322'], name: /electric|\bev\b|charging/i},
  {kind: 'truckStop', ids: ['700-7900-0131'], name: /truck stop|truck plaza/i},
];

/** Every kind a place's categories name, in `KIND_MATCHERS` order. */
const kindsOf = (place: HerePlaceLike): FuelStationKind[] => {
  const categories = Array.isArray(place.categories)
    ? (place.categories as Array<{id?: unknown; name?: unknown}>)
    : [];
  return KIND_MATCHERS.filter(({ids, name}) =>
    categories.some(
      category =>
        (typeof category?.id === 'string' && ids.includes(category.id)) ||
        (typeof category?.name === 'string' && name.test(category.name)),
    ),
  ).map(({kind}) => kind);
};

/** "Gas/Petrol + EV Charging" — '' when HERE named none of them. */
export const describeStationKinds = (kinds: FuelStationKind[]): string =>
  kinds.map(kind => KIND_LABELS[kind]).join(' + ');

/** The fuel station nearest a fix, as the sheet shows it. */
export interface NearestFuelStation {
  /** HERE's place id — '' when the SDK sent none. */
  id: string;
  name: string;
  /** From the driver's fix to the station. */
  distanceMeters: number;
  /** Empty when HERE's categories for the place name none we know. */
  kinds: FuelStationKind[];
}

const finite = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

/** Great-circle distance in metres. */
export const metresBetween = (
  a: {latitude: number; longitude: number},
  b: {latitude: number; longitude: number},
): number => {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
};

/**
 * Measured from the place's own coordinate when it has one, so the figure is
 * the driver's distance even if the SDK searched around a slightly older fix.
 */
const distanceTo = (fix: LocationResult, place: HerePlaceLike): number => {
  const latitude = place.latitude ?? place.lat;
  const longitude = place.longitude ?? place.lng;
  if (finite(latitude) && finite(longitude)) {
    return metresBetween(fix, {latitude, longitude});
  }
  return finite(place.distanceMeters) ? place.distanceMeters : Infinity;
};

/**
 * The fuel station closest to the fix, from the HERE SDK's place search, or
 * null when there is none.
 */
export const findNearestFuelStation = async (
  fix: LocationResult,
): Promise<Nullable<NearestFuelStation>> => {
  const places = ((await searchPOIs(FUEL_STATION_CATEGORIES, fix, {limit: 10})) ||
    []) as HerePlaceLike[];
  const nearest = places
    .filter(place => typeof place.title === 'string' && place.title.trim())
    .map(place => ({place, distance: distanceTo(fix, place)}))
    .filter(({distance}) => Number.isFinite(distance))
    .sort((a, b) => a.distance - b.distance)[0];
  if (!nearest) return null;
  return {
    id: typeof nearest.place.id === 'string' ? nearest.place.id : '',
    name: (nearest.place.title as string).trim(),
    distanceMeters: nearest.distance,
    kinds: kindsOf(nearest.place),
  };
};

/** What the driver reported, for the thank-you sheet to read back. */
export interface SubmittedFuelPrice {
  pricePerGallon: number;
  /** '' when the driver left the Station Name field empty. */
  stationName: string;
}

/**
 * The DIESEL badge's "report a price" flow.
 *
 * `open` shows the sheet and starts the location fix at the same moment, so
 * the fix is usually in hand by the time the driver has typed the price;
 * `submit` waits on that same fix, then posts the price with it. On success
 * the sheet closes and `onSubmitted` is handed the server's answer.
 *
 * Once the fix lands, the nearest fuel station is looked up so the sheet can
 * prefill its name and show how far away it is. The submitted name goes with
 * the report, and HERE's place id with it while the name is still HERE's.
 *
 * `searchStation` runs that lookup again from a fresh fix, for when the first
 * one found nothing or the driver has moved closer to the pumps.
 *
 * `openAtStation` is the same sheet for a stop the detector already matched to
 * a station — its fix and station are used as they are, with no second search.
 */
export function useFuelPriceEntry(
  onSubmitted: (result: FuelPriceEntryResult, entry: SubmittedFuelPrice) => void,
) {
  const [visible, setVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<Nullable<string>>(null);
  const [station, setStation] = useState<Nullable<NearestFuelStation>>(null);
  const [stationLoading, setStationLoading] = useState(false);
  /** Why the station field is empty after a lookup, or null. */
  const [stationMessage, setStationMessage] = useState<Nullable<string>>(null);
  const fixRef = useRef<Promise<Nullable<LocationResult>> | null>(null);
  // Bumped on every open, so a slow lookup cannot fill a later sheet.
  const openIdRef = useRef(0);

  /** Locates, looks the station up, and fills the sheet — unless reopened. */
  const lookUpStation = useCallback(() => {
    const openId = openIdRef.current;
    const fix = locate();
    fixRef.current = fix;
    setStation(null);
    setStationMessage(null);
    setStationLoading(true);

    fix
      .then(async f => {
        if (!f) return {found: null, message: NO_LOCATION_FOR_STATION};
        const found = await findNearestFuelStation(f).catch(() => null);
        return {found, message: found ? null : NO_STATION};
      })
      .then(({found, message}) => {
        if (openId !== openIdRef.current) return;
        setStation(found);
        setStationMessage(message);
        setStationLoading(false);
      });
  }, []);

  const open = useCallback(() => {
    ++openIdRef.current;
    setError(null);
    setVisible(true);
    lookUpStation();
  }, [lookUpStation]);

  const searchStation = useCallback(() => {
    if (stationLoading || submitting) return;
    ++openIdRef.current;
    lookUpStation();
  }, [lookUpStation, stationLoading, submitting]);

  const openAtStation = useCallback(
    (found: NearestFuelStation, fix: LocationResult) => {
      ++openIdRef.current;
      fixRef.current = Promise.resolve(fix);
      setError(null);
      setStation(found);
      setStationMessage(null);
      setStationLoading(false);
      setVisible(true);
    },
    [],
  );

  const close = useCallback(() => {
    if (submitting) return;
    setVisible(false);
    setError(null);
  }, [submitting]);

  const submit = useCallback(
    async (pricePerGallon: number, stationName: string = '') => {
      setSubmitting(true);
      setError(null);
      try {
        // A failed first fix (permission granted just now, GPS switched on)
        // gets one more try rather than blocking the report.
        const fix = (await fixRef.current) ?? (await locate());
        if (!fix) {
          setError(NO_LOCATION);
          return;
        }

        // The id names HERE's station. Once the driver has typed a different
        // name it would name the wrong one, so it only goes with HERE's name.
        const name = stationName.trim();
        const hereStationId =
          station?.id && name === station.name ? station.id : undefined;

        const result = await submitFuelPriceEntry({
          pricePerGallon,
          latitude: fix.latitude,
          longitude: fix.longitude,
          stationName: name,
          hereStationId,
        });
        setVisible(false);
        onSubmitted(result, {pricePerGallon, stationName: name});
      } catch (e) {
        const err = e as AxiosError<ApiErrorBody> & ErrorLike;
        setError(err?.response?.data?.message || ERROR);
      } finally {
        setSubmitting(false);
      }
    },
    [onSubmitted, station],
  );

  return {
    visible,
    submitting,
    error,
    station,
    stationLoading,
    stationMessage,
    open,
    searchStation,
    openAtStation,
    close,
    submit,
  };
}
