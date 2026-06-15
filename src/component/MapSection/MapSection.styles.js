import {StyleSheet} from 'react-native';
import {moderateScale, verticalScale} from 'react-native-size-matters';
import {colors} from '../../theme/colors';

export default StyleSheet.create({
  /* Card wrapper (default — callers usually pass their own container style too) */
  card: {
    borderRadius: moderateScale(16),
    overflow: 'hidden',
    height: verticalScale(220),
    backgroundColor: '#fff',
  },

  mainMap: {
    ...StyleSheet.absoluteFillObject,
  },

  /* Fullscreen (expanded) overlay */
  fullscreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    zIndex: 50,
  },

  fullscreenCard: {
    flex: 1,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },

  /* Floating buttons */
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

  /* Location status overlay */
  locationStatusOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: moderateScale(8),
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  locationStatusText: {
    color: '#0F172A',
    fontSize: moderateScale(13),
    fontWeight: '600',
  },
  locationRetryBtn: {
    backgroundColor: '#00033E',
    paddingHorizontal: moderateScale(16),
    paddingVertical: verticalScale(7),
    borderRadius: moderateScale(20),
  },
  locationRetryText: {
    color: '#FFFFFF',
    fontSize: moderateScale(13),
    fontWeight: '700',
  },

  /* Expanded header banner */
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

  /* Current-location marker */
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

  /* Stop markers (pickup / service / delivery) */
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
  stopMarkerPickup: {backgroundColor: '#16A34A'},
  stopMarkerService: {backgroundColor: '#F59E0B'},
  stopMarkerDelivery: {backgroundColor: '#DC2626'},
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
  stopMarkerPinPickup: {backgroundColor: '#16A34A'},
  stopMarkerPinService: {backgroundColor: '#F59E0B'},
  stopMarkerPinDelivery: {backgroundColor: '#DC2626'},

  /* Selected / picked destination marker */
  selectedMarkerContainer: {
    alignItems: 'center',
  },
  selectedMarkerInner: {
    minWidth: moderateScale(100),
    paddingHorizontal: moderateScale(8),
    paddingVertical: verticalScale(5),
    borderRadius: moderateScale(10),
    backgroundColor: colors.primary,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 3,
  },
  selectedMarkerText: {
    color: '#FFFFFF',
    fontSize: moderateScale(11),
    fontWeight: '700',
  },
  selectedMarkerPin: {
    width: moderateScale(12),
    height: moderateScale(12),
    borderRadius: moderateScale(6),
    marginTop: verticalScale(3),
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});
