import React, {useState} from 'react';
import {Modal, Pressable, ScrollView, TouchableOpacity, View} from 'react-native';

import styles from '../BiddingScreen.styles';
import AppText from '../../../../theme/AppText';
import {colors} from '../../../../theme/colors';
import ChevronDown from '../../../../assets/svg_icon/Chevron_Down.svg';
import FilterIcon from '../../../../assets/svg_icon/filter_funnel.svg';
import {IS_TABLET} from '../../../../theme/device';
import type {FilterField, FilterKey, Filters} from '../constants';

/** Window coordinates of the funnel button the popover hangs from. */
export interface FilterAnchor {
  /** Distance from the top of the window to the bottom of the button. */
  top: number;
  /** Distance from the right of the window to the right edge of the button. */
  right: number;
}

export interface FilterDetailsPanelProps {
  visible?: boolean;
  anchor?: FilterAnchor | null;
  /** The fields and their options, loaded from `/bids/filter-options`. */
  fields: FilterField[];
  filters: Filters;
  onChange?: (filters: Filters) => void;
  onClose?: () => void;
}

const CHEVRON = IS_TABLET ? 16 : 13;

export default function FilterDetailsPanel({
  visible,
  anchor,
  fields,
  filters,
  onChange,
  onClose,
}: FilterDetailsPanelProps) {
  // Only one field's options are unfolded at a time — the popover is narrow.
  const [openKey, setOpenKey] = useState<FilterKey | null>(null);

  const pick = (key: FilterKey, value: string) => {
    // tapping the picked option again clears that field
    const next: Filters = {...filters};
    if (next[key] === value) {
      delete next[key];
    } else {
      next[key] = value;
    }
    setOpenKey(null);
    onChange?.(next);
  };

  const close = () => {
    setOpenKey(null);
    onClose?.();
  };

  const anyPicked = fields.some(f => filters[f.key]);

  return (
    <Modal
      visible={!!visible}
      transparent
      animationType="fade"
      onRequestClose={close}>
      <Pressable style={styles.filterBackdrop} onPress={close}>
        {/* Swallows taps so the backdrop behind it does not close the panel. */}
        <Pressable
          style={[
            styles.filterPanel,
            {top: anchor?.top ?? 0, right: anchor?.right ?? 0},
          ]}
          onPress={() => {}}>
          <View style={styles.filterPanelHead}>
            <AppText style={styles.filterPanelTitle}>Filter Details</AppText>
            <View style={styles.filterPanelRule} />
            <FilterIcon width={CHEVRON} height={CHEVRON} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {fields.map(field => {
              const picked = filters[field.key];
              const open = openKey === field.key;
              // `picked` is the raw enum; show its option's humanized label.
              const pickedLabel =
                field.options.find(o => o.value === picked)?.label ?? picked;

              return (
                <View key={field.key}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setOpenKey(open ? null : field.key)}
                    style={styles.filterFieldRow}>
                    <AppText style={styles.filterFieldLabel}>
                      {field.label}
                    </AppText>
                    <View style={styles.filterFieldValueWrap}>
                      <AppText
                        numberOfLines={1}
                        style={[
                          styles.filterFieldValue,
                          picked && styles.filterFieldValueSet,
                        ]}>
                        {pickedLabel ?? field.placeholder}
                      </AppText>
                      <ChevronDown
                        width={CHEVRON}
                        height={CHEVRON}
                        color={picked ? colors.accentBlue : colors.textMuted}
                        style={open ? styles.filterChevronOpen : undefined}
                      />
                    </View>
                  </TouchableOpacity>

                  {open ? (
                    <View style={styles.filterOptions}>
                      {field.options.length === 0 ? (
                        <View style={styles.filterOption}>
                          <AppText style={styles.filterOptionText}>
                            Loading…
                          </AppText>
                        </View>
                      ) : (
                        field.options.map(option => (
                          <TouchableOpacity
                            key={option.value}
                            activeOpacity={0.85}
                            onPress={() => pick(field.key, option.value)}
                            style={styles.filterOption}>
                            <AppText
                              style={[
                                styles.filterOptionText,
                                option.value === picked &&
                                  styles.filterOptionTextActive,
                              ]}>
                              {option.label}
                            </AppText>
                            {option.value === picked ? (
                              <AppText style={styles.filterOptionTextActive}>
                                ✓
                              </AppText>
                            ) : null}
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  ) : null}
                </View>
              );
            })}

            {anyPicked ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  setOpenKey(null);
                  onChange?.({});
                }}
                style={styles.filterClearRow}>
                <AppText style={styles.filterClearText}>Clear all</AppText>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
