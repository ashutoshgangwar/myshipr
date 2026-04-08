import {StyleSheet} from 'react-native';
import {
  moderateScale,
  verticalScale,
  scale,
} from 'react-native-size-matters';
import { colors } from '../../theme/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  /* ================= MAP ================= */
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },

  /* ================= LOAD CARD ================= */
loadCard: {
  position: 'absolute',
  bottom: verticalScale(10),
  left: scale(15),
  right: scale(15),
  backgroundColor: 'rgba(255, 255, 255, 0.97)',
  borderRadius: moderateScale(15),
  padding: moderateScale(15),
  shadowRadius: moderateScale(10),

  zIndex: 20,
},

  loadCardRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
},

loadRight: {
  alignItems: 'flex-end',
  justifyContent: 'flex-start',
},

loadLeft: {
  flex: 1,
  paddingRight: scale(10),
},

  cardTitle: {
    fontSize: moderateScale(18),
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: verticalScale(6),
    letterSpacing: 0.5,
  },
  cardText: {
    fontSize: moderateScale(13),
    color: '#475569',
    marginBottom: verticalScale(3),
    fontWeight: '500',
  },
status: {
  fontSize: moderateScale(13),
  fontWeight: '700',
  color: '#059669',
  backgroundColor: 'rgba(5, 150, 105, 0.12)',
  paddingHorizontal: scale(10),
  paddingVertical: verticalScale(6),
  borderRadius: moderateScale(8),
  overflow: 'hidden',
},
  iconRow: {
    flexDirection: 'row',
    marginVertical: verticalScale(6),
    gap: scale(12),
  },

  /* ================= SEARCH CARD ================= */
searchCard: {
  position: 'absolute',
  top: verticalScale(5),
  left: scale(5),
  right: scale(5),
  backgroundColor: 'rgba(255, 255, 255, 0.98)',
  borderRadius: moderateScale(20),
  padding: moderateScale(15),
  elevation: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.2,
  shadowRadius: moderateScale(12),
  zIndex: 30, 
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.3)',
},

  searchCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: moderateScale(20),
    backgroundColor: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  },
  labelRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: verticalScale(6),
  gap: scale(6),
},

labelText: {
  fontSize: moderateScale(20),
  fontWeight: '700',
  color: colors.muted,
},
  searchInput: {
    height: verticalScale(40),
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(50),
    fontSize: moderateScale(15),
    backgroundColor: '#FAFAFA',
    marginBottom: verticalScale(10),
    fontWeight: '500',
    color: '#334155',
  },
  searchInputActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#F0F9FF',
  },
  searchInputContainer: {
    position: 'relative',
  },
  swapIconLeft: {
    position: 'absolute',
    left: scale(10),
    top: verticalScale(4),
    padding: scale(6),
    zIndex: 10,
    borderRadius: moderateScale(8),
  },
  gpsButton: {
    position: 'absolute',
    right: scale(12),
    top: verticalScale(12),
    padding: scale(6),
    zIndex: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: moderateScale(8),
  },
navigateButton: {
  height: verticalScale(45),
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: scale(20),
  marginTop: verticalScale(10),
  borderRadius: moderateScale(24),
  backgroundColor: '#2563EB',
  alignSelf: 'center',
  elevation: 4,
},

optimorouteButton: {
  backgroundColor: '#7C3AED',
  justifyContent: 'center',
},
optimorouteButtonActive: {
  backgroundColor: '#0F172A',
},

