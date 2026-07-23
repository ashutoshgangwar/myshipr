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

  scrollContentWithBanner: {
    paddingBottom: vs(90),
  },

  /* Taller blue header — Home screen only (overrides DashboardHeader defaults) */
  dashboardHeader: {
    paddingTop: vs(15),
    paddingBottom: IS_TABLET ? vs(80) : vs(100),
    borderBottomLeftRadius: ms(100),
    borderBottomRightRadius: ms(100),
  },

  /* ---------- Header ---------- */
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: ms(20),
    paddingTop: vs(16),
    paddingBottom: vs(44),
    borderBottomLeftRadius: ms(38),
    borderBottomRightRadius: ms(38),
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

  /* ---------- Header right (diesel + profile) ---------- */
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
  },

  avatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
  },

  avatarCircle: {
    width: IS_TABLET ? ms(30) : ms(38),
    height: IS_TABLET ? ms(30) : ms(38),
    borderRadius: IS_TABLET ? ms(15) : ms(19),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarInitials: {
    color: colors.primary,
    fontSize: IS_TABLET ? ms(13) : ms(15),
    fontWeight: '700',
  },

  avatarCaretOpen: {
    transform: [{rotate: '180deg'}],
  },

  /* ---------- Profile dropdown menu ---------- */
  menuCard: {
    position: 'absolute',
    minWidth: ms(220),
    backgroundColor: colors.white,
    borderRadius: ms(14),
    paddingVertical: vs(6),
    paddingHorizontal: ms(6),
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 10,
  },

  menuHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    paddingHorizontal: ms(8),
    paddingVertical: vs(8),
  },

  menuAvatar: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(17),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  menuAvatarText: {
    color: colors.white,
    fontSize: ms(13),
    fontWeight: '700',
  },

  menuName: {
    color: colors.textStrong,
    fontSize: ms(14),
    fontWeight: '600',
  },

  menuDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginVertical: vs(4),
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    paddingHorizontal: ms(8),
    paddingVertical: vs(11),
    borderRadius: ms(10),
  },

  menuItemText: {
    color: colors.textStrong,
    fontSize: ms(14),
    fontWeight: '500',
  },

  menuItemLogout: {
    color: colors.danger,
  },

  headerLocation: {
    color: colors.onDarkMedium,
    fontSize: ms(15),
    fontWeight: '500',
    marginTop: IS_TABLET ? vs(2) : vs(18),
  },

  headerWelcome: {
    color: colors.white,
    fontSize: IS_TABLET ? ms(20) : ms(24),
    fontWeight: '500',
    marginTop: vs(2),
    marginBottom:IS_TABLET ? vs(6) : Platform.OS === 'ios' ? vs(1) : vs(8),
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
    alignItems: 'stretch',
    paddingHorizontal: ms(12),
    paddingTop: vs(20),
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
    paddingHorizontal: ms(8),
    paddingVertical: vs(1),
    borderRadius: ms(6),
    borderWidth: 1,
    backgroundColor: colors.warningLight,
  },
  pillStartsIn: {
    alignSelf: 'flex-end',
    marginTop: vs(8),
    borderColor: colors.warningLight,
    backgroundColor: '#FBF3D9',
  },

  pillStartsInText: {
    color: colors.warning_text,
    fontSize: ms(11),
    fontWeight: '700',
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
    marginTop: vs(5),
  },

  payoutValue: {
    color: colors.success,
    fontSize: IS_TABLET ? ms(18) : ms(25),
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
    paddingVertical: IS_TABLET ? ms(10) : ms(14),
    paddingHorizontal: IS_TABLET ? ms(10) : ms(14),
    marginTop: vs(5),
  },

  tripStatsDivider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginTop: vs(6),
  },

  tripStatsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: vs(8),
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
    fontSize: IS_TABLET ? ms(8) : ms(10),
    marginTop: vs(2),
    textAlign: 'center',
  },

  /* ---------- Progress bars ---------- */
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: vs(10),
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
    height: vs(5),
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
    borderRadius: ms(10),
    paddingVertical:IS_TABLET ? vs(5) : vs(8),
    marginTop: vs(12),
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
    alignSelf: 'stretch',
    borderRadius: ms(12),
    paddingVertical: ms(10),
    paddingHorizontal: ms(12),
    overflow: 'hidden',
  },

  rewardsPumpImage: {
    position: 'absolute',
    right:  ms(1),
    top:IS_TABLET ? ms(58) : ms(68),
    width: IS_TABLET ? ms(64) : ms(48),
    height: IS_TABLET ? ms(64) : ms(48),
  },

  rewardsBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(86,255,132,0.45)',
    backgroundColor: 'rgba(86,255,132,0.12)',
    borderRadius: ms(20),
    paddingHorizontal: ms(5),
    paddingVertical:IS_TABLET ? vs(1) : vs(4),
  },

  rewardsLabel: {
    color: '#56FF84',
    fontSize: ms(10),
    fontWeight: '600',
  },

  rewardsTitle: {
    color: colors.white,
    fontSize: IS_TABLET ? ms(12) : ms(10),
    fontWeight: '800',
    marginTop: vs(5),
    lineHeight: IS_TABLET ? ms(19) : ms(20),
    paddingRight: ms(44),
  },
  rewardsBody: {
    color: colors.onDarkLow,
    fontSize: IS_TABLET ? ms(7) : ms(8),
    lineHeight: ms(12),
    marginTop: vs(1),
  },
  rewardsBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(10),
    marginTop: vs(12),
    marginBottom: vs(5),
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: ms(8),
    paddingVertical: ms(1),
    paddingHorizontal: ms(6),
  },

  rewardsStarBadge: {
    width: ms(28),
    height: ms(28),
    borderRadius: ms(8),
    backgroundColor: colors.success_bg_star,
    alignItems: 'center',
    borderWidth: 1,
    borderColor:  colors.success_bg_star,
    justifyContent: 'center',
  },

  rewardsStarRing: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    borderWidth: ms(2),
    borderColor: colors.sucess_border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rewardsBalanceTextWrap: {
    flex: 1,
    justifyContent: 'center',
  },

  rewardsBalanceLabel: {
    color: colors.onDarkHigh,
    fontSize:IS_TABLET ? ms(8) : ms(10),
    fontWeight: '500',
    marginBottom: vs(2),
    textAlign: 'left',
  },

  rewardsPoints: {
    color: colors.white,
    fontSize: IS_TABLET ? ms(10) : ms(12),
    fontWeight: '800',
    textAlign: 'left',
    alignSelf: 'flex-start',
    includeFontPadding: false,
  },

  rewardsPointsUnit: {
    color: colors.sucess_border,
    fontSize: ms(8),
    fontWeight: '600',
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
    paddingVertical: vs(8),
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },

  loadRowFirst: {
    borderTopWidth: 0,
  },

  loadRouteCol: {
    flex: 1,
    paddingRight: ms(8),
  },
  loadRouteWrap: {
    position: 'relative',
  },

  loadDashed: {
    position: 'absolute',
    left: ms(8),
  },

  loadStopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: ms(26),
  },

  loadStopMarker: {
    width: ms(18),
    height: ms(16),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(6),
  },

  loadStopLabel: {
    flex: 1,
    color: colors.textStrong,
    fontSize: IS_TABLET ? ms(10) : ms(9),
    lineHeight: ms(15),
    fontWeight: '600',
  },

  // Type chip (FTL / LTL / Multileg).
  loadTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: vs(6),
    borderRadius: ms(6),
    backgroundColor: colors.screenBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: ms(8),
    paddingVertical: vs(3),
  },

  loadTypeIcon: {
    marginRight: ms(5),
  },

  loadTypeIconPlaceholder: {
    width: ms(14),
    height: ms(14),
    marginRight: ms(5),
  },

  loadTypeText: {
    color: colors.textMuted,
    fontSize: ms(8),
    fontWeight: '600',
  },

  // Centre time badge (orange when same-day, blue otherwise).
  loadTimeBadge: {
    alignItems: 'center',
    borderRadius: ms(6),
    paddingHorizontal: ms(5),
    paddingVertical: vs(1),
    marginHorizontal: ms(15),
  },

  loadTimeBadgeUrgent: {
    backgroundColor: '#F9DEC9',
  },

  loadTimeBadgeDefault: {
    backgroundColor: '#D8E4FB',
  },

  loadTimeText: {
    fontSize: ms(8),
    fontWeight: '600',
    textAlign: 'center',
  },

  loadTimeTextUrgent: {
    color: '#D9773B',
  },

  loadTimeTextDefault: {
    color: '#3B6FE0',
  },

  loadRight: {
    alignItems: 'flex-end',
  },

  loadPay: {
    color: colors.textStrong,
    fontSize: ms(10),
    fontWeight: '700',
  },

  loadMiles: {
    color: colors.textMuted,
    fontSize: ms(8),
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
