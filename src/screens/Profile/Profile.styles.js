import {StyleSheet} from 'react-native';
import {colors} from '../../theme/colors';
import {IS_TABLET} from '../../theme/device';
import {ms, vs} from './constants';

export const FIELD_GUTTER = ms(14);

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.navy,
  },

  page: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: vs(32),
  },

  /* ---------- Header ---------- */
  dashboardHeader: {
    paddingHorizontal: ms(16),
    paddingTop: vs(10),
    paddingBottom: vs(22),
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },

  // Fills the header's white badge so the whole square stays tappable.
  backBtn: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    marginLeft: ms(4),
    color: colors.white,
    fontSize: IS_TABLET ? ms(17) : ms(19),
    fontWeight: '700',
  },

  headerSubtitle: {
    color: colors.onDarkMedium,
    fontSize: IS_TABLET ? ms(11) : ms(12),
  },

  /* ---------- Identity card ---------- */
  body: {
    paddingHorizontal: ms(16),
    paddingTop: vs(16),
  },

  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: ms(14),
    paddingHorizontal: ms(16),
    paddingVertical: vs(16),
    gap: ms(14),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  avatarWrap: {
    width: ms(56),
    height: ms(56),
  },

  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: ms(28),
    backgroundColor: colors.gray400,
  },

  // Camera affordance pinned to the lower-right of the avatar.
  avatarBadge: {
    position: 'absolute',
    right: -ms(1),
    bottom: 0,
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    backgroundColor: colors.splashSubtitle,
    borderWidth: 1,
    borderColor: colors.border_Color,
    alignItems: 'center',
    justifyContent: 'center',
  },

  identityText: {
    flex: 1,
    minWidth: 0,
  },

  driverName: {
    color: colors.textStrong,
    fontSize: ms(18),
    fontWeight: '700',
  },

  driverRole: {
    color: colors.textMuted,
    fontSize: ms(12),
    fontWeight: '500',
    marginTop: vs(3),
  },

  /* ---------- Section card ---------- */
  section: {
    backgroundColor: colors.white,
    borderRadius: ms(12),
    marginTop: vs(16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },

  sectionHeader: {
    backgroundColor: colors.navy,
    paddingHorizontal: ms(14),
    paddingVertical: vs(9),
  },

  sectionTitle: {
    color: colors.white,
    fontSize: ms(13),
    fontWeight: '600',
  },

  sectionBody: {
    paddingHorizontal: ms(14),
    paddingTop: vs(14),
    paddingBottom: vs(6),
  },

  /* ---------- Fields ---------- */
  fieldRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -FIELD_GUTTER / 2,
  },

  field: {
    paddingHorizontal: FIELD_GUTTER / 2,
    marginBottom: vs(14),
  },

  fieldLabel: {
    color: colors.textStrong,
    fontSize: ms(12),
    fontWeight: '600',
    marginBottom: vs(6),
  },

  input: {
    backgroundColor: colors.gray400,
    borderRadius: ms(8),
    paddingHorizontal: ms(12),
    paddingVertical: vs(9),
    fontSize: ms(13),
    fontWeight: '500',
    color: colors.textStrong,
    // RN's default input padding fights the fixed height on Android.
    includeFontPadding: false,
  },

  inputEditable: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border_Color,
  },

  /* ---------- Face lock row ---------- */
  faceLockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border_Color,
    paddingTop: vs(12),
    paddingBottom: vs(10),
    gap: ms(12),
  },

  faceLockText: {
    flex: 1,
    minWidth: 0,
  },

  faceLockTitle: {
    color: colors.textStrong,
    fontSize: ms(14),
    fontWeight: '600',
  },

  faceLockSub: {
    color: colors.textMuted,
    fontSize: ms(11),
    fontWeight: '500',
    marginTop: vs(2),
  },

  // Chevron_Down points down, so the row rotates it into a right chevron.
  chevron: {
    transform: [{rotate: '-90deg'}],
  },

  /* ---------- Insurance row ---------- */
  insuranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: vs(4),
    paddingBottom: vs(10),
    gap: ms(12),
  },

  insuranceText: {
    flex: 1,
    minWidth: 0,
  },

  insuranceTitle: {
    color: colors.textStrong,
    fontSize: ms(14),
    fontWeight: '600',
  },

  insuranceSub: {
    color: colors.textMuted,
    fontSize: ms(11),
    fontWeight: '500',
    marginTop: vs(2),
  },

  insurancePill: {
    minWidth: ms(56),
    alignItems: 'center',
    borderRadius: ms(6),
    borderWidth: 1,
    paddingHorizontal: ms(14),
    paddingVertical: vs(5),
    backgroundColor: colors.successLight,
    borderColor: colors.sucess_border,
  },

  insurancePillOff: {
    backgroundColor: colors.gray400,
    borderColor: colors.border_Color,
  },

  insurancePillText: {
    color: colors.success_text,
    fontSize: ms(12),
    fontWeight: '600',
  },

  insurancePillTextOff: {
    color: colors.textMuted,
  },

  /* ---------- Onboarding notice ---------- */
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightbg_gray2,
    borderRadius: ms(6),
    paddingHorizontal: ms(12),
    paddingVertical: vs(8),
    marginTop: vs(14),
    gap: ms(8),
  },

  noticeText: {
    flex: 1,
    color: colors.white,
    fontSize: IS_TABLET ? ms(8) : ms(10),
    fontWeight: '500',
  },

  /* ---------- Build version ---------- */
  versionWrap: {
    alignItems: 'center',
    paddingTop: vs(18),
    paddingBottom: vs(6),
  },

  versionText: {
    color: colors.textMuted,
    fontSize: ms(11),
    fontWeight: '500',
  },
});
