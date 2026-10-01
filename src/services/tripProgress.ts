/**
 * The trip's stop-by-stop status — `GET /drivers/shipments/{shipmentId}/progress`
 * turned into the strip of steps the map screen renders along its bottom bar.
 *
 * Two things make this its own module rather than screen state:
 *
 *  - "Is this stop done?" is a per-kind question. A pickup is finished when it
 *    has been procured (`status: SHIPMENT_PROCURED` / `shipmentProcured`), a
 *    drop when it has been delivered (`status: COMPLETED` / `completed`). Both
 *    the strip and the verify flow have to agree on that rule, so it is written
 *    once, here.
 *  - The stops come back keyed on `tripSequence` — 1, 2, 3 … — and that order,
 *    not the array order, is the order the driver works them in. Everything
 *    below sorts on it before doing anything else.
 */

import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {getShipmentProgress} from '../config/driverApi';
import type {AxiosError} from 'axios';
import type {ApiErrorBody} from '../types/api';
import type {ErrorLike, Nullable} from '../types/common';
import type {
  TripProgress,
  TripProgressStop,
  TripStopTarget,
  StopType,
} from '../types/shipment';

/** Everything below reads a payload that may not have arrived yet. */
type Progress = TripProgress | null | undefined;

const ERROR = 'Could not load this trip’s progress.';

/** The status a finished stop carries, per kind. */
export const PICKUP_DONE_STATUS = 'SHIPMENT_PROCURED';
export const DROP_DONE_STATUS = 'COMPLETED';

/** Where the driver stands on one stop. Only `active` can be acted on. */
export type TripStepState = 'done' | 'active' | 'pending';

/** One row of the bottom-bar status strip. */
export interface TripStep {
  /** Stable list key — `tripSequence` is unique across the trip. */
  key: string;
  tripSequence: number;
  sequence: Nullable<number>;
  shipmentId: Nullable<string>;
  kind: 'pickup' | 'drop';
  /** "P1" / "D2" — pickups and drops numbered separately, in trip order. */
  code: string;
  /** "Pickup 1" / "Drop 2", for the verify sheet's copy. */
  label: string;
  /**
   * The stop's place in the trip, 1-based — "Shipment 1", "Shipment 2" as the
   * checklist names them. Distinct from `code`, which restarts its numbering
   * per kind: stop 3 of a trip is `Shipment 3` here and `D1` there.
   */
  stopNumber: number;
  address: string;
  /** The raw server status, kept so the strip can show what it actually said. */
  status: string;
  state: TripStepState;
  /** True only on the one stop the driver can verify right now. */
  clickable: boolean;
  /** When it was procured / completed, if it is done. */
  doneAt: Nullable<string>;
}

/** The pre-trip inspection, which precedes every stop. */
export interface PreTripStep {
  done: boolean;
  at: Nullable<string>;
}

const isDrop = (type: StopType | null | undefined): boolean =>
  /DROP|DELIVER/i.test(String(type ?? ''));

/** The progress payload spells this `stopType`; the trip payload, `type`. */
const stopKind = (stop: TripProgressStop | null | undefined) =>
  isDrop(stop?.stopType ?? stop?.type) ? ('drop' as const) : ('pickup' as const);

/**
 * Whether a stop is finished, by the rule its kind is judged on.
 *
 * Both the boolean flag and the status string are checked: the flag is the
 * field the backend documents, the status is what it renders, and a payload
 * that carries only one of the two still has to read correctly.
 */
export const isStopDone = (stop: TripProgressStop | null | undefined): boolean => {
  if (!stop) return false;
  const status = String(stop.status ?? '').toUpperCase();
  return stopKind(stop) === 'drop'
    ? stop.completed === true || status === DROP_DONE_STATUS
    : stop.shipmentProcured === true || status === PICKUP_DONE_STATUS;
};

