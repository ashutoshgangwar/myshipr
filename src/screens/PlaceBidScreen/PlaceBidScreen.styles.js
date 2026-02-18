import { StyleSheet } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { colors } from '../../theme/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(12),
    backgroundColor: colors.primary,
  },

  backText: {
    color: '#fff',
    fontWeight: '600',
  },

  title: {
    color: '#fff',
    fontSize: moderateScale(16),
    fontWeight: '700',
  },

  headerSpacer: {
    width: moderateScale(40),
  },

  card: {
    backgroundColor: '#fff',
    margin: moderateScale(16),
    padding: moderateScale(16),
    borderRadius: moderateScale(14),
  },

  loadId: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#111827',
    marginBottom: verticalScale(6),
  },

  route: {
    fontSize: moderateScale(13),
    color: '#374151',
    marginBottom: verticalScale(6),
  },

  estimatedPay: {
    fontSize: moderateScale(13),
    color: '#16A34A',
    fontWeight: '600',
  },

  formCard: {
    backgroundColor: '#fff',
    marginHorizontal: moderateScale(16),
    padding: moderateScale(16),
    borderRadius: moderateScale(14),
  },

  label: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#111827',
    marginBottom: verticalScale(8),
  },

  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    fontSize: moderateScale(16),
    marginBottom: verticalScale(8),
  },

  note: {
    fontSize: moderateScale(12),
    color: '#6B7280',
    marginBottom: verticalScale(14),
  },

  submitBtn: {
    backgroundColor: colors.button_color,
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
    alignItems: 'center',
  },

  submitText: {
    color: '#fff',
    fontWeight: '700',
  },

  scrollContent: {
    flex: 1,
  },

  subText: {
    fontSize: moderateScale(13),
    color: '#6B7280',
    marginBottom: verticalScale(8),
  },

  locationInfo: {
    marginVertical: verticalScale(8),
  },

  location: {
    fontSize: moderateScale(13),
    color: '#374151',
    marginBottom: verticalScale(4),
  },

  bidsCard: {
    backgroundColor: '#fff',
    marginHorizontal: moderateScale(16),
    marginBottom: verticalScale(16),
    padding: moderateScale(16),
    borderRadius: moderateScale(14),
  },

  sectionTitle: {
    fontSize: moderateScale(15),
    fontWeight: '700',
    color: '#111827',
    marginBottom: verticalScale(12),
  },

  lowestBidHighlight: {
    backgroundColor: '#DBEAFE',
    padding: moderateScale(14),
    borderRadius: moderateScale(10),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
    borderWidth: 1,
    borderColor: '#3B82F6',
  },

  lowestBidLabel: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#1E40AF',
  },

  lowestBidAmount: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    color: '#1E40AF',
  },

  bidsList: {
    marginTop: verticalScale(8),
  },

  bidItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  bidderName: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#111827',
  },

  bidTime: {
    fontSize: moderateScale(12),
    color: '#9CA3AF',
    marginTop: verticalScale(2),
  },

  bidAmount: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#374151',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(8),
    paddingLeft: moderateScale(14),
  },

  currencySymbol: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#6B7280',
    marginRight: moderateScale(4),
  },

  input: {
    flex: 1,
    padding: moderateScale(14),
    fontSize: moderateScale(16),
    color: '#111827',
  },

  bidHint: {
    fontSize: moderateScale(13),
    color: '#2563EB',
    marginBottom: verticalScale(8),
    fontWeight: '500',
  },
});

export default styles;
