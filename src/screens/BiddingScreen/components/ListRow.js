import React from 'react';
import {View, TouchableOpacity} from 'react-native';

import styles from '../BiddingScreen.styles';
import ModeChip from './ModeChip';
import AppText from '../../../theme/AppText';
import Right_arrow_Frame from '../../../assets/svg_icon/right_arrow_Frame.svg';

export default function ListRow({item}) {
  return (
    <TouchableOpacity style={styles.tableRow} activeOpacity={0.85}>
      {/* Load */}
      <View style={styles.colLoad}>
        <View style={styles.loadHeadRow}>
          <View style={styles.greenDot} />
          <View style={styles.loadTextWrap}>
            <AppText style={styles.loadRoute} numberOfLines={1}>
              {item.origin}
            </AppText>
            <AppText style={styles.loadRouteDest} numberOfLines={1}>
              <AppText style={styles.arrowSmall}>→ </AppText>
              {item.dest}
            </AppText>
          </View>
        </View>
        <View style={styles.bidsBadge}>
          <AppText style={styles.bidsBadgeText}>{item.bids} BIDS</AppText>
        </View>
      </View>

      {/* Mode */}
      <View style={styles.colMode}>
        <ModeChip mode={item.mode} />
      </View>

      {/* Pickup Time */}
      <View style={styles.colPickup}>
        <AppText style={styles.cellStrong} numberOfLines={1}>
          {item.pickupTime}
        </AppText>
        <AppText style={styles.cellMuted} numberOfLines={1}>
          {item.pickupDate}
        </AppText>
      </View>

      {/* Indicative */}
      <View style={styles.colIndicative}>
        <AppText style={styles.indicativeValue} numberOfLines={1}>
          {item.indicative}
        </AppText>
      </View>

      {/* Lowest Bid */}
      <View style={styles.colLowest}>
        <AppText style={styles.lowestBidValue} numberOfLines={1}>
          {item.lowestBid}
        </AppText>
        <AppText style={styles.lowestBidRank} numberOfLines={1}>
          {item.rank || '-'}
        </AppText>
      </View>

      {/* Chevron */}
      <View style={styles.colChevron}>
        <Right_arrow_Frame width={14} height={14} />
      </View>
    </TouchableOpacity>
  );
}
