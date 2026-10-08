/**
 * Types for the driver bidding endpoints.
 */

/**
 * The optional body of `POST /drivers/bids/{auctionId}/bid`. Every field can be
 * left out; only `auctionId` (in the path) is required.
 */
export interface PlaceBidBody {
  /** The bid in cents — $8,450 is 845000. */
  amountCents?: number;
  /** The truck the driver is bidding with. */
  assetId?: number;
  idempotencyKey?: string;
  correlationId?: string;
}

export interface PlaceBidParams extends PlaceBidBody {
  auctionId: string;
}

/* ---------------------------------------------------------------------------
 * Bid search — `POST /drivers/bids/search`, the Bidding screen's list + header.
 * ------------------------------------------------------------------------- */

/**
 * Which slice the screen is asking for. `ALL` is the default (no header card
 * selected); the four buckets map to the four header cards.
 */
export type BidSearchStatus = 'ALL' | 'LEADING' | 'ACTIVE' | 'AWARDED' | 'PAST';

/**
 * The search body. `status` is always sent; every other field is a filter the
 * screen only includes once the driver has set it, so the gateway sees a bare
 * `{status}` until a mode/search/filter narrows the list.
 */
export interface BidSearchParams {
  search?: string;
  shipmentType?: string;
  auctionMode?: string;
  pickupTime?: string;
  equipmentType?: string;
  driverRequirement?: string;
  lat?: number;
  lon?: number;
  bidPriceMin?: number;
  bidPriceMax?: number;
  distanceMin?: number;
  distanceMax?: number;
  deadMileMin?: number;
  deadMileMax?: number;
  status: BidSearchStatus;
}

/** The counts behind the four header cards. */
export interface BidSearchSummary {
  currentlyLeading: number;
  activeBids: number;
  awardedBids: number;
  pastAuction: number;
  awardedBidsChangePercentage: number;
  awardedBidsTrend: string;
  awardedBidsComparisonPeriod: string;
}

/** One stop of an auction's route. */
export interface BidSearchStop {
  sequence?: number;
  type?: string;
  status?: string;
  address?: string;
  date?: string;
  from?: string;
  to?: string;
}

/** One auction row in the search answer's `content`. */
export interface BidSearchItem {
  auctionId: string;
  shipmentRef?: string;
  stops?: BidSearchStop[];
  originCity?: string;
  destinationCity?: string;
  stopsSummary?: string;
  distanceMiles?: number | null;
  date?: string;
  pickupTime?: string;
  dropTime?: string;
  shipmentType?: string;
  deadMiles?: number | null;
  lowestBidAmount?: number | null;
  bidCount?: number;
  biddingClosesAt?: string;
  auctionMode?: string;
  driverRequirement?: string;
  status?: string;
  leading?: boolean;
  equipmentType?: string;
}

/** The whole search answer, envelope unwrapped. */
export interface BidSearchResult {
  summary: BidSearchSummary | null;
  content: BidSearchItem[];
}

/* ---------------------------------------------------------------------------
 * Filter options — `GET /drivers/bids/filter-options?type=…`, the choices the
 * Bidding screen's Filter Details popover offers. `type` is mandatory and is
 * one of the three enums below; the answer is a flat list of that type's values.
 * ------------------------------------------------------------------------- */

/** Which set of filter choices to load. */
export type BidFilterType = 'SHIPMENT_TYPE' | 'AUCTION_MODE' | 'EQUIPMENT_TYPE';

/** One choice the endpoint returns — `value` is the raw enum the search sends. */
export interface BidFilterOptionItem {
  id: string;
  type: BidFilterType | string;
  value: string;
}

/* ---------------------------------------------------------------------------
 * Bid detail — `GET /drivers/bids/{auctionId}/detail`, the ActiveBidding screen.
 * ------------------------------------------------------------------------- */

export interface BidDetailParams {
  auctionId: string;
}

/** One rung of the suggested-bid ladder the auction offers. */
export interface BidDetailNextBid {
  rung?: number;
  amount_cents?: number;
  is_below_floor?: boolean;
}

/** The live auction state for one bid. */
export interface BidDetailAuction {
  status?: string;
  auctionEndsAt?: string;
  currentLowestBid?: number;
  biddingAllowed?: boolean;
  nextBids?: BidDetailNextBid[];
  current_lowest_bid_cents?: number;
  max_bid_cap_cents?: number;
  indicative_price_cents?: number;
  winner_amount_cents?: number;
  /** Cents — the "Bid NOW" coin step amounts allowed for this auction. */
  allowedGradients?: number[];
}

/** One stop of the auction's route. */
export interface BidDetailRouteStop {
  sequence?: number;
  type?: string;
  address?: string;
  fromTime?: string;
  toTime?: string;
  dock?: string;
}

/** The load's equipment and freight figures. */
export interface BidDetailLoadSpecs {
  equipment?: string;
  truckClass?: string;
  commodity?: string;
  weightLbs?: number;
  totalPallets?: number;
  palletCapacity?: number;
  distanceMiles?: number;
}

/** The whole detail payload, envelope unwrapped. */
export interface BidDetail {
  auctionId: string;
  shipmentId?: string;
  shipmentType?: string;
  originCity?: string;
  destinationCity?: string;
  pickupDate?: string;
  pickupTime?: string;
  commodity?: string;
  auction?: BidDetailAuction;
  route?: BidDetailRouteStop[];
  loadSpecs?: BidDetailLoadSpecs;
}

/* ---------------------------------------------------------------------------
 * Auto bid — `POST /drivers/bids/{auctionId}/auto-bid`.
 * ------------------------------------------------------------------------- */

/** GRADIENT steps the bid down; NO_GRADIENT holds one amount. */
export type AutoBidMode = 'GRADIENT' | 'NO_GRADIENT';

/** The auto-bid body. `auctionId` is in the path; the rest is sent as JSON. */
export interface AutoBidParams {
  auctionId: string;
  /** The truck to auto-bid with, from the eligible-vehicle picker. */
  assetId?: number;
  mode: AutoBidMode;
  /** The floor the auto-bidder never bids below, in cents. */
  stopLossCents: number;
}

/** What the auto-bid call answers with — shape kept loose until pinned down. */
export interface AutoBidResult {
  [key: string]: unknown;
}

/** What the place-bid call answers with. */
export interface PlaceBidResult {
  auctionId: string;
  /** Dollars. */
  yourBid: number;
  /** Dollars. */
  currentLowestBid: number;
  /** True when this bid is now the lowest. */
  leading: boolean;
  status: string;
  /** ISO timestamp. */
  auctionEndsAt: string;
  /** ISO timestamp. */
  placedAt: string;
}
