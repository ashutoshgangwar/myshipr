import {StyleSheet} from 'react-native';
import {moderateScale, verticalScale} from 'react-native-size-matters';

const makeStyles = (isTablet = false) =>
  StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: isTablet ? verticalScale(10) : verticalScale(12),
      borderRadius: moderateScale(12),
      borderWidth: 1,
    },

    iosButton: {
      paddingVertical: isTablet ? verticalScale(8) : verticalScale(6),
      shadowColor: '#000',
      shadowOffset: {width: 1, height: 3},
      shadowOpacity: 0.08,
      shadowRadius: moderateScale(6),
    },

    androidButton: {
      elevation: 2,
    },

    disabledButton: {
      opacity: 0.6,
    },

    text: {
      fontSize: isTablet ? moderateScale(15) : moderateScale(16),
      fontWeight: '600',
    },

    icon: {
      width: isTablet ? moderateScale(22) : 20,
      height: isTablet ? moderateScale(22) : 20,
      marginRight: 10,
      resizeMode: 'contain',
    },
  });

export default makeStyles;
