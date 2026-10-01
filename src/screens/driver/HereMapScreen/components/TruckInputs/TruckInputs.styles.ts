import {StyleSheet} from 'react-native';
import {
  moderateScale,
  verticalScale,
  scale,
} from 'react-native-size-matters';
import {colors} from '../../../../../theme/colors';
import {fontSize} from '../../../../../theme/fontSizes';

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
    backgroundColor: colors.border_Color,
  },

  title: {
    fontSize: fontSize.heading,
    fontWeight: '700',
    color: colors.textStrong,
    marginBottom: verticalScale(4),
  },

  subtitle: {
    fontSize: fontSize.subBody,
    color: colors.textMuted,
    marginBottom: verticalScale(20),
  },

  scrollContent: {
    paddingBottom: verticalScale(10),
  },

  field: {
    marginBottom: verticalScale(14),
  },

  label: {
    fontSize: fontSize.subBody,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: verticalScale(6),
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: moderateScale(14),
    backgroundColor: colors.white,
    paddingHorizontal: scale(14),
  },

  input: {
    flex: 1,
    color: colors.textStrong,
    fontSize: fontSize.body,
    paddingVertical: verticalScale(14),
  },

  unitText: {
    color: colors.textMuted,
    fontSize: fontSize.subBody,
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
    borderColor: colors.border_Color,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: scale(8),
  },

  cancelButtonText: {
    color: colors.textMuted,
    fontWeight: '600',
    fontSize: fontSize.body,
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
    fontSize: fontSize.body,
  },
});