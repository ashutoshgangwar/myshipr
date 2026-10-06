import React, {useEffect, useState} from 'react';
import {FlatList} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import styles, {BIDDING_STATS_OVERLAP, GRID_COLS} from './BiddingScreen.styles';
import {useBidSearch} from './useBidSearch';
import Skeleton from '../../../component/Skeleton/Skeleton';
import {biddingRowBones} from '../../../component/Skeleton/Skeleton.layouts';
import FilterRow from './components/FilterRow';
import BidTable from './components/BidTable';
import GridCard from './components/GridCard';
import StatusBar from '../../../component/StatusBar/StatusBar';
import DashboardHeader from '../../../component/DashboardHeader/DashboardHeader';
import DieselPriceBadge from '../../../component/DieselBadge/DieselPriceBadge';
import {openFuelPriceEntry} from '../../../services/fuelPricePrompt';
import {colors} from '../../../theme/colors';

import BiddingIcon from '../../../assets/svg_icon/Bidding_Icon.svg';
import { IS_TABLET } from '../../../theme/device';
import type {Filters} from './constants';

export default function BiddingScreen() {
  const [mode, setMode] = useState('All Modes');
  const [search, setSearch] = useState('');
  // The search text that actually drives the request — debounced so a keystroke
  // does not fire a call per character.
  const [query, setQuery] = useState('');
  const [grid, setGrid] = useState(false);
  // Which header card is driving the list. `undefined` is the default — no card
  // selected, status ALL, every bucket shown.
  const [bucket, setBucket] = useState<string | undefined>(undefined);
  // Filter Details popover selections, keyed by field.
  const [filters, setFilters] = useState<Filters>({});

  useEffect(() => {
    const id = setTimeout(() => setQuery(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  const {rows, stats, loading} = useBidSearch({bucket, mode, search: query, filters});
  // Bones while the first search is in flight and nothing is on screen yet.
  const showSkeleton = loading && rows.length === 0;

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
        stats={stats}
        activeStat={bucket}
        // Tapping a card selects its bucket; tapping the selected card again
        // clears back to ALL.
        onStatPress={id =>
          setBucket(prev => (prev === id ? undefined : id))
        }
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
      {showSkeleton ? (
        <Skeleton
          isLoading
          layout={biddingRowBones(8)}
          containerStyle={styles.skeletonWrap}
        />
      ) : grid ? (
        <FlatList
          key="grid"
          data={rows}
          keyExtractor={b => b.id}
          numColumns={GRID_COLS}
          columnWrapperStyle={GRID_COLS > 1 ? styles.gridColumn : undefined}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          renderItem={({item}) => <GridCard item={item} />}
        />
      ) : (
        <BidTable data={rows} />
      )}
    </SafeAreaView>
  );
}
