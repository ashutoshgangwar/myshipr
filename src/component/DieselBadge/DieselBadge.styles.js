import {Platform, StyleSheet} from 'react-native';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';
import {colors} from '../../theme/colors';
import {IS_TABLET, select} from '../../theme/device';

const PHONE_FACTOR = select({phone: 0.78, tablet: 1});
const ms = n => baseMs(n) * PHONE_FACTOR;
const vs = n => baseVs(n) * PHONE_FACTOR;

export default StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: ms(12),
    paddingHorizontal: IS_TABLET ? ms(11) : ms(10),
    paddingVertical: IS_TABLET ? vs(2) : Platform.OS === 'ios' ? vs(8) : vs(6),
    alignItems: 'flex-start',
  },

  label: {
    color: colors.onDarkLow,
    fontSize: ms(8),
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  value: {
    color: colors.success,
    fontSize: ms(10),
    fontWeight: '500',
    marginTop: vs(2),
  },
});
