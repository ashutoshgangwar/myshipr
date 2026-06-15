import {StyleSheet, Platform} from 'react-native';
import {scale, verticalScale, moderateScale} from 'react-native-size-matters';
import {colors} from '../theme/colors';
import {select} from '../utils/device';

// Cap the form column on tablets so inputs/buttons don't stretch edge-to-edge.
const CONTENT_MAX_WIDTH = select({phone: undefined, tablet: scale(460)});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },

  scrollContent: {
    paddingBottom: verticalScale(28),
  },

  /* Hero header */
  hero: {
    width: '100%',
    height: verticalScale(170),
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
    paddingBottom: verticalScale(18),
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
    backgroundColor: colors.white,
    marginTop: -verticalScale(18),
    marginHorizontal: scale(12),
    borderRadius: moderateScale(20),
    paddingHorizontal: scale(16),
    paddingTop: verticalScale(18),
    paddingBottom: verticalScale(18),
    maxWidth: CONTENT_MAX_WIDTH,
    width: CONTENT_MAX_WIDTH ? '100%' : undefined,
    alignSelf: CONTENT_MAX_WIDTH ? 'center' : 'stretch',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(12),
    elevation: 3,
  },

  /* Tabs */
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF1F6',
    borderRadius: moderateScale(14),
    padding: moderateScale(4),
    marginBottom: verticalScale(16),
  },

  tab: {
    flex: 1,
    flexDirection: 'row',
    gap: scale(6),
    paddingVertical: verticalScale(9),
    borderRadius: moderateScale(11),
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabActive: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(5),
    elevation: 2,
  },

  tabText: {
    fontSize: moderateScale(13),
    fontWeight: '600',
    color: '#6B7280',
  },

  tabTextActive: {
    color: colors.textOnLightStrong,
  },

  /* Search */
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    borderWidth: 1,
    borderColor: colors.border_Color,
    backgroundColor: '#F8FAFC',
    borderRadius: moderateScale(12),
    paddingHorizontal: scale(12),
    paddingVertical: Platform.OS === 'ios' ? verticalScale(11) : verticalScale(4),
    marginBottom: verticalScale(12),
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
    paddingVertical: verticalScale(12),
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
    paddingVertical: verticalScale(15),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(6),
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
