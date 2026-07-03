import {Platform, StyleSheet} from 'react-native';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';
import {colors} from '../../theme/colors';
import {IS_TABLET, select} from '../../theme/device';

const PHONE_FACTOR = select({phone: 0.82, tablet: 1});
const ms = n => baseMs(n) * PHONE_FACTOR;
const vs = n => baseVs(n) * PHONE_FACTOR;

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },

  page: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: vs(28),
  },

  /* ---------- Header ---------- */
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: ms(20),
    paddingTop: vs(16),
    paddingBottom: vs(52),
    borderBottomLeftRadius: ms(28),
    borderBottomRightRadius: ms(28),
  },

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
  },

  brandBadge: {
    width: IS_TABLET ? ms(30) : ms(38),
    height: IS_TABLET ? ms(30) : ms(38),
    borderRadius: IS_TABLET ? ms(8) : Platform.OS === 'ios' ? ms(10) : ms(12),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
 brandText: {
    color: colors.white,
    fontSize: ms(18),
    fontWeight: '600',
    letterSpacing: 1,
  },

  brandSub: {
    color: colors.onDarkMedium,
    fontSize: ms(11),
    fontWeight: '500',
    marginTop: vs(2),
  },

  /* ---------- Period dropdown ---------- */
  periodBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: ms(10),
    paddingHorizontal: ms(12),
    paddingVertical: vs(7),
  },

  periodBtnText: {
    color: colors.white,
    fontSize: ms(14),
    fontWeight: '600',
  },

  /* dropdown popover */
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },

  menu: {
    position: 'absolute',
    top: vs(90),
    right: ms(20),
    backgroundColor: colors.white,
    borderRadius: ms(12),
    paddingVertical: vs(4),
    minWidth: ms(140),
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
    elevation: 8,
  },

  menuItem: {
    paddingHorizontal: ms(16),
    paddingVertical: vs(11),
  },

  menuItemActive: {
    backgroundColor: colors.successLight,
  },

  menuItemText: {
    fontSize: ms(14),
    fontWeight: '500',
    color: colors.textStrong,
  },

  menuItemTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },

  /* ---------- Gross earning ---------- */
  grossValue: {
    color: colors.white,
    fontSize: IS_TABLET ? ms(34) : ms(38),
    fontWeight: '800',
    marginTop: vs(10),
  },

  grossLabel: {
    color: colors.onDarkMedium,
    fontSize: ms(14),
    fontWeight: '500',
    marginTop: vs(2),
  },

  /* ---------- Bar chart ---------- */
  chartWrap: {
    marginTop: -vs(15),
  },

  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: vs(100),
    gap: ms(6),
  },

  bar: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderTopLeftRadius: ms(6),
    borderTopRightRadius: ms(6),
  },

  chartLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: vs(8),
    gap: ms(6),
  },

  chartLabel: {
    flex: 1,
    textAlign: 'center',
    color: colors.onDarkLow,
    fontSize: ms(10),
    fontWeight: '500',
  },

  /* ---------- Stat cards ---------- */
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: ms(12),
    marginTop: -vs(34),
    zIndex: 2,
    gap: ms(10),
  },

  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: ms(14),
    paddingVertical: ms(12),
    paddingHorizontal: ms(12),
    borderLeftWidth: 2,
    borderLeftColor: colors.cardBorder,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },

  statLabel: {
    color: colors.splashSubtitle,
    fontSize: ms(12),
    fontWeight: '600',
  },

  statValue: {
    color: colors.textStrong,
    fontSize: ms(22),
    fontWeight: '800',
    marginTop: vs(4),
  },

  statNote: {
    color: colors.textMuted,
    fontSize: ms(10),
    fontWeight: '500',
    marginTop: vs(4),
  },

  /* ---------- Transactions list ---------- */
  listCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: ms(10),
    marginHorizontal: ms(12),
    marginTop: vs(14),
    marginBottom: vs(14),
    paddingHorizontal: ms(14),
    // shadowColor: '#000',
    // shadowOpacity: 0.04,
    // shadowRadius: 6,
    // shadowOffset: {width: 0, height: 2},
    // elevation: 1,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border_Color,
  },

  rowLast: {
    borderBottomWidth: 0,
  },

  rowLeft: {
    flex: 1,
    paddingRight: ms(8),
  },

  rowRoute: {
    color: colors.textStrong,
    fontSize: ms(14),
    fontWeight: '600',
  },

  rowMeta: {
    color: colors.textMuted,
    fontSize: ms(12),
    fontWeight: '500',
    marginTop: vs(3),
  },

  rowRight: {
    alignItems: 'flex-end',
  },

  rowAmount: {
    color: colors.textStrong,
    fontSize: ms(15),
    fontWeight: '700',
  },

  pill: {
    borderRadius: ms(6),
    paddingHorizontal: ms(8),
    paddingVertical: vs(2),
    marginTop: vs(6),
  },

  pillText: {
    fontSize: ms(11),
    fontWeight: '700',
    color: colors.white,
  },
});
