import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import styles from '../BiddingScreen.styles';
import {COLUMNS} from '../constants';
import AppText from '../../../theme/AppText';
import ModeChip from './ModeChip';
import {select} from '../../../theme/device';
import Right_arrow_Frame from '../../../assets/svg_icon/right_arrow_Frame.svg';

// Table rows carry a larger truck glyph than the card chips (card keeps its own
// CHIP_ICON), so bumping this only affects the table view.
const MODE_ICON = select({phone: 16, tablet: 19});

const Pill = ({box, text, label}) => (
  <View style={box}>
    <AppText style={text} numberOfLines={1}>
      {label}
    </AppText>
  </View>
);

function Cell({col, item}) {
  switch (col.kind) {
    case 'mode':
      return <ModeChip mode={item.mode} iconSize={MODE_ICON} />;

    case 'pickup':
      return (
        <>
          <AppText style={styles.cellStrong} numberOfLines={1}>
            {item.pickupTime}
          </AppText>
          <AppText style={styles.cellMuted} numberOfLines={1}>
            {item.pickupDate}
          </AppText>
        </>
      );

    case 'drop':
      return (
        <>
          <AppText style={styles.cellStrong} numberOfLines={1}>
            {item.dropTime}
          </AppText>
          <AppText style={styles.cellMuted} numberOfLines={1}>
            {item.dropDate}
          </AppText>
        </>
      );

    case 'lowest':
      return (
        <>
          <AppText style={styles.lowestBidValue} numberOfLines={1}>
            {item.lowestBid}
          </AppText>
          <AppText style={styles.lowestBidRank} numberOfLines={1}>
            {item.status === 'Closed' ? 'Closed' : item.rank || '-'}
          </AppText>
        </>
      );

    case 'chevron':
      return <Right_arrow_Frame width={14} height={14} />;

    case 'auctionMode':
      return (
        <AppText
          numberOfLines={1}
          style={[
            styles.auctionModeText,
            item.auctionMode !== 'Original' && styles.auctionModeExt,
          ]}>
          {item.auctionMode}
        </AppText>
      );

    case 'pillSoft':
      return (
        <Pill box={styles.pillSoft} text={styles.pillSoftText} label={item[col.field]} />
      );

    case 'pillOutline':
      return (
        <Pill
          box={styles.pillOutline}
          text={styles.pillOutlineText}
          label={item[col.field]}
        />
      );

    case 'pillBlue':
      return (
        <Pill box={styles.pillBlue} text={styles.pillBlueText} label={item[col.field]} />
      );

    default:
      return (
        <AppText style={styles.cellText} numberOfLines={1}>
          {item[col.field]}
        </AppText>
      );
  }
}

/* Everything to the right of the frozen Load column. `height` is passed in so
   this row lines up with its Load cell in the other scroll container. */
export default function DataRow({item, height}) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.dataRow, {height}]}
      onPress={() => navigation.navigate('ActiveBidding', {item})}>
      {COLUMNS.map(col => (
        <View
          key={col.key}
          style={[
            styles.dataCell,
            {width: col.width},
            col.shaded && styles.shadedCol,
          ]}>
          <Cell col={col} item={item} />
        </View>
      ))}
    </TouchableOpacity>
  );
}
