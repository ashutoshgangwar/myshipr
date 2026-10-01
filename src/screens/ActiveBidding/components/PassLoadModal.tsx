import React from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';

import AppText from '../../../theme/AppText';
import styles from '../ActiveBidding.styles';

/**
 * "Pass on this load?" confirm, opened from Withdraw My Bids. Passing pulls
 * every bid placed on the load and switches auto-bid off.
 */
export interface PassLoadModalProps {
  visible?: boolean;
  /** Sub-heading under the title, e.g. "FTL 10009 • San Jose, CA → Newark, NJ". */
  subtitle?: string;
  onClose?: () => void;
  onPass?: () => void;
}

export default function PassLoadModal({
  visible,
  subtitle,
  onClose,
  onPass,
}: PassLoadModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.passCard}>
              <View style={styles.passHeader}>
                <View style={styles.passHeaderText}>
                  <AppText style={styles.passTitle}>Pass on this load?</AppText>
                  {subtitle ? (
                    <AppText style={styles.passSubtitle} numberOfLines={1}>
                      {subtitle}
                    </AppText>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={styles.passCloseBtn}
                  onPress={onClose}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <AppText style={styles.passCloseText}>×</AppText>
                </TouchableOpacity>
              </View>

              <AppText style={styles.passBody}>
                All of the bids that you have placed would be withdrawn and Auto
                - bid will be turned off.
              </AppText>

              <View style={styles.passActions}>
                <TouchableOpacity
                  style={styles.passBtn}
                  activeOpacity={0.85}
                  onPress={onPass}>
                  <AppText style={styles.passBtnText}>
                    Pass on this load
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.keepBtn}
                  activeOpacity={0.85}
                  onPress={onClose}>
                  <AppText style={styles.keepBtnText}>KEEP BIDDING</AppText>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
