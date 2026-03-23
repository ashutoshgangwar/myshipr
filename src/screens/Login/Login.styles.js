import {StyleSheet} from 'react-native';
import {scale, verticalScale, moderateScale} from 'react-native-size-matters';
import {colors} from '../../theme/colors';

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
  },

  safe: {
    flex: 1,
    backgroundColor: '#7D7D7D',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    // paddingVertical: verticalScale(18),
  },

  screenShell: {
    // marginHorizontal: scale(28)
    borderRadius: moderateScale(34),
    overflow: 'hidden',
    backgroundColor: colors.white,
  },

  heroSection: {
    height: verticalScale(210),
    backgroundColor: colors.primary,
  },

  heroBackground: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  heroOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(26),
  },

  heroContent: {
    justifyContent: 'flex-end',
  },

  card: {
    backgroundColor: colors.white,
    marginTop: verticalScale(-16),
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    borderBottomLeftRadius: moderateScale(34),
    borderBottomRightRadius: moderateScale(34),
    paddingHorizontal: scale(18),
    paddingTop: verticalScale(22),
    paddingBottom: verticalScale(14),
  },

  title: {
    fontSize: moderateScale(26),
    fontWeight: '700',
    marginBottom: verticalScale(6),
    color: colors.white,
  },

  subtitle: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
    color: colors.onDarkHigh,
    marginBottom: verticalScale(16),
  },

  roleBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: moderateScale(18),
    paddingHorizontal: scale(16),
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
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: colors.text_dark,
    marginBottom: verticalScale(8),
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border_Color,
    backgroundColor: '#F3F3F3',
    borderRadius: moderateScale(13),
    paddingVertical: verticalScale(13),
    paddingHorizontal: scale(14),
    fontSize: moderateScale(15),
    marginBottom: verticalScale(12),
    color: colors.text_dark || '#111827',
  },

  passwordContainer: {
    position: 'relative',
    marginBottom: 0,
  },

  passwordInput: {
    paddingRight: scale(50),
    marginBottom: verticalScale(8),
  },

  otpRow: {
    marginBottom: verticalScale(4),
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
    backgroundColor: '#F3F3F3',
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

  disabledInput: {
    backgroundColor: '#F3F4F6',
    opacity: 0.7,
  },

  showHideButton: {
    position: 'absolute',
    right: scale(12),
    top: verticalScale(8),
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },

  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: verticalScale(18),
    paddingVertical: verticalScale(2),
  },

  forgotPasswordText: {
    color: colors.text_dark,
    fontWeight: '500',
    fontSize: moderateScale(13),
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
    borderRadius: moderateScale(13),
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(14),
    marginTop: verticalScale(8),
  },

  primaryButtonText: {
    color: colors.white,
    fontSize: moderateScale(16),
    fontWeight: '700',
  },

  altLoginText: {
    textAlign: 'center',
    color: colors.text_dark,
    fontSize: moderateScale(13),
    marginVertical: verticalScale(8),
  },

  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(13),
    backgroundColor: '#fff',
    marginTop: verticalScale(4),
    marginBottom: verticalScale(14),
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
    marginBottom: verticalScale(2),
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
