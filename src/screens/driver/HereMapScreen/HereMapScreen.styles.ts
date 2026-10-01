import {Platform, StyleSheet} from 'react-native';
import {moderateScale, verticalScale, scale} from 'react-native-size-matters';
import {colors} from '../../../theme/colors';

export default StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.textStrong},

  // ── Top / Map area ──────────────────────────────────────────────────────
  topArea: {
    flex: 0.55,
    position: 'relative',
    backgroundColor: colors.textStrong,
  },
  map: {
    flex: 1,
    borderBottomLeftRadius: moderateScale(24),
    borderBottomRightRadius: moderateScale(24),
    overflow: 'hidden',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.textStrong,
  },
  loadingText: {color: colors.textMuted, fontSize: moderateScale(14)},

  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 999,
    paddingTop: verticalScale(14),
    paddingHorizontal: scale(12),
  },

  // Search button (shown when not navigating)
  searchButtonRow: {
    marginTop: verticalScale(10),
    paddingHorizontal: scale(4),
  },
  searchButton: {
    width: '100%',
    backgroundColor: colors.whiteAlpha20,
    borderColor: colors.whiteAlpha20,
    borderWidth: 1,
    borderRadius: moderateScale(16),
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(16),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: scale(8),
  },
  searchButtonText: {
    color: colors.white,
    fontSize: moderateScale(15),
    fontWeight: '700',
  },

  // GPS + Re-center buttons
  gpsButton: {
    position: 'absolute',
    left: scale(16),
    bottom: verticalScale(16),
    width: scale(52),
    height: scale(52),
    borderRadius: moderateScale(26),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: moderateScale(8),
    shadowColor: colors.accentBlue,
    shadowOffset: {width: 0, height: verticalScale(2)},
    shadowOpacity: 0.4,
    shadowRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: colors.blue500Alpha20,
  },
  gpsButtonNavigating: {
    bottom: verticalScale(16),
    left: scale(16),
    right: 'auto',
  },

  // Map look (day / night / satellite / traffic). Bottom-right, opposite the
  // GPS and marker buttons; MapStyleControl brings its own button shell so this
  // only places it.
  mapStyleButton: {
    right: scale(16),
    bottom: verticalScale(16),
    zIndex: 999,
  },

  reCenterButton: {
    position: 'absolute',
    left: scale(16),
    right: 'auto',
    bottom: verticalScale(76),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.overlayDarkMidStrong,
    borderRadius: moderateScale(20),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(14),
    zIndex: 999,
    elevation: moderateScale(8),
    borderWidth: 1,
    borderColor: colors.accentBlue,
    shadowColor: colors.accentBlue,
    shadowOffset: {width: 0, height: verticalScale(2)},
    shadowOpacity: 0.35,
    shadowRadius: moderateScale(6),
  },
  reCenterIcon: {
    color: colors.accentBlue,
    fontSize: moderateScale(18),
    marginRight: scale(5),
    lineHeight: moderateScale(20),
  },
  reCenterLabel: {
    color: colors.border_Color,
    fontSize: moderateScale(13),
    fontWeight: '600',
  },

  // ── Compass (reset-to-north) ──────────────────────────────────────────────
  compassButton: {
    position: 'absolute',
    top: verticalScale(14),
    right: scale(14),
    width: scale(46),
    height: scale(46),
    borderRadius: moderateScale(23),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: moderateScale(8),
    shadowColor: colors.accentBlue,
    shadowOffset: {width: 0, height: verticalScale(2)},
    shadowOpacity: 0.35,
    shadowRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: colors.blue500Alpha20,
  },

  // ── Navigation-mode bottom panel ──────────────────────────────────────────
  navPanel: {
    flex: 1,
    backgroundColor: colors.whiteAlpha20,
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: colors.whiteAlpha20,
    padding: moderateScale(16),
    justifyContent: 'space-between',
  },

  sheetHandle: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(6),
    marginBottom: verticalScale(4),
  },
  sheetHandleBar: {
    width: scale(44),
    height: verticalScale(5),
    borderRadius: moderateScale(3),
    backgroundColor: colors.whiteAlpha20,
    marginBottom: verticalScale(4),
  },
  sheetHandleLabel: {
    color: colors.textMuted,
    fontSize: moderateScale(11),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sheetBody: {
    flex: 1,
    overflow: 'hidden', // clips content when collapsed
  },

  // Small "directions" button inside the nav panel → opens turn-by-turn modal
  navDirectionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.whiteAlpha20,
    borderWidth: 1,
    borderColor: colors.blue500Alpha20,
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(14),
    marginBottom: verticalScale(10),
  },
  navDirectionsIcon: {
    fontSize: moderateScale(18),
    marginRight: scale(10),
  },
  navDirectionsText: {
    flex: 1,
    color: colors.border_Color,
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  navDirectionsChevron: {
    color: colors.accentBlue,
    fontSize: moderateScale(22),
    fontWeight: '700',
  },
  navTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // 🔥 pushes left & right
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  navSpeedHero: {
    alignItems: 'center',
    flexDirection: 'row',
    // justifyContent: 'center',
    paddingVertical: verticalScale(6),
  },
  navSpeedValue: {
    color: colors.white,
    fontSize: moderateScale(48),
    fontWeight: '800',
    lineHeight: moderateScale(52),
  },
  navSpeedUnit: {
    color: colors.textMuted,
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginLeft: scale(6),
    marginBottom: verticalScale(6),
  },
  navStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.whiteAlpha20,
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: colors.blue500Alpha20,
    paddingVertical: verticalScale(12),
    marginVertical: verticalScale(10),
  },
  navStatItem: {flex: 1, alignItems: 'center'},
  navStatValue: {
    color: colors.accentBlue,
    fontSize: moderateScale(16),
    fontWeight: '800',
  },
  navStatLabel: {
    color: colors.textMuted,
    fontSize: moderateScale(11),
    fontWeight: '600',
    marginTop: verticalScale(3),
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  navStatDivider: {
    width: 1,
    height: verticalScale(30),
    backgroundColor: colors.blue500Alpha20,
  },
  navMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(4),
    marginBottom: verticalScale(120),
  },
  navMetaLabel: {
    color: colors.textMuted,
    fontSize: moderateScale(11),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: verticalScale(2),
  },
  navMetaValue: {
    color: colors.border_Color,
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  navTollValue: {
    color: colors.success,
    fontSize: moderateScale(15),
    fontWeight: '800',
  },
  navStopBtn: {
    backgroundColor: colors.danger,
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
  },
  navStopBtnText: {
    color: colors.white,
    fontSize: moderateScale(15),
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ── Bottom area ─────────────────────────────────────────────────────────
  bottomArea: {
    flex: 0.45,
    backgroundColor: colors.textStrong,
    paddingHorizontal: scale(10),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(20),
  },

  // Placeholder (no destination selected)
  placeholderCard: {
    flex: 1,
    backgroundColor: colors.whiteAlpha20,
    borderRadius: moderateScale(22),
    borderWidth: 1,
    borderColor: colors.whiteAlpha20,
    padding: moderateScale(18),
    justifyContent: 'center',
  },
  placeholderTitle: {
    color: colors.white,
    fontSize: moderateScale(18),
    fontWeight: '700',
    marginBottom: verticalScale(8),
  },
  placeholderText: {
    color: colors.border_Color,
    fontSize: moderateScale(13),
    lineHeight: moderateScale(20),
  },

  // Details container (destination selected)
  detailsContainer: {
    flex: 1,
    backgroundColor: colors.red50,
    borderRadius: moderateScale(20),
    overflow: 'hidden',
  },

  // Controls bar (Camera / Markers / Route / Navigate / Clear)
  bottomControlsBar: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(6),
    backgroundColor: colors.textStrong,
  },

  // Details header
  detailsHeader: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    backgroundColor: colors.blue500Alpha20,
    borderBottomWidth: 1,
    borderBottomColor: colors.blue500Alpha20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsTitle: {
    color: colors.accentBlue,
    fontSize: moderateScale(12),
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Detail rows (From / To / Distance / Duration / Toll)
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: colors.whiteAlpha20,
  },
  detailLabel: {
    color: colors.textStrong,
    fontSize: moderateScale(12),
    fontWeight: '700',
    flex: 0.4,
  },
  detailValue: {
    color: colors.textStrong,
    fontSize: moderateScale(13),
    fontWeight: '600',
    flex: 0.6,
    textAlign: 'right',
  },
  tollValueClickable: {
    color: colors.accentBlue,
    fontSize: moderateScale(12),
    textDecorationLine: 'underline',
  },

  // Summary card (3-column: Distance | Time | Toll)
  routeSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.whiteAlpha20,
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: colors.blue500Alpha20,
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(10),
    marginHorizontal: scale(8),
    marginVertical: verticalScale(10),
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    color: colors.accentBlue,
    fontSize: moderateScale(12),
    fontWeight: '700',
    marginBottom: verticalScale(5),
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryValue: {
    color: colors.accentBlue,
    fontSize: moderateScale(15),
    fontWeight: '800',
  },
  summaryValueToll: {
    color: colors.success,
    fontSize: moderateScale(15),
    fontWeight: '800',
    // textDecorationLine: 'underline',
  },
  summaryDivider: {
    width: 1,
    height: verticalScale(36),
    backgroundColor: colors.blue500Alpha20,
    marginHorizontal: scale(10),
  },

  loadingDetails: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(24),
  },

  // ── Turn-by-turn panel ──────────────────────────────────────────────────
  turnByTurnPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Turn panel inner (rendered by TurnByTurnPanel component)
  turnPanelContainer: {
    backgroundColor: colors.overlayDarkMidStrong,
    borderTopWidth: 1,
    borderTopColor: colors.blue500Alpha20,
    borderRadius: moderateScale(12),
    padding: verticalScale(10),
    marginHorizontal: scale(10),
    marginBottom: verticalScale(16),
  },
  turnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
  },
  turnIconCircle: {
    width: scale(36),
    height: scale(36),
    borderRadius: moderateScale(18),
    backgroundColor: colors.blue500Alpha20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnInfo: {flex: 1},
  turnAction: {
    color: colors.border_Color,
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  turnStreet: {
    color: colors.textMuted,
    fontSize: moderateScale(11),
    marginTop: verticalScale(2),
  },
  turnDist: {
    color: colors.accentBlue,
    fontSize: moderateScale(13),
    fontWeight: '700',
  },

  // ── Nav info bar (top overlay, navigating state) ────────────────────────
  navInfoBar: {
    backgroundColor: colors.overlayDarkMidStrong,
    borderRadius: moderateScale(14),
    borderWidth: 1,
    width: '96%',
    borderColor: colors.blue500Alpha20,
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    marginBottom: verticalScale(10),
    elevation: 8,
    shadowColor: colors.accentBlue,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    marginLeft: scale(10),
    marginTop: verticalScale(120),
  },
  navInfoEta: {alignItems: 'center', minWidth: scale(50)},
  navInfoEtaText: {
    color: colors.accentBlue,
    fontSize: moderateScale(28),
    fontWeight: '700',
    lineHeight: moderateScale(30),
  },
  navInfoEtaLabel: {
    color: colors.textMuted,
    fontSize: moderateScale(11),
    fontWeight: '500',
  },
  navInfoDivider: {
    width: scale(15),
    height: verticalScale(36),
    backgroundColor: colors.textStrong,
  },
  navInfoDetails: {flex: 1},
  navInfoDistText: {
    color: colors.border_Color,
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  navInfoArrivalText: {
    color: colors.textMuted,
    fontSize: moderateScale(12),
    marginTop: verticalScale(2),
  },
  navStopButton: {
    backgroundColor: colors.danger,
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(14),
  },
  navStopButtonText: {
    color: colors.white,
    fontSize: moderateScale(13),
    fontWeight: '700',
  },

  // ── Toolbar buttons (Camera / Markers / Route / Navigate / Clear) ───────
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.successLight,
    paddingVertical: verticalScale(8),
    paddingHorizontal: Platform.OS === 'ios' ? scale(1) : scale(4),
    justifyContent: 'space-around',
    borderTopWidth: moderateScale(1),
    borderTopColor: colors.textStrong,
    borderRadius: moderateScale(12),
  },
  button: {
    backgroundColor: colors.textStrong,
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(7),
    paddingHorizontal: scale(10),
    margin: moderateScale(3),
    borderWidth: 1,
    borderColor: colors.textMuted,
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  buttonHighlight: {backgroundColor: colors.danger, borderColor: colors.danger},
  buttonText: {
    color: colors.textMuted,
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  buttonTextHighlight: {color: colors.white},

  // ── Toll modal ──────────────────────────────────────────────────────────
  tollModalOverlay: {
    flex: 1,
    backgroundColor: colors.textMuted,
    justifyContent: 'flex-end',
  },
  tollModalContent: {
    backgroundColor: colors.textStrong,
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    maxHeight: '80%',
    paddingTop: verticalScale(16),
    borderTopWidth: 1,
    borderTopColor: colors.whiteAlpha20,
  },
  tollModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(18),
    paddingBottom: verticalScale(14),
    borderBottomWidth: 1,
    borderBottomColor: colors.whiteAlpha20,
  },
  tollModalTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: colors.accentBlue,
  },
  tollModalClose: {
    fontSize: moderateScale(22),
    color: colors.textMuted,
    fontWeight: '500',
    paddingHorizontal: scale(4),
  },
  tollModalScroll: {
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(12),
  },
  tollItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(12),
    marginBottom: verticalScale(8),
    borderRadius: moderateScale(12),
    backgroundColor: colors.whiteAlpha20,
    borderWidth: 1,
    borderColor: colors.blue500Alpha20,
  },
  tollItemLeft: {flex: 1},
  tollItemName: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: colors.border_Color,
  },
  tollItemRoad: {
    fontSize: moderateScale(11),
    color: colors.textMuted,
    marginTop: verticalScale(2),
  },
  tollItemAmount: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: colors.accentBlue,
  },
  tollItemTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: verticalScale(14),
    paddingHorizontal: scale(12),
    marginTop: verticalScale(8),
    marginBottom: verticalScale(12),
    borderRadius: moderateScale(14),
    backgroundColor: colors.whiteAlpha20,
    borderWidth: 2,
    borderColor: colors.success,
  },
  tollItemTotalLabel: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: colors.success,
  },
  tollItemTotalAmount: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: colors.success,
  },
  tollModalNote: {
    fontSize: moderateScale(11),
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingBottom: verticalScale(12),
  },

  // ── Turn-by-turn modal ──────────────────────────────────────────────────
  turnModalOverlay: {
    flex: 1,
    backgroundColor: colors.textMuted,
    justifyContent: 'flex-end',
  },
  turnModalContent: {
    backgroundColor: colors.textStrong,
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    maxHeight: '80%',
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(16),
    borderTopWidth: 1,
    borderTopColor: colors.whiteAlpha20,
  },
  turnModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(18),
    paddingBottom: verticalScale(14),
    borderBottomWidth: 1,
    borderBottomColor: colors.whiteAlpha20,
  },
  turnModalTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: colors.accentBlue,
  },
  // Override TurnByTurnPanel's absolute root so it renders in flow inside modal
  turnPanelInModal: {
    position: 'relative',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 0,
    paddingTop: verticalScale(4),
    paddingHorizontal: scale(8),
  },

  // Misc legacy keys kept for safety
  searchCardWrapper: {flex: 1, position: 'relative', zIndex: 1000},
  topControlsContainer: {marginTop: verticalScale(90)},
  navInfoRow: {flexDirection: 'row', alignItems: 'center'},
  routeSummaryBar: {
    backgroundColor: colors.overlayDarkMidStrong,
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(16),
    borderTopWidth: 1,
    borderTopColor: colors.textStrong,
  },
  routeSummaryText: {
    color: colors.border_Color,
    fontSize: moderateScale(13),
    fontWeight: '600',
    textAlign: 'center',
  },
  routeSummarySubText: {
    color: colors.border_Color,
    fontSize: moderateScale(11),
    textAlign: 'center',
    marginTop: verticalScale(4),
  },

  // ── Route-loading overlay ─────────────────────────────────────────────────
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlayDarkMidStrong,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingOverlayText: {
    color: colors.border_Color,
    marginTop: verticalScale(12),
    fontSize: moderateScale(15),
    fontWeight: '600',
  },

  // ── Speed + direction HUD (navigating) ────────────────────────────────────
  speedHud: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 100,
    elevation: 100,
    alignItems: 'center',
  },
  speedHudCard: {
    backgroundColor: colors.overlayDarkMidStrong,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    alignItems: 'center',
    minWidth: moderateScale(52),
    borderWidth: 1,
    borderColor: colors.whiteAlpha20,
  },
  speedHudArrow: {
    color: colors.button_color,
    fontSize: moderateScale(40),
    lineHeight: moderateScale(20),
  },
  speedHudDir: {
    color: colors.border_Color,
    fontSize: moderateScale(12),
    fontWeight: '700',
    lineHeight: moderateScale(16),
  },

  // ── Marker-icon picker FAB ────────────────────────────────────────────────
  markerPickerBtn: {
    position: 'absolute',
    left: moderateScale(14),
    bottom: verticalScale(82),
    width: verticalScale(48),
    height: verticalScale(48),
    borderRadius: verticalScale(24),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.textStrong,
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 5,
  },

  // ── Navigation bottom-panel rows ──────────────────────────────────────────
  navScrollContent: {
    paddingBottom: 1,
  },
  navMetaToCol: {
    flex: 1,
    marginRight: scale(10),
  },
  navMetaTollCol: {
    alignItems: 'flex-end',
  },

  // ── Preview-mode route details ────────────────────────────────────────────
  previewScroll: {
    flex: 1,
  },
  previewScrollContent: {
    paddingBottom: verticalScale(24),
  },
  previewCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: moderateScale(16),
    borderTopRightRadius: moderateScale(16),
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(16),
    paddingBottom: moderateScale(8),
    elevation: moderateScale(4),
  },

  // ── Marker-icon picker modal ──────────────────────────────────────────────
  markerModalOverlay: {
    flex: 1,
    backgroundColor: colors.blackAlpha45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerModalCard: {
    width: '82%',
    backgroundColor: colors.white,
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
  },
  markerModalTitle: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    color: colors.textStrong,
    marginBottom: verticalScale(4),
  },
  markerModalSubtitle: {
    fontSize: moderateScale(12),
    color: colors.textMuted,
    marginBottom: verticalScale(16),
  },
  markerModalRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  markerOption: {
    alignItems: 'center',
    paddingVertical: verticalScale(14),
    paddingHorizontal: moderateScale(18),
    borderRadius: moderateScale(12),
    borderWidth: 2,
  },
  markerOptionLabel: {
    marginTop: verticalScale(8),
    fontSize: moderateScale(13),
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // ── Map error banner ─────────────────────────────────────────────────────
  // Shown over the map when the SDK or the native surface reports a failure,
  // so a dead map always says why.
  mapErrorBanner: {
    position: 'absolute',
    top: verticalScale(14),
    left: scale(14),
    right: scale(14),
    backgroundColor: colors.red50,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: moderateScale(10),
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(12),
    zIndex: 1000,
    elevation: moderateScale(10),
  },
  mapErrorText: {
    color: colors.danger,
    fontSize: moderateScale(12),
  },

  // ── Posted speed limit (navigation) ──────────────────────────────────────
  // Circular road-sign badge, top-right. Sits where the compass does in
  // preview mode — the two are never visible at the same time.
  speedLimitBadge: {
    position: 'absolute',
    top: verticalScale(14),
    right: scale(14),
    width: scale(54),
    height: scale(54),
    borderRadius: moderateScale(27),
    borderWidth: moderateScale(4),
    borderColor: colors.border_Color,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: moderateScale(8),
  },
  speedLimitBadgeAlert: {
    borderColor: colors.danger,
  },
  speedLimitValue: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: colors.textStrong,
  },
  speedLimitUnit: {
    fontSize: moderateScale(9),
    color: colors.textMuted,
  },

  // ── Voice guidance banner ────────────────────────────────────────────────
  voiceBanner: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(10),
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(12),
    marginBottom: verticalScale(8),
  },
  voiceBannerText: {
    fontSize: moderateScale(13),
    color: colors.accentBlue,
  },

  // ── Simulated-navigation toggle ──────────────────────────────────────────
  simulateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: verticalScale(14),
    paddingTop: verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: colors.border_Color,
  },
  simulateTextCol: {
    flex: 1,
    paddingRight: moderateScale(12),
  },
  simulateLabel: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: colors.textStrong,
  },
  simulateHint: {
    marginTop: verticalScale(2),
    fontSize: moderateScale(11),
    color: colors.textMuted,
  },
});
