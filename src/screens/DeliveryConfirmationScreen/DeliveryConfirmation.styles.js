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
  stepActive: {
    fontSize: moderateScale(13),
    color: '#2563EB',
    fontWeight: '800',
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
    marginBottom: verticalScale(18),
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
    marginBottom: verticalScale(14),
    color: '#0F172A',
  },

  /* ---------------- Upload ---------------- */
  uploadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  uploadBox: {
    width: '31%',
    height: scale(95),
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  uploadIcon: {
    fontSize: moderateScale(28),
  },
  uploadLabel: {
    fontSize: moderateScale(11),
    marginTop: verticalScale(6),
    textAlign: 'center',
    color: '#334155',
    fontWeight: '600',
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
    borderRadius: moderateScale(14),
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  podText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: moderateScale(13),
  },

  /* ---------------- Checklist ---------------- */
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  checkbox: {
    width: scale(20),
    height: scale(20),
    borderRadius: scale(6),
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginRight: scale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  checkText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#0F172A',
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
