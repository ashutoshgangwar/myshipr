import {Dimensions, Platform, StyleSheet} from 'react-native';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';
import {colors} from '../../theme/colors';
import {select, IS_TABLET} from '../../theme/device';
import {
  STOP_LINE_H as ROUTE_LINE_H,
  STOP_SUMMARY_H as ROUTE_SUMMARY_H,
} from '../../component/LoadRoute/LoadRoute';

const PHONE_FACTOR = select({phone: 0.82, tablet: 1});
const ms = n => baseMs(n) * PHONE_FACTOR;
const vs = n => baseVs(n) * PHONE_FACTOR;

const IS_ANDROID_PHONE = Platform.OS === 'android' && !IS_TABLET;

const CONTENT_MAX = ms(720);
const centered = IS_TABLET
  ? {width: '95%', maxWidth: CONTENT_MAX, alignSelf: 'center'}
  : null;

const COL_GAP = ms(8);

const STATS_ROW_MARGIN = ms(16);
const STATS_GAP = ms(8);

// Android phones get a smaller card all round: tighter padding, smaller value
// and note. iOS and tablets keep the component's ms(9)/ms(20)/ms(9).
const STAT_CARD_PAD_V = IS_ANDROID_PHONE ? ms(6) : ms(9);
const STAT_CARD_PAD_H = IS_ANDROID_PHONE ? ms(7) : ms(9);
const STAT_CARD_RADIUS = IS_ANDROID_PHONE ? ms(8) : ms(10);
const STAT_VALUE_SIZE = IS_ANDROID_PHONE ? ms(16) : ms(20);
const STAT_VALUE_GAP = IS_ANDROID_PHONE ? vs(2) : vs(3);
const STAT_NOTE_SIZE = IS_ANDROID_PHONE ? ms(8) : ms(9);

// Width of "Currently Leading" in Poppins-Bold, in em (sum of its advance
// widths). Any longer label added to STATS needs this re-measured.
const LONGEST_LABEL_EM = 9.1;

const STAT_ROW_W = Dimensions.get('window').width;
const STAT_LABEL_W =
  (STAT_ROW_W - STATS_ROW_MARGIN * 2 - STATS_GAP * 3) / 4 - STAT_CARD_PAD_H * 2;
  
const STAT_LABEL_CAP = IS_ANDROID_PHONE ? ms(10) : ms(11);
const STAT_LABEL_SIZE = Math.min(
  STAT_LABEL_CAP,
  (STAT_LABEL_W / LONGEST_LABEL_EM) * 0.97,
);

const BLUE_HEADER_H = IS_TABLET
  ? vs(160) : Platform.OS === 'ios' ? vs(140) : vs(160);

const BLUE_HEADER_PAD_TOP =  vs(15);

export const BIDDING_STATS_OVERLAP = IS_TABLET ? baseMs(70) : Platform.OS === 'ios' ? baseMs(45) : baseMs(40);

// Breathing room left below the cards once they have ridden up.
const BIDDING_STATS_CLEARANCE = IS_TABLET
  ? vs(5)
  : Platform.OS === 'ios'
  ? vs(20)
  : vs(5);

const BLUE_HEADER_PAD_BOTTOM = BIDDING_STATS_OVERLAP + BIDDING_STATS_CLEARANCE;

// Tablets carried a very deep curve at ms(95); flatten it here.
const BLUE_HEADER_RADIUS = IS_TABLET ? ms(60) : ms(45);

