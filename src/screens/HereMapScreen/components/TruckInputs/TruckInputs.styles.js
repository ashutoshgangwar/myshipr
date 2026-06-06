import {StyleSheet} from 'react-native';
import {
  moderateScale,
  verticalScale,
  scale,
} from 'react-native-size-matters';
import {colors} from '../../../../theme/colors';

export default StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    padding: moderateScale(20),
    maxHeight: '85%',
  },

  handle: {
    width: scale(48),
    height: verticalScale(5),
    borderRadius: moderateScale(20),
    alignSelf: 'center',
    marginBottom: verticalScale(16),
    backgroundColor: '#D1D5DB',
  },

  title: {
    fontSize: moderateScale(22),
    fontWeight: '700',
    color: '#111827',
    marginBottom: verticalScale(4),
  },

  subtitle: {
    fontSize: moderateScale(13),
    color: '#6B7280',
    marginBottom: verticalScale(20),
  },

  scrollContent: {
    paddingBottom: verticalScale(10),
  },

  field: {
    marginBottom: verticalScale(14),
  },

  label: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#374151',
    marginBottom: verticalScale(6),
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: moderateScale(14),
    backgroundColor: '#F9FAFB',
    paddingHorizontal: scale(14),
  },

  input: {
    flex: 1,
    color: '#111827',
    fontSize: moderateScale(15),
    paddingVertical: verticalScale(14),
  },

  unitText: {
    color: '#6B7280',
    fontSize: moderateScale(13),
    fontWeight: '600',
  },

  buttonRow: {
    flexDirection: 'row',
    marginTop: verticalScale(20),
  },

  cancelButton: {
    flex: 1,
    height: verticalScale(48),
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(8),
  },

  cancelButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: moderateScale(14),
  },

  applyButton: {
    flex: 1,
    height: verticalScale(48),
    borderRadius: moderateScale(14),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: scale(8),
  },

  applyButtonDisabled: {
    opacity: 0.7,
  },

  applyButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: moderateScale(14),
  },
});