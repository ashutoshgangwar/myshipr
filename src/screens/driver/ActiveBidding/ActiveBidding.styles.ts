import {Platform, StyleSheet} from 'react-native';
import {colors} from '../../../theme/colors';
import {fontSize} from '../../../theme/fontSizes';
import {ms, vs} from './constants';
import { IS_TABLET } from '../../../theme/device';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.white,
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
    shadowColor: colors.textStrong,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 6},
    elevation: 3,
  },
  timerLabel: {
    fontSize: fontSize.label,
    color: colors.textStrong,
    fontWeight: '500',
  },
  timerValue: {
    fontSize: fontSize.heading,
    color: colors.textStrong,
    fontWeight: '700',
    letterSpacing: 1,
  },
  // A closed auction: red and smaller, since "Closed" is a word, not a clock.
  timerClosed: {
    fontSize: fontSize.title,
    color: colors.danger,
    letterSpacing: 0,
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
    shadowColor: colors.textStrong,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
  },
  toastText: {
    fontSize: fontSize.caption,
    color: colors.success,
    fontWeight: '600',
  },
  toastError: {
    backgroundColor: colors.red50,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  toastTextError: {color: colors.danger},

  /* SCROLL */
  scroll: {flex: 1, backgroundColor: colors.screenBg},
  scrollContent: {
    paddingHorizontal: ms(16),
    paddingTop: vs(8),
    paddingBottom: vs(28),
  },

  /* ROUTE HEADER */
  routeHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  routeLeft: {
    flex: 1,
  },
  chipsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paleBlue,
    borderRadius: ms(15),
    paddingHorizontal: ms(8),
    paddingVertical: vs(4),
    marginRight: ms(8),
  },
  modePillText: {
    marginLeft: ms(5),
    fontSize: fontSize.small,
    color: colors.accentBlue,
    fontWeight: '700',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: ms(10),
    backgroundColor: colors.border_Color,
    borderRadius: ms(15),
    paddingHorizontal: ms(4),
    paddingVertical: vs(4),
  },
  metaChipDivider: {
    width: 1,
    height: vs(12),
    backgroundColor: colors.textMuted,
    opacity: 0.4,
    marginHorizontal: ms(8),
  },
  metaChipText: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    fontWeight: '500',
  },
  routeTitle: {
    marginTop: vs(6),
    fontSize: fontSize.subHeading,
    color: colors.textStrong,
    fontWeight: '600',
  },
  routeArrow: {
    color: colors.textStrong,
    fontWeight: '700',
  },
  routeSub: {
   color: colors.textMuted,
    marginTop: vs(2),
    fontWeight: '600',
  },
  routeSubLabel: {
     fontSize: fontSize.label,
    color: colors.textMuted,
    fontWeight: '400',
  },
  routeSubValue: {
     fontSize: fontSize.small,
    color: colors.textStrong,
    fontWeight: 'bold',
  },

  /* STATUS BANNER */
  // Loading bar standing in for the status banner.
  bannerSkeleton: {
    marginTop: vs(10),
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: vs(10),
    borderRadius: ms(8),
    // borderWidth: 1,
    paddingHorizontal: ms(14),
    paddingVertical:IS_TABLET ? vs(6) : vs(10),
  },
  statusOutbid: {
    backgroundColor: colors.amber100,
    borderColor: colors.button_color,
  },
  statusPlaced: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
  },
  outbidIcon: {
    width: ms(22),
    height: ms(22),
    borderRadius: ms(11),
    borderWidth: ms(1.5),
    borderColor: colors.white,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(12),
  },
  placedIcon: {
    width: ms(22),
    height: ms(22),
    borderRadius: ms(11),
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(12),
  },
  statusText: {
    flex: 1,
    fontSize: fontSize.subBody,
    fontWeight: '500',
  },
  statusTextOutbid: {color: colors.button_color},
  statusTextPlaced: {color: colors.success},
  currentBidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: vs(10),
    borderRadius: ms(8),
    paddingHorizontal: ms(14),
    paddingVertical: IS_TABLET ? vs(6) : vs(10),
    backgroundColor: colors.border_Color,
  },
  currentBidLabel: {
    fontSize: fontSize.subBody,
    fontWeight: 'bold',
    color: colors.textStrong,
  },
  currentBidValue: {
    fontSize: fontSize.subBody,
    fontWeight: 'bold',
    color: colors.textStrong,
  },
  maxBidCapText: {
    marginTop: vs(6),
    fontSize: fontSize.subBody,
    fontWeight: '500',
    color: colors.success,
    textAlign:'center'
  },

  /* VEHICLE + BID CARD */
  bidCard: {
    marginTop: vs(5),
    backgroundColor: colors.white,
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: colors.border_Color,
    overflow: 'hidden',
  },
  bidCardTop: {
    padding: ms(14),
    borderBottomWidth: 1,
    borderBottomColor: colors.border_Color,
  },
  bidCardBottom: {
    padding: ms(14),
  },
  sectionHeadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kicker: {
    fontSize: fontSize.tiny,
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  vehicleSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paleBlue,
    borderRadius: ms(6),
    paddingHorizontal: ms(10),
    paddingVertical:IS_TABLET ? vs(5) : vs(5),
    marginTop: vs(8),
  },
  vehicleIconBox: {
    width:IS_TABLET ? ms(24) : ms(34),
    height: IS_TABLET ? ms(24) : ms(34),
    borderRadius:IS_TABLET ? ms(6) : ms(8),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(12),
  },
  vehicleText: {
    flex: 1,
    fontSize: fontSize.subBody,
    color: colors.textStrong,
    fontWeight: '600',
  },
  chevronUp: {
    transform: [{rotate: '180deg'}],
  },
  vehicleList: {
    marginTop: vs(4),
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: ms(6),
    overflow: 'hidden',
  },
  vehicleOption: {
    paddingHorizontal: ms(12),
    paddingVertical: vs(10),
    backgroundColor: colors.white,
  },
  vehicleOptionActive: {
    backgroundColor: colors.paleBlue,
  },
  vehicleOptionText: {
    fontSize: fontSize.label,
    color: colors.textStrong,
    fontWeight: '500',
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: vs(10),
  },
  lockIcon: {
    marginRight: ms(6),
    marginTop: vs(2),
  },
  lockText: {
    flex: 1,
    fontSize: fontSize.micro,
    color: colors.textMuted,
  },
  lockTextStrong: {
    fontSize: fontSize.micro,
    color: colors.textStrong,
    fontWeight: '700',
  },
  bidInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: ms(8),
    paddingHorizontal: ms(14),
    paddingVertical: IS_TABLET ? vs(6) : vs(10),
    marginTop: vs(8),
  },
  // Auto bid is on — the manual field is greyed out and not editable.
  bidInputBoxDisabled: {
    opacity: 0.5,
    backgroundColor: colors.border_Color,
  },
  bidCurrency: {
    fontSize: fontSize.mainHeading,
    color: colors.textMuted,
    marginRight: ms(8),
  },
  bidInput: {
    minWidth: ms(70),
    fontSize: fontSize.mainHeading,
    color: colors.textStrong,
    fontWeight: '700',
    paddingVertical: 0,
    marginRight: ms(8),
    fontFamily: 'Poppins-Bold',
  },
  bidHint: {
    flex: 1,
    fontSize: fontSize.subBody,
    color: colors.textStrong,
  },
  bidBtnRow: {
    flexDirection: 'row',
    marginTop: vs(12),
  },

  /* STOPS & SHIPMENT DETAILS CARDS */
  sectionCard: {
    marginTop: vs(5),
    backgroundColor: colors.white,
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: colors.border_Color,
    overflow: 'hidden',
  },
  sectionCardHead: {
    backgroundColor: colors.screenBg,
    paddingHorizontal: ms(16),
    paddingVertical:IS_TABLET ? vs(10) : vs(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.border_Color,
  },
  sectionCardTitle: {
    fontSize: fontSize.body,
    color: colors.textStrong,
    fontWeight: '600',
  },
  sectionCardSub: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
    fontWeight: '400',
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ms(16),
    paddingVertical: IS_TABLET ? vs(10) : vs(12),
  },
  stopItemBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border_Color,
  },
  stopBadge: {
    width: IS_TABLET ? ms(25) : ms(30),
    height: IS_TABLET ? ms(25) : ms(30),
    borderRadius: IS_TABLET ? ms(12.5) : ms(15),
    borderWidth: 1,
    borderColor: colors.accentBlue,
    backgroundColor: colors.paleBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ms(12),
  },
  stopBadgeDrop: {
    borderColor: colors.card_drive_load,
    backgroundColor: colors.white,
  },
  stopBadgeText: {
    fontSize: fontSize.label,
    color: colors.accentBlue,
    fontWeight: '600',
  },
  stopBadgeTextDrop: {
    color: colors.card_drive_load,
  },
  stopTextWrap: {flex: 1},
  stopCity: {
    fontSize: fontSize.body,
    color: colors.textStrong,
    fontWeight: '500',
  },
  stopWhen: {
    alignItems: 'flex-end',
    marginLeft: ms(8),
  },
  stopDate: {
    fontSize: fontSize.caption,
    color: colors.textStrong,
    fontWeight: '600',
  },
  stopWindow: {
    fontSize: fontSize.tiny,
    color: colors.textMuted,
    marginTop: vs(2),
  },
  stopDetail: {
    fontSize: fontSize.caption,
    color: colors.textMuted,
    marginTop: vs(2),
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: ms(16),
    paddingVertical: vs(10),
  },
  detailCell: {
    width: '25%',
    paddingVertical: vs(6),
    paddingRight: ms(8),
  },
  detailLabel: {
    fontSize: fontSize.tiny,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: fontSize.label,
    color: colors.textStrong,
    fontWeight: '500',
    marginTop: vs(2),
  },

  /* WITHDRAW */
  withdrawBtn: {
    marginTop: vs(12),
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.red50,
    borderRadius: ms(8),
    paddingVertical:IS_TABLET ? vs(6) : vs(12),
    alignItems: 'center',
  },
  withdrawText: {
    fontSize: fontSize.body,
    color: colors.danger,
    fontWeight: '500',
  },

  /* ROUTE + MAP */
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
    backgroundColor: colors.border_Color,
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

  // The line laid over the map when there is no leg to draw. Absolute so the
  // map keeps the whole box behind it, and dimmed so the copy stays legible
  // over roads and water alike.
  mapNotice: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(6),
    backgroundColor: colors.white,
  },
  mapNoticeText: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },

  /* FLOATING BID NOW PANEL + AUTO BID, stacked on the right edge */
  bidDock: {
    position: 'absolute',
    right: 0,
    top: IS_TABLET ? '40%' : Platform.OS === 'ios' ? '42%' : '40%',
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 20,
  },
  bidDockHandle: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: ms(10),
    borderBottomLeftRadius: ms(10),
    paddingVertical: vs(14),
    paddingHorizontal: ms(6),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.textStrong,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: {width: -2, height: 2},
  },
  dockHandleIconOpen: {
    transform: [{rotate: '-90deg'}],
  },
  dockHandleIconClosed: {
    transform: [{rotate: '90deg'}],
  },
  bidPanel: {
    backgroundColor: colors.primary,
    paddingHorizontal: ms(12),
    paddingVertical: vs(12),
    alignItems: 'center',
    borderTopLeftRadius: ms(10),
    borderBottomLeftRadius: ms(10),
    zIndex: 20,
    elevation: 8,
    shadowColor: colors.textStrong,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: {width: -2, height: 2},
  },
  bidPanelTitle: {
    fontSize: fontSize.subHeading,
    color: colors.white,
    fontWeight: '700',
    marginBottom: vs(8),
  },
  bidPanelTitleStrong: {
    color: colors.white,
    fontWeight: '800',
  },
  coinSlot: {
    marginVertical: vs(5),
  },

  /* AUTO BID + PLACE BID BUTTONS */
  autoBidBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accentBlue,
    backgroundColor: colors.white,
    borderRadius: ms(6),
    paddingVertical: IS_TABLET ? vs(5) : vs(15),
    marginRight: ms(10),
  },
  autoBidText: {
    fontSize: fontSize.body,
    color: colors.accentBlue,
    fontWeight: '500',
  },
  placeBidBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentBlue,
    borderRadius: ms(6),
    paddingVertical: IS_TABLET ? vs(5) : vs(15),
  },
  /* AUTO BID ON — banner + the two buttons that replace Auto Bid / Place Bid */
  autoBidBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: vs(10),
    borderRadius: ms(8),
    paddingHorizontal: ms(14),
    paddingVertical: IS_TABLET ? vs(6) : vs(10),
    backgroundColor: colors.paleBlue,
  },
  autoBidBannerLeft: {flex: 1, paddingRight: ms(10)},
  autoBidBannerRight: {alignItems: 'flex-end'},
  autoBidBannerTitle: {
    fontSize: fontSize.subBody,
    fontWeight: '700',
    color: colors.accentBlue,
  },
  autoBidBannerLabel: {
    marginTop: vs(4),
    fontSize: fontSize.subBody,
    fontWeight: '500',
    color: colors.textStrong,
  },
  autoBidBannerHint: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },
  autoBidActivePill: {
    backgroundColor: colors.accentBlue,
    borderRadius: ms(4),
    paddingHorizontal: ms(8),
    paddingVertical: vs(2),
  },
  autoBidActiveText: {
    fontSize: fontSize.small,
    fontWeight: '600',
    color: colors.white,
  },
  autoBidStopLoss: {
    marginTop: vs(6),
    fontSize: fontSize.subHeading,
    fontWeight: '700',
    color: colors.textStrong,
  },
  // Turn Off / Edit Stop Loss sit above the (disabled) bid field.
  autoBidActionRow: {
    flexDirection: 'row',
    marginBottom: vs(14),
  },
  turnOffBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accentBlue,
    backgroundColor: colors.white,
    borderRadius: ms(6),
    paddingVertical: IS_TABLET ? vs(5) : vs(15),
    marginRight: ms(10),
  },
  turnOffText: {
    fontSize: fontSize.body,
    color: colors.accentBlue,
    fontWeight: '500',
  },
  editStopLossBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentBlue,
    borderRadius: ms(6),
    paddingVertical: IS_TABLET ? vs(5) : vs(15),
  },
  placeBidBtnDisabled: {
    backgroundColor: colors.accentBlue,
    opacity: 0.5,
  },
  placeBidText: {
    fontSize: fontSize.body,
    color: colors.white,
    fontWeight: '500',
  },

  /* PASS ON THIS LOAD MODAL */
  passCard: {
    width: '100%',
    maxWidth: ms(420),
    backgroundColor: colors.white,
    borderRadius: ms(8),
    overflow: 'hidden',
  },
  passHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentBlue,
    paddingHorizontal: ms(12),
    paddingVertical: vs(6),
  },
  passHeaderText: {flex: 1},
  passTitle: {
    fontSize: fontSize.subHeading,
    color: colors.white,
    fontWeight: '500',
  },
  passSubtitle: {
    fontSize: fontSize.tiny,
    color: colors.white,
  },
  passCloseBtn: {
    width: ms(24),
    height: ms(24),
    borderRadius: ms(4),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: ms(8),
  },
  passCloseText: {
    fontSize: fontSize.subHeading,
    lineHeight: ms(18),
    color: colors.textStrong,
    fontWeight: '600',
  },
  passBody: {
    fontSize: fontSize.body,
    color: colors.textStrong,
    paddingHorizontal: ms(12),
    paddingVertical: vs(18),
    borderBottomWidth: 1,
    borderBottomColor: colors.border_Color,
  },
  passActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: ms(10),
  },
  passBtn: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: ms(4),
    paddingHorizontal: ms(16),
    paddingVertical: vs(5),
    marginRight: ms(8),
  },
  passBtnText: {
    fontSize: fontSize.caption,
    color: colors.danger,
    fontWeight: '500',
  },
  keepBtn: {
    backgroundColor: colors.accentBlue,
    borderRadius: ms(4),
    paddingHorizontal: ms(16),
    paddingVertical: vs(5),
  },
  keepBtnText: {
    fontSize: fontSize.caption,
    color: colors.white,
    fontWeight: '600',
  },

  /* AUTO BID MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.blackAlpha45,
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
    paddingBottom: vs(10),
    marginBottom: vs(14),
    borderBottomWidth: 1,
    borderBottomColor: colors.border_Color,
  },
  modalTitle: {
    fontSize: fontSize.subHeading,
    color: colors.textStrong,
    fontWeight: '700',
  },
  modalClose: {
    fontSize: fontSize.heading,
    color: colors.textMuted,
    lineHeight: ms(22),
  },
  modalLabel: {
    fontSize: fontSize.label,
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
    fontSize: fontSize.body,
    color: colors.textMuted,
    marginRight: ms(6),
  },
  input: {
    flex: 1,
    fontSize: fontSize.body,
    color: colors.textStrong,
    paddingVertical: vs(8),
    fontFamily: 'Poppins-Regular',
  },
  modalHint: {
    fontSize: fontSize.small,
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
    fontSize: fontSize.body,
    color: colors.white,
    fontWeight: '600',
  },
});
