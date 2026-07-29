import {Dimensions, Platform, StyleSheet} from 'react-native';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';
import {colors} from '../../theme/colors';
import {select, IS_TABLET} from '../../theme/device';
import {
  STOP_LINE_H as ROUTE_LINE_H,
  STOP_SUMMARY_H as ROUTE_SUMMARY_H,
} from '../../component/LoadRoute/LoadRoute';
import {
  DASHBOARD_HEADER_PAD_BOTTOM,
  DASHBOARD_HEADER_RADIUS,
  DASHBOARD_TITLE_LINE_H,
  DASHBOARD_TITLE_SIZE,
} from '../../component/DashboardHeader/DashboardHeader.styles';

const PHONE_FACTOR = select({phone: 0.82, tablet: 1});
const ms = n => baseMs(n) * PHONE_FACTOR;
const vs = n => baseVs(n) * PHONE_FACTOR;

const CONTENT_MAX = ms(720);
const centered = IS_TABLET
  ? {width: '95%', maxWidth: CONTENT_MAX, alignSelf: 'center'}
  : null;

const COL_GAP = ms(8);

/* ---------- Stat card labels ----------
   The four header cards are equal-width flex children of the stats row, and
   each auto-shrinks its own label to fit. "Currently Leading" is far longer
   than the other three, so it was the only one that shrank and the row read as
   four different type sizes. Deriving one size that fits the longest label
   keeps all four identical.

   STATS_ROW_MARGIN / STATS_GAP are the row's own geometry (kept as constants so
   the width maths below can never drift from the style), and STAT_CARD_PAD is
   the card padding from DashboardHeader.styles. */
const STATS_ROW_MARGIN = ms(16);
const STATS_GAP = ms(8);
const STAT_CARD_PAD = ms(9);

// Width of "Currently Leading" in Poppins-Bold, in em (sum of its advance
// widths). Any longer label added to STATS needs this re-measured.
const LONGEST_LABEL_EM = 9.1;

const STAT_ROW_W = Dimensions.get('window').width;
const STAT_LABEL_W =
  (STAT_ROW_W - STATS_ROW_MARGIN * 2 - STATS_GAP * 3) / 4 - STAT_CARD_PAD * 2;

// 0.97 leaves a hair of slack so rounding can't push the longest label back
// into auto-shrinking. Capped at the shared ms(11) so wide tablets — where
// everything already fits — keep the size they have today.
const STAT_LABEL_SIZE = Math.min(ms(11), (STAT_LABEL_W / LONGEST_LABEL_EM) * 0.97);

/* Bidding runs a shorter, flatter blue band than the other dashboard headers —
   the four stat cards are the focus here, so the space above them is trimmed
   rather than shared with Home/Earnings. Height stays a floor (minHeight), so
   the header still grows if the copy ever needs more room and the cards keep
   riding inside it. Lowering these past the content height has no further
   effect: paddingTop + brand row + DASHBOARD_HEADER_PAD_BOTTOM is the limit. */
const BLUE_HEADER_H = IS_TABLET
  ? vs(160)
  : Platform.OS === 'ios'
  ? vs(165)
  : vs(96);

// Tablets carried a very deep curve at the shared ms(95); flatten it here.
const BLUE_HEADER_RADIUS = IS_TABLET ? ms(60) : DASHBOARD_HEADER_RADIUS;

const FILTER_H = IS_TABLET ? vs(30) : vs(34);
const TABLE_PADDING = ms(10);
const ROW_MIN_H = select({phone: vs(66), tablet: vs(44)});

/* Frozen first column ("Load"). Everything else scrolls horizontally beside it. */
export const LOAD_COL_W = ms(112);
export const HEADER_H = IS_TABLET ? vs(26) : vs(30);

/* Rows are explicitly sized so the frozen column and the scrolling column —
   which live in separate scroll containers — stay on the same baseline. */
