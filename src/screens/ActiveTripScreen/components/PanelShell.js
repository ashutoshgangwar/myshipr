import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';

/**
 * Floating card shell with a navy header (title + optional subtitle),
 * an optional expand icon and a close (×) button. Children render the body.
 */
export default function PanelShell({title, subtitle, onExpand, onClose, children, wrapStyle}) {
  return (
    <View style={[styles.panelWrap, wrapStyle]}>
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View style={styles.panelHeaderTexts}>
            <AppText style={styles.panelTitle}>{title}</AppText>
            {!!subtitle && <AppText style={styles.panelSubtitle}>{subtitle}</AppText>}
          </View>

          {!!onExpand && (
            <TouchableOpacity style={styles.panelHeaderIcon} onPress={onExpand} activeOpacity={0.7}>
              <AppText style={styles.panelHeaderIconGlyph}>⤢</AppText>
            </TouchableOpacity>
          )}
          {!!onClose && (
            <TouchableOpacity style={styles.panelHeaderIcon} onPress={onClose} activeOpacity={0.7}>
              <AppText style={styles.panelHeaderIconGlyph}>×</AppText>
            </TouchableOpacity>
          )}
        </View>

        {children}
      </View>
    </View>
  );
}
