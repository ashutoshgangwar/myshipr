import { StyleSheet } from 'react-native';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';
import {colors} from '../../theme/colors';
import typography from '../../theme/typography';

export default StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.splashBackground,
  },

  safeArea: {
    flex: 1,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingVertical: verticalScale(14),
  
  },

  container: {
    minHeight: '100%',
    backgroundColor: colors.splashBackground,
    overflow: 'hidden',
  },

  heroPager: {
    width: '100%',
  },

  heroImage: {
    height: verticalScale(350),
  },

  heroImageStyle: {
    borderTopLeftRadius: moderateScale(34),
    borderTopRightRadius: moderateScale(34),
  },

  heroBottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: verticalScale(120),
  },

  contentWrapper: {
    flex: 1,
    marginTop: -verticalScale(20),
    paddingHorizontal: scale(22),
    paddingTop: verticalScale(10),
    paddingBottom: verticalScale(16),
  },
  

  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: verticalScale(16),
  },

  dot: {
    width: scale(8),
    height: scale(8),
    borderRadius: 99,
    backgroundColor: colors.onDarkLow,
    alignContent: 'center',
  },

  dotTapArea: {
    marginHorizontal: scale(4),
    paddingVertical: verticalScale(4),
  },

  activeDot: {
    width: scale(24),
    backgroundColor: colors.white,
  },
  contentText: {
    minHeight: verticalScale(96),
    width: scale(272),
  },
  title: {
    fontSize: moderateScale(typography.heading1),
    color: colors.splashTitle,
    fontWeight: '400',
        lineHeight: moderateScale(48),
  },

  subtitle: {
    marginTop: verticalScale(1),
    color: colors.splashSubtitle,
    fontSize: moderateScale(typography.paragraph),
    fontWeight: '400',
    lineHeight: moderateScale(20),
    maxWidth: '94%',
    marginBottom: verticalScale(30),
  },

  loginButton: {
    height: verticalScale(48),
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(1),
    borderColor: colors.splashBorder,
    backgroundColor: colors.splashText,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(14),
  },

  loginButtonText: {
    color: colors.splashBorder,
    fontSize: moderateScale(14),
    fontWeight: '800',
  },

  signupButton: {
    height: verticalScale(48),
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(1),
    borderColor: colors.splashText,
    justifyContent: 'center',
    alignItems: 'center', 
  },

  signupButtonText: {
    color: colors.splashText,
    fontSize: moderateScale(24 / 2),
    fontWeight: '700',
  },

  homeIndicator: {
    width: scale(90),
    height: verticalScale(5),
    borderRadius: 99,
    backgroundColor: colors.onDarkHigh,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: verticalScale(2),
  },
});
