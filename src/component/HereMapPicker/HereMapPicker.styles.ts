import {StyleSheet, Platform} from 'react-native';
import {scale, verticalScale, moderateScale} from 'react-native-size-matters';
import {colors} from '../../theme/colors';
import {IS_TABLET} from '../../theme/device';

const styles = StyleSheet.create({
  /* Search */
  searchWrap: {
    position: 'relative',
    zIndex: 20,
    marginBottom: verticalScale(12),
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(10),
    borderWidth: 1,
    borderColor: colors.border_Color,
    backgroundColor: colors.white,
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(12),
    paddingVertical: IS_TABLET
      ? verticalScale(5)
      : Platform.OS === 'ios'
      ? verticalScale(13)
      : verticalScale(12),
  },

  searchInput: {
    flex: 1,
    fontSize: moderateScale(14),
    color: colors.textStrong,
    padding: 0,
  },

  /* Suggestion dropdown */
  suggestionList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: verticalScale(4),
    backgroundColor: colors.white,
    borderRadius: moderateScale(12),
    borderWidth: 1,
    borderColor: colors.border_Color,
    overflow: 'hidden',
    shadowColor: colors.textStrong,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: moderateScale(10),
    elevation: 6,
    zIndex: 30,
  },

  suggestionItem: {
    paddingHorizontal: scale(14),
    paddingVertical: verticalScale(10),
    borderBottomWidth: 1,
    borderBottomColor: colors.screenBg,
  },

  suggestionTitle: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: colors.textStrong,
  },

  suggestionAddress: {
    fontSize: moderateScale(11),
    color: colors.textMuted,
    marginTop: verticalScale(2),
  },

  /* Map card */
  mapCard: {
    height: verticalScale(220),
    borderRadius: moderateScale(14),
    overflow: 'hidden',
    backgroundColor: colors.border_Color,
  },

  map: {
    ...StyleSheet.absoluteFillObject,
  },

  /* Center pin — sits over the map middle; tip points at the chosen coord */
  centerPinWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },

  centerPinLift: {
    // Lift the icon a full icon-height so its tip (bottom) sits on the dot,
    // which is pinned to the exact map center below.
    marginBottom: verticalScale(32),
    alignItems: 'center',
  },

  centerPinDot: {
    // Pinned to the exact center of the wrap; the icon tip points here.
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: scale(8),
    height: scale(8),
    marginTop: scale(-4),
    marginLeft: scale(-4),
    borderRadius: scale(4),
    backgroundColor: colors.blue500Alpha20,
  },

  /* GPS recenter button */
  gpsBtn: {
    position: 'absolute',
    left: scale(12),
    bottom: scale(12),
    width: IS_TABLET ? scale(24) : scale(38),
    height: IS_TABLET ? scale(24) : scale(38),
    borderRadius: moderateScale(10),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.textStrong,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.18,
    shadowRadius: moderateScale(4),
    elevation: 4,
  },

  /* Hint chip on top of the map */
  hintChip: {
    position: 'absolute',
    top: scale(10),
    alignSelf: 'center',
    backgroundColor: colors.overlayDarkMidStrong,
    borderRadius: moderateScale(20),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(5),
  },

  hintText: {
    color: colors.white,
    fontSize: moderateScale(11),
    fontWeight: '500',
  },

  /* Loading / fallback overlay */
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: scale(20),
  },

  overlayText: {
    marginTop: verticalScale(8),
    fontSize: moderateScale(12),
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default styles;
