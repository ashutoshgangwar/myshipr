import { StyleSheet } from 'react-native';
import { moderateScale, verticalScale, scale } from 'react-native-size-matters';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },

  scroll: {
    paddingBottom: verticalScale(120),
  },

  /* Stepper */
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: verticalScale(16),
  },
  stepDone: {
    fontSize: moderateScale(12),
    color: '#10B981',
    fontWeight: '700',
  },
  stepActive: {
    fontSize: moderateScale(12),
    color: '#2563EB',
    fontWeight: '800',
  },
  stepLine: {
    width: scale(30),
    height: 2,
    backgroundColor: '#CBD5E1',
    marginHorizontal: scale(6),
  },

  /* Cards */
  card: {
    backgroundColor: '#FFF',
    marginHorizontal: moderateScale(16),
    marginBottom: verticalScale(16),
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardTitle: {
    fontSize: moderateScale(16),
    fontWeight: '800',
    marginBottom: verticalScale(12),
    color: '#111827',
  },

  /* Uploads */
  uploadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  uploadBox: {
    width: '30%',
    height: scale(90),
    backgroundColor: '#F1F5F9',
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIcon: {
    fontSize: moderateScale(26),
  },
  uploadLabel: {
    fontSize: moderateScale(11),
    marginTop: verticalScale(6),
    textAlign: 'center',
    color: '#374151',
  },

  /* Issues */
  issueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: verticalScale(14),
  },
  issueBox: {
    width: '48%',
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(12),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
  },
  issueDanger: {
    backgroundColor: '#FEE2E2',
  },
  issueText: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#1F2937',
  },

  /* POD */
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  infoLabel: {
    fontSize: moderateScale(12),
    color: '#6B7280',
  },
  infoValue: {
    fontSize: moderateScale(12),
    fontWeight: '700',
    color: '#111827',
  },
  podUpload: {
    marginTop: verticalScale(12),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  podText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: moderateScale(13),
  },

  /* Checklist */
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  checkbox: {
    width: scale(18),
    height: scale(18),
    borderRadius: scale(5),
    borderWidth: 2,
    borderColor: '#CBD5E1',
    marginRight: scale(10),
  },
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#111827',
  },

  /* Footer */
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: moderateScale(16),
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
  },
});
