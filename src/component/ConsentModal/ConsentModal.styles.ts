import {StyleSheet} from 'react-native';
import {verticalScale, moderateScale} from 'react-native-size-matters';
import {colors} from '../../theme/colors';

export default StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalCard: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: moderateScale(20),
    padding: moderateScale(20),
  },

  title: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    marginBottom: verticalScale(10),
    color: '#212529',
  },

  description: {
    fontSize: moderateScale(14),
    color: '#495057',
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
    borderColor: '#ADB5BD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },

  checkboxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  tick: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontWeight: '800',
    lineHeight: moderateScale(18),
  },

  checkboxText: {
    flex: 1,
    fontSize: moderateScale(14),
    color: '#212529',
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
    backgroundColor: '#E9ECEF',
  },

  agreeBtn: {
    backgroundColor: colors.primary,
  },

  disabledBtn: {
    backgroundColor: '#ADB5BD',
  },

  cancelText: {
    color: '#495057',
    fontWeight: '600',
    fontSize: moderateScale(14),
  },

  agreeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: moderateScale(14),
  },
});
