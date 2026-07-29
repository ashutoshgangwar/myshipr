import {Platform, StyleSheet} from 'react-native';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';
import {colors} from '../../theme/colors';
import {IS_TABLET, select} from '../../theme/device';

const PHONE_FACTOR = select({phone: 0.82, tablet: 1});
const ms = n => baseMs(n) * PHONE_FACTOR;
const vs = n => baseVs(n) * PHONE_FACTOR;

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.screenBg,
  },

  page: {
    flex: 1,
  },

  /* ---------- Header ---------- */
  // extra bottom room reserved for the floating featured card that
  // straddles the header edge (see featuredCard marginTop)
  headerPad: {
    paddingBottom: vs(60),
  },

  // The title/subtitle/badge come from the shared DashboardHeader — this screen
  // deliberately keeps no local copies of them, so the header size stays in
  // step with Home and Earnings.
  headerCalendarBtn: {
    width: IS_TABLET ? ms(30) : ms(36),
    height: IS_TABLET ? ms(30) : ms(36),
    borderRadius: ms(10),
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ---------- Week strip ---------- */
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: vs(16),
    gap: ms(6),
  },

  dayPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: vs(5),
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  dayPillActive: {
    backgroundColor: colors.accentBlue,
    borderColor: colors.accentBlue,
  },

  dayLabel: {
    color: colors.onDarkLow,
    fontSize: ms(10),
    fontWeight: '600',
    marginBottom: vs(3),
  },

  dayLabelActive: {
    color: colors.white,
  },

  dayNumber: {
    color: colors.white,
    fontSize: ms(16),
    fontWeight: '700',
  },

  dayDot: {
    width: ms(5),
    height: ms(5),
    borderRadius: ms(5),
    backgroundColor: colors.warning,
    marginTop: vs(4),
  },

  dayDotPlaceholder: {
    width: ms(5),
    height: ms(5),
    marginTop: vs(4),
  },

  /* ---------- Featured card (overlaps header) ---------- */
  featuredCard: {
    backgroundColor: colors.white,
    borderRadius: ms(8),
    marginHorizontal: ms(14),
    marginTop: -vs(40),
    paddingHorizontal: ms(16),
    paddingVertical: vs(14),
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
    elevation: 3,
  },

  featuredTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  featuredRouteWrap: {
    flex: 1,
    paddingRight: ms(8),
  },

  featuredRoute: {
    color: colors.textStrong,
    fontSize: ms(15),
    fontWeight: '700',
  },

  featuredPickup: {
    color: colors.textMuted,
    fontSize: ms(12),
    fontWeight: '500',
    marginTop: vs(3),
  },

  featuredAmount: {
    color: colors.textStrong,
    fontSize: ms(15),
    fontWeight: '700',
    textAlign: 'right',
  },

  featuredMiles: {
    color: colors.textMuted,
    fontSize: ms(11),
    fontWeight: '500',
    textAlign: 'right',
    marginTop: vs(2),
  },

  featuredDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border_Color,
    marginVertical: vs(12),
  },

  featuredBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
      marginVertical: vs(15),
  },

  miniStat: {
    marginRight: ms(16),
  },

  miniStatLabel: {
    color: colors.textMuted,
    fontSize: ms(10),
    fontWeight: '500',
  },

  miniStatValue: {
    color: colors.textStrong,
    fontSize: ms(13),
    fontWeight: '700',
    marginTop: vs(2),
  },

  miniStatsGroup: {
    flexDirection: 'row',
    flex: 1,
  },

  startBtn: {
    backgroundColor: colors.success,
    borderRadius: ms(8),
    paddingHorizontal: ms(16),
    paddingVertical: vs(9),
  },

  startBtnText: {
    color: colors.white,
    fontSize: ms(13),
    fontWeight: '700',
  },

  /* ---------- Empty featured ---------- */
  emptyTitle: {
    color: colors.textStrong,
    fontSize: ms(15),
    fontWeight: '700',
  },

  emptySubtitle: {
    color: colors.textMuted,
    fontSize: ms(12),
    fontWeight: '500',
    textAlign: 'center',
    marginTop: vs(18),
  },

  /* ---------- Trips list ---------- */

  listCard: {
     flexGrow: 0,
     flexShrink: 1,
     backgroundColor: colors.white,
     borderRadius: ms(10),
     marginHorizontal: ms(12),
     marginTop: vs(14),
     marginBottom: vs(14),
     paddingHorizontal: ms(14),
   },

   listContent: {
     paddingBottom: vs(16),
   },

   row: {
   flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: vs(12),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border_Color,
   },
 
   rowLast: {
     borderBottomWidth: 0,
   },
 
   rowLeft: {
     flex: 1,
     paddingRight: ms(8),
   },
 
   rowRoute: {
     color: colors.textStrong,
     fontSize: ms(14),
     fontWeight: '600',
   },
 
   rowMeta: {
     color: colors.textMuted,
     fontSize: ms(12),
     fontWeight: '500',
     marginTop: vs(3),
   },
 
   rowRight: {
     alignItems: 'flex-end',
   },
 
   rowAmount: {
     color: colors.textStrong,
     fontSize: ms(15),
     fontWeight: '700',
   },

   rowMiles: {
     color: colors.textMuted,
     fontSize: ms(11),
     fontWeight: '500',
     marginTop: vs(2),
   },
});
