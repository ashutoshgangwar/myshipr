/**
 * The Bidding screen's data: `POST /drivers/bids/search` turned into the rows
 * the table and grid render and the figures behind the four header cards.
 *
 * The screen's own state — the selected header card, the mode chip, the search
 * box and the Filter Details popover — becomes the request body here, so the
 * backend does the filtering the screen used to do over its mock list. `status`
 * is always sent; everything else is added only once the driver has set it.
 *
 * Every mapper tolerates a half-filled payload, the same rule the shipment
 * mappers follow: a row missing a field still lists rather than blanking the
 * screen, and an empty answer simply shows no bids.
 */

import {useEffect, useMemo} from 'react';

import {searchBids} from '../../../config/driverApi';
import {TTL, useCachedResource} from '../../../services/resourceCache';
import {cityLabel, loadType} from '../../../services/upcomingShipments';
import {colors} from '../../../theme/colors';
import {
  formatMiles,
  formatMoney,
  MONTHS_SHORT,
  stopTime,
} from '../../../utils/format';
import {BUCKETS, STATS, bucketToStatus, rangeFor} from './constants';
import type {BidRow, Filters, MockStop} from './constants';
import type {
  BidSearchItem,
  BidSearchParams,
  BidSearchStop,
  BidSearchSummary,
} from '../../../types/bidding';
import type {DashboardStat} from '../../../component/DashboardHeader/DashboardHeader';
import type {AuctionDetail} from '../../../types/navigation';

/** The screen state that drives the request. */
export interface BidSearchInput {
  /** The selected header card, or undefined for ALL. */
  bucket?: string;
  /** The mode chip — 'All Modes' | 'FTL' | 'LTL'. */
  mode?: string;
  search?: string;
  filters?: Filters;
}

const EMPTY_ROWS: BidRow[] = [];

const isDrop = (type: string | null | undefined): boolean =>
  /DROP|DELIVER/i.test(String(type || ''));

const bySequence = (a: BidSearchStop, b: BidSearchStop): number =>
  (a?.sequence ?? 0) - (b?.sequence ?? 0);

/** "2026-10-06" → "Oct, 06"; anything else is passed through. */
const chipDate = (raw: unknown): string => {
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(raw ?? '').trim());
  if (!iso) return String(raw ?? '');
  const month = MONTHS_SHORT[Number(iso[2]) - 1];
  return month ? `${month}, ${iso[3]}` : String(raw ?? '');
};

