import React, {useMemo, useState} from 'react';
import {FlatList} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import styles, {BIDDING_STATS_OVERLAP, GRID_COLS} from './BiddingScreen.styles';
import {BIDS, BUCKETS, STATS} from './constants';
import FilterRow from './components/FilterRow';
import BidTable from './components/BidTable';
import GridCard from './components/GridCard';
import StatusBar from '../../component/StatusBar/StatusBar';
import DashboardHeader from '../../component/DashboardHeader/DashboardHeader';
import DieselPriceBadge from '../../component/DieselBadge/DieselPriceBadge';
import {colors} from '../../theme/colors';

import BiddingIcon from '../../assets/svg_icon/Bidding_Icon.svg';
import { IS_TABLET } from '../../theme/device';
import type {BidRow, SortKey} from './constants';

export default function BiddingScreen() {
  const [mode, setMode] = useState('All Modes');
  const [search, setSearch] = useState('');
  const [grid, setGrid] = useState(false);
  // which header card is driving the list — defaults to Currently Leading
  const [bucket, setBucket] = useState(BUCKETS.leading);
  const [sort, setSort] = useState<SortKey | null>(null);
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
      // Each accessor returns the value the chosen column sorts on. Typed as
      // a lookup so an unknown `sort` key cannot silently yield undefined.
      const by: Record<SortKey, (b: BidRow) => string | number> = {
        pickup: b => b.pickupTime,
        lowest: b => Number(String(b.lowestBid).replace(/[^0-9.]/g, '')) || 0,
        stops: b => b.stops.length,
      };
      const accessor = by[sort];
      list = [...list].sort((a, b) =>
        accessor(a) > accessor(b) ? 1 : accessor(a) < accessor(b) ? -1 : 0,
      );
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

      <DashboardHeader
        icon={<BiddingIcon  width={IS_TABLET ? 28 : 16}
                      height={IS_TABLET ? 28 : 16} />}
        style={styles.dashboardWrap}
        headerStyle={styles.dashboardHeader}
        titleStyle={styles.dashboardTitle}
        subtitleStyle={styles.dashboardSubtitle}
        statsStyle={styles.dashboardStats}
        statLabelStyle={styles.dashboardStatLabel}
        statCardStyle={styles.dashboardStatCard}
        statValueStyle={styles.dashboardStatValue}
        statNoteStyle={styles.dashboardStatNote}
        statsOffset={-BIDDING_STATS_OVERLAP}
        width="100%"
        title="Bidding"
        subtitle="Live Auction"
        right={
          <DieselPriceBadge />
        }
        stats={STATS}
        activeStat={bucket}
        onStatPress={id => id && setBucket(id)}
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
