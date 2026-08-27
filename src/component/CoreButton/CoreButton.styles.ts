import { StyleSheet } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';

const styles = StyleSheet.create({
  button: {
    paddingVertical: verticalScale(14),
    paddingHorizontal: moderateScale(40),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(15),
  },
  disabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: moderateScale(8),
  },
  text: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
});

export default styles;