/** When the stop was cleared, read off whichever timestamp its kind carries. */
const doneAt = (stop: TripProgressStop): Nullable<string> =>
  (stopKind(stop) === 'drop' ? stop.completedAt : stop.shipmentProcuredAt) ??
  null;

/**
 * The stops in the order they are driven.
 *
 * `tripSequence` is the trip-wide order and the one that counts — a trip can
 * span several shipments, each with its own `sequence` starting back at 1.
 */
export const orderedProgressStops = (progress: Progress): TripProgressStop[] => {
  const stops = Array.isArray(progress?.stops) ? [...progress.stops] : [];
  return stops.sort(
    (a, b) =>
      (a?.tripSequence ?? a?.sequence ?? 0) - (b?.tripSequence ?? b?.sequence ?? 0),
  );
};

/**
 * The trip's own stops, in the shape the progress payload sends them.
 *
 * `GET /drivers/shipments/{tripId}` is the endpoint that lists the run in full
 * — every sequence, with the address and the coordinates — so it, not
 * `/progress`, is what the checklist is built from. Carrying no status is the
 * point: a stop is ticked only once `/progress` reports it, and one the trip
 * lists but progress has said nothing about is shown plainly, unticked.
 */
const asProgressStops = (
  targets?: readonly TripStopTarget[] | null,
): TripProgressStop[] =>
  (targets ?? []).map(target => ({
    sequence: target.sequence ?? undefined,
    tripSequence: target.tripSequence,
    shipmentId: target.shipmentId ?? undefined,
    stopType: target.type,
    address: target.address,
    // No status: nothing has reported on this stop, and inventing one here
    // would tick a box the backend has not.
    status: '',
  }));

/** The key both payloads name a stop by: its place in the trip. */
const stopKey = (stop: TripProgressStop | null | undefined): number =>
  Number(stop?.tripSequence ?? stop?.sequence ?? NaN);

/**
 * The trip's stops with `/progress`'s answers laid over them.
 *
 * The two endpoints describe the same stops from opposite ends: the trip knows
 * every sequence and where it is, progress knows which of them have been
 * worked. Neither is complete on its own, and the failure mode of picking one
 * is a checklist that goes short — progress reporting only the stops it has
 * touched would drop the rest of the run off the panel mid-trip.
 *
 * So the trip's list is the roster and progress supplies status, matched on
 * `tripSequence`. A stop progress has not mentioned keeps the empty status it
 * was built with, which reads as unticked everywhere downstream. A stop only
 * progress knows about is kept too, appended rather than dropped: it is real
 * work the driver has done, and the trip payload being stale is not a reason
 * to hide it.
 */
const mergeProgress = (
  roster: TripProgressStop[],
  reported: TripProgressStop[],
): TripProgressStop[] => {
  const byKey = new Map<number, TripProgressStop>();
  reported.forEach(stop => {
    const key = stopKey(stop);
    if (Number.isFinite(key)) byKey.set(key, stop);
  });

  const matched = new Set<TripProgressStop>();
  const merged = roster.map(stop => {
    const status = byKey.get(stopKey(stop));
    if (!status) return stop;
    matched.add(status);
    return {
      ...stop,
      ...status,
      // The trip payload is the one that always carries these; progress can
      // send a stop through with either missing, and losing the address would
      // cost the row the only line that says where it is.
      stopType: status.stopType ?? status.type ?? stop.stopType,
      address: status.address || stop.address,
    };
  });

  const extra = reported.filter(stop => !matched.has(stop));
  if (!extra.length) return merged;

  return [...merged, ...extra].sort(
    (a, b) => (stopKey(a) || 0) - (stopKey(b) || 0),
  );
};

/**
 * The status strip: every stop in trip order, each marked done, active or
 * still to come.
 *
 * Exactly one step is `active` — the first one that is not finished — and it is
 * the only one the driver can tap. A finished stop has nothing left to do, and
 * a later one cannot be verified before the stops in front of it, so neither is
 * clickable.
 *
 * The stops themselves come from the trip, not from progress — see
 * `mergeProgress`. Progress decides only which of them are ticked.
 *
 * @param progress the payload from `getShipmentProgress`
 * @param verified `tripSequence`es cleared on this device since the payload was
 *   fetched, folded in on top of it — see `useTripProgress`
 * @param tripStops the run as `GET /drivers/shipments/{tripId}` lists it
 */
