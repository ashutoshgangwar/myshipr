import { StyleSheet } from 'react-native';
import { verticalScale, moderateScale } from 'react-native-size-matters';
import { colors } from '../../theme/colors';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingTop: verticalScale(20),
    paddingHorizontal: moderateScale(10),
    paddingBottom: verticalScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowRadius: moderateScale(4),
  },
  backButton: {
    marginRight: moderateScale(12),
    padding: moderateScale(6),
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: moderateScale(14),
    color: '#e0e0e0',
    marginTop: verticalScale(2),
  },
});

export default styles;
