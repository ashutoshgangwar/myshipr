import { StyleSheet } from 'react-native';
import { moderateScale, verticalScale, scale } from 'react-native-size-matters';
import { colors } from '../../theme/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  map: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  markerOuter: {
    width: moderateScale(22),
    height: moderateScale(22),
    borderRadius: moderateScale(1),
    borderWidth: moderateScale(3),
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  truckMarkerWrap: {
    width: moderateScale(34),
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(3),
    elevation: 6,
  },

  zoomControls: {
    position: "absolute",
    right: scale(16),
    bottom: verticalScale(100),
    backgroundColor: "#ffffff",
    borderRadius: moderateScale(8),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(4),
    elevation: 5,
    overflow: "hidden",
  },

  zoomButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    justifyContent: "center",
    alignItems: "center",
  },

  zoomButtonText: {
    fontSize: moderateScale(24),
    fontWeight: "400",
    color: "#333333",
    lineHeight: verticalScale(28),
  },

  zoomDivider: {
    height: verticalScale(1),
    backgroundColor: "#e0e0e0",
    marginHorizontal: scale(6),
  },

  zoomLabel: {
    position: "absolute",
    right: scale(70),
    bottom: verticalScale(118),
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: scale(10),
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(12),
  },

  zoomLabelText: {
    color: "#ffffff",
    fontSize: moderateScale(12),
    fontWeight: "600",
  },

  gpsButtonWrap: {
    position: "absolute",
    right: scale(16),
    top: "50%",
    marginTop: moderateScale(-25),
  },

  gpsButton: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(4),
    elevation: 5,
  },

  searchButtonWrap: {
    position: "absolute",
    left: scale(16),
    top: verticalScale(16),
  },

  searchButton: {
    width: moderateScale(50),
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(4),
    elevation: 5,
  },

  searchButtonText: {
    fontSize: moderateScale(24),
  },

  // Route Information Card Styles
  routeInfoCard: {
    position: "absolute",
    top: verticalScale(250),
    left: scale(16),
    right: scale(16),
    maxHeight: verticalScale(190),
    backgroundColor: "#ffffff",
    borderRadius: moderateScale(14),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(8) },
    shadowOpacity: 0.35,
    shadowRadius: moderateScale(12),
    elevation: 12,
    overflow: "hidden",
  },

  loadingContainer: {
    paddingVertical: verticalScale(32),
    paddingHorizontal: scale(16),
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: verticalScale(12),
    fontSize: moderateScale(14),
    color: "#666",
    fontWeight: "500",
  },

  errorContainer: {
    paddingVertical: verticalScale(16),
    paddingHorizontal: scale(16),
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
  },

  errorText: {
    fontSize: moderateScale(13),
    color: "#991b1b",
    fontWeight: "500",
    textAlign: "center",
    lineHeight: verticalScale(20),
  },

  routeDataContainer: {
    padding: scale(8),
    height: verticalScale(165),
  },

  routeHeader: {
    marginBottom: verticalScale(8),
    paddingBottom: verticalScale(8),
    borderBottomWidth: verticalScale(1),
    borderBottomColor: "#e5e7eb",
  },

  routeTitle: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: verticalScale(2),
  },

  routeSubtitle: {
    fontSize: moderateScale(9),
    color: "#9ca3af",
    fontWeight: "400",
  },


  // Primary Info Section (Distance & Time) - compact two-column
  routePrimaryInfo: {
    marginBottom: verticalScale(6),
    backgroundColor: "#f9fafb",
    borderRadius: moderateScale(10),
    padding: scale(8),
    borderWidth: 1,
    borderColor: "#f3f4f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  primaryInfoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
  },

  primaryIconBg: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(8),
    justifyContent: "center",
    alignItems: "center",
  },

  primaryIcon: {
    fontSize: moderateScale(16),
  },

  primaryInfoContent: {
    flex: 1,
  },

  primaryLabel: {
    fontSize: moderateScale(10),
    color: "#6b7280",
    fontWeight: "500",
    marginBottom: verticalScale(1),
  },

  primaryValue: {
    fontSize: moderateScale(15),
    fontWeight: "800",
    color: "#1f2937",
  },

  infoHint: {
    fontSize: moderateScale(8),
    color: "#9ca3af",
    fontWeight: "400",
    marginTop: verticalScale(1),
  },

  divider: {
    height: verticalScale(1),
    backgroundColor: "#e5e7eb",
    marginVertical: verticalScale(6),
  },

  // Secondary Info Section (Traffic & Status) - compact row
  secondaryInfoContainer: {
    flexDirection: "row",
    gap: scale(12),
    marginTop: verticalScale(1),
    marginBottom: verticalScale(14),
  },

  secondaryInfoItem: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: moderateScale(10),
    padding: scale(12),
    borderLeftWidth: scale(3),
    borderLeftColor: "#3b82f6",
  },

  secondaryItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: scale(8),
    marginBottom: verticalScale(3),
  },

  secondaryIcon: {
    fontSize: moderateScale(14),
  },

  secondaryLabel: {
    fontSize: moderateScale(10),
    color: "#6b7280",
    fontWeight: "600",
  },

  secondaryValue: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#1f2937",
  },
  noDelayText: {
    fontSize: moderateScale(10),
    color: "#10b981",
    fontWeight: "500",
    marginTop: verticalScale(2),
  },

  delayText: {
    fontSize: moderateScale(10),
    color: "#f59e0b",
    fontWeight: "500",
    marginTop: verticalScale(2),
  },
  

  statusHint: {
    fontSize: moderateScale(10),
    fontWeight: "400",
    marginTop: verticalScale(2),
  },

  routeInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: scale(8),
  },

  routeInfoItem: {
    flex: 1,
    minWidth: scale(120),
    backgroundColor: "#f3f4f6",
    borderRadius: moderateScale(8),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(12),
    alignItems: "center",
    justifyContent: "center",
  },

  routeInfoLabel: {
    fontSize: moderateScale(11),
    color: "#6b7280",
    fontWeight: "500",
    marginBottom: verticalScale(4),
    textAlign: "center",
  },

  routeInfoValue: {
    fontSize: moderateScale(14),
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
  },

  debugContainer: {
    marginTop: verticalScale(16),
    paddingTop: verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },

  debugTitle: {
    fontSize: moderateScale(11),
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: verticalScale(8),
  },

  debugText: {
    fontSize: moderateScale(10),
    color: "#9ca3af",
    fontFamily: "Courier New",
  },

  // Top-right profile avatar
  profileWrap: {
    position: "absolute",
    right: scale(16),
    top: verticalScale(16),
    zIndex: 40,
  },

  profileAvatar: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: colors.primary || "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(2) },
    shadowOpacity: 0.25,
    shadowRadius: moderateScale(4),
    elevation: 6,
  },

  profileInitials: {
    color: "#fff",
    fontWeight: "800",
    fontSize: moderateScale(14),
  },

  // Small side mini-cards
  sideCard: {
    position: "absolute",
    top: verticalScale(80),
    width: moderateScale(120),
    padding: scale(10),
    borderRadius: moderateScale(10),
    backgroundColor: "rgba(255,255,255,0.95)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: verticalScale(4) },
    shadowOpacity: 0.12,
    shadowRadius: moderateScale(8),
    elevation: 8,
  },

  sideCardLeft: {
    left: scale(16),
  },

  sideCardRight: {
    right: scale(16),
  },

  sideCardTitle: {
    fontSize: moderateScale(12),
    fontWeight: "700",
    color: "#111827",
    marginBottom: verticalScale(6),
  },

  sideCardSubtitle: {
    fontSize: moderateScale(11),
    color: "#6b7280",
    fontWeight: "500",
  },

  // Route card handle and actions
  routeHandle: {
    width: moderateScale(48),
    height: verticalScale(6),
    borderRadius: moderateScale(6),
    backgroundColor: "#e5e7eb",
    alignSelf: "center",
    marginVertical: verticalScale(8),
  },

  routeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: scale(8),
    marginTop: verticalScale(10),
  },

  actionButton: {
    flex: 1,
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(10),
    alignItems: "center",
    justifyContent: "center",
  },

  actionPrimary: {
    backgroundColor: colors.primary || "#2563EB",
  },

  actionSecondary: {
    backgroundColor: "#f3f4f6",
  },

  actionButtonText: {
    color: "#fff",
    fontWeight: "700",
  },

  actionSecondaryText: {
    color: "#111827",
    fontWeight: "700",
  },

  // Map style switcher pill
  mapStylePill: {
    paddingVertical: moderateScale(6),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(20),
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: verticalScale(1) },
    shadowOpacity: 0.12,
    shadowRadius: moderateScale(3),
    elevation: 3,
  },

  mapStylePillActive: {
    backgroundColor: colors.primary || '#2563EB',
  },

  mapStylePillText: {
    color: '#333',
    fontSize: moderateScale(12),
    fontWeight: '400',
    textTransform: 'capitalize',
  },

  mapStylePillTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default styles;