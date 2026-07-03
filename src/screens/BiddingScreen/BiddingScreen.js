import React, {useMemo, useState} from 'react';
import {View, FlatList, TouchableOpacity, TextInput} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import styles from './BiddingScreen.styles';
import StatusBar from '../../component/StatusBar/StatusBar';
import DashboardHeader from '../../component/DashboardHeader/DashboardHeader';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';

// NOTE: placeholder icons pulled from assets/svg_icon — swap to the correct
// icons later. Not creating any custom SVGs.
import BiddingIcon from '../../assets/svg_icon/Bidding_Icon.svg';
import SearchIcon from '../../assets/svg_icon/Search_Icon.svg';
import TruckIcon from '../../assets/svg_icon/truck-icon.svg';
import CalendarIcon from '../../assets/svg_icon/Schedule.svg';
import ClockIcon from '../../assets/svg_icon/Info_Icon.svg';
import ChevronIcon from '../../assets/svg_icon/right_Arrow.svg';
import ListViewIcon from '../../assets/svg_icon/Manual_icon.svg';
import GridViewIcon from '../../assets/svg_icon/Scan_Iocn.svg';

const MODES = ['All Modes', 'FTL', 'LTL'];

const STATS = [
  {label: 'Currently Leading', value: '1', note: 'Across Active Bids', accent: colors.warning_text, labelColor: colors.warning_text},
  {label: 'Active Bids', value: '1', note: 'in Progress', accent: colors.accentBlue, labelColor: colors.accentBlue},
  {label: 'Awarded Bids', value: '1', note: '8% vs last week', accent: colors.success, labelColor: colors.success, up: true},
  {label: 'Open Auction', value: '637', note: 'Across All Modes', accent: colors.card_drive_load, labelColor: colors.card_drive_load},
];

const STATUS = {
  Awarded: {text: colors.success_text, bg: colors.success_bg},
  Open: {text: colors.button_color, bg: '#FEE9CF'},
};

const BIDS = [
  {
    id: 'b1',
    origin: 'Houston TX',
    dest: 'San Antonio TX',
    ref: 'FTL – 09010',
    equipment: '53 dry Van',
    weight: '41000 Lbs',
    mode: 'LTL',
    date: 'Feb, 28',
    time: '6:00 PM',
    pickupTime: '6.00Pm',
    pickupDate: '28th July',
    indicative: '$4567',
    amount: '$1100',
    lowestBid: '$900',
    rank: '#1 you',
    bids: 2,
    status: 'Awarded',
    awardedAt: '$900',
  },
  {
    id: 'b2',
    origin: 'Houston TX',
    dest: 'San Antonio TX',
    ref: 'FTL – 09010',
    equipment: '53 dry Van',
    weight: '41000 Lbs',
    mode: 'FTL',
    date: 'Feb, 28',
    time: '6:00 PM',
    pickupTime: '6.00Pm',
    pickupDate: '28th July',
    indicative: '$4567',
    amount: '$1100',
    lowestBid: '$1100',
    rank: '#4 you',
    bids: 2,
    status: 'Open',
    awardedAt: null,
  },
  {
    id: 'b3',
    origin: 'Houston TX',
    dest: 'San Antonio TX',
    ref: 'FTL – 09010',
    equipment: '53 dry Van',
    weight: '41000 Lbs',
    mode: 'LTL',
    date: 'Feb, 28',
    time: '6:00 PM',
    pickupTime: '6.00Pm',
    pickupDate: '28th July',
    indicative: '$4567',
    amount: '$1100',
    lowestBid: '$900',
    rank: '#1 you',
    bids: 2,
    status: 'Awarded',
    awardedAt: '$900',
  },
  {
    id: 'b4',
    origin: 'Houston TX',
    dest: 'San Antonio TX',
    ref: 'FTL – 09010',
    equipment: '53 dry Van',
    weight: '41000 Lbs',
    mode: 'FTL',
    date: 'Feb, 28',
    time: '6:00 PM',
    pickupTime: '6.00Pm',
    pickupDate: '28th July',
    indicative: '$4567',
    amount: '$1100',
    lowestBid: '$1100',
    rank: '#4 you',
    bids: 2,
    status: 'Open',
    awardedAt: null,
  },
  {
    id: 'b5',
    origin: 'Houston TX',
    dest: 'San Antonio TX',
    ref: 'FTL – 09010',
    equipment: '53 dry Van',
    weight: '41000 Lbs',
    mode: 'FTL',
    date: 'Feb, 28',
    time: '6:00 PM',
    pickupTime: '6.00Pm',
    pickupDate: '28th July',
    indicative: '$4567',
    amount: '$1100',
    lowestBid: '$1100',
    rank: '#4 you',
    bids: 2,
    status: 'Open',
    awardedAt: null,
  },
  {
    id: 'b6',
    origin: 'Houston TX',
    dest: 'San Antonio TX',
    ref: 'FTL – 09010',
    equipment: '53 dry Van',
    weight: '41000 Lbs',
    mode: 'FTL',
    date: 'Feb, 28',
    time: '6:00 PM',
    pickupTime: '6.00Pm',
    pickupDate: '28th July',
    indicative: '$4567',
    amount: '$1100',
    lowestBid: '$1100',
    rank: '#4 you',
    bids: 2,
    status: 'Open',
    awardedAt: null,
  },
];

