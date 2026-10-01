import {StyleSheet} from 'react-native';
import {moderateScale, verticalScale} from 'react-native-size-matters';

import {colors} from '../../../theme/colors';
import {fontSize} from '../../../theme/fontSizes';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // ── Map ────────────────────────────────────────────────────────────────
  mapWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },

  maneuverCard: {
    position: 'absolute',
    top: verticalScale(12),
    left: moderateScale(12),
    right: moderateScale(80),
    backgroundColor: colors.primary,
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(14),
  },
  maneuverAction: {
    color: colors.white,
    fontSize: fontSize.subBody,
    textTransform: 'capitalize',
    opacity: 0.8,
  },
  maneuverText: {
    color: colors.white,
    fontSize: fontSize.body,
    fontWeight: '600',
    marginTop: verticalScale(2),
  },
  maneuverDistance: {
    color: colors.white,
    fontSize: fontSize.subBody,
    marginTop: verticalScale(4),
    opacity: 0.9,
  },

  // Circular speed-limit sign, red-ringed once the driver is over the limit.
  speedBadge: {
    position: 'absolute',
    top: verticalScale(12),
    right: moderateScale(12),
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    borderWidth: moderateScale(4),
    borderColor: colors.border_Color,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedBadgeAlert: {
    borderColor: colors.danger,
  },
  speedValue: {
    fontSize: fontSize.title,
    fontWeight: '700',
    color: colors.textStrong,
  },
  speedUnit: {
    fontSize: fontSize.tiny,
    color: colors.textStrong,
    opacity: 0.6,
  },

  // ── Control panel ──────────────────────────────────────────────────────
  panel: {
    maxHeight: '45%',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border_Color,
  },
  panelContent: {
    padding: moderateScale(16),
    paddingBottom: verticalScale(28),
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(6),
  },
  statusLabel: {
    fontSize: fontSize.subBody,
    color: colors.textMuted,
  },
  statusValue: {
    flex: 1,
    fontSize: fontSize.subBody,
    color: colors.textStrong,
    textAlign: 'right',
    marginLeft: moderateScale(12),
  },

  voiceBox: {
    marginTop: verticalScale(8),
    padding: moderateScale(10),
    borderRadius: moderateScale(8),
    backgroundColor: colors.screenBg,
  },
  voiceText: {
    fontSize: fontSize.subBody,
    color: colors.textStrong,
  },

  errorBox: {
    padding: moderateScale(10),
    borderRadius: moderateScale(8),
    backgroundColor: colors.red50,
    marginBottom: verticalScale(8),
  },
  errorText: {
    fontSize: fontSize.subBody,
    color: colors.danger,
  },

  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(10),
  },
  busyText: {
    marginLeft: moderateScale(8),
    fontSize: fontSize.subBody,
    color: colors.textMuted,
  },

  button: {
    marginTop: verticalScale(12),
    paddingVertical: verticalScale(13),
    borderRadius: moderateScale(10),
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonDanger: {
    backgroundColor: colors.danger,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border_Color,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.body,
    fontWeight: '600',
  },
  buttonGhostText: {
    color: colors.textStrong,
  },
});
