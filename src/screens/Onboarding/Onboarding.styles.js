import {StyleSheet, Platform} from 'react-native';
import {scale, verticalScale, moderateScale} from 'react-native-size-matters';
import {colors} from '../../theme/colors';

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
  },

  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },

  bottomActionContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    paddingHorizontal: scale(24),
    paddingTop: verticalScale(10),
    paddingBottom:
      Platform.OS === 'ios' ? verticalScale(18) : verticalScale(14),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(8),
    elevation: 12,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingBottom:
      Platform.OS === 'ios' ? verticalScale(120) : verticalScale(112),
  },

  screenShell: {
    width: '100%',
    marginTop: 0,
    backgroundColor: colors.white,
  },

  heroSection: {
    width: '100%',
    height: Platform.OS === 'ios' ? verticalScale(260) : verticalScale(215),
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },

  heroOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: -scale(10),
    paddingBottom:
      Platform.OS === 'ios' ? verticalScale(20) : verticalScale(15),
  },

  heroContent: {
    justifyContent: 'flex-end',
    marginLeft: scale(20),
    marginBottom: Platform.OS === 'ios' ? verticalScale(20) : verticalScale(15),
  },

  card: {
    backgroundColor: colors.white,
    marginTop: Platform.OS === 'ios' ? -verticalScale(40) : -verticalScale(24),
    marginBottom: Platform.OS === 'ios' ? verticalScale(12) : verticalScale(10),
    // borderRadius: Platform.OS === 'ios' ? moderateScale(15) : moderateScale(20),
    borderTopLeftRadius: 'ios' ? moderateScale(15) : moderateScale(20),
    borderTopRightRadius: Platform.OS === 'ios' ? moderateScale(15) : moderateScale(20),
    paddingHorizontal: Platform.OS === 'ios' ? scale(20) : scale(24),
    paddingTop: Platform.OS === 'ios' ? verticalScale(26) : verticalScale(28),
    paddingBottom:
      Platform.OS === 'ios' ? verticalScale(28) : verticalScale(24),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: Platform.OS === 'ios' ? 6 : 4},
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.08,
    shadowRadius: Platform.OS === 'ios' ? moderateScale(14) : moderateScale(12),
    elevation: Platform.OS === 'ios' ? 0 : 5,
  },

  title: {
    fontSize: moderateScale(26),
    fontWeight: '700',
    marginBottom: verticalScale(5),
    color: colors.white,
  },

  subtitle: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
    color: colors.onDarkHigh,
    marginBottom: verticalScale(60),
  },

  label: {
    fontSize: moderateScale(16),
    fontWeight: '500',
    color: colors.text_dark,
    marginBottom: verticalScale(10),
    textAlign: 'left',
    alignSelf: 'flex-start',
    width: '100%',
  },

  input: {
    borderWidth: scale(1),
    borderColor: colors.border_Color,
    backgroundColor: colors.gray400,
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    fontSize: moderateScale(15),
    marginBottom: verticalScale(16),
    color: colors.text_dark,
    textAlign: 'left',
    width: '100%',
  },

  disabledInput: {
    backgroundColor: '#F3F4F6',
    opacity: 0.7,
  },

  button: {
    backgroundColor: colors.button_color,
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingButton: {
    opacity: 0.7,
  },

  buttonText: {
    color: colors.text_color_button || '#fff',
    textAlign: 'center',
    fontSize: moderateScale(16),
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical:
      Platform.OS === 'ios' ? verticalScale(16) : verticalScale(14),
    marginTop: verticalScale(12),
    shadowColor: colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: moderateScale(8),
    elevation: 5,
  },

  footerButton: {
    marginTop: 0,
  },

  primaryButtonText: {
    color: colors.white,
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
});

export default styles;
