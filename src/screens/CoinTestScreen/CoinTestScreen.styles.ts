import {StyleSheet} from 'react-native';
import {
  moderateScale as ms,
  verticalScale as vs,
  scale as s,
} from 'react-native-size-matters';
import {colors} from '../../theme/colors';

export default StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: s(14),
    paddingTop: vs(8),
  },
  backBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(10),
  },
  backGlyph: {fontSize: ms(26), color: colors.navy, lineHeight: ms(28)},
  title: {fontSize: ms(20), fontWeight: '800', color: colors.text_dark},

  subtitle: {
    fontSize: ms(13),
    color: colors.textMuted,
    paddingHorizontal: s(14),
    marginTop: vs(6),
    marginBottom: vs(8),
  },

  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  loadingText: {marginTop: vs(8), color: colors.textMuted, fontSize: ms(13)},

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: s(10),
    paddingBottom: vs(20),
  },
  coinCell: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: ms(8),
  },

  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border_Color,
    paddingHorizontal: s(16),
    paddingTop: vs(12),
    paddingBottom: vs(10),
  },
  selectedLabel: {
    fontSize: ms(14),
    fontWeight: '600',
    color: colors.text_dark,
    marginBottom: vs(10),
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: colors.navy,
    borderRadius: ms(12),
    paddingVertical: vs(13),
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {backgroundColor: colors.primaryLight},
  submitText: {
    color: colors.white,
    fontSize: ms(15),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
