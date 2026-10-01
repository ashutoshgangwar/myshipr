import {StyleSheet} from 'react-native';
import {ms, vs} from '../../theme/scale';
import {colors} from '../../theme/colors';
import {IS_TABLET} from '../../theme/device';

// Fixed height per stop row — the vertical spacing between consecutive markers.
// Tall enough to hold the two-line name + sub without the sub bleeding into the
// next row. Exported so a caller could measure the list if needed.
export const ROUTE_ROW_H = ms(34);

// The name (first line) height. Rows are TOP-aligned and each marker is centred
// within this line, so the icon sits next to the title — not in the gap between
// name and sub. The dashed connector anchors to this same centre
// (Svg top offset = NAME_LINE_H / 2).
export const NAME_LINE_H = IS_TABLET ? ms(13) : ms(16);

export default StyleSheet.create({
  summary: {
    color: colors.textMuted,
    fontSize: IS_TABLET ? ms(8) : ms(8),
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: vs(8),
  },

  // Relative so the dashed connector can be absolutely positioned across the
  // full column regardless of how many stops there are.
  stops: {
    position: 'relative',
  },

  dashed: {
    position: 'absolute',
    left: ms(9),
  },

  row: {
    flexDirection: 'row',
    // Top-aligned so the marker can line up with the NAME line rather than the
    // centre of the whole name+sub block.
    alignItems: 'flex-start',
    height: ROUTE_ROW_H,
  },

  marker: {
    width: ms(20),
    // Match the name line height and centre the icon inside it, so the marker's
    // centre coincides with the title's optical centre.
    height: NAME_LINE_H,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(6),
  },

  // The current position reuses the same blue city_ring asset, dimmed so it
  // reads as a passed/neutral origin rather than an active pickup.
  markerCurrent: {
    opacity: 0.35,
  },

  text: {
    flex: 1,
  },

  name: {
    color: colors.textStrong,
    fontSize: IS_TABLET ? ms(9) : ms(11),
    lineHeight: NAME_LINE_H,
    fontWeight: '700',
  },

  sub: {
    color: colors.textMuted,
    fontSize: IS_TABLET ? ms(8) : ms(10),
    lineHeight: IS_TABLET ? ms(11) : ms(13),
    fontWeight: '400',
    marginTop: vs(1),
  },
});
