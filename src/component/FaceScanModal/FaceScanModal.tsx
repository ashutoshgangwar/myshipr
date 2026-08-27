import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {Camera, useCameraDevice} from 'react-native-vision-camera';
import Svg, {Circle} from 'react-native-svg';

import styles, {RING_RADIUS, RING_SIZE, RING_STROKE} from './FaceScanModal.styles';
import AppText from '../../theme/AppText';
import {colors} from '../../theme/colors';
import CrossIcon from '../../assets/svg_icon/Cross_Icon.svg';
import {ms} from '../../theme/scale';
import type {ErrorLike} from '../../types/common';

const CLOSE_ICON = ms(26);

// How long the ring takes to sweep once the shot is taken. Long enough to read
// as "checking your face", short enough not to feel like a stall.
const SCAN_MS = 1800;

const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const STEP = {
  READY: 'ready',
  SCANNING: 'scanning',
};

/**
 * Full-screen face enrolment: a circular front-camera preview inside a ring
 * that sweeps while the shot is checked. Resolves through `onScanned(uri)`
 * once the sweep completes; `onClose` covers cancel and the no-camera case.
 */
export interface FaceScanModalProps {
  visible?: boolean;
  title?: string;
  hint?: string;
  scanningHint?: string;
  actionText?: string;
  /** Fired with the captured photo's file:// uri once the sweep completes. */
  onScanned?: (uri: string | null) => void;
  /** Covers cancel and the no-camera case. */
  onClose?: () => void;
}

export default function FaceScanModal({
  visible,
  title = 'Scan Your Face',
  hint = 'Position your face inside the circle and hold still.',
  scanningHint = 'Scanning your face…',
  actionText = 'Scan My Face',
  onScanned,
  onClose,
}: FaceScanModalProps) {
  const cameraRef = useRef<Camera | null>(null);
  // Front camera for a face; a device without one (some tablets) falls back to
  // the back lens rather than showing an empty circle.
  const frontDevice = useCameraDevice('front');
  const backDevice = useCameraDevice('back');
  const device = frontDevice ?? backDevice;

  const [step, setStep] = useState(STEP.READY);
  const [shot, setShot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sweep = useRef(new Animated.Value(0)).current;

  // Every open starts from a clean ring, whatever the last one ended on. The
  // sweep is stopped rather than left running, so cancelling mid-scan can't
  // fire onScanned after the modal is gone.
  useEffect(() => {
    if (visible) return;
    sweep.stopAnimation();
    sweep.setValue(0);
    setStep(STEP.READY);
    setShot(null);
    setBusy(false);
  }, [visible, sweep]);

  const capture = useCallback(async () => {
    if (busy || step !== STEP.READY || !device) return;

    setBusy(true);
    let uri = null;
    try {
      const taken = await cameraRef.current?.takePhoto({flash: 'off'});
      const path = taken?.path;
      if (path) {
        uri = path.startsWith('file://') ? path : `file://${path}`;
      }
    } catch (e) {
      console.log('Face scan takePhoto error:', (e as ErrorLike)?.message);
    } finally {
      setBusy(false);
    }

    if (!uri) return;

    // Freeze the still inside the circle and run the sweep over it, so the
    // driver sees the face that was actually captured.
    setShot(uri);
    setStep(STEP.SCANNING);

    Animated.timing(sweep, {
      toValue: 1,
      duration: SCAN_MS,
      easing: Easing.inOut(Easing.quad),
      // strokeDashoffset is not a native-driver prop.
      useNativeDriver: false,
    }).start(({finished}) => {
      if (finished) onScanned?.(uri);
    });
  }, [busy, device, onScanned, step, sweep]);

  const scanning = step === STEP.SCANNING;

  const dashOffset = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  return (
    <Modal
      visible={Boolean(visible)}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.root}>
        <View style={styles.topBar}>
          <AppText style={styles.title} numberOfLines={1}>
            {title}
          </AppText>
          <TouchableOpacity
            activeOpacity={0.8}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            onPress={onClose}>
            <CrossIcon width={CLOSE_ICON} height={CLOSE_ICON} />
          </TouchableOpacity>
        </View>

        <View style={styles.stage}>
          <View style={styles.circleWrap}>
            <View style={styles.circleClip}>
              {shot ? (
                <Image source={{uri: shot}} style={StyleSheet.absoluteFill} />
              ) : device ? (
                <Camera
                  key={device.id}
                  ref={cameraRef}
                  style={StyleSheet.absoluteFill}
                  device={device}
                  isActive={Boolean(visible) && !shot}
                  resizeMode="cover"
                  androidPreviewViewType="texture-view"
                  photo
                />
              ) : (
                <View style={styles.noCamera}>
                  <AppText style={styles.noCameraText}>
                    No camera available on this device.
                  </AppText>
                </View>
              )}
            </View>

            {/* Track + sweep, drawn outside the clipped preview so the stroke
                is never cut in half by the circle's own edge. */}
            <Svg
              width={RING_SIZE}
              height={RING_SIZE}
              style={StyleSheet.absoluteFill}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                stroke={colors.onDarkLow}
                strokeWidth={RING_STROKE}
                fill="none"
              />
              {scanning && (
                <AnimatedCircle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke={colors.accentBlueLight}
                  strokeWidth={RING_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                  fill="none"
                  // Start the sweep at 12 o'clock rather than 3.
                  rotation={-90}
                  origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                />
              )}
            </Svg>
          </View>

          <AppText style={styles.hint}>{scanning ? scanningHint : hint}</AppText>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              (busy || scanning || !device) && styles.primaryBtnDisabled,
            ]}
            activeOpacity={0.85}
            disabled={busy || scanning || !device}
            onPress={capture}>
            <AppText style={styles.primaryText}>
              {scanning ? 'Scanning…' : actionText}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.8}
            onPress={onClose}>
            <AppText style={styles.secondaryText}>Cancel</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
