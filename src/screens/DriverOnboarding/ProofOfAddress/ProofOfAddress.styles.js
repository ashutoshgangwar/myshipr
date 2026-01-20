import { StyleSheet, Dimensions } from 'react-native';

import { verticalScale, moderateScale } from 'react-native-size-matters';
import { colors } from '../../../theme/colors';

const { width } = Dimensions.get('window');

export default StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    flex: 1,
    paddingHorizontal: moderateScale(16),
    marginTop: verticalScale(10),
  },
  card: {
    backgroundColor: '#fff',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(16),
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(8),
    shadowOffset: { width: 0, height: verticalScale(3) },
    elevation: 4,
  },
  cardTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    marginBottom: verticalScale(6),
    color: '#212529',
  },
  cardSub: {
    fontSize: moderateScale(14),
    color: colors.muted,
    marginBottom: verticalScale(12),
  },
  cardImage: {
    width: '100%',
    height: verticalScale(180),
    marginVertical: verticalScale(10),
    borderRadius: moderateScale(12),
    backgroundColor: '#f2f2f2',
  },
  cardPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    height: verticalScale(180),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(10),
    padding: verticalScale(20),
  },
  placeholderImage: {
    width: '100%',
    height: verticalScale(140),
    borderRadius: moderateScale(12),
  },
  placeholderText: {
    color: '#6C757D',
    marginTop: verticalScale(16),
    fontSize: moderateScale(14),
    textAlign: 'center',
  },
  cardChildren: {
    marginTop: verticalScale(12),
  },
});
