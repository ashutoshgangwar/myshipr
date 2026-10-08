import {colors} from '../../../theme/colors';
import {select} from '../../../theme/device';
import {ms as baseMs, vs as baseVs} from '../../../theme/scale';
import type {BidFilterType, BidSearchStatus} from '../../../types/bidding';
import type {AuctionDetail} from '../../../types/navigation';

const PHONE_FACTOR = select({phone: 0.82, tablet: 1});
export const ms = (n: number): number => baseMs(n) * PHONE_FACTOR;
export const vs = (n: number): number => baseVs(n) * PHONE_FACTOR;

// sort caret next to sortable header labels
export const SORT_ICON = select({phone: 9, tablet: 12});

export const MODES = [
  'All Modes',
  'FTL',
  'LTL',
  'Multileg',
  'FTL-Reefer',
  'Hybrid',
];

/** The left tab pair in the filter row. `all` shows every auction; `mine` shows
 *  the auctions the driver has an active bid on (status ACTIVE). */
export const BID_TABS = [
  {key: 'all', label: 'All'},
  {key: 'mine', label: 'My Bids'},
] as const;

export type BidTabKey = (typeof BID_TABS)[number]['key'];
export const BUCKETS = {
  leading: 'leading',
  active: 'active',
  awarded: 'awarded',
  past: 'past',
};

const ACTIVE_TINT = colors.paleBlue;

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

export const COLUMNS = [
  {key: 'mode', label: 'Mode', width: ms(96), kind: 'mode', shaded: true, sortable: true},
  {key: 'pickup', label: 'Pickup Time', width: ms(76), kind: 'pickup', sortable: true},
  {key: 'auctionType', label: 'Auction Type', width: ms(82), kind: 'auctionType', sortable: true},
  {key: 'distance', label: 'Trip Distance / Dead Mile', width: ms(142), kind: 'distance', sortable: true},
  {key: 'lowest', label: 'Lowest Bid', width: ms(74), kind: 'lowest', sortable: true},
  {key: 'driverRequirement', label: 'Driver Requirement', width: ms(112), kind: 'driverRequirement', sortable: true},
];

/**
 * A stop in the mock bidding rows: first is the pickup, the rest are drops.
 * A `type` alias rather than an `interface` so it satisfies `LoadRouteStop`'s
 * index signature — interfaces get no implicit one.
 */
export type MockStop = {
  city: string;
  type: 'pickup' | 'drop';
};

const stops = (...cities: string[]): MockStop[] =>
  cities.map((city, i) => ({city, type: i === 0 ? 'pickup' : 'drop'}));

/* "1 Pickup 2 Drop" — derived so the copy can never drift from the stop list. */
export const stopSummary = (list: MockStop[]): string => {
  const pickups = list.filter(s => s.type === 'pickup').length;
  const drops = list.length - pickups;
  return `${pickups} Pickup ${drops} Drop`;
};

