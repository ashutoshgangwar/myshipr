import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';
import Back_arrow_map from '../../../assets/svg_icon/Back_arrow_map.svg'
import Dropdown_icon from '../../../assets/svg_icon/Dropdown_icon.svg'
import { ms } from '../../../theme/scale';

/**
 * Top overlay bar: back button · ON DUTY dropdown · SOS.
 * Glyphs are placeholders – swap with project SVG icons later.
 */
export default function TripTopBar({status = 'ON DUTY', onBack, onToggleDuty, onSOS}) {
  return (
    <View style={styles.topBar}>
      <TouchableOpacity style={styles.circleBtn} onPress={onBack} activeOpacity={0.8}>
        <Back_arrow_map width={ms(24)} height={ms(24)}/>
      </TouchableOpacity>

      <TouchableOpacity style={styles.dutyPill} onPress={onToggleDuty} activeOpacity={0.85}>
           <Dropdown_icon width={ms(24)} height={ms(24)}/>
        <AppText style={styles.dutyText}>{status}</AppText>
      </TouchableOpacity>

      <TouchableOpacity style={styles.sosBtn} onPress={onSOS} activeOpacity={0.85}>
        <AppText style={styles.sosText}>SOS</AppText>
      </TouchableOpacity>
    </View>
  );
}