iconCircle: {
  width: scale(32),
  height: scale(32),
  borderRadius: scale(16),
  backgroundColor: '#FFFFFF',
  alignItems: 'center',
  justifyContent: 'center',
  marginLeft: scale(10),
},
navigateText: {
  color: '#FFFFFF',
  fontSize: moderateScale(15),
  fontWeight: '600',
  lineHeight: verticalScale(18),
},
optimorouteText: {
  color: '#FFFFFF',
  fontSize: moderateScale(14),
  fontWeight: '600',
},
optimorouteError: {
  marginTop: verticalScale(6),
  textAlign: 'center',
  color: '#DC2626',
  fontSize: moderateScale(12),
  fontWeight: '600',
},

  /* ================= FLOATING BUTTONS ================= */
 fabContainer: {
  position: 'absolute',
  right: moderateScale(16),
  top: '60%',
  transform: [{ translateY: -moderateScale(30) }],
  alignItems: 'center',
  zIndex: 40,
},

  fab: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(8),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ scale: 1 }],
  },
  fabPressed: {
    transform: [{ scale: 0.95 }],
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(10),
    borderRadius: moderateScale(10),
    elevation: 5,
  },
  actionText: {
    marginLeft: scale(4),
    fontSize: moderateScale(10),
    fontWeight: '700',
    color: '#fff',
  },
  

  /* ================= DIRECTIONS ================= */
  directionsPanel: {
    position: 'absolute',
    bottom: verticalScale(150),
    left: scale(16),
    right: scale(16),
    backgroundColor: '#fff',
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    maxHeight: verticalScale(150),
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(6),
    shadowOffset: { width: 0, height: 3 },
    zIndex: 15,
  },
  directionsTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    color: '#374151',
    marginBottom: verticalScale(8),
  },
  directionsList: {
    maxHeight: verticalScale(150),
  },
  directionStep: {
    paddingVertical: verticalScale(4),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  stepInstruction: {
    fontSize: moderateScale(14),
    color: '#111827',
    fontWeight: '500',
  },
  stepDetails: {
    fontSize: moderateScale(12),
    color: '#6B7280',
    marginTop: verticalScale(2),
  },
  currentStep: {
    backgroundColor: '#F3F4F6',
    padding: moderateScale(8),
    borderRadius: moderateScale(8),
    marginBottom: verticalScale(8),
  },
  currentInstruction: {
    fontSize: moderateScale(16),
    color: '#111827',
    fontWeight: '600',
  },
  currentDetails: {
    fontSize: moderateScale(14),
    color: '#374151',
    marginTop: verticalScale(4),
  },
  stepButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: verticalScale(8),
  },
  stepButton: {
    backgroundColor: '#2563EB',
    paddingVertical: verticalScale(6),
    paddingHorizontal: scale(12),
    borderRadius: moderateScale(6),
  },
  stepButtonText: {
    color: '#fff',
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  activeStep: {
    backgroundColor: '#DBEAFE',
  },
  navigationBanner: {
    position: 'absolute',
    bottom: verticalScale(24),
    left: scale(16),
    right: scale(16),
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    padding: moderateScale(16),
    borderRadius: moderateScale(16),
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(10),
    zIndex: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  navigationInstruction: {
    fontSize: moderateScale(17),
    color: '#1E293B',
    fontWeight: '700',
    lineHeight: moderateScale(22),
  },
  navigationDetails: {
    fontSize: moderateScale(14),
    color: '#64748B',
    marginTop: verticalScale(6),
    fontWeight: '600',
  },
  arrowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  currentLocationMarker: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationMarkerPulse: {
    position: 'absolute',
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: 'rgba(37, 99, 235, 0.28)',
  },
  currentLocationMarkerInner: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    backgroundColor: '#2563EB',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  /* ================= LOADING STATE ================= */
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    fontSize: moderateScale(16),
    color: '#64748B',
    fontWeight: '600',
    marginTop: verticalScale(12),
  },
  arrow: {
    fontSize: moderateScale(30),
    color: '#2563EB',
    fontWeight: 'bold',
  },

  /* ================= FLOATING ACTION BUTTON ================= */

  fabActive: {
    backgroundColor: '#1D4ED8',
    transform: [{ scale: 1.1 }],
    shadowOpacity: 0.5,
    shadowRadius: moderateScale(12),
    elevation: 12,
  },
  gpsHint: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(20),
    marginBottom: verticalScale(8),
    maxWidth: scale(200),
  },
  gpsHintText: {
    color: '#fff',
    fontSize: moderateScale(12),
    fontWeight: '600',
    textAlign: 'center',
  },

  /* ================= CUSTOM MARKERS ================= */
  /* ================= CUSTOM MARKERS ================= */

markerBase: {
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
},

markerSourceStyle: {
  backgroundColor: '#10B981',
  borderColor: '#059669',
  borderWidth: moderateScale(3),
  width: moderateScale(45),
  height: moderateScale(45),
  borderRadius: moderateScale(22.5),
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOpacity: 0.3,
  shadowRadius: moderateScale(3),
  elevation: moderateScale(5),
  overflow: 'hidden',
},

markerDestinationStyle: {
  backgroundColor: '#EF4444',
  borderColor: '#DC2626',
  borderWidth: moderateScale(3),
  width: moderateScale(45),
  height: moderateScale(45),
  borderRadius: moderateScale(22.5),
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOpacity: 0.3,
  shadowRadius: moderateScale(3),
  elevation: moderateScale(5),
  overflow: 'hidden',
},

markerWaypointStyle: {
  backgroundColor: '#F59E0B',
  borderColor: '#D97706',
  borderWidth: moderateScale(2),
  width: moderateScale(40),
  height: moderateScale(40),
  borderRadius: moderateScale(20),
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowRadius: moderateScale(2),
  elevation: moderateScale(4),
  overflow: 'hidden',
},

markerDefaultStyle: {
  backgroundColor: '#3B82F6',
  borderColor: '#1D4ED8',
  borderWidth: moderateScale(2),
  width: moderateScale(40),
  height: moderateScale(40),
  borderRadius: moderateScale(20),
  justifyContent: 'center',
  alignItems: 'center',
  shadowColor: '#000',
  shadowOpacity: 0.25,
  shadowRadius: moderateScale(2),
  elevation: moderateScale(4),
  overflow: 'hidden',
},

markerLabel: {
  color: '#fff',
  fontSize: moderateScale(16),
  fontWeight: 'bold',
  textAlign: 'center',
},

markerImage: {
  width: scale(60),
  height: scale(60),
  resizeMode: 'contain',
},
});

export default styles;
