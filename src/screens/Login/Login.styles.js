import {StyleSheet, Platform, Dimensions} from 'react-native';
import {scale, verticalScale, moderateScale} from 'react-native-size-matters';
import {colors} from '../../theme/colors';

const isIOS = Platform.OS === 'ios';

const makeStyles = (isTablet = false) => {
  const contentMaxWidth = isTablet ? scale(460) : '100%';
  const {height: windowHeight} = Dimensions.get('window');
  const heroHeight = isTablet ? windowHeight * 0.35 : windowHeight * 0.40;
  const buttonPaddingV = isTablet ? verticalScale(6) : verticalScale(12);
  const buttonRadius = moderateScale(10);

  return StyleSheet.create({
    keyboardAvoiding: {
      flex: 1,
      backgroundColor: colors.white,
    },

    safe: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    container: {
      flexGrow: 1,
      justifyContent: 'flex-start',
      minHeight: '100%',
      backgroundColor: colors.white,
    },

    screenShell: {
      width: '100%',
      minHeight: '100%',
      flexGrow: 1,
      marginTop: 0,
      backgroundColor: colors.white,
    },

    heroSection: {
      width: '100%',
      height: heroHeight,
      backgroundColor: colors.primary,
      overflow: 'hidden',
    },

    heroBackground: {
      ...StyleSheet.absoluteFillObject,
      width: '100%',
      height: '100%',
    },

    heroOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      paddingHorizontal: -scale(10),
      paddingBottom: isIOS ? verticalScale(20) : verticalScale(15),
    },

    heroContent: {
      justifyContent: 'flex-end',
      width: '100%',
      maxWidth: contentMaxWidth,
      alignSelf: 'center',
      paddingHorizontal: isTablet ? scale(24) : 0,
      marginLeft: isTablet ? 0 : scale(20),
      marginBottom: isIOS ? verticalScale(20) : verticalScale(15),
    },

    card: {
      backgroundColor: colors.white,
      width: '100%',
      maxWidth: contentMaxWidth,
      alignSelf: 'center',
      flex: isTablet ? 1 : undefined,
      marginTop: isIOS ? -verticalScale(40) : -verticalScale(24),
      marginBottom: 0,
      borderTopLeftRadius: isIOS ? moderateScale(15) : moderateScale(20),
      borderTopRightRadius: isIOS ? moderateScale(15) : moderateScale(20),
      paddingHorizontal: isTablet ? scale(28) : isIOS ? scale(20) : scale(24),
      paddingTop: isIOS ? verticalScale(26) : verticalScale(28),
      paddingBottom: isIOS ? verticalScale(30) : verticalScale(30),
      shadowColor: '#000',
      shadowOffset: {width: 0, height: isIOS ? 6 : 4},
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },

    title: {
      fontSize: isTablet ? moderateScale(30) : moderateScale(26),
      fontWeight: '700',
      marginBottom: verticalScale(10),
      color: colors.white,
    },

    subtitle: {
      fontSize: isTablet ? moderateScale(15) : moderateScale(14),
      lineHeight: isTablet ? moderateScale(22) : moderateScale(20),
      color: colors.onDarkHigh,
      marginBottom: verticalScale(10),
    },

    roleBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: scale(8),
      marginBottom: verticalScale(30),
      backgroundColor: 'rgba(255,255,255,0.22)',
      borderTopRightRadius: moderateScale(18),
      borderBottomRightRadius: moderateScale(18),
      paddingHorizontal: scale(16),
      borderBottomLeftRadius: moderateScale(18),
      paddingVertical: verticalScale(8),
    },

    roleBadgeText: {
      fontSize: isTablet ? moderateScale(13) : moderateScale(12),
      fontWeight: '600',
      letterSpacing: 0.6,
      color: colors.white,
    },

    tabContainer: {
      flexDirection: 'row',
      backgroundColor: '#F3F4F6',
      borderRadius: moderateScale(16),
      padding: moderateScale(4),
      marginBottom: verticalScale(18),
    },

    tab: {
      flex: 1,
      paddingVertical: verticalScale(9),
      borderRadius: moderateScale(14),
      alignItems: 'center',
      justifyContent: 'center',
    },

    tabActive: {
      backgroundColor: colors.white,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.06,
      shadowRadius: moderateScale(6),
      elevation: 2,
    },

    tabText: {
      fontSize: moderateScale(13),
      fontWeight: '600',
      color: '#6B7280',
    },

    tabTextActive: {
      color: colors.textOnLightStrong,
    },
    label: {
      fontSize: isTablet ? moderateScale(15) : moderateScale(16),
      fontWeight: '500',
      color: colors.text_dark,
      marginBottom: verticalScale(10),
      textAlign: 'left',
      alignSelf: 'flex-start',
      width: '100%',
    },

    input: {
      borderWidth: scale(1),
      borderColor: colors.border_Color,
      borderRadius: moderateScale(14),
      backgroundColor: colors.gray400,
      borderRadius: moderateScale(12),
      paddingVertical: isTablet ? verticalScale(6) : verticalScale(10),
      paddingHorizontal: scale(16),
      fontSize: isTablet ? moderateScale(14) : moderateScale(15),
      marginBottom: verticalScale(16),
      color: colors.text_dark || '#111827',
      textAlign: 'left',
      width: '100%',
    },

    disabledInput: {
      borderRadius: moderateScale(14),
      backgroundColor: '#F3F4F6',
      opacity: 0.7,
    },

    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: verticalScale(16),
    },

    dividerLine: {
      flex: 1,
      height: scale(1.5),
      backgroundColor: colors.border_Color,
    },

    dividerText: {
      marginHorizontal: scale(10),
      color: colors.text_dark,
      fontSize: moderateScale(12),
      fontWeight: '400',
    },
    passwordContainer: {
      position: 'relative',
      marginBottom: verticalScale(4),
    },

    passwordInput: {
      paddingRight: scale(50),
      marginBottom: verticalScale(8),
    },

    otpRow: {
      marginBottom: verticalScale(4),
    },

    otpInput: {
      textAlign: 'center',
      letterSpacing: 2,
    },

    otpBoxContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: verticalScale(10),
    },

    otpBox: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border_Color,
      backgroundColor: '#F3F3F3',
      borderRadius: moderateScale(12),
      textAlign: 'center',
      fontSize: moderateScale(18),
      paddingVertical: verticalScale(12),
      marginHorizontal: scale(4),
      color: colors.text_dark || '#111827',
    },

    otpTimerText: {
      textAlign: 'right',
      color: '#9CA3AF',
      fontSize: moderateScale(13),
      marginBottom: verticalScale(10),
    },

    showHideButton: {
      position: 'absolute',
      right: scale(12),
      top: 0,
      // Match the password input's marginBottom so the icon centers on the
      // field itself, not the field + its bottom spacing.
      bottom: verticalScale(8),
      width: moderateScale(40),
      justifyContent: 'center',
      alignItems: 'center',
    },

    forgotPasswordContainer: {
      alignSelf: 'flex-end',
      marginBottom: verticalScale(2),
      paddingVertical: verticalScale(2),
    },

    forgotPasswordText: {
      color: colors.text_dark,
      fontWeight: '400',
      fontSize: moderateScale(12),
    },
    buttonContainer: {
      marginTop: isTablet ? 'auto' : verticalScale(80),
      paddingTop: isTablet ? verticalScale(14) : -verticalScale(10),
    },

    button: {
      backgroundColor: colors.primary,
      paddingVertical: buttonPaddingV,
      borderRadius: buttonRadius,
      alignItems: 'center',
      justifyContent: 'center',
    },

    loadingButton: {
      opacity: 0.7,
    },

    buttonText: {
      color: colors.textOnPrimary,
      textAlign: 'center',
      fontSize: moderateScale(16),
      fontWeight: '700',
      letterSpacing: 0.5,
    },

    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: buttonRadius,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: buttonPaddingV,
      marginTop: verticalScale(6),
      shadowColor: colors.primary,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.3,
      shadowRadius: moderateScale(8),
      elevation: 5,
    },

    primaryButtonText: {
      color: colors.white,
      fontSize: isTablet ? moderateScale(15) : moderateScale(16),
      fontWeight: '700',
    },

    biometricButton: {
      backgroundColor: colors.white,
      paddingVertical: buttonPaddingV,
      borderRadius: buttonRadius,
      marginTop: verticalScale(6),
      borderWidth: 1,
      borderColor: colors.primary,
    },

    biometricButtonText: {
      color: colors.primary,
    },

    altLogin: {
      alignSelf: 'center',
      textAlign: 'center',
      color: colors.text_dark,
      fontSize: moderateScale(12),
      fontWeight: '400',
      marginVertical: verticalScale(12),
      marginBottom: verticalScale(10),
    },
    disabledButton: {
      opacity: 0.5,
    },
    googleText: {
      fontSize: moderateScale(14),
      fontWeight: '500',
      color: colors.textOnLightStrong,
    },

    signupRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: verticalScale(8),
      marginTop: verticalScale(4),
    },

    signupText: {
      fontSize: moderateScale(13),
      color: colors.text_dark,
    },

    signupAction: {
      fontSize: moderateScale(13),
      color: colors.text_dark,
      fontWeight: '700',
    },
  });
};

export default makeStyles;
