import React from 'react';
import {View} from 'react-native';
import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';
import PanelShell from './PanelShell';
import usePanelExpand from '../hooks/usePanelExpand';

export default function BiddingPanel({onClose, children, onExpandedChange}) {
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
