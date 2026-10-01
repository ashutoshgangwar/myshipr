/**
 * Turns what the favourite-destination picker collected into the one body
 * `POST /drivers/favorite-destinations/save-coordinates` accepts.
 *
 * The endpoint wants a coordinate AND the postal parts; each tab of the picker
 * only has one of those halves, so the missing half is asked of HERE here:
 *
 *   - map tab    — has the pin, reverse-geocodes it into street/city/state/ZIP
 *   - manual tab — has the parts, forward-geocodes them into a coordinate
 *
 * Forward geocoding is the one that can legitimately come back empty (a typo in
 * the street, an address HERE does not carry), and that is the driver's to fix
 * rather than a failure to report — hence the `{ok: false}` result instead of a
 * throw. Everything else, the save included, throws.
 */

import {
  geocode,
  normalizeLocationCoords,
  reverseGeocode,
} from '../../../services/hereSdkService';
import {saveFavoriteDestination} from '../../../config/driverApi';
import type {
  FavoriteAddress,
  FavoriteDestinationHandoff,
} from '../../../types/navigation';
import type {SaveFavoriteDestinationParams} from '../../../types/favoriteDestination';

/**
 * The structured half of a HERE place — `addressDetails` in the bridge's
 * payload, emitted identically by both platforms (see `HereSdkSerialization`
 * on Android and `HEREBridge` on iOS).
 */
interface HereAddressDetails {
  label?: string;
  street?: string;
  houseNumber?: string;
  city?: string;
  district?: string;
  state?: string;
  stateCode?: string;
  postalCode?: string;
}

interface HerePlaceResult {
  title?: string;
  address?: string;
  addressDetails?: HereAddressDetails;
}

/**
 * A pass carries nothing; a fail says only that the address could not be put
 * on the map, which is the single recoverable outcome the screen renders copy
 * for.
 */
export type SaveDestinationResult = {ok: true} | {ok: false; reason: 'unlocatable'};

const trim = (value?: string | null): string => String(value ?? '').trim();

/** "12 Main St" from the two parts HERE splits a street line into. */
const streetLine = (details: HereAddressDetails): string =>
  [trim(details.houseNumber), trim(details.street)].filter(Boolean).join(' ');

/** The one-line query the forward geocoder is given for a typed address. */
const addressQuery = (address: FavoriteAddress): string =>
  [
    trim(address.street),
    trim(address.landmark),
    trim(address.city),
    trim(address.state),
    trim(address.zip),
  ]
    .filter(Boolean)
    .join(', ');

/**
 * Fills in the postal parts under a dropped pin. A reverse geocode that fails
 * is not fatal — `hereSdkService` already swallows it to null — so the pin's
 * own label stands in as the address and the rest go up empty.
 */
const fromMapPin = async ({
  latitude,
  longitude,
  description,
}: {
  latitude: number;
  longitude: number;
  description?: string;
}): Promise<SaveFavoriteDestinationParams> => {
  const place = (await reverseGeocode({latitude, longitude})) as HerePlaceResult | null;
  const details = place?.addressDetails ?? {};

  return {
    latitude,
    longitude,
    address:
      streetLine(details) || trim(place?.address) || trim(description),
    city: trim(details.city),
    state: trim(details.state) || trim(details.stateCode),
    zipCode: trim(details.postalCode),
  };
};

/**
 * Puts a typed address on the map. Returns null when HERE cannot place it,
 * which is what the screen turns into "check the address or drop a pin".
 */
const fromTypedAddress = async (
  address: FavoriteAddress,
): Promise<SaveFavoriteDestinationParams | null> => {
  const query = addressQuery(address);
  if (!query) return null;

  const [match] = await geocode(query, null, 1);
  const coords = normalizeLocationCoords(match);
  if (!coords) return null;

  return {
    latitude: coords.lat,
    longitude: coords.lng,
    // The driver's own words win over the geocoder's — they typed these five
    // fields, and echoing HERE's tidier spelling back at them would read as
    // the app having changed their answer.
    address: trim(address.street),
    landMark: trim(address.landmark),
    city: trim(address.city),
    state: trim(address.state),
    zipCode: trim(address.zip),
  };
};

/**
 * Resolves whichever half is missing and files the destination.
 *
 * @param handoff exactly what the picker's Confirm button has in hand
 */
export const submitFavoriteDestination = async (
  handoff: FavoriteDestinationHandoff,
): Promise<SaveDestinationResult> => {
  const payload =
    handoff.type === 'map'
      ? await fromMapPin(handoff.coordinate)
      : await fromTypedAddress(handoff.address);

  if (!payload) return {ok: false, reason: 'unlocatable'};

  await saveFavoriteDestination(payload);
  return {ok: true};
};