// Sized from the shared LoadRoute so the frozen "Load" column, the scrolling
// data rows and the grid cards all line up with the same route geometry.
export const STOP_LINE_H = ROUTE_LINE_H;
const STOP_SUMMARY_H = ROUTE_SUMMARY_H;
const ROW_PAD_V = IS_TABLET ? vs(4) : vs(8);

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

  /* Bidding deliberately runs shorter and flatter than Home/Earnings, so the
     height and curve come from the local BLUE_HEADER_* knobs above rather than
     the shared constants. The bottom padding still does — it is what reserves
     the band the floating stat cards ride up into. minHeight (not height) lets
     the header grow if the copy ever needs more room, which keeps the cards
     inside the header's bounds and therefore tappable. */
  dashboardHeader: {
    paddingTop: vs(15),
    paddingBottom: DASHBOARD_HEADER_PAD_BOTTOM,
    minHeight: BLUE_HEADER_H,
    borderBottomLeftRadius: BLUE_HEADER_RADIUS,
    borderBottomRightRadius: BLUE_HEADER_RADIUS,
  },

  /* The remaining DashboardHeader slots, wired up so Bidding can tune its own
     header copy and stat row without touching Home or Earnings. They are
     seeded with the shared component's own values, so they change nothing on
     their own — they are knobs, not overrides. Colours are left to the
     component (white title, muted subtitle). */
  dashboardWrap: {
    // The header and its floating cards are the only thing in this slot; the
    // list below is a sibling, so nothing here should clip.
    overflow: 'visible',
  },

  dashboardTitle: {
    fontSize: DASHBOARD_TITLE_SIZE,
    lineHeight: DASHBOARD_TITLE_LINE_H,
    fontWeight: '500',
  },

  dashboardSubtitle: {
    // marginLeft clears the brand badge (ms(32)) plus its ms(10) row gap, so
    // "Live Auction" lines up under the "B" of Bidding.
    fontSize: ms(11),
    fontWeight: '500',
    marginLeft: ms(42),
    marginTop: vs(1),
  },

  dashboardStats: {
    marginHorizontal: STATS_ROW_MARGIN,
    gap: STATS_GAP,
  },

  /* One size for all four labels. Without this the cards shrink their own
     label to fit, so "Currently Leading" rendered visibly smaller than
     "Active Bids" / "Awarded Bids" / "Past Auction" beside it. */
  dashboardStatLabel: {
    fontSize: STAT_LABEL_SIZE,
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
    borderColor: '#88888870',
    borderRadius: ms(8),
    paddingHorizontal: ms(12),
    backgroundColor: colors.white,
  },

  modeTabActive: {
    backgroundColor: '#DDE8F8',
    borderColor: '#DDE8F8',
  },

  modeTabText: {
    fontSize: ms(12),
    fontWeight: '600',
    color: colors.splashSubtitle,
  },

  modeTabTextActive: {
    color: '#171717',
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
    backgroundColor: '#DDE8F8',
  },

  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    height: HEADER_H,
    backgroundColor: '#DDE8F8',
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
    fontSize: IS_TABLET ? ms(9) : ms(10),
    fontWeight: '600',
    color: colors.nearBlack,
  },

  thSortIcon: {
    flexShrink: 0,
  },
  loadCell: {
    justifyContent: 'center',
    paddingRight: COL_GAP,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dataCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },


  stopsWrap: {
    position: 'relative',
  },

  stopConnector: {
    position: 'absolute',
    left: ms(11) / 2 - 1,
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
    fontSize: IS_TABLET ? ms(10) : ms(11),
    fontWeight: '600',
    color: colors.textStrong,
    textAlign: 'center',
  },

  cellMuted: {
    fontSize: IS_TABLET ? ms(9) : ms(10),
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: IS_TABLET ? vs(1) : vs(2),
    textAlign: 'center',
  },

  cellText: {
    fontSize: IS_TABLET ? ms(10) : ms(11),
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
