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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },

  iconText: {
    fontSize: moderateScale(22),
    fontWeight: '700',
  },

  title: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: colors.text_dark,
    marginBottom: verticalScale(8),
  },

  message: {
    fontSize: moderateScale(14),
    color: colors.textMuted,
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
    backgroundColor: colors.border_Color,
  },

  primaryButton: {
    backgroundColor: colors.primary,
  },

  secondaryText: {
    color: colors.text_dark,
    fontWeight: '600',
    fontSize: moderateScale(14),
  },

  primaryText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: moderateScale(14),
  },
});

// Per-variant accent colors for the icon badge. Keeps the shell generic while
// letting callers signal error / warning / success / info intent.
export const variantStyles = {
  error: {iconBg: '#FEE2E2', iconColor: colors.danger, icon: '!'},
  warning: {iconBg: '#FEF3C7', iconColor: colors.warning, icon: '!'},
  success: {iconBg: colors.successLight, iconColor: colors.success, icon: '✓'},
  info: {iconBg: '#DBEAFE', iconColor: colors.accentBlue, icon: 'i'},
};

export default styles;
