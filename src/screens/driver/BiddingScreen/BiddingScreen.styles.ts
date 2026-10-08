import {Dimensions, Platform, StyleSheet} from 'react-native';
import {ms as baseMs, vs as baseVs} from '../../../theme/scale';
import {colors} from '../../../theme/colors';
import {fontSize} from '../../../theme/fontSizes';
import {select, IS_TABLET} from '../../../theme/device';
import {
  STOP_LINE_H as ROUTE_LINE_H,
  STOP_SUMMARY_H as ROUTE_SUMMARY_H,
} from '../../../component/LoadRoute/LoadRoute';

const PHONE_FACTOR = select({phone: 0.82, tablet: 1});
const ms = (n: number): number => baseMs(n) * PHONE_FACTOR;
const vs = (n: number): number => baseVs(n) * PHONE_FACTOR;

const IS_ANDROID_PHONE = Platform.OS === 'android' && !IS_TABLET;

const CONTENT_MAX = ms(720);
const centered = IS_TABLET
  ? ({width: '95%', maxWidth: CONTENT_MAX, alignSelf: 'center'} as const)
  : null;

const COL_GAP = ms(8);

const STATS_ROW_MARGIN = ms(16);
const STATS_GAP = ms(8);

// Android phones get a smaller card all round: tighter padding, smaller value
// and note. iOS and tablets keep the component's ms(9)/ms(20)/ms(9).
const STAT_CARD_PAD_V = IS_ANDROID_PHONE ? ms(6) : ms(9);
const STAT_CARD_PAD_H = IS_ANDROID_PHONE ? ms(7) : ms(9);
const STAT_CARD_RADIUS = IS_ANDROID_PHONE ? ms(8) : ms(10);
const STAT_VALUE_SIZE = IS_ANDROID_PHONE ? fontSize.subHeading : fontSize.heading;
const STAT_VALUE_GAP = IS_ANDROID_PHONE ? vs(2) : vs(3);
const STAT_NOTE_SIZE = IS_ANDROID_PHONE ? fontSize.micro : fontSize.tiny;

// Width of "Currently Leading" in Poppins-Bold, in em (sum of its advance
// widths). Any longer label added to STATS needs this re-measured.
const LONGEST_LABEL_EM = 9.1;

const STAT_ROW_W = Dimensions.get('window').width;

// The popover hangs off the funnel button, so it is sized against the screen
// rather than the filter row. A tablet can spare a third of its width; a phone
// needs most of it for "Equipment Type   53’ Dry Van" to fit on one line.
const FILTER_PANEL_W = Math.min(
  ms(320),
  STAT_ROW_W * select({phone: 0.8, tablet: 0.38}),
);
const STAT_LABEL_W =
  (STAT_ROW_W - STATS_ROW_MARGIN * 2 - STATS_GAP * 3) / 4 - STAT_CARD_PAD_H * 2;
  
const STAT_LABEL_CAP = IS_ANDROID_PHONE ? ms(10) : ms(11);
const STAT_LABEL_SIZE = Math.min(
  STAT_LABEL_CAP,
  (STAT_LABEL_W / LONGEST_LABEL_EM) * 0.97,
);

// The stat cards are gone; instead the filter row rides up into the header's
// bottom. The header reserves a blue band below the title for the row to
// overlap onto, and the filter row pulls up by the same amount.
const BLUE_HEADER_H = IS_TABLET ? vs(115) : vs(140);

const BLUE_HEADER_PAD_TOP =IS_TABLET ? vs(15) : vs(10);

export const BIDDING_FILTER_OVERLAP =IS_TABLET ? vs(45) : vs(55);

const BLUE_HEADER_PAD_BOTTOM = BIDDING_FILTER_OVERLAP + vs(4);

// Tablets carried a very deep curve at ms(95); flatten it here.
const BLUE_HEADER_RADIUS = IS_TABLET ? ms(50) : ms(40);

/* Title type, local so Bidding's header copy can be sized on its own. */
const BIDDING_TITLE_SIZE = fontSize.title;
const BIDDING_TITLE_LINE_H = Math.round(BIDDING_TITLE_SIZE * 1.5);

const FILTER_H = IS_TABLET ? vs(25) : vs(35);
const TABLE_PADDING = ms(10);
const ROW_MIN_H = select({phone: vs(66), tablet: vs(44)});

/* Frozen first column ("Load"). Everything else scrolls horizontally beside it. */
export const LOAD_COL_W = ms(140);
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
// One full-width card per row on phones; two-up on tablets.
export const GRID_COLS = IS_TABLET ? 2 : 1;

