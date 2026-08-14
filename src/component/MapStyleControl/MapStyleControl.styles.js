import {Platform, StyleSheet} from 'react-native';
import {
  moderateScale as ms,
  verticalScale as vs,
  scale as s,
} from 'react-native-size-matters';
import {colors} from '../../theme/colors';

// The menu is a child of the wrapper rather than a sibling floating over the
// screen: Android does not deliver touches to anything drawn outside its
// parent's bounds, so the wrapper has to contain both the button and the open
// menu. It is only positioned (no width/height), which lets the column grow
// upward from whichever edge the screen anchors it to.
export default StyleSheet.create({
  wrap: {
    position: 'absolute',
    // Above the map, below the panels/top bar — matches the other floating
    // map buttons so an opening panel covers this too.
    zIndex: 30,
  },
  wrapRight: {alignItems: 'flex-end'},
  wrapLeft: {alignItems: 'flex-start'},

  button: {
    width: ms(46),
    height: ms(46),
    borderRadius: ms(23),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#3b82f6',
        shadowOpacity: 0.35,
        shadowRadius: 8,
        shadowOffset: {width: 0, height: 2},
      },
      android: {elevation: 6},
    }),
  },
  buttonOpen: {backgroundColor: colors.navy},

  menu: {
    marginBottom: vs(8),
    minWidth: ms(150),
    backgroundColor: colors.white,
    borderRadius: ms(14),
    paddingVertical: vs(8),
    paddingHorizontal: s(8),
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOpacity: 0.22,
        shadowRadius: 12,
        shadowOffset: {width: 0, height: 4},
      },
      android: {elevation: 8},
    }),
  },
  menuTitle: {
    color: colors.textMuted,
    fontSize: ms(11),
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    paddingHorizontal: s(8),
    paddingBottom: vs(4),
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: vs(8),
    paddingHorizontal: s(8),
    borderRadius: ms(9),
  },
  rowSelected: {backgroundColor: '#EEF2FF'},
  rowLabel: {color: colors.textStrong, fontSize: ms(13)},
  rowLabelSelected: {color: colors.accentBlue, fontWeight: '700'},

  selectedDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    backgroundColor: colors.accentBlue,
    marginLeft: s(10),
  },

  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginVertical: vs(4),
    marginHorizontal: s(8),
  },

  // A plain drawn switch — RN's Switch is heavy for a two-line menu and does
  // not size down consistently across the two platforms.
  switch: {
    width: ms(34),
    height: ms(19),
    borderRadius: ms(10),
    backgroundColor: '#CBD5E1',
    padding: ms(2),
    justifyContent: 'center',
    marginLeft: s(10),
  },
  switchOn: {backgroundColor: colors.accentBlue},
  knob: {
    width: ms(15),
    height: ms(15),
    borderRadius: ms(8),
    backgroundColor: colors.white,
  },
  knobOn: {alignSelf: 'flex-end'},
});
