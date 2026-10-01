/**
 * The destination a driver nominates as their favourite, asked for once per
 * login and filed with `POST /drivers/favorite-destinations/save-coordinates`.
 *
 * The endpoint wants the coordinate AND the postal parts, while the picker
 * only ever collects one half at a time — the map tab knows where the pin is
 * but not what it is called, the manual tab the other way round. So each half
 * is completed by HERE before the call goes out: the map tab reverse-geocodes
 * its pin into parts, the manual tab forward-geocodes its address into a
 * coordinate. See `screens/FavoriteDestination/saveDestination`.
 */
export interface SaveFavoriteDestinationParams {
  /** Degrees, -90..90. Required — the endpoint is keyed on the coordinate. */
  latitude: number;
  /** Degrees, -180..180. */
  longitude: number;
  /** The street line only, not the whole formatted label. */
  address?: string;
  /** The API's spelling, capital M — do not "fix" it to `landmark`. */
  landMark?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

/**
 * What the save answers with. Nothing reads a field off it yet — the screen
 * only needs to know the call succeeded — so it is left as the unwrapped body
 * rather than guessed at.
 */
export type SavedFavoriteDestination = Record<string, unknown>;
