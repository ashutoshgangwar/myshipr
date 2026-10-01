import {StyleSheet} from 'react-native';

import {colors} from '../../theme/colors';
import {ms} from '../../theme/scale';
import {IS_TABLET} from '../../theme/device';

const CELL = `${100 / 7}%` as const;

export default StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.blackAlpha45,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(16),
  },
  card: {
    width: '100%',
    maxWidth: IS_TABLET ? ms(420) : undefined,
    backgroundColor: colors.white,
    borderRadius: ms(16),
    padding: ms(16),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ms(8),
  },
  navBtn: {
    width: ms(36),
    height: ms(36),
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: ms(24),
    color: colors.primary,
  },
  monthText: {
    fontSize: ms(16),
    fontWeight: '700',
    color: colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: CELL,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    fontSize: ms(12),
    fontWeight: '600',
    color: colors.textMuted,
  },
  dayCircle: {
    width: '80%',
    aspectRatio: 1,
    borderRadius: ms(100),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayActive: {
    backgroundColor: colors.primary,
  },
  dayText: {
    fontSize: ms(14),
    color: colors.textStrong,
  },
  dayTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  disabled: {
    color: colors.border_Color,
  },
  closeBtn: {
    marginTop: ms(8),
    alignSelf: 'flex-end',
    paddingVertical: ms(8),
    paddingHorizontal: ms(12),
  },
  closeText: {
    fontSize: ms(14),
    fontWeight: '600',
    color: colors.primary,
  },
});
