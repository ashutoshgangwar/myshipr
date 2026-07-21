import {StyleSheet} from 'react-native';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';
import {colors} from '../../theme/colors';
import {select, IS_TABLET} from '../../theme/device';

const PHONE_FACTOR = select({phone: 0.82, tablet: 1});
const ms = n => baseMs(n) * PHONE_FACTOR;
const vs = n => baseVs(n) * PHONE_FACTOR;

const CONTENT_MAX = ms(720);
const centered = IS_TABLET
  ? {width: '95%', maxWidth: CONTENT_MAX, alignSelf: 'center'}
  : null;

const COL_GAP = ms(8);

const FILTER_H = IS_TABLET ? vs(30) : vs(34);
const TABLE_PADDING = ms(10);
const ROW_MIN_H = select({phone: vs(66), tablet: vs(56)});

/* Frozen first column ("Load"). Everything else scrolls horizontally beside it. */
export const LOAD_COL_W = ms(112);
export const HEADER_H = vs(30);

/* Rows are explicitly sized so the frozen column and the scrolling column —
   which live in separate scroll containers — stay on the same baseline. */
export const STOP_LINE_H = vs(19);
const STOP_SUMMARY_H = vs(14);
const ROW_PAD_V = vs(8);

/* Card grid is two-up everywhere; phones get tighter chip padding and type so
   the mode/date/type/distance strip still fits on one line. */
export const GRID_COLS = 2;

const CHIP_PAD = select({phone: ms(5), tablet: ms(4)});
const CHIP_PAD_V = select({phone: vs(3), tablet: vs(2)});
const CHIP_FONT = select({phone: ms(8), tablet: ms(8)});

