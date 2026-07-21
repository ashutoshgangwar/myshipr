import React, {useMemo, useState} from 'react';
import {View, FlatList, Platform} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import styles, {GRID_COLS} from './BiddingScreen.styles';
import {BIDS, BUCKETS, STATS, ms, vs} from './constants';
import FilterRow from './components/FilterRow';
import BidTable from './components/BidTable';
import GridCard from './components/GridCard';
import StatusBar from '../../component/StatusBar/StatusBar';
import DashboardHeader from '../../component/DashboardHeader/DashboardHeader';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import {IS_TABLET, select} from '../../theme/device';

import BiddingIcon from '../../assets/svg_icon/Bidding_Icon.svg';

export default function BiddingScreen() {
  const [mode, setMode] = useState('All Modes');
  const [search, setSearch] = useState('');
  const [grid, setGrid] = useState(false);
  // which header card is driving the list — defaults to Currently Leading
  const [bucket, setBucket] = useState(BUCKETS.leading);
  const [sort, setSort] = useState(null);

  const data = useMemo(() => {
    let list = BIDS.filter(b => b.categories.includes(bucket));
    if (mode !== 'All Modes') {
      list = list.filter(b => b.mode === mode);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        b =>
          b.stops.some(s => s.city.toLowerCase().includes(q)) ||
          b.ref.toLowerCase().includes(q),
      );
    }
    if (sort) {
      const by = {
        pickup: b => b.pickupTime,
        lowest: b => Number(String(b.lowestBid).replace(/[^0-9.]/g, '')) || 0,
        stops: b => b.stops.length,
      }[sort];
      list = [...list].sort((a, b) => (by(a) > by(b) ? 1 : by(a) < by(b) ? -1 : 0));
    }
    return list;
  }, [bucket, mode, search, sort]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar
        backgroundColor={colors.primary}
        barStyle="light-content"
        translucent={false}
      />

      {/* HEADER */}
      <DashboardHeader
        icon={<BiddingIcon width={20} height={20} />}
        paddingHorizontal={ms(14)}
        paddingVertical={vs(IS_TABLET ? 32 : 8)}
        height={IS_TABLET ? vs(130) : Platform.OS === 'ios' ? vs(120) : vs(140)}
        statsOffset={-vs(
          select({
            phone: Platform.OS === 'ios' ? 45 : 55,
            tablet: 55,
          }),
        )}
        width="100%"
        title="Bidding"
        subtitle="Live Auction"
        right={
          <View style={styles.dieselPill}>
            <AppText style={styles.dieselLabel}>DIESEL</AppText>
            <AppText style={styles.dieselValue}>$3.89/gal</AppText>
          </View>
        }
        stats={STATS}
        activeStat={bucket}
        onStatPress={setBucket}
      />

      {/* FILTER ROW */}
      <FilterRow
        mode={mode}
        onModeChange={setMode}
        search={search}
        onSearchChange={setSearch}
        grid={grid}
        onGridChange={setGrid}
        sort={sort}
        onSortChange={setSort}
      />

      {/* LIST / GRID */}
      {grid ? (
        // one card per row on phones: two columns leaves the card too narrow
        // for the mode/date/type/distance strip to fit on a single line.
        <FlatList
          key="grid"
          data={data}
          keyExtractor={b => b.id}
          numColumns={GRID_COLS}
          columnWrapperStyle={GRID_COLS > 1 ? styles.gridColumn : undefined}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          renderItem={({item}) => <GridCard item={item} />}
        />
      ) : (
        <BidTable data={data} />
      )}
    </SafeAreaView>
  );
}
