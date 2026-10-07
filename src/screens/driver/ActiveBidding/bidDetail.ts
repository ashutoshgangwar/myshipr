/**
 * The ActiveBidding screen's data: `GET /drivers/bids/{auctionId}/detail` turned
 * into the auction shape the screen renders. The auction id comes from the
 * bidding row the driver tapped and is the same id the bid is placed against.
 *
 * The detail payload does not carry everything the screen shows — there is no
 * per-driver "leading" flag, no vehicle list, and no frequency/mode copy — so
 * those read `NOT_IN_API`, or fall back to the row the driver tapped where it
 * already knows the answer (the leading banner, the ref). No field is ever a
 * hard-coded sample.
 */

import {useEffect, useMemo, useState} from 'react';

import {getBidDetail} from '../../../config/driverApi';
import {TTL, useCachedResource} from '../../../services/resourceCache';
import {cityLabel, loadType} from '../../../services/upcomingShipments';
import {group, isNumber, MONTHS_SHORT, stopTime} from '../../../utils/format';
import type {
  BidDetail,
  BidDetailLoadSpecs,
  BidDetailRouteStop,
} from '../../../types/bidding';
import type {AuctionDetail} from '../../../types/navigation';
import type {AsyncResource, Nullable} from '../../../types/common';

/** What a field reads when the detail payload does not carry it. */
export const NOT_IN_API = '----';

const ERROR = 'Could not load this auction.';

/**
 * The auction with nothing in it — every field reads "----" and the lists
 * are empty. Used before the detail call lands when the screen was opened with
 * no row (e.g. a deep link), so nothing on it is ever mock data.
 */
const EMPTY_AUCTION: AuctionDetail = {
  auctionId: '',
  mode: NOT_IN_API,
  date: NOT_IN_API,
  time: NOT_IN_API,
  origin: NOT_IN_API,
  dest: NOT_IN_API,
  auctionRef: NOT_IN_API,
  commodity: NOT_IN_API,
  timeRemaining: NOT_IN_API,
  yourBid: 0,
  currentLowest: 0,
  outbid: false,
  vehicles: [],
  stops: [],
  details: [],
};

const isDrop = (type: string | null | undefined): boolean =>
  /DROP|DELIVER/i.test(String(type || ''));

const bySequence = (a: BidDetailRouteStop, b: BidDetailRouteStop): number =>
  (a?.sequence ?? 0) - (b?.sequence ?? 0);

/** A value the payload carried, or the "----" placeholder. */
const orNA = (value: string): string => value || NOT_IN_API;

/**
 * "City, ST" out of whatever the payload sent, keeping BOTH the city and the
 * state. `cityLabel` drops the city when the value is already "Dallas, TX" (no
 * zip to anchor on) and returns just "TX", so this handles that shape directly
 * and falls back to `cityLabel` for full street addresses. Exported so the
 * Bidding screen's list (`useBidSearch`) formats pickup/drop the same way.
 */
export const cityState = (raw: string | null | undefined): string => {
  const text = String(raw ?? '').trim();
  if (!text) return '';
  const parts = text
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
  if (parts.length === 1) return parts[0];

  const last = parts[parts.length - 1];
  const prev = parts[parts.length - 2];

  // "TX", "TX 75201" (US zip), "QC G4R" / "QC G4R 1A1" (Canadian postal, full
  // or the FSA half a geocoder often truncates to), or "CDMX 04800" (a longer
  // state/region code, e.g. Mexico City) — a state/province code, optionally
  // with its postal code, which this always drops.
  const state =
    /^([A-Za-z]{2,5})(\s+(\d{3,6}(-\d{4})?|[A-Za-z]\d[A-Za-z](\s?\d[A-Za-z]\d)?))?$/.exec(
      last,
    );
  if (state && !/\d/.test(prev)) return `${prev}, ${state[1].toUpperCase()}`;

  // A bare zip tail — the city is the part before it.
  if (/^\d{3,6}(-\d{4})?$/.test(last)) return prev;

  // "City, State" with the state spelled out, or any other clean two-part tail.
  if (!/\d/.test(prev)) return `${prev}, ${last}`;

  // A street line we cannot split cleanly — let the general extractor try.
  return cityLabel({address: text});
};

/** "2026-10-06" → "Oct, 06"; anything else is passed through. */
const chipDate = (raw: unknown): string => {
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(raw ?? '').trim());
  if (!iso) return String(raw ?? '');
  const month = MONTHS_SHORT[Number(iso[2]) - 1];
  return month ? `${month}, ${iso[3]}` : String(raw ?? '');
};

