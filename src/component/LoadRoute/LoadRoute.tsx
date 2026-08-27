import React from 'react';
import {TouchableOpacity, View} from 'react-native';
import Svg, {Line} from 'react-native-svg';

import styles, {
  STOP_LINE_H,
  MORE_ROW_H,
  MARKER_H,
  DASH_INSET,
  STOP_GAP,
  CITY_RING,
  DROP_PIN_W,
  DROP_PIN_H,
} from './LoadRoute.styles';
import AppText from '../../theme/AppText';
import CityRing from '../../assets/svg_icon/city_ring.svg';
import DropPin from '../../assets/svg_icon/stop_pin_green.svg';
import type {StyleProp, TextStyle, ViewStyle} from 'react-native';

// RouteDashedLine.svg is a fixed 12-unit line that callers stretch to length,
// which would also stretch its dash pattern — fine when every gap is the same
// height, wrong once the "+N More …" row makes one segment twice as tall. The
// line is drawn here instead so the dash pattern stays identical at any length,
// matching the density the stretched asset produces for a normal stop gap.
const DASH_STROKE = '#999AB2';
const DASH_STROKE_W = 1.5;
const DASH_SCALE = (STOP_LINE_H - 2 * DASH_INSET) / 12;
const DASH_ARRAY = [2 * DASH_SCALE, 3 * DASH_SCALE];

// Air at each end of a connector, as a function of the gap it spans.
//
// A one-row gap keeps the original inset — take more out of that and the dash
// all but vanishes. Anything roomier (a spaced pickup → drop pair, or a
// collapsed route reaching past its "+N More …" chip) earns a quarter of the
// extra height back as breathing room, split top and bottom, so a long line
// stops running right up under the city ring and into the pin below it. The
// cap keeps the longest connector from turning into two stubby dashes.
const DASH_INSET_GROWTH = 0.25;
const DASH_INSET_MAX = DASH_INSET * 2;
const insetFor = (span: number): number =>
  Math.min(
    DASH_INSET_MAX,
    DASH_INSET + Math.max(0, span - STOP_LINE_H) * DASH_INSET_GROWTH,
  );

export {
  STOP_LINE_H,
  STOP_SUMMARY_H,
  MORE_ROW_H,
  STOP_GAP,
} from './LoadRoute.styles';

// Accepts stops as plain strings ('San Jose CA') or objects ({city} / {label}).
const cityOf = (stop: LoadRouteStop): string =>
  typeof stop === 'string' ? stop : String(stop?.city ?? stop?.label ?? '');

// Stops may carry an explicit {type: 'pickup' | 'drop'}. When they don't, the
// first stop is the pickup and the rest are drops (how every older screen
// builds its list), so the type can be derived from the position.
const typeOf = (
  stop: LoadRouteStop,
  index: number,
  last: number,
): 'pickup' | 'drop' => {
  const type = typeof stop === 'string' ? null : stop?.type;
  if (type === 'pickup' || type === 'drop') return type;
  return index === last ? 'drop' : 'pickup';
};

const plural = (count: number, word: string): string => `${count} ${word}${count === 1 ? '' : 's'}`;

// Legacy copy kept for the screens that already render it this way.
const summaryOf = (stops: LoadRouteStop[]): string => {
  const drops = Math.max(0, stops.length - 1);
  return `1 Pickup ${drops} Drop`;
};

const typedSummaryOf = (types: Array<'pickup' | 'drop'>): string => {
  const pickups = types.filter(t => t === 'pickup').length;
  const drops = types.length - pickups;
  return `${plural(pickups, 'Pickup')} • ${plural(drops, 'Drop')}`;
};

