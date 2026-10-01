import {Platform, StyleSheet, Dimensions} from 'react-native';
import {
  moderateScale as ms,
  verticalScale as vs,
  scale as s,
} from 'react-native-size-matters';
import {colors} from '../../theme/colors';
import {IS_TABLET} from '../../theme/device';

// Width of the floating panels (chat / documents / bidding) in the centre.
const PANEL_WIDTH = IS_TABLET ? ms(300) : ms(260);

// Gap between the floating trip-progress card and the screen edges. The GPS
// button's offset is derived from this, so the two can't drift apart.
const BAR_GAP = 12;

// Reveal circle: diameter = 2× screen diagonal so it fully covers the screen
// (from its centred origin) once scaled to 1.
// Next-turn card green. Deliberately darker and flatter than colors.success —
// it sits on the map, where the brighter green vibrates against the park fill.
const DIRECTION_GREEN = colors.success;

// The round white map buttons that flank the progress card. Shared shell so the
// pair can't drift apart in size or height; each style below adds its own edge.
const FLOAT_BTN = {
  position: 'absolute',
  // Sits above the floating progress card, which itself clears the bottom edge
  // by BAR_GAP. The component adds the bottom safe-area inset on top.
  // Raise/lower this one value to shift the GPS, navigate and map-style
  // buttons together — the map-style button is stacked off it.
  bottom: vs(125 + BAR_GAP),
  width: ms(46),
  height: ms(46),
  borderRadius: ms(23),
  backgroundColor: colors.white,
  alignItems: 'center',
  justifyContent: 'center',
  // Sit below the side toolbar (40), panels (45), top bar (50) and the
  // ride-complete reveal animation (100) so those layers cover these buttons
  // instead of them floating on top.
  zIndex: 30,
  ...Platform.select({
    ios: {
      shadowColor: colors.accentBlue,
      shadowOpacity: 0.35,
      shadowRadius: 8,
      shadowOffset: {width: 0, height: 2},
    },
    android: {elevation: 6},
  }),
} as const;

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');
const REVEAL_DIAMETER = Math.ceil(Math.hypot(SCREEN_W, SCREEN_H) * 2);

