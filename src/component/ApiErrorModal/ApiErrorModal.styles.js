import {StyleSheet} from 'react-native';
import {moderateScale, verticalScale} from 'react-native-size-matters';
import {colors} from '../../theme/colors';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: moderateScale(20),
  },

  card: {
    width: '100%',
    maxWidth: moderateScale(360),
    backgroundColor: colors.white,
    borderRadius: moderateScale(18),
    padding: moderateScale(20),
  },

  iconWrap: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },

  iconText: {
    fontSize: moderateScale(22),
    color: '#B91C1C',
    fontWeight: '700',
  },

  title: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#111827',
    marginBottom: verticalScale(8),
  },

  message: {
    fontSize: moderateScale(14),
    color: '#4B5563',
    lineHeight: moderateScale(20),
    marginBottom: verticalScale(18),
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },

  button: {
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(10),
    marginLeft: moderateScale(10),
    minWidth: moderateScale(88),
    alignItems: 'center',
  },

  secondaryButton: {
    backgroundColor: '#E5E7EB',
  },

  primaryButton: {
    backgroundColor: colors.primary,
  },

  secondaryText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: moderateScale(14),
  },

  primaryText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: moderateScale(14),
  },
});

export default styles;
