import {StyleSheet} from 'react-native';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';
import {colors} from '../../theme/colors';
import {select, IS_TABLET} from '../../theme/device';

const PHONE_FACTOR = select({phone: 0.82, tablet: 1});
const ms = n => baseMs(n) * PHONE_FACTOR;
const vs = n => baseVs(n) * PHONE_FACTOR;

const CONTENT_MAX = ms(720);
const centered = IS_TABLET
  ? {width: '100%', maxWidth: CONTENT_MAX, alignSelf: 'center'}
  : null;

const CHEVRON_W = ms(22);
const COL_GAP = ms(8);

const FILTER_H = IS_TABLET ? vs(30) : vs(34);
const TABLE_PADDING = ms(10);
const ROW_MIN_H = select({phone: vs(66), tablet: vs(56)});

const COL = {
  load: ms(100),
  mode: ms(72),
  pickup: ms(100),
  indicative: ms(90),
  lowest: ms(100),
};
const col = (width, flex) => (IS_TABLET ? {flex} : {width});

export const TABLE_WIDTH =
  COL.load +
  COL.mode +
  COL.pickup +
  COL.indicative +
  COL.lowest +
  CHEVRON_W +
  TABLE_PADDING * 2;

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },

  /* ---------- Header (diesel pill in the right slot) ---------- */
  dieselPill: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: ms(10),
    paddingHorizontal: ms(12),
    paddingVertical: vs(5),
    alignItems: 'flex-start',
  },

  dieselLabel: {
    color: colors.onDarkLow,
    fontSize: ms(9),
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  dieselValue: {
    color: colors.success_bg,
    fontSize: ms(14),
    fontWeight: '700',
    marginTop: vs(1),
  },

  /* ---------- Filter row ---------- */
  filterRow: {
    ...centered,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(14),
    paddingTop: vs(16),
    paddingBottom: vs(12),
    gap: ms(8),
  },

  modeTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
  },

  modeTab: {
    height: FILTER_H,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: ms(8),
    paddingHorizontal: ms(12),
    backgroundColor: colors.white,
  },

  modeTabActive: {
    backgroundColor: colors.splashSubtitle,
    borderColor: colors.splashSubtitle,
  },

  modeTabText: {
    fontSize: ms(12),
    fontWeight: '600',
    color: colors.splashSubtitle,
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
    height: FILTER_H,
  },

  searchInput: {
    flex: 1,
    fontSize: ms(12),
    color: colors.textStrong,
    padding: 0,
  },

  viewToggle: {
    flexDirection: 'row',
    height: FILTER_H,
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: ms(8),
    overflow: 'hidden',
    backgroundColor: colors.white,
  },

  toggleBtn: {
    paddingHorizontal: ms(9),
    alignItems: 'center',
    justifyContent: 'center',
  },

  toggleBtnActive: {
    backgroundColor: colors.toggle_color,
  },

  /* ---------- Shared chips ---------- */
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    backgroundColor: '#EAF1FF',
    borderRadius: ms(15),
    paddingHorizontal: ms(7),
    paddingVertical: vs(3),
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

  /* ---------- Table / list view ---------- */
  tableWrap: {
    ...centered,
    flex: 1,
    backgroundColor: colors.white,
    marginHorizontal: IS_TABLET ? 0 : ms(12),
    marginBottom: vs(12),
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },

  // Phone: horizontal scroll wrapper so the fixed-width table can slide L/R.
  tableScroll: {
    flex: 1,
  },

  tableScrollContent: {
    flexGrow: 1,
  },

  // Phone: min width forces horizontal scroll. Tablet: fills the capped width.
  tableInner: {
    ...select({phone: {minWidth: TABLE_WIDTH}, tablet: {width: '100%', flex: 1}}),
    flexGrow: 1,
  },

  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray500,
    paddingVertical: vs(10),
    paddingHorizontal: TABLE_PADDING,
  },

  thCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
  },

  thCellCenter: {
    justifyContent: 'center',
  },

  thText: {
    flexShrink: 1,
    // uniform size for every header; small enough that all labels fit on one
    // line so none are cut and the Load column keeps room for its city text.
    fontSize: ms(10),
    fontWeight: '600',
    color: colors.nearBlack,
  },

  thSortIcon: {
    flexShrink: 0,
  },

  tableList: {
    flex: 1,
  },

  listContent: {
    paddingHorizontal: TABLE_PADDING,
  },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: ROW_MIN_H,
    paddingVertical: vs(10),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border_Color,
  },

  /* Column sizing — shared by header + rows so they stay in sync.
     Load is left-aligned; the rest are centered. */
  colLoad: {...col(COL.load, 18), paddingRight: COL_GAP},
  colMode: {...col(COL.mode, 15), alignItems: 'center'},
  colPickup: {...col(COL.pickup, 23), alignItems: 'center'},
  colIndicative: {...col(COL.indicative, 22), alignItems: 'center'},
  colLowest: {...col(COL.lowest, 23), alignItems: 'center'},
  colChevron: {width: CHEVRON_W, alignItems: 'center', justifyContent: 'center'},

  /* Load cell */
  loadHeadRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ms(6),
  },

  greenDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    backgroundColor: colors.success,
    marginTop: vs(3),
  },

  loadTextWrap: {
    flex: 1,
    flexShrink: 1,
  },

  loadRoute: {
    fontSize: ms(11),
    fontWeight: '700',
    color: colors.textStrong,
  },

  loadRouteDest: {
    fontSize: ms(11),
    fontWeight: '700',
    color: colors.textStrong,
    marginTop: vs(1),
  },

  arrowSmall: {
    color: colors.textMuted,
  },

  bidsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.warningLight,
    borderRadius: ms(5),
    paddingHorizontal: ms(7),
    paddingVertical: vs(2),
    marginTop: vs(6),
    marginLeft: ms(14),
  },

  bidsBadgeText: {
    fontSize: ms(9),
    fontWeight: '700',
    color: colors.warning_text,
  },

  /* Generic centered cell text */
  cellStrong: {
    fontSize: ms(11),
    fontWeight: '600',
    color: colors.textStrong,
    textAlign: 'center',
  },

  cellMuted: {
    fontSize: ms(10),
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: vs(2),
    textAlign: 'center',
  },

  indicativeValue: {
    fontSize: ms(12),
    fontWeight: '600',
    color: colors.textStrong,
    textAlign: 'center',
  },

  lowestBidValue: {
    fontSize: ms(12),
    fontWeight: '700',
    color: colors.accentBlueDark,
    textAlign: 'center',
  },

  lowestBidRank: {
    fontSize: ms(10),
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: vs(2),
    textAlign: 'center',
  },

  /* ---------- Grid / card view ---------- */
  gridContent: {
    ...centered,
    paddingHorizontal: ms(12),
    paddingBottom: vs(16),
  },

  gridColumn: {
    gap: ms(10),
    marginBottom: vs(10),
  },

  card: {
    flex: 1,
    maxWidth: '50%',
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
    marginTop: vs(4),
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

  // right-aligns the status badge in the chips row; with flexWrap it drops to
  // its own line (still inside the card) when the row is too narrow.
  cardStatusPush: {
    marginLeft: 'auto',
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
    fontWeight: '800',
    color: colors.accentBlueDark,
  },

  cardRank: {
    fontSize: ms(11),
    fontWeight: '700',
    color: colors.textMuted,
  },
});
