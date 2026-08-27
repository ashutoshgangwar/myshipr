import React, {useEffect, useState} from 'react';
import {View} from 'react-native';

import styles, {ROUTE_ROW_H, NAME_LINE_H} from './RouteStops.styles';
import AppText from '../../theme/AppText';
import CityRing from '../../assets/svg_icon/city_ring.svg';
import DropPin from '../../assets/svg_icon/stop_pin_green.svg';
import RouteDashedLine from '../../assets/svg_icon/RouteDashedLine.svg';
import {useLocation} from '../../services/LocationService';
import {reverseGeocode} from '../../screens/HereMapScreen/services/hereTruckService';
import type {StyleProp, ViewStyle} from 'react-native';
const DASH_GAP = 11;

export const routeSummary = (stops: RouteStop[]): string => {
  const pickups = stops.filter(s => s.kind === 'pickup').length;
  const drops = stops.filter(s => s.kind === 'drop').length;
  return `${pickups} PICKUP · ${drops} DROP`;
};

const useCurrentLocationStop = (enabled: boolean) => {
  const {location, loading} = useLocation({fetchOnMount: enabled});
  const [address, setAddress] = useState(null);

  useEffect(() => {
    if (!enabled || !location) return undefined;
    let active = true;
    reverseGeocode(location)
      .then(place => {
        if (active && place) setAddress(place.address || place.title);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [enabled, location]);

  if (!enabled) return null;
  return {
    label: address || 'Current Location',
    sub: !address && loading ? 'Locating…' : 'You are here',
  };
};

// Only pickups and drops are counted — the `current` stop returns its label
// before any tally is read, so it never needs an entry.
type KindCounts = {pickup: number; drop: number};

const buildLabel = (
  stop: RouteStop,
  totals: KindCounts,
  running: KindCounts,
): string => {
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

/** One stop on the vertical route strip. */
export interface RouteStop {
  kind: 'pickup' | 'drop' | 'current';
  label?: string;
  sub?: string;
  [key: string]: unknown;
}

export interface RouteStopsProps {
  stops?: RouteStop[];
  showSummary?: boolean;
  /** Resolve the `current` stop's address from the live GPS fix. */
  liveCurrentLocation?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function RouteStops({
  stops = [],
  showSummary = false,
  liveCurrentLocation = false,
  style,
}: RouteStopsProps) {
  const hasCurrent = stops.some(s => s.kind === 'current');
  const currentLive = useCurrentLocationStop(liveCurrentLocation && hasCurrent);

  if (!stops.length) {
    return null;
  }
  const resolvedStops = currentLive
    ? stops.map(s =>
        s.kind === 'current'
          ? {...s, label: s.label ?? currentLive.label, sub: s.sub ?? currentLive.sub}
          : s,
      )
    : stops;

  const last = resolvedStops.length - 1;
  const totals = {
    pickup: resolvedStops.filter(s => s.kind === 'pickup').length,
    drop: resolvedStops.filter(s => s.kind === 'drop').length,
  };
  // Mutated as we map so pickup/drop numbers follow document order.
  const running = {pickup: 0, drop: 0};

  return (
    <View style={style}>
      {showSummary ? (
        <AppText style={styles.summary}>ROUTE · {routeSummary(resolvedStops)}</AppText>
      ) : null}

      <View style={styles.stops}>
        {/* Reuse the shared dashed-line asset once per gap between consecutive
            markers, each inset by DASH_GAP so the line stays clear of every
            ring/pin. */}
        {Array.from({length: last}).map((_, i) => (
          <RouteDashedLine
            key={i}
            width={2}
            height={ROUTE_ROW_H - 2 * DASH_GAP}
            preserveAspectRatio="none"
            style={[
              styles.dashed,
              {top: NAME_LINE_H / 2 + i * ROUTE_ROW_H + DASH_GAP},
            ]}
          />
        ))}

        {resolvedStops.map((s, i) => (
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
              <AppText style={styles.name} numberOfLines={1}>
                {buildLabel(s, totals, running)}
              </AppText>
              {s.sub ? (
                <AppText style={styles.sub} numberOfLines={1}>
                  {s.sub}
                </AppText>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
