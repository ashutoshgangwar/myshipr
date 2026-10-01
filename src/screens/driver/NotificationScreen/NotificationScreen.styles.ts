import {StyleSheet} from 'react-native';
import {colors} from '../../../theme/colors';
import {fontSize} from '../../../theme/fontSizes';
import {ms, vs} from './constants';
import {IS_TABLET} from '../../../theme/device';

// How far the filter row rides up over the blue header, matching the overlap
// pattern the other detail screens use.
const HEADER_OVERLAP = IS_TABLET ? vs(26) : vs(24);
const HEADER_CLEARANCE = IS_TABLET ? vs(16) : vs(18);

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  page: {
    flex: 1,
    backgroundColor: colors.white,
  },

  /* ---------- Header ---------- */
  dashboardHeader: {
    paddingHorizontal: IS_TABLET ? ms(14) : ms(16),
    paddingTop: IS_TABLET ? vs(8) : vs(10),
    // Extra blue below the title so the filter row can overlap it.
    paddingBottom: HEADER_CLEARANCE + HEADER_OVERLAP,
    borderBottomLeftRadius: ms(36),
    borderBottomRightRadius: ms(36),
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
    fontSize: fontSize.title,
    fontWeight: '700',
    letterSpacing: 0.6,
  },

  headerSubtitle: {
    color: colors.white,
    fontSize: fontSize.label,
  },

  markAllBtn: {
    paddingHorizontal: ms(10),
    paddingVertical: vs(6),
    borderRadius: ms(20),
    borderWidth: 1,
    borderColor: colors.white,
  },

  markAllText: {
    color: colors.white,
    fontSize: fontSize.caption,
    fontWeight: '600',
  },

  /* ---------- Sheet ---------- */
  scroll: {
    flex: 1,
    backgroundColor: colors.white,
  },

  scrollContent: {
    paddingBottom: IS_TABLET ? vs(30) : vs(32),
  },

  body: {
    paddingHorizontal: IS_TABLET ? ms(14) : ms(16),
  },

  /* ---------- Filter chips ---------- */
  filterRow: {
    marginTop: -HEADER_OVERLAP,
    marginHorizontal: IS_TABLET ? ms(14) : ms(16),
    zIndex: 1,
    flexDirection: 'row',
    gap: ms(8),
    backgroundColor: colors.white,
    borderRadius: ms(5),
    paddingHorizontal: IS_TABLET ? ms(10) : ms(12),
    paddingVertical: IS_TABLET ? vs(8) : vs(10),
    shadowColor: colors.textStrong,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },

  filterChip: {
    paddingHorizontal: ms(14),
    paddingVertical: vs(6),
    borderRadius: ms(20),
    backgroundColor: colors.screenBg,
  },

  filterChipActive: {
    backgroundColor: colors.primary,
  },

  filterChipText: {
    color: colors.textMuted,
    fontSize: fontSize.label,
    fontWeight: '600',
  },

  filterChipTextActive: {
    color: colors.white,
  },

  /* ---------- Sections ---------- */
  sectionLabel: {
    marginTop: IS_TABLET ? vs(16) : vs(18),
    marginBottom: IS_TABLET ? vs(6) : vs(8),
    color: colors.textStrong,
    fontSize: fontSize.subBody,
    fontWeight: '700',
  },

  /* ---------- Notification row ---------- */
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ms(10),
    backgroundColor: colors.white,
    borderRadius: ms(5),
    borderWidth: 1,
    borderColor: colors.border_Color,
    paddingHorizontal: IS_TABLET ? ms(10) : ms(12),
    paddingVertical: IS_TABLET ? vs(9) : vs(11),
    marginBottom: IS_TABLET ? vs(8) : vs(9),
  },

  // Unread rows read louder: a tinted fill plus the accent stripe.
  cardUnread: {
    backgroundColor: colors.white,
    borderLeftWidth: ms(3),
    borderLeftColor: colors.accentBlue,
  },

  iconBadge: {
    width: IS_TABLET ? ms(30) : ms(34),
    height: IS_TABLET ? ms(30) : ms(34),
    borderRadius: ms(20),
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardBody: {
    flex: 1,
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ms(6),
  },

  cardTitle: {
    flex: 1,
    color: colors.textStrong,
    fontSize: fontSize.subBody,
    fontWeight: '700',
  },

  cardTime: {
    color: colors.textMuted,
    fontSize: fontSize.small,
  },

  cardMessage: {
    marginTop: vs(2),
    color: colors.textMuted,
    fontSize: fontSize.caption,
    lineHeight: IS_TABLET ? ms(15) : ms(16),
  },

  unreadDot: {
    width: ms(7),
    height: ms(7),
    borderRadius: ms(7),
    marginTop: ms(5),
    backgroundColor: colors.accentBlue,
  },

  /* ---------- Empty state ---------- */
  emptyWrap: {
    alignItems: 'center',
    paddingTop: IS_TABLET ? vs(50) : vs(56),
    paddingHorizontal: ms(24),
  },

  emptyTitle: {
    marginTop: IS_TABLET ? vs(10) : vs(12),
    color: colors.textStrong,
    fontSize: fontSize.body,
    fontWeight: '700',
  },

  emptyNote: {
    marginTop: vs(4),
    color: colors.textMuted,
    fontSize: fontSize.caption,
    textAlign: 'center',
  },
});
