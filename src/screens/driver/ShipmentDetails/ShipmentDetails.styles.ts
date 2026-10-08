import {StyleSheet} from 'react-native';
import {colors} from '../../../theme/colors';
import {fontSize} from '../../../theme/fontSizes';
import {ms, vs} from './constants';
import {IS_TABLET} from '../../../theme/device';

// Contact cards are outlined rather than filled — the blue keeps them tied to
// the route above without competing with the two grey grids below.
const CONTACT_BORDER = colors.accentBlue;

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  /* ---------- Header ---------- */
  // Nothing but the back button lives up here; the load's identity is the first
  // thing in the white sheet instead, so the title can run full width.
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: IS_TABLET ? ms(14) : ms(16),
    paddingTop: IS_TABLET ? vs(8) : vs(10),
    paddingBottom: IS_TABLET ? vs(8) : vs(10),
    flexDirection: 'row',
    alignItems: 'center',
  },

  backBtn: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(10),
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ---------- Sheet ---------- */
  scroll: {
    flex: 1,
    backgroundColor: colors.white,
  },

  scrollContent: {
    paddingHorizontal: IS_TABLET ? ms(14) : ms(16),
    paddingTop: IS_TABLET ? vs(12) : vs(14),
    paddingBottom: IS_TABLET ? vs(30) : vs(32),
  },

  /* ---------- Chips + status ---------- */
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  chipsLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },

  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paleBlue,
    borderRadius: ms(15),
    paddingHorizontal: IS_TABLET ? ms(6) : ms(5),
    paddingVertical: IS_TABLET ? vs(2) : vs(4),
    marginRight: ms(8),
  },

  modePillText: {
    marginLeft: ms(5),
    fontSize: fontSize.small,
    color: colors.accentBlue,
    fontWeight: '700',
  },

  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: ms(8),
    backgroundColor: colors.border_Color,
    borderRadius: ms(15),
    paddingHorizontal: IS_TABLET ? ms(6) : ms(5),
    paddingVertical: IS_TABLET ? vs(2) : vs(4),
  },

  metaChipText: {
    marginLeft: ms(4),
    fontSize: fontSize.small,
    color: colors.textMuted,
    fontWeight: '500',
  },

  statusBadge: {
    backgroundColor: colors.button_color,
    borderRadius: ms(4),
    paddingHorizontal: IS_TABLET ? ms(6) : ms(5),
    paddingVertical: IS_TABLET ? vs(2) : vs(4),
    marginLeft: ms(8),
  },

  // The endpoint sends no status, so the badge drops its solid blue: a filled
  // pill reads as a live state the load does not actually have.
  statusBadgeMissing: {
    backgroundColor: colors.border_Color,
  },

  statusBadgeText: {
    fontSize: fontSize.label,
    color: colors.white,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // White on the grey placeholder pill would be unreadable.
  statusBadgeTextMissing: {
    color: colors.textMuted,
    fontWeight: '500',
    fontStyle: 'italic',
  },

  /* ---------- Winning bid ---------- */
  winningBidBox: {
    alignItems: 'flex-end',
  },

  winningBidValue: {
    fontSize: fontSize.heading,
    color: colors.textStrong,
    fontWeight: '700',
  },

  // The amount itself has no API field yet, so it renders as the same muted
  // placeholder every other missing cell on this screen uses.
  winningBidValueMissing: {
    color: colors.textMuted,
    fontWeight: '400',
    fontStyle: 'italic',
  },

  winningBidLabel: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: vs(2),
  },

  /* ---------- Route title ---------- */
  routeTitle: {
    fontSize: fontSize.body,
    color: colors.textStrong,
    fontWeight: '700',
    marginTop: vs(8),
  },

  routeArrow: {
    color: colors.textStrong,
    fontWeight: '600',
  },

  /* ---------- Route + map ---------- */
  routeBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: vs(12),
  },

  // minWidth 0 lets the long stop labels ellipsize instead of pushing the map
  // past the sheet's right edge on narrow phones.
  // paddingLeft insets the whole route block — summary, markers, dashed
  // connector and labels move together — so the dots don't sit flush against
  // the sheet edge. Screen-local: it rides in on RouteStops' `style` prop, so
  // ActiveBidding and the other callers keep their original alignment.
  routeStopsCol: {
    flex: 1,
    minWidth: 0,
    paddingLeft: ms(8),
  },

  // Taller than the auction thumbnail because this block has four stops beside
  // it rather than two.
  mapThumb: {
    height: vs(150),
    marginBottom: 0,
  },

  /* ---------- Failing the call ---------- */
  // Takes the ScrollView's place when the detail call comes back an error, so
  // the page never shows a half-drawn load. A call still in flight draws the
  // sheet's own bones instead (SHIPMENT_DETAIL_BONES).
  stateBox: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ms(24),
  },

  stateText: {
    fontSize: fontSize.subBody,
    color: colors.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Every "----" on the page is greyed and un-bolded, so a slot the
  // backend has not filled never reads as a real value.
  textMissing: {
    color: colors.textMuted,
    fontStyle: 'italic',
  },

  /* ---------- Contacts ---------- */
  contactsRow: {
    flexDirection: 'row',
    gap: ms(12),
    marginTop: vs(16),
  },

  // Row layout — text on the left, the call button pinned to the right and
  // centred against the two text lines, as the design shows it.
  contactCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: CONTACT_BORDER,
    borderRadius: ms(8),
    paddingHorizontal: IS_TABLET ? ms(10) : ms(12),
    paddingVertical: IS_TABLET ? ms(10) : vs(12),
    backgroundColor: colors.white,
  },

  // The drop card swaps to green — same pickup/drop colour pairing as the
  // CityRing/DropPin markers in RouteStops, so a contact reads as the stop
  // it belongs to without re-reading its label.
  contactCardDrop: {
    borderColor: colors.success,
  },

  contactTextCol: {
    flex: 1,
    minWidth: 0,
  },

  // Doubles as the card's headline in this layout — no separate contact-name
  // line is shown, so the kicker carries the weight a title normally would.
  contactKicker: {
    fontSize: fontSize.label,
    color: colors.accentBlue,
    fontWeight: '700',
  },

  contactKickerDrop: {
    color: colors.success,
  },

  contactName: {
    fontSize: fontSize.body,
    color: colors.textStrong,
    fontWeight: '700',
    marginTop: vs(4),
  },

  contactRole: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    fontWeight: '400',
    marginTop: vs(1),
  },

  phoneBtn: {
    marginLeft: ms(8),
  },

  // The dock line — tinted the same colour as the kicker instead of neutral
  // text, so the whole card reads as one coloured unit.
  contactAccess: {
    fontSize: fontSize.small,
    color: colors.accentBlue,
    fontWeight: '500',
    marginTop: vs(2),
  },

  contactAccessDrop: {
    color: colors.success,
  },

  remarksLabel: {
    fontSize: fontSize.small,
    color: colors.danger,
    fontWeight: '700',
    marginTop: vs(8),
  },

  remarksText: {
    fontSize: fontSize.small,
    color: colors.textStrong,
    fontWeight: '400',
    marginTop: vs(1),
  },

  /* ---------- Grid sections ---------- */
  sectionLabel: {
    fontSize: fontSize.label,
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: vs(20),
  },

  // The hairline grid comes from per-cell borders so the outer frame stays a
  // single rounded rectangle. Cell width is set per grid by `DetailGrid`'s
  // `columns` prop — 2 for Trailer Terms, 3 for Shipment/Reefer Details.
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderWidth: 1,
    borderColor: colors.border_Color,
    borderRadius: ms(6),
    marginTop: vs(8),
    overflow: 'hidden',
  },

  gridCell: {
    paddingHorizontal: IS_TABLET ? ms(8) : ms(10),
    paddingVertical: IS_TABLET ? vs(6) : vs(8),
  },

  gridCellRightBorder: {
    borderRightWidth: 1,
    borderRightColor: colors.border_Color,
  },

  gridCellBottomBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border_Color,
  },

  gridLabel: {
    fontSize: fontSize.micro,
    color: colors.textMuted,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  gridValue: {
    fontSize: fontSize.label,
    color: colors.textStrong,
    fontWeight: '700',
    marginTop: vs(3),
  },

  gridValueSuccess: {
    color: colors.success,
  },

  gridValueMissing: {
    color: colors.textMuted,
    fontWeight: '400',
    fontStyle: 'italic',
  },

  gridSub: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    fontWeight: '400',
    marginTop: vs(2),
  },
});
