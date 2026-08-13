import {StyleSheet} from 'react-native';

import {ms, vs} from '../../theme/scale';
import {colors} from '../../theme/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },

  map: {
    flex: 1,
  },

  // Sits below the card's drag strip, so the handle stays grabbable.
  turnStrip: {
    position: 'absolute',
    top: vs(30),
    left: ms(8),
    right: ms(8),
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
    paddingVertical: vs(5),
    paddingHorizontal: ms(8),
    borderRadius: ms(10),
    backgroundColor: colors.navy,
    zIndex: 6,
  },

  turnLabel: {
    flex: 1,
    color: colors.white,
    fontSize: ms(11),
    fontWeight: '700',
  },

  turnDistance: {
    color: colors.white,
    fontSize: ms(11),
    fontWeight: '600',
    opacity: 0.9,
  },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(6),
    paddingHorizontal: ms(10),
    backgroundColor: 'rgba(0,3,62,0.88)',
    zIndex: 6,
  },

  footerText: {
    flex: 1,
  },

  footerTitle: {
    color: colors.white,
    fontSize: ms(11),
    fontWeight: '700',
  },

  footerMeta: {
    color: colors.white,
    fontSize: ms(9),
    opacity: 0.8,
    marginTop: vs(1),
  },

  footerChevron: {
    color: colors.white,
    fontSize: ms(20),
    fontWeight: '700',
    marginLeft: ms(6),
  },

  // Clear of the footer strip, and of the close button top-right.
  gpsBtn: {
    position: 'absolute',
    right: ms(8),
    bottom: vs(38),
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 4,
    zIndex: 6,
  },
});
