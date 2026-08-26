/**
 * Bone layouts for the screens that wait on an API call.
 *
 * A skeleton is only worth drawing if it stands where the content will: the
 * numbers below are the sizes of the rows and figures they replace, so the
 * card does not jump when the payload lands. They live here rather than in
 * each screen's stylesheet because two screens read the same shipments call
 * and should wait on it the same way.
 */

import {ms, vs} from '../../theme/scale';
import {IS_TABLET} from '../../theme/device';

// Both screens scale themselves down on phones (see the PHONE_FACTOR at the
// top of HomeScreen.styles and ShipmentScreen.styles). The bones have to be
// measured the same way, or they overhang the cells they stand in for.
const HOME_FACTOR = IS_TABLET ? 1 : 0.78;
const hms = n => ms(n) * HOME_FACTOR;
const hvs = n => vs(n) * HOME_FACTOR;

const TABLE_FACTOR = IS_TABLET ? 1 : 0.82;
const tms = n => ms(n) * TABLE_FACTOR;
const tvs = n => vs(n) * TABLE_FACTOR;

const RADIUS = ms(6);

/**
 * One bone. Everything below is built from it so every placeholder in the app
 * shares a corner radius.
 *
 * @param {number|string} width
 * @param {number} height
 * @param {object} [extra] anything else the bone needs — margins, alignment,
 *   a rounder radius for a pill.
 */
export const bone = (width, height, extra) => ({
  width,
  height,
  borderRadius: RADIUS,
  ...extra,
});

/** A bone group: a plain View the library lays its child bones out inside. */
const group = (style, children) => ({...style, children});

/* ------------------------------------------------------------------ *
 * Home — Current Trip card
 * Stands in for everything the trip call fills: the countdown pill, the
 * payout, the route box, the three trip stats and the hours-of-service bar.
 * ------------------------------------------------------------------ */
export const TRIP_CARD_BONES = [
  // "Starts in …" pill, right-aligned like the real one.
  bone(hms(78), hvs(18), {alignSelf: 'flex-end', marginTop: hvs(8)}),

  // Payout figure + its label.
  group({flexDirection: 'row', alignItems: 'center', marginTop: hvs(6)}, [
    bone(hms(96), hvs(26)),
    bone(hms(62), hvs(14), {marginLeft: hms(8)}),
  ]),

  // Route box — the tallest thing on the card, so the one that decides
  // whether the card resizes when the trip arrives.
  bone('100%', hvs(96), {marginTop: hvs(8), borderRadius: ms(10)}),

  // Miles / stops / ETA.
  group({flexDirection: 'row', marginTop: hvs(16)}, [
    ...[0, 1, 2].map(index =>
      group({flex: 1, alignItems: 'center', paddingHorizontal: hms(2)}, [
        bone(hms(38), hvs(13)),
        bone(hms(50), hvs(10), {marginTop: hvs(5)}),
      ]),
    ),
  ]),

  // "Hours of Service" caption + its figure, then the bar itself.
  group(
    {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: hvs(14),
    },
    [bone(hms(74), hvs(11)), bone(hms(44), hvs(11))],
  ),
  bone('100%', hvs(6), {marginTop: hvs(7), borderRadius: ms(8)}),
];

/* ------------------------------------------------------------------ *
 * Home — Fuel Rewards balance
 * Only the points figure is fetched; the copy around it is static, so the
 * bone replaces the number alone.
 * ------------------------------------------------------------------ */
export const REWARD_POINTS_BONES = [bone(hms(52), hvs(13))];

/* ------------------------------------------------------------------ *
 * Home — Hours of Service card
 * The whole panel is fetched — duty pill, the driven/limit row, the bar and
 * the two detail rows — so the bones cover everything under the title.
 * ------------------------------------------------------------------ */
export const HOS_CARD_BONES = [
  // "8h 23m Driven" against "11h Total".
  group(
    {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: hvs(14),
      marginBottom: hvs(6),
    },
    [bone(hms(96), hvs(14)), bone(hms(52), hvs(13))],
  ),

  // The bar.
  bone('100%', hvs(6), {borderRadius: ms(8)}),

  // Remaining Driving Hours / Reset Available.
  ...[0, 1].map(() =>
    group(
      {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: hvs(12),
      },
      [bone(hms(104), hvs(10)), bone(hms(58), hvs(10))],
    ),
  ),
];

/* ------------------------------------------------------------------ *
 * Home — Upcoming Shipment rows
 * ------------------------------------------------------------------ */

// Route lines are staggered so the block reads as a list of different loads
// rather than a striped pattern.
const LOAD_ROUTE_WIDTHS = ['72%', '58%', '66%', '54%'];

/**
 * @param {number} [count] rows to draw. Four is what the card shows before it
 *   has to scroll — enough to fill it, not so many that the shimmer runs on
 *   below the fold.
 */
export const upcomingLoadBones = (count = 4) =>
  Array.from({length: count}, (_, index) =>
    group(
      {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: hvs(10),
        paddingHorizontal: hms(10),
        ...(index > 0 ? {borderTopWidth: 1, borderTopColor: '#EEF1F6'} : null),
      },
      [
        group({flex: 1, paddingRight: hms(8)}, [
          bone(LOAD_ROUTE_WIDTHS[index % LOAD_ROUTE_WIDTHS.length], hvs(9)),
          bone('44%', hvs(9), {marginTop: hvs(7)}),
        ]),
        bone(hms(62), hvs(9)),
      ],
    ),
  );

/* ------------------------------------------------------------------ *
 * Shipment table — UPCOMING rows
 * Column flexes match ShipmentScreen.styles (col0…col3) so the bones line up
 * under the headings the table has already drawn.
 * ------------------------------------------------------------------ */

const ROUTE_WIDTHS = ['88%', '70%', '82%', '64%', '76%', '68%'];

/**
 * @param {number} [count] rows to draw — six fills the table on a phone.
 */
export const shipmentRowBones = (count = 6) =>
  Array.from({length: count}, (_, index) =>
    group(
      {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: tms(14),
        paddingVertical: tvs(12),
      },
      [
        // AWB number over its load-type badge.
        group({flex: 0.9, alignItems: 'center'}, [
          bone(tms(48), tvs(8)),
          bone(tms(34), tvs(9), {marginTop: tvs(5)}),
        ]),
        // Route.
        group({flex: 1.25, paddingHorizontal: tms(6)}, [
          bone(ROUTE_WIDTHS[index % ROUTE_WIDTHS.length], tvs(8)),
          bone('62%', tvs(8), {marginTop: tvs(6)}),
        ]),
        // Payout over distance.
        group({flex: 0.9, alignItems: 'center'}, [
          bone(tms(36), tvs(8)),
          bone(tms(44), tvs(7), {marginTop: tvs(5)}),
        ]),
        // Pickup pill.
        group({flex: 1.1, alignItems: 'center'}, [
          bone(tms(62), tvs(15), {borderRadius: tms(8)}),
        ]),
      ],
    ),
  );
