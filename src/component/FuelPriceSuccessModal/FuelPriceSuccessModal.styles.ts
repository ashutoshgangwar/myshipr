import {StyleSheet} from 'react-native';

import {colors} from '../../theme/colors';
import {IS_TABLET} from '../../theme/device';
import {ms, vs} from '../../theme/scale';

export const BADGE_SIZE = ms(84);
export const HEADER_HEIGHT = vs(96);

export default StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.blackAlpha45,
  },

  backdropTouch: StyleSheet.absoluteFillObject,

  confetti: {
    zIndex: 20,
    elevation: 20,
  },

  cardWrap: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: ms(22),
  },

  card: {
    width: '100%',
    maxWidth: IS_TABLET ? ms(420) : undefined,
    borderRadius: ms(20),
    backgroundColor: colors.white,
    overflow: 'hidden',
    shadowColor: colors.textStrong,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 14,
  },

  header: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },

  /** Soft bubbles behind the badge, so the band is not a flat slab. */
  bubble: {
    position: 'absolute',
    borderRadius: ms(90),
    backgroundColor: colors.whiteAlpha20,
  },

  bubbleLeft: {
    width: ms(120),
    height: ms(120),
    left: -ms(38),
    top: -ms(52),
  },

  bubbleRight: {
    width: ms(88),
    height: ms(88),
    right: -ms(26),
    top: ms(14),
  },

  closeBtn: {
    position: 'absolute',
    top: vs(10),
    right: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  badgeWrap: {
    position: 'absolute',
    top: HEADER_HEIGHT - BADGE_SIZE / 2,
    alignSelf: 'center',
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /** The halo that swells out from under the tick as it lands. */
  halo: {
    position: 'absolute',
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    backgroundColor: colors.successLight,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },

  body: {
    paddingTop: BADGE_SIZE / 2 + vs(14),
    paddingHorizontal: ms(20),
    paddingBottom: vs(4),
    alignItems: 'center',
  },

  footer: {
    width: '100%',
    paddingHorizontal: ms(20),
    paddingTop: vs(18),
    paddingBottom: vs(20),
  },

  title: {
    color: colors.textStrong,
    fontSize: ms(20),
    fontWeight: '700',
    textAlign: 'center',
  },

  message: {
    color: colors.textMuted,
    fontSize: ms(12.5),
    lineHeight: ms(19),
    fontWeight: '500',
    textAlign: 'center',
    marginTop: vs(6),
  },

  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(8),
    marginTop: vs(14),
    paddingVertical: vs(8),
    paddingHorizontal: ms(16),
    borderRadius: ms(999),
    borderWidth: 1,
    borderColor: colors.button_color,
    backgroundColor: colors.amber100,
  },

  pointsValue: {
    color: colors.amber800,
    fontSize: ms(17),
    fontWeight: '700',
  },

  pointsLabel: {
    color: colors.amber800,
    fontSize: ms(12),
    fontWeight: '600',
  },

  summary: {
    width: '100%',
    marginTop: vs(16),
    borderRadius: ms(14),
    backgroundColor: colors.screenBg,
    paddingHorizontal: ms(14),
    paddingVertical: vs(4),
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ms(12),
    paddingVertical: vs(10),
  },

  summaryDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border_Color,
  },

  summaryLabel: {
    color: colors.textMuted,
    fontSize: ms(12),
    fontWeight: '500',
  },

  summaryValue: {
    flexShrink: 1,
    color: colors.textStrong,
    fontSize: ms(13),
    fontWeight: '700',
    textAlign: 'right',
  },

  cta: {
    width: '100%',
    borderRadius: ms(12),
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },

  ctaFill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: vs(13),
  },

  ctaText: {
    color: colors.white,
    fontSize: ms(14),
    fontWeight: '700',
  },
});
