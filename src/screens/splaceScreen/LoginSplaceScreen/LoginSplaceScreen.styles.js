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

  heroPager: {
    width: '100%',
  },

  heroImage: {
    height: verticalScale(350),
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
    height: verticalScale(120),
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: verticalScale(18),
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
    width: scale(24),
    height: scale(8),
    borderRadius: moderateScale(99),
    backgroundColor: colors.white,
  },

  contentText: {
    minHeight: verticalScale(60),
    width: Platform.OS === 'ios' ? '92%' : '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: moderateScale(30),
    textAlignVertical: 'center',
    textAlign: 'center',
    color: colors.white,
    fontWeight: '800',
    lineHeight: moderateScale(38),
  },

  subtitle: {
    marginTop: verticalScale(10),
    color: colors.splashSubtitle,
    fontSize: moderateScale(14),
    fontWeight: '400',
    lineHeight: moderateScale(20),
    width: Platform.OS === 'ios' ? '92%' : '100%',
    alignSelf: 'center',
    textAlign: 'center',
    // marginBottom: Platform.OS === 'ios' ? verticalScale(20) : verticalScale(28),
  },

  subtitle_line2: {
    marginTop: verticalScale(1),
    color: colors.splashSubtitle,
    fontSize: moderateScale(14),
    fontWeight: '400',
    width: Platform.OS === 'ios' ? '92%' : '100%',
    alignSelf: 'center',
    textAlign: 'center',
    marginBottom: Platform.OS === 'ios' ? verticalScale(20) : verticalScale(28),
  },

  faceIdButton: {
    height: verticalScale(48),
    width: Platform.OS === 'ios' ? '92%' : '100%',
    alignSelf: 'center',
    marginBottom: verticalScale(14),
  },

  faceIdButtonText: {
    fontSize: moderateScale(15),
    fontWeight: '700',
  },

  credentialsButton: {
    height: verticalScale(48),
    width: Platform.OS === 'ios' ? '92%' : '100%',
    alignSelf: 'center',
  },

  credentialsButtonText: {
    fontSize: moderateScale(15),
    fontWeight: '600',
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
