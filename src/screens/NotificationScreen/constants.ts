import {select} from '../../theme/device';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';

// Same phone down-scale as EarningsDetails / ShipmentDetails so a row reads at
// one size across the detail screens.
const PHONE_FACTOR = select({phone: 0.82, tablet: 1});
export const ms = (n: number): number => baseMs(n) * PHONE_FACTOR;
export const vs = (n: number): number => baseVs(n) * PHONE_FACTOR;

// Drives the badge icon and its tint for each row.
export const NOTIF_TYPE = {
  BID: 'bid',
  LOAD: 'load',
  PAYMENT: 'payment',
  HOS: 'hos',
  SYSTEM: 'system',
};

export const FILTERS = {
  ALL: 'all',
  UNREAD: 'unread',
};

// The feed the screen shows. In a real build these arrive from the backend /
// FirebaseMessagingService instead of this list.
export const NOTIFICATIONS = [
  {
    id: 'n1',
    type: NOTIF_TYPE.BID,
    title: 'Bid accepted',
    message: 'Your $1,850 bid on AWB 4471-9920 (Dallas → Phoenix) was accepted.',
    time: '12 min ago',
    unread: true,
    section: 'Today',
  },
  {
    id: 'n2',
    type: NOTIF_TYPE.LOAD,
    title: 'New load near you',
    message: 'FTL dry van, Fort Worth → Little Rock, 348 mi, picks up tomorrow 08:00.',
    time: '1 hr ago',
    unread: true,
    section: 'Today',
  },
  {
    id: 'n3',
    type: NOTIF_TYPE.HOS,
    title: 'Drive time running low',
    message: '1 hr 20 min of drive time left on your 11-hour clock.',
    time: '3 hrs ago',
    unread: true,
    section: 'Today',
  },
  {
    id: 'n4',
    type: NOTIF_TYPE.PAYMENT,
    title: 'Payout on the way',
    message: '$900.00 for AWB 4471-8802 was released to Chase ···· 4416.',
    time: 'Yesterday, 6:12 PM',
    unread: false,
    section: 'Earlier',
  },
  {
    id: 'n5',
    type: NOTIF_TYPE.LOAD,
    title: 'Delivery confirmed',
    message: 'POD uploaded for AWB 4471-8802. Trip closed out.',
    time: 'Yesterday, 2:40 PM',
    unread: false,
    section: 'Earlier',
  },
  {
    id: 'n6',
    type: NOTIF_TYPE.SYSTEM,
    title: 'Document expiring',
    message: 'Your medical certificate expires in 21 days. Upload a new copy.',
    time: 'Aug 1',
    unread: false,
    section: 'Earlier',
  },
];
