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
    color: colors.text_color_button,
    marginBottom: verticalScale(6),
  },
  inputBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(5),
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  input: {
    fontSize: moderateScale(15),
    color: '#212529',
    fontWeight: '500',
  },
});
