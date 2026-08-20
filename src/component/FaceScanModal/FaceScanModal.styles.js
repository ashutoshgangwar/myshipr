import {Dimensions, StyleSheet} from 'react-native';

import {colors} from '../../theme/colors';
import {IS_TABLET} from '../../theme/device';
import {ms, vs} from '../../theme/scale';

const {width, height} = Dimensions.get('window');

// The circle is sized off the shorter screen edge so a landscape tablet keeps
// it fully on screen, and capped so it never dwarfs a large display.
export const RING_SIZE = Math.min(
  Math.min(width, height) * (IS_TABLET ? 0.5 : 0.74),
  ms(320),
);

export const RING_STROKE = ms(6);
export const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;

// Preview inset by the stroke so the ring frames it instead of covering it.
const PREVIEW_SIZE = RING_SIZE - RING_STROKE * 2;

export default StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.navy,
    paddingTop: vs(44),
    paddingBottom: vs(24),
    paddingHorizontal: ms(20),
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(12),
  },

  title: {
    flex: 1,
    color: colors.white,
    fontSize: ms(18),
    fontWeight: '700',
  },

  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: vs(20),
  },

  circleWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  circleClip: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: PREVIEW_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },

  noCamera: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(16),
  },

  noCameraText: {
    color: colors.onDarkMedium,
    fontSize: ms(12),
    fontWeight: '500',
    textAlign: 'center',
  },

  hint: {
    color: colors.onDarkMedium,
    fontSize: ms(13),
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: ms(16),
  },

  actions: {
    gap: vs(10),
  },

  primaryBtn: {
    borderRadius: ms(10),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(13),
  },

  primaryBtnDisabled: {
    opacity: 0.5,
  },

  primaryText: {
    color: colors.navy,
    fontSize: ms(15),
    fontWeight: '700',
  },

  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(10),
  },

  secondaryText: {
    color: colors.onDarkMedium,
    fontSize: ms(14),
    fontWeight: '600',
  },
});
