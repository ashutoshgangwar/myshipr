import {StyleSheet} from 'react-native';
import {moderateScale, verticalScale} from 'react-native-size-matters';

import {colors} from '../../theme/colors';

export default StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.blackAlpha45,
    justifyContent: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(20),
  },

  modalCard: {
    maxHeight: '92%',
    borderRadius: moderateScale(20),
    backgroundColor: colors.white,
    overflow: 'hidden',
  },

  keyboardWrap: {
    flex: 1,
  },

  keyboardWrapModal: {
    flex: 0,
  },

  content: {
    paddingHorizontal: moderateScale(16),
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(24),
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: verticalScale(16),
  },

  closeButton: {
    backgroundColor: colors.border_Color,
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(12),
    marginRight: moderateScale(12),
  },

  closeButtonText: {
    color: colors.textStrong,
    fontWeight: '700',
  },

  headerTextWrap: {
    flex: 1,
  },

  title: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    color: colors.textStrong,
  },

  subtitle: {
    marginTop: verticalScale(4),
    color: colors.textMuted,
    lineHeight: moderateScale(20),
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    shadowColor: colors.textStrong,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
    elevation: 3,
  },

  label: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: colors.textStrong,
    marginBottom: verticalScale(8),
  },

  input: {
    height: verticalScale(48),
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    fontSize: moderateScale(14),
    color: colors.textStrong,
    marginBottom: verticalScale(16),
    backgroundColor: colors.white,
  },

  signatureBox: {
    height: verticalScale(280),
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    backgroundColor: colors.white,
  },


  buttonRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginTop: verticalScale(10),

  },

  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(13),
    alignItems: 'center',
    backgroundColor: colors.white,
  },

  secondaryButtonText: {
    color: colors.primary,
    fontWeight: '700',
  },

  primaryButton: {
    flex: 1,
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(13),
    alignItems: 'center',
    backgroundColor: colors.primary,
  },

  primaryButtonDisabled: {
    opacity: 0.7,
  },

  primaryButtonText: {
    color: colors.white,
    fontWeight: '700',
  },

  previewCard: {
    marginTop: verticalScale(16),
    backgroundColor: colors.white,
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
  },

  previewTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: colors.textStrong,
    marginBottom: verticalScale(10),
  },

  previewImage: {
    width: '100%',
    height: verticalScale(160),
    backgroundColor: colors.white,
    borderRadius: moderateScale(12),
  },
});
