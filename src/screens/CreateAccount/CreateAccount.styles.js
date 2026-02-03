import {StyleSheet} from 'react-native';
import {scale, verticalScale, moderateScale} from 'react-native-size-matters';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  container: {
    padding: scale(15),
    backgroundColor: '#FFFFFF',
  },

  backText: {
    fontSize: moderateScale(14),
    color: '#2563EB',
    marginBottom: verticalScale(10),
  },

  title: {
    fontSize: moderateScale(26),
    fontWeight: '700',
    color: '#111827',
  },

  subtitle: {
    fontSize: moderateScale(14),
    color: '#6B7280',
    marginBottom: verticalScale(1),
  },

  label: {
    fontSize: moderateScale(14),
    color: '#111827',
    marginBottom: verticalScale(6),
    marginTop: verticalScale(14),
  },

  input: {
    height: verticalScale(48),
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(14),
    fontSize: moderateScale(14),
    color: '#111827',
  },

  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  countryCode: {
    height: verticalScale(48),
    width: scale(70),
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(10),
  },

  countryText: {
    fontSize: moderateScale(14),
    color: '#111827',
  },

  phoneInput: {
    flex: 1,
    height: verticalScale(48),
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: moderateScale(10),
    paddingHorizontal: scale(14),
    fontSize: moderateScale(14),
  },

  dropdown: {
    height: verticalScale(48),
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: moderateScale(10),
    justifyContent: 'center',
    paddingHorizontal: scale(14),
  },

  dropdownText: {
    fontSize: moderateScale(14),
    color: '#111827',
  },

  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: verticalScale(20),
  },

  checkbox: {
    height: scale(18),
    width: scale(18),
    borderWidth: 1,
    borderColor: '#9CA3AF',
    borderRadius: moderateScale(4),
    marginRight: scale(10),
  },

  termsText: {
    fontSize: moderateScale(13),
    color: '#374151',
    flex: 1,
  },

  button: {
    height: verticalScale(52),
    backgroundColor: '#2563EB',
    borderRadius: moderateScale(14),
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    fontSize: moderateScale(16),
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: scale(20),
  },

  modalTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    marginBottom: verticalScale(16),
  },

  stateItem: {
    paddingVertical: verticalScale(14),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  stateText: {
    fontSize: moderateScale(15),
    color: '#111827',
  },

  modalClose: {
    marginTop: verticalScale(20),
    height: verticalScale(48),
    backgroundColor: '#2563EB',
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalCloseText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
});
