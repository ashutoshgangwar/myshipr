import {StyleSheet} from 'react-native';
import {moderateScale, verticalScale} from 'react-native-size-matters';

import {colors} from '../../theme/colors';

export default StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(20),
  },

  modalCard: {
    maxHeight: '92%',
    borderRadius: moderateScale(20),
    backgroundColor: '#F8FAFC',
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
    backgroundColor: '#E2E8F0',
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(12),
    marginRight: moderateScale(12),
  },

  closeButtonText: {
    color: '#0F172A',
    fontWeight: '700',
  },

  headerTextWrap: {
    flex: 1,
  },

  title: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    color: '#0F172A',
  },

  subtitle: {
    marginTop: verticalScale(4),
    color: '#475569',
    lineHeight: moderateScale(20),
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
    elevation: 3,
  },

  label: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: verticalScale(8),
  },

  input: {
    height: verticalScale(48),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    fontSize: moderateScale(14),
    color: '#0F172A',
    marginBottom: verticalScale(16),
    backgroundColor: '#FFFFFF',
  },

  signatureBox: {
    height: verticalScale(280),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#FFFFFF',
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
    color: '#FFFFFF',
    fontWeight: '700',
  },

  previewCard: {
    marginTop: verticalScale(16),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(18),
    padding: moderateScale(16),
  },

  previewTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: verticalScale(10),
  },

  previewImage: {
    width: '100%',
    height: verticalScale(160),
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
  },
});
