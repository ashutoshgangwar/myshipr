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

  /* Header */
  header: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(16),
  },

  headerTitle: {
    fontSize: fontSize.mainHeading,
    fontWeight: '800',
    color: colors.textStrong,
  },

  headerSubtitle: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    marginTop: verticalScale(4),
  },

  /* Cards */
  card: {
    backgroundColor: colors.white,
    marginHorizontal: scale(16),
    marginTop: verticalScale(16),
    borderRadius: moderateScale(16),
    padding: scale(16),
  },

  cardTitle: {
    fontSize: fontSize.heading,
    fontWeight: '700',
    marginBottom: verticalScale(8),
    color: colors.textStrong,
  },

  /* Progress */
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(6),
  },

  progressLabel: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.textMuted,
  },

  progressValue: {
    fontSize: fontSize.body,
    fontWeight: '700',
    color: colors.textStrong,
  },

  progressTrack: {
    height: verticalScale(10),
    backgroundColor: colors.border_Color,
    borderRadius: moderateScale(10),
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    borderRadius: moderateScale(10),
  },

  /* Status */
  statusCard: {
    backgroundColor: colors.success,
    marginHorizontal: scale(16),
    marginTop: verticalScale(16),
    borderRadius: moderateScale(16),
    padding: scale(16),
  },

  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  statusTitle: {
    fontSize: fontSize.heading,
    fontWeight: '800',
    color: colors.white,
  },

  statusBadge: {
    backgroundColor: colors.white,
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(20),
  },

  statusBadgeText: {
    color: colors.success,
    fontWeight: '700',
    fontSize: fontSize.label,
  },

  statusInfo: {
    color: colors.successLight,
    marginTop: verticalScale(10),
    fontSize: fontSize.body,
    lineHeight: moderateScale(20),
  },

  /* ELD */
  eldRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  eldIcon: {
    width: scale(44),
    height: scale(44),
    borderRadius: moderateScale(12),
    backgroundColor: colors.paleBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: scale(12),
  },

  eldTitle: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.textStrong,
  },

  eldSub: {
    fontSize: fontSize.subBody,
    color: colors.textMuted,
    marginTop: verticalScale(2),
  },

  uploadBtn: {
    backgroundColor: colors.button_color,
    marginTop: verticalScale(16),
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(12),
    alignItems: 'center',
  },

  uploadBtnText: {
    color: colors.white,
    fontSize: fontSize.subHeading,
    fontWeight: '700',
  },

  /* Activity */
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: verticalScale(12),
  },

  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  activityDot: {
    width: scale(10),
    height: scale(10),
    backgroundColor: colors.accentBlue,
    borderRadius: scale(5),
    marginRight: scale(12),
  },

  activityTitle: {
    fontSize: fontSize.subHeading,
    fontWeight: '600',
    color: colors.textStrong,
  },

  activityTime: {
    fontSize: fontSize.subBody,
    color: colors.textMuted,
    marginTop: verticalScale(2),
  },

  activityDuration: {
    fontSize: fontSize.subHeading,
    fontWeight: '600',
    color: colors.textMuted,
  },

  divider: {
    height: verticalScale(1),
    backgroundColor: colors.border_Color,
    marginVertical: verticalScale(6),
  },
});
