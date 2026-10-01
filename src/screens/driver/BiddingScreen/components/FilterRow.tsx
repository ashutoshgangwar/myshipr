import React, {useRef, useState} from 'react';
import {View, TouchableOpacity, TextInput, Dimensions} from 'react-native';

import styles from '../BiddingScreen.styles';
import {MODES, activeFilterCount} from '../constants';
import AppText from '../../../../theme/AppText';
import {colors} from '../../../../theme/colors';
import SearchIcon from '../../../../assets/svg_icon/Search_Icon.svg';
import ListViewIcon from '../../../../assets/svg_icon/list_grid.svg';
import CardViewIcon from '../../../../assets/svg_icon/card_grid.svg';
import FilterIcon from '../../../../assets/svg_icon/filter_funnel.svg';
import FilterDetailsPanel from './FilterDetailsPanel';
import { IS_TABLET } from '../../../../theme/device';
import type {Filters} from '../constants';
import type {FilterAnchor} from './FilterDetailsPanel';

export interface FilterRowProps {
  mode?: string;
  onModeChange?: (mode: string) => void;
  search?: string;
  onSearchChange?: (text: string) => void;
  /** True when the grid layout is selected rather than the table. */
  grid?: boolean;
  onGridChange?: (grid: boolean) => void;
  /** The Filter Details selections, keyed by field. */
  filters?: Filters;
  onFiltersChange?: (filters: Filters) => void;
}

export default function FilterRow({
  mode,
  onModeChange,
  search,
  onSearchChange,
  grid,
  onGridChange,
  filters,
  onFiltersChange,
}: FilterRowProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  // Where the popover hangs from — measured, so it stays under the funnel on
  // any width instead of being pinned to a guessed inset.
  const [anchor, setAnchor] = useState<FilterAnchor | null>(null);
  const funnelRef = useRef<View | null>(null);

  const picked = filters ?? {};
  const filterCount = activeFilterCount(picked);

  const openFilters = () => {
    funnelRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({
        top: y + height + 6,
        right: Math.max(Dimensions.get('window').width - (x + width), 0),
      });
      setFilterOpen(true);
    });
  };

  return (
    <View style={styles.filterRow}>
      <View style={styles.modeTabs}>
        {MODES.map(m => (
          <TouchableOpacity
            key={m}
            activeOpacity={0.85}
            onPress={() => onModeChange?.(m)}
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
          onChangeText={onSearchChange}
          placeholder="Search"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
        />
      </View>

      <View style={styles.viewToggle}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onGridChange?.(false)}
          style={[styles.toggleBtn, !grid && styles.toggleBtnActive]}>
          <ListViewIcon width={16} height={16} />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onGridChange?.(true)}
          style={[styles.toggleBtn, grid && styles.toggleBtnActive]}>
          <CardViewIcon width={16} height={16} />
        </TouchableOpacity>
      </View>

      {/* `collapsable={false}` keeps the wrapper a real native view on Android,
          which is what `measureInWindow` needs to place the popover. */}
      <View ref={funnelRef} collapsable={false}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={openFilters}
          style={[styles.filterBtn, filterCount > 0 && styles.filterBtnActive]}>
          <FilterIcon width={IS_TABLET ? 22 : 16} height={IS_TABLET ? 22 : 16 } />
        </TouchableOpacity>
      </View>

      <FilterDetailsPanel
        visible={filterOpen}
        anchor={anchor}
        filters={picked}
        onChange={onFiltersChange}
        onClose={() => setFilterOpen(false)}
      />
    </View>
  );
}
