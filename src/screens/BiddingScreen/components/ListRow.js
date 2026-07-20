import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import styles from '../BiddingScreen.styles';
import ModeChip from './ModeChip';
import StopList from './StopList';
import AppText from '../../../theme/AppText';
import Right_arrow_Frame from '../../../assets/svg_icon/right_arrow_Frame.svg';

export default function ListRow({item}) {
  const navigation = useNavigation();
  const closed = item.status === 'Closed';

  return (
    <TouchableOpacity
      style={styles.tableRow}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('ActiveBidding', {item})}>
      {/* Load — one line per stop */}
      <View style={styles.colLoad}>
        <StopList stops={item.stops} />
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

      {/* Drop Time */}
      <View style={styles.colDrop}>
        <AppText style={styles.cellStrong} numberOfLines={1}>
          {item.dropTime}
        </AppText>
        <AppText style={styles.cellMuted} numberOfLines={1}>
          {item.dropDate}
        </AppText>
      </View>

      {/* Lowest Bid — past auctions show "Closed" instead of a live rank */}
      <View style={styles.colLowest}>
        <AppText style={styles.lowestBidValue} numberOfLines={1}>
          {item.lowestBid}
        </AppText>
        <AppText style={styles.lowestBidRank} numberOfLines={1}>
          {closed ? 'Closed' : item.rank || '-'}
        </AppText>
      </View>

      {/* Chevron */}
      <View style={styles.colChevron}>
        <Right_arrow_Frame width={14} height={14} />
      </View>
    </TouchableOpacity>
  );
}
