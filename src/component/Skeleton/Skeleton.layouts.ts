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
import {colors} from '../../theme/colors';
import type {DimensionValue, ViewStyle} from 'react-native';

// Both screens scale themselves down on phones (see the PHONE_FACTOR at the
// top of HomeScreen.styles and ShipmentScreen.styles). The bones have to be
// measured the same way, or they overhang the cells they stand in for.
const HOME_FACTOR = IS_TABLET ? 1 : 0.78;
const hms = (n: number): number => ms(n) * HOME_FACTOR;
const hvs = (n: number): number => vs(n) * HOME_FACTOR;

const TABLE_FACTOR = IS_TABLET ? 1 : 0.82;
const tms = (n: number): number => ms(n) * TABLE_FACTOR;
const tvs = (n: number): number => vs(n) * TABLE_FACTOR;

const RADIUS = ms(6);

/**
 * One bone. Everything below is built from it so every placeholder in the app
 * shares a corner radius.
 *
 * @param width
 * @param height
 * @param extra anything else the bone needs — margins, alignment, a rounder
 *   radius for a pill.
 */
export const bone = (
  width: DimensionValue,
  height: DimensionValue,
  extra?: ViewStyle,
): ViewStyle => ({
  width,
  height,
  borderRadius: RADIUS,
  ...extra,
});

