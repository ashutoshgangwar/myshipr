import {StyleSheet, Platform} from 'react-native';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';
import {colors} from '../../../theme/colors';

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

  heroWrap: {
    position: 'relative',
    height: verticalScale(450),
  },

  heroPager: {
    width: '100%',
  },

  heroImage: {
    height: verticalScale(450),
    borderTopLeftRadius: moderateScale(34),
    borderTopRightRadius: moderateScale(34),
    overflow: 'hidden',
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
    height: verticalScale(100),
  },
  buttonWraper: {
    padding: moderateScale(1),
  },

  contentWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    marginTop: verticalScale(15),
    paddingHorizontal: Platform.OS === 'ios' ? scale(3) : scale(16),
    paddingTop: verticalScale(-100),
    paddingBottom: Platform.OS === 'ios' ? verticalScale(25) : verticalScale(20),
    marginBottom: Platform.OS === 'ios' ? verticalScale(20) : verticalScale(20),
  },

  dotsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: verticalScale(18),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  dot: {
    width: scale(8),
    height: scale(8),
    borderRadius: moderateScale(99),
    backgroundColor: colors.onDarkLow,
  },

  dotTapArea: {
    paddingHorizontal: scale(5),
    paddingVertical: verticalScale(6),
    justifyContent: 'center',
    alignItems: 'center',
  },

  activeDot: {
    width: scale(15),
    height: scale(8),
    borderRadius: moderateScale(99),
    backgroundColor: colors.white,
  },

  contentText: {
    minHeight: verticalScale(96),
    width: Platform.OS === 'ios' ? '92%' : '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: moderateScale(36),
    color: colors.white,
    fontWeight: '400',
    lineHeight: moderateScale(48),
    textAlign: 'left',
  },

  subtitle: {
    marginTop: verticalScale(1),
    color: colors.splashSubtitle,
    fontSize: moderateScale(14),
    fontWeight: '400',
    lineHeight: moderateScale(20),
    width: Platform.OS === 'ios' ? '92%' : '100%',
    alignSelf: 'center',
    textAlign: 'left',
    marginBottom: Platform.OS === 'ios' ? verticalScale(10) : verticalScale(20),
  },

  loginButton: {
    height: verticalScale(48),
    width: Platform.OS === 'ios' ? '92%' : '100%',
    alignSelf: 'center',
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(1),
    borderColor: colors.splashBorder,
    backgroundColor: colors.white,
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
    width: Platform.OS === 'ios' ? '92%' : '100%',
    alignSelf: 'center',
    borderRadius: moderateScale(12),
    borderWidth: moderateScale(1),
    borderColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center', 
  },

  signupButtonText: {
    color: colors.white,
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
