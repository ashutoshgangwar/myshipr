import {StyleSheet} from 'react-native';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';
import {colors} from '../../theme/colors';
import {IS_TABLET, select} from '../../theme/device';
import {
  DASHBOARD_HEADER_RADIUS,
} from '../../component/DashboardHeader/DashboardHeader.styles';

// Phones take the same shrink the dashboards use so SALARY sits beside
// HOME/EARNINGS without looking a size larger. Tablets take a deeper one:
// moderateScale already inflates every value by roughly 1.6x on a 10" screen,
// which left the cards and the payslip type reading oversized.
const SIZE_FACTOR = select({phone: 0.82, tablet: 0.78});
const ms = n => baseMs(n) * SIZE_FACTOR;
const vs = n => baseVs(n) * SIZE_FACTOR;

// How far the summary card rides up over the blue header's bottom edge. The
// header reserves the same amount as bottom padding so nothing is covered.
export const SALARY_CARD_OVERLAP = IS_TABLET ? baseMs(44) : baseMs(46);

const CARD_SHADOW = {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: {width: 0, height: 3},
  elevation: 3,
};

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },

  page: {
    flex: 1,
  },

  scroll: {
    flex: 1,
  },

  // Clears the floating bottom tab bar on both form factors.
  scrollContent: {
    paddingBottom: vs(40),
  },

  /* ---------- Blue header ---------- */
  dashboardHeader: {
    paddingTop: vs(10),
    // Room for the summary card to overlap plus breathing space under the title.
    paddingBottom: SALARY_CARD_OVERLAP + vs(26),
    borderBottomLeftRadius: DASHBOARD_HEADER_RADIUS,
    borderBottomRightRadius: DASHBOARD_HEADER_RADIUS,
  },

  /* ---------- Month dropdown ---------- */
  monthBtn: {
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

  monthBtnText: {
    color: colors.white,
    fontSize: ms(14),
    fontWeight: '600',
  },

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
    minWidth: ms(150),
    maxHeight: vs(280),
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

  /* ---------- Shared card chrome ---------- */
  body: {
    paddingHorizontal: ms(14),
  },

  // Landscape tablets put the summary and the breakdown side by side; every
  // other form factor stacks them.
  topRowWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ms(14),
  },

  colFlex: {
    flex: 1,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: ms(16),
    paddingVertical: vs(14),
    ...CARD_SHADOW,
  },

  /* ---------- Total salary card ---------- */
  summaryCard: {
    marginTop: -SALARY_CARD_OVERLAP,
  },

  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ms(10),
  },

  // Title block above the rule — no flex, or it would stretch to fill the card.
  summaryTitleBlock: {
    minWidth: 0,
  },

  // Rule under "Total Salary / July", full card width.
  summaryDivider: {
    marginTop: vs(8),
    marginBottom: vs(10),
  },

  summaryHeading: {
    flex: 1,
    minWidth: 0,
  },

  summaryTitle: {
    color: colors.textStrong,
    fontSize: ms(18),
    fontWeight: '600',
  },

  summaryMonth: {
    color: colors.textMuted,
    fontSize: ms(11),
    fontWeight: '500',
    marginTop: vs(1),
  },

  summaryAmount: {
    color: colors.textStrong,
    fontSize: IS_TABLET ? ms(22) : ms(28),
    lineHeight: Math.round((IS_TABLET ? ms(26) : ms(32)) * 1.35),
    fontWeight: '700',
  },

  // Base / Bonus / Ded chips under the headline figure.
  summaryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: ms(14),
    marginTop: vs(4),
  },

  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
  },

  metaLabel: {
    color: colors.textStrong,
    fontSize: ms(12),
    fontWeight: '600',
  },

  metaValue: {
    color: colors.textMuted,
    fontSize: ms(12),
    fontWeight: '500',
  },

  metaValueNegative: {
    color: colors.danger,
    fontSize: ms(12),
    fontWeight: '600',
  },

  /* ---------- Status pill ---------- */
  statusPill: {
    borderRadius: ms(6),
    paddingHorizontal: ms(18),
    paddingVertical: vs(6),
    alignSelf: 'flex-start',
  },

  statusPillText: {
    color: colors.white,
    fontSize: ms(12),
    fontWeight: '600',
    textAlign: 'center',
  },

  /* ---------- Breakdown card ---------- */
  breakdownCard: {
    marginTop: vs(12),
  },

  // Side by side on a landscape tablet the breakdown sits level with the
  // summary card instead of below it.
  breakdownCardWide: {
    marginTop: 0,
  },

  cardTitle: {
    color: colors.textMuted,
    fontSize: ms(14),
    fontWeight: '600',
    marginBottom: vs(6),
  },

  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ms(12),
    paddingVertical: vs(5),
  },

  breakdownLabel: {
    color: colors.textStrong,
    fontSize: ms(14),
    fontWeight: '500',
    flexShrink: 1,
  },

  breakdownValue: {
    color: colors.textStrong,
    fontSize: ms(14),
    fontWeight: '500',
  },

  totalLabel: {
    fontWeight: '600',
  },

  totalValue: {
    fontWeight: '600',
  },

  deductionText: {
    color: colors.danger,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border_Color,
    marginVertical: vs(6),
  },

  netLabel: {
    color: colors.textStrong,
    fontSize: ms(15),
    fontWeight: '700',
  },

  netValue: {
    color: colors.textStrong,
    fontSize: ms(15),
    fontWeight: '700',
  },

  /* ---------- Salary history ---------- */
  sectionTitle: {
    color: colors.textMuted,
    fontSize: IS_TABLET ? ms(12) : ms(14),
    fontWeight: '600',
    marginTop: vs(16),
    marginBottom: vs(6),
  },

  historyCard: {
    backgroundColor: colors.white,
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },

  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DDE8F8',
    paddingHorizontal: ms(12),
    paddingVertical: vs(10),
  },

  tableHeadText: {
    color: colors.nearBlack,
    fontSize: ms(12),
    fontWeight: '700',
  },

  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(12),
    paddingVertical: vs(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border_Color,
  },

  historyRowLast: {
    borderBottomWidth: 0,
  },

  historyRowActive: {
    backgroundColor: colors.successLight,
  },

  // Shared column widths: the head cells and the row cells use the same flex
  // so every value stays under its heading.
  colMonth: {
    flex: 1,
  },

  colEarnings: {
    flex: 1.1,
    textAlign: 'center',
  },

  colNet: {
    flex: 1.1,
    textAlign: 'center',
  },

  colStatus: {
    flex: 0.9,
    alignItems: 'center',
  },

  colStatusHead: {
    flex: 0.9,
    textAlign: 'center',
  },

  historyMonth: {
    color: colors.textStrong,
    fontSize: ms(13),
    fontWeight: '500',
  },

  historyValue: {
    color: colors.textStrong,
    fontSize: ms(13),
    fontWeight: '500',
    textAlign: 'center',
  },

  historyPill: {
    borderRadius: ms(6),
    paddingHorizontal: ms(12),
    paddingVertical: vs(4),
  },

  historyPillText: {
    color: colors.white,
    fontSize: ms(11),
    fontWeight: '600',
  },
});
