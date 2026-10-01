import { Platform, StyleSheet } from 'react-native';
import { moderateScale, verticalScale, scale } from 'react-native-size-matters';
import {colors} from '../../theme/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  scroll: {
    paddingBottom: verticalScale(120),
  },

  /* ---------------- Stepper ---------------- */
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: verticalScale(18),
  },
  stepDone: {
    fontSize: moderateScale(12),
    color: colors.success,
    fontWeight: '700',
  },
    
  stepLine: {
    width: scale(28),
    height: 2,
    backgroundColor: colors.border_Color,
    marginHorizontal: scale(6),
  },

  /* ---------------- Cards ---------------- */
  card: {
    backgroundColor: colors.white,
    marginHorizontal: moderateScale(16),
    marginBottom: verticalScale(28),
    borderRadius: moderateScale(18),
    padding: moderateScale(18),
    elevation: 6,
    shadowColor: colors.textStrong,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  cardTitle: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    marginBottom: verticalScale(22),
    marginTop: verticalScale(4),
    color: colors.textStrong,
  },
   cardTitleCheck: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    marginBottom: verticalScale(22),
    marginTop: verticalScale(24),
    color: colors.textStrong,
  },

  /* ---------------- Upload ---------------- */
  uploadRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBox: {
    width: '100%',
    height: scale(260),
    backgroundColor: colors.white,
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderWidth: 1,
    borderColor: colors.white,
    shadowColor: colors.textStrong,
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    padding: moderateScale(8),
    overflow: 'hidden',
  },
  uploadPreview: {
    width: '100%',
    height: '100%',
    borderRadius: moderateScale(8),
    resizeMode: 'cover',
  },
  uploadPreviewWrap: {
    width: '100%',
    height: scale(240),
    borderRadius: moderateScale(8),
    overflow: 'hidden',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadLabel: {
    fontSize: moderateScale(13),
    marginTop: verticalScale(8),
    textAlign: 'center',
    color: colors.textStrong,
    fontWeight: '700',
  },

  /* ---------------- Issues ---------------- */
  issueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: verticalScale(16),
  },
  issueBox: {
    width: '48%',
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(14),
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  issueDanger: {
    backgroundColor: colors.red50,
  },
  issueText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: colors.textStrong,
  },

  /* ---------------- POD ---------------- */
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: verticalScale(10),
  },
  infoLabel: {
    fontSize: moderateScale(12),
    color: colors.textMuted,
    marginRight: scale(8),
  },
  infoValue: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: colors.textStrong,
    flex: 1,
    flexWrap: 'wrap',
    includeFontPadding: false,
    textAlign: 'right',
  },
  podUpload: {
    marginTop: verticalScale(16),
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(10),
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
  },
  podUploadAttached: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.white,
  },
  podTextDark: {
    color: colors.textStrong,
    fontWeight: '800',
    fontSize: moderateScale(13),
  },
  retakeText: {
    marginTop: verticalScale(8),
    color: colors.accentBlue,
    fontWeight: '700',
  },
  retakeButton: {
    marginTop: verticalScale(8),
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: colors.accentBlue,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeButtonText: {
    color: colors.accentBlue,
    fontWeight: '800',
    fontSize: moderateScale(13),
  },
  podText: {
    color: colors.white,
    fontWeight: '800',
    fontSize: moderateScale(13),
  },

  /* ---------------- Signature ---------------- */
  signaturePreview: {
    width: moderateScale(150),
    height: moderateScale(150),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: colors.border_Color,
  },
  signatureModalContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  signatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.screenBg,
  },
  signatureTitle: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: colors.textStrong,
  },
  signatureCanvasWrap: {
    flex: 1,
    padding: moderateScale(16),
    minHeight: verticalScale(320),
  },
  signatureFooter: {
    flexDirection: 'row',
    padding: moderateScale(12),
    borderTopWidth: 1,
    borderTopColor: colors.screenBg,
    backgroundColor: colors.white,
  },
  signatureButton: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(8),
    backgroundColor: colors.accentBlue,
  },
  signaturePreviewBorder: {
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: moderateScale(8),
    overflow: 'hidden',
  },

  /* ---------------- Checklist ---------------- */
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  checkbox: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(6),
    borderWidth: 2,
    borderColor: colors.border_Color,
    marginRight: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: colors.textStrong,
  },

footer: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  paddingHorizontal: moderateScale(16),
  paddingTop: verticalScale(10),
  paddingBottom: Platform.OS === 'ios' ? verticalScale(22) : verticalScale(22),
  backgroundColor: colors.white,
  borderTopWidth: 1,
  borderTopColor: colors.border_Color,
  alignItems: 'center',
  justifyContent: 'center',
  ...Platform.select({
    android: { elevation: 12 },
    ios: {
      shadowColor: colors.textStrong,
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: -4 },
    },
  }),
},


});
