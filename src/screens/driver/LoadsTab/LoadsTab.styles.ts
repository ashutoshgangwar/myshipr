import { StyleSheet } from 'react-native';
import {
  moderateScale,
  verticalScale,
  scale,
} from 'react-native-size-matters';
import { colors } from '../../../theme/colors';

export default StyleSheet.create({
   safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(12),
  },

  title: {
    fontSize: moderateScale(22),
    fontWeight: '700',
    marginBottom: verticalScale(14),
    color: colors.textStrong,
  },

  /* Tabs */
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: verticalScale(16),
    gap: scale(6),
  },

  tab: {
    flex: 1,
    height: verticalScale(42),
    borderRadius: moderateScale(10),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  activeTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  tabText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: colors.textMuted,
  },

  activeTabText: {
    color: colors.white,
    fontSize: moderateScale(11),
  },

  /* Card */
  card: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    padding: scale(16),
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: colors.border_Color,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  loadId: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    color: colors.textStrong,
  },

  statusBadge: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
  },

  statusText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: colors.white,
  },

  statusPending: {
    backgroundColor: colors.card_drive_load,
  },

  statusAvailable: {
    backgroundColor: colors.accentBlue,
  },

  statusActive: {
    backgroundColor: colors.button_color,
  },

  statusCompleted: {
    backgroundColor: colors.success,
  },

  subText: {
    marginTop: verticalScale(6),
    fontSize: moderateScale(13),
    color: colors.textMuted,
  },

  locationRow: {
    marginTop: verticalScale(12),
  },

  location: {
    fontSize: moderateScale(14),
    marginBottom: verticalScale(4),
    color: colors.textStrong,
  },

  footerRow: {
    marginTop: verticalScale(14),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  estimate: {
    fontSize: moderateScale(12),
    color: colors.textMuted,
  },

  pay: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: colors.success,
  },

  acceptButton: {
    backgroundColor: colors.card_drive_load,
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(10),
  },

  acceptText: {
    color: colors.white,
    fontSize: moderateScale(14),
    fontWeight: '700',
  },

  bidButton: {
    backgroundColor: colors.accentBlue,
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(10),
  },

  bidText: {
    color: colors.white,
    fontSize: moderateScale(14),
    fontWeight: '700',
  },

  trackButton: {
    backgroundColor: colors.button_color,
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(10),
  },

  trackText: {
    color: colors.white,
    fontSize: moderateScale(14),
    fontWeight: '700',
  },

  completedText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: colors.success,
  },

  emptyText: {
    textAlign: 'center',
    marginTop: verticalScale(40),
    fontSize: moderateScale(14),
    color: colors.textMuted,
  },
});
