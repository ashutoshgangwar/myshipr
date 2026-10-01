import React, {useEffect, useState} from 'react';
import {View, Modal, TouchableOpacity, TouchableWithoutFeedback} from 'react-native';
import {moderateScale as ms} from 'react-native-size-matters';

import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';
import {colors} from '../../../theme/colors';
import CallIcon from '../../../assets/svg_icon/call_Icon_black.svg';
import type {CallPhoneType, CallTarget} from '../../../types/call';

/**
 * Which of a contact's two numbers to ring.
 *
 * Opened by the Call panel's phone button when the payload gave the contact
 * both a primary and an alternate — the two are separate reservations, so the
 * choice has to be made before `reserve` is sent, not after. A contact with
 * one number never reaches here; the panel rings it straight away.
 *
 * The primary is preselected every time the sheet opens, including on a second
 * contact after the driver picked the alternate for the first.
 */
export interface CallNumberSheetProps {
  /** The contact being called, or null when the sheet is closed. */
  target: CallTarget | null;
  onCancel: () => void;
  onConfirm: (target: CallTarget, phoneType: CallPhoneType) => void;
}

export default function CallNumberSheet({
  target,
  onCancel,
  onConfirm,
}: CallNumberSheetProps) {
  const [selected, setSelected] = useState<CallPhoneType>('PRIMARY');

  // Back to the primary each time a new contact is opened, so the sheet never
  // arrives on a choice made for somebody else.
  useEffect(() => {
    if (target) setSelected('PRIMARY');
  }, [target]);

  if (!target) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.callSheetBackdrop} />
      </TouchableWithoutFeedback>

      <View style={styles.callSheetWrap} pointerEvents="box-none">
        <View style={styles.callSheet}>
          <AppText style={styles.callSheetTitle} numberOfLines={1}>
            {target.name}
          </AppText>
          <AppText style={styles.callSheetSubtitle}>
            Choose a number to call
          </AppText>

          {target.numbers.map(number => {
            const active = number.phoneType === selected;
            return (
              <TouchableOpacity
                key={number.phoneType}
                style={[
                  styles.callSheetOption,
                  active && styles.callSheetOptionActive,
                ]}
                onPress={() => setSelected(number.phoneType)}
                activeOpacity={0.85}
                accessibilityRole="radio"
                accessibilityState={{selected: active}}>
                <View
                  style={[styles.callSheetRadio, active && styles.callSheetRadioOn]}>
                  {active && <View style={styles.callSheetRadioDot} />}
                </View>
                <View style={styles.callSheetOptionTexts}>
                  <AppText style={styles.callSheetOptionLabel}>
                    {number.label}
                  </AppText>
                  <AppText style={styles.callSheetOptionPhone} numberOfLines={1}>
                    {number.phone}
                  </AppText>
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={styles.callSheetActions}>
            <TouchableOpacity
              style={styles.callSheetCancel}
              onPress={onCancel}
              activeOpacity={0.8}>
              <AppText style={styles.callSheetCancelText}>Cancel</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callSheetConfirm}
              onPress={() => onConfirm(target, selected)}
              activeOpacity={0.85}>
              <CallIcon width={ms(15)} height={ms(15)} color={colors.white} />
              <AppText style={styles.callSheetConfirmText}>Call</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
