import { StyleSheet } from 'react-native';
import {
  scale,
  verticalScale,
  moderateScale,
} from 'react-native-size-matters';
import { colors } from '../../theme/colors';

export default StyleSheet.create({
scrollContainer: {
  flexGrow: 1,
  justifyContent: 'center',
   backgroundColor: colors.primary,
  paddingVertical: verticalScale(20),
     paddingHorizontal: scale(20),
},


  iconWrapper: {
    height: scale(90),
    width: scale(90),
    borderRadius: scale(45),
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(24),
  },

  truckIcon: {
    fontSize: moderateScale(36),
  },

  title: {
    fontSize: moderateScale(30),
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: verticalScale(1),
  },

  subtitle: {
    fontSize: moderateScale(16),
    color: '#E5EDFF',
    textAlign: 'center',
    lineHeight: moderateScale(24),
    marginBottom: verticalScale(20),
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: moderateScale(20),
    padding: scale(20),
    marginBottom: verticalScale(40),
  },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: verticalScale(20),
  },

  check: {
    fontSize: moderateScale(22),
    color: '#FFFFFF',
    marginRight: scale(14),
  },

  stepTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#FFFFFF',
  },

  stepSub: {
    fontSize: moderateScale(14),
    color: '#DDE7FF',
    marginTop: verticalScale(4),
  },

  button: {
    height: verticalScale(56),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(16),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(16),
  },

  buttonText: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#1E5BEE',
  },

  footerText: {
    fontSize: moderateScale(14),
    color: '#E5EDFF',
    textAlign: 'center',
    marginTop: verticalScale(8),   
  },
});
