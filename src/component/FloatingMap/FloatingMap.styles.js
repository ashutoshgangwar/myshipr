import {Dimensions, StyleSheet} from 'react-native';
import {ms, vs} from '../../theme/scale';
import {colors} from '../../theme/colors';
import {select} from '../../theme/device';

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');

export const CARD_WIDTH = Math.min(
  SCREEN_W * select({phone: 0.82, tablet: 0.5}),
  select({phone: 260, tablet: 520}),
);
export const CARD_HEIGHT = Math.min(
  SCREEN_H * select({phone: 0.42, tablet: 0.5}),
  select({phone: 250, tablet: 560}),
);
const MAP_HEIGHT = CARD_HEIGHT;

export default StyleSheet.create({
  card: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: colors.white,
    borderRadius: ms(16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 8},
    elevation: 12,
    zIndex: 999,
  },

  mapWrap: {
    flex: 1,
  },

  // Overrides HereMapPicker's default mapCard height so it fills the card.
  mapInner: {
    height: MAP_HEIGHT,
    borderRadius: ms(16),
  },

  // Thin transparent strip across the top of the map that starts a drag.
  dragStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: vs(28),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },

  grip: {
    width: ms(36),
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  // Floats over the map (top-right) via zIndex.
  closeBtn: {
    position: 'absolute',
    top: vs(8),
    right: ms(8),
    width: ms(30),
    height: ms(30),
    borderRadius: ms(15),
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  closeGlyph: {
    color: colors.white,
    fontSize: ms(15),
    fontWeight: '800',
  },
});
