import {colors} from '../../theme/colors';
import {select} from '../../theme/device';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';

const PHONE_FACTOR = select({phone: 0.82, tablet: 1});
export const ms = (n: number): number => baseMs(n) * PHONE_FACTOR;
export const vs = (n: number): number => baseVs(n) * PHONE_FACTOR;

// sort caret next to sortable header labels
export const SORT_ICON = select({phone: 9, tablet: 12});

export const MODES = ['All Modes', 'FTL', 'LTL'];
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
  {key: 'mode', label: 'Mode', width: ms(72), kind: 'mode', shaded: true, sortable: true},
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
type MockStop = {
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
 * The row and column shapes the bidding table renders, derived from the mock
 * data itself so the two can never drift apart.
 */
export type BidRow = (typeof BIDS)[number];
export type BidColumn = (typeof COLUMNS)[number];

/* ---------------------------------------------------------------------------
 * Filter Details — the popover behind the funnel button in the filter row.
 * ------------------------------------------------------------------------- */

/** A choice in one filter field. Ranges carry `min`/`max`; plain values neither. */
export type FilterOption = {
  label: string;
  /** Inclusive lower bound. */
  min?: number;
  /** Exclusive upper bound. */
  max?: number;
};

export type FilterKey =
  | 'auctionMode'
  | 'pickupTime'
  | 'bidPrice'
  | 'tripDistance'
  | 'shipmentType'
  | 'equipmentType'
  | 'deadMile';

export type FilterField = {
  key: FilterKey;
  label: string;
  /** Shown muted until a value is picked. */
  placeholder: string;
  options: FilterOption[];
};

/** The selected option label per field; a missing key means "not filtered". */
export type Filters = Partial<Record<FilterKey, string>>;

export const FILTER_FIELDS: FilterField[] = [
  {
    key: 'auctionMode',
    label: 'Auction Mode',
    placeholder: 'Instant',
    options: [{label: 'Instant'}, {label: 'Normal'}],
  },
  {
    key: 'pickupTime',
    label: 'Pickup Time',
    placeholder: 'Morning',
    options: [
      {label: 'Morning'},
      {label: 'Afternoon'},
      {label: 'Evening'},
      {label: 'Night'},
    ],
  },
  {
    key: 'bidPrice',
    label: 'Bid Price',
    placeholder: 'Amount Range',
    options: [
      {label: 'Under $1,000', max: 1000},
      {label: '$1,000 – $2,500', min: 1000, max: 2500},
      {label: '$2,500 – $5,000', min: 2500, max: 5000},
      {label: 'Over $5,000', min: 5000},
    ],
  },
  {
    key: 'tripDistance',
    label: 'Trip Distance',
    placeholder: 'Miles Range',
    options: [
      {label: 'Under 100 mi', max: 100},
      {label: '100 – 250 mi', min: 100, max: 250},
      {label: '250 – 500 mi', min: 250, max: 500},
      {label: 'Over 500 mi', min: 500},
    ],
  },
  {
    key: 'shipmentType',
    label: 'Shipment Type',
    placeholder: 'LTL',
    options: [{label: 'FTL'}, {label: 'LTL'}, {label: 'Multileg'}],
  },
  {
    key: 'equipmentType',
    label: 'Equipment Type',
    placeholder: '53’ Dry Van',
    options: [
      {label: '53’ Dry Van'},
      {label: '43’ Dry Van'},
      {label: 'Reefer'},
      {label: 'Flatbed'},
    ],
  },
  {
    key: 'deadMile',
    label: 'Dead Mile',
    placeholder: 'Dead Mile range',
    options: [
      {label: 'Under 5 mi', max: 5},
      {label: '5 – 15 mi', min: 5, max: 15},
      {label: '15 – 30 mi', min: 15, max: 30},
      {label: 'Over 30 mi', min: 30},
    ],
  },
];

/** "$4567", "184miles" and "8" all reduce to the number they carry. */
const amount = (value: string | number): number =>
  Number(String(value).replace(/[^0-9.]/g, '')) || 0;

/** "6.00Pm" -> "Evening". Empty when the clock string is not recognised. */
const pickupBand = (pickup: string): string => {
  const parts = /^(\d{1,2})[.:](\d{2})\s*([ap])m$/i.exec(pickup.trim());
  if (!parts) {
    return '';
  }
  const hour = (Number(parts[1]) % 12) + (parts[3].toLowerCase() === 'p' ? 12 : 0);
  if (hour >= 5 && hour < 12) {
    return 'Morning';
  }
  if (hour < 17) {
    return 'Afternoon';
  }
  if (hour < 21) {
    return 'Evening';
  }
  return 'Night';
};

const optionFor = (key: FilterKey, filters: Filters): FilterOption | undefined => {
  const picked = filters[key];
  if (!picked) {
    return undefined;
  }
  return FILTER_FIELDS.find(f => f.key === key)?.options.find(
    o => o.label === picked,
  );
};

/** No option picked passes everything; otherwise min is inclusive, max exclusive. */
const inRange = (value: number, option?: FilterOption): boolean =>
  !option ||
  ((option.min === undefined || value >= option.min) &&
    (option.max === undefined || value < option.max));

/** True when the row survives every field the driver has set. */
export const matchesFilters = (b: BidRow, filters: Filters): boolean => {
  if (filters.auctionMode && b.auctionType !== filters.auctionMode) {
    return false;
  }
  if (filters.pickupTime && pickupBand(b.pickupTime) !== filters.pickupTime) {
    return false;
  }
  if (filters.shipmentType && b.mode !== filters.shipmentType) {
    return false;
  }
  if (filters.equipmentType && b.equipmentType !== filters.equipmentType) {
    return false;
  }
  return (
    inRange(amount(b.lowestBid), optionFor('bidPrice', filters)) &&
    inRange(amount(b.tripDistance), optionFor('tripDistance', filters)) &&
    inRange(amount(b.deadMile), optionFor('deadMile', filters))
  );
};

/** How many fields are narrowing the list — drives the funnel's active tint. */
export const activeFilterCount = (filters: Filters): number =>
  FILTER_FIELDS.filter(f => filters[f.key]).length;
