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

// Reveal circle: diameter = 2× screen diagonal so it fully covers the screen
// (from its centred origin) once scaled to 1.
const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');
const REVEAL_DIAMETER = Math.ceil(Math.hypot(SCREEN_W, SCREEN_H) * 2);

export default StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.navy},

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
  },

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
    paddingTop: IS_TABLET ? vs(20) : vs(40),
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
  dutyWrap: {alignItems: 'center'},
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
        shadowColor: '#000',
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
  dutyMenuTextActive: {color: colors.text_dark},

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

  // ── Side toolbar ──────────────────────────────────────────────────────
  toolbar: {
    position: 'absolute',
    left: s(14),
    top: IS_TABLET ? vs(240) : Platform.OS === 'ios' ? vs(240) : vs(260),
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
  // Collapse toggle keeps a fixed grey background regardless of state.
  collapseBtn: {backgroundColor: colors.primaryLight},

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
    paddingVertical: vs(8),
    paddingHorizontal: s(10),
    flexDirection: 'row',
    alignItems: 'center',
  },
  panelHeaderTexts: {flex: 1},
  panelTitle: {color: colors.white, fontSize: ms(14), fontWeight: '700'},
  panelSubtitle: {
    color: colors.onDarkMedium,
    fontSize: ms(10),
    marginTop: vs(1),
  },
  panelHeaderIcon: {paddingHorizontal: s(6)},
  panelHeaderIconGlyph: {color: colors.white, fontSize: ms(16)},

  // ── Chat panel ────────────────────────────────────────────────────────
  chatBody: {
    maxHeight: vs(240),
    paddingVertical: vs(10),
    paddingHorizontal: s(10),
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: ms(10),
    paddingVertical: vs(7),
    paddingHorizontal: s(10),
    marginBottom: vs(8),
  },
  bubbleIn: {
    backgroundColor: '#EEF1F5',
    alignSelf: 'flex-start',
    borderTopLeftRadius: ms(2),
  },
  bubbleOut: {
    backgroundColor: colors.accentBlue,
    alignSelf: 'flex-end',
    borderTopRightRadius: ms(2),
  },
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
    height: vs(300),
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: vs(12),
  },
  captureBtn: {
    width: ms(46),
    height: ms(46),
    borderRadius: ms(23),
    backgroundColor: colors.white,
    borderWidth: ms(3),
    borderColor: 'rgba(255,255,255,0.6)',
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
  captureLabel: {color: colors.onDarkMedium, fontSize: ms(9), marginTop: vs(6)},
  documentPreviewImage: {
    ...StyleSheet.absoluteFillObject,
  },

  // ── Bidding panel ─────────────────────────────────────────────────────
  biddingBody: {
    height: vs(190),
    alignItems: 'center',
    justifyContent: 'center',
  },
  biddingText: {color: colors.text_dark, fontSize: ms(14), fontWeight: '600'},

  // ── Hours of Service panel (stepper) ──────────────────────────────────
  hosBodyContent: {
    paddingTop: Platform.OS === 'android' ? vs(8) : vs(12),
    paddingBottom: Platform.OS === 'android' ? 0 : vs(4),
    paddingHorizontal: s(14),
  },
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
  hosStepTitle: {color: colors.text_dark, fontSize: ms(13), fontWeight: '700'},
  hosStepTitleDone: {color: colors.accentBlue},
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
  progressPercent: {
    color: colors.text_dark,
    fontSize: ms(13),
    fontWeight: '700',
  },

  track: {
    height: vs(6),
    borderRadius: ms(3),
    backgroundColor: colors.border_Color,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: ms(3),
    backgroundColor: colors.accentBlue,
  },

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
  endTripText: {
    color: colors.button_color,
    fontSize: ms(13),
    fontWeight: '700',
  },

  // ── Proof-of-Delivery modal ───────────────────────────────────────────
  podOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
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
    backgroundColor: colors.background,
    borderRadius: ms(8),
    paddingVertical: vs(10),
    paddingHorizontal: s(14),
    marginBottom: vs(14),
  },
  podInfoCol: {flex: 1},
  podInfoLabel: {color: colors.textMuted, fontSize: ms(11), marginBottom: vs(2)},
  podInfoValue: {color: colors.text_dark, fontSize: ms(13), fontWeight: '600'},

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
    backgroundColor: colors.background,
    borderRadius: ms(4),
    paddingHorizontal: s(6),
    paddingVertical: vs(2),
  },
  podRequiredText: {color: colors.textMuted, fontSize: ms(9), fontWeight: '600'},
  podPhotoHint: {color: colors.textMuted, fontSize: ms(12), marginTop: vs(6)},
  podPhotoImage: {...StyleSheet.absoluteFillObject},

  // Success (captured) box
  podSuccessBox: {
    backgroundColor: colors.success_bg,
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
    color: colors.black,
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
    color: colors.text_dark,
    padding: 0,
  },
  podOtpBoxFilled: {borderColor: colors.accentBlue},
  podOtpExpiry: {
    color: colors.textMuted,
    fontSize: ms(11),
    textAlign: 'center',
  },
  podResend: {
    color: colors.text_dark,
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
    backgroundColor: colors.background,
  },
  podSummaryRowAlt: {backgroundColor: colors.white},
  podSummaryKey: {color: colors.textMuted, fontSize: ms(12)},
  podSummaryVal: {color: colors.text_dark, fontSize: ms(12), fontWeight: '600'},

  // Action buttons
  podPrimaryBtn: {
    backgroundColor: colors.navy,
    borderRadius: ms(8),
    paddingVertical: vs(13),
    alignItems: 'center',
    marginBottom: vs(10),
  },
  podPrimaryBtnDisabled: {backgroundColor: colors.primaryLight},
  podPrimaryText: {color: colors.white, fontSize: ms(14), fontWeight: '700'},
  podSecondaryBtn: {
    backgroundColor: colors.border_Color,
    borderRadius: ms(8),
    paddingVertical: vs(13),
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
    borderColor: 'rgba(255,255,255,0.6)',
  },
});
