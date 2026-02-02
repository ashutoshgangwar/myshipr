import { StyleSheet } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { colors } from '../../theme/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white || '#0F172A',
  },

  header: {
    backgroundColor: colors.primary || '#2563EB',
    padding: moderateScale(20),
    alignItems: 'center',
    borderBottomLeftRadius: moderateScale(25),
    borderBottomRightRadius: moderateScale(25),
  },

  avatar: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    backgroundColor: colors.gray200 || '#E5E7EB',
    marginBottom: verticalScale(10),
  },

  name: {
    color: colors.white || '#fff',
    fontSize: moderateScale(22),
    fontWeight: '700',
  },

  subTitle: {
    color: colors.lightBlue || '#E0E7FF',
    fontSize: moderateScale(14),
    marginTop: verticalScale(4),
  },

  badgeRow: {
    flexDirection: 'row',
    marginTop: verticalScale(10),
    gap: moderateScale(10),
  },

  verifiedBadge: {
    backgroundColor: colors.success || '#22C55E',
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(20),
  },

  ratingBadge: {
    backgroundColor: colors.warning || '#FACC15',
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(20),
  },

  badgeText: {
    color: colors.black || '#000',
    fontWeight: '600',
    fontSize: moderateScale(12),
  },

  card: {
    backgroundColor: colors.white || '#fff',
    margin: moderateScale(16),
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
  },

  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(16),
  },

  statBox: {
    width: '48%',
  },

  statTitle: {
    fontSize: moderateScale(22),
    fontWeight: '700',
    color: colors.darkBlue || '#0F172A',
  },

  statSub: {
    fontSize: moderateScale(13),
    color: colors.gray500 || '#64748B',
  },

  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    marginBottom: verticalScale(12),
  },

  docRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    borderBottomWidth: 0.5,
    borderColor: colors.gray200 || '#E5E7EB',
  },

  docTitle: {
    fontSize: moderateScale(15),
    fontWeight: '600',
  },

  docSub: {
    fontSize: moderateScale(12),
    color: colors.gray600 || '#6B7280',
  },

  statusBadge: {
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(20),
  },

  verified: {
    backgroundColor: colors.success || '#22C55E',
  },

  pending: {
    backgroundColor: colors.warningLight || '#FDE68A',
  },

  statusText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
  },

  vehicleTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },

  vehicleSub: {
    fontSize: moderateScale(13),
    color: colors.gray600 || '#6B7280',
    marginTop: verticalScale(4),
  },
});

export default styles;
