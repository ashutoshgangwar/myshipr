import React, {useRef} from 'react';
import {View, ScrollView, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';

import styles, {rowHeight} from '../BiddingScreen.styles';
import {COLUMNS} from '../constants';
import HeaderCell from './HeaderCell';
import DataRow from './DataRow';
import StopList from './StopList';

/* The Load column is frozen: it lives outside the horizontal scroller, so the
   remaining columns slide left/right underneath their own headers. The header
   strip is a non-interactive ScrollView driven from the body's scroll offset,
   which keeps labels above their columns without a second gesture handler. */
export default function BidTable({data}) {
  const navigation = useNavigation();
  const headRef = useRef(null);

  const syncHeader = e =>
    headRef.current?.scrollTo({
      x: e.nativeEvent.contentOffset.x,
      animated: false,
    });

  return (
    <View style={styles.tableWrap}>
      {/* ---------- Header ---------- */}
      <View style={styles.tableHeaderRow}>
        <View style={styles.frozenHead}>
          <HeaderCell label="Location" sortable center />
        </View>
        <ScrollView
          ref={headRef}
          horizontal
          scrollEnabled={false}
          style={styles.hScroll}
          showsHorizontalScrollIndicator={false}>
          <View style={[styles.tableHeader, styles.scrollCells]}>
            {COLUMNS.map(c => (
              <HeaderCell
                key={c.key}
                label={c.label}
                colStyle={[{width: c.width}, c.shaded && styles.shadedColHead]}
                sortable={c.sortable}
                center
              />
            ))}
          </View>
        </ScrollView>
      </View>

      {/* ---------- Body ---------- */}
      <ScrollView style={styles.tableBody} showsVerticalScrollIndicator={false}>
        <View style={styles.tableBodyRow}>
          {/* frozen Load column */}
          <View style={styles.frozenCol}>
            {data.map(item => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                style={[styles.loadCell, {height: rowHeight(item.stops.length)}]}
                onPress={() => navigation.navigate('ActiveBidding', {item})}>
                <StopList stops={item.stops} />
              </TouchableOpacity>
            ))}
          </View>

          {/* scrolling columns */}
          <ScrollView
            horizontal
            onScroll={syncHeader}
            scrollEventThrottle={16}
            style={styles.hScroll}
            showsHorizontalScrollIndicator={false}>
            <View style={styles.scrollCells}>
              <View>
                {data.map(item => (
                  <DataRow
                    key={item.id}
                    item={item}
                    height={rowHeight(item.stops.length)}
                  />
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}
