import {select} from '../../theme/device';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';

// Same phone down-scale as ShipmentScreen / ActiveBidding so a load looks the
// same size whether you reach it from the table or the auction.
const PHONE_FACTOR = select({phone: 0.82, tablet: 1});
export const ms = (n: number): number => baseMs(n) * PHONE_FACTOR;
export const vs = (n: number): number => baseVs(n) * PHONE_FACTOR;

// The load the screen is showing. In a real build this arrives as route params
// from the shipment row the user tapped / the backend.
export const SHIPMENT = {
  mode: 'FTL',
  date: 'Feb, 28',
  time: '6:00 PM',
  // Drives the badge on the right of the chips row.
  status: 'IN-TRANSIT',

  origin: 'San Jose, CA',
  dest: 'Newark, NJ',

  // Fed straight to the shared RouteStops component — it derives the
  // "2 PICKUP · 1 DROP" summary and numbers the pickups from this order.
  // `sub` is the appointment window; the current position stays static text
  // here rather than reverse-geocoding, so the screen needs no GPS to render.
  stops: [
    {kind: 'current', sub: 'You are here'},
    {kind: 'pickup', sub: '8.00-8.30 AM', lat: 37.3382, lng: -121.8863},
    {kind: 'pickup', sub: '9.00-9.30 AM', lat: 37.5483, lng: -121.9886},
    {kind: 'drop', sub: '2.30PM', lat: 40.7357, lng: -74.1724},
  ],

  contacts: [
    {
      id: 'pickup',
      kicker: 'Pickup Contact',
      name: 'Diego Ramos',
      role: 'Warehouse supervisor',
      phone: '(408) 555-0132',
      access: 'Dock 4, gate code 8821.',
      remarks: 'Check in at security before backing in.',
    },
    {
      id: 'drop',
      kicker: 'Drop Contact',
      name: 'Priya Nair',
      role: 'Receiving Manager',
      phone: '(320) 0932-032',
      access: 'Dock 4, gate code 8821.',
      remarks: 'Appointment required. Call 30 min before arrival, dock 12.',
    },
  ],

  // Both grids below render two cells per row, in this order.
  terms: [
    {label: 'TRAILER', value: 'Required - Carrier Supplied'},
    {label: 'HAND-OFF TPPE', value: 'Live Load'},
    {label: 'LOADING RESPONSIBILITY', value: 'Shipper Loads (SLC)'},
    // `tone` turns the value green — the driver keeps their hands off the freight.
    {label: 'DRIVER TOUCH FREIGHT', value: 'NOT REQUIRED', tone: 'success'},
  ],

  bol: [
    {label: 'SHIPPER', value: 'Meridian Import Co.', sub: 'San Jose, CA 95112'},
    {
      label: 'CONSIGNEE',
      value: 'Atlas Distribution LLC',
      sub: 'Newark, NJ 07105',
    },
    {
      label: 'CARRIER/ MC- DOT',
      value: 'Video Wave Logistics',
      sub: 'MC - 742110/ Dot - 2891765',
    },
    {label: 'BOL DATE/ NO.', value: 'July 8th, 2026', sub: 'BOL - 1000954'},
    {label: 'TRAILER NUMBER', value: 'TRL - 4471/ SL- 88213'},
    {label: 'DIMENSIONS', value: '48 x 40 x 36'},
  ],
};
