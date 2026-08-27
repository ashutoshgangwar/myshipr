import React, {useState, useRef, useCallback, useEffect} from 'react';
import {View, TouchableOpacity, Image, StyleSheet} from 'react-native';
import {Camera, useCameraDevice} from 'react-native-vision-camera';
import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';
import PanelShell from './PanelShell';
import usePanelExpand from '../hooks/usePanelExpand';
import {requestCameraPermission} from '../../../services/PermissionService';
import { colors } from '../../../theme/colors';
import type {ErrorLike} from '../../../types/common';

export interface DocumentsPanelProps {
  onClose?: () => void;
  /** Receives the captured document as a `{uri}` asset. */
  onCapture?: (asset: {uri: string}) => void;
  loadId?: string;
  route?: string;
  onExpandedChange?: (expanded: boolean) => void;
}

export default function DocumentsPanel({
  onClose,
  onCapture,
  loadId = '#TX-8821',
  route = 'Dallas → Houston',
  onExpandedChange,
}: DocumentsPanelProps) {
  const {expanded, shellProps} = usePanelExpand(
    styles.chatPanelWrap,
    onExpandedChange,
  );
  const cameraRef = useRef<Camera | null>(null);
  const backDevice = useCameraDevice('back');
  const frontDevice = useCameraDevice('front');
  const device = backDevice ?? frontDevice;

  const [document, setDocument] = useState<{uri: string} | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [busy, setBusy] = useState(false);

  // Step 1 — camera opens (live preview turns on) only when the user taps.
  const openCamera = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const granted = await requestCameraPermission();
      if (granted) {
        setDocument(null);
        setCameraActive(true);
      }
    } finally {
      setBusy(false);
    }
  }, [busy]);

  // The panel only mounts when the user taps the documents icon, so request
  // camera permission and open the live preview straight away — no extra tap.
  useEffect(() => {
    openCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 2 — capture the frame from the live preview, in the same UI.
  const capture = useCallback(async () => {
    if (busy || !cameraRef.current) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePhoto({flash: 'off'});
      const uri = photo?.path
        ? photo.path.startsWith('file://')
          ? photo.path
          : `file://${photo.path}`
        : null;
      if (uri) {
        const asset = {uri};
        setDocument(asset);
        setCameraActive(false);
        onCapture?.(asset);
      }
    } catch (e) {
      console.log('takePhoto error:', (e as ErrorLike)?.message);
    } finally {
      setBusy(false);
    }
  }, [busy, onCapture]);

  // The shutter either opens the camera, captures, or retakes depending on state.
  const onShutter = cameraActive ? capture : openCamera;

  // Waiting on the camera device to come online (common on Android right after
  // the permission grant) — show it instead of a silent black box.
  const waitingForDevice = cameraActive && !device;

  const label = busy
    ? cameraActive
      ? 'Capturing…'
      : 'Opening camera…'
    : waitingForDevice
    ? 'Starting camera…'
    : cameraActive
    ? 'Capture'
    : document
    ? 'Retake'
    : 'Tap to open camera';

  return (
    <PanelShell
      title="Trip Documents"
      subtitle={`Load ${loadId} · ${route}`}
      subtitleStyle={{color: colors.status}}
      onClose={onClose}
      {...shellProps}>
      <View
        style={[
          styles.cameraPreview,
          expanded ? styles.cameraPreviewFullscreen : styles.cameraPreviewDocked,
        ]}>
        {cameraActive && device && (
          <View style={styles.cameraFeed} pointerEvents="none">
            <Camera
              key={device.id}
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={cameraActive}
              resizeMode="cover"
              androidPreviewViewType="texture-view"
              photo
            />
          </View>
        )}

        {/* Captured document preview */}
        {!cameraActive && document?.uri && (
          <Image
            source={{uri: document.uri}}
            style={styles.documentPreviewImage}
            resizeMode="cover"
          />
        )}

        <TouchableOpacity
          style={styles.captureBtn}
          onPress={onShutter}
          disabled={busy}
          activeOpacity={0.8}
        />
        <AppText style={styles.captureLabel}>{label}</AppText>
      </View>
    </PanelShell>
  );
}
