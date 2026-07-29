import {colors} from '../../theme/colors';
import {select} from '../../theme/device';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';

const PHONE_FACTOR = select({phone: 0.82, tablet: 1});
export const ms = n => baseMs(n) * PHONE_FACTOR;
export const vs = n => baseVs(n) * PHONE_FACTOR;

// sort caret next to sortable header labels
export const SORT_ICON = select({phone: 9, tablet: 12});

export const MODES = ['All Modes', 'FTL', 'LTL'];

/* The four header cards double as the primary filter for the list/grid below.
   `key` maps to the `categories` array on each bid; `activeBg` is the fill used
   when that card is the selected filter. */
export const BUCKETS = {
  leading: 'leading',
  active: 'active',
  awarded: 'awarded',
  past: 'past',
};

/* Compact stat cards that double as the list filter. No `accent` here on
   purpose — these cards are plain white, so the only thing marking the current
   filter is `activeTint`, a fill light enough that the label/value stay dark
   and all four cards still read as one row. */
const ACTIVE_TINT = '#DDE8F8';

export const STATS = [
  {
    key: BUCKETS.leading,
    label: 'Currently Leading',
    value: '2',
    note: 'Across Active Bids',
    activeTint: ACTIVE_TINT,
  },
  {
    key: BUCKETS.active,
    label: 'Active Bids',
    value: '6',
    note: 'in Progress',
    activeTint: ACTIVE_TINT,
  },
  {
    key: BUCKETS.awarded,
    label: 'Awarded Bids',
    value: '1',
    note: '8% vs last week',
    noteColor: colors.success,
    up: true,
    activeTint: ACTIVE_TINT,
  },
  {
    key: BUCKETS.past,
    label: 'Past Auction',
    value: '637',
    note: 'Across All Modes',
    activeTint: ACTIVE_TINT,
  },
];

/* Scrollable table columns, in order. "Load" is not here — it is the frozen
   first column and lives outside the horizontal scroller. `kind` picks the
   cell renderer in DataRow. */
export const COLUMNS = [
  {key: 'mode', label: 'Mode', width: ms(72), kind: 'mode', shaded: true, sortable: true},
  {key: 'pickup', label: 'Pickup Time', width: ms(76), kind: 'pickup', sortable: true},
  {key: 'lowest', label: 'Lowest Bid', width: ms(74), kind: 'lowest', sortable: true},
  {key: 'chevron', label: '', width: ms(28), kind: 'chevron'},
  {key: 'auctionMode', label: 'Auction Mode', width: ms(84), kind: 'auctionMode', sortable: true},
  {key: 'auctionType', label: 'Auction Type', width: ms(82), kind: 'pillSoft', field: 'auctionType', sortable: true},
  {key: 'deadMile', label: 'Dead Mile', width: ms(70), kind: 'text', field: 'deadMile', sortable: true},
  {key: 'tripDistance', label: 'Trip Distance', width: ms(80), kind: 'text', field: 'tripDistance', sortable: true},
  {key: 'frequency', label: 'Frequency', width: ms(80), kind: 'pillOutline', field: 'frequency', sortable: true},
  {key: 'equipmentType', label: 'Equipment Type', width: ms(94), kind: 'text', field: 'equipmentType', sortable: true},
  {key: 'dockPriority', label: 'Dock Priority', width: ms(82), kind: 'text', field: 'dockPriority', sortable: true},
  {key: 'driverRequirement', label: 'Driver Requirement', width: ms(112), kind: 'pillBlue', field: 'driverRequirement', sortable: true},
];

/* Sort options behind the funnel button in the filter row. */
export const SORTS = [
  {key: 'pickup', label: 'Pickup Time'},
  {key: 'lowest', label: 'Lowest Bid'},
  {key: 'stops', label: 'Stops'},
];

const stops = (...cities) =>
  cities.map((city, i) => ({city, type: i === 0 ? 'pickup' : 'drop'}));

/* "1 Pickup 2 Drop" — derived so the copy can never drift from the stop list. */
export const stopSummary = list => {
  const pickups = list.filter(s => s.type === 'pickup').length;
  const drops = list.length - pickups;
  return `${pickups} Pickup ${drops} Drop`;
};

