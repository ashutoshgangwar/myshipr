import {fetchResource, useCachedResource, TTL} from './resourceCache';

import {getFuelReward} from '../config/driverApi';
import type {FuelReward} from '../types/earnings';

const ERROR = 'Could not load your reward points.';

/**
 * The driver's fuel-reward balance, read through the shared cache.
 *
 * The balance only moves when the driver reports a price, so a minute of
 * staleness costs nothing and a return to Home inside that minute draws the
 * points already on screen without a call. A report that credits points
 * should call `refresh({force: true})`, or `refreshFuelReward()` from outside
 * a card that shows the balance.
 *
 * @returns {{points: number|null, loading: boolean, error: string|null,
 *            refresh: (opts?: {force?: boolean}) => Promise<object|null>}}
 */
export function useFuelReward() {
  const {data, loading, error, refresh} = useCachedResource<FuelReward>(
    'fuel-reward',
    getFuelReward,
    {ttl: TTL.REWARD, message: ERROR},
  );

  const total = Number(data?.totalRewardPoints);

  return {
    points: Number.isFinite(total) ? total : null,
    loading,
    error,
    refresh,
  };
}

/**
 * Re-read the balance without subscribing to it.
 *
 * For whoever *causes* the balance to move — the fuel-price prompt lives
 * outside the navigator and has no points on screen of its own, so it files
 * the report and leaves the redraw to the cards that are subscribed.
 */
export const refreshFuelReward = () =>
  fetchResource<FuelReward>('fuel-reward', getFuelReward, {
    force: true,
    message: ERROR,
  });
