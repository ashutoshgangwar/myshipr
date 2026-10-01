/**
 * The units the app quotes a drive in.
 *
 * The HERE SDK measures in metres, metres per second and kilometres per hour,
 * and it does that on every screen. The drivers reading those screens run US
 * loads — the trip endpoint sends miles and pounds, the road signs say mph —
 * so the conversion has to happen somewhere, and it happens here rather than
 * in each card, which is how "18 km" and "11 mi" ended up on two readouts of
 * the same leg.
 *
 * Metres stay metres everywhere in the logic above this file. Only what is
 * about to be drawn on screen is converted.
 */

export const METERS_PER_MILE = 1609.344;
export const FEET_PER_METER = 3.28084;
export const MILES_PER_KILOMETER = 0.621371;

/** Metres → miles, unrounded; the caller decides the precision. */
export const metersToMiles = (meters: number): number =>
  meters / METERS_PER_MILE;

/** Metres → feet, unrounded. */
export const metersToFeet = (meters: number): number => meters * FEET_PER_METER;

/** km/h → mph, unrounded — the SDK's speed and speed-limit events. */
export const kphToMph = (kph: number): number => kph * MILES_PER_KILOMETER;

/**
 * A distance readout in the units a US nav screen counts down in: feet under a
 * tenth of a mile, miles above it.
 *
 * `null` for anything that is not a usable distance, which every caller already
 * treats as "no readout".
 */
export const formatDistance = (
  meters: number | null | undefined,
): string | null => {
  if (meters == null || !Number.isFinite(meters) || meters < 0) return null;
  if (meters < METERS_PER_MILE / 10) {
    return `${Math.round(metersToFeet(meters) / 10) * 10} ft`;
  }
  return `${metersToMiles(meters).toFixed(1)} mi`;
};
