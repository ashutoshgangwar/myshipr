import {StyleSheet, Platform} from 'react-native';
import {scale, verticalScale, moderateScale} from 'react-native-size-matters';
import { colors } from '../../theme/colors';
import {IS_TABLET, select} from '../../theme/device';

// Cap the form column on tablets so inputs/buttons don't stretch edge-to-edge.
const CONTENT_MAX_WIDTH = select({phone: undefined, tablet: scale(380)});

// Icon sizes bump up on tablets so they stay in proportion with the scaled text.
export const ICON_SIZE = {
  tab: select({phone: moderateScale(18), tablet: moderateScale(15)}),
  search: select({phone: moderateScale(18), tablet: moderateScale(22)}),
  selected: select({phone: moderateScale(16), tablet: moderateScale(20)}),
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  /* Hero header */
  hero: {
    width: '100%',
    height: verticalScale(200),
    backgroundColor: colors.primary,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },

  heroImage: {
    resizeMode: 'cover',
  },

  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 35, 0.55)',
  },

  heroContent: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(30),
  },

  heroTitle: {
    color: colors.white,
    fontSize: moderateScale(24),
    fontWeight: '800',
  },

  heroSubtitle: {
    color: colors.onDarkHigh,
    fontSize: moderateScale(13),
    marginTop: verticalScale(4),
  },

  roleBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
    marginTop: verticalScale(12),
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: moderateScale(8),
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
  },

  roleBadgeText: {
    color: colors.white,
    fontSize: moderateScale(11),
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  /* Body card */
  card: {
    flexGrow: 1,
    backgroundColor: colors.white,
    marginTop: -verticalScale(15),
    borderTopLeftRadius: moderateScale(20),
    borderTopRightRadius: moderateScale(20),
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(18),
    paddingBottom: verticalScale(18),
    maxWidth: CONTENT_MAX_WIDTH,
    width: IS_TABLET ? '100%' : undefined,
    alignSelf: IS_TABLET ? 'center' : 'stretch',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(12),
    elevation: 3,
  },

  /* Tabs */
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    borderRadius: moderateScale(14),
    padding: IS_TABLET ? verticalScale(3) : verticalScale(4),
    marginBottom: verticalScale(16),
  },

  tab: {
    flex: 1,
    flexDirection: 'row',
    gap: scale(6),
    paddingVertical: IS_TABLET ? verticalScale(5) : verticalScale(9),
    borderRadius: moderateScale(11),
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabActive: {
    backgroundColor: colors.white,
  },

  tabText: {
    fontSize: moderateScale(12),
    fontWeight: '400',
    color: colors.splashText,
  },

  tabTextActive: {
    color: colors.textOnLightStrong,
  },

  /* Search */
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
    marginBottom: verticalScale(12),
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: IS_TABLET ? 'center' : 'stretch',
  },

  searchInput: {
    flex: 1,
    fontSize: moderateScale(14),
    color: colors.text_dark,
    padding: 0,
  },

  /* Map */
  mapCard: {
    height: verticalScale(220),
    borderRadius: moderateScale(14),
  },

  /* Selected location pill */
  selectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    borderWidth: 1,
    borderColor: colors.border_Color,
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(12),
    paddingVertical:IS_TABLET ? verticalScale(7) :  verticalScale(12),
    marginTop: verticalScale(14),
  },

  selectedText: {
    flex: 1,
    fontSize: moderateScale(13),
    color: colors.text_dark,
    fontWeight: '500',
  },

  selectedPlaceholder: {
    color: '#9CA3AF',
    fontWeight: '400',
  },

  /* Manual form */
  label: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: colors.text_dark,
    marginBottom: verticalScale(6),
  },

  required: {
    color: '#DC2626',
  },

  input: {
    borderWidth: 1,
    borderColor: colors.border_Color,
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    paddingVertical: Platform.OS === 'ios' ? verticalScale(12) : verticalScale(10),
    paddingHorizontal: scale(14),
    fontSize: moderateScale(14),
    color: colors.text_dark,
    marginBottom: verticalScale(14),
  },

  inputError: {
    borderColor: '#DC2626',
  },

  errorText: {
    color: '#DC2626',
    fontSize: moderateScale(11),
    marginTop: -verticalScale(10),
    marginBottom: verticalScale(10),
  },

  fieldRow: {
    flexDirection: 'row',
    gap: scale(12),
  },

  fieldHalf: {
    flex: 1,
  },

  /* Confirm button */
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: moderateScale(14),
    paddingVertical: IS_TABLET ? verticalScale(7) : verticalScale(15),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(16),
  },

  confirmBtnDisabled: {
    backgroundColor: '#A9AEC4',
  },

  confirmBtnText: {
    color: colors.white,
    fontSize: moderateScale(15),
    fontWeight: '700',
  },
});

export default styles;
