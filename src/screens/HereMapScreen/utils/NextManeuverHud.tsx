// NextManeuverHud.jsx
//
// Google-Maps-style maneuver banner shown at the top of the map while
// navigating. It reads the SAME HERE turn-by-turn data the bottom panel uses
// (routes[0].sections[0].actions) and shows:
//   • a big arrow for the UPCOMING maneuver (turn left / right / roundabout / …)
//   • a live distance to that maneuver that counts down as you approach
//     (… 300 m → 50 → 40 → 30 → 20 → 10 → Now), driven by `metersToNext`
//   • the instruction / street name for the maneuver
//
// It is platform-agnostic (pure RN), so iOS and Android render identically.
import React, {useEffect, useMemo, useRef} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';
import {resolveIndices, resolveIcon, resolveColor} from './Turnbyturnpanel';
import type {StyleProp, ViewStyle} from 'react-native';

/** One turn-by-turn instruction, as HERE emits it. */
export interface ManeuverStep {
  action?: string;
  direction?: string;
  instruction?: string;
  /** Street or road name for the maneuver. */
  name?: string;
  length?: number;
  duration?: number;
  offset?: number;
  [key: string]: unknown;
}

/** The legacy REST-shaped response the panels can read instead of `steps`. */
export interface ManeuverRouteResponse {
  routes?: Array<{
    sections?: Array<{
      actions?: ManeuverStep[];
      summary?: {length?: number; duration?: number};
      [key: string]: unknown;
    }>;
  }>;
  [key: string]: unknown;
}

/** Props shared by the maneuver HUD and the turn-by-turn panel. */
export interface ManeuverPanelProps {
  /** The flat maneuver list from HereRouting. */
  steps?: ManeuverStep[];
  /** Legacy alternative to `steps`. */
  routeResponse?: ManeuverRouteResponse | null;
  isNavigating?: boolean;
  /** Upcoming-maneuver index from the HERE navigator; preferred when present. */
  maneuverIndex?: number | null;
  snapSegmentIndex?: number;
  /** Live metres to the next maneuver. */
  metersToNext?: number | null;
  /** Distance/duration for the whole leg, shown in the expanded panel. */
  summary?: {length?: number; duration?: number} | null;
  style?: StyleProp<ViewStyle>;
}

// Round to a tidy countdown value. Google snaps the close-range readout to the
// nearest 10 m, which gives the 50→40→30→20→10 cadence the design asks for.
function formatCountdown(
  m?: number | null,
): {value: string; unit: string} | null {
  if (m == null || !Number.isFinite(m) || m < 0) return null;
  if (m < 10) return {value: 'Now', unit: ''};
  if (m < 1000) {
    const rounded = Math.round(m / 10) * 10; // …50, 40, 30, 20, 10
    return {value: String(rounded), unit: 'm'};
  }
  return {value: (m / 1000).toFixed(1), unit: 'km'};
}

export default function NextManeuverHud({
  // Either the flat maneuver list from HereRouting, or the legacy REST response.
  steps: stepsProp,
  routeResponse,
  isNavigating = false,
  // Upcoming-maneuver index from the HERE navigator; preferred when present.
  maneuverIndex = null,
  snapSegmentIndex = -1,
  metersToNext = null,
  style,
}: ManeuverPanelProps) {
  const steps = useMemo(() => {
    if (Array.isArray(stepsProp)) return stepsProp;
    try {
      return routeResponse?.routes?.[0]?.sections?.[0]?.actions ?? [];
    } catch {
      return [];
    }
  }, [stepsProp, routeResponse]);

  const {nextActionIdx} = useMemo(
    () => resolveIndices(steps, {maneuverIndex, snapSegmentIndex, metersToNext}),
    [steps, maneuverIndex, snapSegmentIndex, metersToNext],
  );

  // The maneuver we are driving TOWARD (the one `metersToNext` measures to).
  const maneuver = steps[nextActionIdx] ?? null;

  // Distance to show: live metres to the maneuver, falling back to the step's
  // own length before the first snap lands.
  const distMeters =
    metersToNext != null && Number.isFinite(metersToNext) && metersToNext >= 0
      ? metersToNext
      : typeof maneuver?.length === 'number' && Number.isFinite(maneuver.length)
      ? maneuver.length
      : null;
  const countdown = formatCountdown(distMeters);

  // Gentle pulse on the arrow once the maneuver is imminent (≤ 60 m).
  const imminent = distMeters != null && Number.isFinite(distMeters) && distMeters <= 60;
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    let loop: Animated.CompositeAnimation | undefined;
    if (isNavigating && imminent) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.14,
            duration: 380,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1.0,
            duration: 380,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
    } else {
      pulse.setValue(1);
    }
    return () => loop?.stop();
  }, [isNavigating, imminent, pulse]);

  if (!isNavigating || !maneuver) return null;

  const icon = resolveIcon(maneuver);
  const color = resolveColor(maneuver.action);

  return (
    <View style={[s.wrap, style]} pointerEvents="none">
      <View style={s.card}>
        <Animated.View
          style={[
            s.iconWrap,
            {borderColor: color, backgroundColor: color + '26'},
            {transform: [{scale: pulse}]},
          ]}>
          <Text style={[s.icon, {color}]}>{icon}</Text>
        </Animated.View>

        <View style={s.body}>
          {countdown && (
            <Text style={s.distRow}>
              <Text style={s.distValue}>{countdown.value}</Text>
              {!!countdown.unit && <Text style={s.distUnit}> {countdown.unit}</Text>}
            </Text>
          )}
          <Text style={s.instruction} numberOfLines={2}>
            {maneuver.instruction}
          </Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    zIndex: 150,
    elevation: 150,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.92)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {fontSize: 32, lineHeight: 36, fontWeight: '700'},
  body: {flex: 1, justifyContent: 'center'},
  distRow: {marginBottom: 2},
  distValue: {color: '#f8fafc', fontSize: 26, fontWeight: '800', lineHeight: 30},
  distUnit: {color: '#cbd5e1', fontSize: 15, fontWeight: '700'},
  instruction: {color: '#e2e8f0', fontSize: 14, fontWeight: '600', lineHeight: 19},
});
