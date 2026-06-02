/**
 * NavigationControls Component
 * Toolbar with map control buttons
 */

import React from 'react';
import {View, TouchableOpacity, Text} from 'react-native';
import styles from '../HereMapScreen.styles';

export function ToolbarButton({label, onPress, highlight}) {
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

export function NavigationControls({
  onCamera,
  onMarkers,
  onLocation,
  onRoute,
  onNavigate,
  onClear,
  isNavigating,
}) {
  if (isNavigating) return null;

  return (
    <View style={styles.toolbar}>
      <ToolbarButton label="📍 Current" onPress={onLocation} />
      <ToolbarButton label="🛣️ Route" onPress={onRoute} />
      <ToolbarButton label="🧭 Navigate" onPress={onNavigate} highlight />
      <ToolbarButton label="🗑️ Clear" onPress={onClear} />
    </View>
  );
}
