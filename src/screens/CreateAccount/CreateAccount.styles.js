import {StyleSheet} from 'react-native';
import {scale, verticalScale, moderateScale} from 'react-native-size-matters';
import {colors} from '../../theme/colors';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  container: {
    paddingHorizontal: scale(18),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(30),
    backgroundColor: colors.primary,
  },

  backText: {
    fontSize: moderateScale(14),
    color: colors.muted,
    marginBottom: verticalScale(10),
  },

  title: {
    fontSize: moderateScale(28),
    fontWeight: '800',
    color: colors.white,
  },

  subtitle: {
    fontSize: moderateScale(15),
    color: colors.white,
    marginBottom: verticalScale(16),
  },

  helperText: {
    fontSize: moderateScale(13),
    color: colors.muted,
    marginTop: verticalScale(6),
  },

  formCard: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    padding: scale(15),
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
    elevation: 4,
  },

  inputGroup: {
    marginBottom: verticalScale(5),
  },

  label: {
    fontSize: moderateScale(15),
    color: colors.text_dark,
    marginBottom: verticalScale(6),
    fontWeight: '600',
  },

  input: {
    height: verticalScale(45),
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(12),
    fontSize: moderateScale(12),
    color: colors.text_dark,
    backgroundColor: colors.input_bg,
  },

  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  countryCode: {
    height: verticalScale(48),
    width: scale(70),
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(10),
    backgroundColor: colors.input_bg,
  },

  countryText: {
    fontSize: moderateScale(12),
    color: colors.text_dark,
    fontWeight: '600',
  },

  phoneInput: {
    flex: 1,
  },

  dropdown: {
    height: verticalScale(48),
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    paddingHorizontal: scale(14),
    backgroundColor: colors.input_bg,
  },

  dropdownWrapper: {
    position: 'relative',
    zIndex: 10,
  },

  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  dropdownText: {
    fontSize: moderateScale(14),
    color: colors.text_dark,
  },

  dropdownPlaceholder: {
    color: colors.placeholder,
  },

  dropdownChevron: {
    fontSize: moderateScale(12),
    color: colors.text_light,
    marginLeft: scale(10),
  },

  dropdownMenu: {
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: moderateScale(12),
    backgroundColor: colors.white,
    overflow: 'hidden',
    position: 'absolute',
    top: verticalScale(54),
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  dropdownItem: {
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(14),
    borderBottomWidth: 1,
    borderBottomColor: colors.border_Color,
  },

  dropdownItemText: {
    fontSize: moderateScale(14),
    color: colors.text_dark,
  },

  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(8),
    marginBottom: verticalScale(6),
  },

  checkbox: {
    height: scale(20),
    width: scale(20),
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: moderateScale(6),
    marginRight: scale(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },

  checkboxChecked: {
    backgroundColor: colors.button_color,
    borderColor: colors.button_color,
  },

  checkboxTick: {
    color: colors.text_color,
    fontSize: moderateScale(12),
    fontWeight: '700',
    lineHeight: moderateScale(12),
  },

  termsText: {
    fontSize: moderateScale(12.5),
    color: colors.text_light,
    flex: 1,
  },

  buttonWrap: {
    marginTop: verticalScale(14),
  },

  button: {
    height: verticalScale(52),
    backgroundColor: colors.button_color,
    borderRadius: moderateScale(14),
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    fontSize: moderateScale(16),
    color: colors.text_color_button,
    fontWeight: '600',
  },
});
