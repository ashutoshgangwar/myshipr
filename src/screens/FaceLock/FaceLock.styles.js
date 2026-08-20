import {StyleSheet} from 'react-native';

import {colors} from '../../theme/colors';
import {IS_TABLET} from '../../theme/device';
import {ms, vs} from './constants';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.navy,
  },

  page: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: vs(32),
  },

  /* ---------- Header ---------- */
  dashboardHeader: {
    paddingHorizontal: ms(16),
    paddingTop: vs(10),
    paddingBottom: vs(22),
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },

  backBtn: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    marginLeft: ms(4),
    color: colors.white,
    fontSize: IS_TABLET ? ms(17) : ms(19),
    fontWeight: '700',
  },

  headerSubtitle: {
    color: colors.onDarkMedium,
    fontSize: IS_TABLET ? ms(11) : ms(12),
  },

  /* ---------- Status card ---------- */
  body: {
    paddingHorizontal: ms(16),
    paddingTop: vs(16),
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: ms(14),
    paddingHorizontal: ms(16),
    paddingVertical: vs(16),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  cardTitle: {
    color: colors.textStrong,
    fontSize: ms(16),
    fontWeight: '700',
  },

  cardSub: {
    color: colors.textMuted,
    fontSize: ms(13),
    fontWeight: '500',
    marginTop: vs(3),
  },

  /* ---------- Re-scan row ---------- */
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(14),
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: ms(10),
    paddingHorizontal: ms(14),
    paddingVertical: vs(12),
    gap: ms(12),
  },

  actionText: {
    flex: 1,
    color: colors.textStrong,
    fontSize: ms(14),
    fontWeight: '600',
  },

  // Chevron_Down points down, so the row rotates it into a right chevron.
  chevron: {
    transform: [{rotate: '-90deg'}],
  },
});
