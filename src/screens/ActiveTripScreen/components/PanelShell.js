import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';

const PRIMARY_GRADIENT = ['#00033E', '#0008A4'];

/**
 * Floating card shell with a navy header (title + optional subtitle),
 * an optional expand icon and a close (×) button. Children render the body.
 */
export default function PanelShell({title, subtitle, subtitleStyle, onExpand, onClose, children, wrapStyle, onLayout}) {
  return (
    <View style={[styles.panelWrap, wrapStyle]} onLayout={onLayout}>
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <LinearGradient
            colors={PRIMARY_GRADIENT}
            start={{x: 0, y: 0}}
            end={{x: 0, y: 1}}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.panelHeaderTexts}>
            <AppText style={styles.panelTitle}>{title}</AppText>
            {!!subtitle && <AppText style={[styles.panelSubtitle, subtitleStyle]}>{subtitle}</AppText>}
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
