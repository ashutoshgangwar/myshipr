import {Platform, StyleSheet} from 'react-native';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';
import {colors} from '../../theme/colors';
import {IS_TABLET, select} from '../../theme/device';
import {
  DASHBOARD_HEADER_H,
  DASHBOARD_HEADER_PAD_BOTTOM,
  DASHBOARD_HEADER_RADIUS,
} from '../../component/DashboardHeader/DashboardHeader.styles';

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

  // Shown when the table has no rows to draw: the period came back empty, or
  // the call failed. The loading case draws skeleton rows here instead.
  listEmpty: {
    paddingVertical: vs(40),
    paddingHorizontal: ms(20),
    alignItems: 'center',
    justifyContent: 'center',
  },

  listEmptyText: {
    color: colors.textMuted,
    fontSize: ms(11),
    textAlign: 'center',
  },

  listEmptyRetry: {
    alignSelf: 'center',
    marginTop: vs(12),
  },
 // Height/padding come from the shared DashboardHeader constants — the same ones
 // Home uses — so both dashboards render an identical blue header and neither
 // hides its copy behind the floating stat cards.
 dashboardHeader: {
    // Clearance below the status bar so the EARNINGS badge/title aren't pinned
    // to the top edge. The gross block below gives the height back (see
    // grossValue marginTop) so the floating stat cards stay where they are.
   paddingTop: vs(10),
    paddingBottom: DASHBOARD_HEADER_PAD_BOTTOM,
    minHeight: DASHBOARD_HEADER_H,
    borderBottomLeftRadius: DASHBOARD_HEADER_RADIUS,
    borderBottomRightRadius: DASHBOARD_HEADER_RADIUS,
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
    paddingVertical: vs(5),
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
     color: colors.onDarkMedium,
       fontSize: ms(20),
       lineHeight: Math.round(ms(20) * 1.4),
       fontWeight: '500',
       marginTop: IS_TABLET ? vs(2) : vs(8),
  },

  // The bone and the retry both stand in the line box the gross figure would
  // fill — same height, same top margin — so the header does not resize
  // between waiting, failing and showing the money.
  grossBones: {
    width: '100%',
    height: Math.round(ms(20) * 1.4),
    justifyContent: 'center',
    marginTop: IS_TABLET ? vs(2) : vs(8),
  },

  grossRetry: {
    height: Math.round(ms(20) * 1.4),
    marginTop: IS_TABLET ? vs(2) : vs(8),
  },

  grossLabel: {
      color: colors.white,
      fontSize: IS_TABLET ? ms(20) : ms(24),
      lineHeight: Math.round((IS_TABLET ? ms(20) : ms(24)) * 1.4),
      fontWeight: '500',
      marginTop: vs(2),
      marginBottom:IS_TABLET ? vs(6) : Platform.OS === 'ios' ? vs(1) : vs(8),
  },

  /* ---------- Transactions table ---------- */
  listCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: ms(5),
    borderTopRightRadius: ms(5),
    marginHorizontal: ms(12),
    marginTop: vs(12),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },

  /* ----- Column header band ----- */
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DDE8F8',
    paddingHorizontal: ms(14),
    paddingVertical: vs(7),
  },

  tableHeadText: {
    color: colors.nearBlack,
    fontSize: ms(10),
    fontWeight: '700',
    textAlign: 'center',
  },

  /* Shared column widths — header cells and row cells use the same flex so
     every value stays under its heading. */
  col0: {
    flex: 0.9,
  },

  col1: {
    flex: 1.25,
    paddingHorizontal: ms(6),
  },

  col2: {
    flex: 1,
  },

  col3: {
    flex: 0.95,
  },

  cellCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(14),
    paddingVertical: vs(5),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border_Color,
  },

  rowLast: {
    borderBottomWidth: 0,
  },

  /* ----- AWB number ----- */
  awbText: {
    color: colors.textStrong,
    fontSize: ms(9),
    fontWeight: '600',
    textAlign: 'center',
  },

  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: vs(4),
    borderRadius: ms(6),
    backgroundColor: colors.screenBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: ms(8),
    paddingVertical: vs(2),
  },

  typeIcon: {
    marginRight: ms(5),
  },

  typeText: {
    color: colors.textMuted,
    fontSize: ms(9),
    fontWeight: '600',
  },

  /* ----- Center: distance + duration ----- */
  centerMiles: {
    color: colors.textStrong,
    fontSize: ms(11),
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  centerTime: {
    color: colors.lightbg_gray,
    fontSize: IS_TABLET ? ms(8) : ms(10),
    fontWeight: '500',
    marginTop: vs(2),
    textAlign: 'center',
  },

  /* ----- Right: amount + status ----- */
  rowAmount: {
    color: colors.textStrong,
    fontSize: ms(12),
    fontWeight: '700',
    textAlign: 'center',
  },

  pill: {
    alignSelf: 'center',
    borderRadius: ms(6),
    paddingHorizontal: ms(10),
    paddingVertical:IS_TABLET? vs(1) : vs(5),
    marginTop: vs(4),
  },

  pillText: {
    fontSize: ms(8),
    fontWeight: '700',
    color: colors.white,
  },
});
