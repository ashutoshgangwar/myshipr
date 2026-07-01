import {StyleSheet, Platform} from 'react-native';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';
import {colors} from '../../../theme/colors';
import {IS_TABLET, select} from '../../../theme/device';

const isIOS = Platform.OS === 'ios';

const makeStyles = (isTablet = IS_TABLET) => {
  const controlHeight = select({
    phone: verticalScale(48),
    tablet: moderateScale(50),
  });
  const fieldWidth = isTablet ? '100%' : isIOS ? '92%' : '100%';

  return StyleSheet.create({
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
      paddingHorizontal: isTablet
        ? moderateScale(24)
        : isIOS
        ? scale(3)
        : scale(16),
      paddingTop: verticalScale(-100),
      paddingBottom: isTablet
        ? verticalScale(28)
        : isIOS
        ? verticalScale(25)
        : verticalScale(20),
      marginBottom: verticalScale(20),
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
      minHeight: verticalScale(40),
      width: fieldWidth,
      alignSelf: 'center',
    },
    title: {
      fontSize: select({phone: moderateScale(30), tablet: moderateScale(26)}),
      textAlignVertical: 'center',
      textAlign: 'center',
      color: colors.white,
      fontWeight: '800',
      lineHeight: select({phone: moderateScale(38), tablet: moderateScale(34)}),
    },

    subtitle: {
      marginTop: verticalScale(10),
      color: colors.splashSubtitle,
      fontSize: select({phone: moderateScale(14), tablet: moderateScale(15)}),
      fontWeight: '400',
      lineHeight: moderateScale(20),
      width: fieldWidth,
      alignSelf: 'center',
      textAlign: 'center',
    },

    subtitle_line2: {
      marginTop: verticalScale(1),
      color: colors.splashSubtitle,
      fontSize: select({phone: moderateScale(14), tablet: moderateScale(15)}),
      fontWeight: '400',
      width: fieldWidth,
      alignSelf: 'center',
      textAlign: 'center',
      marginBottom: isIOS ? verticalScale(20) : verticalScale(28),
    },

    faceIdButton: {
      height: controlHeight,
      width: fieldWidth,
      alignSelf: 'center',
      marginBottom: verticalScale(14),
    },

    faceIdButtonText: {
      fontSize: select({phone: moderateScale(15), tablet: moderateScale(16)}),
      fontWeight: '700',
    },

    credentialsButton: {
      height: controlHeight,
      width: fieldWidth,
      alignSelf: 'center',
    },

    credentialsButtonText: {
      fontSize: select({phone: moderateScale(15), tablet: moderateScale(16)}),
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
};

export default makeStyles;
