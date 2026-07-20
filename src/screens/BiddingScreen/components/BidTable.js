import React from 'react';
import {View, FlatList, ScrollView} from 'react-native';

import styles from '../BiddingScreen.styles';
import HeaderCell from './HeaderCell';
import ListRow from './ListRow';
import {IS_TABLET} from '../../../theme/device';

export default function BidTable({data}) {
  const table = (
    <View style={styles.tableInner}>
      <View style={styles.tableHeader}>
        <HeaderCell label="Load" colStyle={styles.colLoad} sortable />
        <HeaderCell label="Mode" colStyle={styles.colMode} sortable center />
        <HeaderCell label="Pickup Time" colStyle={styles.colPickup} sortable center />
        <HeaderCell label="Drop Time" colStyle={styles.colDrop} sortable center />
        <HeaderCell label="Lowest Bid" colStyle={styles.colLowest} sortable center />
        <View style={styles.colChevron} />
      </View>
      <FlatList
        key="list"
        data={data}
        keyExtractor={b => b.id}
        showsVerticalScrollIndicator={false}
        style={styles.tableList}
        contentContainerStyle={styles.listContent}
        renderItem={({item}) => <ListRow item={item} />}
      />
    </View>
  );

  return (
    <View style={styles.tableWrap}>
      {/* Tablet: the table fits the width, render directly. Phone: fixed
          column widths that are wider than the screen, so scroll L/R. */}
      {IS_TABLET ? (
        table
      ) : (
        <ScrollView
          horizontal
          bounces={false}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          style={styles.tableScroll}
          contentContainerStyle={styles.tableScrollContent}>
          {table}
        </ScrollView>
      )}
    </View>
  );
}