export const rowHeight = stopCount =>
  Math.max(ROW_MIN_H, ROW_PAD_V * 2 + stopCount * STOP_LINE_H + STOP_SUMMARY_H);

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
    paddingHorizontal: IS_TABLET ? ms(8) : ms(14),
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
     backgroundColor:'#F4F5F8',
    borderRadius: ms(5),
    paddingHorizontal: ms(20),
    paddingVertical: vs(3),
    borderRadius: ms(15),
  },

  metaChipText: {
    fontSize: ms(8),
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
    marginHorizontal: IS_TABLET ? ms(30) : ms(12),
    marginBottom: vs(12),
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: 'hidden',
  },

  // header band: frozen "Load" head + the scrolling heads, kept in lockstep
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.gray500,
  },

  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    height: HEADER_H,
    backgroundColor: colors.gray500,
  },

  // vertical scroller holding both columns' bodies
  tableBody: {
    flex: 1,
  },

  tableBodyRow: {
    flexDirection: 'row',
  },

  // the frozen first column — sits outside the horizontal scroller
  frozenCol: {
    width: LOAD_COL_W,
    paddingLeft: TABLE_PADDING,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border_Color,
    backgroundColor: colors.white,
  },

  frozenHead: {
    width: LOAD_COL_W,
    paddingLeft: TABLE_PADDING,
    justifyContent: 'center',
    height: HEADER_H,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border_Color,
  },

  // horizontal scrollers must claim the space left over by the frozen column
  hScroll: {
    flex: 1,
  },

  scrollCells: {
    flexDirection: 'row',
    alignItems: 'center',
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

  // load cell in the frozen column — height is set inline per row
  loadCell: {
    justifyContent: 'center',
    paddingRight: COL_GAP,
  },

  // a row of scrolling cells — height is set inline to match its load cell
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dataCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Load cell — one line per stop joined by a dashed connector */
  stopsWrap: {
    position: 'relative',
  },

  stopConnector: {
    position: 'absolute',
    left: ms(11) / 2,
    width: 0,
    borderLeftWidth: 1,
    borderLeftColor: colors.primaryLight,
    borderStyle: 'dashed',
  },

  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: STOP_LINE_H,
    gap: ms(5),
  },

  stopIcon: {
    width: ms(11),
    alignItems: 'center',
    justifyContent: 'center',
  },

  stopRing: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    borderWidth: ms(1.6),
    borderColor: colors.accentBlue,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  stopRingCore: {
    width: ms(4),
    height: ms(4),
    borderRadius: ms(2),
    backgroundColor: colors.accentBlue,
  },

  stopCity: {
    flexShrink: 1,
    fontSize: ms(11),
    fontWeight: '700',
    color: colors.textStrong,
  },

  stopSummary: {
    height: STOP_SUMMARY_H,
    fontSize: ms(9),
    fontWeight: '500',
    color: colors.textMuted,
    marginLeft: ms(16),
  },

  arrowSmall: {
    color: colors.textMuted,
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

  cellText: {
    fontSize: ms(11),
    fontWeight: '500',
    color: colors.textStrong,
    textAlign: 'center',
  },

  /* Auction Mode — extensions call themselves out in orange */
  auctionModeText: {
    fontSize: ms(11),
    fontWeight: '500',
    color: colors.textStrong,
    textAlign: 'center',
  },

  auctionModeExt: {
    color: colors.button_color,
    fontWeight: '700',
  },

  /* Cell pills */
  pillSoft: {
    backgroundColor: '#FEE9CF',
    borderRadius: ms(5),
    paddingHorizontal: ms(9),
    paddingVertical: vs(3),
  },

  pillSoftText: {
    fontSize: ms(10),
    fontWeight: '600',
    color: colors.button_color,
  },

  pillOutline: {
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: ms(5),
    paddingHorizontal: ms(9),
    paddingVertical: vs(3),
  },

  pillOutlineText: {
    fontSize: ms(10),
    fontWeight: '500',
    color: colors.textStrong,
  },

  pillBlue: {
    borderWidth: 1,
    borderColor: colors.accentBlueDark,
    borderRadius: ms(5),
    paddingHorizontal: ms(9),
    paddingVertical: vs(3),
  },

  pillBlueText: {
    fontSize: ms(10),
    fontWeight: '600',
    color: colors.accentBlueDark,
  },

  /* ---------- Filter button + sort sheet ---------- */
  filterBtn: {
    height: FILTER_H,
    width: FILTER_H,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: ms(8),
    backgroundColor: colors.white,
  },

  filterBtnActive: {
    backgroundColor: colors.toggle_color,
    borderColor: colors.toggle_color,
  },

  sortBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },

  sortSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: ms(16),
    borderTopRightRadius: ms(16),
    paddingHorizontal: ms(18),
    paddingTop: vs(16),
    paddingBottom: vs(28),
  },

  sortTitle: {
    fontSize: ms(13),
    fontWeight: '700',
    color: colors.textStrong,
    marginBottom: vs(6),
  },

  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vs(11),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border_Color,
  },

  sortOptionText: {
    fontSize: ms(12),
    fontWeight: '500',
    color: colors.textStrong,
  },

  sortOptionTextActive: {
    color: colors.accentBlue,
    fontWeight: '700',
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
    padding: select({phone: ms(10), tablet: ms(10)}),
  },

  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  // Reserve a 3-stop block so a 1- or 2-drop card pushes its divider to the
  // same baseline as its taller neighbour and the two line up across the row.
  cardRouteWrap: {
    flex: 1,
    paddingRight: ms(6),
    minHeight: 3 * STOP_LINE_H + STOP_SUMMARY_H,
  },

  cardStopCity: {
    fontSize: ms(12),
  },

  cardAmount: {
    fontSize: ms(15),
    fontWeight: '800',
    color: colors.textStrong,
  },

  // mode / date / auction type / distance — always one row, never wraps.
  // Fonts (CHIP_FONT) and gaps are sized so all four fit the card width.
  cardChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: select({phone: ms(3), tablet: ms(6)}),
    marginTop: vs(10),
  },

  // one shared padding for every chip (mode / date / type / distance) so the
  // strip reads on a single, even rhythm on both phone and tablet.
  cardChip: {
    paddingHorizontal: CHIP_PAD,
    paddingVertical: CHIP_PAD_V,
  },

  cardChipText: {
    fontSize: CHIP_FONT,
  },

  cardChipMuted: {
    fontSize: CHIP_FONT,
    fontWeight: '500',
    color: colors.textMuted,
  },

  cardChipSoft: {
    fontSize: CHIP_FONT,
    fontWeight: '600',
    color: colors.button_color,
  },

  cardDistance: {
    fontSize: CHIP_FONT,
    fontWeight: '600',
    color: colors.card_drive_load,
  },

  // Cards in a row stretch to equal height, so pinning the chips/divider/times
  // block to the bottom keeps the divider on one line however many stops each
  // card has.
  cardFooter: {
    marginTop: 'auto',
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
    gap: ms(6),
    marginTop: vs(8),
  },

  cardTimeLabel: {
    flexShrink: 1,
    fontSize: ms(8),
    fontWeight: '600',
    color: colors.textMuted,
  },

});
