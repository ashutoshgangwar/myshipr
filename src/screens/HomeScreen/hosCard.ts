import {useCallback, useEffect, useRef, useState} from 'react';

import {getHosCard} from '../../config/driverApi';
import {clock, formatMinutes, isNumber, MONTHS_SHORT} from '../../utils/format';
import type {AxiosError} from 'axios';
import type {ApiErrorBody} from '../../types/api';
import type {ErrorLike} from '../../types/common';
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
 * Loads the driver's HOS card and keeps it in state.
 *
 * @returns {{hos: object|null, loading: boolean, error: string|null,
 *            refresh: () => Promise<object|null>}}
 */
export function useHosCard() {
  const [hos, setHos] = useState<HosCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const requestRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setError(null);

    try {
      const payload = await getHosCard();
      // A later refresh having already answered means this one is stale —
      // writing it would walk the card backwards.
      if (!mountedRef.current || requestId !== requestRef.current) return payload;
      setHos(payload || null);
      return payload;
    } catch (e) {
      const err = e as AxiosError<ApiErrorBody> & ErrorLike;
      if (mountedRef.current && requestId === requestRef.current) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            'Could not load your hours of service.',
        );
      }
      return null;
    } finally {
      if (mountedRef.current && requestId === requestRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {hos, loading, error, refresh};
}
