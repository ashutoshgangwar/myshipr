import React, {useEffect, useRef, useState} from 'react';
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

/**
 * Two decimals — about a kilometre. This row prints a street address, and a
 * fix that has only crept along the road resolves to the same one, so the
 * effect below is keyed off the rounded coordinate rather than off the fix
 * object. Keyed off the object it re-ran on every GPS update and spent a
 * reverse-geocode call redrawing text that had not changed.
 */
const coordKeyOf = (
  location: {latitude: number; longitude: number} | null | undefined,
): string =>
  location
    ? `${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}`
    : '';

const useCurrentLocationStop = (enabled: boolean) => {
  const {location, loading} = useLocation({fetchOnMount: enabled});
  const [address, setAddress] = useState(null);

  // The fix itself is read through a ref, which always holds the one the key
  // below was built from.
  const fixRef = useRef(location);
  fixRef.current = location;
  const coordKey = coordKeyOf(location);

  useEffect(() => {
    const fix = fixRef.current;
    if (!enabled || !coordKey || !fix) return undefined;
    let active = true;
    reverseGeocode(fix)
      .then(place => {
        if (active && place) setAddress(place.address || place.title);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [enabled, coordKey]);

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
  /**
   * How many lines a stop's name may wrap to before it ellipsizes. One by
   * default, which is what the narrow columns want; the shipment sheet asks
   * for two so a full street address reads rather than trailing off mid-word.
   */
  nameLines?: number;
  style?: StyleProp<ViewStyle>;
}

export default function RouteStops({
  stops = [],
  showSummary = false,
  liveCurrentLocation = false,
  nameLines = 1,
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

  // Every extra name line has to be paid for in row height: the row is a fixed
  // box, so a name that wraps inside the original one would push its own sub
  // out of it. The dashed connector is spaced off the same figure, so growing
  // it here keeps the line running marker-to-marker rather than stopping short.
  const lines = Math.max(1, Math.round(nameLines));
  const rowHeight = ROUTE_ROW_H + NAME_LINE_H * (lines - 1);

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
            height={rowHeight - 2 * DASH_GAP}
            preserveAspectRatio="none"
            style={[
              styles.dashed,
              {top: NAME_LINE_H / 2 + i * rowHeight + DASH_GAP},
            ]}
          />
        ))}

        {resolvedStops.map((s, i) => (
          <View key={`${s.kind}-${i}`} style={[styles.row, {height: rowHeight}]}>
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
              <AppText style={styles.name} numberOfLines={lines}>
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
