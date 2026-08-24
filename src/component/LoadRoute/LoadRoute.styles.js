import {StyleSheet} from 'react-native';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';
import {colors} from '../../theme/colors';
import {IS_TABLET, select} from '../../theme/device';

// Single source of truth for the load-route visual (dashed connector + city
// ring / green drop pin + city label). Shared by Home upcoming loads, the
// Earnings list and the Bidding table so icons, dashes and text stay identical.
const PHONE_FACTOR = select({phone: 0.82, tablet: 1});
const ms = n => baseMs(n) * PHONE_FACTOR;
const vs = n => baseVs(n) * PHONE_FACTOR;

// Row + marker geometry (exported so callers can size their containers/rows).
export const STOP_LINE_H = vs(18);
export const STOP_SUMMARY_H = vs(14);
export const MARKER_H = ms(16);
// Shorter rows leave less room between markers, so the dash is inset less at
// each end — otherwise the connector all but disappears between two stops.
export const DASH_INSET = ms(5);
// Row that holds the collapsed "+N More Pickups" chip; taller than a stop row
// because the chip carries its own padding.
export const MORE_ROW_H = vs(19);
// Extra room under a stop row when its marker sits directly above the next
// one — a lone pickup → drop pair, and every gap of a route expanded out of
// its "+N More …" chip. Without it those markers are barely a dash apart,
// where a collapsed route gets the whole chip row between its two ends.
// Opt-in (`stopGap`): callers that size rows from STOP_LINE_H × stop count
// must not have their geometry moved.
export const STOP_GAP = vs(5);

// Icon dimensions (kept here so every screen renders the same size).
export const CITY_RING = ms(13);
export const DROP_PIN_W = ms(14);
export const DROP_PIN_H = ms(16);

export default StyleSheet.create({
  wrap: {
    position: 'relative',
  },

  // No vertical nudge here: the connector is positioned from each marker's
  // measured centre, so a margin would only re-open at one end the gap it
  // closes at the other — which is what left the line hanging low, with more
  // air under the pickup ring than above the drop pin.
  dashed: {
    position: 'absolute',
    left: IS_TABLET ? ms(8.5) : ms(7.5),
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: STOP_LINE_H,
  },

  // The extra height falls below the marker rather than around it — top-aligned
  // keeps the marker beside its own city name, so only the gap to the next stop
  // grows, not the spacing inside the row.
  rowSpaced: {
    height: STOP_LINE_H + STOP_GAP,
    alignItems: 'flex-start',
  },

  marker: {
    width: ms(18),
    height: MARKER_H,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(6),
  },

  city: {
    flexShrink: 1,
    color: colors.textStrong,
    fontSize: ms(10),
    lineHeight: ms(16),
    fontWeight: '600',
  },

  // Indented to line up with the city labels so the dashed line runs past the
  // chip the same way it runs past a marker.
  moreRow: {
    height: MORE_ROW_H,
    justifyContent: 'center',
    paddingLeft: ms(24),
  },

  // flexShrink lets the chip give up width rather than push "+2 More Pickups"
  // past the row edge; the label shrinks to fit instead of ellipsizing.
  moreChip: {
    alignSelf: 'flex-start',
    flexShrink: 1,
    maxWidth: '100%',
    borderRadius: ms(6),
    backgroundColor: '#EAF1FE',
    borderWidth: 1,
    borderColor: '#C7DAFB',
    paddingHorizontal: ms(5),
    paddingVertical: vs(2),
  },

  moreChipText: {
    color: colors.accentBlue,
    fontSize: ms(9),
    lineHeight: ms(12),
    includeFontPadding: false,
    fontWeight: '600',
  },

  // minHeight (not height) plus an explicit lineHeight so descenders in
  // "1 Pickup • 1 Drop" aren't clipped when the copy needs more room than the
  // nominal summary height.
  summary: {
    minHeight: STOP_SUMMARY_H,
    marginLeft: ms(14),
    color: colors.textMuted,
    fontSize: ms(10),
    lineHeight: ms(14),
    includeFontPadding: false,
    fontWeight: '500',
  },
});
