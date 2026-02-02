import {StyleSheet} from 'react-native';
import {
  scale,
  verticalScale,
  moderateScale,
} from 'react-native-size-matters';

export default StyleSheet.create({
  scrollContainer: {
    padding: scale(16),
    paddingBottom: verticalScale(40),
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(12),
  },

  headerTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#111827',
  },

  skip: {
    fontSize: moderateScale(14),
    color: '#6B7280',
  },

  progressBar: {
    height: verticalScale(6),
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    marginBottom: verticalScale(8),
  },

  progressText: {
    fontSize: moderateScale(13),
    color: '#6B7280',
    marginBottom: verticalScale(16),
  },

  tabs: {
    flexDirection: 'row',
    marginBottom: verticalScale(16),
  },

  tab: {
    flex: 1,
    paddingVertical: verticalScale(12),
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
  },

  activeTab: {
    borderBottomColor: '#2563EB',
  },

  tabText: {
    textAlign: 'center',
    fontSize: moderateScale(14),
    color: '#6B7280',
    fontWeight: '600',
  },

  activeTabText: {
    color: '#2563EB',
  },

  infoBox: {
    backgroundColor: '#EFF6FF',
    padding: scale(14),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(16),
  },

  infoText: {
    fontSize: moderateScale(14),
    color: '#1E3A8A',
    lineHeight: 20,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: scale(16),
    marginBottom: verticalScale(16),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(12),
  },

  cardTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#111827',
  },

  status: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },

  statusText: {
    fontSize: moderateScale(12),
    color: '#374151',
  },

  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: moderateScale(12),
    alignItems: 'center',
    paddingVertical: verticalScale(20),
  },

  uploadIcon: {
    fontSize: moderateScale(26),
    marginBottom: verticalScale(8),
  },

  uploadText: {
    fontSize: moderateScale(15),
    fontWeight: '600',
    color: '#111827',
  },

  uploadSub: {
    fontSize: moderateScale(13),
    color: '#6B7280',
    marginTop: verticalScale(4),
  },

  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    marginBottom: verticalScale(16),
  },

  label: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginBottom: verticalScale(6),
    marginTop: verticalScale(12),
  },

  input: {
    height: verticalScale(48),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(12),
    fontSize: moderateScale(14),
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  half: {
    width: '48%',
  },

  bottom: {
    marginTop: verticalScale(20),
    alignItems: 'center',
  },

  disabledBtn: {
    width: '100%',
    height: verticalScale(52),
    borderRadius: moderateScale(14),
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },

  disabledText: {
    fontSize: moderateScale(16),
    color: '#9CA3AF',
    fontWeight: '600',
  },

  bottomText: {
    fontSize: moderateScale(13),
    color: '#6B7280',
    textAlign: 'center',
  },
  reviewHeader: {
  marginBottom: verticalScale(16),
},

reviewTitle: {
  fontSize: moderateScale(22),
  fontWeight: '700',
  color: '#111827',
  marginBottom: verticalScale(6),
},

reviewSub: {
  fontSize: moderateScale(14),
  color: '#6B7280',
  lineHeight: 20,
},

reviewRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: verticalScale(12),
},

checkIcon: {
  fontSize: moderateScale(16),
  color: '#16A34A',
  marginRight: scale(10),
},

reviewText: {
  fontSize: moderateScale(14),
  color: '#111827',
  fontWeight: '500',
},

timelineRow: {
  flexDirection: 'row',
  marginTop: verticalScale(16),
},

stepCircle: {
  width: scale(32),
  height: scale(32),
  borderRadius: 16,
  backgroundColor: '#EFF6FF',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: scale(12),
},

stepNumber: {
  fontSize: moderateScale(14),
  fontWeight: '700',
  color: '#2563EB',
},

stepContent: {
  flex: 1,
},

stepTitle: {
  fontSize: moderateScale(15),
  fontWeight: '600',
  color: '#111827',
},

stepDesc: {
  fontSize: moderateScale(13),
  color: '#6B7280',
  marginTop: verticalScale(4),
},

reviewFooter: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: verticalScale(24),
},

backBtn: {
  flex: 1,
  height: verticalScale(52),
  borderRadius: moderateScale(14),
  borderWidth: 1,
  borderColor: '#CBD5E1',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: scale(10),
},

backText: {
  fontSize: moderateScale(15),
  fontWeight: '600',
  color: '#374151',
},

submitBtn: {
  flex: 1,
  height: verticalScale(52),
  borderRadius: moderateScale(14),
  backgroundColor: '#2563EB',
  justifyContent: 'center',
  alignItems: 'center',
  marginLeft: scale(10),
},

submitText: {
  fontSize: moderateScale(15),
  fontWeight: '600',
  color: '#FFFFFF',
},

bottomFixed: {
  padding: scale(16),
  borderTopWidth: 1,
  borderTopColor: '#E5E7EB',
  backgroundColor: '#FFFFFF',
},

primaryBtn: {
  width: '100%',
  height: verticalScale(52),
  borderRadius: moderateScale(14),
  backgroundColor: '#2563EB',
  justifyContent: 'center',
  alignItems: 'center',
},

primaryText: {
  fontSize: moderateScale(16),
  fontWeight: '600',
  color: '#FFFFFF',
}
});