/** A bone group: a plain View the library lays its child bones out inside. */
const group = (
  style: ViewStyle,
  children: ViewStyle[],
): ViewStyle & {children: ViewStyle[]} => ({...style, children});

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
    ...[0, 1, 2].map(_index =>
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
const LOAD_ROUTE_WIDTHS = ['72%', '58%', '66%', '54%'] as const;

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
        ...(index > 0 ? {borderTopWidth: 1, borderTopColor: colors.screenBg} : null),
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

const ROUTE_WIDTHS = ['88%', '70%', '82%', '64%', '76%', '68%'] as const;

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

/* ------------------------------------------------------------------ *
 * Dashboard header — the floating stat cards and the gross figure
 * The cards each wait on their own call, so their bones cover only the two
 * things that call fills: the value and the sparkline beside it. The label,
 * icon and delta pill are the screen's own and stay drawn while the call is
 * out, which is what keeps the card its full height and stops the row from
 * shifting when the payload lands.
 * ------------------------------------------------------------------ */

const HEADER_FACTOR = IS_TABLET ? 1 : 0.82;
const dms = (n: number): number => ms(n) * HEADER_FACTOR;
const dvs = (n: number): number => vs(n) * HEADER_FACTOR;

/** Stands in for a stat card's value and its sparkline, side by side. */
export const STAT_CARD_BONES = [
  group(
    {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginTop: dvs(6),
    },
    [
      bone(dms(78), dvs(20)),
      bone(dms(IS_TABLET ? 105 : 60), dvs(IS_TABLET ? 30 : 20)),
    ],
  ),
];

/**
 * Stands in for the gross figure in the blue header — one wide bone the size
 * of the money it replaces. Drawn with `onDark`, so it shows as translucent
 * white rather than a grey hole in the gradient.
 */
export const GROSS_BONES = [bone(dms(140), dvs(18))];

/**
 * Stands in for the price in the header's DIESEL chip while the first call is
 * in flight.
 *
 * The chip pins its value to a fixed slot, so the bone takes that slot whole
 * — both dimensions — rather than carrying measurements of its own. Sized
 * here it would be scaled by HEADER_FACTOR while the price it stands in for
 * is scaled by the chip's own factor, and the chip would resize by the
 * difference the moment the skeleton cleared, taking the header and the whole
 * scroll below it along. Drawn with `onDark` against the navy header.
 */
export const DIESEL_VALUE_BONES = [bone('100%', '100%')];

/* ------------------------------------------------------------------ *
 * The two detail sheets — ShipmentDetails and EarningsDetails
 *
 * Both open from a table row and both carry the same 0.82 phone down-scale
 * the table does (see each screen's constants.ts), so their bones are
 * measured on one footing. Everything on these sheets is the response to a
 * single call, so the bones stand for the whole page rather than for a card
 * inside it.
 * ------------------------------------------------------------------ */

const SHEET_FACTOR = IS_TABLET ? 1 : 0.82;
const sms = (n: number): number => ms(n) * SHEET_FACTOR;
const svs = (n: number): number => vs(n) * SHEET_FACTOR;

// The hairline the grids and the outlined cards are drawn with, so a bone
// frame reads as the same box the payload will fill. Taken from the palette
// rather than written out, so a frame here cannot drift from the real one.
const BORDER = colors.border_Color;

/** A chip-shaped bone — the mode pill, the date and time chips. */
const chip = (width: number, extra?: ViewStyle): ViewStyle =>
  bone(width, svs(18), {borderRadius: ms(15), ...extra});

// Stop names are staggered so the strip reads as different addresses rather
// than a stack of equal bars.
const STOP_NAME_WIDTHS = ['84%', '66%', '78%', '58%'] as const;

/**
 * The vertical route strip: one marker per stop with its name and window
 * beside it. Row height is RouteStops' own ROUTE_ROW_H — theme scale, not the
 * sheet's — so the bones stand exactly where the real stops will.
 *
 * @param count stops to draw.
 */
const routeStopBones = (count: number) =>
  Array.from({length: count}, (_, index) =>
    group(
      {flexDirection: 'row', alignItems: 'flex-start', height: ms(34)},
      [
        bone(ms(14), ms(14), {borderRadius: ms(7), marginRight: ms(6)}),
        group({flex: 1, minWidth: 0}, [
          bone(STOP_NAME_WIDTHS[index % STOP_NAME_WIDTHS.length], svs(9)),
          bone('44%', svs(7), {marginTop: svs(4)}),
        ]),
      ],
    ),
  );

/**
 * A two-column detail grid — "Trailer and Loading Terms", "Shipment Details",
 * "Bill of Lading". The frame and its hairlines are drawn here because the
 * real grid is not mounted while the call is out.
 *
 * @param rows rows of two cells.
 */
const detailGridBones = (rows: number) =>
  group(
    {
      borderWidth: 1,
      borderColor: BORDER,
      borderRadius: ms(6),
      marginTop: svs(8),
    },
    Array.from({length: rows}, (_, row) =>
      group(
        {
          flexDirection: 'row',
          ...(row > 0 ? {borderTopWidth: 1, borderTopColor: BORDER} : null),
        },
        [0, 1].map(cell =>
          group(
            {
              width: '50%',
              paddingHorizontal: sms(10),
              paddingVertical: svs(8),
              ...(cell === 0
                ? {borderRightWidth: 1, borderRightColor: BORDER}
                : null),
            },
            [
              bone(sms(44), svs(6)),
              bone(sms(72), svs(10), {marginTop: svs(4)}),
            ],
          ),
        ),
      ),
    ),
  );

/** A section heading — "Shipment Details" and the rest. */
const sectionLabelBone = () => bone(sms(112), svs(10), {marginTop: svs(20)});

/* ------------------------------------------------------------------ *
 * ShipmentDetails — the whole sheet
 * `GET /drivers/shipments/{shipmentId}/detail` fills every one of these, so
 * the page waits as one rather than showing a half-drawn load.
 * ------------------------------------------------------------------ */
export const SHIPMENT_DETAIL_BONES = [
  // Mode pill, date chip, time chip.
  group({flexDirection: 'row', alignItems: 'center'}, [
    chip(sms(50)),
    chip(sms(64), {marginLeft: sms(8)}),
    chip(sms(56), {marginLeft: sms(8)}),
  ]),

  // "San Jose, CA → Newark, NJ".
  bone('74%', svs(16), {marginTop: svs(10)}),

  // The route strip beside the map thumbnail — the tallest block on the
  // sheet, so the one that decides where everything below it starts.
  group(
    {flexDirection: 'row', alignItems: 'flex-start', marginTop: svs(12)},
    [
      group({flex: 1, minWidth: 0, paddingLeft: ms(8), paddingRight: ms(10)}, [
        // "ROUTE · 2 PICKUP · 1 DROP".
        bone(sms(96), svs(8), {marginBottom: vs(8)}),
        ...routeStopBones(4),
      ]),
      bone('45%', svs(150), {marginLeft: ms(10), borderRadius: ms(8)}),
    ],
  ),

  // Pickup and drop contacts, outlined the way the real cards are.
  group(
    {flexDirection: 'row', gap: sms(12), marginTop: svs(16)},
    [0, 1].map(() =>
      group(
        {
          flex: 1,
          borderWidth: 1,
          borderColor: BORDER,
          borderRadius: ms(8),
          padding: sms(10),
        },
        [
          bone(sms(54), svs(8)),
          bone(sms(86), svs(12), {marginTop: svs(5)}),
          bone(sms(74), svs(10), {marginTop: svs(9)}),
          bone('86%', svs(8), {marginTop: svs(6)}),
        ],
      ),
    ),
  ),

  // Trailer and loading terms.
  sectionLabelBone(),
  detailGridBones(2),

  // The load itself.
  sectionLabelBone(),
  detailGridBones(3),
];

/* ------------------------------------------------------------------ *
 * EarningsDetails
 * Split in two: the payout card keeps its own white, shadowed box — it rides
 * up over the blue header and must hold that position while the call is out —
 * so its bones go inside it, and the sections below get their own set.
 * ------------------------------------------------------------------ */

/** Inside the payout card: the figure, its chips, then the AWB/route line. */
export const PAYOUT_CARD_BONES = [
  group({flexDirection: 'row', alignItems: 'flex-start'}, [
    group({flex: 1, minWidth: 0, paddingRight: sms(8)}, [
      bone(sms(78), svs(12)),
      bone(sms(104), svs(22), {marginTop: svs(4)}),
    ]),
    group(
      {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
        gap: sms(6),
      },
      [chip(sms(46)), chip(sms(58)), chip(sms(44))],
    ),
  ]),

  // The card's own divider, then the AWB against the route.
  bone('100%', 1, {marginTop: svs(10), borderRadius: 0}),
  group(
    {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: svs(8),
    },
    [bone(sms(84), svs(9)), bone(sms(124), svs(10))],
  ),
];

/** Everything under the payout card: the grid, the pipeline, the account. */
export const PAYMENT_BODY_BONES = [
  // Bill of Lading Details.
  sectionLabelBone(),
  detailGridBones(3),

  // Payment Status — a dot, its step and when the step was stamped.
  sectionLabelBone(),
  group(
    {
      borderWidth: 1,
      borderColor: BORDER,
      borderRadius: ms(6),
      marginTop: svs(8),
    },
    [0, 1, 2, 3].map(row =>
      group(
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: sms(10),
          paddingVertical: svs(10),
          ...(row > 0 ? {borderTopWidth: 1, borderTopColor: BORDER} : null),
        },
        [
          bone(sms(7), sms(7), {borderRadius: sms(4), marginRight: sms(8)}),
          bone(sms(112), svs(10)),
          bone(sms(56), svs(10), {marginLeft: 'auto'}),
        ],
      ),
    ),
  ),

  // Payout Account — the bank glyph and the masked number beside it.
  sectionLabelBone(),
  group(
    {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: BORDER,
      borderRadius: ms(6),
      marginTop: svs(8),
      paddingHorizontal: sms(10),
      paddingVertical: svs(12),
    },
    [
      bone(sms(20), sms(20)),
      bone(sms(126), svs(10), {marginLeft: sms(10)}),
    ],
  ),
  bone(sms(150), svs(8), {marginTop: svs(6)}),
];

