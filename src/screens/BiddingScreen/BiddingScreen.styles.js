import {StyleSheet} from 'react-native';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';
import {colors} from '../../theme/colors';
import {select} from '../../theme/device';

const PHONE_FACTOR = select({phone: 0.82, tablet: 1});
const ms = n => baseMs(n) * PHONE_FACTOR;
const vs = n => baseVs(n) * PHONE_FACTOR;

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },

  /* ---------- Header ---------- */
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: ms(16),
    paddingTop: vs(14),
    paddingBottom: vs(18),
    borderBottomLeftRadius: ms(24),
    borderBottomRightRadius: ms(24),
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
  },

  dieselPill: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: ms(10),
    paddingHorizontal: ms(12),
    paddingVertical: vs(5),
    alignItems: 'center',
  },

  dieselLabel: {
    color: colors.onDarkLow,
    fontSize: ms(9),
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  dieselValue: {
    color: colors.white,
    fontSize: ms(14),
    fontWeight: '700',
    marginTop: vs(1),
  },

  /* ---------- Stat cards ---------- */
  statsRow: {
    flexDirection: 'row',
    marginTop: vs(16),
    gap: ms(8),
  },

  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: ms(10),
    paddingVertical: ms(9),
    paddingHorizontal: ms(9),
    borderLeftWidth: ms(4),
  },

  statLabel: {
    fontSize: ms(11),
    fontWeight: '700',
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

  /* ---------- Filter row ---------- */
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(14),
    paddingVertical: vs(12),
    gap: ms(8),
  },

  modeTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
  },

  modeTab: {
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: ms(8),
    paddingHorizontal: ms(10),
    paddingVertical: vs(7),
    backgroundColor: colors.white,
  },

  modeTabActive: {
    backgroundColor: colors.status,
    borderColor: colors.status,
  },

  modeTabText: {
    fontSize: ms(12),
    fontWeight: '600',
    color: colors.textMuted,
  },

  modeTabTextActive: {
    color: colors.white,
  },

  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: ms(8),
    paddingHorizontal: ms(10),
    backgroundColor: colors.white,
    height: vs(34),
  },

  searchInput: {
    flex: 1,
    fontSize: ms(13),
    color: colors.textStrong,
    padding: 0,
  },

  viewToggle: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: ms(8),
    overflow: 'hidden',
    backgroundColor: colors.white,
  },

  toggleBtn: {
    paddingHorizontal: ms(8),
    paddingVertical: vs(6),
    alignItems: 'center',
    justifyContent: 'center',
  },

  toggleBtnActive: {
    backgroundColor: colors.primary,
  },

  /* ---------- Shared chips ---------- */
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    backgroundColor: '#EAF1FF',
    borderRadius: ms(6),
    paddingHorizontal: ms(6),
    paddingVertical: vs(3),
    alignSelf: 'flex-start',
  },

  modeChipText: {
    fontSize: ms(10),
    fontWeight: '700',
    color: colors.accentBlue,
  },

  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
  },

  metaChipText: {
    fontSize: ms(10),
    fontWeight: '500',
    color: colors.textMuted,
  },

  statusBadge: {
    borderRadius: ms(6),
    paddingHorizontal: ms(8),
    paddingVertical: vs(3),
  },

  statusBadgeText: {
    fontSize: ms(10),
    fontWeight: '700',
  },

  arrow: {
    color: colors.textMuted,
    fontWeight: '700',
  },

  /* ---------- Grid view ---------- */
  gridContent: {
    paddingHorizontal: ms(12),
    paddingBottom: vs(16),
  },

  gridColumn: {
    gap: ms(10),
    marginBottom: vs(10),
  },

  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: ms(10),
  },

  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  cardRouteWrap: {
    flex: 1,
    paddingRight: ms(6),
  },

  cardRoute: {
    fontSize: ms(12),
    fontWeight: '700',
    color: colors.textStrong,
  },

  cardRef: {
    fontSize: ms(10),
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: vs(2),
  },

  cardAmountWrap: {
    alignItems: 'flex-end',
  },

  cardAmount: {
    fontSize: ms(15),
    fontWeight: '800',
    color: colors.textStrong,
  },

  cardAwardedAt: {
    fontSize: ms(8),
    fontWeight: '500',
    color: colors.success,
    marginTop: vs(1),
  },

  cardChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: ms(6),
    marginTop: vs(10),
  },

  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border_Color,
    marginTop: vs(10),
  },

  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: vs(8),
  },

  cardLowestLabel: {
    fontSize: ms(11),
    fontWeight: '500',
    color: colors.textMuted,
  },

  cardLowestValue: {
    fontWeight: '700',
    color: colors.accentBlue,
  },

  cardRank: {
    fontSize: ms(11),
    fontWeight: '700',
    color: colors.textMuted,
  },

  /* ---------- Table / list view ---------- */
  tableWrap: {
    flex: 1,
    backgroundColor: colors.white,
    marginHorizontal: ms(12),
    marginBottom: vs(12),
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },

  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray400,
    paddingVertical: vs(9),
    paddingHorizontal: ms(10),
  },

  thText: {
    fontSize: ms(11),
    fontWeight: '700',
    color: colors.textMuted,
  },

  listContent: {
    paddingHorizontal: ms(10),
  },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(11),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border_Color,
  },

  /* column widths (flex) — shared by header + rows */
  colLoad: {flex: 2.4, paddingRight: ms(4)},
  colEquip: {flex: 1.6, paddingRight: ms(4)},
  colMode: {flex: 1, paddingRight: ms(4)},
  colPickup: {flex: 1.4, paddingRight: ms(4)},
  colIndicative: {flex: 1.2, paddingRight: ms(4)},
  colLowest: {flex: 1.3},

  loadHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
  },

  flexShrink: {
    flexShrink: 1,
  },

  greenDot: {
    width: ms(7),
    height: ms(7),
    borderRadius: ms(4),
    backgroundColor: colors.success,
  },

  loadRoute: {
    fontSize: ms(12),
    fontWeight: '700',
    color: colors.textStrong,
  },

  loadRouteDest: {
    fontSize: ms(12),
    fontWeight: '700',
    color: colors.textStrong,
  },

  arrowSmall: {
    color: colors.textMuted,
  },

  bidsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.warningLight,
    borderRadius: ms(4),
    paddingHorizontal: ms(6),
    paddingVertical: vs(2),
    marginTop: vs(6),
    marginLeft: ms(13),
  },

  bidsBadgeText: {
    fontSize: ms(9),
    fontWeight: '700',
    color: colors.warning_text,
  },

  cellStrong: {
    fontSize: ms(11),
    fontWeight: '600',
    color: colors.textStrong,
  },

  cellMuted: {
    fontSize: ms(10),
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: vs(2),
  },

  lowestBidValue: {
    fontSize: ms(12),
    fontWeight: '700',
    color: colors.accentBlue,
  },

  lowestBidRank: {
    fontSize: ms(10),
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: vs(2),
  },
});
