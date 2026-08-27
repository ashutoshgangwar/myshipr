import {StyleSheet} from 'react-native';

import {colors} from '../../theme/colors';
import {IS_TABLET} from '../../theme/device';
import {ms, vs} from '../../theme/scale';

export default StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(20),
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  card: {
    width: '100%',
    // A tablet would stretch the sheet across the whole screen otherwise.
    maxWidth: IS_TABLET ? ms(420) : undefined,
    borderRadius: ms(14),
    backgroundColor: colors.white,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.navy,
    paddingHorizontal: ms(14),
    paddingVertical: vs(10),
    gap: ms(10),
  },

  title: {
    flex: 1,
    color: colors.white,
    fontSize: ms(15),
    fontWeight: '700',
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
    marginBottom: vs(6),
  },

  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: ms(8),
    paddingHorizontal: ms(12),
    paddingVertical: vs(10),
    fontSize: ms(13),
    fontWeight: '500',
    color: colors.textStrong,
    includeFontPadding: false,
  },

  inputError: {
    borderColor: colors.danger,
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
    backgroundColor: colors.navy,
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