/** "DRY_VAN" → "Dry Van". Empty stays empty. */
const humanize = (raw: unknown): string => {
  const text = String(raw ?? '').trim();
  if (!text) return '';
  return text
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/** "FTL_STANDARD" → "FTL · STANDARD" — the full shipment type for the card. */
const shipmentTypeLabel = (raw: unknown): string =>
  String(raw ?? '')
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .join(' · ');

/** "NORMAL" → "Normal", "INSTANT" → "Instant" — the two tones the pill knows. */
const auctionType = (raw: unknown): string =>
  /instant/i.test(String(raw ?? '')) ? 'Instant' : 'Normal';

/** The backend's requirement reduced to the two the pill tints. */
const driverRequirement = (raw: unknown): string =>
  /multi/i.test(String(raw ?? '')) ? 'Multi Driver' : 'Single';

/** API status → the row `status` the lowest-bid cell reads. */
const rowStatus = (raw: unknown): string => {
  const text = String(raw ?? '').toUpperCase();
  if (text === 'PAST' || text === 'CLOSED') return 'Closed';
  if (text === 'AWARDED') return 'Awarded';
  return 'Open';
};

/**
 * The buckets a row belongs to, so the client can still group it if it needs.
 * A finished auction may come back as either `PAST` or `CLOSED`; both are the
 * past bucket, so a closed auction never leaks into Active (the "My Bids" tab).
 */
const categoriesOf = (item: BidSearchItem): string[] => {
  const status = String(item?.status ?? '').toUpperCase();
  const list: string[] = [];
  if (status === 'AWARDED') list.push(BUCKETS.awarded);
  else if (status === 'PAST' || status === 'CLOSED') list.push(BUCKETS.past);
  else list.push(BUCKETS.active);
  if (item?.leading) list.push(BUCKETS.leading);
  return list;
};

/** The route the Load column draws, in the order the driver runs it. */
const toStops = (item: BidSearchItem): MockStop[] => {
  const stops = Array.isArray(item?.stops) ? [...item.stops] : [];
  const ordered = stops
    .sort(bySequence)
    .map((stop): MockStop => ({
      city: cityLabel({address: stop?.address}),
      type: isDrop(stop?.type) ? 'drop' : 'pickup',
    }))
    .filter(stop => stop.city);
  if (ordered.length) return ordered;

  // No stop list: fall back to the origin/destination summary the row carries.
  const origin = cityLabel({address: item?.originCity});
  const dest = cityLabel({address: item?.destinationCity});
  return [
    ...(origin ? [{city: origin, type: 'pickup' as const}] : []),
    ...(dest ? [{city: dest, type: 'drop' as const}] : []),
  ];
};

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** `biddingClosesAt` → "03:04:47" of time left, "Closed" once it has passed. */
const remaining = (closesAt: string | null | undefined): string => {
  const end = Date.parse(String(closesAt ?? ''));
  if (!Number.isFinite(end)) return '—';
  const diff = end - Date.now();
  if (diff <= 0) return 'Closed';
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
};

const dash = (value: string): string => value || '—';

/** The route the detail screen's per-leg schedule draws. */
const toAuctionStops = (item: BidSearchItem): AuctionDetail['stops'] => {
  const stops = Array.isArray(item?.stops) ? [...item.stops].sort(bySequence) : [];
  return stops.map(stop => ({
    type: isDrop(stop?.type) ? 'D' : 'P',
    city: cityLabel({address: stop?.address}) || String(stop?.address ?? ''),
    detail: String(stop?.address ?? ''),
    date: chipDate(stop?.date),
    window: [stopTime(stop?.from), stopTime(stop?.to)].filter(Boolean).join(' - '),
  }));
};

/**
 * "1 Pickup 1 Drop" → "Single Stop"; any more pickups or drops → "Multi Stop".
 * Empty when the summary carried no counts.
 */
export const stopKind = (summary: string | null | undefined): string => {
  const text = String(summary ?? '');
  const pickups = Number(/(\d+)\s*pickup/i.exec(text)?.[1] ?? 0);
  const drops = Number(/(\d+)\s*drop/i.exec(text)?.[1] ?? 0);
  if (!pickups && !drops) return '—';
  return pickups === 1 && drops === 1 ? 'Single Stop' : 'Multi Stop';
};

/**
 * The detail screen's Shipment Details grid. The labels are kept exactly as the
 * screen already shows them; only the values come from the payload. The three
 * the search answer does not carry (frequency, pallets, weight) read "—" rather
 * than a made-up figure.
 */
const toAuctionDetails = (item: BidSearchItem): AuctionDetail['details'] => [
  {label: 'Shipment ID', value: dash(String(item?.shipmentRef ?? ''))},
  {label: 'Type', value: dash(humanize(item?.shipmentType))},
  {label: 'Mode', value: stopKind(item?.stopsSummary)},
  {label: 'Auction Type', value: dash(humanize(item?.auctionMode))},
  {label: 'Frequency', value: '—'},
  {label: 'Total Pallets', value: '—'},
  {label: 'Total Weight', value: '—'},
  {label: 'Equipment Type', value: dash(humanize(item?.equipmentType))},
];

/**
 * One search row → the auction the detail screen (ActiveBidding) paints while
 * its own `GET /drivers/bids/{auctionId}/detail` loads, so a tapped bid shows
 * its real data from the first frame. Nothing here is a sample: the vehicle
 * list is empty (no vehicle API yet) and unknown fields read "—".
 */
export const toAuction = (item: BidSearchItem): AuctionDetail => {
  const amount = Number(item?.lowestBidAmount);
  const bid = Number.isFinite(amount) ? amount : 0;
  return {
    auctionId: String(item?.auctionId ?? ''),
    mode: loadType(item?.shipmentType) || '—',
    date: chipDate(item?.date),
    time: stopTime(item?.pickupTime) || '—',
    origin: cityLabel({address: item?.originCity}),
    dest: cityLabel({address: item?.destinationCity}),
    auctionRef: dash(String(item?.shipmentRef ?? '')),
    // Carried so the detail screen can show them even though its own payload
    // has no human ref and no auction mode.
    auctionMode: dash(humanize(item?.auctionMode)),
    commodity: '—',
    timeRemaining: remaining(item?.biddingClosesAt),
    endsAt: item?.biddingClosesAt,
    yourBid: bid,
    currentLowest: bid,
    // Leading means nobody has beaten this bid; anything else shows the banner.
    outbid: item?.leading === false,
    // No vehicle API yet — the picker fills in once one exists.
    vehicles: [],
    stops: toAuctionStops(item),
    details: toAuctionDetails(item),
  };
};

/** One search row → the row shape the table and grid render. */
export const toBidRow = (item: BidSearchItem): BidRow => {
  const stops = toStops(item);
  const pickup = stopTime(item?.pickupTime);
  const drop = stopTime(item?.dropTime);
  const date = chipDate(item?.date);
  const money =
    item?.lowestBidAmount != null ? formatMoney(item.lowestBidAmount) : '—';
  const status = rowStatus(item?.status);

  return {
    id: String(item?.auctionId ?? ''),
    auctionId: item?.auctionId,
    // Place Bid is sent against the auction id, which is the shipment id.
    shipmentId: String(item?.auctionId ?? ''),
    ref: String(item?.shipmentRef ?? ''),
    date,
    time: pickup,
    pickupTime: pickup,
    pickupDate: date,
    dropTime: drop,
    dropDate: date,
    pickupClock: pickup || '—',
    dropClock: drop || '—',
    indicative: money,
    amount: money,
    lowestBid: money,
    awardedAt: status === 'Awarded' ? money : null,
    auctionMode: humanize(item?.auctionMode),
    auctionType: auctionType(item?.auctionMode),
    // The full shipment type, e.g. "FTL · STANDARD" — the card's mode line.
    shipmentType: shipmentTypeLabel(item?.shipmentType),
    // No commodity in the search payload yet — stays "—" rather than invented.
    commodity: '—',
    deadMile: item?.deadMiles != null ? String(item.deadMiles) : '—',
    tripDistance:
      item?.distanceMiles != null
        ? formatMiles(item.distanceMiles, 'mi')
        : '—',
    frequency: 'One-Time',
    equipmentType: humanize(item?.equipmentType),
    dockPriority: '—',
    driverRequirement: driverRequirement(item?.driverRequirement),
    categories: categoriesOf(item),
    mode: loadType(item?.shipmentType) || '—',
    stops,
    // No per-driver rank in the payload; the leading flag is what we have.
    rank: item?.leading ? '#1 you' : null,
    status,
    origin: cityLabel({address: item?.originCity}),
    dest: cityLabel({address: item?.destinationCity}),
    // Carried so the tapped row opens the detail screen with its own real data.
    auction: toAuction(item),
  };
};

/** The whole `content` array → table rows. */
export const toBidRows = (
  content: BidSearchItem[] | null | undefined,
): BidRow[] =>
  Array.isArray(content) && content.length
    ? content.map(toBidRow)
    : EMPTY_ROWS;

/** "LAST_WEEK" → "last week". */
const period = (raw: unknown): string =>
  String(raw ?? 'LAST_WEEK')
    .toLowerCase()
    .replace(/_/g, ' ');

/**
 * The summary → the four header cards. The base `STATS` keep every card's
 * label, note copy and tint; only the figures (and the awarded card's trend
 * line) come from the payload. No summary leaves the cards as `STATS` defined
 * them, so the header still paints before the first answer lands.
 */
export const toBidStats = (
  summary: BidSearchSummary | null | undefined,
): DashboardStat[] => {
  if (!summary) return STATS as DashboardStat[];

  const valueFor: Record<string, number | undefined> = {
    [BUCKETS.leading]: summary.currentlyLeading,
    [BUCKETS.active]: summary.activeBids,
    [BUCKETS.awarded]: summary.awardedBids,
    [BUCKETS.past]: summary.pastAuction,
  };

  return STATS.map((stat): DashboardStat => {
    const value = valueFor[stat.key];
    const next: DashboardStat = {
      ...stat,
      value: value != null ? String(value) : stat.value,
    };

    if (stat.key === BUCKETS.awarded) {
      const pct = summary.awardedBidsChangePercentage ?? 0;
      const up = String(summary.awardedBidsTrend).toUpperCase() === 'UP';
      next.note = `${pct}% vs ${period(summary.awardedBidsComparisonPeriod)}`;
      next.up = up;
      next.noteColor = up ? colors.success : colors.textMuted;
    }

    return next;
  });
};

/** The search body built from the screen's current state. */
export const buildBidSearchParams = ({
  bucket,
  mode,
  search,
  filters,
}: BidSearchInput): BidSearchParams => {
  const picked = filters ?? {};
  const params: BidSearchParams = {status: bucketToStatus(bucket)};

  const text = (search ?? '').trim();
  if (text) params.search = text;

  // The Filter Details "Shipment Type" wins; otherwise the mode chip narrows it.
  const shipmentType =
    picked.shipmentType ?? (mode && mode !== 'All Modes' ? mode : undefined);
  if (shipmentType) params.shipmentType = shipmentType;

  if (picked.auctionMode) params.auctionMode = picked.auctionMode;
  if (picked.pickupTime) params.pickupTime = picked.pickupTime;
  if (picked.equipmentType) params.equipmentType = picked.equipmentType;

  const bid = rangeFor('bidPrice', picked);
  if (bid.min != null) params.bidPriceMin = bid.min;
  if (bid.max != null) params.bidPriceMax = bid.max;

  const distance = rangeFor('tripDistance', picked);
  if (distance.min != null) params.distanceMin = distance.min;
  if (distance.max != null) params.distanceMax = distance.max;

  const dead = rangeFor('deadMile', picked);
  if (dead.min != null) params.deadMileMin = dead.min;
  if (dead.max != null) params.deadMileMax = dead.max;

  return params;
};

export interface UseBidSearch {
  rows: BidRow[];
  stats: DashboardStat[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * The Bidding screen's one data hook.
 *
 * It runs two requests, because the header cards and the list answer different
 * questions. The list is the selected status; the cards are always the totals
 * across every bucket, so selecting LEADING must not zero the Active/Awarded/
 * Past cards. The card request therefore pins `status: ALL` (keeping the search
 * and filters) while the list request carries the selected card's status.
 *
 * When no card is selected (the default, ALL) the two bodies are identical, so
 * they share one cache entry and cost a single call — the second hook just
 * reads the same answer.
 */
export function useBidSearch(input: BidSearchInput): UseBidSearch {
  // The list: the selected card's status + search + filters.
  const listParams = useMemo(
    () => buildBidSearchParams(input),
    [input.bucket, input.mode, input.search, input.filters],
  );
  // The cards: the same search + filters, but always ALL — the totals the
  // header shows do not change as the driver flips between cards.
  const summaryParams = useMemo(
    () => buildBidSearchParams({...input, bucket: undefined}),
    [input.mode, input.search, input.filters],
  );

  const listKey = `bids-search:${JSON.stringify(listParams)}`;
  const summaryKey = `bids-search:${JSON.stringify(summaryParams)}`;

  const list = useCachedResource(
    listKey,
    useMemo(() => () => searchBids(listParams), [listKey]),
    {ttl: TTL.LIST, message: 'Could not load your bids.'},
  );
  const summary = useCachedResource(
    summaryKey,
    useMemo(() => () => searchBids(summaryParams), [summaryKey]),
    {ttl: TTL.LIST, message: 'Could not load your bids.'},
  );

  const rows = useMemo(() => {
    const mapped = toBidRows(list.data?.content);
    // Guard against a backend that answers a status-filtered request with rows
    // that do not match it — selecting AWARDED must never show a non-awarded
    // row, so with 0 awarded bids the table is empty rather than full.
    if (!input.bucket) return mapped;
    return mapped.filter(row => row.categories.includes(input.bucket as string));
  }, [list.data, input.bucket]);

  const stats = useMemo(
    () => toBidStats(summary.data?.summary),
    [summary.data],
  );

  // BiddingScreen data — what the list request and the summary request returned.
  useEffect(() => {
    console.log(
      '[Bidding] list request',
      JSON.stringify(listParams, null, 2),
      '\n[Bidding] list response',
      JSON.stringify(list.data, null, 2),
    );
  }, [list.data, listParams]);

  useEffect(() => {
    console.log(
      '[Bidding] summary response',
      JSON.stringify(summary.data?.summary ?? null, null, 2),
    );
  }, [summary.data]);

  return {
    rows,
    stats,
    loading: list.loading || summary.loading,
    error: list.error ?? summary.error,
    refresh: () => {
      void list.refresh();
      void summary.refresh();
    },
  };
}
