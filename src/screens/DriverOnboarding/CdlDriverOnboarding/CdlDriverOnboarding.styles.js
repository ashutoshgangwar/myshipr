import { StyleSheet } from 'react-native';
import { verticalScale, moderateScale } from 'react-native-size-matters';
import { colors } from '../../../theme/colors';

export default StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },

  /* Progress */
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(14),
    padding: moderateScale(16),
    marginBottom: verticalScale(10),
    marginTop: verticalScale(10),
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  progressTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#212529',
  },
  progressSub: {
    fontSize: moderateScale(13),
    color: colors.muted,
    marginTop: verticalScale(2),
  },
  progressPercent: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: colors.primary,
  },
  progressBar: {
    height: verticalScale(8),
    backgroundColor: '#E9ECEF',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: moderateScale(10),
  },
});