export const rowHeight = (stopCount: number): number =>
  Math.max(ROW_MIN_H, ROW_PAD_V * 2 + stopCount * STOP_LINE_H + STOP_SUMMARY_H);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },

  /* Bidding deliberately runs shorter and flatter than Home/Earnings, so every
     value here comes from the local BLUE_HEADER_* knobs above. With the stat
     cards removed the header just holds the title/subtitle and diesel badge;
     minHeight (not height) lets it grow if the copy ever needs more room. */
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
    fontSize: fontSize.caption,
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
    borderColor: colors.whiteAlpha20,
    backgroundColor: colors.whiteAlpha20,
    borderRadius: ms(10),
    paddingHorizontal: ms(12),
    paddingVertical: vs(5),
    alignItems: 'flex-start',
  },

  dieselLabel: {
    color: colors.white,
    fontSize: fontSize.tiny,
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  dieselValue: {
    color: colors.success,
    fontSize: fontSize.body,
    fontWeight: '700',
    marginTop: vs(1),
  },

  /* ---------- Filter row ---------- */
  // Rides up into the header's reserved blue band so the controls overlap the
  // curved bottom edge, the way the stat cards used to.
  filterRow: {
    ...centered,
    marginTop: -BIDDING_FILTER_OVERLAP,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: IS_TABLET ? ms(2) : ms(12),
    paddingTop: vs(16),
    paddingBottom: vs(18),
    gap: ms(8),

  },

  // One segmented container holding All + My Bids (like the list/grid toggle),
  // rather than two separate pills.
  modeTabs: {
    flexDirection: 'row',
    alignItems: 'stretch',
    height: FILTER_H,
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: ms(8),
    overflow: 'hidden',
    backgroundColor: colors.white,
  },

  modeTab: {
    justifyContent: 'center',
    paddingHorizontal: ms(12),
  },

  // Active segment reads green (mint fill + green text) to match the screenshot.
  modeTabActive: {
    backgroundColor: colors.successLight,
  },

  modeTabText: {
    fontSize: fontSize.label,
    fontWeight: '600',
    color: colors.textMuted,
  },

  modeTabTextActive: {
    color: colors.success,
    fontWeight: '700',
  },

  /* ---------- Mode dropdown (replaces the old FTL/LTL tabs) ---------- */
  modeDropdown: {
    height: FILTER_H,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: ms(8),
    paddingHorizontal: ms(12),
    backgroundColor: colors.white,
  },

  modeDropdownText: {
    fontSize: fontSize.label,
    fontWeight: '600',
    color: colors.textStrong,
  },

  // The menu that drops under the Mode button; positioned via its measured
  // anchor (top/left/minWidth) at the call site.
  modeMenu: {
    position: 'absolute',
    backgroundColor: colors.white,
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: colors.border_Color,
    paddingVertical: vs(4),
    shadowColor: colors.textStrong,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },

  modeMenuOption: {
    paddingVertical: vs(9),
    paddingHorizontal: ms(14),
  },

  modeMenuOptionText: {
    fontSize: fontSize.label,
    fontWeight: '500',
    color: colors.textMuted,
  },

  modeMenuOptionTextActive: {
    color: colors.success,
    fontWeight: '700',
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
    fontSize: fontSize.label,
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
    backgroundColor: colors.paleBlue,
  },

  /* ---------- Shared chips ---------- */
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    backgroundColor: colors.white,
    borderRadius: ms(15),
    paddingHorizontal: ms(7),
    paddingVertical: vs(3),
  },

  modeChipText: {
    fontSize: fontSize.small,
    fontWeight: '700',
    color: colors.accentBlue,
  },

  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
     backgroundColor:colors.white,
    paddingHorizontal: ms(20),
    paddingVertical: vs(3),
    borderRadius: ms(15),
  },

  metaChipText: {
    fontSize: fontSize.micro,
    fontWeight: '500',
    color: colors.textMuted,
  },

  statusBadge: {
    borderRadius: ms(6),
    paddingHorizontal: ms(8),
    paddingVertical: vs(3),
  },

  statusBadgeText: {
    fontSize: fontSize.small,
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
    borderColor: colors.border_Color,
    overflow: 'hidden',
  },

  // The loading skeleton stands where the table does, same card frame.
  skeletonWrap: {
    backgroundColor: colors.white,
    marginHorizontal: IS_TABLET ? ms(30) : ms(12),
    marginBottom: vs(12),
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: colors.border_Color,
    paddingVertical: vs(4),
    overflow: 'hidden',
  },

  // header band: frozen "Load" head + the scrolling heads, kept in lockstep
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.paleBlue,
  },

  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    height: HEADER_H,
    backgroundColor: colors.paleBlue,
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
    fontSize: fontSize.small,
    fontWeight: '600',
    color: colors.textStrong,
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
    fontSize: fontSize.caption,
    fontWeight: '700',
    color: colors.textStrong,
  },

  stopSummary: {
    height: STOP_SUMMARY_H,
    fontSize: fontSize.tiny,
    fontWeight: '500',
    color: colors.textMuted,
    marginLeft: ms(16),
  },

  arrowSmall: {
    color: colors.textMuted,
  },

  /* Generic centered cell text */
  cellStrong: {
    fontSize: fontSize.caption,
    fontWeight: '600',
    color: colors.textStrong,
    textAlign: 'center',
  },

  cellMuted: {
    fontSize: fontSize.small,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: IS_TABLET ? vs(1) : vs(2),
    textAlign: 'center',
  },

  cellText: {
    fontSize: fontSize.caption,
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
    fontSize: fontSize.small,
    fontWeight: '600',
  },

  toneOrangeFill: {backgroundColor: colors.amber100},
  toneOrangeText: {color: colors.button_color},

  toneBlueFill: {backgroundColor: colors.paleBlue},
  toneBlueText: {color: colors.accentBlue},

  tonePurpleBorder: {borderColor: colors.card_drive_load},
  tonePurpleText: {color: colors.card_drive_load},

  toneAmberBorder: {borderColor: colors.amber800},
  toneAmberText: {color: colors.amber800},

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
    backgroundColor: colors.paleBlue,
    borderColor: colors.paleBlue,
  },

  /* ---------- Filter Details popover ---------- */
  filterBackdrop: {
    flex: 1,
    backgroundColor: colors.blackAlpha45,
  },

  filterPanel: {
    position: 'absolute',
    width: FILTER_PANEL_W,
    maxHeight: '64%',
    backgroundColor: colors.white,
    borderRadius: ms(10),
    paddingHorizontal: ms(14),
    paddingTop: vs(11),
    paddingBottom: vs(8),
    shadowColor: colors.textStrong,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },

  filterPanelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    paddingBottom: vs(8),
  },

  filterPanelTitle: {
    fontSize: fontSize.subBody,
    fontWeight: '600',
    color: colors.textStrong,
    paddingBottom: vs(5),
    borderBottomWidth: 1,
    borderBottomColor: colors.border_Color,
  },

  // The rule between the title and the funnel, matching the underline on the
  // title so the header reads as one broken line.
  filterPanelRule: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border_Color,
    marginBottom: vs(5),
  },

  filterFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ms(10),
    paddingVertical: vs(9),
  },

  filterFieldLabel: {
    fontSize: fontSize.caption,
    fontWeight: '500',
    color: colors.textStrong,
  },

  filterFieldValueWrap: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
  },

  filterFieldValue: {
    flexShrink: 1,
    fontSize: fontSize.caption,
    fontWeight: '500',
    color: colors.textMuted,
  },

  // A picked value reads darker than the placeholder it replaces.
  filterFieldValueSet: {
    color: colors.accentBlue,
    fontWeight: '600',
  },

  filterChevronOpen: {
    transform: [{rotate: '180deg'}],
  },

  filterOptions: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border_Color,
    paddingLeft: ms(10),
  },

  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ms(8),
    paddingVertical: vs(7),
  },

  filterOptionText: {
    flexShrink: 1,
    fontSize: fontSize.caption,
    fontWeight: '500',
    color: colors.textMuted,
  },

  filterOptionTextActive: {
    color: colors.accentBlue,
    fontWeight: '600',
  },

  filterClearRow: {
    alignItems: 'flex-end',
    paddingTop: vs(6),
    paddingBottom: vs(2),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border_Color,
  },

  filterClearText: {
    fontSize: fontSize.caption,
    fontWeight: '600',
    color: colors.danger,
  },

  lowestBidValue: {
    fontSize: fontSize.label,
    fontWeight: '700',
    color: colors.textStrong,
    textAlign: 'center',
  },

  lowestBidRank: {
    fontSize: fontSize.small,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: vs(2),
    textAlign: 'center',
  },

  /* ---------- Grid / card view ---------- */
  gridContent: {
    ...centered,
    width: '100%',
    paddingHorizontal: select({phone: ms(12), tablet: ms(6)}),
    paddingBottom: vs(16),
  },

  // Only used when two-up (tablet): the horizontal gap between the pair. The
  // row-to-row spacing lives on the card so it also applies to the phone's
  // single-column list.
  gridColumn: {
    gap: select({phone: ms(10), tablet: ms(6)}),
  },

  card: {
    flex: 1,
    maxWidth: IS_TABLET ? '50%' : '100%',
    marginBottom: vs(10),
    backgroundColor: colors.white,
    borderRadius: ms(7),
    borderWidth: 1,
    borderColor: colors.border_Color,
    padding: select({phone: ms(9), tablet: ms(9)}),
  },

  /* ----- Header: truck badge + ref/mode + BID NOW ----- */
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
  },

  cardTruckBadge: {
    width:IS_TABLET ? ms(22) : ms(34),
    height: IS_TABLET ? ms(22) : ms(34),
    borderRadius:IS_TABLET ? ms(6) : ms(9),
    backgroundColor: colors.paleBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardHeadText: {
    flex: 1,
    minWidth: 0,
  },

  cardRef: {
    fontSize:IS_TABLET ? fontSize.micro : fontSize.subBody,
    fontWeight: '700',
    color: colors.textStrong,
  },

  // The shipment type reads as a rounded pale-blue chip under the ref. It hugs
  // its text (alignSelf) rather than spanning the header column.
  cardModePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.paleBlue,
    borderRadius: IS_TABLET ? ms(4) : ms(6),
    paddingHorizontal: ms(8),
    paddingVertical: vs(2),
    marginTop: vs(3),
  },

  cardMode: {
    fontSize:IS_TABLET ? fontSize.nano : fontSize.small,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.accentBlue,
    textTransform: 'uppercase',
  },

  cardBidBtn: {
    backgroundColor: colors.accentBlue,
    borderRadius: ms(8),
    paddingHorizontal:IS_TABLET ? ms(5) : ms(8),
    paddingVertical:IS_TABLET ? vs(2) : vs(7),
  },

  cardBidBtnText: {
    fontSize: fontSize.tiny,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.white,
  },

  /* ----- Commodity ----- */
  cardCommodityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    marginTop: select({phone: vs(8), tablet: vs(12)}),
  },

  cardCommodityText: {
    flexShrink: 1,
    fontSize: fontSize.caption,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: colors.textStrong,
    textTransform: 'uppercase',
  },

  /* ----- Pickup → Drop ----- */
  cardRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: select({phone: vs(15), tablet: vs(8)}),
  },

  cardRoutePoint: {
    flexShrink: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(5),
  },

  cardRoutePointEnd: {
    justifyContent: 'flex-end',
  },

  cardRoutePointText: {
    flexShrink: 1,
    minWidth: 0,
  },

  cardRoutePointTextEnd: {
    alignItems: 'flex-end',
  },

  cardRouteLabel: {
    fontSize: IS_TABLET ? fontSize.pico : fontSize.small,
    fontWeight: '600',
    letterSpacing: 0.4,
    color: colors.textMuted,
  },

  cardRouteCity: {
    fontSize:IS_TABLET ? fontSize.micro : fontSize.subBody,
    fontWeight: '700',
    color: colors.textStrong,
    marginTop: vs(1),
  },

  // A city/state too long for the card scrolls horizontally instead of
  // wrapping or being cut off.
  cardRouteCityScroll: {
    flexGrow: 0,
    flexShrink: 1,
    minWidth: 0,
  },

  cardRouteLine: {
    flex: 1,
    minWidth: ms(16),
    justifyContent: 'center',
    marginHorizontal: ms(10),
  },

  /* ----- Footer stats: pickup time / auction type / equipment type ----- */
  cardStatsRow: {
    flexDirection: 'row',
    marginTop: select({phone: vs(10), tablet: vs(9)}),
    paddingVertical: select({phone: vs(7), tablet: vs(4)}),
    paddingHorizontal: ms(4),
    backgroundColor: colors.paleBlue,
    borderRadius: ms(10),
  },

  cardStat: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: ms(2),
  },

  cardStatIcon: {
    width: select({phone: ms(26), tablet: ms(22)}),
    height: select({phone: ms(26), tablet: ms(22)}),
    borderRadius: ms(8),
    backgroundColor: colors.paleBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: select({phone: vs(4), tablet: vs(3)}),
  },

  cardStatValue: {
    // Tablet: nano reads one step above its pico caption so the value leads.
    fontSize: IS_TABLET ? fontSize.nano : fontSize.small,
    fontWeight: '700',
    color: colors.textStrong,
    textAlign: 'center',
  },

  cardStatLabel: {
    fontSize: IS_TABLET ? fontSize.pico : fontSize.small,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: vs(2),
  },

  // Thin vertical rule between the three footer stats; stretches to the row
  // height (default align) minus a small top/bottom inset.
  cardStatSep: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border_Color,
    marginVertical: vs(4),
  },

  // Full-width rule separating the header from the route row.
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border_Color,
    marginTop: select({phone: vs(12), tablet: vs(8)}),
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
//
// `v` is whatever the backend put in the row, so it is typed as a loose string
// and the index is asserted to the map's key union. The assertion is the point
// of the lookup rather than a shortcut around it: a value that is NOT a key is
// exactly the case the `||` fallback exists to catch, and widening the maps to
// `Record<string, …>` instead would silently accept a typo'd key elsewhere.
export const auctionTone = (v: string | null | undefined) =>
  AUCTION_TONE[v as keyof typeof AUCTION_TONE] || AUCTION_TONE.Instant;
export const driverTone = (v: string | null | undefined) =>
  DRIVER_TONE[v as keyof typeof DRIVER_TONE] || DRIVER_TONE.Single;