export const toTripSteps = (
  progress: Progress,
  verified?: ReadonlySet<number> | null,
  tripStops?: readonly TripStopTarget[] | null,
): TripStep[] => {
  const reported = orderedProgressStops(progress);
  const roster = asProgressStops(tripStops);
  // Only a trip that listed no stops of its own falls back to progress's list.
  const stops = roster.length ? mergeProgress(roster, reported) : reported;

  // Pickups and drops are numbered within their own kind, so a trip that picks
  // up twice and drops twice reads P1 P2 D1 D2 — the codes the driver's
  // paperwork uses, not a running 1-4.
  const seen = {pickup: 0, drop: 0};
  let activeTaken = false;

  return stops.map((stop, index) => {
    const tripSequence = stop?.tripSequence ?? stop?.sequence ?? index + 1;
    const kind = stopKind(stop);
    const number = ++seen[kind];

    const done = isStopDone(stop) || Boolean(verified?.has(tripSequence));
    // The first unfinished stop is the one being driven to; everything after
    // it waits its turn.
    const active = !done && !activeTaken;
    if (active) activeTaken = true;

    const status = done
      ? String(stop?.status ?? '').toUpperCase() ||
        (kind === 'drop' ? DROP_DONE_STATUS : PICKUP_DONE_STATUS)
      : String(stop?.status ?? '').toUpperCase();

    return {
      key: String(tripSequence),
      tripSequence,
      sequence: stop?.sequence ?? null,
      shipmentId: stop?.shipmentId ?? null,
      kind,
      code: `${kind === 'drop' ? 'D' : 'P'}${number}`,
      label: `${kind === 'drop' ? 'Drop' : 'Pickup'} ${number}`,
      stopNumber: index + 1,
      address: String(stop?.address ?? ''),
      status,
      state: done ? 'done' : active ? 'active' : 'pending',
      clickable: active,
      doneAt: done ? doneAt(stop) : null,
    };
  });
};

/**
 * The pre-trip inspection as its own leading step.
 *
 * `confirmed` is the driver having pressed Confirm Done on this device since
 * the payload was fetched — folded in the same way a verified stop is, so a
 * refresh the backend has not caught up with cannot put the card back up.
 */
export const toPreTripStep = (
  progress: Progress,
  confirmed?: boolean,
): PreTripStep => ({
  done: progress?.preTripInspection === true || confirmed === true,
  at: progress?.preTripInspectionAt ?? null,
});

/** The stop the driver is currently driving to, or null once all are cleared. */
export const activeStep = (steps: TripStep[]): TripStep | null =>
  steps.find(step => step.state === 'active') ?? null;

/** The stop just cleared — what the progress bar labels its left end with. */
export const lastDoneStep = (steps: TripStep[]): TripStep | null => {
  const done = steps.filter(step => step.state === 'done');
  return done.length ? done[done.length - 1] : null;
};
/**
 * A row of the trip checklist panel.
 *
 * Same data as the bottom-bar strip, spelled out — the strip has room for a
 * code and a word, this has room for the sentence and the address.
 */
export interface ChecklistRow {
  key: string;
  title: string;
  /** The stop's address, which is the useful half of a one-line step. */
  detail: string;
  /**
   * When the backend says the step was cleared, formatted for the row — empty
   * on a step it has not cleared, which is every step that has no timestamp.
   */
  time: string;
  done: boolean;
  /** The one row the driver can act on; everything else is status only. */
  active: boolean;
  /** The stop behind the row — null on the pre-trip inspection. */
  step: Nullable<TripStep>;
}

