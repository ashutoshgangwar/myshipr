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
export const STOP_LINE_H = vs(20);
export const STOP_SUMMARY_H = vs(14);
export const MARKER_H = ms(16);
export const DASH_INSET = ms(6);

// Icon dimensions (kept here so every screen renders the same size).
export const CITY_RING = ms(13);
export const DROP_PIN_W = ms(14);
export const DROP_PIN_H = ms(16);

export default StyleSheet.create({
  wrap: {
    position: 'relative',
  },

  dashed: {
    position: 'absolute',
    left:IS_TABLET? ms(8.5): ms(7.5),
   marginTop: ms(4)
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: STOP_LINE_H,
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

  summary: {
    height: STOP_SUMMARY_H,
    marginLeft: ms(14),
    color: colors.textMuted,
    fontSize: ms(10),
    fontWeight: '500',
  },
});