function ModeChip({mode}) {
  return (
    <View style={styles.modeChip}>
      <TruckIcon width={12} height={12} />
      <AppText style={styles.modeChipText}>{mode}</AppText>
    </View>
  );
}

function StatusBadge({status}) {
  const s = STATUS[status] || STATUS.Open;
  return (
    <View style={[styles.statusBadge, {backgroundColor: s.bg}]}>
      <AppText style={[styles.statusBadgeText, {color: s.text}]}>{status}</AppText>
    </View>
  );
}

function GridCard({item}) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardRouteWrap}>
          <AppText style={styles.cardRoute} numberOfLines={1}>
            {item.origin} <AppText style={styles.arrow}>→</AppText> {item.dest}
          </AppText>
          <AppText style={styles.cardRef}>{item.ref}</AppText>
        </View>
        <View style={styles.cardAmountWrap}>
          <AppText style={styles.cardAmount}>{item.amount}</AppText>
          {item.awardedAt ? (
            <AppText style={styles.cardAwardedAt}>Awarded at {item.awardedAt}</AppText>
          ) : null}
        </View>
      </View>

      <View style={styles.cardChipsRow}>
        <ModeChip mode={item.mode} />
        <View style={styles.metaChip}>
          <CalendarIcon width={12} height={12} />
          <AppText style={styles.metaChipText}>{item.date}</AppText>
        </View>
        <View style={styles.metaChip}>
          <ClockIcon width={12} height={12} />
          <AppText style={styles.metaChipText}>{item.time}</AppText>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={styles.cardDivider} />

      <View style={styles.cardBottomRow}>
        <AppText style={styles.cardLowestLabel}>
          Lowest bid : <AppText style={styles.cardLowestValue}>{item.lowestBid}</AppText>
        </AppText>
        <AppText style={styles.cardRank}>
          {item.status === 'Awarded' ? item.rank : '-'}
        </AppText>
      </View>
    </TouchableOpacity>
  );
}