/** "DRY_VAN" → "Dry Van"; empty stays empty. */
const humanize = (raw: unknown): string => {
  const text = String(raw ?? '').trim();
  if (!text) return '';
  return text
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** `auctionEndsAt` → "03:04:47" of time left, "Closed" once it has passed. */
const remaining = (endsAt: string | null | undefined): string => {
  const end = Date.parse(String(endsAt ?? ''));
  if (!Number.isFinite(end)) return NOT_IN_API;
  const diff = end - Date.now();
  if (diff <= 0) return 'Closed';
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
};

/** "12" → "Dock 12"; text that already names the dock is left alone. */
const dockLabel = (raw: unknown): string => {
  const text = String(raw ?? '').trim();
  if (!text) return '';
  return /dock/i.test(text) ? text : `Dock ${text}`;
};

/** 35000 → "35,000 lbs", missing → "----". */
const weightLabel = (raw: number | null | undefined): string =>
  isNumber(raw) ? `${group(Math.round(Number(raw)))} lbs` : NOT_IN_API;

/**
 * The route reduced to "Single Stop" (1 pickup + 1 drop) or "Multi Stop" (more
 * of either). "----" when the payload carried no route.
 */
const stopKind = (route: BidDetailRouteStop[] | null | undefined): string => {
  const stops = Array.isArray(route) ? route : [];
  if (!stops.length) return NOT_IN_API;
  const drops = stops.filter(stop => isDrop(stop?.type)).length;
  const pickups = stops.length - drops;
  return pickups === 1 && drops === 1 ? 'Single Stop' : 'Multi Stop';
};

/** "22/256" when both halves are present, "22" with just the count. */
const palletsLabel = (specs: BidDetailLoadSpecs | undefined): string => {
  if (!isNumber(specs?.totalPallets)) return NOT_IN_API;
  return isNumber(specs?.palletCapacity)
    ? `${specs?.totalPallets}/${specs?.palletCapacity}`
    : String(specs?.totalPallets);
};

/** The per-leg schedule the screen draws from the payload's `route`. */
const toStops = (detail: BidDetail | null): AuctionDetail['stops'] => {
  const route = Array.isArray(detail?.route) ? [...detail.route] : [];
  return route.sort(bySequence).map(stop => {
    const window = [stopTime(stop?.fromTime), stopTime(stop?.toTime)]
      .filter(Boolean)
      .join(' - ');
    return {
      type: isDrop(stop?.type) ? 'D' : 'P',
      city: cityState(stop?.address) || String(stop?.address ?? ''),
      // The dock and the time window on one line under the city — the cargo
      // line the sample showed is not in this payload. Falls back to the
      // city/state, never the raw street address.
      detail:
        [dockLabel(stop?.dock), window].filter(Boolean).join(' • ') ||
        cityState(stop?.address),
      date: '',
      window: '',
    };
  });
};

/**
 * The Shipment Details grid — the same labels the screen already shows.
 *
 * Shipment ID and Auction Type are not in the detail payload, so they come from
 * the tapped bidding row (`base`): its `shipmentRef` (SHP-FTL-1084) and its
 * `auctionMode` (Normal/Instant).
 */
const toDetails = (
  detail: BidDetail | null,
  base: AuctionDetail,
): AuctionDetail['details'] => {
  const specs = detail?.loadSpecs;
  return [
    // The human ref from the bidding row, not the detail's GUID shipmentId.
    {label: 'Shipment ID', value: orNA(base.auctionRef)},
    {label: 'Type', value: orNA(humanize(detail?.shipmentType))},
    // Single vs multi stop, from the route's pickup/drop counts.
    {label: 'Mode', value: stopKind(detail?.route)},
    // The auction mode from the bidding row.
    {label: 'Auction Type', value: orNA(base.auctionMode ?? '')},
    {label: 'Frequency', value: NOT_IN_API},
    {label: 'Total Pallets', value: palletsLabel(specs)},
    {label: 'Total Weight', value: weightLabel(specs?.weightLbs)},
    {label: 'Equipment Type', value: orNA(humanize(specs?.equipment))},
  ];
};

/**
 * The detail payload → the auction the screen renders.
 *
 * @param detail the payload from `getBidDetail`, or null before it lands
 * @param fallback the auction built from the tapped row — used for the fields
 *   the detail payload has no answer for (leading banner, ref, truck list) and
 *   to paint the screen before the detail call returns
 */
export const toActiveBidding = (
  detail: BidDetail | null | undefined,
  fallback: AuctionDetail | null | undefined,
): AuctionDetail => {
  const base = fallback ?? EMPTY_AUCTION;
  if (!detail) return base;

  const auction = detail.auction;
  // Whether the auction reports a `current_lowest_bid_cents` figure at all —
  // true even at $0, since that's still a real bid; only null/missing counts
  // as no lowest bid. Drives the "Max Bid Cap" line, which only shows then.
  const hasLowestBid = isNumber(auction?.current_lowest_bid_cents);
  // Prefer `current_lowest_bid_cents` (e.g. 500000 → $5,000); fall back to the
  // dollar field, then to whatever the tapped row carried.
  const lowest = hasLowestBid
    ? Number(auction?.current_lowest_bid_cents) / 100
    : isNumber(auction?.currentLowestBid)
    ? Number(auction?.currentLowestBid)
    : base.currentLowest;

  // The route title shows the city name. Take it from `originCity`/
  // `destinationCity`, and fall back to the first and last stop's city so the
  // title still reads "Dallas → Houston" when those two fields are absent.
  const stops = toStops(detail);
  const origin =
    cityState(detail.originCity) ||
    stops[0]?.city ||
    base.origin ||
    NOT_IN_API;
  const dest =
    cityState(detail.destinationCity) ||
    stops[stops.length - 1]?.city ||
    base.dest ||
    NOT_IN_API;

  return {
    auctionId: String(detail.auctionId ?? base.auctionId ?? ''),
    mode: loadType(detail.shipmentType) || base.mode || NOT_IN_API,
    date: detail.pickupDate ? chipDate(detail.pickupDate) : NOT_IN_API,
    time: stopTime(detail.pickupTime) || NOT_IN_API,
    origin,
    dest,
    // No human ref in this payload; keep the one the row already knows.
    auctionRef: base.auctionRef || String(detail.shipmentId ?? '') || NOT_IN_API,
    commodity: orNA(
      String(detail.commodity ?? detail.loadSpecs?.commodity ?? ''),
    ),
    timeRemaining: remaining(auction?.auctionEndsAt),
    endsAt: auction?.auctionEndsAt ?? base.endsAt,
    yourBid: lowest,
    currentLowest: lowest,
    hasLowestBid,
    // The auction's ceiling, `max_bid_cap_cents` (e.g. 1500000 → $15,000).
    maxBidCap: isNumber(auction?.max_bid_cap_cents)
      ? Number(auction?.max_bid_cap_cents) / 100
      : base.maxBidCap,
    // Whether this driver is being outbid is not in the detail payload — carry
    // the leading state the row already resolved.
    outbid: base.outbid,
    // No vehicle API yet, and no sample to stand in — the picker is empty until
    // one exists, and the screen shows "----" in its place.
    vehicles: base.vehicles,
    stops,
    details: toDetails(detail, base),
  };
};

/**
 * Loads one auction's detail and keeps the payload in state, keyed by its id so
 * reopening the same auction redraws from the cache.
 *
 * @param auctionId the id off the tapped bidding row
 * @param pollMs when set, re-fetches every `pollMs` ms so the current lowest
 *   bid (and the rest of the auction) stays live — 5000 on the bid screen.
 */
export function useBidDetail(
  auctionId: string | null | undefined,
  pollMs = 0,
): {detail: Nullable<BidDetail>} & Omit<AsyncResource<BidDetail>, 'data'> {
  const fetcher = useMemo(
    () => () =>
      auctionId
        ? getBidDetail({auctionId})
        : Promise.reject(new Error('No auction was selected.')),
    [auctionId],
  );
  const {data, refresh, ...rest} = useCachedResource<BidDetail>(
    `bid-detail:${auctionId ?? ''}`,
    fetcher,
    {ttl: TTL.DETAIL, message: ERROR, enabled: Boolean(auctionId)},
  );

  // Poll while the screen is open. `force` ignores the cache TTL and `silent`
  // keeps the skeleton from flashing — the data just updates underneath.
  useEffect(() => {
    if (!auctionId || !pollMs) return;
    const id = setInterval(
      () => refresh({force: true, silent: true}),
      pollMs,
    );
    return () => clearInterval(id);
  }, [auctionId, pollMs, refresh]);

  // ActiveBidding get-data — the auction detail the screen renders from.
  useEffect(() => {
    console.log(
      `[ActiveBidding] get detail (auctionId: ${auctionId ?? 'none'})`,
      JSON.stringify(data ?? null, null, 2),
    );
  }, [data, auctionId]);

  return {detail: data, refresh, ...rest};
}

/**
 * The live "HH:MM:SS left" for an auction, recomputed every second so the timer
 * runs down on screen. Returns "Closed" once the end has passed (and stops the
 * ticking), and the "----" placeholder when there is no end timestamp.
 *
 * @param endsAt the auction's end, ISO (`auctionEndsAt` / `biddingClosesAt`)
 */
export function useCountdown(endsAt: string | null | undefined): string {
  const [label, setLabel] = useState(() => remaining(endsAt));

  useEffect(() => {
    setLabel(remaining(endsAt));
    const end = Date.parse(String(endsAt ?? ''));
    // Nothing to tick: no/invalid timestamp, or the auction has already closed.
    if (!Number.isFinite(end) || end - Date.now() <= 0) return;

    const id = setInterval(() => {
      const next = remaining(endsAt);
      setLabel(next);
      if (next === 'Closed') clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  return label;
}
