/**
 * The Call panel's data: `call-contacts` → the grouped list it draws.
 *
 * The endpoint answers in two shapes. A single pickup/drop load sends a
 * `senderContact` and a `receiverContact` with no stops at all; a multi-stop
 * one sends a `stops` array, each entry naming its `stopType` and carrying its
 * own contact. Both fold into the same list here, so the panel renders one
 * shape and the reserve call is keyed the same way either way.
 *
 * A contact with two numbers becomes two rows, not one — each number is its
 * own reservation, told apart by `phoneType`.
 */

import {useMemo} from 'react';

import {getShipmentCallContacts} from '../config/driverApi';
import {TTL, useCachedResource} from './resourceCache';
import type {
  CallContactPayload,
  CallContactStop,
  CallContactsPayload,
  CallContactType,
  CallNumber,
  CallTarget,
  CallTargetGroup,
} from '../types/call';
import type {AsyncResource, Maybe} from '../types/common';

const ERROR = 'Could not load the contacts for this trip.';

/** What a row says when the payload named nobody. */
const UNNAMED = 'Contact';

/** The stop types the payload uses for a delivery. */
const isDropStop = (type: Maybe<string>): boolean =>
  /DROP|DELIVER/i.test(String(type ?? ''));

const bySequence = (a: CallContactStop, b: CallContactStop): number =>
  (a?.sequence ?? 0) - (b?.sequence ?? 0);

/** A number the payload actually carried, trimmed; empty means "not sent". */
const phone = (raw: Maybe<string>): string => String(raw ?? '').trim();

/**
 * One contact → the single row they produce, carrying every number they gave.
 *
 * A list rather than one value so a contact the payload could not make
 * callable folds away to nothing at the call site.
 *
 * @param contact the person, as the payload sent them
 * @param contactType which end of the shipment they stand on
 * @param role the label beside their name — "Shipper" / "Receiver"
 * @param id the row's key, unique across stops
 * @param sequence the stop they sit on, on a multi-stop load
 */
const toTargets = (
  contact: Maybe<CallContactPayload>,
  contactType: CallContactType,
  role: string,
  id: string,
  sequence?: Maybe<number>,
): CallTarget[] => {
  if (!contact) return [];

  // Primary first: it is what the picker preselects, and on a contact with
  // only one number it is the one the tap rings without asking.
  const numbers: CallNumber[] = [
    {phoneType: 'PRIMARY', label: 'Primary', phone: phone(contact.primaryPhone)},
    {
      phoneType: 'ALTERNATE',
      label: 'Alternate',
      phone: phone(contact.alternatePhone),
    },
  ].filter((entry): entry is CallNumber => Boolean(entry.phone));

  // A contact the payload gave no number for is dropped rather than listed
  // behind a button that could only reserve a line to nowhere.
  if (!numbers.length) return [];

  return [
    {
      id,
      name: String(contact.fullName ?? '').trim() || UNNAMED,
      role,
      contactType,
      numbers,
      sequence: sequence ?? undefined,
    },
  ];
};

/**
 * The payload → the panel's groups, in the order the driver works the stops.
 *
 * Pickups and drops are badged in separate series (P1, P2 … D1, D2) so the
 * badge reads as "the second pickup" rather than "the fourth stop". Groups
 * that ended up with no callable number are dropped: a stop header with
 * nothing under it is worse than no header.
 *
 * @param payload the body of `GET /drivers/shipments/{id}/call-contacts`
 */
export const toCallGroups = (
  payload: Maybe<CallContactsPayload>,
): CallTargetGroup[] => {
  const stops = Array.isArray(payload?.stops) ? [...payload.stops] : [];

  // Multi-stop: every stop is its own group, worked in sequence order.
  if (stops.length) {
    let pickups = 0;
    let drops = 0;

    return stops
      .sort(bySequence)
      .map((stop, index) => {
        const drop = isDropStop(stop?.stopType);
        const number = drop ? ++drops : ++pickups;
        const sequence = Number.isFinite(Number(stop?.sequence))
          ? Number(stop.sequence)
          : undefined;

        return {
          id: `stop-${sequence ?? index}`,
          badge: `${drop ? 'D' : 'P'}${number}`,
          kind: drop ? ('drop' as const) : ('pickup' as const),
          label: `${drop ? 'Delivery' : 'Pickup'}${
            sequence != null ? ` · Stop ${sequence}` : ''
          }`,
          targets: toTargets(
            stop?.contact,
            drop ? 'RECEIVER' : 'SENDER',
            drop ? 'Receiver' : 'Shipper',
            `stop-${sequence ?? index}`,
            sequence,
          ),
        };
      })
      .filter(group => group.targets.length > 0);
  }

  // Single pickup/drop: the two named contacts, and no sequence to send —
  // the endpoint resolves the stop from the contact type alone.
  return [
    {
      id: 'sender',
      badge: 'P1',
      kind: 'pickup' as const,
      label: 'Pickup',
      targets: toTargets(payload?.senderContact, 'SENDER', 'Shipper', 'sender'),
    },
    {
      id: 'receiver',
      badge: 'D1',
      kind: 'drop' as const,
      label: 'Delivery',
      targets: toTargets(
        payload?.receiverContact,
        'RECEIVER',
        'Receiver',
        'receiver',
      ),
    },
  ].filter(group => group.targets.length > 0);
};

/**
 * Loads the load's contacts and keeps the payload in state.
 *
 * Fetched when the Call panel mounts, which is what the reserve call needs to
 * have in hand before a row can be tapped.
 *
 * @param shipmentId the trip's shipment id; nothing is fetched without one
 */
export function useShipmentCallContacts(
  shipmentId: Maybe<string>,
): AsyncResource<CallContactsPayload> & {groups: CallTargetGroup[]} {
  const fetcher = useMemo(
    () => () =>
      shipmentId
        ? getShipmentCallContacts({shipmentId})
        : Promise.reject(new Error('No shipment was selected.')),
    [shipmentId],
  );

  const resource = useCachedResource<CallContactsPayload>(
    `shipment-call:${shipmentId ?? ''}`,
    fetcher,
    {ttl: TTL.DETAIL, message: ERROR},
  );
  const groups = useMemo(() => toCallGroups(resource.data), [resource.data]);

  return {...resource, groups};
}
