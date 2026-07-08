import React from 'react';
import {View} from 'react-native';

import styles from '../BiddingScreen.styles';
import {SORT_ICON} from '../constants';
import AppText from '../../../theme/AppText';
import Both_direction_Icon from '../../../assets/svg_icon/both_direction.svg';

export default function HeaderCell({label, colStyle, sortable, center}) {
  return (
    <View style={[styles.thCell, colStyle, center && styles.thCellCenter]}>
      {/* No adjustsFontSizeToFit — every header renders at the same fixed size;
          the columns are sized wide enough to fit each label on one line. */}
      <AppText style={styles.thText} numberOfLines={1}>
        {label}
      </AppText>
      {sortable ? (
        <Both_direction_Icon
          width={SORT_ICON}
          height={SORT_ICON}
          style={styles.thSortIcon}
        />
      ) : null}
    </View>
  );
}
