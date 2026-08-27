import React from 'react';
import {View} from 'react-native';

import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';
import {ms} from '../../../theme/scale';
import ManeuverIcon from './ManeuverIcon';
import {
  formatManeuverDistance,
  maneuverLabel,
} from '../../../utils/here/maneuverFormat';

/**
 * The next-turn card that sits under the back button while guidance is running:
 * an arrow, what the driver has to do, and how far away it is.
 *
 * It shows the maneuver only — the road name, ETA and controls stay on the trip
 * card, so this stays glanceable from the driving position.
 */

export interface DirectionCardProps {
  visible?: boolean;
  maneuver?: {
    action?: string;
    direction?: string;
    /** Distance the turn was first announced with. */
    distanceMeters?: number;
  } | null;
  /** Live metres to the turn; falls back to the maneuver's own distance. */
  metersToNext?: number | null;
}

export default function DirectionCard({
  visible,
  maneuver,
  metersToNext,
}: DirectionCardProps) {
  if (!visible || !maneuver) return null;

  const {action, direction} = maneuver;
  // Live metres to the turn, falling back to the distance the maneuver itself
  // was announced with before the first progress tick lands.
  const meters = Number.isFinite(metersToNext)
    ? metersToNext
    : maneuver.distanceMeters;
  const distance = formatManeuverDistance(meters);

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
