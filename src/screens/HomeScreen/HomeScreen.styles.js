import {Platform, StyleSheet} from 'react-native';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';
import {colors} from '../../theme/colors';
import {select} from '../../utils/device';

// Single shared layout for every device: the two-column tablet dashboard.
// The tablet view is the reference and stays pixel-for-pixel identical
// (factor 1). Phones keep the EXACT same layout/alignment but shrink every
// size uniformly so the narrow two columns don't overflow. No alternate
// stacked layout is created.
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

  /* ---------- Header ---------- */
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: ms(20),
    paddingTop: vs(16),
    paddingBottom: vs(26),
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
    width: ms(38),
    height: ms(38),
    borderRadius: Platform.OS === 'ios' ? ms(10) : ms(12),
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
    paddingHorizontal: ms(18),
    paddingVertical:Platform.OS === 'ios' ? vs(8) : vs(6),
    alignItems: 'center',
  },

  dieselLabel: {
    color: colors.onDarkLow,
    fontSize: ms(11),
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  dieselValue: {
    color: colors.success,
    fontSize: ms(15),
    fontWeight: '800',
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
    fontSize: ms(28),
    fontWeight: '500',
    marginTop: vs(2),
  },

  /* ---------- Stats ---------- */
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: ms(12),
    paddingTop: vs(14),
    gap: ms(10),
  },

  statCard: {
    flexGrow: 1,
    flexBasis: STAT_BASIS,
    backgroundColor: colors.white,
    borderRadius: ms(14),
    padding: ms(14),
    borderLeftWidth: 4,
    borderLeftColor: colors.cardBorder,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },

  statLabel: {
    color: colors.textMuted,
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
    fontSize: ms(11),
    fontWeight: '600',
    marginTop: vs(6),
  },

  /* ---------- Main grid ---------- */
  grid: {
    flexDirection: COLUMN_DIRECTION,
    paddingHorizontal: ms(12),
    paddingTop: vs(14),
    gap: ms(12),
  },

  column: {
    flex: 1,
    gap: ms(12),
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: ms(16),
    padding: ms(16),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },

  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  cardTitle: {
    fontSize: ms(15),
    fontWeight: '700',
    color: colors.textStrong,
  },

  pill: {
    paddingHorizontal: ms(10),
    paddingVertical: vs(4),
    borderRadius: ms(10),
    borderWidth: 1,
  },

  pillOnTime: {
    borderColor: colors.success,
    backgroundColor: 'rgba(22,163,74,0.08)',
  },

  pillOnTimeText: {
    color: colors.success,
    fontSize: ms(11),
    fontWeight: '700',
  },

  pillOnDuty: {
    borderColor: colors.warning,
    backgroundColor: 'rgba(245,158,11,0.10)',
  },

  pillOnDutyText: {
    color: colors.warning,
    fontSize: ms(11),
    fontWeight: '700',
  },

  /* ---------- Current Trip ---------- */
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: ms(8),
    marginTop: vs(8),
  },

  payoutValue: {
    color: colors.success,
    fontSize: ms(34),
    fontWeight: '800',
  },

  payoutLabel: {
    color: colors.textMuted,
    fontSize: ms(13),
    marginBottom: vs(6),
  },

  routeBox: {
    backgroundColor: colors.screenBg,
    borderRadius: ms(14),
    padding: ms(14),
    marginTop: vs(14),
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
    fontSize: ms(10),
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  routeStopCity: {
    color: colors.textStrong,
    fontSize: ms(17),
    fontWeight: '700',
    marginBottom: vs(10),
  },

  tripStatsRow: {
    flexDirection: 'row',
    marginTop: vs(14),
  },

  tripStatItem: {
    flex: 1,
    alignItems: 'flex-start',
  },

  tripStatValue: {
    color: colors.textStrong,
    fontSize: ms(15),
    fontWeight: '700',
  },

  tripStatLabel: {
    color: colors.textMuted,
    fontSize: ms(11),
    marginTop: vs(2),
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
    color: colors.textStrong,
    fontSize: ms(13),
    fontWeight: '600',
  },

  progressCaptionAccent: {
    color: colors.accentBlue,
    fontSize: ms(13),
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
    backgroundColor: colors.accentBlue,
    borderRadius: ms(14),
    paddingVertical: vs(14),
    alignItems: 'center',
    marginTop: vs(18),
  },

  primaryBtnText: {
    color: colors.white,
    fontSize: ms(16),
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
    fontSize: ms(14),
    fontWeight: '600',
  },

  detailValue: {
    color: colors.textMuted,
    fontSize: ms(13),
    fontWeight: '600',
  },

  detailValueStrong: {
    color: colors.warning,
    fontSize: ms(13),
    fontWeight: '800',
  },

  /* ---------- Fuel Rewards (dark card) ---------- */
  rewardsCard: {
    backgroundColor: colors.primary,
    borderRadius: ms(16),
    padding: ms(18),
  },

  rewardsLabel: {
    color: colors.onDarkMedium,
    fontSize: ms(12),
    fontWeight: '600',
  },

  rewardsTitle: {
    color: colors.white,
    fontSize: ms(22),
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

  rewardsBalanceLabel: {
    color: colors.onDarkMedium,
    fontSize: ms(12),
    marginTop: vs(16),
  },

  rewardsPointsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: vs(6),
  },

  rewardsPoints: {
    color: colors.success,
    fontSize: ms(18),
    fontWeight: '800',
  },

  rewardsTrack: {
    height: vs(8),
    borderRadius: ms(8),
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    marginTop: vs(6),
  },

  rewardsFill: {
    height: '100%',
    borderRadius: ms(8),
    backgroundColor: colors.success,
  },

  rewardsFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: vs(8),
  },

  rewardsFooterText: {
    color: colors.onDarkLow,
    fontSize: ms(11),
  },

  /* ---------- Upcoming loads ---------- */
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
    fontSize: ms(15),
    fontWeight: '700',
  },

  loadPickup: {
    color: colors.textMuted,
    fontSize: ms(12),
    marginTop: vs(3),
  },

  loadRight: {
    alignItems: 'flex-end',
  },

  loadPay: {
    color: colors.textStrong,
    fontSize: ms(15),
    fontWeight: '800',
  },

  loadMiles: {
    color: colors.textMuted,
    fontSize: ms(11),
    marginTop: vs(3),
  },

  loadChevron: {
    alignItems: 'center',
    paddingTop: vs(10),
  },

  loadChevronGlyph: {
    color: colors.textMuted,
    fontSize: ms(16),
  },
});
