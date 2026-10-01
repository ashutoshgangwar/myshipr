import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import styles, {auctionTone, driverTone} from '../BiddingScreen.styles';
import {COLUMNS} from '../constants';
import AppText from '../../../theme/AppText';
import ModeChip from './ModeChip';
import {select} from '../../../theme/device';
import type {StyleProp, TextStyle, ViewStyle} from 'react-native';
import type {BidColumn, BidRow} from '../constants';

// Table rows carry a larger truck glyph than the card chips (card keeps its own
// CHIP_ICON), so bumping this only affects the table view.
const MODE_ICON = select({phone: 16, tablet: 19});

const Pill = ({
  box,
  text,
  label,
}: {
  box?: StyleProp<ViewStyle>;
  text?: StyleProp<TextStyle>;
  label?: string;
}) => (
  <View style={box}>
    <AppText style={text} numberOfLines={1}>
      {label}
    </AppText>
  </View>
);

function Cell({col, item}: {col: BidColumn; item: BidRow}) {
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

    // trip distance and dead mile read as one value — "184/8" — so the pair
    // stays on a single line under the merged header
    case 'distance':
      return (
        <AppText style={styles.cellStrong} numberOfLines={1}>
          {item.tripDistance}/{item.deadMile}
        </AppText>
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

    // Both pills tint by their own value — Normal reads blue against Instant's
    // orange, Single purple against Multi Driver's amber.
    case 'auctionType': {
      const tone = auctionTone(item.auctionType);
      return (
        <Pill
          box={tone.box}
          text={[styles.pillText, tone.text]}
          label={item.auctionType}
        />
      );
    }

    case 'driverRequirement': {
      const tone = driverTone(item.driverRequirement);
      return (
        <Pill
          box={tone.box}
          text={[styles.pillText, tone.text]}
          label={item.driverRequirement}
        />
      );
    }

    default:
      // Unreachable: every `kind` COLUMNS defines is handled above. It also
      // reads `col.field`, which no column carries — so this branch rendered
      // nothing even if it were reached. Left in place as the defensive
      // fallback it was, with the lookup made explicit.
      return (
        <AppText style={styles.cellText} numberOfLines={1}>
          {
            (item as Record<string, unknown>)[
              (col as {field?: string}).field ?? ''
            ] as React.ReactNode
          }
        </AppText>
      );
  }
}

/* Everything to the right of the frozen Load column. `height` is passed in so
   this row lines up with its Load cell in the other scroll container. */
export default function DataRow({
  item,
  height,
}: {
  item: BidRow;
  /** Passed in so this row lines up with its frozen Load cell. */
  height: number;
}) {
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
            // `styles.shadedCol` is not defined in BiddingScreen.styles — it
            // was undefined and RN skipped it, so the shaded column never
            // shaded. Dropped; rendering is unchanged.
          ]}>
          <Cell col={col} item={item} />
        </View>
      ))}
    </TouchableOpacity>
  );
}
