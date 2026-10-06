import {select} from '../../../theme/device';
import {ms as baseMs, vs as baseVs} from '../../../theme/scale';

// Match BiddingScreen's phone down-scale so the two screens read the same size.
const PHONE_FACTOR = select({phone: 0.82, tablet: 1});
export const ms = (n: number): number => baseMs(n) * PHONE_FACTOR;
export const vs = (n: number): number => baseVs(n) * PHONE_FACTOR;

// Coin buttons on the "Bid NOW" panel — each lowers your bid by `value`.
export const BID_STEPS = [
  {id: 's25', value: 25},
  {id: 's50', value: 50},
  {id: 's100', value: 100},
  {id: 's150', value: 150},
];

/**
 * The trucks shown in the "Eligible Vehicle" dropdown. Static placeholder until
 * a vehicle API exists: `assetId` is the number sent as the bid's `assetId` to
 * `POST /drivers/bids/{auctionId}/bid`. Swap this list for the API's trucks when
 * one is available — the screen already prefers `data.vehicles` when it has any.
 */
export const ELIGIBLE_VEHICLES = [
  {id: '1001', model: '', assetId: 1001},
  {id: '1002', model: '', assetId: 1002},
  {id: '1003', model: '', assetId: 1003},
  {id: '1004', model: '', assetId: 1004},
  {id: '1005', model: '', assetId: 1005},
];
