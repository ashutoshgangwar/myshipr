import {useCallback} from 'react';
import {AppState} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';

import {getHosCard} from '../../config/driverApi';
import {TTL, useCachedResource} from '../../services/resourceCache';
import {clock, formatMinutes, isNumber, MONTHS_SHORT} from '../../utils/format';
import type {HosCard} from '../../types/earnings';

/** The payload may not have arrived yet. */
type Hos = HosCard | null | undefined;

const DUTY_LABELS: Record<string, string> = {
  OFF_DUTY: 'Off Duty',
  ON_DUTY: 'On Duty',
  ON_DUTY_NOT_DRIVING: 'On Duty',
  DRIVING: 'Driving',
  SLEEPER_BERTH: 'Sleeper Berth',
  PERSONAL_CONVEYANCE: 'Personal Conveyance',
  YARD_MOVE: 'Yard Move',
};

/**
 * The duty-status pill: its text plus whether the driver is on the clock.
 * `active` drives the colour — amber while hours are burning, grey while they
 * are not — so Off Duty never wears the same badge as Driving.
 *
 * @returns {{label: string, active: boolean}|null} null when no status came back
 */
export const toDutyPill = (hos: Hos) => {
  const status = hos?.dutyStatus;
  if (!status) return null;
  const key = String(status).toUpperCase();
  return {
    label:
      DUTY_LABELS[key] ||
      key
        .toLowerCase()
        .replace(/_/g, ' ')
        .replace(/\b\w/g, char => char.toUpperCase()),
    active: key === 'DRIVING' || key.startsWith('ON_DUTY'),
  };
};

/**
 * The driven-against-limit row and the bar under it.
 *
 * `totalDrivingMinutes` is the driver's own limit for the day, so the bar is
 * filled against it rather than against a hard-coded 11 hours. It arrives as 0
 * on a driver who has not started — dividing by that would be NaN, so the bar
 * simply stays empty.
 */
export const toHosBar = (hos: Hos) => {
  const driven = isNumber(hos?.drivenMinutes) ? Number(hos.drivenMinutes) : null;
  const total = isNumber(hos?.totalDrivingMinutes)
    ? Number(hos.totalDrivingMinutes)
    : null;

  const percent =
    driven !== null && total !== null && total > 0
      ? Math.min(100, Math.round((driven / total) * 100))
      : 0;

  return {
    driven: driven === null ? '—' : `${formatMinutes(driven)} Driven`,
    total: total === null ? '—' : `${formatMinutes(total)} Total`,
    width: `${percent}%` as const,
    critical: percent >= 80,
  };
};

export const formatResetAt = (value: unknown): string => {
  if (!value) return '—';
  const at = new Date(value as string | number | Date);
  if (Number.isNaN(at.getTime())) return String(value);

  const now = new Date();
  const midnight = (date: Date): number =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((midnight(at) - midnight(now)) / 86400000);

  if (days === 0) return `Today ${clock(at)}`;
  if (days === 1) return `Tomorrow ${clock(at)}`;
  return `${at.getDate()} ${MONTHS_SHORT[at.getMonth()]}, ${clock(at)}`;
};

/** The label/value rows under the bar. */
export const toHosDetails = (hos: Hos) => [
  {
    label: 'Remaining Driving Hours',
    value: formatMinutes(hos?.remainingDrivingMinutes),
  },
  {label: 'Reset Available', value: formatResetAt(hos?.resetAvailableAt)},
];

/**
 * How often the card re-reads itself while Home is on screen.
 *
 * This used to be one second. Driving minutes tick once a minute, so 59 of
 * every 60 of those calls re-read a figure that had not moved — a request per
 * second, per driver, for the whole time Home was open. `TTL.HOS` is 20s,
 * which keeps the bar and the duty pill within a minute of the truth for a
 * thirtieth of the traffic; the poll runs at the same period, so a tick that
 * finds a fresh answer in the cache costs nothing at all.
 */
export const HOS_POLL_MS = TTL.HOS;

const ERROR = 'Could not load your hours of service.';

/**
 * Loads the driver's HOS card, keeps it in the shared cache, and re-reads it
 * every `HOS_POLL_MS` while Home is focused.
 *
 * `refresh({silent: true})` is what the poll uses: it leaves `loading` and
 * `error` alone, so a tick can neither shimmer the card the driver is reading
 * nor replace it with an error message over one dropped request. A tick whose
 * payload comes back unchanged — most of them — keeps the cached object, so
 * the card does not repaint either.
 *
 * @returns {{hos: object|null, loading: boolean, error: string|null,
 *            refresh: (opts?: {force?: boolean, silent?: boolean})
 *              => Promise<object|null>}}
 */
export function useHosCard() {
  const {data, loading, error, refresh} = useCachedResource<HosCard>(
    'hos-card',
    getHosCard,
    {ttl: TTL.HOS, message: ERROR},
  );

  // The poll. Focus-scoped, so it stops the moment the driver leaves Home —
  // this screen stays mounted underneath the trip screen for the whole run,
  // and a call left going there would outlive what it is drawing.
  useFocusEffect(
    useCallback(() => {
      const id = setInterval(() => {
        // Nothing to draw while the phone is in the driver's pocket. The
        // cache handles the other half of what this guard used to do: a
        // request already in flight is joined, not doubled.
        if (AppState.currentState !== 'active') return;
        refresh({silent: true});
      }, HOS_POLL_MS);

      return () => clearInterval(id);
    }, [refresh]),
  );

  return {hos: data, loading, error, refresh};
}
