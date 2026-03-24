import {StyleSheet, Platform} from 'react-native';
import {scale, verticalScale, moderateScale} from 'react-native-size-matters';
import {colors} from '../../theme/colors';

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
  },

  safe: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    // paddingBottom: Platform.OS === 'ios' ? verticalScale(20) : verticalScale(14),
  },

  screenShell: {
    width: '100%',
    marginTop: 0,
    backgroundColor: colors.primary,
  },

  heroSection: {
    width: '100%',
    height: Platform.OS === 'ios' ? verticalScale(260) : verticalScale(215),
    backgroundColor: colors.primary,
    overflow: 'hidden',
  },

  heroBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
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
    borderRadius: Platform.OS === 'ios' ? moderateScale(15) : moderateScale(20),
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
    marginBottom: verticalScale(10),
    color: colors.white,
  },

  subtitle: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
    color: colors.onDarkHigh,
    marginBottom: verticalScale(10),
  },

  roleBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    marginBottom: verticalScale(30),
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderTopRightRadius: moderateScale(18),
    borderBottomRightRadius: moderateScale(18),
    paddingHorizontal: scale(16),
    borderBottomLeftRadius: moderateScale(18),
    paddingVertical: verticalScale(8),
  },

  roleBadgeText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    letterSpacing: 0.6,
    color: colors.white,
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: moderateScale(16),
    padding: moderateScale(4),
    marginBottom: verticalScale(18),
  },

  tab: {
    flex: 1,
    paddingVertical: verticalScale(9),
    borderRadius: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: moderateScale(6),
    elevation: 2,
  },

  tabText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#6B7280',
  },

  tabTextActive: {
    color: colors.textOnLightStrong,
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
    paddingVertical:
      Platform.OS === 'ios' ? verticalScale(15) : verticalScale(12),
    paddingHorizontal: scale(16),
    fontSize: moderateScale(15),
    marginBottom: verticalScale(16),
    color: colors.text_dark || '#111827',
    textAlign: 'left',
    width: '100%',
  },

  optionalContainer: {
    position: 'relative',
    marginBottom: verticalScale(10),
  },

  inlineInput: {
    marginBottom: 0,
    paddingRight: scale(92),
  },

  sendOtpButton: {
    position: 'absolute',
    right: scale(14),
    fontWeight: '400',
    fontSize: moderateScale(12),
    backgroundColor: colors.primary,
    borderRadius: moderateScale(5),
    paddingVertical: verticalScale(18),
    paddingHorizontal: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    top: Platform.OS === 'ios' ? verticalScale(12) : verticalScale(10),
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendOtpText: {
    color: colors.white,
    fontSize: moderateScale(12),
    fontWeight: '700',
  },

  passwordContainer: {
    position: 'relative',
    marginBottom: verticalScale(4),
  },

  passwordInput: {
    paddingRight: scale(50),
    marginBottom: verticalScale(12),
  },

  otpRow: {
    marginBottom: verticalScale(4),
  },

  otpLabel: {
     fontSize: moderateScale(16),
    fontWeight: '500',
    color: colors.text_dark,
    marginBottom: verticalScale(8),
  },

  otpInput: {
    textAlign: 'center',
    letterSpacing: 2,
  },

  otpBoxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(10),
  },

  otpBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border_Color,
    backgroundColor: colors.gray400,
    borderRadius: moderateScale(12),
    textAlign: 'center',
    fontSize: moderateScale(18),
    paddingVertical: verticalScale(12),
    marginHorizontal: scale(4),
    color: colors.text_dark || '#111827',
  },

  otpTimerText: {
    textAlign: 'right',
    color: '#9CA3AF',
    fontSize: moderateScale(13),
    marginBottom: verticalScale(10),
  },

  captchaContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: verticalScale(10),
  },

  captchaInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: scale(10),
  },

  captchaRightContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: scale(116),
  },

  captchaCodeBox: {
    backgroundColor: colors.gray400,
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: moderateScale(10),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(10),
    minWidth: scale(112),
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  captchaCodeText: {
    color: colors.primary,
    fontSize: moderateScale(15),
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  captchaRefreshButton: {
    marginLeft: scale(8),
    paddingHorizontal: scale(4),
    backgroundColor: colors.primary,
    borderRadius: moderateScale(6),
    paddingVertical: verticalScale(4),
    justifyContent: 'center',
    alignItems: 'center',
  },

  captchaRefreshIcon: {
    color: colors.primary,
    fontSize: moderateScale(18),
    fontWeight: '700',
  },

  disabledInput: {
    backgroundColor: '#F3F4F6',
    opacity: 0.7,
  },

  showHideButton: {
    position: 'absolute',
    right: scale(12),
    top: Platform.OS === 'ios' ? verticalScale(8) : verticalScale(5),
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },

  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: verticalScale(5),
    paddingVertical: verticalScale(2),
  },

  forgotPasswordText: {
    color: colors.text_dark,
    fontWeight: '400',
    fontSize: moderateScale(12),
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

  primaryButtonText: {
    color: colors.white,
    fontSize: moderateScale(16),
    fontWeight: '700',
  },

  altLogin: {
    textAlign: 'center',
    color: colors.text_dark,
    fontSize: moderateScale(12),
    marginVertical: verticalScale(1),
    fontWeight: '400',
    marginTop: verticalScale(15),
  },

  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(14),
    backgroundColor: '#fff',
    marginTop: verticalScale(12),
    marginBottom: verticalScale(18),
  },

  disabledButton: {
    opacity: 0.5,
  },

  googleIcon: {
    width: scale(24),
    height: scale(24),
    marginRight: scale(12),
  },

  googleText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: colors.textOnLightStrong,
  },

  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(8),
    marginTop: verticalScale(4),
  },

  signupText: {
    fontSize: moderateScale(13),
    color: colors.text_dark,
  },

  signupAction: {
    fontSize: moderateScale(13),
    color: colors.text_dark,
    fontWeight: '700',
  },
});

export default styles;
