import { Platform, StyleSheet } from 'react-native';
import { moderateScale, verticalScale, scale } from 'react-native-size-matters';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    color: '#22C55E',
    fontWeight: '700',
  },
    
  stepLine: {
    width: scale(28),
    height: 2,
    backgroundColor: '#CBD5E1',
    marginHorizontal: scale(6),
  },

  /* ---------------- Cards ---------------- */
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: moderateScale(16),
    marginBottom: verticalScale(28),
    borderRadius: moderateScale(18),
    padding: moderateScale(18),
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  cardTitle: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    marginBottom: verticalScale(22),
    marginTop: verticalScale(4),
    color: '#0F172A',
  },
   cardTitleCheck: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    marginBottom: verticalScale(22),
    marginTop: verticalScale(24),
    color: '#0F172A',
  },

  /* ---------------- Upload ---------------- */
  uploadRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBox: {
    width: '100%',
    height: scale(260),
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderWidth: 1,
    borderColor: '#E6EEF9',
    shadowColor: '#0F172A',
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
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadLabel: {
    fontSize: moderateScale(13),
    marginTop: verticalScale(8),
    textAlign: 'center',
    color: '#1F2937',
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
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
  },
  issueDanger: {
    backgroundColor: '#FEE2E2',
  },
  issueText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#1E293B',
  },

  /* ---------------- POD ---------------- */
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(10),
  },
  infoLabel: {
    fontSize: moderateScale(12),
    color: '#64748B',
  },
  infoValue: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#0F172A',
  },
  podUpload: {
    marginTop: verticalScale(16),
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(10),
    backgroundColor: '#0B71FF',
    alignItems: 'center',
  },
  podUploadAttached: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EEF9',
  },
  podTextDark: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: moderateScale(13),
  },
  retakeText: {
    marginTop: verticalScale(8),
    color: '#0B71FF',
    fontWeight: '700',
  },
  retakeButton: {
    marginTop: verticalScale(8),
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#0B71FF',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retakeButtonText: {
    color: '#0B71FF',
    fontWeight: '800',
    fontSize: moderateScale(13),
  },
  podText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: moderateScale(13),
  },

  /* ---------------- Signature ---------------- */
  signaturePreview: {
    width: moderateScale(150),
    height: moderateScale(150),
    borderRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  signatureModalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  signatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  signatureTitle: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    color: '#0F172A',
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
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  signatureButton: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(8),
    backgroundColor: '#0B71FF',
  },
  signaturePreviewBorder: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    borderColor: '#CBD5E1',
    marginRight: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#0B1724',
  },

footer: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  paddingHorizontal: moderateScale(16),
  paddingTop: verticalScale(10),
  paddingBottom: Platform.OS === 'ios' ? verticalScale(22) : verticalScale(22),
  backgroundColor: '#FFFFFF',
  borderTopWidth: 1,
  borderTopColor: '#E5E7EB',
  alignItems: 'center',
  justifyContent: 'center',
  ...Platform.select({
    android: { elevation: 12 },
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: -4 },
    },
  }),
},


});
