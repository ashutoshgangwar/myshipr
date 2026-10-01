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
