import { StyleSheet } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(16),
  },

  card: {
    width: '100%',
    maxWidth: moderateScale(380),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    paddingVertical: verticalScale(40),
    paddingHorizontal: moderateScale(24),
    alignItems: 'center',

    // iOS shadow
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(12),
    shadowOffset: { width: 0, height: 6 },

    // Android shadow
    elevation: 8,
  },

  title: {
    fontSize: moderateScale(26),
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: moderateScale(14),
    color: '#6B7280',
    marginTop: verticalScale(8),
    marginBottom: verticalScale(36),
    textAlign: 'center',
    lineHeight: verticalScale(20),
  },

  primaryButton: {
    width: '100%',
    backgroundColor: '#2563EB',
    paddingVertical: verticalScale(16),
    borderRadius: moderateScale(14),
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: '600',
  },

  footerText: {
    marginTop: verticalScale(24),
    fontSize: moderateScale(12),
    color: '#9CA3AF',
  },
});

export default styles;