// Label for the collapsed chip: name the hidden stops when they are all of one
// kind, otherwise fall back to the neutral "Stops".
const moreLabelOf = (hiddenTypes: Array<'pickup' | 'drop'>): string => {
  const pickups = hiddenTypes.filter(t => t === 'pickup').length;
  const drops = hiddenTypes.length - pickups;
  const word = drops === 0 ? 'Pickup' : pickups === 0 ? 'Drop' : 'Stop';
  return `+${hiddenTypes.length} More ${word}${
    hiddenTypes.length === 1 ? '' : 's'
  }`;
};

/**
 * Shared load-route: a vertical dashed line joining a city ring at each pickup
 * to a green pin at every drop, with the city name beside each marker.
 *
 * @param stops         array of city strings or {city, type}/{label} objects
 * @param showSummary   render the summary line below the route
 * @param typed         stops carry pickup/drop types: pin every drop and use
 *                      the "N Pickups • M Drops" summary instead of the legacy
 *                      "1 Pickup N Drop" copy
 * @param collapsed     hide the middle stops behind a "+N More …" chip
 * @param onPressMore   tap handler for that chip
 * @param stopGap       open up the gap wherever one marker sits directly above
 *                      the next — a lone pickup → drop pair, and a route
 *                      expanded out of its chip — so the connector reads as a
 *                      route rather than a single dash. Off by default:
 *                      callers that size their rows from STOP_LINE_H × stop
 *                      count (the Bidding grid) depend on a stop row being
 *                      exactly that tall.
 * @param textStyle     override for the city label (e.g. truncation width)
 * @param summaryStyle  override for the summary line
 * @param style         wrapper style
 */
/**
 * A stop as this component accepts it: either a bare city string, or an object
 * carrying the city plus (optionally) an explicit type.
 */
export type LoadRouteStop =
  | string
  | {city?: string; label?: string; type?: string; [key: string]: unknown};

/**
 * A laid-out row. The "+N More" row carries no marker, hence no `index` or
 * `centre` — a discriminated union so the `row.kind === 'more'` branch in the
 * render narrows the other arm without a cast.
 */
type LayoutRow =
  | {kind: 'stop'; height: number; index: number; centre: number}
  | {kind: 'more'; height: number};

export interface LoadRouteProps {
  stops?: LoadRouteStop[];
  showSummary?: boolean;
  /** Derive the summary from each stop's own type rather than "1 Pickup N Drop". */
  typed?: boolean;
  /** Hide the middle stops behind a "+N More" chip. */
  collapsed?: boolean;
  onPressMore?: () => void;
  stopGap?: boolean;
  textStyle?: StyleProp<TextStyle>;
  summaryStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
}

