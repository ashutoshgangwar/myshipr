import {StyleSheet} from 'react-native';

import {ms as baseMs} from '../../theme/scale';
import {select} from '../../theme/device';

const PHONE_FACTOR = select({phone: 0.82, tablet: 1});
const ms = (n: number): number => baseMs(n) * PHONE_FACTOR;

export default StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: ms(6),
  },

  label: {
    fontSize: ms(12),
    fontWeight: '600',
  },
});