const bid = b => ({
  ref: 'FTL – 09010',
  date: 'Feb, 28',
  time: '6:00 PM',
  pickupTime: '6.00Pm',
  pickupDate: '28th July',
  dropTime: '10.00Pm',
  dropDate: '28th July',
  pickupClock: '6:00 AM',
  dropClock: '9:00 PM',
  indicative: '$4567',
  amount: '$1100',
  lowestBid: '$4567',
  awardedAt: null,
  auctionMode: 'Original',
  auctionType: 'Instant',
  deadMile: '8 miles',
  tripDistance: '184 miles',
  frequency: 'One-Time',
  equipmentType: '43’ Dry Van',
  dockPriority: 'Time - Based',
  driverRequirement: 'Single',
  ...b,
  origin: b.stops[0].city,
  dest: b.stops[b.stops.length - 1].city,
});

export const BIDS = [
  /* ---- Active, and currently leading (rank #1) ---- */
  bid({
    id: 'b1',
    categories: [BUCKETS.active, BUCKETS.leading],
    mode: 'LTL',
    stops: stops('San Jose CA', 'Newark NJ', 'Newark NJ'),
    rank: '#1 you',
    status: 'Open',
  }),
  bid({
    id: 'b2',
    categories: [BUCKETS.active, BUCKETS.leading],
    mode: 'FTL',
    stops: stops('San Jose CA', 'Newark NJ'),
    rank: '#1',
    status: 'Open',
    auctionMode: 'EXTENSION 1',
  }),

  /* ---- Active only ---- */
  bid({
    id: 'b3',
    categories: [BUCKETS.active],
    mode: 'FTL',
    stops: stops('San Jose CA', 'Newark NJ'),
    rank: '#4 you',
    status: 'Open',
  }),
  bid({
    id: 'b4',
    categories: [BUCKETS.active],
    mode: 'FTL',
    stops: stops('San Jose CA', 'Newark NJ'),
    rank: null,
    status: 'Open',
    auctionMode: 'EXTENSION 1',
  }),
  bid({
    id: 'b5',
    categories: [BUCKETS.active],
    mode: 'Multileg',
    stops: stops('San Jose CA', 'Newark NJ', 'Newark NJ', 'Newark NJ'),
    rank: '#2 you',
    status: 'Open',
  }),
  bid({
    id: 'b6',
    categories: [BUCKETS.active],
    mode: 'LTL',
    stops: stops('San Jose CA', 'Newark NJ', 'Newark NJ'),
    rank: '#6 you',
    status: 'Open',
  }),

  /* ---- Awarded ---- */
  bid({
    id: 'b7',
    categories: [BUCKETS.awarded],
    mode: 'LTL',
    stops: stops('San Jose CA', 'Newark NJ', 'Newark NJ'),
    rank: '#4 you',
    status: 'Awarded',
    awardedAt: '$900',
  }),

  /* ---- Past auction (closed) ---- */
  bid({
    id: 'p1',
    categories: [BUCKETS.past],
    mode: 'LTL',
    stops: stops('San Jose CA', 'Newark NJ', 'Newark NJ'),
    rank: null,
    status: 'Closed',
  }),
  bid({
    id: 'p2',
    categories: [BUCKETS.past],
    mode: 'FTL',
    stops: stops('San Jose CA', 'Newark NJ'),
    rank: null,
    status: 'Closed',
  }),
  bid({
    id: 'p3',
    categories: [BUCKETS.past],
    mode: 'FTL',
    stops: stops('San Jose CA', 'Newark NJ'),
    rank: null,
    status: 'Closed',
  }),
  bid({
    id: 'p4',
    categories: [BUCKETS.past],
    mode: 'FTL',
    stops: stops('San Jose CA', 'Newark NJ'),
    rank: null,
    status: 'Closed',
  }),
  bid({
    id: 'p5',
    categories: [BUCKETS.past],
    mode: 'LTL',
    stops: stops('San Jose CA', 'Newark NJ', 'Newark NJ'),
    rank: null,
    status: 'Closed',
  }),
  bid({
    id: 'p6',
    categories: [BUCKETS.past],
    mode: 'Multileg',
    stops: stops('San Jose CA', 'Newark NJ', 'Newark NJ', 'Newark NJ'),
    rank: null,
    status: 'Closed',
  }),
  bid({
    id: 'p7',
    categories: [BUCKETS.past],
    mode: 'Multileg',
    stops: stops('San Jose CA', 'Newark NJ', 'Newark NJ'),
    rank: null,
    status: 'Closed',
  }),
];
