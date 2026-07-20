import {select} from '../../theme/device';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';

// Match BiddingScreen's phone down-scale so the two screens read the same size.
const PHONE_FACTOR = select({phone: 0.82, tablet: 1});
export const ms = n => baseMs(n) * PHONE_FACTOR;
export const vs = n => baseVs(n) * PHONE_FACTOR;

// Coin buttons on the "Bid NOW" panel — each lowers your bid by `value`.
export const BID_STEPS = [
  {id: 's25', value: 25},
  {id: 's50', value: 50},
  {id: 's100', value: 100},
  {id: 's150', value: 150},
];

// The auction the screen is showing. In a real build this comes from the
// bidding row the user tapped (route params) / the backend.
export const AUCTION = {
  mode: 'LTL',
  date: 'Feb, 28',
  time: '6:00 PM',
  origin: 'San Jose, CA',
  dest: 'Newark, NJ',
  auctionRef: 'FTL 10009',
  source: 'FTL Loadboard',
  commodity: 'Imported Retail Goods (Transloaded)',

  timeRemaining: '03:04:47',

  // Your live standing in the auction.
  rank: 1,
  yourBid: 953,
  lowest: 723,

  indicativePrice: 850,
  currentLowest: 725,
  bidders: 7,
  indicative: 928,
  hardCeiling: 1391,

  // Auto-bid floor.
  stopLossMin: 1375,

  carrier: {
    name: 'Thomas Mitchell',
    company: 'Apex Freight LLC',
    usdot: 'USDOT-2891034',
    mc: 'MC- 789102',
    initials: 'TM',
  },

  truck: {
    id: '#1094',
    model: 'Kenworth T680',
    trailer: "Paired trailer: 53' dry van · #T-9034 · Driver: R. Chen",
  },

  route: {
    summary: '2 PICKUP · 1 DROP',
    // Coordinates drive the HERE map thumbnail (pickup → drop route line).
    pickup: {
      label: 'Pickup Location 1',
      window: '8.00-8.30 AM',
      lat: 37.3382,
      lng: -121.8863,
    },
    drop: {
      label: 'Drop Location',
      window: '2.30PM',
      lat: 37.7749,
      lng: -122.4194,
    },
  },

  specs: [
    {label: 'EQUIPMENT', value: "53' Dry Van"},
    {label: 'TRUCK CLASS', value: 'Class 8'},
    {label: 'HAUL TYPE', value: 'Regional'},
    {label: 'OPERATION', value: 'Live load'},
    {label: 'WEIGHT', value: '36,000 lbs'},
    {label: 'PALLETS', value: '22 / 26 cap'},
    {label: 'DISTANCE', value: '285 mi'},
    {label: 'COMMODITY', value: 'Automotive Components'},
  ],
};
