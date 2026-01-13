import { StyleSheet } from 'react-native';
import { moderateScale, verticalScale, scale } from 'react-native-size-matters';
import { colors } from '../../theme/colors';

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(14),
    padding: moderateScale(16),
    marginBottom: verticalScale(20),
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowRadius: moderateScale(12),
    elevation: 6,
  },
  header: {
    marginBottom: verticalScale(10),
  },
  cardTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#212529',
    marginBottom: verticalScale(2),
  },
  cardSub: {
    fontSize: moderateScale(14),
    color: '#6C757D',
  },
  cardImage: {
    width: '100%',
    height: verticalScale(220),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(12),
  },
  cardPlaceholder: {
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#F1F3F5',
  borderRadius: moderateScale(14),
  height: verticalScale(200),
  borderWidth: 1,
  borderColor: '#DEE2E6',
  },
  placeholderImage: {
    width: '100%',
    height: verticalScale(150),
    marginBottom: verticalScale(5),
  },
  placeholderText: {
    color: '#6C757D',
    fontSize: moderateScale(14),
    textAlign: 'center',
  },
  cardChildren: {
    marginTop: verticalScale(1),
    paddingTop: verticalScale(5),
  },
});

export default styles;
