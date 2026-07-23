import React from 'react';
import {View} from 'react-native';

import styles, {
  STOP_LINE_H,
  MARKER_H,
  DASH_INSET,
  CITY_RING,
  DROP_PIN_W,
  DROP_PIN_H,
} from './LoadRoute.styles';
import AppText from '../../theme/AppText';
import CityRing from '../../assets/svg_icon/city_ring.svg';
import DropPin from '../../assets/svg_icon/stop_pin_green.svg';
import RouteDashedLine from '../../assets/svg_icon/RouteDashedLine.svg';

export {STOP_LINE_H, STOP_SUMMARY_H} from './LoadRoute.styles';

// Accepts stops as plain strings ('San Jose CA') or objects ({city} / {label}).
const cityOf = stop =>
  typeof stop === 'string' ? stop : stop?.city ?? stop?.label ?? '';

// First stop is the pickup, the rest are drops (matches how every screen builds
// its stop list), so the summary copy can be derived from the count.
const summaryOf = stops => {
  const drops = Math.max(0, stops.length - 1);
  return `1 Pickup ${drops} Drop`;
};

/**
 * Shared load-route: a vertical dashed line joining a city ring at each pickup
 * to a green pin at the final drop, with the city name beside every marker.
 *
 * @param stops        array of city strings or {city}/{label} objects
 * @param showSummary  render the derived "1 Pickup N Drop" line below
 * @param textStyle    override for the city label (e.g. truncation width)
 * @param summaryStyle override for the summary line
 * @param style        wrapper style
 */
export default function LoadRoute({
  stops = [],
  showSummary = false,
  textStyle,
  summaryStyle,
  style,
}) {
  if (!stops.length) return null;

  const cities = stops.map(cityOf);
  const last = cities.length - 1;

  return (
    <View style={style}>
      <View style={styles.wrap}>
        {/* One dashed segment per gap, inset so it stays clear of the markers. */}
        {Array.from({length: last}).map((_, i) => (
          <RouteDashedLine
            key={i}
            width={2}
            height={STOP_LINE_H - 2 * DASH_INSET}
            preserveAspectRatio="none"
            style={[
              styles.dashed,
              {top: MARKER_H / 2 + i * STOP_LINE_H + DASH_INSET},
            ]}
          />
        ))}

        {cities.map((city, i) => (
          <View key={`${city}-${i}`} style={styles.row}>
            <View style={styles.marker}>
              {i === last ? (
                <DropPin width={DROP_PIN_W} height={DROP_PIN_H} />
              ) : (
                <CityRing width={CITY_RING} height={CITY_RING} />
              )}
            </View>
            <AppText style={[styles.city, textStyle]} numberOfLines={1}>
              {city}
            </AppText>
          </View>
        ))}
      </View>

      {showSummary ? (
        <AppText style={[styles.summary, summaryStyle]} numberOfLines={1}>
          {summaryOf(cities)}
        </AppText>
      ) : null}
    </View>
  );
}
