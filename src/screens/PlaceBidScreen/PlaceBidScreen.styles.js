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
});

export default styles;
