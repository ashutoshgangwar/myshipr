import React, {useEffect, useMemo, useState} from 'react';
import {Modal, Pressable, TouchableOpacity, View} from 'react-native';

import styles from './CalendarModal.styles';
import AppText from '../../theme/AppText';
import {MONTHS_LONG} from '../../utils/format';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const pad = (n: number): string => String(n).padStart(2, '0');

const isoOf = (year: number, month: number, day: number): string =>
  `${year}-${pad(month + 1)}-${pad(day)}`;

/** The month an ISO day falls in, or the current month when there is none. */
const monthOf = (iso?: string | null) => {
  if (!iso) {
    const now = new Date();
    return {year: now.getFullYear(), month: now.getMonth()};
  }
  const [year, month] = iso.split('-').map(Number);
  return {year, month: month - 1};
};

export interface CalendarModalProps {
  visible?: boolean;
  /** The day shown as picked, "YYYY-MM-DD". */
  selected?: string | null;
  /** Earliest day that can be picked, "YYYY-MM-DD"; earlier days are greyed. */
  minDate?: string;
  onSelect?: (iso: string) => void;
  onClose?: () => void;
}

/**
 * A month grid in a centred modal. Pure JS, so it needs no native
 * date-picker module. Dates are handled as "YYYY-MM-DD" strings in the
 * device's own zone, which compare correctly as plain strings.
 */
const CalendarModal = ({
  visible,
  selected,
  minDate,
  onSelect,
  onClose,
}: CalendarModalProps) => {
  const anchor = selected || minDate;
  const [view, setView] = useState(() => monthOf(anchor));

  // Each open starts on the month of the picked day (or of minDate).
  useEffect(() => {
    if (visible) setView(monthOf(anchor));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Leading blanks for the weekday the month starts on, then its days.
  const cells = useMemo(() => {
    const lead = new Date(view.year, view.month, 1).getDay();
    const days = new Date(view.year, view.month + 1, 0).getDate();
    return [
      ...Array.from({length: lead}, () => null),
      ...Array.from({length: days}, (_, i) => i + 1),
    ];
  }, [view]);

  const shift = (by: number) =>
    setView(({year, month}) => {
      const d = new Date(year, month + by, 1);
      return {year: d.getFullYear(), month: d.getMonth()};
    });

  // No paging back past the month minDate falls in.
  const canGoBack =
    !minDate || isoOf(view.year, view.month, 1) > `${minDate.slice(0, 8)}01`;

  return (
    <Modal
      visible={!!visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Swallows taps so only the backdrop closes the modal. */}
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.navBtn}
              disabled={!canGoBack}
              onPress={() => shift(-1)}>
              <AppText style={[styles.navText, !canGoBack && styles.disabled]}>
                ‹
              </AppText>
            </TouchableOpacity>
            <AppText style={styles.monthText}>
              {MONTHS_LONG[view.month]} {view.year}
            </AppText>
            <TouchableOpacity style={styles.navBtn} onPress={() => shift(1)}>
              <AppText style={styles.navText}>›</AppText>
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>
            {WEEKDAYS.map((label, i) => (
              <View key={`h${i}`} style={styles.cell}>
                <AppText style={styles.weekdayText}>{label}</AppText>
              </View>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <View key={`b${i}`} style={styles.cell} />;
              const iso = isoOf(view.year, view.month, day);
              const disabled = !!minDate && iso < minDate;
              const active = iso === selected;
              return (
                <TouchableOpacity
                  key={iso}
                  style={styles.cell}
                  disabled={disabled}
                  activeOpacity={0.8}
                  onPress={() => onSelect?.(iso)}>
                  <View style={[styles.dayCircle, active && styles.dayActive]}>
                    <AppText
                      style={[
                        styles.dayText,
                        active && styles.dayTextActive,
                        disabled && styles.disabled,
                      ]}>
                      {day}
                    </AppText>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <AppText style={styles.closeText}>Close</AppText>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default CalendarModal;
