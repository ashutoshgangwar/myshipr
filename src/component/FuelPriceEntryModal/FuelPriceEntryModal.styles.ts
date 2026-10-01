import {StyleSheet} from 'react-native';

import {colors} from '../../theme/colors';
import {IS_TABLET} from '../../theme/device';
import {ms, vs} from '../../theme/scale';

// Same card as `PasswordPromptModal`, so the two sheets read as one family.
export default StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(20),
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.blackAlpha45,
  },

  card: {
    width: '100%',
    maxWidth: IS_TABLET ? ms(420) : undefined,
    borderRadius: ms(14),
    backgroundColor: colors.white,
    overflow: 'hidden',
    shadowColor: colors.textStrong,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: ms(14),
    paddingVertical: vs(10),
    gap: ms(10),
  },

  titleBlock: {
    flex: 1,
  },

  title: {
    color: colors.white,
    fontSize: ms(15),
    fontWeight: '700',
  },

  subtitle: {
    color: colors.white,
    fontSize: ms(11),
    marginTop: vs(2),
  },

  closeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: {
    paddingHorizontal: ms(14),
    paddingTop: vs(14),
    paddingBottom: vs(16),
  },

  label: {
    color: colors.textStrong,
    fontSize: ms(12),
    fontWeight: '600',
    marginTop: vs(8),
    marginBottom: vs(6),
  },

  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: ms(8),
    paddingHorizontal: ms(12),
  },

  stationField: {
    marginBottom: vs(4),
  },

  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(4),
    paddingVertical: vs(4),
    paddingHorizontal: ms(8),
  },

  stationDistance: {
    color: colors.textMuted,
    fontSize: ms(11),
  },

  fieldError: {
    borderColor: colors.danger,
  },

  affix: {
    color: colors.textMuted,
    fontSize: ms(14),
    fontWeight: '600',
  },

  input: {
    flex: 1,
    paddingHorizontal: ms(6),
    paddingVertical: vs(10),
    fontSize: ms(14),
    fontWeight: '500',
    color: colors.textStrong,
    includeFontPadding: false,
  },

  hint: {
    color: colors.textMuted,
    fontSize: ms(11),
    marginTop: vs(6),
  },

  error: {
    color: colors.danger,
    fontSize: ms(11),
    fontWeight: '500',
    marginTop: vs(6),
  },

  submitBtn: {
    marginTop: vs(14),
    borderRadius: ms(8),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(12),
  },

  submitBtnDisabled: {
    opacity: 0.5,
  },

  submitText: {
    color: colors.white,
    fontSize: ms(14),
    fontWeight: '700',
  },
});
