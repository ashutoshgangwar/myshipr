import { StyleSheet } from 'react-native';
import {
  moderateScale,
  verticalScale,
  scale,
} from 'react-native-size-matters';
import { colors } from '../../theme/colors';

export default StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    marginBottom: verticalScale(18),
    borderWidth: scale(1),
    borderColor: colors.border_Color,
    shadowColor: colors.textStrong,
    shadowOpacity: 0.05,
    shadowRadius: moderateScale(10),
    shadowOffset: { width: 0, height: verticalScale(4) },
    elevation: 2,
  },

  cardCompleted: {
    borderColor: colors.success,
    backgroundColor: colors.white,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },

  cardTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: colors.textStrong,
    flexShrink: 1,
  },

  statusBadge: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(20),
    minWidth: scale(70),
    alignItems: 'center',
  },

  badgePending: {
    backgroundColor: colors.amber100,
  },

  badgeSuccess: {
    backgroundColor: colors.successLight,
  },

  badgeText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: colors.textMuted,
  },

  scanArea: {
    borderWidth: scale(2),
    borderStyle: 'dashed',
    borderColor: colors.border_Color,
    borderRadius: moderateScale(16),
    height: verticalScale(200),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },

  cardImage: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(14),
  },

  placeholderImage: {
    width: scale(150),
    height: scale(150),
    marginBottom: verticalScale(5),
    borderRadius: moderateScale(10),
    opacity: 0.8,
  },

  scanText: {
    fontSize: moderateScale(14),
    color: colors.primary,
    fontWeight: '600',
  },

  cardChildren: {
    marginTop: verticalScale(14),
  },
});
