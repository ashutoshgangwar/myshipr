import React from 'react';
import {View} from 'react-native';
import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';
import PanelShell from './PanelShell';

export default function BiddingPanel({onClose, children}) {
  return (
    <PanelShell title="Bidding" onClose={onClose} wrapStyle={styles.biddingPanelWrap}>
      <View style={styles.biddingBody}>
        {children || <AppText style={styles.biddingText}>bidding</AppText>}
      </View>
    </PanelShell>
  );
}
