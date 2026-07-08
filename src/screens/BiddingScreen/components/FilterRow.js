import React from 'react';
import {View, TouchableOpacity, TextInput} from 'react-native';

import styles from '../BiddingScreen.styles';
import {MODES} from '../constants';
import AppText from '../../../theme/AppText';
import {colors} from '../../../theme/colors';
import SearchIcon from '../../../assets/svg_icon/Search_Icon.svg';
import ListViewIcon from '../../../assets/svg_icon/list_grid.svg';
import CardViewIcon from '../../../assets/svg_icon/card_grid.svg';

export default function FilterRow({mode, onModeChange, search, onSearchChange, grid, onGridChange}) {
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
    </View>
  );
}
