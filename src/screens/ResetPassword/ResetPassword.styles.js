import { StyleSheet } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { colors } from '../../theme/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: scale(20),
    justifyContent: 'center',
  },
 topSection: {
    alignItems: 'center',
    marginBottom: verticalScale(30),
  },

  image: {
    width: scale(260),
    height: verticalScale(80),
  },
  title: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: verticalScale(6),
  },

  subtitle: {
    textAlign: 'center',
    fontSize: moderateScale(14),
    color: colors.text_light,
    marginBottom: verticalScale(24),
  },

  inputWrapper: {
    position: 'relative',
    marginBottom: verticalScale(16),
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border_Color,
    backgroundColor: colors.input_bg,
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
    fontSize: moderateScale(16),
  },

  showHideButton: {
    position: 'absolute',
    right: moderateScale(12),
    top: '50%',
    transform: [{ translateY: -moderateScale(18) }],
    width: moderateScale(48),
    height: moderateScale(36),
    justifyContent: 'center',
    alignItems: 'center',
  },
});
