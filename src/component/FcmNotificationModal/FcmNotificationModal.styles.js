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

  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },

  badge: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },

  // Sits to the right of the badge and takes the remaining width, so a long
  // title wraps inside the card instead of pushing the badge off the edge.
  headText: {
    flex: 1,
  },

  title: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    color: colors.textStrong,
  },

  time: {
    fontSize: moderateScale(12),
    color: colors.textMuted,
    marginTop: verticalScale(2),
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

export default styles;
