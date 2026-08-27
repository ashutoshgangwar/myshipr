/**
 * NavigationControls Component
 * Toolbar with map control buttons
 */

import React from 'react';
import {View, TouchableOpacity, Text} from 'react-native';
import styles from '../HereMapScreen.styles';

export function ToolbarButton({
  label,
  onPress,
  highlight,
}: {
  label?: string;
  onPress?: () => void;
  highlight?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.button, highlight && styles.buttonHighlight]}
      onPress={onPress}
      activeOpacity={0.75}>
      <Text
        style={[styles.buttonText, highlight && styles.buttonTextHighlight]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export interface NavigationControlsProps {
  onLocation?: () => void;
  onRoute?: () => void;
  onNavigate?: () => void;
  onClear?: () => void;
  /** The toolbar hides itself entirely while guidance is running. */
  isNavigating?: boolean;
}

export function NavigationControls({
  onLocation,
  onRoute,
  onNavigate,
  onClear,
  isNavigating,
}: NavigationControlsProps) {
  if (isNavigating) return null;

  return (
    <View style={styles.toolbar}>
      <ToolbarButton label="📍 Current" onPress={onLocation} />
      <ToolbarButton label="🛣️ Route" onPress={onRoute} />
      {onClear ? <ToolbarButton label="✕ Clear" onPress={onClear} /> : null}
      <ToolbarButton label="🧭 Navigate" onPress={onNavigate} highlight />
    </View>
  );
}
