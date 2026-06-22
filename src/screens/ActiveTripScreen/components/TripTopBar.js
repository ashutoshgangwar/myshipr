import React, {useState} from 'react';
import {View, TouchableOpacity, Pressable} from 'react-native';
import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';
import Back_arrow_map from '../../../assets/svg_icon/Back_arrow_map.svg'
import Dropdown_icon from '../../../assets/svg_icon/Dropdown_icon.svg'
import { ms } from '../../../theme/scale';

// Duty states shown in the dropdown when the pill is tapped.
const DUTY_OPTIONS = [
  'ON DUTY',
  'ON DUTY- NOT DRIVING',
  'SLEEPER BERTH',
  'CHANGE DRIVER',
  'OFF DUTY',
];

export default function TripTopBar({status = 'ON DUTY', onBack, onSelectStatus, onSOS}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(status);

  const handleSelect = option => {
    setSelected(option);
    setOpen(false);
    onSelectStatus?.(option);
  };

  return (
    <View style={styles.topBar}>
      {/* Tap-outside backdrop closes the dropdown. */}
      {open && (
        <Pressable style={styles.dutyBackdrop} onPress={() => setOpen(false)} />
      )}

      <TouchableOpacity style={styles.circleBtn} onPress={onBack} activeOpacity={0.8}>
        <Back_arrow_map width={ms(24)} height={ms(24)} />
      </TouchableOpacity>

      <View style={styles.dutyWrap}>
        <TouchableOpacity
          style={styles.dutyPill}
          onPress={() => setOpen(o => !o)}
          activeOpacity={0.85}>
          <Dropdown_icon
            width={ms(24)}
            height={ms(24)}
            style={{transform: [{rotate: open ? '180deg' : '0deg'}]}}
          />
          <AppText style={styles.dutyText}>{selected}</AppText>
        </TouchableOpacity>

        {open && (
          <View style={styles.dutyMenu}>
            {DUTY_OPTIONS.map(option => {
              const isActive = option === selected;
              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.dutyMenuItem, isActive && styles.dutyMenuItemActive]}
                  onPress={() => handleSelect(option)}
                  activeOpacity={0.7}>
                  <AppText
                    style={[styles.dutyMenuText, isActive && styles.dutyMenuTextActive]}>
                    {option}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.sosBtn} onPress={onSOS} activeOpacity={0.85}>
        <AppText style={styles.sosText}>SOS</AppText>
      </TouchableOpacity>
    </View>
  );
}
