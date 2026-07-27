import {StyleSheet} from 'react-native';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';
import {colors} from '../../theme/colors';
import {IS_TABLET, select} from '../../theme/device';

const PHONE_FACTOR = select({phone: 0.82, tablet: 1});
const ms = n => baseMs(n) * PHONE_FACTOR;
const vs = n => baseVs(n) * PHONE_FACTOR;

export default StyleSheet.create({
  wrap: {},

  /* ---------- Blue header ---------- */
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: ms(16),
    paddingTop: vs(14),
    paddingBottom: vs(18),
    borderBottomLeftRadius: ms(36),
    borderBottomRightRadius: ms(36),
  },

  headerWithStats: {
    paddingBottom: vs(42),
  },

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  brandRow: {
    flexDirection: 'column',
  },

  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
  },

  brandBadge: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(8),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandText: {
    color: colors.white,
    fontSize: ms(18),
    fontWeight: '500',
  },

  brandSub: {
    color: colors.onDarkLow,
    fontSize: ms(11),
    fontWeight: '500',
    marginLeft: ms(42),
    marginTop: vs(1),
  },

  /* ---------- Floating stat cards ---------- */
  statsRow: {
    flexDirection: 'row',
    marginTop: -vs(25),
    marginHorizontal: ms(16),
    gap: ms(8),
  },

  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: ms(10),
    paddingVertical: ms(9),
    paddingHorizontal: ms(9),
    borderLeftWidth: ms(4),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },

  statLabel: {
    fontSize: ms(11),
    fontWeight: '700',
    color: colors.textStrong,
  },

  statValue: {
    color: colors.textStrong,
    fontSize: ms(20),
    fontWeight: '800',
    marginTop: vs(3),
  },

  statNote: {
    color: colors.textMuted,
    fontSize: ms(9),
    fontWeight: '500',
    marginTop: vs(2),
  },

  // applied last so it wins over the per-stat label/note colours
  statTextActive: {
    color: colors.white,
  },

  /* ---------- Chart variant (wide cards + sparkline) ---------- */
  statsRowChart: {
    flexDirection: 'row',
    marginTop: -vs(25),
    marginHorizontal: IS_TABLET ? ms(8) : ms(10),
    gap: ms(12),
  },

  chartCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: ms(8),
    // Tighter vertical padding to shorten the card.
    paddingVertical: vs(8),
    paddingHorizontal: ms(10),
    borderLeftWidth: ms(4),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },

  // Icon variant: no accent stripe, a little more breathing room.
  chartCardPlain: {
    borderLeftWidth: 0,
    paddingVertical: vs(10),
    paddingHorizontal: ms(12),
  },

  chartCardIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
  },

  chartCardIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  chartCardHeading: {
    flex: 1,
  },

  chartCardDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginTop: vs(8),
    marginBottom: vs(2),
  },

  chartCardDeltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(6),
    gap: ms(6),
  },

  chartCardDeltaPill: {
    borderRadius: ms(6),
    paddingHorizontal: ms(6),
    paddingVertical: vs(2),
  },

  chartCardDeltaPillUp: {
    backgroundColor: '#E7F8EE',
  },

  chartCardDeltaPillDown: {
    backgroundColor: '#FDE8E8',
  },

  chartCardDeltaText: {
    fontSize: ms(11),
    fontWeight: '700',
  },

  chartCardDeltaTextUp: {
    color: colors.success,
  },

  chartCardDeltaTextDown: {
    color: colors.danger,
  },

  chartCardDeltaNote: {
    flexShrink: 1,
    color: colors.textMuted,
    fontSize: ms(11),
    fontWeight: '500',
  },

  chartCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ms(6),
  },

  chartCardTitle: {
    flexShrink: 1,
    color: colors.lightbg_gray2,
    fontSize: ms(12),
    fontWeight: '700',
  },

  chartCardNote: {
    color: colors.textMuted,
    fontSize: ms(8),
    fontWeight: '600',
  },

  chartCardRange: {
    color: colors.lightbg_gray3,
    fontSize: ms(10),
    fontWeight: '500',
  },

  chartCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: ms(6),
  },

  // Sized so the widest value ("$26,000") still fits without auto-shrinking,
  // otherwise the two cards render their values at different sizes.
  chartCardValue: {
    flexShrink: 1,
    color: colors.textStrong,
    fontSize: ms(20),
    fontWeight: '800',
  },

  chartCardSpark: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
});
