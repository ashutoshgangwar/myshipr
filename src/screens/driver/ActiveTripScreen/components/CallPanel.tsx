import React, {useCallback, useState} from 'react';
import {View, ScrollView, TouchableOpacity, ActivityIndicator} from 'react-native';
import {moderateScale as ms} from 'react-native-size-matters';
import AppText from '../../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';
import {colors} from '../../../../theme/colors';
import PanelShell from './PanelShell';
import CallIcon from '../../../../assets/svg_icon/call_Icon_black.svg';
import CallNumberSheet from './CallNumberSheet';
import {useShipmentCallContacts} from '../../../../services/shipmentCall';
import type {CallPhoneType, CallTarget} from '../../../../types/call';

function CallButton({
  target,
  connecting,
  onCall,
}: {
  target: CallTarget;
  /** This row's line is being reserved — the only sign the tap registered. */
  connecting: boolean;
  onCall: (target: CallTarget) => void;
}) {
  return (
    <TouchableOpacity
      style={styles.callRowBtn}
      onPress={() => onCall(target)}
      disabled={connecting}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Call ${target.name}`}>
      {connecting ? (
        <ActivityIndicator size="small" color={colors.white} />
      ) : (
        <CallIcon width={ms(15)} height={ms(15)} color={colors.white} />
      )}
    </TouchableOpacity>
  );
}

function ContactRow({
  target,
  connecting,
  onCall,
}: {
  target: CallTarget;
  connecting: boolean;
  onCall: (target: CallTarget) => void;
}) {
  return (
    <View style={styles.callRow}>
      <View style={styles.callRowTop}>
        <AppText style={styles.callRowName} numberOfLines={1}>
          {target.name}
        </AppText>
        <AppText style={styles.callRowRole} numberOfLines={1}>
          {target.role}
        </AppText>
        <CallButton target={target} connecting={connecting} onCall={onCall} />
      </View>

      {/* Both numbers are on show, but there is only ever one button — which
          of them it rings is asked after the tap. */}
      {/* {target.numbers.map(number => (
        <AppText
          key={number.phoneType}
          style={styles.callRowPhone}
          numberOfLines={1}>
          {`${number.label} · ${number.phone}`}
        </AppText>
      ))} */}
    </View>
  );
}

/**
 * "Call" card opened from the phone button in the side toolbar.
 *
 * The list is the load's own — `GET /drivers/shipments/{id}/call-contacts`,
 * read when the panel mounts. Each contact is one row with one call button,
 * however many numbers they have: a contact with both a primary and an
 * alternate is asked which to ring after the tap, defaulting to the primary,
 * because the two are separate reservations.
 *
 * The chosen pair goes up to `onCall`, which books a bridge line and hands
 * that number to the phone's own dialer — the call is an ordinary one, and
 * the driver is never shown the other party's real number.
 */
export interface CallPanelProps {
  /** The load the contacts belong to. Without one the panel has nothing to show. */
  shipmentId?: string | null;
  onClose?: () => void;
  /** Id of the contact whose line is being reserved, if any. */
  connectingId?: string | null;
  /** The contact and the number chosen for them — what `reserve` is keyed on. */
  onCall?: (target: CallTarget, phoneType: CallPhoneType) => void;
}

export default function CallPanel({
  shipmentId,
  onClose,
  connectingId,
  onCall,
}: CallPanelProps) {
  const {groups, loading, error} = useShipmentCallContacts(shipmentId);
  // The contact whose number is being chosen, or null with the sheet closed.
  const [picking, setPicking] = useState<CallTarget | null>(null);

  // One number is not a choice — it is rung without asking. Two opens the
  // picker, which lands on the primary.
  const handleRowPress = useCallback(
    (target: CallTarget) => {
      if (target.numbers.length > 1) {
        setPicking(target);
        return;
      }
      onCall?.(target, target.numbers[0].phoneType);
    },
    [onCall],
  );

  const handlePicked = useCallback(
    (target: CallTarget, phoneType: CallPhoneType) => {
      setPicking(null);
      onCall?.(target, phoneType);
    },
    [onCall],
  );

  // The fetch's own failure is reported as sent; a panel opened without a
  // shipment would otherwise show the hook's internal "no shipment was
  // selected" rejection, which says nothing to a driver.
  const message = shipmentId
    ? error
    : 'This trip has no shipment to look contacts up for.';

  return (
    <PanelShell
      title="Call"
      subtitle="Choose who to call for this trip"
      onClose={onClose}
      wrapStyle={styles.callPanelWrap}>
      <ScrollView
        style={styles.callBody}
        contentContainerStyle={styles.callBodyContent}
        showsVerticalScrollIndicator={false}>
        {loading && !groups.length ? (
          <View style={styles.callStateBox}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : message ? (
          <View style={styles.callStateBox}>
            <AppText style={styles.callStateText}>{message}</AppText>
          </View>
        ) : !groups.length ? (
          <View style={styles.callStateBox}>
            <AppText style={styles.callStateText}>
              No contacts on this trip.
            </AppText>
          </View>
        ) : (
          groups.map(group => (
            <View key={group.id}>
              <View style={styles.callGroupHeader}>
                <View
                  style={[
                    styles.callGroupBadge,
                    group.kind === 'drop' && styles.callGroupBadgeDrop,
                  ]}>
                  <AppText style={styles.callGroupBadgeText}>{group.badge}</AppText>
                </View>
                <AppText style={styles.callGroupLabel} numberOfLines={1}>
                  {group.label}
                </AppText>
              </View>

              {group.targets.map(target => (
                <ContactRow
                  key={target.id}
                  target={target}
                  connecting={connectingId === target.id}
                  onCall={handleRowPress}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <CallNumberSheet
        target={picking}
        onCancel={() => setPicking(null)}
        onConfirm={handlePicked}
      />
    </PanelShell>
  );
}
