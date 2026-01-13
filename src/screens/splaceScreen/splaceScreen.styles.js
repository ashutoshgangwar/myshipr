import { StyleSheet } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { colors } from '../../theme/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.input_bg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  logo: {
    width: moderateScale(320),
    height: verticalScale(250),
  },
});
