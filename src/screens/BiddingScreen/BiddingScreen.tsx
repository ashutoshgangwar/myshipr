import React, {useMemo, useState} from 'react';
import {FlatList} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import styles, {BIDDING_STATS_OVERLAP, GRID_COLS} from './BiddingScreen.styles';
import {BIDS, BUCKETS, STATS, matchesFilters} from './constants';
import FilterRow from './components/FilterRow';
import BidTable from './components/BidTable';
import GridCard from './components/GridCard';
import StatusBar from '../../component/StatusBar/StatusBar';
import DashboardHeader from '../../component/DashboardHeader/DashboardHeader';
import DieselPriceBadge from '../../component/DieselBadge/DieselPriceBadge';
import {openFuelPriceEntry} from '../../services/fuelPricePrompt';
import {colors} from '../../theme/colors';

import BiddingIcon from '../../assets/svg_icon/Bidding_Icon.svg';
import { IS_TABLET } from '../../theme/device';
import type {Filters} from './constants';

export default function BiddingScreen() {
  const [mode, setMode] = useState('All Modes');
  const [search, setSearch] = useState('');
  const [grid, setGrid] = useState(false);
  // which header card is driving the list — defaults to Currently Leading
  const [bucket, setBucket] = useState(BUCKETS.leading);
  // Filter Details popover selections, keyed by field.
  const [filters, setFilters] = useState<Filters>({});
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
    return list.filter(b => matchesFilters(b, filters));
  }, [bucket, mode, search, filters]);

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
          // The same chip as on Home, and the same sheet behind it — the one
          // mounted above the navigator.
          <DieselPriceBadge onPress={openFuelPriceEntry} />
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
        filters={filters}
        onFiltersChange={setFilters}
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
