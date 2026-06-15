import {StyleSheet, Platform} from 'react-native';
import {scale, verticalScale, moderateScale} from 'react-native-size-matters';
import {colors} from '../../theme/colors';
import {IS_TABLET} from '../../utils/device';

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
    backgroundColor: '#F8FAFC',
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
    color: colors.text_dark,
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
    shadowColor: '#000',
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
    borderBottomColor: '#F1F5F9',
  },

  suggestionTitle: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: colors.text_dark,
  },

  suggestionAddress: {
    fontSize: moderateScale(11),
    color: colors.primaryLight,
    marginTop: verticalScale(2),
  },

  /* Map card */
  mapCard: {
    height: verticalScale(220),
    borderRadius: moderateScale(14),
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
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
    // Lift the icon so its tip (bottom) lands on the exact map center.
    marginBottom: verticalScale(28),
    alignItems: 'center',
  },

  centerPinDot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: 'rgba(0,3,62,0.25)',
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
    shadowColor: '#000',
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
    backgroundColor: 'rgba(0,3,62,0.78)',
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
    backgroundColor: 'rgba(241,245,249,0.85)',
    paddingHorizontal: scale(20),
  },

  overlayText: {
    marginTop: verticalScale(8),
    fontSize: moderateScale(12),
    color: colors.primaryLight,
    textAlign: 'center',
  },
});

export default styles;
