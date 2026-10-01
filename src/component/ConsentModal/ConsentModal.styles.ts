import {StyleSheet} from 'react-native';
import {verticalScale, moderateScale} from 'react-native-size-matters';
import {colors} from '../../theme/colors';

export default StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.blackAlpha45,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalCard: {
    width: '90%',
    backgroundColor: colors.white,
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
  },

  title: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    marginBottom: verticalScale(10),
    color: colors.textStrong,
  },

  description: {
    fontSize: moderateScale(14),
    color: colors.textMuted,
    lineHeight: moderateScale(20),
    marginBottom: verticalScale(18),
  },

  /* ✅ Checkbox */
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(22),
  },

  checkbox: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },

  checkboxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  tick: {
    color: colors.white,
    fontSize: moderateScale(16),
    fontWeight: '800',
    lineHeight: moderateScale(18),
  },

  checkboxText: {
    flex: 1,
    fontSize: moderateScale(14),
    color: colors.textStrong,
  },

  /* Buttons */
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  button: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(18),
    borderRadius: moderateScale(10),
    marginLeft: moderateScale(10),
  },

  cancelBtn: {
    backgroundColor: colors.border_Color,
  },

  agreeBtn: {
    backgroundColor: colors.primary,
  },

  disabledBtn: {
    backgroundColor: colors.textMuted,
  },

  cancelText: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: moderateScale(14),
  },

  agreeText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
});
