import { StyleSheet } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { colors } from '../../../theme/colors';
import { fontSize } from '../../../theme/fontSizes';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(16),
    backgroundColor: colors.primary,
    shadowColor: colors.textStrong,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  backText: {
    color: colors.white,
    fontSize: fontSize.body,
    fontWeight: '600',
  },

  title: {
    color: colors.white,
    fontSize: fontSize.title,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  headerSpacer: {
    width: moderateScale(40),
  },

  keyboardAvoidingView: {
    flex: 1,
  },

  scrollContent: {
    flex: 1,
  },

  scrollContentContainer: {
    paddingBottom: verticalScale(20),
  },

  // Hero Load Card
  heroCard: {
    backgroundColor: colors.white,
    marginHorizontal: moderateScale(16),
    marginTop: verticalScale(16),
    marginBottom: verticalScale(12),
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
    shadowColor: colors.textStrong,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },

  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(5),
  },

  loadBadge: {
    backgroundColor: colors.accentBlue,
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(6),
    marginRight: moderateScale(10),
  },

  loadBadgeText: {
    color: colors.white,
    fontSize: fontSize.caption,
    fontWeight: '700',
    letterSpacing: 1,
  },

  loadIdHero: {
    fontSize: fontSize.mainHeading,
    fontWeight: '800',
    color: colors.textStrong,
  },

  routeContainer: {
    marginBottom: verticalScale(10),
  },

  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: verticalScale(10),
  },

  greenDot: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: colors.success,
    marginTop: verticalScale(4),
    marginRight: moderateScale(12),
  },

  redDot: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: colors.danger,
    marginTop: verticalScale(4),
    marginRight: moderateScale(12),
  },
  routeTextContainer: {
    flex: 1,
  },

  routeLabel: {
    fontSize: fontSize.caption,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: verticalScale(4),
  },

  routeLocation: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.textStrong,
    lineHeight: moderateScale(20),
  },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statLabel: {
    fontSize: fontSize.caption,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: verticalScale(4),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  statValue: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.textStrong,
  },

  statValueGreen: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.success,
  },

  statDivider: {
    width: 1,
    backgroundColor: colors.border_Color,
    marginHorizontal: moderateScale(8),
  },

  // Bidding Card
  biddingCard: {
    backgroundColor: colors.white,
    marginHorizontal: moderateScale(16),
    marginBottom: verticalScale(12),
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
    shadowColor: colors.textStrong,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },

  biddingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },

  liveBadge: {
    fontSize: fontSize.label,
    fontWeight: '700',
    color: colors.danger,
    marginRight: moderateScale(8),
  },

  biddingTitle: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.textStrong,
    flex: 1,
  },

  bidCount: {
    fontSize: fontSize.subBody,
    fontWeight: '600',
    color: colors.textMuted,
  },

  winningBidCard: {
    backgroundColor: colors.card_drive_load,
    borderRadius: moderateScale(16),
    padding: moderateScale(10),
    marginBottom: verticalScale(16),
  },

  winningBidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },

  winningBidLabel: {
    fontSize: fontSize.label,
    fontWeight: '700',
    color: colors.button_color,
    letterSpacing: 1,
  },

  trendingDown: {
    backgroundColor: colors.successLight,
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
  },

  trendingText: {
    fontSize: fontSize.caption,
    fontWeight: '600',
    color: colors.success,
  },

  winningBidAmount: {
    fontSize: fontSize.giant,
    fontWeight: '800',
    color: colors.white,
    marginBottom: verticalScale(4),
  },

  winningBidSubtext: {
    fontSize: fontSize.subBody,
    color: colors.white,
    fontWeight: '500',
  },

  bidsListContainer: {
    marginTop: verticalScale(8),
  },

  recentBidsTitle: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: verticalScale(10),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  bidItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(8),
  },

  topBidItem: {
    backgroundColor: colors.amber100,
    borderWidth: 1,
    borderColor: colors.button_color,
  },

  bidItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  bidRank: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: colors.border_Color,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12),
  },

  topRank: {
    backgroundColor: colors.button_color,
  },

  bidRankText: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.textMuted,
  },

  topRankText: {
    color: colors.amber800,
  },

  bidderNameNew: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.textStrong,
  },

  bidTimeNew: {
    fontSize: fontSize.label,
    color: colors.textMuted,
    marginTop: verticalScale(2),
  },

  bidAmountContainer: {
    alignItems: 'flex-end',
  },

  bidAmountNew: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.textMuted,
  },

  topBidAmount: {
    color: colors.amber800,
    fontSize: fontSize.heading,
  },

  // Place Bid Card
  placeBidCard: {
    backgroundColor: colors.white,
    marginHorizontal: moderateScale(16),
    marginBottom: verticalScale(12),
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
    shadowColor: colors.textStrong,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },

  placeBidHeader: {
    marginBottom: verticalScale(20),
  },

  placeBidTitle: {
    fontSize: fontSize.heading,
    fontWeight: '800',
    color: colors.textStrong,
    marginBottom: verticalScale(4),
  },

  placeBidSubtitle: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    fontWeight: '500',
  },

  quickBidsContainer: {
    marginBottom: verticalScale(20),
  },

  quickBidsLabel: {
    fontSize: fontSize.subBody,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: verticalScale(10),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  quickBidsRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
  },

  quickBidChip: {
    flex: 1,
    backgroundColor: colors.screenBg,
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border_Color,
  },

  quickBidAmount: {
    fontSize: fontSize.heading,
    fontWeight: '700',
    color: colors.accentBlue,
    marginBottom: verticalScale(4),
  },

  quickBidLabel: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },

  bidInputSection: {
    marginBottom: verticalScale(16),
  },

  bidInputLabel: {
    fontSize: fontSize.subBody,
    fontWeight: '700',
    color: colors.textStrong,
    marginBottom: verticalScale(10),
  },

  bidInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.border_Color,
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(20),
    paddingVertical: verticalScale(14),
    minHeight: verticalScale(60),
  },

  bidInputFocused: {
    borderColor: colors.accentBlue,
    backgroundColor: colors.white,
    shadowColor: colors.accentBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  dollarSign: {
    fontSize: fontSize.display,
    fontWeight: '700',
    color: colors.textMuted,
    marginRight: moderateScale(8),
  },

  bidInput: {
    flex: 1,
    fontSize: fontSize.hero,
    fontWeight: '700',
    color: colors.textStrong,
    padding: 0,
    paddingVertical: 0,
    paddingHorizontal: moderateScale(4),
    textAlign: 'left',
    includeFontPadding: false,
  },

  usdText: {
    fontSize: fontSize.subHeading,
    fontWeight: '600',
    color: colors.textMuted,
  },

  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.red50,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(12),
  },

  warningIcon: {
    fontSize: fontSize.title,
    marginRight: moderateScale(8),
  },

  warningText: {
    flex: 1,
    fontSize: fontSize.subBody,
    color: colors.danger,
    fontWeight: '600',
  },

  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(12),
  },

  successIcon: {
    fontSize: fontSize.title,
    marginRight: moderateScale(8),
    color: colors.success,
    fontWeight: '700',
  },

  successText: {
    flex: 1,
    fontSize: fontSize.subBody,
    color: colors.success,
    fontWeight: '600',
  },

  disclaimerBox: {
    backgroundColor: colors.white,
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(16),
  },

  disclaimerText: {
    fontSize: fontSize.label,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: moderateScale(16),
  },

  submitButton: {
    backgroundColor: colors.button_color,
    paddingVertical: verticalScale(16),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    shadowColor: colors.accentBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  submitButtonDisabled: {
    backgroundColor: colors.border_Color,
    shadowOpacity: 0,
    elevation: 0,
  },

  submitButtonText: {
    fontSize: fontSize.subHeading,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },

  bottomSpacer: {
    height: verticalScale(20),
  },
});

export default styles;
