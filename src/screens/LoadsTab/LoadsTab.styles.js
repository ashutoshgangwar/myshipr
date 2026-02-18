import { StyleSheet } from 'react-native';
import {
  moderateScale,
  verticalScale,
  scale,
} from 'react-native-size-matters';
import { colors } from '../../theme/colors';

export default StyleSheet.create({
   safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(12),
  },

  title: {
    fontSize: moderateScale(22),
    fontWeight: '700',
    marginBottom: verticalScale(14),
    color: '#0F172A',
  },

  /* Tabs */
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: verticalScale(16),
    gap: scale(6),
  },

  tab: {
    flex: 1,
    height: verticalScale(42),
    borderRadius: moderateScale(10),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  activeTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  tabText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#64748B',
  },

  activeTabText: {
    color: '#FFFFFF',
    fontSize: moderateScale(11),
  },

  /* Card */
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    padding: scale(16),
    marginBottom: verticalScale(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  loadId: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    color: '#0F172A',
  },

  statusBadge: {
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
  },

  statusText: {
    fontSize: moderateScale(11),
    fontWeight: '700',
    color: '#FFFFFF',
  },

  statusPending: {
    backgroundColor: '#8B5CF6',
  },

  statusAvailable: {
    backgroundColor: '#1E5BFF',
  },

  statusActive: {
    backgroundColor: '#F97316',
  },

  statusCompleted: {
    backgroundColor: '#16A34A',
  },

  subText: {
    marginTop: verticalScale(6),
    fontSize: moderateScale(13),
    color: '#64748B',
  },

  locationRow: {
    marginTop: verticalScale(12),
  },

  location: {
    fontSize: moderateScale(14),
    marginBottom: verticalScale(4),
    color: '#0F172A',
  },

  footerRow: {
    marginTop: verticalScale(14),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  estimate: {
    fontSize: moderateScale(12),
    color: '#64748B',
  },

  pay: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#16A34A',
  },

  acceptButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(10),
  },

  acceptText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },

  bidButton: {
    backgroundColor: '#1E5BFF',
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(10),
  },

  bidText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },

  trackButton: {
    backgroundColor: '#F97316',
    paddingHorizontal: scale(18),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(10),
  },

  trackText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },

  completedText: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#16A34A',
  },

  emptyText: {
    textAlign: 'center',
    marginTop: verticalScale(40),
    fontSize: moderateScale(14),
    color: '#64748B',
  },
});
