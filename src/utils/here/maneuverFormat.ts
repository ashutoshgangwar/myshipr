/**
 * How a HERE maneuver is worded and measured on screen.
 *
 * Both the full-screen next-turn card and the floating trip map read the same
 * guidance, so the phrasing and the units live here rather than in whichever
 * card was written first — a turn must not be "Turn Left · 0.2 mi" on one and
 * "Left in 320 m" on the other.
 */

const DIRECTION_LABEL: Record<string, string> = {
  left: 'Left',
  right: 'Right',
  'slight-left': 'Slight Left',
  'slight-right': 'Slight Right',
  'sharp-left': 'Sharp Left',
  'sharp-right': 'Sharp Right',
  straight: 'Straight',
  uturn: 'U-Turn',
};

/**
 * The maneuver kinds this module words. Widened with `string` because the
 * value comes from the native SDK: an action outside this list must still
 * reach the `default` branch and read "Continue", not fail to compile.
 */
export type ManeuverAction =
  | 'depart'
  | 'arrive'
  | 'turn'
  | 'keep'
  | 'exit'
  | 'ramp'
  | 'merge'
  | 'roundaboutEnter'
  | 'roundaboutPass'
  | 'roundaboutExit'
  | (string & {});

/** "Turn Left", "Keep Right", … from the HERE `{action, direction}` pair. */
export function maneuverLabel(
  action: ManeuverAction | null | undefined,
  direction?: string | null,
): string {
  const dir = direction ? DIRECTION_LABEL[direction] : undefined;

  switch (action) {
    case 'depart':
      return 'Start';
    case 'arrive':
      return 'Arrive';
    case 'turn':
      if (direction === 'uturn') return 'U-Turn';
      return dir ? `Turn ${dir}` : 'Turn';
    case 'keep':
      return dir ? `Keep ${dir}` : 'Keep Going';
    case 'exit':
      return dir ? `Exit ${dir}` : 'Take Exit';
    case 'ramp':
      return dir ? `Ramp ${dir}` : 'Take Ramp';
    case 'merge':
      return dir ? `Merge ${dir}` : 'Merge';
    case 'roundaboutEnter':
    case 'roundaboutPass':
    case 'roundaboutExit':
      return 'Roundabout';
    default:
      return 'Continue';
  }
}

const METERS_PER_MILE = 1609.344;
const FEET_PER_METER = 3.28084;

/**
 * Distance to the maneuver, in the units the rest of the app quotes trips in.
 * Under a tenth of a mile it switches to feet, the way a nav readout counts the
 * last block down instead of sitting on "0.0 mi".
 *
 * Returns `null` for anything that is not a usable distance — callers already
 * treat that as "no readout", so it is in the signature rather than implied.
 */
export function formatManeuverDistance(
  meters: number | null | undefined,
): string | null {
  // The `== null` guard is what narrows `meters` to `number` for the rest of
  // the body. It is not an extra check: `Number.isFinite(null)` and
  // `Number.isFinite(undefined)` are both already false, so the same inputs
  // return null as before — this just lets it happen without a cast.
  if (meters == null || !Number.isFinite(meters) || meters < 0) return null;
  if (meters < 15) return 'Now';
  if (meters < METERS_PER_MILE / 10) {
    return `${Math.round((meters * FEET_PER_METER) / 10) * 10} ft`;
  }
  return `${(meters / METERS_PER_MILE).toFixed(1)} mi`;
}
