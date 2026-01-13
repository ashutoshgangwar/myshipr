import { StyleSheet } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { colors } from '../../theme/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingHorizontal: scale(15),
    justifyContent: 'center',
  },

  topSection: {
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },

  image: {
    width: scale(260),
    height: scale(120),
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(18),
    padding: moderateScale(22),
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },

  title: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: verticalScale(6),
    color: colors.text_dark,
  },

  subtitle: {
    textAlign: 'center',
    fontSize: moderateScale(14),
    color: colors.text_light,
    marginBottom: verticalScale(24),
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border_Color,
    backgroundColor: colors.input_bg,
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(14),
    fontSize: moderateScale(16),
    marginBottom: verticalScale(16),
  },

  disabledInput: {
    backgroundColor: '#F3F4F6',
  },

  button: {
    backgroundColor: colors.button_color,
    paddingVertical: verticalScale(15),
    borderRadius: moderateScale(12),
    marginTop: verticalScale(6),
  },

  buttonText: {
    color: colors.text_color_button,
    textAlign: 'center',
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },

  resendText: {
    marginTop: verticalScale(18),
    textAlign: 'center',
    fontSize: moderateScale(13),
    color: colors.text_light,
  },

  resend: {
    color: colors.button_color,
    fontWeight: '700',
  },
  // OR divider
orContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginVertical: verticalScale(18),
},

line: {
  flex: 1,
  height: 1,
  backgroundColor: '#E5E7EB',
},

orText: {
  marginHorizontal: scale(10),
  fontSize: moderateScale(12),
  color: colors.text_light,
},

// Google button
googleButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1,
  borderColor: '#E5E7EB',
  paddingVertical: verticalScale(10),
  borderRadius: moderateScale(12),
  backgroundColor: '#fff',
},

googleIcon: {
  width: scale(30),
  height: scale(30),
  marginRight: verticalScale(10),
},

googleText: {
  fontSize: moderateScale(16),
  fontWeight: '600',
  color: '#111827',
},

});

export default styles;