/* Title type, local so Bidding's header copy can be sized on its own. */
const BIDDING_TITLE_SIZE = ms(18);
const BIDDING_TITLE_LINE_H = Math.round(BIDDING_TITLE_SIZE * 1.5);

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

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },

  /* Bidding deliberately runs shorter and flatter than Home/Earnings, so every
     value here comes from the local BLUE_HEADER_* knobs above. The bottom
     padding is what reserves the band the floating stat cards ride up into, so
     it moves with BIDDING_STATS_OVERLAP. minHeight (not height) lets the header
     grow if the copy ever needs more room, which keeps the cards inside the
     header's bounds and therefore tappable. */
  dashboardHeader: {
    paddingTop: BLUE_HEADER_PAD_TOP,
    paddingBottom: BLUE_HEADER_PAD_BOTTOM,
    minHeight: BLUE_HEADER_H,
    borderBottomLeftRadius: BLUE_HEADER_RADIUS,
    borderBottomRightRadius: BLUE_HEADER_RADIUS,
  },

  /* The remaining DashboardHeader slots, wired up so Bidding can tune its own
     header copy and stat row without touching Home or Earnings. They are
     seeded with the values the component itself uses, so they change nothing on
     their own — they are knobs, not overrides. Colours are left to the
     component (white title, muted subtitle). */
  dashboardWrap: {
    // The header and its floating cards are the only thing in this slot; the
    // list below is a sibling, so nothing here should clip.
    overflow: 'visible',
  },

  dashboardTitle: {
    fontSize: BIDDING_TITLE_SIZE,
    lineHeight: BIDDING_TITLE_LINE_H,
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

  /* Card box + value + note, so the whole card scales together. On iOS and
     tablets these repeat the component's own numbers and change nothing; on
     Android phones they pull the card in. */
  dashboardStatCard: {
    paddingVertical: STAT_CARD_PAD_V,
    paddingHorizontal: STAT_CARD_PAD_H,
    borderRadius: STAT_CARD_RADIUS,
  },

  dashboardStatValue: {
    fontSize: STAT_VALUE_SIZE,
    marginTop: STAT_VALUE_GAP,
  },

  dashboardStatNote: {
    fontSize: STAT_NOTE_SIZE,
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

  // wrapped header labels sit tighter so two lines still clear HEADER_H
  thTextWrap: {
    lineHeight: IS_TABLET ? ms(11) : ms(12),
    textAlign: 'center',
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

  /* ---------- Cell pills ----------
     Geometry lives in the two base styles; the tone styles below carry colour
     only, so a pill is always "one base + one tone". See AUCTION_TONE /
     DRIVER_TONE at the bottom of this file for which value gets which tone. */
  pillFilled: {
    borderRadius: ms(5),
    paddingHorizontal: ms(9),
    paddingVertical: vs(3),
  },

  pillOutline: {
    borderWidth: 1,
    borderRadius: ms(5),
    paddingHorizontal: ms(9),
    paddingVertical: vs(3),
  },

  pillText: {
    fontSize: ms(10),
    fontWeight: '600',
  },

  toneOrangeFill: {backgroundColor: '#FEE9CF'},
  toneOrangeText: {color: colors.button_color},

  toneBlueFill: {backgroundColor: '#DDE8F8'},
  toneBlueText: {color: colors.accentBlue},

  tonePurpleBorder: {borderColor: colors.card_drive_load},
  tonePurpleText: {color: colors.card_drive_load},

  toneAmberBorder: {borderColor: colors.warning_text},
  toneAmberText: {color: colors.warning_text},

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
    color: colors.textStrong,
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

export default styles;

/* Pill tones keyed by the value they render. Auction types are filled chips,
   driver requirements are outlined ones — both spread as `box` / `text` so the
   table cells and the grid-card chips tint the same way from one source. */
export const AUCTION_TONE = {
  Normal: {box: [styles.pillFilled, styles.toneBlueFill], text: styles.toneBlueText},
  Instant: {box: [styles.pillFilled, styles.toneOrangeFill], text: styles.toneOrangeText},
};

export const DRIVER_TONE = {
  Single: {box: [styles.pillOutline, styles.tonePurpleBorder], text: styles.tonePurpleText},
  'Multi Driver': {
    box: [styles.pillOutline, styles.toneAmberBorder],
    text: styles.toneAmberText,
  },
};

// Unknown values still render as a pill rather than vanishing.
export const auctionTone = v => AUCTION_TONE[v] || AUCTION_TONE.Instant;
export const driverTone = v => DRIVER_TONE[v] || DRIVER_TONE.Single;
