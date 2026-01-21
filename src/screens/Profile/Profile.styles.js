import { StyleSheet } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { colors } from '../../theme/colors';

export default StyleSheet.create({
   safeArea: {
      flex: 1,
      backgroundColor: colors.primary,
    },
  screen: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  container: {
    paddingHorizontal: moderateScale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(40),
  },

  /* PROFILE CARD */
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    alignItems: 'center',
    paddingVertical: verticalScale(18),
    marginBottom: verticalScale(18),
    elevation: 4,
  },

  avatar: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: 36,
    marginBottom: verticalScale(10),
  },

  name: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#212529',
    marginBottom: verticalScale(6),
  },

  badgeRow: {
    flexDirection: 'row',
    gap: moderateScale(8),
    marginBottom: verticalScale(10),
  },

  verifiedBadge: {
    backgroundColor: '#E6FCF5',
    color: '#0CA678',
    fontSize: moderateScale(12),
    fontWeight: '600',
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    borderRadius: 20,
  },

  progressBadge: {
    backgroundColor: '#FFF4E6',
    color: '#E8590C',
    fontSize: moderateScale(12),
    fontWeight: '600',
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(4),
    borderRadius: 20,
  },

  progressBar: {
    width: '80%',
    height: verticalScale(6),
    backgroundColor: '#E9ECEF',
    borderRadius: 10,
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: '#4C6EF5',
    borderRadius: 10,
  },

  /* DETAILS CARD */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(14),
    marginBottom: verticalScale(20),
    elevation: 3,
  },

  row: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(16),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },

  label: {
    fontSize: moderateScale(12),
    color: '#6C757D',
    marginBottom: verticalScale(4),
  },

  value: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#212529',
  },
  featureCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: moderateScale(16),
  padding: moderateScale(18),
  marginBottom: verticalScale(20),
  elevation: 4,
  alignItems: 'center',
},
iconCircle: {
  width: 48,
  height: 48,
  borderRadius: 24,
  backgroundColor: '#EEF2FF',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: verticalScale(10),
},
primaryButton: {
  width: '100%',
  backgroundColor: '#4C6EF5',
  paddingVertical: verticalScale(14),
  borderRadius: 12,
  alignItems: 'center',
  marginTop: verticalScale(14),
},

primaryButtonText: {
  color: '#FFFFFF',
  fontSize: moderateScale(15),
  fontWeight: '700',
},
sectionTitle: {
  fontSize: moderateScale(14),
  fontWeight: '700',
  color: '#495057',
  padding: moderateScale(16),
  paddingBottom: 8,
},

});
