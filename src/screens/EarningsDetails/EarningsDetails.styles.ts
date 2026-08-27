import {StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';
import {ms, vs} from './constants';
import {IS_TABLET} from '../../theme/device';

// How far the payout card rides up over the blue header, and the blue left
// under it. Local to this screen — the shared header is untouched.
const HEADER_OVERLAP = IS_TABLET ? vs(38) : vs(34);
const HEADER_CLEARANCE = IS_TABLET ? vs(20) : vs(24);

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.navy,
  },

  page: {
    flex: 1,
    backgroundColor: colors.white,
  },

  /* ---------- Header ---------- */
  // Screen-local sizing for the shared DashboardHeader: this screen has no
  // floating stat cards, so it keeps the shorter padding the old inline header
  // used. Passed as `headerStyle`, so no other screen is affected.
  dashboardHeader: {
    paddingHorizontal: IS_TABLET ? ms(14) : ms(16),
    paddingTop: IS_TABLET ? vs(8) : vs(10),
    // Extra blue below the title so the payout card can overlap it and still
    // leave a band of header showing above the card.
    paddingBottom: HEADER_CLEARANCE + HEADER_OVERLAP,
    borderBottomLeftRadius: ms(36),
    borderBottomRightRadius: ms(36),
  },

  // Fills the header's white badge so the whole square stays tappable.
  backBtn: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    marginLeft: ms(4),
    color: colors.white,
    fontSize: IS_TABLET ? ms(16) : ms(18),
    fontWeight: '700',
    letterSpacing: 0.6,
  },

  /* ---------- Sheet ---------- */
  scroll: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // No horizontal padding here: the header inside the scroll must run edge to
  // edge. The sections below the payout card get their inset from `body`.
  scrollContent: {
    paddingBottom: IS_TABLET ? vs(30) : vs(32),
  },

  body: {
    paddingHorizontal: IS_TABLET ? ms(14) : ms(16),
  },

  /* ---------- Payout card ---------- */
  payoutCard: {
    marginTop: -HEADER_OVERLAP,
    marginHorizontal: IS_TABLET ? ms(14) : ms(16),
    zIndex: 1,
    backgroundColor: colors.white,
    borderRadius: ms(5),
    paddingHorizontal: IS_TABLET ? ms(12) : ms(14),
    paddingTop: IS_TABLET ? vs(10) : vs(12),
    paddingBottom: IS_TABLET ? vs(8) : vs(10),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },

  payoutTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  payoutHeading: {
    flex: 1,
    minWidth: 0,
    paddingRight: ms(8),
  },

  payoutLabel: {
    fontSize: IS_TABLET ? ms(11) : ms(13),
    color: colors.lightbg_gray2,
    fontWeight: '500',
  },

  payoutAmount: {
    fontSize: IS_TABLET ? ms(20) : ms(20),
    color: colors.textStrong,
    fontWeight: '700',
    marginTop: vs(2),
  },

  // Chips sit on the amount's first line, wrapping onto a second row before
  // they ever squeeze the payout figure.
  chipsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    flexShrink: 0,
    alignSelf: 'flex-start',
    gap: ms(6),
  },

  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E4ECFF',
    borderRadius: ms(15),
    paddingHorizontal: IS_TABLET ? ms(6) : ms(5),
    paddingVertical: IS_TABLET ? vs(2) : vs(4),
  },

  modePillText: {
    marginLeft: ms(5),
    fontSize: IS_TABLET ? ms(8) : ms(10),
    color: colors.accentBlue,
    fontWeight: '700',
  },

  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightbg_gray,
    borderRadius: ms(15),
    paddingHorizontal: IS_TABLET ? ms(6) : ms(5),
    paddingVertical: IS_TABLET ? vs(2) : vs(4),
  },

  metaChipText: {
    marginLeft: ms(4),
    fontSize: IS_TABLET ? ms(8) : ms(10),
    color: colors.textMuted,
    fontWeight: '500',
  },

  statusBadge: {
    backgroundColor: colors.button_color,
    borderRadius: ms(4),
    paddingHorizontal: IS_TABLET ? ms(6) : ms(5),
    paddingVertical: IS_TABLET ? vs(2) : vs(4),
  },

  statusBadgeText: {
    fontSize: IS_TABLET ? ms(8) : ms(11),
    color: colors.white,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  payoutDivider: {
    height: 1,
    backgroundColor: colors.border_Color,
    marginTop: vs(10),
  },

  payoutBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: vs(8),
    gap: ms(8),
  },

  awbText: {
    fontSize: IS_TABLET ? ms(10) : ms(10),
    color: colors.lightbg_gray2,
    fontWeight: '500',
  },

  routeText: {
    flexShrink: 1,
    textAlign: 'right',
    fontSize: IS_TABLET ? ms(10) : ms(12),
    color: colors.textStrong,
    fontWeight: '500',
  },

  /* ---------- Section headings ---------- */
  sectionLabel: {
    fontSize: IS_TABLET ? ms(10) : ms(12),
    color: colors.lightbg_gray2,
    fontWeight: '500',
    marginTop: vs(18),
  },

  /* ---------- Bill of lading grid ---------- */
  // Two cells per row; the hairline grid comes from per-cell borders so the
  // outer frame stays a single rounded rectangle.
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: ms(6),
    marginTop: vs(8),
    overflow: 'hidden',
  },

  gridCell: {
    width: '50%',
    paddingHorizontal: IS_TABLET ? ms(8) : ms(10),
    paddingVertical: IS_TABLET ? vs(6) : vs(8),
  },

  gridCellRightBorder: {
    borderRightWidth: 1,
    borderRightColor: colors.border_Color,
  },

  gridCellBottomBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border_Color,
  },

  gridLabel: {
    fontSize: IS_TABLET ? ms(6) : ms(8),
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  gridValue: {
    fontSize: IS_TABLET ? ms(10) : ms(12),
    color: colors.textStrong,
    fontWeight: '700',
    marginTop: vs(3),
  },

  gridSub: {
    fontSize: IS_TABLET ? ms(8) : ms(10),
    color: colors.textMuted,
    fontWeight: '400',
    marginTop: vs(2),
  },

  /* ---------- Payment status ---------- */
  statusCard: {
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: ms(6),
    marginTop: vs(8),
    overflow: 'hidden',
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IS_TABLET ? ms(8) : ms(10),
    paddingVertical: IS_TABLET ? vs(8) : vs(10),
    borderBottomWidth: 1,
    borderBottomColor: colors.border_Color,
  },

  statusRowLast: {
    borderBottomWidth: 0,
  },

  stepDot: {
    width: ms(7),
    height: ms(7),
    borderRadius: ms(7) / 2,
    marginRight: ms(8),
  },

  stepLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: IS_TABLET ? ms(10) : ms(12),
    color: colors.textStrong,
    fontWeight: '500',
  },

  stepLabelMuted: {
    color: colors.textMuted,
  },

  stepWhen: {
    flexShrink: 0,
    marginLeft: ms(8),
    fontSize: IS_TABLET ? ms(10) : ms(12),
    color: colors.textStrong,
    fontWeight: '400',
  },

  /* ---------- Payout account ---------- */
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: ms(6),
    marginTop: vs(8),
    paddingHorizontal: IS_TABLET ? ms(8) : ms(10),
    paddingVertical: IS_TABLET ? vs(10) : vs(12),
  },

  accountText: {
    marginLeft: ms(10),
    fontSize: IS_TABLET ? ms(10) : ms(12),
    color: colors.textStrong,
    fontWeight: '500',
  },

  accountNote: {
    fontSize: IS_TABLET ? ms(8) : ms(10),
    color: colors.textMuted,
    fontWeight: '400',
    marginTop: vs(6),
  },
});
