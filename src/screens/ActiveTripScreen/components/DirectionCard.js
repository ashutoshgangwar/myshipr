import React from 'react';
import {View} from 'react-native';

import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';
import {ms} from '../../../theme/scale';
import ManeuverIcon from './ManeuverIcon';

/**
 * The next-turn card that sits under the back button while guidance is running:
 * an arrow, what the driver has to do, and how far away it is.
 *
 * It shows the maneuver only — the road name, ETA and controls stay on the trip
 * card, so this stays glanceable from the driving position.
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
function maneuverLabel(action, direction) {
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
function formatDistance(meters) {
  if (!Number.isFinite(meters) || meters < 0) return null;
  if (meters < 15) return 'Now';
  if (meters < METERS_PER_MILE / 10) {
    return `${Math.round((meters * FEET_PER_METER) / 10) * 10} ft`;
  }
  return `${(meters / METERS_PER_MILE).toFixed(1)} mi`;
}

export default function DirectionCard({visible, maneuver, metersToNext}) {
  if (!visible || !maneuver) return null;

  const {action, direction} = maneuver;
  // Live metres to the turn, falling back to the distance the maneuver itself
  // was announced with before the first progress tick lands.
  const meters = Number.isFinite(metersToNext)
    ? metersToNext
    : maneuver.distanceMeters;
  const distance = formatDistance(meters);

  return (
    <View style={styles.directionCard} pointerEvents="none">
      <ManeuverIcon
        action={action}
        direction={direction}
        size={ms(26)}
        color="#FFFFFF"
      />
      <AppText style={styles.directionLabel} numberOfLines={1}>
        {maneuverLabel(action, direction)}
      </AppText>
      {distance ? (
        <AppText style={styles.directionDistance}>{distance}</AppText>
      ) : null}
    </View>
  );
}
