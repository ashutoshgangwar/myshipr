import { StyleSheet } from 'react-native';
import { moderateScale, verticalScale } from 'react-native-size-matters';
import { colors } from '../../theme/colors';

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  /* Header */
  header: {
    backgroundColor: colors.primary,
    padding: moderateScale(20),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  welcome: {
    color: '#DBEAFE',
    fontSize: moderateScale(18),
    fontWeight: '500',
  },

  username: {
    color: '#fff',
    fontSize: moderateScale(24),
    fontWeight: '700',
  },

  profileCircle: {
    width: moderateScale(44),
    height: moderateScale(44),
    backgroundColor: '#fff',
    borderRadius: moderateScale(22),
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileIcon: {
    fontSize: moderateScale(18),
  },

/* Verification */
verifyCard: {
  margin: moderateScale(16),
  backgroundColor: colors.primary,
  borderRadius: moderateScale(16),
  padding: moderateScale(14),
},

verifyRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

verifyText: {
  color: '#E0E7FF',
  fontSize: moderateScale(14),
  fontWeight: '600',
},

verifiedBadge: {
  backgroundColor: '#22C55E',
  paddingHorizontal: moderateScale(12),
  paddingVertical: verticalScale(4),
  borderRadius: moderateScale(12),
},

badgeText: {
  color: '#fff',
  fontWeight: '600',
  fontSize: moderateScale(12),
},

progressTrack: {
  height: verticalScale(16),
  fontWeight: '600',
},

progressFill: {
  width: '100%', // later dynamic (e.g. 72%)
  height: '100%',
  backgroundColor: '#FFFFFF',
  borderRadius: moderateScale(10),
},


  /* Stats */
  statsCard: {
    backgroundColor: '#fff',
    marginHorizontal: moderateScale(16),
    borderRadius: moderateScale(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(16),
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statValue: {
    fontSize: moderateScale(22),
    fontWeight: '700',
  },

  statLabel: {
    fontSize: moderateScale(12),
    color: '#64748B',
  },

  divider: {
    width: 1,
    backgroundColor: '#E2E8F0',
  },

  /* Sections */
  sectionTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
    marginHorizontal: moderateScale(16),
    marginTop: verticalScale(10),
  },

  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: moderateScale(10),
    marginTop: verticalScale(1),
  },

  seeAll: {
    color: colors.white,
    fontWeight: '800',
    justifyContent: 'flex-end', 
    textAlign:'right',
    marginRight: moderateScale(10)
  },

  auctionCard: {   
    backgroundColor: colors.placeholder,
    margin: moderateScale(10),
    borderRadius: moderateScale(10),
    padding: moderateScale(5)
  },

  mapCard: {
    margin: moderateScale(10),
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    height: verticalScale(220),
    backgroundColor: '#fff',
  },

  mapFullscreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    zIndex: 50,
    padding: 0,
  },

  mapFullscreenCard: {
    flex: 1,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },

  mainMap: {
    ...StyleSheet.absoluteFillObject,
  },

  mapToggleBtn: {
    position: 'absolute',
    top: moderateScale(10),
    right: moderateScale(10),
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
  },

  mapLocationBtn: {
    position: 'absolute',
    right: moderateScale(10),
    bottom: moderateScale(14),
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
  },

  mapHintRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: moderateScale(16),
    marginTop: verticalScale(8),
    marginBottom: verticalScale(2),
  },

  currentLoadHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: moderateScale(16),
    marginTop: verticalScale(10),
  },

  signatureSectionHeader: {
    marginHorizontal: moderateScale(16),
    marginTop: verticalScale(12),
  },

  currentLoadTitle: {
    fontSize: moderateScale(20),
    fontWeight: '700',
  },

  signatureCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: moderateScale(10),
    marginTop: verticalScale(10),
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
  },

  signatureInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  signatureTextWrap: {
    flex: 1,
    paddingRight: moderateScale(12),
  },

  signatureStatusTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#0F172A',
  },

  signatureStatusSubtitle: {
    marginTop: verticalScale(4),
    color: '#64748B',
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
  },

  signatureActionBtn: {
    backgroundColor: colors.primary,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(14),
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    justifyContent: 'center',
  },

  signatureActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  signaturePreview: {
    width: '100%',
    height: verticalScale(120),
    marginTop: verticalScale(14),
    borderRadius: moderateScale(12),
    backgroundColor: '#F8FAFC',
  },

  currentLoadJobBtn: {
    backgroundColor: '#16A34A',
    borderRadius: moderateScale(999),
    paddingHorizontal: moderateScale(18),
    paddingVertical: verticalScale(18),
    marginBottom: verticalScale(10),
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
  },

  currentLoadJobBtnStop: {
    backgroundColor: '#DC2626',
  },

  currentLoadJobBtnText: {
    color: '#fff',
    fontSize: moderateScale(20),
    fontWeight: '700',
  },

  mapExpandedHeader: {
    position: 'absolute',
    top: moderateScale(12),
    left: moderateScale(12),
    right: moderateScale(56),
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(12),
    paddingVertical: verticalScale(8),
  },

  mapExpandedTitle: {
    color: '#fff',
    fontSize: moderateScale(14),
    fontWeight: '700',
  },

  mapExpandedHint: {
    color: '#E2E8F0',
    fontSize: moderateScale(11),
    marginTop: verticalScale(2),
  },

  miniMapContainer: {
    position: 'absolute',
    width: moderateScale(110),
    height: moderateScale(110),
    borderRadius: moderateScale(12),
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.26,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
  },

  miniMap: {
    flex: 1,
  },

  currentMarkerContainer: {
    width: moderateScale(28),
    height: moderateScale(28),
    alignItems: 'center',
    justifyContent: 'center',
  },

  currentMarkerOuter: {
    position: 'absolute',
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: 'rgba(37, 99, 235, 0.28)',
  },

  currentMarkerInner: {
    width: moderateScale(15),
    height: moderateScale(15),
    borderRadius: moderateScale(7.5),
    backgroundColor: '#2563EB',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  stopMarkerWrap: {
    alignItems: 'center',
  },

  stopMarkerBadge: {
    minWidth: moderateScale(118),
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(10),
    backgroundColor: '#111827',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 3,
  },

  stopMarkerPickup: {
    backgroundColor: '#16A34A',
  },

  stopMarkerService: {
    backgroundColor: '#F59E0B',
  },

  stopMarkerDelivery: {
    backgroundColor: '#DC2626',
  },

  stopMarkerLabel: {
    color: '#FFFFFF',
    fontSize: moderateScale(11),
    fontWeight: '700',
  },

  stopMarkerDate: {
    color: '#FFFFFF',
    fontSize: moderateScale(10),
    marginTop: verticalScale(1),
    opacity: 0.95,
    fontWeight: '600',
  },

  stopMarkerPin: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    marginTop: verticalScale(3),
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },

  stopMarkerPinPickup: {
    backgroundColor: '#16A34A',
  },

  stopMarkerPinService: {
    backgroundColor: '#F59E0B',
  },

  stopMarkerPinDelivery: {
    backgroundColor: '#DC2626',
  },

  /* Cards */
  loadCard: {
    backgroundColor: '#fff',
    margin: moderateScale(10),
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
  },

  loadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(12),
  },

  loadId: {
    fontSize: moderateScale(18),
    fontWeight: '700',
  },

  loadSub: {
    color: '#64748B',
    marginTop: verticalScale(4),
  },

  inTransitBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(14),
    justifyContent: 'center',
  },

  locationRow: {
    flexDirection: 'row',
    marginTop: verticalScale(12),
  },

  locationIcon: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: moderateScale(12),
  },

  city: {
    fontWeight: '600',
  },

  info: {
    fontSize: moderateScale(12),
    color: '#64748B',
  },

 progressContainer: {
  marginTop: verticalScale(16),
},

progressHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: verticalScale(8),
},

progressLabel: {
  fontSize: moderateScale(14),
  fontWeight: '500',
  color: '#475569', // slate gray
},

progressPercent: {
  fontSize: moderateScale(14),
  fontWeight: '700',
  color: '#0F172A', // dark text
},

progressBarBackground: {
  height: verticalScale(10),
  width: '100%',
  backgroundColor: '#D1D5DB', // light gray
  borderRadius: moderateScale(10),
  overflow: 'hidden',
},

progressBarFill: {
  height: '100%',
  backgroundColor: '#020617', // dark navy/black
  borderRadius: moderateScale(10),
},


  actionRow: {
    flexDirection: 'row',
    gap: moderateScale(12),
    marginTop: verticalScale(16),
  },

  primaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    marginLeft: verticalScale(10)
  },
  placeBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    marginLeft: verticalScale(50)
  },

  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
  },


  payRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: verticalScale(14),
    alignItems: 'center',
  },

  payLabel: {
    fontSize: moderateScale(12),
    color: '#64748B',
  },

  payAmount: {
    fontSize: moderateScale(22),
    fontWeight: '700',
    color: '#16A34A',
  },

  dateBadge: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: moderateScale(10),
    borderRadius: moderateScale(12),
    justifyContent: 'center',
  },

  /* Auction notification cards */
  auctionNotifCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: moderateScale(5),
    marginBottom: verticalScale(5),
    marginTop: verticalScale(5),
    borderRadius: moderateScale(14),
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(12),
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },

  auctionNotifLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: moderateScale(10),
  },

  liveBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(10),
  },

  auctionNotifInfo: {
    flex: 1,
  },

  auctionNotifId: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#0F172A',
  },

  auctionNotifRoute: {
    fontSize: moderateScale(12),
    color: '#64748B',
    marginTop: verticalScale(2),
  },

  auctionTimerBox: {
    backgroundColor: '#FEF9C3',
    borderRadius: moderateScale(10),
    paddingHorizontal: moderateScale(10),
    paddingVertical: verticalScale(6),
    alignItems: 'center',
  },

  auctionTimerLabel: {
    fontSize: moderateScale(10),
    color: '#92400E',
    fontWeight: '500',
  },

  auctionTimerValue: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    color: '#B45309',
    marginTop: verticalScale(2),
  },
});