export default function LoadRoute({
  stops = [],
  showSummary = false,
  typed = false,
  collapsed = false,
  onPressMore,
  stopGap = false,
  textStyle,
  summaryStyle,
  style,
}: LoadRouteProps) {
  if (!stops.length) return null;

  const last = stops.length - 1;
  const cities = stops.map(cityOf);
  const types = stops.map((stop, i) => typeOf(stop, i, last));

  // Rows are laid out top-down with known heights, so the dashed connectors can
  // be positioned from the running offset — this keeps the collapsed chip row
  // (which is taller than a stop row) on the same line as the rest.
  const hidden = collapsed && stops.length > 2 ? types.slice(1, last) : [];

  // The extra gap goes wherever two markers meet with nothing between them:
  // a bare pickup → drop pair, and a route the driver has expanded to see all
  // of its stops. A collapsed route is left alone — the "+N More …" chip is
  // already holding its two ends apart.
  const spaced = stopGap && !hidden.length;

  // Once expanded, the revealed middle stops sit exactly where the "+N More …"
  // chip was, so tapping any of them there collapses the route again.
  const canCollapse = !collapsed && stops.length > 2 && !!onPressMore;
  // `centre` is where this row's marker actually sits, measured from the row
  // top: a plain row centres it in its own height, while a spaced row is
  // top-aligned so its extra height falls below the icon.
  const stopRow = (index: number): LayoutRow => {
    const wide = spaced && index !== last;
    return {
      kind: 'stop',
      index,
      height: wide ? STOP_LINE_H + STOP_GAP : STOP_LINE_H,
      centre: wide ? MARKER_H / 2 : STOP_LINE_H / 2,
    };
  };

  const rows: LayoutRow[] = hidden.length
    ? [
        {kind: 'stop', index: 0, height: STOP_LINE_H, centre: STOP_LINE_H / 2},
        {kind: 'more', height: MORE_ROW_H},
        {
          kind: 'stop',
          index: last,
          height: STOP_LINE_H,
          centre: STOP_LINE_H / 2,
        },
      ]
    : stops.map((_, index) => stopRow(index));

  let offset = 0;
  const tops = rows.map(row => {
    const top = offset;
    offset += row.height;
    return top;
  });

  // Each dash runs centre-to-centre between two markers, inset at both ends so
  // it stays clear of the icons. Anchoring on the marker's real centre — not a
  // fixed MARKER_H / 2 that ignores how the row lays out — is what keeps those
  // two insets equal, instead of the line hanging low under the first stop.
  // Only ever called with marker-row indices, so the `more` arm is unreachable.
  const anchorOf = (i: number): number => {
    const row = rows[i];
    return tops[i] + (row.kind === 'stop' ? row.centre : 0);
  };

  // Dashes join marker to marker, spanning straight past the "+N More …" row —
  // that row carries no icon, so breaking the line there would leave a gap in
  // the middle of the connector instead of a continuous route.
  const markerRows = rows.reduce<number[]>(
    (acc, row, i) => (row.kind === 'stop' ? [...acc, i] : acc),
    [],
  );

  return (
    <View style={style}>
      <View style={styles.wrap}>
        {markerRows.slice(0, -1).map((rowIndex: number, i: number) => {
          const span = anchorOf(markerRows[i + 1]) - anchorOf(rowIndex);
          const inset = insetFor(span);
          const height = Math.max(0, span - 2 * inset);
          return (
            <Svg
              key={`dash-${i}`}
              width={2}
              height={height}
              style={[styles.dashed, {top: anchorOf(rowIndex) + inset}]}>
              <Line
                x1={1}
                y1={0}
                x2={1}
                y2={height}
                stroke={DASH_STROKE}
                strokeWidth={DASH_STROKE_W}
                strokeLinecap="round"
                strokeDasharray={DASH_ARRAY}
              />
            </Svg>
          );
        })}

        {rows.map((row, i) =>
          row.kind === 'more' ? (
            <View key="more" style={styles.moreRow}>
              <TouchableOpacity
                style={styles.moreChip}
                activeOpacity={onPressMore ? 0.7 : 1}
                disabled={!onPressMore}
                onPress={onPressMore}>
                <AppText
                  style={styles.moreChipText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}>
                  {moreLabelOf(hidden)}
                </AppText>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              key={`${cities[row.index]}-${i}`}
              style={[
                styles.row,
                rows[i].height !== STOP_LINE_H && styles.rowSpaced,
              ]}
              activeOpacity={
                canCollapse && row.index > 0 && row.index < last ? 0.7 : 1
              }
              disabled={!canCollapse || row.index === 0 || row.index === last}
              onPress={onPressMore}>
              <View style={styles.marker}>
                {(typed ? types[row.index] === 'drop' : row.index === last) ? (
                  <DropPin width={DROP_PIN_W} height={DROP_PIN_H} />
                ) : (
                  <CityRing width={CITY_RING} height={CITY_RING} />
                )}
              </View>
              <AppText style={[styles.city, textStyle]} numberOfLines={1}>
                {cities[row.index]}
              </AppText>
            </TouchableOpacity>
          ),
        )}
      </View>

      {showSummary ? (
        <AppText
          style={[styles.summary, summaryStyle]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}>
          {typed ? typedSummaryOf(types) : summaryOf(cities)}
        </AppText>
      ) : null}
    </View>
  );
}
