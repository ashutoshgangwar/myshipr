import {Platform, StyleSheet} from 'react-native';
import {moderateScale as ms, verticalScale as vs, scale as s} from 'react-native-size-matters';
import {colors} from '../../theme/colors';
import {IS_TABLET} from '../../utils/device';

// Width of the floating panels (chat / documents / bidding) in the centre.
const PANEL_WIDTH = IS_TABLET ? ms(300) : ms(260);

export default StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.navy},

  // ── Map ───────────────────────────────────────────────────────────────
  map: {...StyleSheet.absoluteFillObject},
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dfe7ef',
  },
  mapLoadingText: {color: colors.textMuted, fontSize: ms(13), marginTop: vs(8)},

  // ── Top bar ───────────────────────────────────────────────────────────
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(14),
    paddingTop: IS_TABLET?  vs(20) : vs(40),
    zIndex: 50,
  },
  circleBtn: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 4,
        shadowOffset: {width: 0, height: 2},
      },
      android: {elevation: 4},
    }),
  },
  backGlyph: {fontSize: ms(20), color: colors.navy, lineHeight: ms(22)},

  dutyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentBlue,
    borderRadius: ms(8),
    paddingVertical: vs(9),
    paddingHorizontal: s(22),
  },
  dutyText: {
    color: colors.white,
    fontSize: ms(13),
    fontWeight: '600',
    letterSpacing: 0.5,
    marginRight: s(8),
  },
  dutyChevron: {color: colors.white, fontSize: ms(11)},

  sosBtn: {
    backgroundColor: colors.danger,
    borderRadius: ms(8),
    paddingVertical: vs(9),
    paddingHorizontal: s(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosText: {color: colors.white, fontSize: ms(13), fontWeight: '700', letterSpacing: 0.5},

  // ── Side toolbar ──────────────────────────────────────────────────────
  toolbar: {
    position: 'absolute',
    left: s(14),
    top: vs(140),
    zIndex: 40,
  },
  toolBtn: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(10),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(12),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 4,
        shadowOffset: {width: 0, height: 2},
      },
      android: {elevation: 3},
    }),
  },
  toolBtnActive: {backgroundColor: colors.accentBlue},

  // ── Floating panel (shared shell) ─────────────────────────────────────
  panelWrap: {
    position: 'absolute',
    top: vs(150),
    alignSelf: 'center',
    width: PANEL_WIDTH,
    zIndex: 45,
  },
  panel: {
    borderRadius: ms(12),
    backgroundColor: colors.white,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: {width: 0, height: 6},
      },
      android: {elevation: 8},
    }),
  },
  panelHeader: {
    backgroundColor: colors.navy,
    paddingVertical: vs(10),
    paddingHorizontal: s(12),
    flexDirection: 'row',
    alignItems: 'center',
  },
  panelHeaderTexts: {flex: 1},
  panelTitle: {color: colors.white, fontSize: ms(14), fontWeight: '700'},
  panelSubtitle: {color: colors.onDarkMedium, fontSize: ms(10), marginTop: vs(1)},
  panelHeaderIcon: {paddingHorizontal: s(6)},
  panelHeaderIconGlyph: {color: colors.white, fontSize: ms(16)},

  // ── Chat panel ────────────────────────────────────────────────────────
  chatBody: {maxHeight: vs(240), paddingVertical: vs(10), paddingHorizontal: s(10)},
  bubble: {
    maxWidth: '82%',
    borderRadius: ms(10),
    paddingVertical: vs(7),
    paddingHorizontal: s(10),
    marginBottom: vs(8),
  },
  bubbleIn: {backgroundColor: '#EEF1F5', alignSelf: 'flex-start', borderTopLeftRadius: ms(2)},
  bubbleOut: {backgroundColor: colors.accentBlue, alignSelf: 'flex-end', borderTopRightRadius: ms(2)},
  bubbleTextIn: {color: colors.text_dark, fontSize: ms(11), lineHeight: ms(15)},
  bubbleTextOut: {color: colors.white, fontSize: ms(11), lineHeight: ms(15)},

  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border_Color,
    paddingHorizontal: s(10),
    paddingVertical: vs(8),
  },
  chatInput: {
    flex: 1,
    backgroundColor: '#F4F5F7',
    borderRadius: ms(8),
    paddingHorizontal: s(10),
    paddingVertical: Platform.OS === 'ios' ? vs(8) : vs(4),
    fontSize: ms(11),
    color: colors.text_dark,
  },
  sendBtn: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(8),
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: s(8),
  },
  sendGlyph: {color: colors.white, fontSize: ms(15)},

  // ── Documents / camera panel ──────────────────────────────────────────
  cameraPreview: {
    height: vs(190),
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: vs(14),
  },
  captureBtn: {
    width: ms(46),
    height: ms(46),
    borderRadius: ms(23),
    backgroundColor: colors.white,
    borderWidth: ms(3),
    borderColor: 'rgba(255,255,255,0.6)',
  },
  captureLabel: {color: colors.onDarkMedium, fontSize: ms(9), marginTop: vs(6)},

  // ── Bidding panel ─────────────────────────────────────────────────────
  biddingBody: {
    height: vs(190),
    alignItems: 'center',
    justifyContent: 'center',
  },
  biddingText: {color: colors.text_dark, fontSize: ms(14), fontWeight: '600'},

  // ── Bottom trip progress ──────────────────────────────────────────────
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    paddingHorizontal: s(16),
    paddingTop: vs(12),
    paddingBottom: vs(16),
    borderTopLeftRadius: ms(14),
    borderTopRightRadius: ms(14),
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: {width: 0, height: -3},
      },
      android: {elevation: 12},
    }),
  },
  progressInfo: {flex: 1, marginRight: s(14)},
  progressTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(8),
  },
  progressLabel: {color: colors.text_dark, fontSize: ms(13), fontWeight: '600'},
  progressPercent: {color: colors.text_dark, fontSize: ms(13), fontWeight: '700'},

  track: {
    height: vs(6),
    borderRadius: ms(3),
    backgroundColor: colors.border_Color,
    overflow: 'hidden',
  },
  trackFill: {height: '100%', borderRadius: ms(3), backgroundColor: colors.accentBlue},

  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: vs(6),
  },
  scaleEdge: {color: colors.textMuted, fontSize: ms(9)},
  etaText: {color: colors.text_dark, fontSize: ms(11), fontWeight: '600'},

  endTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.button_color,
    borderRadius: ms(8),
    paddingVertical: vs(10),
    paddingHorizontal: s(16),
  },
  endTripCheckbox: {
    width: ms(14),
    height: ms(14),
    borderRadius: ms(3),
    borderWidth: 1.5,
    borderColor: colors.button_color,
    marginRight: s(8),
  },
  endTripText: {color: colors.button_color, fontSize: ms(13), fontWeight: '700'},
});
