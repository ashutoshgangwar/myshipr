import {Platform, StyleSheet} from 'react-native';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';
import {colors} from '../../theme/colors';
import {IS_TABLET, select} from '../../theme/device';

const PHONE_FACTOR = select({phone: 0.78, tablet: 1});
const ms = n => baseMs(n) * PHONE_FACTOR;
const vs = n => baseVs(n) * PHONE_FACTOR;

const COLUMN_DIRECTION = 'row';
const STAT_BASIS = '22%';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },

  scrollContent: {
    paddingBottom: vs(28),
  },

  // Extra bottom space so the last content clears the absolutely-positioned
  // Trip-in-Progress banner instead of hiding underneath it.
  scrollContentWithBanner: {
    paddingBottom: vs(90),
  },

  /* ---------- Header ---------- */
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: ms(20),
    paddingTop: vs(16),
    paddingBottom: vs(44),
    borderBottomLeftRadius: ms(28),
    borderBottomRightRadius: ms(28),
  },

  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
  },

  brandBadge: {
    width: IS_TABLET ? ms(28) : ms(38),
    height: IS_TABLET ? ms(28) : ms(38),
    borderRadius: IS_TABLET ? ms(8) : Platform.OS === 'ios' ? ms(10) : ms(12),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandGlyph: {
    fontSize: ms(20),
  },

  brandText: {
    color: colors.white,
    fontSize: ms(20),
    fontWeight: '500',
    letterSpacing: 1,
  },

  dieselBadge: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: ms(12),
    paddingHorizontal: IS_TABLET ? ms(11) : ms(10),
    paddingVertical: IS_TABLET ? vs(2) : Platform.OS === 'ios' ? vs(8) : vs(6),
    alignItems: 'center',
  },

  dieselLabel: {
    color: colors.onDarkLow,
    fontSize: ms(10),
    fontWeight: '500',
    letterSpacing: 0.5,
  },

  dieselValue: {
    color: colors.success,
    fontSize: ms(15),
    fontWeight: '500',
    marginTop: vs(2),
  },

  headerLocation: {
    color: colors.onDarkMedium,
    fontSize: ms(15),
    fontWeight: '500',
    marginTop: vs(18),
  },

  headerWelcome: {
    color: colors.white,
    fontSize: IS_TABLET ? ms(20) : ms(24),
    fontWeight: '500',
    marginTop: vs(2),
  },

  /* ---------- Stats ---------- */
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: ms(10),
    paddingTop: vs(14),
    marginTop: -vs(40),
    zIndex: 2,
    gap: ms(10),
  },

  statCard: {
    flexGrow: 1,
    flexBasis: STAT_BASIS,
    backgroundColor: colors.white,
    borderRadius: ms(14),
    paddingVertical: IS_TABLET ? ms(8) : ms(10),
    paddingHorizontal: IS_TABLET ? ms(14) : ms(10),
    borderLeftWidth: 4,
    borderLeftColor: colors.cardBorder,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },

  statLabel: {
    color: colors.splashSubtitle,
    fontSize: ms(13),
    fontWeight: '600',
  },

  statValue: {
    color: colors.textStrong,
    fontSize: ms(24),
    fontWeight: '800',
    marginTop: vs(4),
  },

  statNote: {
    fontSize: IS_TABLET ? ms(11) : Platform.OS === 'ios' ? ms(16) : ms(16),
    fontWeight: '600',
    marginTop: vs(6),
  },

  /* ---------- Main grid ---------- */
  grid: {
    flexDirection: COLUMN_DIRECTION,
    // Stretch makes both columns take the height of the taller one (the left
    // column), so the right column matches it automatically.
    alignItems: 'stretch',
    paddingHorizontal: ms(12),
    paddingTop: vs(14),
    gap: ms(8),
  },

  column: {
    flex: 1,
    gap: ms(10),
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: ms(16),
    paddingVertical: IS_TABLET ? ms(10) : ms(10),
    paddingHorizontal: IS_TABLET ? ms(5) : ms(10),
  },

  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  cardTitle: {
    fontSize: IS_TABLET ? ms(10) : ms(15),
    fontWeight: '500',
    color: colors.textStrong,
  },

  pill: {
    paddingHorizontal: ms(10),
    paddingVertical: vs(4),
    borderRadius: ms(10),
    borderWidth: 1,
    backgroundColor: colors.warningLight,
  },

  pillOnTime: {
    borderColor: colors.success,
    backgroundColor: colors.successLight,
  },

  pillOnTimeText: {
    color: colors.success,
    fontSize: ms(11),
    fontWeight: '700',
  },

  pillOnDuty: {
    borderColor: colors.warning,
    backgroundColor: colors.warningLight,
  },

  pillOnDutyText: {
    color: colors.warning_text,
    fontSize: ms(11),
    fontWeight: '700',
  },

  /* ---------- Current Trip ---------- */
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: ms(8),
    marginTop: vs(8),
  },

  payoutValue: {
    color: colors.success,
    fontSize: IS_TABLET ? ms(20) : ms(25),
    fontWeight: '500',
  },

  payoutLabel: {
    color: colors.textMuted,
    fontSize: IS_TABLET ? ms(13) : ms(15),
    textAlign: 'center',
    fontWeight: '400',
  },

  routeBox: {
    backgroundColor: colors.screenBg,
    borderRadius: ms(10),
    paddingVertical: IS_TABLET ? ms(8) : ms(16),
    paddingHorizontal: IS_TABLET ? ms(1) : ms(16),
    marginTop: vs(10),
    flexDirection: 'row',
  },

  routeTimeline: {
    width: ms(16),
    alignItems: 'center',
    marginRight: ms(8),
  },

  routeDotStart: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    backgroundColor: colors.textMuted,
  },

  routeLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.cardBorder,
    marginVertical: vs(4),
  },

  routeDotEnd: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    backgroundColor: colors.accentBlue,
  },

  routeStopLabel: {
    color: colors.textMuted,
    fontSize: IS_TABLET ? ms(6) : ms(8),
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  routeStopCity: {
    color: colors.textStrong,
    fontSize: IS_TABLET ? ms(10) : ms(12),
    fontWeight: '700',
    marginBottom: vs(8),
  },

  tripStatsDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginTop: vs(12),
  },

  tripStatsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: vs(12),
  },

  tripStatItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: ms(2),
  },

  tripStatSeparator: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.cardBorder,
  },

  tripStatValue: {
    color: colors.textStrong,
    fontSize: IS_TABLET ? ms(10) : ms(9),
    fontWeight: '600',
    textAlign: 'center',
  },

  tripStatLabel: {
    color: colors.textMuted,
    fontWeight: '400',
    fontSize: IS_TABLET ? ms(11) : ms(10),
    marginTop: vs(2),
    textAlign: 'center',
  },

  /* ---------- Progress bars ---------- */
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: vs(16),
    marginBottom: vs(6),
  },

  progressCaption: {
    color: colors.textOnLightStrong,
    fontSize: IS_TABLET ? ms(12) : ms(13),
    fontWeight: '500',
  },

  progressCaptionAccent: {
    color: colors.accentBlue,
    fontSize: IS_TABLET ? ms(12) : ms(13),
    fontWeight: '700',
  },

  progressTrack: {
    height: vs(8),
    borderRadius: ms(8),
    backgroundColor: colors.cardBorder,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: ms(8),
    backgroundColor: colors.accentBlue,
  },

  progressFillWarn: {
    backgroundColor: colors.warning,
  },

  /* ---------- Buttons ---------- */
  primaryBtn: {
    borderRadius: ms(14),
    paddingVertical: vs(10),
    marginTop: vs(18),
  },

  primaryBtnText: {
    color: colors.white,
    fontSize: ms(12),
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  /* ---------- Hours of Service rows ---------- */
  hosDrivenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: vs(14),
    marginBottom: vs(6),
  },

  hosDrivenText: {
    color: colors.textStrong,
    fontSize: ms(14),
    fontWeight: '700',
  },

  hosRemText: {
    color: colors.textMuted,
    fontSize: ms(13),
    fontWeight: '600',
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: vs(12),
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },

  detailLabel: {
    color: colors.textStrong,
    fontSize: ms(10),
    fontWeight: '600',
  },

  detailValue: {
    color: colors.textMuted,
    fontSize: ms(10),
    fontWeight: '400',
  },

  detailValueStrong: {
    color: colors.textMuted,
    fontSize: ms(10),
    fontWeight: '400',
  },
  rewardsCard: {
    // No fixed flex: let the card grow to fit its text so iOS (taller
    // line-heights) doesn't get clipped by overflow: 'hidden'.
    alignSelf: 'stretch',
    borderRadius: ms(12),
    paddingVertical: ms(10),
    paddingHorizontal: ms(12),
    overflow: 'hidden',
  },

  rewardsLabel: {
    color: colors.splashSubtitle,
    fontSize: ms(10),
    fontWeight: '600',
  },

  rewardsTitle: {
    color: colors.white,
    fontSize: IS_TABLET ?  ms(20) : ms(18),
    fontWeight: '800',
    marginTop: vs(4),
    lineHeight: ms(28),
  },
  rewardsBody: {
    color: colors.onDarkLow,
    fontSize: ms(12),
    lineHeight: ms(18),
    marginTop: vs(10),
  },
  rewardsBalanceRow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    marginTop: vs(10),
    marginBottom: vs(8),
  },

  rewardsBalanceLabel: {
    color: colors.onDarkMedium,
    fontSize: ms(12),
    marginBottom: vs(2),
  },

  rewardsPoints: {
    color: colors.success,
    fontSize: ms(18),
    fontWeight: '800',
    alignSelf: 'flex-end',
    textAlign: 'right',
  },
  rewardsTrack: {
    height: vs(8),
    borderRadius: ms(8),
    backgroundColor: colors.white,
    overflow: 'hidden',
  },

  rewardsFill: {
    height: '100%',
    borderRadius: ms(8),
    backgroundColor: colors.success_bg,
  },

  rewardsFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: vs(8),
  },
  rewardsFooterText: {
    color: colors.onDarkLow,
    fontSize: ms(11),
    flex: 1,
    marginRight: ms(8),
  },
  rewardsFooterValue: {
    color: colors.onDarkLow,
    fontSize: ms(11),
    flexShrink: 0,
  },
  /* ---------- Upcoming loads ---------- */
  // Fills the right column (stretched to the left column height). Rounded clip
  // keeps the corners and contains the scroll content.
  loadsCard: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },

  // Sized by the card via flex; the absolute-fill ScrollView lives inside it
  // so the list scrolls without inflating the column height.
  loadsScrollWrap: {
    flex: 1,
    minHeight: 0,
    position: 'relative',
  },

  loadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: vs(12),
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },

  loadRowFirst: {
    borderTopWidth: 0,
  },

  loadRoute: {
    color: colors.textStrong,
    fontSize: ms(10),
    fontWeight: '600',
  },

  loadPickup: {
    color: colors.textMuted,
    fontSize: ms(10),
    marginTop: vs(3),
    fontWeight: '400',
  },

  loadRight: {
    alignItems: 'flex-end',
  },

  loadPay: {
    color: colors.textStrong,
    fontSize: ms(10),
    fontWeight: '400',
  },

  loadMiles: {
    color: colors.textMuted,
    fontSize: ms(10),
    marginTop: vs(3),
    fontWeight: '400',
  },

  loadChevron: {
    alignItems: 'center',
    paddingTop: vs(10),
  },

  loadChevronGlyph: {
    color: colors.textMuted,
    fontSize: ms(16),
  },

  /* ---------- Trip in Progress banner ---------- */
  tripBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.warning_text,
    paddingHorizontal: ms(24),
    paddingVertical:IS_TABLET ?  vs(6) : vs(16),
    marginBottom: vs(5),
    borderRadius: ms(10),
  },

  tripBannerTextWrap: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },

  tripBannerTitle: {
    color: colors.white,
    fontSize: ms(20),
    fontWeight: '600',
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  tripBannerSubtitle: {
    color: colors.white,
    fontSize: ms(10),
    marginTop: vs(2),
    fontWeight: '500',
    opacity: 0.9,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
});
