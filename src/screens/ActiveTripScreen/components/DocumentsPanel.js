import React from 'react';
import {View, TouchableOpacity} from 'react-native';
import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';
import PanelShell from './PanelShell';

export default function DocumentsPanel({
  onClose,
  onExpand,
  onCapture,
  loadId = '#TX-8821',
  route = 'Dallas → Houston',
}) {
  return (
    <PanelShell
      title="Trip Documents"
      subtitle={`Load ${loadId} · ${route}`}
      onExpand={onExpand}
      onClose={onClose}>
      <View style={styles.cameraPreview}>
        <TouchableOpacity style={styles.captureBtn} onPress={onCapture} activeOpacity={0.8} />
        <AppText style={styles.captureLabel}>Capture</AppText>
      </View>
    </PanelShell>
  );
}
