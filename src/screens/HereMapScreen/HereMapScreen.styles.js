import {Platform, StyleSheet} from 'react-native';
import {moderateScale, verticalScale, scale} from 'react-native-size-matters';
import {colors} from '../../theme/colors';

export default StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0f172a'},

  // ── Top / Map area ──────────────────────────────────────────────────────
  topArea: {
    flex: 0.55,
    position: 'relative',
    backgroundColor: '#0f172a',
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
    backgroundColor: '#0f172a',
  },
  loadingText: {color: '#94a3b8', fontSize: moderateScale(14)},

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
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.16)',
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
    color: '#F8FAFF',
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
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: moderateScale(8),
    shadowColor: '#3b82f6',
    shadowOffset: {width: 0, height: verticalScale(2)},
    shadowOpacity: 0.4,
    shadowRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },
  gpsButtonNavigating: {
    bottom: verticalScale(16),
    left: scale(16),
    right: 'auto',
  },

  reCenterButton: {
    position: 'absolute',
    left: scale(16),
    right: 'auto',
    bottom: verticalScale(76),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15,23,42,0.92)',
    borderRadius: moderateScale(20),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(14),
    zIndex: 999,
    elevation: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.5)',
    shadowColor: '#3b82f6',
    shadowOffset: {width: 0, height: verticalScale(2)},
    shadowOpacity: 0.35,
    shadowRadius: moderateScale(6),
  },
  reCenterIcon: {
    color: '#3b82f6',
    fontSize: moderateScale(18),
    marginRight: scale(5),
    lineHeight: moderateScale(20),
  },
  reCenterLabel: {
    color: '#e2e8f0',
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
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: moderateScale(8),
    shadowColor: '#3b82f6',
    shadowOffset: {width: 0, height: verticalScale(2)},
    shadowOpacity: 0.35,
    shadowRadius: moderateScale(6),
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.3)',
  },

  // ── Navigation-mode bottom panel ──────────────────────────────────────────
  navPanel: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: moderateScale(20),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
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
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginBottom: verticalScale(4),
  },
  sheetHandleLabel: {
    color: '#94a3b8',
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
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.25)',
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
    color: '#E2E8F0',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },
  navDirectionsChevron: {
    color: '#3B82F6',
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
    color: '#FFFFFF',
    fontSize: moderateScale(48),
    fontWeight: '800',
    lineHeight: moderateScale(52),
  },
  navSpeedUnit: {
    color: '#94A3B8',
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginLeft: scale(6),
    marginBottom: verticalScale(6),
  },
  navStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59,130,246,0.10)',
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.18)',
    paddingVertical: verticalScale(12),
    marginVertical: verticalScale(10),
  },
  navStatItem: {flex: 1, alignItems: 'center'},
  navStatValue: {
    color: '#3B82F6',
    fontSize: moderateScale(16),
    fontWeight: '800',
  },
  navStatLabel: {
    color: '#64748B',
    fontSize: moderateScale(11),
    fontWeight: '600',
    marginTop: verticalScale(3),
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  navStatDivider: {
    width: 1,
    height: verticalScale(30),
    backgroundColor: 'rgba(59,130,246,0.2)',
  },
  navMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(4),
    marginBottom: verticalScale(120),
  },
  navMetaLabel: {
    color: '#64748B',
    fontSize: moderateScale(11),
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: verticalScale(2),
  },
  navMetaValue: {
    color: '#E2E8F0',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  navTollValue: {
    color: '#10B981',
    fontSize: moderateScale(15),
    fontWeight: '800',
  },
  navStopBtn: {
    backgroundColor: '#DC2626',
    borderRadius: moderateScale(14),
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(14),
  },
  navStopBtnText: {
    color: '#FFFFFF',
    fontSize: moderateScale(15),
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ── Bottom area ─────────────────────────────────────────────────────────
  bottomArea: {
    flex: 0.45,
    backgroundColor: '#0f172a',
    paddingHorizontal: scale(10),
    paddingTop: verticalScale(8),
    paddingBottom: verticalScale(20),
  },

  // Placeholder (no destination selected)
  placeholderCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: moderateScale(22),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: moderateScale(18),
    justifyContent: 'center',
  },
  placeholderTitle: {
    color: '#FFFFFF',
    fontSize: moderateScale(18),
    fontWeight: '700',
    marginBottom: verticalScale(8),
  },
  placeholderText: {
    color: '#CBD5E1',
    fontSize: moderateScale(13),
    lineHeight: moderateScale(20),
  },

  // Details container (destination selected)
  detailsContainer: {
    flex: 1,
    backgroundColor: 'rgba(232, 29, 29, 0.06)',
    borderRadius: moderateScale(20),
    overflow: 'hidden',
  },

  // Controls bar (Camera / Markers / Route / Navigate / Clear)
  bottomControlsBar: {
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(6),
    backgroundColor: '#0f172a',
  },

  // Details header
  detailsHeader: {
    paddingHorizontal: scale(16),
    paddingVertical: verticalScale(10),
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59,130,246,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsTitle: {
    color: '#3B82F6',
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
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  detailLabel: {
    color: colors.black,
    fontSize: moderateScale(12),
    fontWeight: '700',
    flex: 0.4,
  },
  detailValue: {
    color: colors.black,
    fontSize: moderateScale(13),
    fontWeight: '600',
    flex: 0.6,
    textAlign: 'right',
  },
  tollValueClickable: {
    color: '#3B82F6',
    fontSize: moderateScale(12),
    textDecorationLine: 'underline',
  },

  // Summary card (3-column: Distance | Time | Toll)
  routeSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderRadius: moderateScale(14),
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
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
    color: '#3B82F6',
    fontSize: moderateScale(12),
    fontWeight: '700',
    marginBottom: verticalScale(5),
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  summaryValue: {
    color: '#3B82F6',
    fontSize: moderateScale(15),
    fontWeight: '800',
  },
  summaryValueToll: {
    color: '#10B981',
    fontSize: moderateScale(15),
    fontWeight: '800',
    // textDecorationLine: 'underline',
  },
  summaryDivider: {
    width: 1,
    height: verticalScale(36),
    backgroundColor: 'rgba(59,130,246,0.2)',
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
    backgroundColor: 'rgba(15,23,42,0.97)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(59,130,246,0.2)',
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
    backgroundColor: 'rgba(59,130,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  turnInfo: {flex: 1},
  turnAction: {
    color: '#E2E8F0',
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  turnStreet: {
    color: '#64748B',
    fontSize: moderateScale(11),
    marginTop: verticalScale(2),
  },
  turnDist: {
    color: '#3B82F6',
    fontSize: moderateScale(13),
    fontWeight: '700',
  },

  // ── Nav info bar (top overlay, navigating state) ────────────────────────
  navInfoBar: {
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderRadius: moderateScale(14),
    borderWidth: 1,
    width: '96%',
    marginLeft: scale(18),
    borderColor: 'rgba(59,130,246,0.3)',
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(16),
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
    marginBottom: verticalScale(10),
    elevation: 8,
    shadowColor: '#3b82f6',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    marginLeft: scale(10),
    marginTop: verticalScale(120),
  },
  navInfoEta: {alignItems: 'center', minWidth: scale(50)},
  navInfoEtaText: {
    color: '#3b82f6',
    fontSize: moderateScale(28),
    fontWeight: '700',
    lineHeight: moderateScale(30),
  },
  navInfoEtaLabel: {
    color: '#64748b',
    fontSize: moderateScale(11),
    fontWeight: '500',
  },
  navInfoDivider: {
    width: scale(15),
    height: verticalScale(36),
    backgroundColor: '#1e293b',
  },
  navInfoDetails: {flex: 1},
  navInfoDistText: {
    color: '#e2e8f0',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  navInfoArrivalText: {
    color: '#64748b',
    fontSize: moderateScale(12),
    marginTop: verticalScale(2),
  },
  navStopButton: {
    backgroundColor: '#dc2626',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(8),
    paddingHorizontal: scale(14),
  },
  navStopButtonText: {
    color: '#ffffff',
    fontSize: moderateScale(13),
    fontWeight: '700',
  },

  // ── Toolbar buttons (Camera / Markers / Route / Navigate / Clear) ───────
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#e3fbff',
    paddingVertical: verticalScale(8),
    paddingHorizontal: Platform.OS === 'ios' ? scale(1) : scale(4),
    justifyContent: 'space-around',
    borderTopWidth: moderateScale(1),
    borderTopColor: '#1e293b',
    borderRadius: moderateScale(12),
  },
  button: {
    backgroundColor: '#1e293b',
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(7),
    paddingHorizontal: scale(10),
    margin: moderateScale(3),
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  buttonHighlight: {backgroundColor: '#dc2626', borderColor: '#ef4444'},
  buttonText: {
    color: '#94a3b8',
    fontSize: moderateScale(11),
    fontWeight: '600',
  },
  buttonTextHighlight: {color: '#ffffff'},

  // ── Toll modal ──────────────────────────────────────────────────────────
  tollModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  tollModalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    maxHeight: '80%',
    paddingTop: verticalScale(16),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  tollModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(18),
    paddingBottom: verticalScale(14),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  tollModalTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#3B82F6',
  },
  tollModalClose: {
    fontSize: moderateScale(22),
    color: '#64748B',
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
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.15)',
  },
  tollItemLeft: {flex: 1},
  tollItemName: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#E2E8F0',
  },
  tollItemRoad: {
    fontSize: moderateScale(11),
    color: '#94A3B8',
    marginTop: verticalScale(2),
  },
  tollItemAmount: {
    fontSize: moderateScale(14),
    fontWeight: '800',
    color: '#3B82F6',
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
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(34,197,94,0.25)',
  },
  tollItemTotalLabel: {
    fontSize: moderateScale(13),
    fontWeight: '700',
    color: '#10B981',
  },
  tollItemTotalAmount: {
    fontSize: moderateScale(15),
    fontWeight: '800',
    color: '#10B981',
  },
  tollModalNote: {
    fontSize: moderateScale(11),
    color: '#64748B',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingBottom: verticalScale(12),
  },

  // ── Turn-by-turn modal ──────────────────────────────────────────────────
  turnModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  turnModalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: moderateScale(28),
    borderTopRightRadius: moderateScale(28),
    maxHeight: '80%',
    paddingTop: verticalScale(16),
    paddingBottom: verticalScale(16),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  turnModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(18),
    paddingBottom: verticalScale(14),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  turnModalTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#3B82F6',
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
    backgroundColor: 'rgba(15,23,42,0.92)',
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(16),
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  routeSummaryText: {
    color: '#e2e8f0',
    fontSize: moderateScale(13),
    fontWeight: '600',
    textAlign: 'center',
  },
  routeSummarySubText: {
    color: '#cbd5e1',
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
    backgroundColor: 'rgba(15,23,42,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingOverlayText: {
    color: '#e2e8f0',
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
    backgroundColor: 'rgba(15,23,42,0.82)',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    alignItems: 'center',
    minWidth: moderateScale(52),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  speedHudArrow: {
    color: '#f59e0b',
    fontSize: moderateScale(40),
    lineHeight: moderateScale(20),
  },
  speedHudDir: {
    color: '#e2e8f0',
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
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
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
    backgroundColor: '#fff',
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
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerModalCard: {
    width: '82%',
    backgroundColor: '#ffffff',
    borderRadius: moderateScale(16),
    padding: moderateScale(20),
  },
  markerModalTitle: {
    fontSize: moderateScale(17),
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: verticalScale(4),
  },
  markerModalSubtitle: {
    fontSize: moderateScale(12),
    color: '#64748b',
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
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: moderateScale(10),
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(12),
    zIndex: 1000,
    elevation: moderateScale(10),
  },
  mapErrorText: {
    color: '#991B1B',
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
    borderColor: '#CBD5E1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: moderateScale(8),
  },
  speedLimitBadgeAlert: {
    borderColor: '#DC2626',
  },
  speedLimitValue: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#0f172a',
  },
  speedLimitUnit: {
    fontSize: moderateScale(9),
    color: '#64748b',
  },

  // ── Voice guidance banner ────────────────────────────────────────────────
  voiceBanner: {
    backgroundColor: '#EFF6FF',
    borderRadius: moderateScale(10),
    paddingVertical: verticalScale(8),
    paddingHorizontal: moderateScale(12),
    marginBottom: verticalScale(8),
  },
  voiceBannerText: {
    fontSize: moderateScale(13),
    color: '#1e40af',
  },

  // ── Simulated-navigation toggle ──────────────────────────────────────────
  simulateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: verticalScale(14),
    paddingTop: verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  simulateTextCol: {
    flex: 1,
    paddingRight: moderateScale(12),
  },
  simulateLabel: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#0f172a',
  },
  simulateHint: {
    marginTop: verticalScale(2),
    fontSize: moderateScale(11),
    color: '#64748b',
  },
});
