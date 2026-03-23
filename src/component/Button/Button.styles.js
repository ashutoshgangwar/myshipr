import {StyleSheet} from 'react-native';
import {moderateScale, verticalScale} from 'react-native-size-matters';

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
    borderWidth: 1,
  },

  iosButton: {
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
    fontSize: moderateScale(16),
    fontWeight: '600',
  },

  icon: {
    width: 20,
    height: 20,
    marginRight: 10,
    resizeMode: 'contain',
  },
});

export default styles;
