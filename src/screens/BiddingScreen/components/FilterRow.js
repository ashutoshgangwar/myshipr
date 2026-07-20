import React, {useState} from 'react';
import {View, TouchableOpacity, TextInput, Modal, Pressable} from 'react-native';

import styles from '../BiddingScreen.styles';
import {MODES, SORTS} from '../constants';
import AppText from '../../../theme/AppText';
import {colors} from '../../../theme/colors';
import SearchIcon from '../../../assets/svg_icon/Search_Icon.svg';
import ListViewIcon from '../../../assets/svg_icon/list_grid.svg';
import CardViewIcon from '../../../assets/svg_icon/card_grid.svg';
import FilterIcon from '../../../assets/svg_icon/filter_funnel.svg';

export default function FilterRow({
  mode,
  onModeChange,
  search,
  onSearchChange,
  grid,
  onGridChange,
  sort,
  onSortChange,
}) {
  const [sortOpen, setSortOpen] = useState(false);

  const pickSort = key => {
    setSortOpen(false);
    // tapping the active sort clears it
    onSortChange?.(key === sort ? null : key);
  };

  return (
    <View style={styles.filterRow}>
      <View style={styles.modeTabs}>
        {MODES.map(m => (
          <TouchableOpacity
            key={m}
            activeOpacity={0.85}
            onPress={() => onModeChange(m)}
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
          onPress={() => onGridChange(false)}
          style={[styles.toggleBtn, !grid && styles.toggleBtnActive]}>
          <ListViewIcon width={16} height={16} />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => onGridChange(true)}
          style={[styles.toggleBtn, grid && styles.toggleBtnActive]}>
          <CardViewIcon width={16} height={16} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setSortOpen(true)}
        style={[styles.filterBtn, sort && styles.filterBtnActive]}>
        <FilterIcon width={16} height={16} />
      </TouchableOpacity>

      <Modal
        visible={sortOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSortOpen(false)}>
        <Pressable style={styles.sortBackdrop} onPress={() => setSortOpen(false)}>
          <View style={styles.sortSheet}>
            <AppText style={styles.sortTitle}>Sort by</AppText>
            {SORTS.map(s => (
              <TouchableOpacity
                key={s.key}
                activeOpacity={0.85}
                onPress={() => pickSort(s.key)}
                style={styles.sortOption}>
                <AppText
                  style={[
                    styles.sortOptionText,
                    s.key === sort && styles.sortOptionTextActive,
                  ]}>
                  {s.label}
                </AppText>
                {s.key === sort ? (
                  <AppText style={styles.sortOptionTextActive}>✓</AppText>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
