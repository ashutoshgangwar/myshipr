import { StyleSheet } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { colors } from '../../theme/colors';

export default StyleSheet.create({
  wrapper: {
    marginBottom: verticalScale(6),
  },
label: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: colors.textStrong,
    marginBottom: verticalScale(6),
  },
  inputBox: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(5),
    borderWidth: 1,
    borderColor: colors.border_Color,
  },
  input: {
    fontSize: moderateScale(15),
    color: colors.textStrong,
    fontWeight: '500',
  },
});
