import {StyleSheet} from 'react-native';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';
import {colors} from '../../theme/colors';
import {select, IS_TABLET} from '../../theme/device';

const PHONE_FACTOR = select({phone: 0.82, tablet: 1});
const ms = n => baseMs(n) * PHONE_FACTOR;
const vs = n => baseVs(n) * PHONE_FACTOR;

/* Fixed column widths so the table keeps a comfortable size and can scroll
   horizontally on narrow phones. On tablet the columns flex to fill the width
   so the whole table fits with no horizontal scroll. */
const COL = {
  load: ms(135),
  equip: ms(102),
  mode: ms(70),
  pickup: ms(90),
  indicative: ms(78),
  lowest: ms(90),
  chevron: ms(22),
};

/* On tablet each data column flexes (proportional to its phone width) so the
   table fills the available width; on phone it keeps a fixed width and scrolls. */
const col = (width, flex) => (IS_TABLET ? {flex} : {width});

const TABLE_PADDING = ms(10);

/* One shared height for every control in the filter row (mode tabs, search box,
   view toggle) so they always line up, regardless of device/model. */
const FILTER_H = vs(30);

export const TABLE_WIDTH =
  COL.load +
  COL.equip +
  COL.mode +
  COL.pickup +
  COL.indicative +
  COL.lowest +
  COL.chevron +
  TABLE_PADDING * 2;

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },

  /* ---------- Header (diesel pill lives in the right slot) ---------- */
  dieselPill: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: ms(10),
    paddingHorizontal: ms(12),
    paddingVertical: vs(5),
    alignItems: 'left',
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
    paddingHorizontal: ms(10),
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
    paddingHorizontal: ms(7),
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
    paddingHorizontal: ms(8),
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
    paddingHorizontal: ms(6),
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
    // cap at half-width so an odd/last card doesn't stretch full-width
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

  tableScroll: {
    flex: 1,
  },

  tableScrollContent: {
    flexGrow: 1,
  },

  tableInner: {
    ...select({phone: {minWidth: TABLE_WIDTH}, tablet: {width: '100%', flex: 1}}),
    flexGrow: 1,
  },

  tableList: {
    flex: 1,
  },

  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray500,
    paddingVertical: vs(9),
    paddingHorizontal: TABLE_PADDING,
  },

  thCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(3),
  },

  thCellCenter: {
    justifyContent: 'center',
  },

  colCenter: {
    alignItems: 'center',
  },

  thText: {
    flexShrink: 1,
    fontSize: ms(12),
    fontWeight: '500',
    color: colors.nearBlack,
  },

  thSortIcon: {
    flexShrink: 0,
  },

  listContent: {
    paddingHorizontal: ms(10),
  },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // shorter rows on tablet so more fit on screen
    paddingVertical: select({phone: vs(11), tablet: vs(6)}),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border_Color,
  },

  /* column sizing — shared by header + rows so both stay in sync.
     Phone: fixed width (table scrolls). Tablet: flex (table fills width). */
  colLoad: {...col(COL.load, 200), paddingRight: ms(4)},
  colEquip: {...col(COL.equip, 110), paddingRight: ms(4)},
  colMode: {...col(COL.mode, 70), paddingRight: ms(4)},
  colPickup: {...col(COL.pickup, 95), paddingRight: ms(4)},
  colIndicative: {...col(COL.indicative, 80), paddingRight: ms(4)},
  colLowest: {...col(COL.lowest, 95)},
  colChevron: {width: COL.chevron, alignItems: 'center', justifyContent: 'center'},

  loadHeadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
  },

  flexShrink: {
    flex: 1,
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
    color: colors.accentBlueDark,
  },

  lowestBidRank: {
    fontSize: ms(10),
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: vs(2),
  },
});
