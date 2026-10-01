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

// The auction the screen is showing. In a real build this comes from the
// bidding row the user tapped (route params) / the backend.
export const AUCTION = {
  // The id POST /drivers/bids/{auctionId}/bid is sent with — the shipment's id.
  // Empty on the mock: the real one comes from the row the user tapped.
  auctionId: '',
  mode: 'FTL',
  date: 'Feb, 28',
  time: '6:00 PM',
  origin: 'San Jose, CA',
  dest: 'Newark, NJ',
  auctionRef: 'FTL 10009',
  commodity: 'Imported Retail Goods (Transloaded)',

  timeRemaining: '03:04:47',

  // Starting value of the "Place your bid" field, and the live lowest it is
  // compared against.
  yourBid: 8450,
  currentLowest: 8474,
  // True when someone has beaten your last bid — shows the OUTBID banner.
  outbid: true,

  // Trucks that qualify for this load; the first one is preselected.
  vehicles: [
    {id: '#1094', model: 'Kenworth T680'},
    {id: '#1102', model: 'Freightliner Cascadia'},
    {id: '#1117', model: 'Volvo VNL 860'},
  ],

  stops: [
    {
      type: 'P',
      city: 'San Jose, CA',
      detail: 'Construction materials • 10 plt • 8,000 lbs • Live load',
      date: '',
      window: '',
    },
    {
      type: 'D',
      city: 'Newark, NJ',
      detail: 'Live Unload | Dock 7 | 4-day Transit | 2,905 mi',
      date: '2026-03-15',
      window: '12:00-1:00',
    },
  ],

  details: [
    {label: 'Shipment ID', value: 'SHP-LTL-10001'},
    {label: 'Type', value: 'LTL – Multiple Goods'},
    {label: 'Mode', value: 'Multi-stop, auto AWB'},
    {label: 'Auction Type', value: 'Normal Bidding'},
    {label: 'Frequency', value: 'One Day'},
    {label: 'Total Pallets', value: '30'},
    {label: 'Total Weight', value: '15,000 lbs'},
    {label: 'Equipment Type', value: '[Equipment]'},
  ],
};
