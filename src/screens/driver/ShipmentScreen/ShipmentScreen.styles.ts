import {StyleSheet} from 'react-native';
import {ms as baseMs, vs as baseVs} from '../../../theme/scale';
import {colors} from '../../../theme/colors';
import {fontSize} from '../../../theme/fontSizes';
import {IS_TABLET, select} from '../../../theme/device';

const PHONE_FACTOR = select({phone: 0.82, tablet: 1});
const ms = (n: number): number => baseMs(n) * PHONE_FACTOR;
const vs = (n: number): number => baseVs(n) * PHONE_FACTOR;

// Pickup-time pill tints. The blue matches the table's column band so the two
// read as one family; the green marks a load leaving today.
const PILL_BLUE_BG = colors.paleBlue;
const PILL_GREEN_BG = colors.successLight;

// Share of the screen the UPCOMING / PAST pair spans — they split it evenly.
const TAB_ROW_WIDTH = select({phone: '90%', tablet: '90%'} as const);

// How far the pickup card rides up into the header's dark, rounded-bottom
// background — the same "card floats over the curve" look Home's stat row
// uses, scaled down for a single card rather than a row of them.
const PICKUP_CARD_OVERLAP = vs(28);

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },

  page: {
    flex: 1,
  },

  /* ---------- Header ---------- */
  // Extra room below the week strip so the header's own rounded-bottom curve
  // has somewhere to show once the pickup card overlaps up into it.
  headerPad: {
    paddingBottom: vs(16) + PICKUP_CARD_OVERLAP,
  },

  // The title/subtitle/badge come from the shared DashboardHeader — this screen
  // deliberately keeps no local copies of them, so the header size stays in
  // step with Home and Earnings.
  headerCalendarBtn: {
    width: IS_TABLET ? ms(30) : ms(36),
    height: IS_TABLET ? ms(30) : ms(36),
    borderRadius: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ---------- Week strip ---------- */
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: vs(16),
    gap: ms(6),
  },

  dayPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: IS_TABLET ? vs(3) : vs(5),
    borderRadius: IS_TABLET ? ms(10) : ms(12),
    borderWidth: 1,
    borderColor: colors.whiteAlpha20,
    backgroundColor: colors.whiteAlpha20,
  },

  dayPillActive: {
    backgroundColor: colors.accentBlue,
    borderColor: colors.accentBlue,
  },

  dayLabel: {
    color: colors.white,
    fontSize: fontSize.small,
    fontWeight: '600',
    marginBottom: IS_TABLET ? vs(2) : vs(3),
  },

  dayLabelActive: {
    color: colors.white,
  },

  dayNumber: {
    color: colors.white,
    fontSize: fontSize.subHeading,
    fontWeight: '700',
  },

  dayDot: {
    width: IS_TABLET ? ms(4) : ms(5),
    height: IS_TABLET ? ms(4) : ms(5),
    borderRadius: IS_TABLET ? ms(4) : ms(5),
    backgroundColor: colors.button_color,
    marginTop: IS_TABLET ? vs(3) : vs(4),
  },

  dayDotPlaceholder: {
    width: IS_TABLET ? ms(4) : ms(5),
    height: IS_TABLET ? ms(4) : ms(5),
    marginTop: IS_TABLET ? vs(3) : vs(4),
  },

  /* ---------- Today's pickup card ---------- */
  // Negative margin pulls it up into the header's own bottom padding, so the
  // header's rounded corners read as a dark hump behind the card's top edge.
  pickupCard: {
    backgroundColor: colors.white,
    borderRadius: ms(12),
    marginHorizontal: ms(12),
    marginTop: -PICKUP_CARD_OVERLAP,
    padding: ms(14),
    shadowColor: colors.textStrong,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },

  pickupBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },

  pickupBadgeDot: {
    width: ms(6),
    height: ms(6),
    borderRadius: ms(3),
    backgroundColor: colors.success,
    marginRight: ms(6),
  },

  pickupBadgeText: {
    color: colors.success,
    fontSize: fontSize.small,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Badge on the left, AWB No. pinned to the card's top-right corner — both
  // on the same line.
  pickupHeadRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  pickupRoute: {
    color: colors.textStrong,
    fontSize: fontSize.subHeading,
    fontWeight: '700',
    marginTop: vs(1),
  },

  pickupTimeText: {
    color: colors.textMuted,
    fontSize: fontSize.small,
    fontWeight: '500',
    marginTop: vs(4),
  },

  pickupStatCol: {
    alignItems: 'flex-end',
  },

  pickupStatLabel: {
    color: colors.textMuted,
    fontSize: fontSize.small,
    fontWeight: '500',
  },

  pickupStatValue: {
    color: colors.textStrong,
    fontSize: fontSize.label,
    fontWeight: '700',
    marginTop: vs(2),
  },

  pickupEmpty: {
    marginTop: vs(8),
    alignItems: 'stretch',
  },

  pickupEmptyTitle: {
    color: colors.textStrong,
    fontSize: fontSize.subBody,
    fontWeight: '700',
    textAlign: 'left',
  },

  pickupEmptySub: {
    color: colors.textMuted,
    fontSize: fontSize.small,
    fontWeight: '400',
    marginTop: vs(14),
    textAlign: 'center',
  },

  /* ---------- Upcoming / Past ---------- */
  // The pair is centred and narrower than the table below it — TAB_ROW_WIDTH is
  // the single knob for how wide the two buttons get.
  tabRow: {
    flexDirection: 'row',
    gap: ms(10),
    width: TAB_ROW_WIDTH,
    alignSelf: 'center',
    marginTop: vs(14),
  },

  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical:IS_TABLET ? vs(6) : vs(10),
    borderRadius: ms(10),
  },

  tabBtnActive: {
    backgroundColor: colors.primary,
  },

  tabBtnIdle: {
    backgroundColor: colors.textMuted,
  },

  tabBtnText: {
    color: colors.white,
    fontSize: fontSize.body,
    lineHeight: Math.round(ms(15) * 1.4),
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  /* ---------- Shipments table ---------- */
  listCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: ms(5),
    borderTopRightRadius: ms(5),
    marginHorizontal: ms(12),
    marginTop: vs(12),
    overflow: 'hidden',
    shadowColor: colors.textStrong,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },

  // Without an explicit flex, a FlatList sizes to its *content* height rather
  // than the space `listCard` actually has — it then either overflows past
  // the card (clipped by its `overflow: 'hidden'`) or, with few rows, never
  // gets tall enough to need scrolling at all. `flex: 1` bounds it to the
  // card's remaining height so the row list scrolls inside it instead.
  list: {
    flex: 1,
  },

  listContent: {
    paddingBottom: vs(16),
  },

  // Shown when the table has no rows to draw: the call came back empty, or
  // failed. The loading case draws skeleton rows here instead.
  listEmpty: {
    paddingVertical: vs(40),
    paddingHorizontal: ms(20),
    alignItems: 'center',
    justifyContent: 'center',
  },

  listEmptyText: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    textAlign: 'center',
  },

  /* ----- Column header band ----- */
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PILL_BLUE_BG,
    paddingHorizontal: ms(14),
    paddingVertical: vs(7),
  },

  tableHeadText: {
    color: colors.textStrong,
    fontSize: fontSize.small,
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
    flex: 0.9,
  },

  col3: {
    flex: 1.1,
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
    fontSize: fontSize.tiny,
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
    borderColor: colors.border_Color,
    paddingHorizontal: ms(8),
    paddingVertical: vs(2),
  },

  typeIcon: {
    marginRight: ms(5),
  },

  typeText: {
    color: colors.textMuted,
    fontSize: fontSize.tiny,
    fontWeight: '600',
  },

  /* ----- Payout ----- */
  payoutAmount: {
    color: colors.textStrong,
    fontSize: fontSize.label,
    fontWeight: '700',
    textAlign: 'center',
  },

  payoutMiles: {
    color: colors.border_Color,
    fontSize: fontSize.small,
    fontWeight: '500',
    marginTop: vs(2),
    textAlign: 'center',
  },

  /* ----- Pickup time ----- */
  timePill: {
    alignSelf: 'center',
    borderRadius: ms(6),
    paddingHorizontal: ms(10),
    paddingVertical: IS_TABLET ? vs(3) : vs(5),
  },

  timePillToday: {
    backgroundColor: PILL_GREEN_BG,
  },

  timePillLater: {
    backgroundColor: PILL_BLUE_BG,
  },

  timePillText: {
    fontSize: fontSize.tiny,
    fontWeight: '700',
  },

  timePillTextToday: {
    color: colors.success,
  },

  timePillTextLater: {
    color: colors.accentBlue,
  },
});
