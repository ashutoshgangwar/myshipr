import { StyleSheet } from 'react-native';
import { scale, verticalScale, moderateScale } from 'react-native-size-matters';
import { colors } from '../../theme/colors';


export default StyleSheet.create({
  container: {
    flex: 1,
    padding: scale(20),
    backgroundColor: colors.primary,
    justifyContent: 'center',
  },
   topSection: {
    alignItems: 'center',
    marginBottom: verticalScale(30),
  },

  image: {
    width: scale(260),
    height: verticalScale(80),
  },

  title: {
    fontSize: moderateScale(22),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: verticalScale(20),
  },

  toggle: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(20),
  },

  toggleBtn: {
    flex: 1,
    paddingVertical: verticalScale(12),
    alignItems: 'center',
  },

  activeToggle: {
    backgroundColor: colors.button_color,
    borderRadius: moderateScale(12),
  },

  text: {
    color: '#374151',
    fontWeight: '600',
  },

  activeText: {
    color: '#fff',
    fontWeight: '700',
  },

  input: {
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(14),
    marginBottom: verticalScale(16),
  },
});
