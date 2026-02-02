import { StyleSheet } from 'react-native';
import {
  scale,
  verticalScale,
  moderateScale,
} from 'react-native-size-matters';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    padding: scale(16),
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(20),
    padding: scale(24),
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },

  backText: {
    fontSize: moderateScale(14),
    color: '#2563EB',
    marginBottom: verticalScale(20),
  },

  iconCircle: {
    alignSelf: 'center',
    height: scale(70),
    width: scale(70),
    borderRadius: scale(35),
    backgroundColor: '#E0EDFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(20),
  },

  lockIcon: {
    fontSize: moderateScale(26),
  },

  title: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    textAlign: 'center',
    color: '#111827',
  },

  subtitle: {
    fontSize: moderateScale(14),
    color: '#6B7280',
    textAlign: 'center',
    marginTop: verticalScale(8),
  },

  phoneText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginTop: verticalScale(4),
  },

  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: verticalScale(30),
  },

  otpBox: {
    height: scale(48),
    width: scale(48),
    borderRadius: moderateScale(12),
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    textAlign: 'center',
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#111827',
  },

  button: {
    height: verticalScale(52),
    backgroundColor: '#2563EB',
    borderRadius: moderateScale(14),
    justifyContent: 'center',
    alignItems: 'center',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: '600',
  },

  resendText: {
    textAlign: 'center',
    marginTop: verticalScale(20),
    fontSize: moderateScale(14),
    color: '#6B7280',
  },

  resendLink: {
    color: '#2563EB',
    fontWeight: '600',
  },
});
