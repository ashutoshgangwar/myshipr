import {Platform, StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';
import {ms, vs} from './constants';
import { IS_TABLET } from '../../theme/device';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },

  /* HEADER */
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: ms(16),
    paddingTop: vs(10),
    paddingBottom: vs(8),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  backBtn: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(10),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerBox: {
    marginLeft: ms(8),
    backgroundColor: colors.white,
    borderRadius: ms(14),
    paddingHorizontal: ms(10),
    paddingVertical:IS_TABLET ? vs(1) : vs(6),
    alignItems: 'flex-end',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 6},
    elevation: 3,
  },
  timerLabel: {
    fontSize:IS_TABLET ? ms(10) : ms(12),
    color: colors.nearBlack,
    fontWeight: '500',
  },
  timerValue: {
    fontSize: IS_TABLET ? ms(24) : ms(28),
    color: colors.textStrong,
    fontWeight: '700',
    letterSpacing: 1,
  },

  /* TOAST */
  toast: {
    position: 'absolute',
    top: vs(14),
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderRadius: ms(8),
    paddingHorizontal: ms(12),
    paddingVertical: vs(6),
    zIndex: 30,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
  },
  toastText: {
    fontSize: ms(11),
    color: colors.success,
    fontWeight: '600',
  },

  /* SCROLL */
  scroll: {flex: 1},
  scrollContent: {
    paddingHorizontal: ms(16),
    paddingTop: vs(8),
    paddingBottom: vs(28),
  },

  /* ROUTE HEADER */
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: -vs(8),
  },
  chipsLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E4ECFF',
    borderRadius: ms(15),
    paddingHorizontal: ms(8),
    paddingVertical: vs(4),
    marginRight: ms(8),
  },
  modePillText: {
    marginLeft: ms(5),
    fontSize: ms(10),
    color: colors.accentBlue,
    fontWeight: '700',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: ms(10),
    backgroundColor: colors.lightbg_gray,
    borderRadius: ms(15),
    paddingHorizontal: ms(8),
    paddingVertical: vs(4),
  },
  metaChipText: {
    fontSize: ms(10),
    color: colors.textMuted,
    fontWeight: '500',
  },
  routeTitle: {
    fontSize: ms(20),
    color: colors.textStrong,
    fontWeight: '600',
  },
  routeArrow: {
    color: colors.textStrong,
    fontWeight: '700',
  },
  routeSub: {
   color: '#606060',
    marginTop: vs(2),
    fontWeight: '600',
  },
  routeSubLabel: {
     fontSize: ms(12),
    color: colors.lightbg_gray2,
    fontWeight: '400',
  },
  routeSubValue: {
     fontSize: ms(12),
    color: colors.nearBlack,
    fontWeight: 'bold',
  },

  /* RANK BANNER */
  rankBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: ms(6),
    padding: IS_TABLET ? ms(8) : ms(12),
    marginTop: vs(12),
  },
  rankBehind: {backgroundColor: colors.accentBlueLight},
  rankLead: {backgroundColor: colors.warning_text},
  rankBadge: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    backgroundColor: colors.white,
    borderWidth: ms(1.5),
    borderColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(12),
  },
  rankBadgeLead: {borderColor: colors.warning_text},
  rankBadgeText: {
    fontSize: ms(16),
    color: colors.accentBlue,
    fontWeight: '700',
  },
  rankBadgeTextLead: {color: colors.warning_text},
  rankTextWrap: {flex: 1},
  rankKicker: {
    fontSize: ms(11),
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  rankTitle: {
    fontSize: ms(18),
    color: colors.white,
    fontWeight: '700',
    marginTop: vs(1),
  },
  rankMeta: {
    fontSize: ms(10),
    color: 'rgba(255,255,255,0.9)',
    marginTop: vs(3),
  },

  /* PRICE + BIDDING CARD */
  priceCard: {
    marginTop: vs(8),
    backgroundColor: colors.white,
    borderRadius: ms(6),
    padding: ms(14),
    // shadowColor: '#000',
    // shadowOpacity: 0.06,
    // shadowRadius: 8,
    // shadowOffset: {width: 0, height: 2},
    // elevation: 2,
  },
  locationBlock: {
    marginTop: vs(8),
    backgroundColor: colors.white,
    borderRadius: ms(6),
    paddingHorizontal: ms(14),
    paddingVertical: vs(1),
  },
  /* INDICATIVE PRICE */
  indicativeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  indicativeLabel: {
    fontSize: ms(10),
    color: colors.lightbg_gray2,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  indicativeValue: {
    fontSize:IS_TABLET ? ms(14) : ms(16),
    color: colors.textStrong,
    fontWeight: '600',
  },
  noteBox: {
    backgroundColor: '#EAF2FE',
    borderRadius: ms(6),
    paddingHorizontal: ms(10),
    paddingVertical: vs(6),
    marginTop: vs(8),
  },
  noteText: {
    fontSize: ms(10),
    color: colors.textMuted,
  },

  /* CURRENT LOWEST / SECTIONS */
  sectionLabel: {
    fontSize: ms(11),
    color: colors.lightbg_gray2,
    fontWeight: '600',
    marginTop: vs(8),
  },
  lowestValue: {
    fontSize: IS_TABLET ? ms(22) : ms(18),
    color: colors.textStrong,
    fontWeight: '700',
    marginTop: vs(2),
  },
  lowestMeta: {
    fontSize: ms(11),
    color: colors.textMuted,
    marginTop: vs(2),
    fontWeight: '600',
  },
  lowestMetaStrong: {
    color: colors.textStrong,
    fontWeight: '600',
  },

  /* BIDDING AS */
  biddingAsCard: {
    marginTop: vs(8),
    backgroundColor: '#E6E8EE',
    borderRadius: ms(6),
    borderWidth: 1,
    borderColor: colors.border_Color,
    padding: ms(10),
  },
  carrierRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: ms(30),
    height: ms(30),
    borderRadius: ms(15),
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(10),
  },
  avatarText: {
    fontSize: ms(12),
    color: colors.white,
    fontWeight: '700',
  },
  carrierTextWrap: {flex: 1},
  carrierName: {
    fontSize: ms(10),
    color: colors.textStrong,
    fontWeight: '600',
  },
  carrierSub: {
    fontSize: ms(10),
    color: colors.textMuted,
    marginTop: vs(1),
  },

  /* TRUCK */
  truckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF2FE',
    borderRadius: ms(8),
    paddingHorizontal: ms(10),
    paddingVertical: vs(8),
    marginTop: vs(10),
  },
  truckIcon: {
    marginRight: ms(3),
  },
  truckText: {
    flex: 1,
    fontSize: ms(11),
    color: colors.textStrong,
    fontWeight: '600',
  },
  truckSub: {
    fontSize: ms(10),
    color: colors.textMuted,
    fontWeight: '400',
  },

  divider: {
    height: 1,
    backgroundColor: colors.border_Color,
    marginTop: vs(14),
  },

  /* ROUTE + MAP */
  routeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(10),
  },
  routeStops: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-between',
    paddingVertical: vs(4),
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: vs(16),
  },
  // Dot + the short vertical tail beneath it, kept in one column so the label
  // text always aligns to the dot regardless of how tall the tail is.
  stopMarker: {
    alignItems: 'center',
    width: ms(9),
    marginRight: ms(8),
    marginTop: vs(3),
  },
  stopDot: {
    width: ms(9),
    height: ms(9),
    borderRadius: ms(5),
  },
  stopLine: {
    width: ms(1.5),
    flex: 1,
    minHeight: vs(1),
    marginTop: vs(1),
    borderRadius: ms(1),
    backgroundColor: colors.textMuted,
  },
  stopDotPickup: {backgroundColor: colors.accentBlue},
  stopDotDrop: {backgroundColor: colors.success},
  stopLabel: {
    fontSize: ms(12),
    color: colors.textStrong,
    fontWeight: '600',
  },
  stopWindow: {
    fontSize: ms(10),
    color: colors.textMuted,
    marginTop: vs(1),
  },
  // The map is capped at 45% of the row so it can never bleed past the card's
  // right edge on narrow phones, with a fixed height for the native view.
  mapImage: {
    flexBasis: '45%',
    flexGrow: 0,
    flexShrink: 1,
    height: vs(100),
    borderRadius: ms(8),
    marginLeft: ms(10),
    overflow: 'hidden',
    backgroundColor: colors.lightbg_gray,
    marginBottom: vs(12),
  },
  // Native views ignore the parent's overflow on Android, so size the map
  // explicitly to its container instead of relying on flex.
  mapFill: {
    width: '100%',
    height: '100%',
  },
  mapLoading: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* LOAD SPECIFICATIONS */
  specHeader: {
    marginTop: vs(8),
    backgroundColor: colors.white,
    borderRadius: ms(6),
    paddingHorizontal: ms(14),
    paddingVertical: vs(1),
  },
  specHeaderText: {
    fontSize: ms(11),
    color: colors.lightbg_gray2,
    fontWeight: '600',
    marginTop: vs(8),
  },
  specTable: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: ms(8),
    marginTop: vs(8),
    overflow: 'hidden',
  },
  specCell: {
    width: '25%',
    paddingHorizontal: ms(8),
    paddingVertical: vs(8),
  },
  specCellRightBorder: {
    borderRightWidth: 1,
    borderRightColor: colors.border_Color,
  },
  specCellBottomBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border_Color,
  },
  specLabel: {
    fontSize: ms(8),
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  specValue: {
    fontSize: ms(12),
    color: colors.textStrong,
    fontWeight: '600',
    marginTop: vs(3),
  },

  /* FLOATING BID NOW PANEL + AUTO BID, stacked on the right edge */
  bidDock: {
    position: 'absolute',
    right: 0,
    top: IS_TABLET ? '48%' : Platform.OS === 'ios' ? '47%' : '45%',
    alignItems: 'flex-end',
    zIndex: 20,
  },
  bidPanel: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: ms(14),
    borderBottomLeftRadius: ms(14),
    paddingHorizontal: ms(12),
    paddingVertical: vs(12),
    alignItems: 'center',
    zIndex: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: {width: -2, height: 2},
  },
  bidPanelTitle: {
    fontSize: ms(14),
    color: colors.white,
    fontWeight: '600',
    marginBottom: vs(8),
  },
  bidPanelTitleStrong: {
    color: colors.white,
    fontWeight: '800',
  },
  coinSlot: {
    marginVertical: vs(5),
  },

  /* AUTO BID BUTTON — separate pill just below the Bid NOW panel */
  autoBidBtn: {
    // Stretches to the dock's width, which the Bid NOW panel sets — so the
    // button always matches the panel edge for edge.
    alignSelf: 'stretch',
    marginTop: vs(10),
    alignItems: 'center',
    backgroundColor: '#4C9BF5',
    borderTopLeftRadius: ms(6),
    borderBottomLeftRadius: ms(6),
    paddingHorizontal: ms(6),
    paddingVertical: vs(8),
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
  },
  autoBidText: {
    fontSize: ms(12),
    color: colors.white,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  /* AUTO BID MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(24),
  },
  modalKav: {
    width: '100%',
    maxWidth: ms(420),
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: ms(12),
    padding: ms(18),
    width: '100%',
    maxWidth: ms(420),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: vs(14),
  },
  modalTitle: {
    fontSize: ms(16),
    color: colors.textStrong,
    fontWeight: '700',
  },
  modalClose: {
    fontSize: ms(22),
    color: colors.textMuted,
    lineHeight: ms(22),
  },
  modalLabel: {
    fontSize: ms(12),
    color: colors.textStrong,
    fontWeight: '600',
    marginBottom: vs(6),
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: ms(8),
    paddingHorizontal: ms(12),
  },
  inputPrefix: {
    fontSize: ms(14),
    color: colors.textMuted,
    marginRight: ms(6),
  },
  input: {
    flex: 1,
    fontSize: ms(14),
    color: colors.textStrong,
    paddingVertical: vs(8),
    fontFamily: 'Poppins-Regular',
  },
  modalHint: {
    fontSize: ms(10),
    color: colors.textMuted,
    marginTop: vs(8),
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: ms(8),
    paddingVertical: IS_TABLET ? vs(8) : vs(14),
    alignItems: 'center',
    marginTop: vs(16),
  },
  saveBtnText: {
    fontSize: ms(14),
    color: colors.white,
    fontWeight: '600',
  },
});
