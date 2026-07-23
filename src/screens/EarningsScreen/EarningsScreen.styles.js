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
 dashboardHeader: {
    paddingTop: vs(12),
    paddingBottom: IS_TABLET ? vs(80) : vs(100),
    borderBottomLeftRadius: ms(80),
    borderBottomRightRadius: ms(80),
  },
  brandTitle: {
    fontSize: IS_TABLET ? ms(14) : ms(15),
  },

  // Pulls the date line up closer to the EARNINGS title.
  brandSubTight: {
    marginTop: -vs(2),
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
    fontSize: IS_TABLET ? ms(25) : ms(30),
    fontWeight: '800',
    marginTop: vs(5),
  },

  grossLabel: {
    color: colors.onDarkMedium,
    fontSize:IS_TABLET? ms(10): ms(12),
    fontWeight: '500',
    marginTop: vs(1),
    marginBottom: IS_TABLET ? vs(30) : Platform.OS === 'ios' ? vs(20) : vs(35),
  },

  /* ---------- Transactions list ---------- */
  listCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: ms(14),
    marginHorizontal: ms(12),
    marginTop: vs(12),
    marginBottom: vs(14),
    paddingHorizontal: ms(14),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(6),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border_Color,
  },

  rowLast: {
    borderBottomWidth: 0,
  },

  /* ----- Left: route + type badge ----- */
  rowLeft: {
    flex: 1.15,
    paddingRight: ms(8),
  },

  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: vs(6),
    borderRadius: ms(6),
    backgroundColor: colors.screenBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: ms(8),
    paddingVertical: vs(3),
  },

  typeIcon: {
    marginRight: ms(5),
  },

  typeText: {
    color: colors.textMuted,
    fontSize: ms(10),
    fontWeight: '600',
  },

  /* ----- Center: distance + duration ----- */
  rowCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: ms(4),
  },

  centerMiles: {
    color: colors.textStrong,
    fontSize: ms(12),
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  centerTime: {
    color: colors.textMuted,
    fontSize: ms(11),
    fontWeight: '500',
    marginTop: vs(3),
    textAlign: 'center',
  },

  /* ----- Right: amount + miles + status ----- */
  rowRight: {
    alignItems: 'flex-end',
    minWidth: ms(78),
  },

  rowAmount: {
    color: colors.textStrong,
    fontSize: ms(16),
    fontWeight: '800',
  },

  rowSubMiles: {
    color: colors.textMuted,
    fontSize: ms(11),
    fontWeight: '500',
    marginTop: vs(2),
  },

  pill: {
    borderRadius: ms(6),
    paddingHorizontal: ms(10),
    paddingVertical: vs(3),
    marginTop: vs(6),
  },

  pillText: {
    fontSize: ms(11),
    fontWeight: '700',
    color: colors.white,
  },
});