/* ------------------------------------------------------------------ *
 * ActiveTripScreen — the trip checklist
 * The panel opens over the map the moment the trip does, before
 * `GET /drivers/shipments/{tripId}` has said what the stops are. Bones give
 * the driver the shape of the run they are about to be shown; the panel keeps
 * its height either way, so it does not grow under their thumb.
 * ------------------------------------------------------------------ */

// Staggered so the list reads as different stops rather than a striped block.
const STEP_TITLE_WIDTHS = ['62%', '78%', '54%', '70%'] as const;

/**
 * @param count steps to draw. Four is a pre-trip inspection, a pickup and a
 *   couple of drops — the shape of an ordinary run, and as many as the docked
 *   panel shows before it scrolls.
 */
export const tripChecklistBones = (count = 4) =>
  Array.from({length: count}, (_, index) =>
    group({flexDirection: 'row', alignItems: 'flex-start'}, [
      // The bullet column, with its connector running on to the next step.
      group({width: ms(20), alignItems: 'center'}, [
        bone(ms(20), ms(20), {borderRadius: ms(10)}),
        ...(index < count - 1
          ? [bone(ms(2), vs(22), {marginVertical: vs(2), borderRadius: ms(1)})]
          : []),
      ]),
      group({flex: 1, minWidth: 0, paddingLeft: ms(10), paddingBottom: vs(10)}, [
        group(
          {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
          [
            bone(STEP_TITLE_WIDTHS[index % STEP_TITLE_WIDTHS.length], vs(12)),
            bone(ms(34), vs(9), {marginLeft: ms(8)}),
          ],
        ),
        bone('88%', vs(9), {marginTop: vs(6)}),
      ]),
    ]),
  );

/* ------------------------------------------------------------------ *
 * BiddingScreen — the bid table / grid rows
 * `POST /drivers/bids/search` fills the list, so the rows wait on it. The
 * widths mirror a row's route-over-ref on the left and the mode/auction/
 * distance/lowest cells that follow, staggered so the block reads as a list.
 * ------------------------------------------------------------------ */

const BID_ROUTE_WIDTHS = ['82%', '64%', '74%', '58%', '70%', '60%'] as const;

/**
 * @param count rows to draw — eight fills the table on a phone.
 */
export const biddingRowBones = (count = 8) =>
  Array.from({length: count}, (_, index) =>
    group(
      {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: tms(14),
        paddingVertical: tvs(14),
      },
      [
        // Route over its ref — the frozen Location column.
        group({flex: 1.3, paddingRight: tms(8)}, [
          bone(BID_ROUTE_WIDTHS[index % BID_ROUTE_WIDTHS.length], tvs(9)),
          bone('48%', tvs(8), {marginTop: tvs(6)}),
        ]),
        // Mode chip.
        bone(tms(40), tvs(16), {borderRadius: tms(8)}),
        // Pickup over its date.
        group({flex: 0.9, alignItems: 'center', paddingHorizontal: tms(6)}, [
          bone(tms(40), tvs(8)),
          bone(tms(30), tvs(7), {marginTop: tvs(5)}),
        ]),
        // Lowest bid.
        bone(tms(44), tvs(10), {marginLeft: tms(6)}),
      ],
    ),
  );

/* ------------------------------------------------------------------ *
 * ActiveBidding — the detail-driven sections
 * `GET /drivers/bids/{auctionId}/detail` fills the per-leg stops and the
 * Shipment Details grid, so those two sections wait on it while the route
 * header (from the tapped row) is already on screen.
 * ------------------------------------------------------------------ */

/**
 * The per-leg stop rows: a badge, the city over its address, and the date/
 * window beside it.
 *
 * @param count stops to draw.
 */
export const activeBidStopBones = (count = 2) =>
  Array.from({length: count}, (_, index) =>
    group(
      {flexDirection: 'row', alignItems: 'flex-start', paddingVertical: svs(10)},
      [
        bone(ms(22), ms(22), {borderRadius: ms(4), marginRight: sms(10)}),
        group({flex: 1, minWidth: 0}, [
          bone(STOP_NAME_WIDTHS[index % STOP_NAME_WIDTHS.length], svs(10)),
          bone('70%', svs(8), {marginTop: svs(6)}),
        ]),
        group({alignItems: 'flex-end'}, [
          bone(sms(48), svs(9)),
          bone(sms(60), svs(8), {marginTop: svs(5)}),
        ]),
      ],
    ),
  );

/** The Shipment Details grid — four rows of two cells, matching the real one. */
export const activeBidDetailBones = [detailGridBones(4)];

/**
 * BiddingScreen — the grid cards, for when the driver has switched the list to
 * the grid view. Each card is outlined like GridCard: a badge and ref/mode
 * chip across the top, the pickup→drop route, then a footer line.
 *
 * @param count cards to draw — four fills a phone, two rows on a tablet.
 * @param columns grid columns, so a card takes its share of the row.
 */
export const biddingCardBones = (count = 4, columns = 1) =>
  Array.from({length: count}, (_, index) =>
    group(
      {
        width: columns > 1 ? '49%' : '100%',
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: BORDER,
        borderRadius: ms(7),
        padding: ms(9),
        marginBottom: vs(10),
      },
      [
        group({flexDirection: 'row', alignItems: 'center'}, [
          bone(ms(34), ms(34), {borderRadius: ms(9)}),
          group({flex: 1, marginLeft: ms(8)}, [
            bone(BID_ROUTE_WIDTHS[index % BID_ROUTE_WIDTHS.length], vs(10)),
            bone(ms(56), vs(12), {marginTop: vs(5), borderRadius: ms(8)}),
          ]),
          bone(ms(62), vs(26), {borderRadius: ms(8)}),
        ]),
        bone('70%', vs(10), {marginTop: vs(14)}),
        bone('55%', vs(10), {marginTop: vs(8)}),
        bone('100%', 1, {marginTop: vs(12), borderRadius: 0}),
        group(
          {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: vs(10),
          },
          [bone(ms(70), vs(9)), bone(ms(54), vs(9))],
        ),
      ],
    ),
  );

/* ------------------------------------------------------------------ *
 * ActiveBidding — the rest of the detail-driven screen
 * The timer, the status banner and the vehicle picker all wait on the same
 * detail call as the stops, and the bid buttons wait on the auto-bid state
 * (they swap for Turn Off / Edit Stop Loss once it says auto bid is on).
 * ------------------------------------------------------------------ */

/** The clock inside the Time Remaining box. */
export const activeBidTimerBones = [bone(ms(86), vs(16), {marginTop: vs(2)})];

/** The status banner under the route header, as one full-width bar. */
export const activeBidBannerBones = [bone('100%', vs(34), {borderRadius: ms(8)})];

/** The Eligible Vehicle select, inside its card. */
export const activeBidVehicleBones = [
  bone('100%', ms(44), {borderRadius: ms(6), marginTop: vs(8)}),
];

/** The Auto Bid / Place Bid button pair. */
export const activeBidActionBones = [
  group({flexDirection: 'row', marginTop: vs(12)}, [
    bone('38%', vs(40), {borderRadius: ms(8)}),
    bone('58%', vs(40), {borderRadius: ms(8), marginLeft: '4%'}),
  ]),
];
