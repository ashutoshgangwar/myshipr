/**
 * The Filter Details popover's choices — `GET /drivers/bids/filter-options`
 * once per filter type (SHIPMENT_TYPE, AUCTION_MODE, EQUIPMENT_TYPE). Each
 * answer is a flat list of `{id, type, value}`; this hook humanizes every
 * `value` into the label the dropdown shows while keeping the raw enum as the
 * option's `value` — the enum the search body sends back.
 *
 * The lists are backend enums that barely move, so they are cached for half an
 * hour and the three requests share the screen's one `useCachedResource` store.
 */

import {useMemo} from 'react';

import {getBidFilterOptions} from '../../../config/driverApi';
import {useCachedResource} from '../../../services/resourceCache';
import {FILTER_FIELDS} from './constants';
import type {FilterField} from './constants';
import type {BidFilterOptionItem, BidFilterType} from '../../../types/bidding';

/** Enums move rarely enough that half an hour between reads is plenty. */
const FILTER_OPTIONS_TTL = 30 * 60 * 1000;

/** "FTL_STANDARD" → "FTL Standard". Empty stays empty. */
const humanize = (raw: unknown): string => {
  const text = String(raw ?? '').trim();
  if (!text) return '';
  return text
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/** One type's answer → the options the dropdown renders, raw enum and all. */
const toOptions = (list: BidFilterOptionItem[] | null) =>
  (Array.isArray(list) ? list : [])
    .filter(item => item?.value)
    .map(item => ({label: humanize(item.value), value: item.value}));

/** One filter type as a cached resource — same TTL and store for all three. */
const useOptions = (type: BidFilterType) =>
  useCachedResource(
    `bids-filter-options:${type}`,
    useMemo(() => () => getBidFilterOptions({type}), [type]),
    {ttl: FILTER_OPTIONS_TTL, message: 'Could not load filter options.'},
  );

export interface UseBidFilterOptions {
  /** The three filter fields, each with its options loaded (or still empty). */
  fields: FilterField[];
  loading: boolean;
  error: string | null;
}

/**
 * The three Filter Details fields with their options filled in from the API.
 * A field whose request has not answered yet (or failed) keeps its empty option
 * list, so the popover still opens and the other fields still work.
 */
export function useBidFilterOptions(): UseBidFilterOptions {
  const shipmentType = useOptions('SHIPMENT_TYPE');
  const auctionMode = useOptions('AUCTION_MODE');
  const equipmentType = useOptions('EQUIPMENT_TYPE');

  const byType: Record<BidFilterType, BidFilterOptionItem[] | null> = {
    SHIPMENT_TYPE: shipmentType.data,
    AUCTION_MODE: auctionMode.data,
    EQUIPMENT_TYPE: equipmentType.data,
  };

  const fields = useMemo(
    () =>
      FILTER_FIELDS.map(field => ({
        ...field,
        options: toOptions(byType[field.type]),
      })),
    [shipmentType.data, auctionMode.data, equipmentType.data],
  );

  return {
    fields,
    loading: shipmentType.loading || auctionMode.loading || equipmentType.loading,
    error: shipmentType.error ?? auctionMode.error ?? equipmentType.error,
  };
}