function ListRow({item}) {
  return (
    <TouchableOpacity style={styles.tableRow} activeOpacity={0.85}>
      {/* Load */}
      <View style={styles.colLoad}>
        <View style={styles.loadHeadRow}>
          <View style={styles.greenDot} />
          <View style={styles.flexShrink}>
            <AppText style={styles.loadRoute} numberOfLines={1}>
              {item.origin}
            </AppText>
            <AppText style={styles.loadRouteDest} numberOfLines={1}>
              <AppText style={styles.arrowSmall}>→ </AppText>
              {item.dest}
            </AppText>
          </View>
        </View>
        <View style={styles.bidsBadge}>
          <AppText style={styles.bidsBadgeText}>{item.bids} BIDS</AppText>
        </View>
      </View>

      {/* Equipment */}
      <View style={styles.colEquip}>
        <AppText style={styles.cellStrong} numberOfLines={1}>
          {item.equipment}
        </AppText>
        <AppText style={styles.cellMuted} numberOfLines={1}>
          {item.weight}
        </AppText>
      </View>

      {/* Mode */}
      <View style={styles.colMode}>
        <ModeChip mode={item.mode} />
      </View>

      {/* Pickup Time */}
      <View style={styles.colPickup}>
        <AppText style={styles.cellStrong}>{item.pickupTime}</AppText>
        <AppText style={styles.cellMuted}>{item.pickupDate}</AppText>
      </View>

      {/* Indicative */}
      <View style={styles.colIndicative}>
        <AppText style={styles.cellStrong}>{item.indicative}</AppText>
      </View>

      {/* Lowest Bid */}
      <View style={styles.colLowest}>
        <AppText style={styles.lowestBidValue}>{item.lowestBid}</AppText>
        <AppText style={styles.lowestBidRank}>{item.rank}</AppText>
      </View>
      <ChevronIcon width={14} height={14} />
    </TouchableOpacity>
  );
}

export default function BiddingScreen() {
  const [mode, setMode] = useState('All Modes');
  const [search, setSearch] = useState('');
  const [grid, setGrid] = useState(false);

  const data = useMemo(() => {
    let list = BIDS;
    if (mode !== 'All Modes') {
      list = list.filter(b => b.mode === mode);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        b =>
          b.origin.toLowerCase().includes(q) ||
          b.dest.toLowerCase().includes(q) ||
          b.ref.toLowerCase().includes(q),
      );
    }
    return list;
  }, [mode, search]);

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
        title="Bidding"
        subtitle="Live Auction"
        right={
          <View style={styles.dieselPill}>
            <AppText style={styles.dieselLabel}>DIESEL</AppText>
            <AppText style={styles.dieselValue}>$3.89/gal</AppText>
          </View>
        }
        stats={STATS}
      />

      {/* FILTER ROW */}
      <View style={styles.filterRow}>
        <View style={styles.modeTabs}>
          {MODES.map(m => (
            <TouchableOpacity
              key={m}
              activeOpacity={0.85}
              onPress={() => setMode(m)}
              style={[styles.modeTab, m === mode && styles.modeTabActive]}>
              <AppText
                style={[styles.modeTabText, m === mode && styles.modeTabTextActive]}>
                {m}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.searchBox}>
          <SearchIcon width={14} height={14} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.viewToggle}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setGrid(false)}
            style={[styles.toggleBtn, !grid && styles.toggleBtnActive]}>
            <ListViewIcon width={16} height={16} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setGrid(true)}
            style={[styles.toggleBtn, grid && styles.toggleBtnActive]}>
            <GridViewIcon width={16} height={16} />
          </TouchableOpacity>
        </View>
      </View>

      {/* LIST / GRID */}
      {grid ? (
        <FlatList
          key="grid"
          data={data}
          keyExtractor={b => b.id}
          numColumns={2}
          columnWrapperStyle={styles.gridColumn}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
          renderItem={({item}) => <GridCard item={item} />}
        />
      ) : (
        <View style={styles.tableWrap}>
          <View style={styles.tableHeader}>
            <AppText style={[styles.thText, styles.colLoad]}>Load</AppText>
            <AppText style={[styles.thText, styles.colEquip]}>Equipment</AppText>
            <AppText style={[styles.thText, styles.colMode]}>Mode</AppText>
            <AppText style={[styles.thText, styles.colPickup]}>Pickup Time</AppText>
            <AppText style={[styles.thText, styles.colIndicative]}>Indicative</AppText>
            <AppText style={[styles.thText, styles.colLowest]}>Lowest Bid</AppText>
          </View>
          <FlatList
            key="list"
            data={data}
            keyExtractor={b => b.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({item}) => <ListRow item={item} />}
          />
        </View>
      )}
    </SafeAreaView>
  );
}