/** Humanises a raw status for a row that has nothing better to show. */
const statusText = (status: string): string =>
  status
    ? status
        .split('_')
        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ')
    : '';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * `"2026-09-01T05:33:04.156088Z"` → `"1 Sep, 11:03 AM"`, in the device's zone.
 *
 * The API stamps its times to the microsecond and JS only specifies three
 * fractional digits, so the tail is trimmed before parsing rather than trusted
 * to the engine — Hermes is stricter about it than V8. Anything that still
 * will not parse returns empty, and the row simply shows no time.
 *
 * The date rides along with the clock time because a trip can run past
 * midnight: "11:03 AM" alone would not say which day's collection it was.
 */
export const stepTime = (iso?: string | null): string => {
  const raw = String(iso ?? '').trim();
  if (!raw) return '';

  const date = new Date(raw.replace(/(\.\d{3})\d+/, '$1'));
  if (Number.isNaN(date.getTime())) return '';

  const hours = date.getHours();
  const suffix = hours < 12 ? 'AM' : 'PM';
  // 0 and 12 are both "12" on a 12-hour clock.
  const hour = hours % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${hour}:${minutes} ${suffix}`;
};

/**
 * The checklist the panel renders, in the order the run actually happens:
 * the inspection, every pickup collected, then every delivery.
 *
 * That grouping is why this does not simply walk the stops in `tripSequence`
 * order — the collections are listed together and the deliveries after them.
 * Within each group the trip order is kept.
 *
 * Every row is a step the backend reports on, so every row can tick and the
 * panel's completion figure counts them all.
 *
 * Every tick here is the backend's answer, not a local toggle: a pickup shows
 * done because the trip reports `SHIPMENT_PROCURED`, a drop because it reports
 * `COMPLETED`. That is also why only the active row is actionable — the status
 * changes when the stop's OTP is verified, and there is nothing else the driver
 * can do from here that would make it true.
 *
 * @param steps   the trip's stops, from `toTripSteps`
 * @param preTrip the pre-trip inspection, from `toPreTripStep`
 * @param loadRef the load's reference (`awb`), used only where a stop came
 *   through without an address of its own
 */
export const toChecklist = (
  steps: TripStep[],
  preTrip?: PreTripStep | null,
  loadRef?: string | null,
): ChecklistRow[] => {
  const rows: ChecklistRow[] = [];
  const load = String(loadRef ?? '').trim();

  if (preTrip) {
    rows.push({
      key: 'pretrip',
      title: 'Pre Trip Inspection',
      detail: preTrip.done ? 'DVIR Passed' : 'Awaiting DVIR',
      time: stepTime(preTrip.at),
      done: preTrip.done,
      // No endpoint clears the inspection from here, so it reports only.
      active: false,
      step: null,
    });
  }

  const where = (step: TripStep): string =>
    step.address || (load && `Load ${load}`) || statusText(step.status) ||
    step.label;

  const stop = (step: TripStep, title: string): ChecklistRow => ({
    key: step.key,
    title,
    detail: where(step),
    // `doneAt` is the procured / completed stamp, and is null until it is.
    time: stepTime(step.doneAt),
    done: step.state === 'done',
    active: step.state === 'active',
    step,
  });

  const pickups = steps.filter(step => step.kind === 'pickup');
  const drops = steps.filter(step => step.kind === 'drop');

  // Collections first, numbered over the whole trip — "Shipment 1",
  // "Shipment 2" — so the checklist counts the stops the driver works through.
  pickups.forEach(step =>
    rows.push(stop(step, `Shipment Procured at Shipment ${step.stopNumber}`)),
  );

  // Then the deliveries, each at its own drop address.
  drops.forEach(step =>
    rows.push(stop(step, `Arrived at Delivery at Shipment ${step.stopNumber}`)),
  );

  return rows;
};

/** The verify sheet's copy, which differs for a pickup and a drop. */
export const verifyCopy = (step: TripStep | null | undefined) => {
  if (!step) return null;
  const drop = step.kind === 'drop';
  return {
    action: drop ? 'VERIFY DROP' : 'VERIFY PICKUP',
    desc: drop
      ? 'Ask the receiver to share OTP to complete the drop'
      : 'Ask the shipper to share OTP to Start the Shipment',
    doneTitle: drop ? 'Shipment Delivered' : 'Shipment Procured',
    doneText: `Ride verified at ${step.label}`,
  };
};

/**
 * Loads the trip's progress and keeps it in state.
 *
 * Called when the map screen opens. `markStopVerified` folds a stop the driver
 * has just cleared with an OTP into the view straight away, rather than waiting
 * for a refetch to show it: the verification is banked locally and merged on
 * top of every payload from then on, so a later refresh — which the backend may
 * not yet reflect — cannot walk a verified stop back to pending.
 *
 * @param shipmentId the trip's shipment; nothing is fetched while it is empty
 */
export function useTripProgress(
  shipmentId?: string | null,
  /**
   * The run as `GET /drivers/shipments/{tripId}` lists it. This is the
   * checklist's roster; `/progress` only says which of these stops are done.
   */
  tripStops?: readonly TripStopTarget[] | null,
) {
  const [progress, setProgress] = useState<TripProgress | null>(null);
  const [loading, setLoading] = useState(Boolean(shipmentId));
  const [error, setError] = useState<string | null>(null);
  // `tripSequence`es verified on this device since the last fetch.
  const [verified, setVerified] = useState<ReadonlySet<number>>(
    () => new Set<number>(),
  );
  // The pre-trip inspection, confirmed on this device since the last fetch.
  const [preTripConfirmed, setPreTripConfirmed] = useState(false);

  const mountedRef = useRef(true);
  const requestRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // A different trip starts from a clean slate — the verifications banked above
  // belong to the trip they were made on.
  useEffect(() => {
    setVerified(new Set<number>());
    setPreTripConfirmed(false);
  }, [shipmentId]);

  const refresh = useCallback(async () => {
    if (!shipmentId) {
      setProgress(null);
      setLoading(false);
      return null;
    }

    const requestId = ++requestRef.current;
    setLoading(true);
    setError(null);

    try {
      const data = await getShipmentProgress({shipmentId});
      if (!mountedRef.current || requestId !== requestRef.current) return data;
      setProgress(data ?? null);
      return data;
    } catch (e) {
      const err = e as AxiosError<ApiErrorBody> & ErrorLike;
      if (mountedRef.current && requestId === requestRef.current) {
        setError(err?.response?.data?.message || err?.message || ERROR);
      }
      return null;
    } finally {
      if (mountedRef.current && requestId === requestRef.current) {
        setLoading(false);
      }
    }
  }, [shipmentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** The driver cleared this stop's OTP: show it as done from now on. */
  const markStopVerified = useCallback((tripSequence?: number | null) => {
    if (!Number.isFinite(tripSequence)) return;
    setVerified(prev => {
      if (prev.has(Number(tripSequence))) return prev;
      const next = new Set(prev);
      next.add(Number(tripSequence));
      return next;
    });
  }, []);

  /** The driver confirmed the inspection: show it as done from now on. */
  const markPreTripDone = useCallback(() => setPreTripConfirmed(true), []);

  const steps = useMemo(
    () => toTripSteps(progress, verified, tripStops),
    [progress, tripStops, verified],
  );
  const preTrip = useMemo(
    () => toPreTripStep(progress, preTripConfirmed),
    [preTripConfirmed, progress],
  );
  const active = useMemo(() => activeStep(steps), [steps]);
  const lastDone = useMemo(() => lastDoneStep(steps), [steps]);

  return {
    progress,
    steps,
    preTrip,
    /** The stop being driven to, or null once every stop is cleared. */
    activeStep: active,
    lastDoneStep: lastDone,
    loading,
    error,
    refresh,
    markStopVerified,
    markPreTripDone,
  };
}