export default StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.primary},

  // ── Circular reveal transition (grows from map centre → truck screen) ──
  revealCircle: {
    position: 'absolute',
    top: SCREEN_H / 2 - REVEAL_DIAMETER / 2,
    left: SCREEN_W / 2 - REVEAL_DIAMETER / 2,
    width: REVEAL_DIAMETER,
    height: REVEAL_DIAMETER,
    borderRadius: REVEAL_DIAMETER / 2,
    backgroundColor: colors.white,
    zIndex: 100,
    // Android stacks by elevation, not zIndex — keep this above the GPS
    // button (elevation 6) so the reveal covers it during the animation.
    elevation: 30,
  },

  // ── Map ───────────────────────────────────────────────────────────────
  map: {...StyleSheet.absoluteFillObject},
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.border_Color,
  },
  mapLoadingText: {color: colors.textMuted, fontSize: ms(13), marginTop: vs(8)},

  gpsButton: {...FLOAT_BTN, left: s(12)},
  navFloatBtn: {...FLOAT_BTN, right: s(12)},

  mapStyleButton: {
    right: s(12),
    bottom: FLOAT_BTN.bottom + FLOAT_BTN.height + vs(10),
  },

  directionCard: {
    position: 'absolute',
    top: IS_TABLET ? vs(75) : vs(95),
    left: s(14),
    minWidth: IS_TABLET ? ms(80) : ms(68),
    backgroundColor: DIRECTION_GREEN,
    borderRadius: ms(12),
    paddingHorizontal: s(8),
    paddingTop: vs(9),
    paddingBottom: vs(8),
    alignItems: 'center',
    zIndex: 36,
    ...Platform.select({
      ios: {
        shadowColor: colors.textStrong,
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: {width: 0, height: 3},
      },
      android: {elevation: 8},
    }),
  },
  directionLabel: {
    color: colors.white,
    fontSize: ms(11),
    fontWeight: '700',
    marginTop: vs(6),
    textAlign: 'center',
  },
  directionDistance: {
    color: colors.white,
    fontSize: ms(9),
    marginTop: vs(1),
    textAlign: 'center',
  },

  // ── Top bar ───────────────────────────────────────────────────────────
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    // flex-start, not center: the SOS column now hangs lower than the other two
    // items, and centering would drag the back button and duty pill down with
    // it. Each item gets a topRowSlot instead, so the top row still lines up.
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: s(14),
    paddingTop: IS_TABLET ? vs(20) : vs(40),
    zIndex: 50,
  },
  // One row-height band, so items shorter than the back button stay centred
  // against it.
  topRowSlot: {height: ms(38), justifyContent: 'center'},
  circleBtn: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.textStrong,
        shadowOpacity: 0.18,
        shadowRadius: 4,
        shadowOffset: {width: 0, height: 2},
      },
      android: {elevation: 4},
    }),
  },
  backGlyph: {fontSize: ms(20), color: colors.primary, lineHeight: ms(22)},

  dutyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentBlue,
    borderRadius: ms(8),
    paddingVertical: vs(6),
    paddingHorizontal: s(15),
  },
  dutyText: {
    color: colors.white,
    fontSize: ms(13),
    fontWeight: '600',
    letterSpacing: 0.5,
    marginRight: s(6),
    marginLeft: s(5),
  },
  dutyChevron: {color: colors.white, fontSize: ms(11)},

  // ── Duty-status dropdown ──────────────────────────────────────────────
  // minHeight matches the back button so the pill stays centred against it
  // under the row's flex-start alignment.
  dutyWrap: {alignItems: 'center', minHeight: ms(38), justifyContent: 'center'},
  dutyBackdrop: {
    position: 'absolute',
    top: -vs(1000),
    bottom: -vs(1000),
    left: -s(1000),
    right: -s(1000),
    zIndex: 55,
  },
  dutyMenu: {
    position: 'absolute',
    top: vs(46),
    left: '50%',
    width: IS_TABLET ? ms(210) : ms(200),
    marginLeft: IS_TABLET ? -ms(105) : -ms(100),
    backgroundColor: colors.white,
    borderRadius: ms(14),
    paddingVertical: vs(6),
    zIndex: 60,
    ...Platform.select({
      ios: {
        shadowColor: colors.textStrong,
        shadowOpacity: 0.18,
        shadowRadius: 12,
        shadowOffset: {width: 0, height: 6},
      },
      android: {elevation: 10},
    }),
  },
  dutyMenuItem: {
    paddingVertical: vs(5),
    paddingHorizontal: s(10),
    marginHorizontal: s(8),
    borderRadius: ms(10),
    alignItems: 'center',
  },
  dutyMenuItemActive: {backgroundColor: colors.white},
  dutyMenuText: {
    color: colors.textMuted,
    fontSize: ms(13),
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  dutyMenuTextActive: {color: colors.textStrong},

  sosBtn: {
    backgroundColor: colors.danger,
    borderRadius: ms(8),
    paddingVertical: vs(6),
    paddingHorizontal: s(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosText: {
    color: colors.white,
    fontSize: ms(13),
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Right-hand stack: SOS on the top row, service button hanging below it.
  // Kept as a flow child rather than absolutely positioned — Android clips
  // touches on children that spill outside their parent's bounds.
  sosWrap: {alignItems: 'flex-end'},
  // A crisp grey outline rather than a shadow — on a dark circle the Android
  // elevation shadow renders as a blurry halo instead of a clean ring.
  serviceBtn: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    backgroundColor: colors.textStrong,
    borderWidth: 3.5,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: vs(10),
  },

  // ── Side toolbar ──────────────────────────────────────────────────────
  // Single white card holding every tool button, so the rail reads as one
  // surface instead of a column of separate floating chips.
  toolbar: {
    position: 'absolute',
    left: s(14),
    top: IS_TABLET ? vs(200) : Platform.OS === 'ios' ? vs(200) : vs(200),
    zIndex: 40,
    backgroundColor: colors.white,
    borderRadius: ms(8),
    padding: ms(6),
    gap: vs(8),
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.textStrong,
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: {width: 0, height: 3},
      },
      android: {elevation: 4},
    }),
  },
  toolBtn: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: colors.border_Color,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBtnActive: {
    backgroundColor: colors.accentBlue,
    borderColor: colors.accentBlue,
  },
  // Collapse toggle keeps a fixed grey background regardless of state.
  collapseBtn: {
    backgroundColor: colors.textMuted,
    borderColor: colors.textMuted,
  },

  // Full-screen catcher shown while the keyboard is up so a tap outside any
  // input dismisses it. Below the panels (zIndex 45), above the map.
  keyboardBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
  },

  // ── Floating panel (shared shell) ─────────────────────────────────────
  panelWrap: {
    position: 'absolute',
    top: vs(150),
    alignSelf: 'center',
    width: PANEL_WIDTH,
    zIndex: 45,
  },
  // Chat panel sits against the right edge instead of the centre.
  chatPanelWrap: {
    alignSelf: 'flex-end',
    top: IS_TABLET ? vs(230) : Platform.OS === 'ios' ? vs(240) : vs(260),
    right: s(1),
  },
  // Stretched panel — fills the whole screen (documents "expand" action).
  panelWrapFullscreen: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    alignSelf: 'stretch',
    // Above the floating GPS button (zIndex 999 / elevation 6) so it can't
    // float over the full-screen camera.
    zIndex: 1000,
    elevation: 20,
  },
  panelFullscreen: {
    flex: 1,
    borderRadius: 0,
  },
  cameraPreviewFullscreen: {
    flex: 1,
  },
  panel: {
    borderRadius: ms(12),
    backgroundColor: colors.white,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.textStrong,
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: {width: 0, height: 6},
      },
      android: {elevation: 8},
    }),
  },
  panelHeader: {
    backgroundColor: colors.primary,
    paddingVertical: vs(8),
    paddingHorizontal: s(10),
    flexDirection: 'row',
    alignItems: 'center',
  },
  panelHeaderTexts: {flex: 1},
  panelTitle: {color: colors.white, fontSize: ms(14), fontWeight: '700'},
  panelSubtitle: {
    color: colors.white,
    fontSize: ms(10),
    marginTop: vs(1),
  },
  panelHeaderIcon: {
    width: ms(30),
    height: ms(30),
    borderRadius: ms(8),
    backgroundColor: colors.whiteAlpha20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: s(8),
  },
  panelHeaderIconGlyph: {color: colors.white, fontSize: ms(16)},

  // ── Chat panel ────────────────────────────────────────────────────────
  chatBody: {
    paddingVertical: vs(10),
    paddingHorizontal: s(10),
  },
  // The height cap lives here rather than in `chatBody` — a later style setting
  // `maxHeight: undefined` doesn't reliably clear it, so the stretched panel
  // would keep the docked height and leave dead space under the composer.
  chatBodyDocked: {maxHeight: vs(240)},
  // Stretched: the body takes the space left over above the input row.
  chatBodyFullscreen: {flex: 1},
  chatBodyContentFullscreen: {
    paddingHorizontal: s(6),
    paddingBottom: vs(8),
  },
  chatTitleFullscreen: {fontSize: ms(18)},
  bubble: {
    maxWidth: '82%',
    borderRadius: ms(10),
    paddingVertical: vs(7),
    paddingHorizontal: s(10),
    marginBottom: vs(8),
  },
  bubbleIn: {
    backgroundColor: colors.screenBg,
    alignSelf: 'flex-start',
    borderTopLeftRadius: ms(2),
  },
  bubbleOut: {
    backgroundColor: colors.accentBlue,
    alignSelf: 'flex-end',
    borderTopRightRadius: ms(2),
  },
  bubbleTextIn: {color: colors.textStrong, fontSize: ms(11), lineHeight: ms(15)},
  bubbleTextOut: {color: colors.white, fontSize: ms(11), lineHeight: ms(15)},

  // Stretched chat — a timestamp under each bubble.
  bubbleFullscreen: {
    maxWidth: '70%',
    borderRadius: ms(8),
    paddingVertical: vs(6),
    paddingHorizontal: s(9),
    marginBottom: vs(2),
  },
  // The docked bubbles clip the corner nearest their author; stretched they
  // stay evenly rounded.
  bubbleInFullscreen: {borderTopLeftRadius: ms(8)},
  bubbleOutFullscreen: {borderTopRightRadius: ms(8)},
  bubbleTextFullscreen: {fontSize: ms(11), lineHeight: ms(15)},
  chatTime: {
    color: colors.textMuted,
    fontSize: ms(8),
    marginBottom: vs(8),
  },
  chatTimeIn: {alignSelf: 'flex-start'},
  chatTimeOut: {alignSelf: 'flex-end'},

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
    backgroundColor: colors.white,
    borderRadius: ms(8),
    paddingHorizontal: s(10),
    paddingVertical: Platform.OS === 'ios' ? vs(8) : vs(4),
    fontSize: ms(11),
    color: colors.textStrong,
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
  // Stretched composer — pill input with a round send button.
  chatInputRowFullscreen: {
    paddingHorizontal: s(14),
    paddingVertical: vs(12),
  },
  chatInputFullscreen: {
    borderRadius: ms(10),
    paddingHorizontal: s(14),
    paddingVertical: Platform.OS === 'ios' ? vs(13) : vs(9),
    fontSize: ms(13),
  },
  sendBtnFullscreen: {
    width: ms(42),
    height: ms(42),
    borderRadius: ms(21),
    marginLeft: s(10),
  },
  sendGlyphFullscreen: {fontSize: ms(19)},

  // ── Documents / camera panel ──────────────────────────────────────────
  cameraPreview: {
    backgroundColor: colors.textStrong,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: vs(12),
  },
  cameraPreviewDocked: {height: vs(300)},
  captureBtn: {
    width: ms(46),
    height: ms(46),
    borderRadius: ms(23),
    backgroundColor: colors.white,
    borderWidth: ms(3),
    borderColor: colors.whiteAlpha20,
  },
  // Clips the native Android camera TextureView to the preview box so it
  // doesn't render full-screen behind the panel. Fills the whole preview area.
  cameraFeed: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  captureLabel: {color: colors.white, fontSize: ms(9), marginTop: vs(6)},
  documentPreviewImage: {
    ...StyleSheet.absoluteFillObject,
  },

  // ── Bidding panel ─────────────────────────────────────────────────────
  biddingBody: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Same split as chatBody / chatBodyDocked above.
  biddingBodyDocked: {height: vs(190)},
  biddingBodyFullscreen: {flex: 1},
  biddingText: {color: colors.textStrong, fontSize: ms(14), fontWeight: '600'},

  // Bidding panel docked against the right edge (like the chat panel).
  biddingPanelWrap: {
    alignSelf: 'flex-end',
    top: IS_TABLET ? vs(230) : Platform.OS === 'ios' ? vs(240) : vs(260),
    right: s(1),
  },

  // ── Fuel-price panel ──────────────────────────────────────────────────
  // Docked against the right edge (like the chat panel).
  fuelPanelWrap: {
    width: IS_TABLET ? ms(340) : ms(290),
    alignSelf: 'flex-end',
    top: IS_TABLET ? vs(230) : Platform.OS === 'ios' ? vs(240) : vs(260),
    right: s(1),
  },
  fuelBody: {
    paddingHorizontal: s(14),
    paddingTop: vs(14),
    paddingBottom: vs(16),
  },
  fuelSectionTitle: {
    color: colors.textStrong,
    fontSize: ms(15),
    fontWeight: '700',
    marginBottom: vs(12),
  },
  fuelInput: {
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: ms(8),
    paddingHorizontal: s(12),
    paddingVertical: Platform.OS === 'ios' ? vs(11) : vs(8),
    fontSize: ms(13),
    color: colors.textStrong,
    marginBottom: vs(10),
  },
  fuelPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: ms(8),
    paddingHorizontal: s(12),
    marginBottom: vs(12),
  },
  fuelPriceCurrency: {
    color: colors.textStrong,
    fontSize: ms(18),
    fontWeight: '700',
    marginRight: s(6),
  },
  fuelPriceInput: {
    flex: 1,
    paddingVertical: Platform.OS === 'ios' ? vs(11) : vs(8),
    fontSize: ms(18),
    fontWeight: '600',
    color: colors.textStrong,
  },
  fuelPriceUnit: {
    color: colors.textMuted,
    fontSize: ms(12),
    marginLeft: s(6),
  },
  fuelChipsRow: {
    flexDirection: 'row',
    marginBottom: vs(16),
  },
  fuelChip: {
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: ms(8),
    paddingVertical: vs(7),
    paddingHorizontal: s(12),
    marginRight: s(8),
  },
  fuelChipActive: {
    borderColor: colors.accentBlue,
    backgroundColor: colors.blue500Alpha20,
  },
  fuelChipText: {
    color: colors.textStrong,
    fontSize: ms(12),
    fontWeight: '600',
  },
  fuelChipTextActive: {color: colors.accentBlue},
  fuelSubmitBtn: {
    backgroundColor: colors.primary,
    borderRadius: ms(8),
    paddingVertical: vs(13),
    alignItems: 'center',
  },
  fuelSubmitBtnDisabled: {backgroundColor: colors.textMuted},
  fuelSubmitText: {color: colors.white, fontSize: ms(14), fontWeight: '700'},

  // ── Hours of Service panel (stepper) ──────────────────────────────────
  hosBodyContent: {
    paddingTop: Platform.OS === 'android' ? vs(8) : vs(12),
    paddingBottom: Platform.OS === 'android' ? 0 : vs(4),
    paddingHorizontal: s(14),
  },
  // The docked cap and the stretched fill are separate styles, for the reason
  // spelled out on `chatBodyDocked`: switching one style object's `maxHeight`
  // back to undefined does not reliably clear it.
  hosBodyDocked: {maxHeight: vs(260)},
  // Stretched: the steps take everything left above the footer.
  hosBodyFullscreen: {flex: 1},
  hosStep: {flexDirection: 'row'},
  hosBulletCol: {alignItems: 'center', width: ms(20)},
  hosBullet: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    borderWidth: ms(2),
    borderColor: colors.border_Color,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hosBulletDone: {
    borderColor: colors.accentBlue,
    backgroundColor: colors.accentBlue,
  },
  // The one step the driver can act on: ringed rather than filled, so it reads
  // as outstanding next to the filled ticks of the steps already cleared.
  hosBulletActive: {borderColor: colors.primary, backgroundColor: colors.white},
  hosBulletCheck: {color: colors.white, fontSize: ms(11), fontWeight: '700'},
  hosConnector: {
    flex: 1,
    width: ms(2),
    minHeight: Platform.OS === 'android' ? vs(10) : vs(22),
    backgroundColor: colors.border_Color,
    marginVertical: vs(2),
  },
  hosStepTexts: {
    flex: 1,
    paddingLeft: s(10),
    paddingBottom: Platform.OS === 'android' ? vs(6) : vs(10),
  },
  // Title and its timestamp share a line; the title takes what is left after
  // the time, and wraps rather than pushing the time off the row.
  hosStepHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  hosStepTitle: {
    flex: 1,
    color: colors.textStrong,
    fontSize: ms(13),
    fontWeight: '700',
  },
  hosStepTime: {
    color: colors.textMuted,
    fontSize: ms(10),
    paddingLeft: s(8),
    paddingTop: vs(2),
  },
  hosStepTitleDone: {color: colors.accentBlue},
  hosStepTitleActive: {color: colors.primary},
  hosStepDetail: {color: colors.textMuted, fontSize: ms(11), marginTop: vs(2)},
  hosFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border_Color,
    paddingHorizontal: s(14),
    paddingVertical: vs(10),
  },
  hosFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(6),
  },
  hosFooterText: {color: colors.textMuted, fontSize: ms(11)},
  hosFooterPct: {color: colors.success, fontSize: ms(12), fontWeight: '700'},
  hosProgressTrack: {
    height: vs(4),
    borderRadius: ms(2),
    backgroundColor: colors.border_Color,
    overflow: 'hidden',
  },
  hosProgressFill: {
    height: '100%',
    borderRadius: ms(2),
    backgroundColor: colors.success,
  },


  stepCardWrap: {
    position: 'absolute',
    left: s(BAR_GAP),
    right: s(BAR_GAP),
    bottom: vs(BAR_GAP + 130),
    alignItems: 'flex-end',
    zIndex: 44,
  },
  stepCard: {
    width: IS_TABLET ? ms(250) : ms(205),
    backgroundColor: colors.white,
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: colors.border_Color,
    paddingHorizontal: s(12),
    paddingTop: vs(10),
    paddingBottom: vs(12),
    ...Platform.select({
      ios: {
        shadowColor: colors.textStrong,
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: {width: 0, height: 3},
      },
      android: {elevation: 8},
    }),
  },
  stepCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  stepLabel: {color: colors.textMuted, fontSize: ms(10)},
  stepTitle: {
    color: colors.textStrong,
    fontSize: ms(12),
    fontWeight: 'bold',
    marginTop: vs(2),
    marginBottom: vs(10),
  },
  stepConfirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: ms(8),
    paddingVertical: vs(6),
    alignItems: 'center',
  },
  stepConfirmText: {color: colors.white, fontSize: ms(13), fontWeight: '700'},
  // The title sits in the header row when the card carries no "Step x of y"
  // caption, so it has to give way to the chevron rather than push it off.
  stepHeaderTitle: {flexShrink: 1, marginRight: s(8), marginTop: 0},
  stepError: {
    color: colors.danger,
    fontSize: ms(11),
    marginTop: vs(6),
    textAlign: 'center',
  },

  // Collapsed state: pill-shaped, sized to its text instead of the card width.
  stepPill: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
    backgroundColor: colors.white,
    borderRadius: ms(24),
    borderWidth: 1,
    borderColor: colors.border_Color,
    paddingLeft: s(16),
    paddingRight: s(10),
    paddingVertical: vs(8),
    ...Platform.select({
      ios: {
        shadowColor: colors.textStrong,
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: {width: 0, height: 3},
      },
      android: {elevation: 8},
    }),
  },
  // flexShrink (not flex) so the pill still hugs short titles and only gives
  // way once the text would overflow the wrap.
  stepPillTexts: {flexShrink: 1, marginRight: s(8)},
  stepPillTitle: {
    color: colors.textStrong,
    fontSize: ms(13),
    fontWeight: 'bold',
  },
  stepChevronUp: {transform: [{rotate: '180deg'}]},

  // ── Bottom trip progress ──────────────────────────────────────────────
  // Floating card, inset from all three screen edges (the component adds the
  // bottom safe-area inset on top of `bottom`). Every edge is visible now, so
  // the radius wraps all four corners and the shadow casts outward rather than
  // only upward the way it did when this was a sheet pinned to bottom: 0.
  bottomBar: {
    position: 'absolute',
    left: s(BAR_GAP),
    right: s(BAR_GAP),
    bottom: vs(BAR_GAP),
    backgroundColor: colors.white,
    paddingHorizontal: s(10),
    paddingTop: vs(12),
    paddingBottom: vs(14),
    borderRadius: ms(10),
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.textStrong,
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: {width: 0, height: 3},
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
  progressLabel: {color: colors.textStrong, fontSize: ms(13), fontWeight: '600'},
  progressPercent: {
    color: colors.textStrong,
    fontSize: ms(13),
    fontWeight: '700',
  },

  // One continuous bar for the leg being driven — the stop just cleared on the
  // left, the one being driven to on the right. The fill colour carries the
  // progress (see the ramp in TripProgressBar), so the track stays neutral.
  progressTrack: {
    height: vs(8),
    borderRadius: ms(6),
    backgroundColor: colors.border_Color,
    overflow: 'hidden',
  },
  progressFill: {height: '100%', borderRadius: ms(6)},

  progressStopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(6),
  },
  // The stop codes bracket the summary: fixed-width ends keep the middle line
  // centred on the bar however long the labels get.
  progressStopLabel: {
    width: ms(38),
    color: colors.textMuted,
    fontSize: ms(9),
  },
  progressStopLabelEnd: {textAlign: 'right'},
  progressSummary: {
    flex: 1,
    color: colors.textMuted,
    fontSize: ms(10),
    textAlign: 'center',
  },
  // A routing failure takes the same slot — this is the only place it can be
  // reported now that the trip card is gone.
  progressSummaryError: {color: colors.danger},

  endTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.danger,
    borderRadius: ms(8),
    paddingVertical: vs(5),
    paddingHorizontal: s(10),
  },
  endTripCheckbox: {
    width: ms(14),
    height: ms(14),
    borderRadius: ms(3),
    borderWidth: 1.5,
    borderColor: colors.danger,
    marginRight: s(8),
  },
  endTripText: {
    color: colors.danger,
    fontSize: ms(13),
    fontWeight: '700',
  },

  // ── Stop verification (pickup / drop) ─────────────────────────────────
  // Sits above the trip-progress card; the component adds that card's measured
  // height and the bottom safe-area inset on top of this offset.
  verifyActionBtn: {
    position: 'absolute',
    left: s(BAR_GAP),
    right: s(BAR_GAP),
    bottom: vs(BAR_GAP),
    backgroundColor: colors.primary,
    borderRadius: ms(10),
    paddingVertical: IS_TABLET ? vs(10) : vs(15),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 45,
    ...Platform.select({
      ios: {
        shadowColor: colors.textStrong,
        shadowOpacity: 0.18,
        shadowRadius: 10,
        shadowOffset: {width: 0, height: 4},
      },
      android: {elevation: 9},
    }),
  },
  verifyActionText: {
    color: colors.white,
    fontSize: ms(15),
    fontWeight: '700',
    letterSpacing: 0.6,
  },

  // The sheet's own code row — same boxes as the POD flow, tighter spacing.
  verifyOtpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: vs(12),
  },
  // Why the code was rejected, between the boxes and the resend link.
  verifyError: {
    color: colors.danger,
    fontSize: ms(11),
    fontWeight: '600',
    marginBottom: vs(8),
  },
  // A new code went out — the good-news counterpart to `verifyError`, which
  // sits in the same slot and is why this carries the same metrics.
  verifyNotice: {
    color: colors.success,
    fontSize: ms(11),
    fontWeight: '600',
    marginBottom: vs(8),
  },
  verifyResend: {
    color: colors.textStrong,
    fontSize: ms(11),
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginBottom: vs(16),
  },
  // Resend locked: in flight, or a verify is. Greyed and un-underlined, so it
  // does not read as a link while it cannot be tapped.
  verifyResendDisabled: {
    color: colors.textMuted,
    textDecorationLine: 'none',
  },

  // "Shipment Procured" confirmation card
  verifyDoneOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blackAlpha45,
  },
  verifyDoneCard: {
    width: IS_TABLET ? ms(320) : ms(268),
    backgroundColor: colors.white,
    borderRadius: ms(6),
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.textStrong,
        shadowOpacity: 0.2,
        shadowRadius: 14,
        shadowOffset: {width: 0, height: 6},
      },
      android: {elevation: 12},
    }),
  },
  verifyDoneHeader: {
    backgroundColor: colors.primary,
    paddingVertical: vs(10),
    paddingHorizontal: s(14),
  },
  verifyDoneHeaderText: {
    color: colors.white,
    fontSize: ms(13),
    fontWeight: '700',
  },
  verifyDoneBody: {
    alignItems: 'center',
    paddingVertical: vs(24),
    paddingHorizontal: s(16),
  },
  verifyDoneBadge: {
    width: ms(46),
    height: ms(46),
    borderRadius: ms(23),
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(14),
  },
  verifyDoneTitle: {
    color: colors.textStrong,
    fontSize: ms(12),
    fontWeight: '700',
    textAlign: 'center',
  },
  verifyDoneSub: {
    color: colors.textMuted,
    fontSize: ms(9),
    marginTop: vs(4),
    textAlign: 'center',
  },

  // ── Proof-of-Delivery modal ───────────────────────────────────────────
  podOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.blackAlpha45,
  },
  podSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: ms(20),
    borderTopRightRadius: ms(20),
    paddingHorizontal: s(18),
    paddingTop: vs(18),
    paddingBottom: vs(20),
  },

  // Stepper
  podStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(16),
  },
  podStepCircle: {
    width: ms(26),
    height: ms(26),
    borderRadius: ms(13),
    backgroundColor: colors.border_Color,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podStepCircleActive: {backgroundColor: colors.accentBlue},
  podStepCircleDone: {backgroundColor: colors.accentBlue},
  podStepNum: {color: colors.textMuted, fontSize: ms(12), fontWeight: '700'},
  podStepNumActive: {color: colors.white},
  podStepLine: {
    width: s(26),
    height: vs(2),
    backgroundColor: colors.border_Color,
    marginHorizontal: s(2),
  },
  podStepLineActive: {backgroundColor: colors.accentBlue},

  // Headings
  podStepLabel: {color: colors.textMuted, fontSize: ms(11), marginBottom: vs(4)},
  podTitle: {color: colors.textStrong, fontSize: ms(16), fontWeight: 'bold', marginBottom: vs(6)},
  podDesc: {
    color: colors.textMuted,
    fontSize: ms(12),
    lineHeight: ms(17),
    marginTop: vs(4),
    marginBottom: vs(14),
  },

  // Location / Load info card
  podInfoCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: ms(8),
    paddingVertical: vs(10),
    paddingHorizontal: s(14),
    marginBottom: vs(14),
  },
  // A gutter so the leg's two towns never run into the load beside them.
  podInfoCol: {flex: 1, paddingRight: s(8)},
  podInfoLabel: {color: colors.textMuted, fontSize: ms(11), marginBottom: vs(2)},
  podInfoValue: {color: colors.textStrong, fontSize: ms(13), fontWeight: '600'},

  // Photo capture box
  podPhotoBox: {
    borderWidth: 1.5,
    borderColor: colors.border_Color,
    borderStyle: 'dashed',
    borderRadius: ms(8),
    height: vs(110),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(16),
    overflow: 'hidden',
  },
  podRequiredBadge: {
    position: 'absolute',
    top: vs(8),
    left: s(8),
    backgroundColor: colors.red50,
    borderRadius: ms(4),
    borderColor:colors.danger,
    borderWidth:ms(1),
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
  },
  podRequiredText: {color: colors.danger, fontSize: ms(9), fontWeight: '600'},
  podPhotoHint: {color: colors.textMuted, fontSize: ms(12), marginTop: vs(6)},
  podPhotoImage: {...StyleSheet.absoluteFillObject},

  // Success (captured) box
  podSuccessBox: {
    backgroundColor: colors.success,
    borderRadius: ms(8),
    height: vs(110),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: vs(16),
  },
  podSuccessText: {
    color: colors.success,
    fontSize: ms(13),
    fontWeight: '700',
  },
  podRetake: {
    color: colors.textStrong,
    fontSize: ms(11),
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginTop: vs(4),
  },

  // OTP
  podOtpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: vs(14),
  },
  podOtpBox: {
    width: ms(40),
    height: ms(46),
    borderWidth: 1.5,
    borderColor: colors.border_Color,
    borderRadius: ms(8),
    marginHorizontal: s(4),
    textAlign: 'center',
    fontSize: ms(18),
    fontWeight: '700',
    color: colors.textStrong,
    padding: 0,
  },
  podOtpBoxFilled: {borderColor: colors.accentBlue},
  podOtpExpiry: {
    color: colors.textMuted,
    fontSize: ms(11),
    textAlign: 'center',
  },
  podResend: {
    color: colors.textStrong,
    fontSize: ms(11),
    fontWeight: '600',
    textDecorationLine: 'underline',
    textAlign: 'center',
    marginTop: vs(2),
    marginBottom: vs(8),
  },

  // Confirmation summary table
  podSummary: {
    borderRadius: ms(8),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border_Color,
    marginBottom: vs(16),
  },
  podSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: vs(9),
    paddingHorizontal: s(12),
    backgroundColor: colors.white,
  },
  podSummaryRowAlt: {backgroundColor: colors.white},
  podSummaryKey: {color: colors.textMuted, fontSize: ms(12)},
  podSummaryVal: {color: colors.textStrong, fontSize: ms(12), fontWeight: '600'},

  // Why the last upload was turned down — sits between the photo and the
  // button that will retry it.
  podError: {
    color: colors.danger,
    fontSize: ms(11),
    fontWeight: '600',
    marginBottom: vs(8),
  },

  // Action buttons
  podPrimaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: ms(8),
    paddingVertical:IS_TABLET ? vs(8) : vs(15),
    alignItems: 'center',
    marginBottom: vs(8),
  },
  podPrimaryBtnDisabled: {backgroundColor: colors.textMuted},
  podPrimaryText: {color: colors.white, fontSize: ms(14), fontWeight: '700'},
  podSecondaryBtn: {
    backgroundColor: colors.border_Color,
    borderRadius: ms(8),
    paddingVertical: IS_TABLET ? vs(8) : vs(15),
    alignItems: 'center',
  },
  podSecondaryBtnDisabled: {opacity: 0.6},
  podSecondaryText: {color: colors.textMuted, fontSize: ms(14), fontWeight: '600'},

  // Inline camera (over the photo box)
  podCameraFeed: {...StyleSheet.absoluteFillObject, overflow: 'hidden'},
  podShutter: {
    position: 'absolute',
    bottom: vs(8),
    alignSelf: 'center',
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: colors.white,
    borderWidth: ms(3),
    borderColor: colors.whiteAlpha20,
  },

  // ── Captured photo preview (dashed green frame + "Tap to expand") ─────
  podPreviewBox: {
    borderWidth: 1.5,
    borderColor: colors.success,
    borderStyle: 'dashed',
    borderRadius: ms(8),
    height: vs(110),
    padding: ms(6),
    marginBottom: vs(16),
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  podPreviewImage: {
    ...StyleSheet.absoluteFillObject,
    margin: ms(6),
    borderRadius: ms(4),
    width: undefined,
    height: undefined,
  },
  podPreviewOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podExpandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentBlue,
    borderRadius: ms(10),
    paddingHorizontal: s(8),
    paddingVertical: vs(4),
  },
  podExpandText: {
    color: colors.white,
    fontSize: ms(10),
    fontWeight: '700',
    marginLeft: s(6),
  },
  podRetakePhoto: {
    color: colors.textStrong,
    fontSize: ms(12),
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginTop: vs(8),
  },

  // ── Full-screen camera ────────────────────────────────────────────────
  podCamRoot: {flex: 1, backgroundColor: colors.textStrong},
  podCamEmpty: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podCamEmptyText: {color: colors.white, fontSize: ms(13)},
  podCamTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: s(18),
    paddingBottom: vs(12),
    backgroundColor: colors.blackAlpha45,
  },
  podCamTitle: {
    flex: 1,
    color: colors.white,
    fontSize: ms(15),
    fontWeight: '700',
    marginRight: s(12),
  },
  podCamClose: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(17),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.whiteAlpha20,
  },
  podCamBottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: vs(18),
    paddingHorizontal: s(18),
    alignItems: 'center',
    backgroundColor: colors.blackAlpha45,
  },
  podCamShutter: {
    width: IS_TABLET ? ms(54) : ms(72),
    height: IS_TABLET ? ms(54) : ms(72),
    borderRadius: IS_TABLET ? ms(27) : ms(36),
    borderWidth: IS_TABLET ? ms(3) : ms(4),
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podCamShutterBusy: {opacity: 0.5},
  podCamShutterInner: {
    width: IS_TABLET ? ms(42) : ms(56),
    height: IS_TABLET ? ms(42) : ms(56),
    borderRadius: IS_TABLET ? ms(21) : ms(28),
    backgroundColor: colors.white,
  },
  podCamActions: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  podCamRetakeBtn: {
    flex: 1,
    borderRadius: ms(8),
    paddingVertical: vs(13),
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.white,
    marginRight: s(10),
  },
  podCamRetakeText: {color: colors.white, fontSize: ms(14), fontWeight: '700'},
  podCamSaveBtn: {
    flex: 1,
    borderRadius: ms(8),
    paddingVertical: vs(13),
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  podCamSaveText: {color: colors.white, fontSize: ms(14), fontWeight: '700'},

  // ── Full-screen photo preview (zoom + Retake / Use this Photo) ────────
  podPvRoot: {flex: 1, backgroundColor: colors.textStrong},
  // The photo fills the screen; the close button and footer float over it.
  podPvImageClip: {flex: 1, overflow: 'hidden'},
  podPvImage: {width: '100%', height: '100%'},
  podPvClose: {
    position: 'absolute',
    right: s(16),
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blackAlpha45,
  },
  podPvFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: vs(16),
    paddingHorizontal: s(16),
    backgroundColor: colors.blackAlpha45,
  },
  podPvHintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.accentBlue,
    borderRadius: ms(10),
    paddingHorizontal: s(12),
    paddingVertical: vs(5),
  },
  podPvHintText: {
    color: colors.accentBlue,
    fontSize: ms(12),
    fontWeight: '600',
    marginLeft: s(4),
  },
  podPvActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(14),
  },
  podPvRetakeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: ms(10),
    paddingVertical: IS_TABLET ? vs(8) : vs(14),
    marginRight: s(10),
  },
  podPvRetakeText: {
    color: colors.textStrong,
    fontSize: IS_TABLET ? ms(18) : ms(14),
    fontWeight: '700',
    marginLeft: s(5),
  },
  podPvUseBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: ms(10),
    paddingVertical: IS_TABLET ? vs(8) : vs(14),
  },
  podPvUseText: {
    color: colors.white,
    fontSize: IS_TABLET ? ms(18) : ms(14),
    fontWeight: '700',
    marginLeft: s(5),
  },

  // ── Call panel ────────────────────────────────────────────────────────
  // Docked against the right edge, at the same width as the chat / fuel
  // panels. It used to be wider to keep the name + role + call button on one
  // line; the row stacks the contact's numbers under that line now, so the
  // extra width bought nothing and the panel covered more of the map.
  callPanelWrap: {
    width: PANEL_WIDTH,
    alignSelf: 'flex-end',
    top: IS_TABLET ? vs(230) : Platform.OS === 'ios' ? vs(240) : vs(260),
    right: s(1),
  },
  callBody: {maxHeight: vs(260)},
  callBodyContent: {paddingBottom: vs(4)},

  // A column, not a row: the name and the button share the top line and the
  // contact's numbers stack under them. Side by side they would not fit the
  // docked panel's width without truncating the numbers to nothing.
  callRow: {
    paddingHorizontal: s(10),
    paddingVertical: vs(8),
    backgroundColor: colors.white,
  },
  callRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callRowName: {
    flex: 1,
    color: colors.textStrong,
    fontSize: ms(11),
    fontWeight: '600',
  },
  callRowRole: {
    color: colors.textMuted,
    fontSize: ms(10),
    marginLeft: s(8),
    textAlign: 'right',
  },
  // "Primary · +9198…" — shown so the driver knows which lines exist before
  // tapping, though the number they reach is the bridge's, not this one.
  callRowPhone: {
    color: colors.textMuted,
    fontSize: ms(10),
    marginTop: vs(3),
  },
  callRowBtn: {
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: s(8),
  },

  callGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.screenBg,
    paddingHorizontal: s(10),
    paddingVertical: vs(6),
  },
  callGroupBadge: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(8),
  },
  // Drops get the red badge; pickups keep the green one above.
  callGroupBadgeDrop: {backgroundColor: colors.danger},
  callGroupBadgeText: {
    color: colors.white,
    fontSize: ms(9),
    fontWeight: '700',
  },
  callGroupLabel: {
    flex: 1,
    color: colors.primary,
    fontSize: ms(11),
    fontWeight: '700',
  },
  // The slot the spinner, the fetch's error and "no contacts" all share, so
  // the panel keeps its height whichever of the three it is showing.
  callStateBox: {
    minHeight: vs(70),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(16),
    paddingVertical: vs(14),
    backgroundColor: colors.white,
  },
  callStateText: {
    color: colors.textMuted,
    fontSize: ms(11),
    textAlign: 'center',
  },

  // ── Primary / alternate picker ────────────────────────────────────────
  // A centred modal rather than a bottom sheet: the panel it is opened from
  // is docked to the right edge, and a sheet rising from the bottom would sit
  // over the progress bar the driver is mid-trip on.
  callSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.blackAlpha45,
  },
  callSheetWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(28),
  },
  callSheet: {
    width: '100%',
    maxWidth: IS_TABLET ? ms(420) : ms(330),
    borderRadius: ms(14),
    backgroundColor: colors.white,
    paddingHorizontal: s(16),
    paddingTop: vs(16),
    paddingBottom: vs(12),
  },
  callSheetTitle: {
    color: colors.primary,
    fontSize: ms(15),
    fontWeight: '700',
  },
  callSheetSubtitle: {
    color: colors.textMuted,
    fontSize: ms(11),
    marginTop: vs(2),
    marginBottom: vs(12),
  },

  callSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: ms(10),
    paddingHorizontal: s(12),
    paddingVertical: vs(10),
    marginBottom: vs(8),
  },
  callSheetOptionActive: {
    borderColor: colors.accentBlue,
    backgroundColor: colors.white,
  },
  callSheetRadio: {
    width: ms(18),
    height: ms(18),
    borderRadius: ms(9),
    borderWidth: 2,
    borderColor: colors.border_Color,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
  },
  callSheetRadioOn: {borderColor: colors.accentBlue},
  callSheetRadioDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    backgroundColor: colors.accentBlue,
  },
  callSheetOptionTexts: {flex: 1},
  callSheetOptionLabel: {
    color: colors.primary,
    fontSize: ms(11),
    fontWeight: '700',
  },
  callSheetOptionPhone: {
    color: colors.textStrong,
    fontSize: ms(13),
    marginTop: vs(2),
  },

  callSheetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: vs(4),
  },
  callSheetCancel: {
    paddingHorizontal: s(14),
    paddingVertical: vs(9),
  },
  callSheetCancelText: {
    color: colors.textMuted,
    fontSize: ms(12),
    fontWeight: '600',
  },
  callSheetConfirm: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    borderRadius: ms(20),
    paddingHorizontal: s(18),
    paddingVertical: vs(9),
    marginLeft: s(6),
  },
  callSheetConfirmText: {
    color: colors.white,
    fontSize: ms(12),
    fontWeight: '700',
    marginLeft: s(7),
  },
});
