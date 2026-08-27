import { StyleSheet } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { colors } from '../../theme/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(16),
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  backText: {
    color: colors.white,
    fontSize: moderateScale(15),
    fontWeight: '600',
  },

  title: {
    color: colors.white,
    fontSize: moderateScale(18),
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
    shadowColor: '#000',
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
    backgroundColor: '#3B82F6',
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(6),
    marginRight: moderateScale(10),
  },

  loadBadgeText: {
    color: colors.white,
    fontSize: moderateScale(11),
    fontWeight: '700',
    letterSpacing: 1,
  },

  loadIdHero: {
    fontSize: moderateScale(24),
    fontWeight: '800',
    color: colors.text_dark,
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
    backgroundColor: '#10B981',
    marginTop: verticalScale(4),
    marginRight: moderateScale(12),
  },

  redDot: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    backgroundColor: '#EF4444',
    marginTop: verticalScale(4),
    marginRight: moderateScale(12),
  },
  routeTextContainer: {
    flex: 1,
  },

  routeLabel: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: verticalScale(4),
  },

  routeLocation: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: moderateScale(20),
  },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    padding: moderateScale(16),
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statLabel: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#64748B',
    marginBottom: verticalScale(4),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  statValue: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#1E293B',
  },

  statValueGreen: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#10B981',
  },

  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: moderateScale(8),
  },

  // Bidding Card
  biddingCard: {
    backgroundColor: colors.white,
    marginHorizontal: moderateScale(16),
    marginBottom: verticalScale(12),
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
    shadowColor: '#000',
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
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#EF4444',
    marginRight: moderateScale(8),
  },

  biddingTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: colors.text_dark,
    flex: 1,
  },

  bidCount: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#64748B',
  },

  winningBidCard: {
    backgroundColor: '#4F46E5',
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
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#FCD34D',
    letterSpacing: 1,
  },

  trendingDown: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
  },

  trendingText: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#10B981',
  },

  winningBidAmount: {
    fontSize: moderateScale(48),
    fontWeight: '800',
    color: colors.white,
    marginBottom: verticalScale(4),
  },

  winningBidSubtext: {
    fontSize: moderateScale(13),
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },

  bidsListContainer: {
    marginTop: verticalScale(8),
  },

  recentBidsTitle: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#64748B',
    marginBottom: verticalScale(10),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  bidItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(8),
  },

  topBidItem: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
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
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12),
  },

  topRank: {
    backgroundColor: '#FCD34D',
  },

  bidRankText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#64748B',
  },

  topRankText: {
    color: '#92400E',
  },

  bidderNameNew: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#1E293B',
  },

  bidTimeNew: {
    fontSize: moderateScale(12),
    color: '#94A3B8',
    marginTop: verticalScale(2),
  },

  bidAmountContainer: {
    alignItems: 'flex-end',
  },

  bidAmountNew: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#475569',
  },

  topBidAmount: {
    color: '#92400E',
    fontSize: moderateScale(20),
  },

  // Place Bid Card
  placeBidCard: {
    backgroundColor: colors.white,
    marginHorizontal: moderateScale(16),
    marginBottom: verticalScale(12),
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },

  placeBidHeader: {
    marginBottom: verticalScale(20),
  },

  placeBidTitle: {
    fontSize: moderateScale(22),
    fontWeight: '800',
    color: colors.text_dark,
    marginBottom: verticalScale(4),
  },

  placeBidSubtitle: {
    fontSize: moderateScale(14),
    color: '#64748B',
    fontWeight: '500',
  },

  quickBidsContainer: {
    marginBottom: verticalScale(20),
  },

  quickBidsLabel: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#64748B',
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
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },

  quickBidAmount: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: verticalScale(4),
  },

  quickBidLabel: {
    fontSize: moderateScale(11),
    color: '#64748B',
    fontWeight: '600',
  },

  bidInputSection: {
    marginBottom: verticalScale(16),
  },

  bidInputLabel: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: colors.text_dark,
    marginBottom: verticalScale(10),
  },

  bidInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(20),
    paddingVertical: verticalScale(14),
    minHeight: verticalScale(60),
  },

  bidInputFocused: {
    borderColor: '#3B82F6',
    backgroundColor: colors.white,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  dollarSign: {
    fontSize: moderateScale(28),
    fontWeight: '700',
    color: '#64748B',
    marginRight: moderateScale(8),
  },

  bidInput: {
    flex: 1,
    fontSize: moderateScale(32),
    fontWeight: '700',
    color: colors.text_dark,
    padding: 0,
    paddingVertical: 0,
    paddingHorizontal: moderateScale(4),
    textAlign: 'left',
    includeFontPadding: false,
  },

  usdText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#94A3B8',
  },

  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(12),
  },

  warningIcon: {
    fontSize: moderateScale(18),
    marginRight: moderateScale(8),
  },

  warningText: {
    flex: 1,
    fontSize: moderateScale(13),
    color: '#991B1B',
    fontWeight: '600',
  },

  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(12),
  },

  successIcon: {
    fontSize: moderateScale(18),
    marginRight: moderateScale(8),
    color: '#10B981',
    fontWeight: '700',
  },

  successText: {
    flex: 1,
    fontSize: moderateScale(13),
    color: '#065F46',
    fontWeight: '600',
  },

  disclaimerBox: {
    backgroundColor: '#F8FAFC',
    padding: moderateScale(12),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(16),
  },

  disclaimerText: {
    fontSize: moderateScale(12),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: moderateScale(16),
  },

  submitButton: {
    backgroundColor: colors.button_color,
    paddingVertical: verticalScale(16),
    borderRadius: moderateScale(16),
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  submitButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },

  submitButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },

  bottomSpacer: {
    height: verticalScale(20),
  },
});

export default styles;
