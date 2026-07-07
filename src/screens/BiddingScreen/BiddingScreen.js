import React, {useMemo, useState} from 'react';
import {View, FlatList, TouchableOpacity, TextInput, ScrollView, Platform} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import styles from './BiddingScreen.styles';
import StatusBar from '../../component/StatusBar/StatusBar';
import DashboardHeader from '../../component/DashboardHeader/DashboardHeader';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import {IS_TABLET, select} from '../../theme/device';
import {ms as baseMs, vs as baseVs} from '../../theme/scale';

// NOTE: placeholder icons pulled from assets/svg_icon — swap to the correct.
import BiddingIcon from '../../assets/svg_icon/Bidding_Icon.svg';
import SearchIcon from '../../assets/svg_icon/Search_Icon.svg';
import TruckIcon from '../../assets/svg_icon/Truck_Frame.svg';
import CalendarIcon from '../../assets/svg_icon/Schedule.svg';
import ClockIcon from '../../assets/svg_icon/Info_Icon.svg';
import ListViewIcon from '../../assets/svg_icon/list_grid.svg';
import CardViewIcon from '../../assets/svg_icon/card_grid.svg';
import Both_direction_Icon from '../../assets/svg_icon/both_direction.svg';
import Right_arrow_Frame from '../../assets/svg_icon/right_arrow_Frame.svg';


const PHONE_FACTOR = select({phone: 0.82, tablet: 1});
const ms = n => baseMs(n) * PHONE_FACTOR;
const vs = n => baseVs(n) * PHONE_FACTOR;

// sort caret next to sortable header labels — small so it doesn't crowd the text
const SORT_ICON = select({phone: 8, tablet: 10});

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
   {
    id: 'b7',
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
    id: 'b8',
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
    id: 'b9',
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

function HeaderCell({label, colStyle, sortable, center}) {
  return (
    <View style={[styles.thCell, colStyle, center && styles.thCellCenter]}>
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
          <StatusBadge status={item.status} />
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
            <AppText style={styles.loadRoute}>{item.origin}</AppText>
            <AppText style={styles.loadRouteDest}>
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
      <View style={[styles.colMode, styles.colCenter]}>
        <ModeChip mode={item.mode} />
      </View>

      {/* Pickup Time */}
      <View style={[styles.colPickup, styles.colCenter]}>
        <AppText style={styles.cellStrong} numberOfLines={1}>
          {item.pickupTime}
        </AppText>
        <AppText style={styles.cellMuted} numberOfLines={1}>
          {item.pickupDate}
        </AppText>
      </View>

      {/* Indicative */}
      <View style={[styles.colIndicative, styles.colCenter]}>
        <AppText style={styles.cellStrong} numberOfLines={1}>
          {item.indicative}
        </AppText>
      </View>

      {/* Lowest Bid */}
      <View style={[styles.colLowest, styles.colCenter]}>
        <AppText style={styles.lowestBidValue}>{item.lowestBid}</AppText>
        <AppText style={styles.lowestBidRank}>{item.rank}</AppText>
      </View>

      {/* Chevron */}
      <View style={styles.colChevron}>
        <Right_arrow_Frame width={14} height={14} />
      </View>
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
            <CardViewIcon width={16} height={16} />
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
          {(() => {
            const table = (
              <View style={styles.tableInner}>
                <View style={styles.tableHeader}>
                  <HeaderCell label="Load" colStyle={styles.colLoad} sortable />
                  <HeaderCell label="Equipment" colStyle={styles.colEquip} sortable />
                  <HeaderCell label="Mode" colStyle={styles.colMode} sortable center />
                  <HeaderCell label="Pickup Time" colStyle={styles.colPickup} sortable center />
                  <HeaderCell label="Indicative" colStyle={styles.colIndicative} sortable center />
                  <HeaderCell label="Lowest Bid" colStyle={styles.colLowest} center />
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

            // Tablet: the whole table fits, so render it directly (no left/right
            // scroll). Phone: keep the horizontal ScrollView so wide columns scroll.
            return IS_TABLET ? (
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
            );
          })()}
        </View>
      )}
    </SafeAreaView>
  );
}
