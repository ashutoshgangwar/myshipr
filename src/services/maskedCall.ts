/**
 * Placing a masked call: reserve → start → hand the number to the dialer.
 *
 * The driver never dials the contact. `reserve` books a bridge line for the
 * number they picked and answers with a `callNumber`, `start` opens it, and
 * only then is that bridge number given to the phone's own dialer — so the
 * call itself is an ordinary one, made by the OS, with no in-app call UI.
 *
 * Nothing closes the session. `POST /drivers/call/{sessionId}/end` exists but
 * is deliberately not called: the app is never told when a native call
 * finishes, so the backend is left to reap the session itself.
 */

import {useCallback, useRef, useState} from 'react';
import {Linking} from 'react-native';

import {reserveShipmentCall, startDriverCall} from '../config/driverApi';
import type {AxiosError} from 'axios';
import type {ApiErrorBody} from '../types/api';
import type {CallPhoneType, CallTarget} from '../types/call';
import type {ErrorLike, Maybe} from '../types/common';

const FAILED = 'The call could not be connected. Please try again.';

/** Everything a `tel:` URL may legally carry. */
const dialable = (raw: string): string => raw.replace(/[^\d+*#]/g, '');

const reason = (e: unknown): string => {
  const err = e as AxiosError<ApiErrorBody> & ErrorLike;
  return err?.response?.data?.message || err?.message || FAILED;
};

export interface MaskedCall {
  /** Id of the contact being connected, or null when nothing is in flight. */
  connecting: string | null;
  /**
   * Reserves a line for `target`'s `phoneType` and dials it. Answers whether
   * the dialer was actually opened, so a caller can leave the panel up for a
   * retry when it was not.
   */
  placeCall: (target: CallTarget, phoneType: CallPhoneType) => Promise<boolean>;
}

/**
 * @param shipmentId the load the contacts belong to
 * @param onError told why a call could not be placed, for the screen to show
 */
export function useMaskedCall(
  shipmentId: Maybe<string>,
  onError: (message: string) => void,
): MaskedCall {
  const [connecting, setConnecting] = useState<string | null>(null);

  // A second tap while the first is still reserving would book a second line.
  const busyRef = useRef(false);

  const placeCall = useCallback(
    async (target: CallTarget, phoneType: CallPhoneType): Promise<boolean> => {
      if (busyRef.current) return false;
      if (!shipmentId) {
        onError('This trip has no shipment to place a call for.');
        return false;
      }

      busyRef.current = true;
      setConnecting(target.id);

      try {
        const booked = await reserveShipmentCall({
          shipmentId,
          type: target.contactType,
          phoneType,
          sequence: target.sequence,
        });

        const sessionId = String(booked?.sessionId ?? '').trim();
        const fencingToken = String(booked?.fencingToken ?? '').trim();
        const callNumber = dialable(String(booked?.callNumber ?? '').trim());

        if (!sessionId || !fencingToken) {
          throw new Error('The call could not be reserved. Please try again.');
        }
        if (!callNumber) {
          throw new Error('The call was reserved without a number to dial.');
        }

        await startDriverCall({sessionId, fencingToken});
        await Linking.openURL(`tel:${callNumber}`);
        return true;
      } catch (e) {
        onError(reason(e));
        return false;
      } finally {
        busyRef.current = false;
        setConnecting(null);
      }
    },
    [onError, shipmentId],
  );

  return {connecting, placeCall};
}
