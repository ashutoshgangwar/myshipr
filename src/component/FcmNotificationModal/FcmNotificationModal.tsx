import React from 'react';
import {Modal, View, TouchableOpacity} from 'react-native';
import {moderateScale} from 'react-native-size-matters';

import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import {NOTIF_TYPE} from '../../screens/NotificationScreen/constants';
import styles from './FcmNotificationModal.styles';

import TruckIcon from '../../assets/svg_icon/Truck_Frame.svg';
import BiddingIcon from '../../assets/svg_icon/Bidding_Icon.svg';
import EarningIcon from '../../assets/svg_icon/earning_sign.svg';
import TimeIcon from '../../assets/svg_icon/Time_Icon.svg';
import InfoIcon from '../../assets/svg_icon/Info_Icon.svg';
import type {AppNotification} from '../../services/FirebaseMessagingService';

const BADGE_ICON = moderateScale(20);

// Same taxonomy and tints as the rows in NotificationScreen, so a push that
// arrives in the foreground looks like the entry the user finds in the list
// afterwards. Keyed by the `type` the backend puts in the FCM data payload.
const TYPE_BADGE = {
  [NOTIF_TYPE.BID]: {
    Icon: BiddingIcon,
    tint: '#FFF1E0',
    // Bidding_Icon draws with currentColor, so it takes the accent directly.
    color: colors.button_color,
  },
  [NOTIF_TYPE.LOAD]: {Icon: TruckIcon, tint: '#E8F3FF'},
  [NOTIF_TYPE.PAYMENT]: {Icon: EarningIcon, tint: '#E4FBF3'},
  [NOTIF_TYPE.HOS]: {Icon: TimeIcon, tint: colors.gray400},
  [NOTIF_TYPE.SYSTEM]: {Icon: InfoIcon, tint: colors.gray400},
};

/**
 * In-app modal for a push that arrived while the app was in the FOREGROUND.
 *
 * iOS and Android both suppress the system banner in that state, so without
 * this the driver never sees the message until they open the notifications
 * list. Background and quit-state pushes are drawn by the OS and must NOT be
 * routed here.
 *
 * @param {object}   props
 * @param {boolean}  props.visible
 * @param {object}   [props.notification] normalised `{title, body, type, data}`
 * @param {Function} props.onClose   dismiss without acting
 * @param {Function} [props.onView]  open the notification's destination; the
 *                                   primary button is hidden when omitted
 * @param {string}   [props.viewText]
 */
export interface FcmNotificationModalProps {
  visible?: boolean;
  /** The push, already flattened by `normalizeRemoteMessage`. */
  notification?: AppNotification | null;
  onClose?: () => void;
  onView?: () => void;
  viewText?: string;
}

const FcmNotificationModal = ({
  visible,
  notification,
  onClose,
  onView,
  viewText = 'View',
}: FcmNotificationModalProps) => {
  const badge =
    TYPE_BADGE[notification?.type ?? NOTIF_TYPE.SYSTEM] ??
    TYPE_BADGE[NOTIF_TYPE.SYSTEM];
  const {Icon} = badge;

  // A data-only push can legitimately carry no title/body, and an empty card
  // would just confuse the driver — fall back to something meaningful.
  const title = notification?.title || 'New notification';
  const body = notification?.body;

  return (
    <Modal
      visible={Boolean(visible)}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headRow}>
            <View style={[styles.badge, {backgroundColor: badge.tint}]}>
              <Icon
                width={BADGE_ICON}
                height={BADGE_ICON}
                color={badge.color}
              />
            </View>

            <View style={styles.headText}>
              <AppText style={styles.title}>{title}</AppText>
              <AppText style={styles.time}>Just now</AppText>
            </View>
          </View>

          {Boolean(body) && <AppText style={styles.message}>{body}</AppText>}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onClose}>
              <AppText style={styles.secondaryText}>Dismiss</AppText>
            </TouchableOpacity>

            {typeof onView === 'function' && (
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={onView}>
                <AppText style={styles.primaryText}>{viewText}</AppText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default FcmNotificationModal;
