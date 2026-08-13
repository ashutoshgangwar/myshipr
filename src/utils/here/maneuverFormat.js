/**
 * How a HERE maneuver is worded and measured on screen.
 *
 * Both the full-screen next-turn card and the floating trip map read the same
 * guidance, so the phrasing and the units live here rather than in whichever
 * card was written first — a turn must not be "Turn Left · 0.2 mi" on one and
 * "Left in 320 m" on the other.
 */

const DIRECTION_LABEL = {
  left: 'Left',
  right: 'Right',
  'slight-left': 'Slight Left',
  'slight-right': 'Slight Right',
  'sharp-left': 'Sharp Left',
  'sharp-right': 'Sharp Right',
  straight: 'Straight',
  uturn: 'U-Turn',
};

/** "Turn Left", "Keep Right", … from the HERE `{action, direction}` pair. */
export function maneuverLabel(action, direction) {
  const dir = DIRECTION_LABEL[direction];

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
 */
export function formatManeuverDistance(meters) {
  if (!Number.isFinite(meters) || meters < 0) return null;
  if (meters < 15) return 'Now';
  if (meters < METERS_PER_MILE / 10) {
    return `${Math.round((meters * FEET_PER_METER) / 10) * 10} ft`;
  }
  return `${(meters / METERS_PER_MILE).toFixed(1)} mi`;
}