// Generic in the row so each entry keeps its OWN extra fields (`mode`,
// `categories`, …) rather than being flattened to the defaults' shape.
const bid = <T extends {stops: MockStop[]}>(b: T) => ({
  // The shipment the auction is for — its id is the auction id Place Bid is
  // sent with. Empty on the mock; set a real one to test bidding.
  shipmentId: '',
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
  auctionType: 'Normal',
  deadMile: '8',
  tripDistance: '184miles',
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
    auctionType: 'Instant',
    driverRequirement: 'Multi Driver',
  }),
  bid({
    id: 'b5',
    categories: [BUCKETS.active],
    mode: 'Multileg',
    stops: stops('San Jose CA', 'Newark NJ', 'Newark NJ', 'Newark NJ'),
    rank: '#2 you',
    status: 'Open',
    auctionType: 'Instant',
    driverRequirement: 'Multi Driver',
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
    auctionType: 'Instant',
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
    auctionType: 'Instant',
    driverRequirement: 'Multi Driver',
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
    auctionType: 'Instant',
    driverRequirement: 'Multi Driver',
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

/**
 * One row the bidding table and grid card render. The mock `BIDS` above and the
 * live `/drivers/bids/search` rows (mapped in `useBidSearch`) both satisfy it,
 * so the table does not care which one it is handed. Every field is the shape
 * the cells read — strings the UI prints directly, `stops` the route draws.
 */
export interface BidRow {
  id: string;
  /** The auction the bid is placed against — ActiveBidding reads this. */
  shipmentId: string;
  ref: string;
  date: string;
  time: string;
  pickupTime: string;
  pickupDate: string;
  dropTime: string;
  dropDate: string;
  pickupClock: string;
  dropClock: string;
  indicative: string;
  amount: string;
  lowestBid: string;
  awardedAt: string | null;
  auctionMode: string;
  auctionType: string;
  /** Full shipment type for the card's mode line, e.g. "FTL · STANDARD". */
  shipmentType: string;
  /** What is being hauled. Not in the bids-search payload yet, so "—". */
  commodity: string;
  deadMile: string;
  tripDistance: string;
  frequency: string;
  equipmentType: string;
  dockPriority: string;
  driverRequirement: string;
  categories: string[];
  mode: string;
  stops: MockStop[];
  rank: string | null;
  status: string;
  origin: string;
  dest: string;
  /** Present on live rows; the same id as `shipmentId`. */
  auctionId?: string;
  /** The full auction the detail screen renders — built on live rows. */
  auction?: AuctionDetail;
}
export type BidColumn = (typeof COLUMNS)[number];

/* ---------------------------------------------------------------------------
 * Filter Details — the popover behind the funnel button in the filter row.
 * ------------------------------------------------------------------------- */

/**
 * A choice in one filter field. `value` is the raw enum the backend expects in
 * the search body (e.g. "FTL_STANDARD"); `label` is the humanized text shown.
 */
export type FilterOption = {
  label: string;
  value: string;
};

export type FilterKey = 'shipmentType' | 'auctionMode' | 'equipmentType';

export type FilterField = {
  key: FilterKey;
  /** The `GET /drivers/bids/filter-options` query this field's options load from. */
  type: BidFilterType;
  label: string;
  /** Shown muted until a value is picked. */
  placeholder: string;
  options: FilterOption[];
};

/** The selected option `value` per field; a missing key means "not filtered". */
export type Filters = Partial<Record<FilterKey, string>>;

/**
 * The three fields the Filter Details popover shows. Their `options` arrive at
 * runtime from `GET /drivers/bids/filter-options` (see `useBidFilterOptions`),
 * so they start empty here — this is only each field's key, label and the enum
 * its choices are loaded under.
 */
export const FILTER_FIELDS: FilterField[] = [
  {
    key: 'shipmentType',
    type: 'SHIPMENT_TYPE',
    label: 'Shipment Type',
    placeholder: 'All Types',
    options: [],
  },
  {
    key: 'auctionMode',
    type: 'AUCTION_MODE',
    label: 'Auction Mode',
    placeholder: 'All Modes',
    options: [],
  },
  {
    key: 'equipmentType',
    type: 'EQUIPMENT_TYPE',
    label: 'Equipment Type',
    placeholder: 'All Equipment',
    options: [],
  },
];

/** How many fields are narrowing the list — drives the funnel's active tint. */
export const activeFilterCount = (filters: Filters): number =>
  FILTER_FIELDS.filter(f => filters[f.key]).length;

/**
 * The header card the driver has selected → the `status` the search is asked
 * for. Nothing selected (the default) is `ALL`, which shows every bucket.
 */
export const bucketToStatus = (bucket?: string | null): BidSearchStatus => {
  switch (bucket) {
    case BUCKETS.leading:
      return 'LEADING';
    case BUCKETS.active:
      return 'ACTIVE';
    case BUCKETS.awarded:
      return 'AWARDED';
    case BUCKETS.past:
      return 'PAST';
    default:
      return 'ALL';
  }
};
