import {StyleSheet} from 'react-native';
import {ms, vs} from '../../theme/scale';
import {colors} from '../../theme/colors';
import {IS_TABLET} from '../../theme/device';

// Fixed height per stop row so the dashed SVG connector can align its segments
// to each marker's centre (Svg top offset = ROUTE_ROW_H / 2). Exported so a
// caller could measure the list if needed.
export const ROUTE_ROW_H = ms(30);

export default StyleSheet.create({
  summary: {
    color: colors.textMuted,
    fontSize: IS_TABLET ? ms(8) : ms(10),
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
    alignItems: 'center',
    height: ROUTE_ROW_H,
  },

  marker: {
    width: ms(20),
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
    fontWeight: '700',
  },

  sub: {
    color: colors.textMuted,
    fontSize: IS_TABLET ? ms(8) : ms(10),
    fontWeight: '400',
    marginTop: vs(2),
  },
});
