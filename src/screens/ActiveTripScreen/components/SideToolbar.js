import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import {moderateScale as ms} from 'react-native-size-matters';
import styles from '../ActiveTripScreen.styles';
import {colors} from '../../../theme/colors';

// Placeholder SVG icons – user will replace each with the correct asset later.
import CollapseIcon from '../../../assets/svg_icon/Arrow_Up_Icon.svg';
import ChatIcon from '../../../assets/svg_icon/Chat_Icon.svg';
import ScanIcon from '../../../assets/svg_icon/Scan_Iocn.svg';
import BiddingIcon from '../../../assets/svg_icon/Bidding_Icon.svg';
import NavIcon from '../../../assets/svg_icon/Nav_Icon.svg';
import DockIcon from '../../../assets/svg_icon/fuel-price-icon.svg';

export default function SideToolbar({panel, onSelect}) {
  const BUTTONS = [
    {id: 'collapse', Icon: CollapseIcon},
    {id: 'chat', Icon: ChatIcon},
    {id: 'documents', Icon: ScanIcon},
    {id: 'bidding', Icon: BiddingIcon},
    {id: 'navigate', Icon: NavIcon},
    {id: 'dock', Icon: DockIcon},
  ];

  const size = ms(20);

  return (
    <View style={styles.toolbar}>
      {BUTTONS.map(({id, Icon}) => {
        const active = panel === id;
        const tint = active ? colors.white : colors.navy;
        return (
          <TouchableOpacity
            key={id}
            style={[styles.toolBtn, active && styles.toolBtnActive]}
            onPress={() => onSelect(id)}
            activeOpacity={0.8}>
            <Icon width={size} height={size} color={tint} fill={tint} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
