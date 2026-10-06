import React, {useRef, useState} from 'react';
import {View, TouchableOpacity, TextInput, Dimensions, Modal} from 'react-native';

import styles from '../BiddingScreen.styles';
import {MODES, BID_TABS, activeFilterCount} from '../constants';
import AppText from '../../../../theme/AppText';
import {colors} from '../../../../theme/colors';
import SearchIcon from '../../../../assets/svg_icon/Search_Icon.svg';
import ChevronDown from '../../../../assets/svg_icon/Chevron_Down.svg';
import ListViewIcon from '../../../../assets/svg_icon/list_grid.svg';
import CardViewIcon from '../../../../assets/svg_icon/card_grid.svg';
import FilterIcon from '../../../../assets/svg_icon/filter_funnel.svg';
import FilterDetailsPanel from './FilterDetailsPanel';
import { IS_TABLET } from '../../../../theme/device';
import type {Filters, BidTabKey} from '../constants';
import type {FilterAnchor} from './FilterDetailsPanel';

/** Where the Mode dropdown menu hangs — left-aligned under its button. */
type ModeAnchor = {top: number; left: number; width: number};

export interface FilterRowProps {
  /** The left tab — 'all' or 'mine'. */
  tab?: BidTabKey;
  onTabChange?: (tab: BidTabKey) => void;
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
  tab,
  onTabChange,
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
  // The Mode dropdown menu, anchored under its button.
  const [modeOpen, setModeOpen] = useState(false);
  const [modeAnchor, setModeAnchor] = useState<ModeAnchor | null>(null);
  const modeRef = useRef<View | null>(null);
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

  const openMode = () => {
    modeRef.current?.measureInWindow((x, y, width, height) => {
      setModeAnchor({top: y + height + 6, left: x, width});
      setModeOpen(true);
    });
  };

  return (
    <View style={styles.filterRow}>
      <View style={styles.modeTabs}>
        {BID_TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            activeOpacity={0.85}
            onPress={() => onTabChange?.(t.key)}
            style={[styles.modeTab, t.key === tab && styles.modeTabActive]}>
            <AppText
              style={[
                styles.modeTabText,
                t.key === tab && styles.modeTabTextActive,
              ]}>
              {t.label}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>

      {/* Mode dropdown — replaces the old FTL/LTL tabs */}
      <View ref={modeRef} collapsable={false}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={openMode}
          style={styles.modeDropdown}>
          <AppText style={styles.modeDropdownText} numberOfLines={1}>
            {mode}
          </AppText>
          <ChevronDown
            width={12}
            height={12}
            color={colors.textMuted}
            style={modeOpen ? styles.filterChevronOpen : undefined}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <SearchIcon width={ IS_TABLET ? 22 : 14} height={IS_TABLET ? 22 : 14} />
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

      {/* Mode dropdown menu */}
      <Modal
        visible={modeOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModeOpen(false)}>
        <TouchableOpacity
          style={styles.filterBackdrop}
          activeOpacity={1}
          onPress={() => setModeOpen(false)}>
          {modeAnchor ? (
            <View
              style={[
                styles.modeMenu,
                {
                  top: modeAnchor.top,
                  left: modeAnchor.left,
                  minWidth: modeAnchor.width,
                },
              ]}>
              {MODES.map(m => (
                <TouchableOpacity
                  key={m}
                  activeOpacity={0.85}
                  onPress={() => {
                    onModeChange?.(m);
                    setModeOpen(false);
                  }}
                  style={styles.modeMenuOption}>
                  <AppText
                    style={[
                      styles.modeMenuOptionText,
                      m === mode && styles.modeMenuOptionTextActive,
                    ]}>
                    {m}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </TouchableOpacity>
      </Modal>

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
