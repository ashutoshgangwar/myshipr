import {StyleSheet} from 'react-native';
import {scale, verticalScale, moderateScale} from 'react-native-size-matters';
import {colors} from '../../theme/colors';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
  },
  // gradient: {
  //   flex: 1,
  // },
  container: {
    flexGrow: 1,
    paddingHorizontal: scale(20),
    paddingVertical: verticalScale(20),
    justifyContent: 'center',
  },
  topSection: {
    backgroundColor: colors.white,
    alignItems: 'center',
    marginBottom: verticalScale(30),
    borderRadius: moderateScale(20),
  },

  image: {
    width: scale(260),
    height: verticalScale(80),
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(20),
    padding: moderateScale(14),
    shadowColor: '#000',
  },

  title: {
    fontSize: moderateScale(28),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: verticalScale(8),
    color: colors.text_dark || '#111827',
  },

  subtitle: {
    textAlign: 'center',
    fontSize: moderateScale(14),
    color: colors.text_light || '#6B7280',
    marginBottom: verticalScale(24),
  },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: moderateScale(12),
    padding: moderateScale(4),
    marginBottom: verticalScale(16),
  },

  tab: {
    flex: 1,
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabActive: {
    backgroundColor: colors.button_color,
    shadowColor: colors.button_color,
    shadowOpacity: 0.06,
    shadowRadius: moderateScale(6),
    elevation: 2,
  },

  tabText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#6B7280',
  },

  tabTextActive: {
    color: '#111827',
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border_Color,
    backgroundColor: colors.input_bg,
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(10),
    fontSize: moderateScale(16),
    marginBottom: verticalScale(10),
    color: colors.text_dark || '#111827',
  },

  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border_Color,
    backgroundColor: colors.input_bg,
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(10),
    paddingHorizontal: scale(10),
  },

  countryCode: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: colors.text_dark || '#111827',
    marginRight: scale(8),
  },

  countryDivider: {
    width: 1,
    height: '60%',
    backgroundColor: colors.border_Color,
    marginRight: scale(8),
  },

  phoneInput: {
    flex: 1,
    paddingVertical: verticalScale(14),
    fontSize: moderateScale(16),
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
    marginBottom: verticalScale(8),
  },

  otpBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border_Color,
    backgroundColor: colors.input_bg,
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
    top: verticalScale(10),
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },

  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: verticalScale(10),
    paddingVertical: verticalScale(4),
  },

  forgotPasswordText: {
    color: colors.button_color,
    fontWeight: '600',
    fontSize: moderateScale(14),
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

  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: verticalScale(10),
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },

  orText: {
    marginHorizontal: scale(12),
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: colors.text_light || '#6B7280',
  },

  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
    backgroundColor: '#fff',
    marginBottom: verticalScale(20),
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
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#111827',
  },
});

export default styles;
