import { StyleSheet } from 'react-native';
import {
  moderateScale,
  verticalScale,
  scale,
} from 'react-native-size-matters';
import { colors } from '../../theme/colors';

export default StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    marginBottom: verticalScale(18),
    borderWidth: scale(1),
    borderColor: '#E9ECEF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: moderateScale(10),
    shadowOffset: { width: 0, height: verticalScale(4) },
    elevation: 2,
  },

  cardCompleted: {
    borderColor: '#28A745',
    backgroundColor: '#F6FFF9',
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
    color: '#212529',
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
    backgroundColor: '#FFF3CD',
  },

  badgeSuccess: {
    backgroundColor: '#D4EDDA',
  },

  badgeText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    color: '#495057',
  },

  scanArea: {
    borderWidth: scale(2),
    borderStyle: 'dashed',
    borderColor: '#CED4DA',
    borderRadius: moderateScale(16),
    height: verticalScale(200),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
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
