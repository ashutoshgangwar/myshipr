import React from 'react';
import {View} from 'react-native';
import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';
import PanelShell from './PanelShell';
import usePanelExpand from '../hooks/usePanelExpand';

export interface BiddingPanelProps {
  onClose?: () => void;
  children?: React.ReactNode;
  /** Lets the screen follow the stretch toggle (for the status bar tint). */
  onExpandedChange?: (expanded: boolean) => void;
}

export default function BiddingPanel({
  onClose,
  children,
  onExpandedChange,
}: BiddingPanelProps) {
  const {expanded, shellProps} = usePanelExpand(
    styles.biddingPanelWrap,
    onExpandedChange,
  );

  return (
    <PanelShell title="Bidding" onClose={onClose} {...shellProps}>
      <View
        style={[
          styles.biddingBody,
          expanded ? styles.biddingBodyFullscreen : styles.biddingBodyDocked,
        ]}>
        {children || <AppText style={styles.biddingText}>bidding</AppText>}
      </View>
    </PanelShell>
  );
}
