import React from 'react';
import {View} from 'react-native';
import Svg, {Line} from 'react-native-svg';

import styles, {ROUTE_ROW_H} from './RouteStops.styles';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import CityRing from '../../assets/svg_icon/city_ring.svg';
import DropPin from '../../assets/svg_icon/stop_pin_green.svg';

/* Reusable multi-stop route timeline.

   stops: [{ kind: 'current' | 'pickup' | 'drop', sub?, label? }]
   - `kind` picks the marker (city_ring for current/pickup, green pin for drop)
     and drives the auto-numbered label.
   - `sub` is the small line under the label (time window / "You are here").
   - `label` is optional and overrides the auto-generated one — the API can
     pass real point names here later.

   Pickup/drop point numbers are derived from order, so 2 pickups render
   "Pickup Location 1 / 2" automatically; a lone pickup/drop stays unnumbered. */

// Inset each dashed segment from the markers so every ring/pin keeps clear
// space around it. Drawn with SVG (not a dashed border) so dashes render on iOS.
const DASH_GAP = 11;

// "2 PICKUP · 1 DROP" — derived so summary copy can never drift from the stops.
export const routeSummary = stops => {
  const pickups = stops.filter(s => s.kind === 'pickup').length;
  const drops = stops.filter(s => s.kind === 'drop').length;
  return `${pickups} PICKUP · ${drops} DROP`;
};

const buildLabel = (stop, totals, running) => {
  if (stop.label) return stop.label;
  switch (stop.kind) {
    case 'current':
      return 'Current Location';
    case 'pickup':
      running.pickup += 1;
      return totals.pickup > 1
        ? `Pickup Location ${running.pickup}`
        : 'Pickup Location';
    case 'drop':
      running.drop += 1;
      return totals.drop > 1 ? `Drop Location ${running.drop}` : 'Drop Location';
    default:
      return '';
  }
};

export default function RouteStops({stops = [], showSummary = false, style}) {
  if (!stops.length) {
    return null;
  }

  const last = stops.length - 1;
  const totals = {
    pickup: stops.filter(s => s.kind === 'pickup').length,
    drop: stops.filter(s => s.kind === 'drop').length,
  };
  // Mutated as we map so pickup/drop numbers follow document order.
  const running = {pickup: 0, drop: 0};

  return (
    <View style={style}>
      {showSummary ? (
        <AppText style={styles.summary}>ROUTE · {routeSummary(stops)}</AppText>
      ) : null}

      <View style={styles.stops}>
        {/* One dashed segment per gap between consecutive markers. */}
        {stops.length > 1 ? (
          <Svg
            width={2}
            height={last * ROUTE_ROW_H}
            style={[styles.dashed, {top: ROUTE_ROW_H / 2}]}>
            {stops.slice(1).map((_, i) => (
              <Line
                key={i}
                x1={1}
                y1={i * ROUTE_ROW_H + DASH_GAP}
                x2={1}
                y2={(i + 1) * ROUTE_ROW_H - DASH_GAP}
                stroke={colors.primaryLight}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeDasharray="2 3"
              />
            ))}
          </Svg>
        ) : null}

        {stops.map((s, i) => (
          <View key={`${s.kind}-${i}`} style={styles.row}>
            <View style={styles.marker}>
              {s.kind === 'drop' ? (
                <DropPin width={14} height={16} />
              ) : (
                <CityRing
                  width={15}
                  height={15}
                  style={s.kind === 'current' ? styles.markerCurrent : null}
                />
              )}
            </View>
            <View style={styles.text}>
              <AppText style={styles.name}>
                {buildLabel(s, totals, running)}
              </AppText>
              {s.sub ? <AppText style={styles.sub}>{s.sub}</AppText> : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
