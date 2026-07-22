import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import Svg, {Line} from 'react-native-svg';

import styles, {ROUTE_ROW_H, NAME_LINE_H} from './RouteStops.styles';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import CityRing from '../../assets/svg_icon/city_ring.svg';
import DropPin from '../../assets/svg_icon/stop_pin_green.svg';
import {useLocation} from '../../services/LocationService';
import {reverseGeocode} from '../../screens/HereMapScreen/services/hereTruckService';
const DASH_GAP = 11;

export const routeSummary = stops => {
  const pickups = stops.filter(s => s.kind === 'pickup').length;
  const drops = stops.filter(s => s.kind === 'drop').length;
  return `${pickups} PICKUP · ${drops} DROP`;
};

const useCurrentLocationStop = enabled => {
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

export default function RouteStops({
  stops = [],
  showSummary = false,
  liveCurrentLocation = false,
  style,
}) {
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
        {/* One dashed segment per gap between consecutive markers. */}
        {resolvedStops.length > 1 ? (
          <Svg
            width={2}
            height={last * ROUTE_ROW_H}
            style={[styles.dashed, {top: NAME_LINE_H / 2}]}>
            {resolvedStops.slice(1).map((_, i) => (
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
