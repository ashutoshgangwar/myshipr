import { StyleSheet } from 'react-native';
import {
  moderateScale,
  verticalScale,
  scale,
} from 'react-native-size-matters';
import { colors } from '../../../theme/colors';
import { fontSize } from '../../../theme/fontSizes';

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
    fontSize: fontSize.heading,
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
    fontSize: fontSize.caption,
    fontWeight: '700',
    color: colors.textMuted,
  },

  activeTabText: {
    color: colors.white,
    fontSize: fontSize.caption,
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
    fontSize: fontSize.subHeading,
    fontWeight: '700',
    color: colors.textStrong,
  },

  statusBadge: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
  },

  statusText: {
    fontSize: fontSize.caption,
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
    fontSize: fontSize.subBody,
    color: colors.textMuted,
  },

  locationRow: {
    marginTop: verticalScale(12),
  },

  location: {
    fontSize: fontSize.body,
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
    fontSize: fontSize.label,
    color: colors.textMuted,
  },

  pay: {
    fontSize: fontSize.heading,
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
    fontSize: fontSize.body,
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
    fontSize: fontSize.body,
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
    fontSize: fontSize.body,
    fontWeight: '700',
  },

  completedText: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.success,
  },

  emptyText: {
    textAlign: 'center',
    marginTop: verticalScale(40),
    fontSize: fontSize.body,
    color: colors.textMuted,
  },
});
