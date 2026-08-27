import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';
import StretchIcon from '../../../assets/svg_icon/Stretch_iocn.svg';
import CrossIcon from '../../../assets/svg_icon/Cross_Pannel.svg';
import {moderateScale as ms, verticalScale as vs} from 'react-native-size-matters';
import type {LayoutChangeEvent, StyleProp, TextStyle, ViewStyle} from 'react-native';

const PRIMARY_GRADIENT = ['#00033E', '#0008A4'];

/**
 * Floating card shell with a navy header (title + optional subtitle),
 * an optional expand icon and a close (×) button. Children render the body.
 */
export interface PanelShellProps {
  title?: string;
  titleStyle?: StyleProp<TextStyle>;
  subtitle?: string;
  subtitleStyle?: StyleProp<TextStyle>;
  /** Omit to hide the stretch (⤢) toggle. */
  onExpand?: () => void;
  onClose?: () => void;
  children?: React.ReactNode;
  wrapStyle?: StyleProp<ViewStyle>;
  panelStyle?: StyleProp<ViewStyle>;
  /** Lets a panel measure its own bottom edge against the keyboard. */
  panelRef?: React.Ref<View>;
  onLayout?: (event: LayoutChangeEvent) => void;
  /** Stretched: the panel sits at top:0 and pads past the notch. */
  fullscreen?: boolean;
}

export default function PanelShell({
  title,
  titleStyle,
  subtitle,
  subtitleStyle,
  onExpand,
  onClose,
  children,
  wrapStyle,
  panelStyle,
  panelRef,
  onLayout,
  fullscreen,
}: PanelShellProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.panelWrap, wrapStyle]} onLayout={onLayout}>
      {/* `panelRef` lets a panel measure its own bottom edge against the
          keyboard — see ChatPanel's composer padding. */}
      <View ref={panelRef} style={[styles.panel, panelStyle]}>
        {/* When stretched the panel sits at top:0, so pad the header past the
            status bar / notch to keep the stretch + close icons tappable. */}
        <View style={[styles.panelHeader, fullscreen && {paddingTop: insets.top + vs(8)}]}>
          <LinearGradient
            colors={PRIMARY_GRADIENT}
            start={{x: 0, y: 0}}
            end={{x: 0, y: 1}}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.panelHeaderTexts}>
            <AppText style={[styles.panelTitle, titleStyle]}>{title}</AppText>
            {!!subtitle && <AppText style={[styles.panelSubtitle, subtitleStyle]}>{subtitle}</AppText>}
          </View>

          {!!onExpand && (
            <TouchableOpacity style={styles.panelHeaderIcon} onPress={onExpand} activeOpacity={0.7}>
              <StretchIcon width={ms(16)} height={ms(16)} />
            </TouchableOpacity>
          )}
          {!!onClose && (
            <TouchableOpacity style={styles.panelHeaderIcon} onPress={onClose} activeOpacity={0.7}>
              <CrossIcon width={ms(14)} height={ms(14)} />
            </TouchableOpacity>
          )}
        </View>

        {children}
      </View>
    </View>
  );
}
