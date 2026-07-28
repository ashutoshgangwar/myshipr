import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  PanResponder,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Camera, useCameraDevice} from 'react-native-vision-camera';
import Svg, {Path} from 'react-native-svg';
import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';
import {requestCameraPermission} from '../../../services/PermissionService';
import Uplode_Frame from '../../../assets/svg_icon/Uplode_Frame.svg';
import Zoom_in_Icon from '../../../assets/svg_icon/zoom_in_Icon.svg';
import Zoom_in_White from '../../../assets/svg_icon/zoom-in.svg';
import Retake_Camera from '../../../assets/svg_icon/Retake_Camera.svg';
import Check_Icon from '../../../assets/svg_icon/check.svg';

const TOTAL_STEPS = 4;
const OTP_LENGTH = 6;

/**
 * 4-step Proof-of-Delivery flow shown when the driver taps "End Trip":
 *   1. Photograph the signed delivery receipt
 *   2. Photograph the delivered goods
 *   3. Enter the receiver's one-time code
 *   4. Delivery confirmed summary
 */
export default function PodModal({
  visible,
  onClose,
  onComplete,
  loadId = '#TX-8821-A',
  route = 'Dallas → Houston',
}) {
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(1);
  const [receiptPhoto, setReceiptPhoto] = useState(null);
  const [goodsPhoto, setGoodsPhoto] = useState(null);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));

  // Keep the sheet pinned to the bottom and grow its bottom padding to lift
  // the content above the keyboard on iOS, in sync with the system keyboard's
  // own show/hide animation. Padding (not translate) means the sheet always
  // fills down to the screen edge, so the map never shows behind it.
  // (Android uses adjustResize.)
  const kbPadding = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const slide = (toValue, duration) =>
      Animated.timing(kbPadding, {
        toValue,
        duration: duration || 250,
        useNativeDriver: false,
      }).start();
    const showSub = Keyboard.addListener('keyboardWillShow', e =>
      // The sheet's safe-area bottom padding already covers the home
      // indicator, and the keyboard sits on top of that area — so add the
      // keyboard height minus that inset.
      slide(e.endCoordinates.height - insets.bottom, e.duration),
    );
    const hideSub = Keyboard.addListener('keyboardWillHide', e =>
      slide(0, e.duration),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [kbPadding, insets.bottom]);

  const reset = useCallback(() => {
    setStep(1);
    setReceiptPhoto(null);
    setGoodsPhoto(null);
    setOtp(Array(OTP_LENGTH).fill(''));
  }, []);

  const close = useCallback(() => {
    reset();
    onClose?.();
  }, [reset, onClose]);

  const next = useCallback(
    () => setStep(p => Math.min(TOTAL_STEPS, p + 1)),
    [],
  );
  const back = useCallback(() => setStep(p => Math.max(1, p - 1)), []);

  const otpComplete = otp.every(d => d !== '');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}>
      <View style={styles.podOverlay}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        <Animated.View
          style={[
            styles.podSheet,
            {
              paddingBottom: Animated.add(
                kbPadding,
                styles.podSheet.paddingBottom + insets.bottom,
              ),
            },
          ]}>
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}>
            <View>
              <Stepper step={step} />

              {step === 1 && (
                <PhotoStep
                  label="Step 1 of 4 • Photo"
                  title="Signed delivery receipt"
                  desc="Photograph the Bill of Lading or delivery receipt signed by the receiver at dock 4B."
                  loadId={loadId}
                  route={route}
                  showInfo
                  photo={receiptPhoto}
                  onCapture={setReceiptPhoto}
                  primaryLabel="Upload Image"
                  onPrimary={next}
                  secondaryLabel="Cancel"
                  onSecondary={close}
                />
              )}

              {step === 2 && (
                <PhotoStep
                  label="Step 2 of 4 • Photo"
                  title="Photograph delivered goods"
                  desc="Take a clear photo of the unloaded cargo at the delivery location. This protects you from any damage disputes."
                  photo={goodsPhoto}
                  onCapture={setGoodsPhoto}
                  hint="Tap to photograph the delivered goods"
                  primaryLabel="Upload Image"
                  onPrimary={next}
                  secondaryLabel="Back"
                  onSecondary={back}
                />
              )}

              {step === 3 && (
                <OtpStep
                  otp={otp}
                  setOtp={setOtp}
                  complete={otpComplete}
                  onVerify={next}
                  onBack={back}
                />
              )}

              {step === 4 && (
                <ConfirmStep
                  loadId={loadId}
                  onDone={() => {
                    onComplete?.();
                    close();
                  }}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </View>
    </Modal>
  );
}

/* ── Stepper ─────────────────────────────────────────────────────────── */
function Stepper({step}) {
  return (
    <View style={styles.podStepper}>
      {Array.from({length: TOTAL_STEPS}).map((_, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <React.Fragment key={n}>
            <View
              style={[
                styles.podStepCircle,
                active && styles.podStepCircleActive,
                done && styles.podStepCircleDone,
              ]}>
              <AppText
                style={[
                  styles.podStepNum,
                  (active || done) && styles.podStepNumActive,
                ]}>
                {n}
              </AppText>
            </View>
            {n < TOTAL_STEPS && (
              <View
                style={[styles.podStepLine, done && styles.podStepLineActive]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

/* ── Photo step (1 & 2) ──────────────────────────────────────────────── */
function PhotoStep({
  label,
  title,
  desc,
  loadId,
  route,
  showInfo,
  photo,
  onCapture,
  hint = 'Tap to photograph the receipt',
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}) {
  const [cameraOpen, setCameraOpen] = useState(false);
  // "Tap to expand" re-opens the already-saved photo in the same preview UI.
  const [expandOpen, setExpandOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const openCamera = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const granted = await requestCameraPermission();
      if (granted) {
        setExpandOpen(false);
        setCameraOpen(true);
      }
    } finally {
      setBusy(false);
    }
  }, [busy]);

  const captured = !!photo?.uri;

  return (
    <>
      <AppText style={styles.podStepLabel}>{label}</AppText>
      <AppText style={styles.podTitle}>{title}</AppText>
      <AppText style={styles.podDesc}>{desc}</AppText>

      {showInfo && (
        <View style={styles.podInfoCard}>
          <View style={styles.podInfoCol}>
            <AppText style={styles.podInfoLabel}>Location</AppText>
            <AppText style={styles.podInfoValue}>{route}</AppText>
          </View>
          <View style={styles.podInfoCol}>
            <AppText style={styles.podInfoLabel}>Load</AppText>
            <AppText style={styles.podInfoValue}>{loadId}</AppText>
          </View>
        </View>
      )}

      {captured ? (
        <View style={styles.podPreviewBox}>
          <Image
            source={{uri: photo.uri}}
            style={styles.podPreviewImage}
            resizeMode="cover"
          />
          <View style={styles.podPreviewOverlay}>
            <TouchableOpacity
              style={styles.podExpandPill}
              activeOpacity={0.85}
              onPress={() => setExpandOpen(true)}>
              <Zoom_in_White width={15} height={15} />
              <AppText style={styles.podExpandText}>Tap to expand</AppText>
            </TouchableOpacity>
            <TouchableOpacity onPress={openCamera} activeOpacity={0.7}>
              <AppText style={styles.podRetakePhoto}>Retake Photo</AppText>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.podPhotoBox}
          activeOpacity={0.8}
          disabled={busy}
          onPress={openCamera}>
          <View style={styles.podRequiredBadge}>
            <AppText style={styles.podRequiredText}>Required</AppText>
          </View>
          <Uplode_Frame width={20} height={20} />
          <AppText style={styles.podPhotoHint}>
            {busy ? 'Opening camera…' : hint}
          </AppText>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[
          styles.podPrimaryBtn,
          !captured && styles.podPrimaryBtnDisabled,
        ]}
        disabled={!captured}
        onPress={onPrimary}
        activeOpacity={0.85}>
        <AppText style={styles.podPrimaryText}>{primaryLabel}</AppText>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.podSecondaryBtn}
        onPress={onSecondary}
        activeOpacity={0.85}>
        <AppText style={styles.podSecondaryText}>{secondaryLabel}</AppText>
      </TouchableOpacity>

      {/* Camera → review ("Use this Photo") happens inside one modal, so the
          two screens never fight over a modal transition. */}
      <CameraCaptureModal
        visible={cameraOpen}
        title={title}
        onClose={() => setCameraOpen(false)}
        onSave={uri => {
          onCapture({uri});
          setCameraOpen(false);
        }}
      />

      <PhotoPreviewModal
        visible={expandOpen}
        uri={photo?.uri}
        onClose={() => setExpandOpen(false)}
        onRetake={() => {
          setExpandOpen(false);
          openCamera();
        }}
        onUse={() => setExpandOpen(false)}
      />
    </>
  );
}

/* ── Full-screen camera → review ─────────────────────────────────────── */
function CameraCaptureModal({visible, title, onClose, onSave}) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef(null);
  const backDevice = useCameraDevice('back');
  const frontDevice = useCameraDevice('front');
  const device = backDevice ?? frontDevice;

  const [shot, setShot] = useState(null);
  const [busy, setBusy] = useState(false);

  // Drop any pending review shot when the modal closes, so the next open
  // always starts on a live preview.
  useEffect(() => {
    if (!visible) {
      setShot(null);
      setBusy(false);
    }
  }, [visible]);

  const capture = useCallback(async () => {
    if (busy || !cameraRef.current) return;
    setBusy(true);
    try {
      const taken = await cameraRef.current.takePhoto({flash: 'off'});
      const path = taken?.path;
      if (path) {
        setShot(path.startsWith('file://') ? path : `file://${path}`);
      }
    } catch (e) {
      console.log('POD takePhoto error:', e?.message);
    } finally {
      setBusy(false);
    }
  }, [busy]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.podCamRoot}>
        {device ? (
          <Camera
            key={device.id}
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={visible && !shot}
            resizeMode="cover"
            androidPreviewViewType="texture-view"
            photo
          />
        ) : (
          <View style={styles.podCamEmpty}>
            <AppText style={styles.podCamEmptyText}>
              No camera available on this device.
            </AppText>
          </View>
        )}

        {/* Top bar */}
        <View style={[styles.podCamTopBar, {paddingTop: insets.top + 12}]}>
          <AppText style={styles.podCamTitle} numberOfLines={1}>
            {title}
          </AppText>
          <TouchableOpacity
            style={styles.podCamClose}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            onPress={onClose}
            activeOpacity={0.7}>
            <CloseIcon />
          </TouchableOpacity>
        </View>

        {/* Shutter */}
        <View
          style={[styles.podCamBottomBar, {paddingBottom: insets.bottom + 20}]}>
          <TouchableOpacity
            style={[styles.podCamShutter, busy && styles.podCamShutterBusy]}
            disabled={busy || !device}
            onPress={capture}
            activeOpacity={0.8}>
            <View style={styles.podCamShutterInner} />
          </TouchableOpacity>
        </View>

        {/* Review the shot without leaving this modal */}
        {!!shot && (
          <View style={[StyleSheet.absoluteFill, styles.podCamRoot]}>
            <PhotoPreview
              uri={shot}
              onClose={onClose}
              onRetake={() => setShot(null)}
              onUse={() => onSave(shot)}
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

/* ── Receipt preview: pinch-to-zoom, Retake / Use this Photo ─────────── */
// Rendered two ways: layered over the live camera right after a capture, and
// as its own modal when the driver taps "Tap to expand" on a saved photo.
function PhotoPreviewModal({visible, uri, ...rest}) {
  if (!uri) return null;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={rest.onClose}>
      <PhotoPreview uri={uri} {...rest} />
    </Modal>
  );
}

function PhotoPreview({uri, onClose, onRetake, onUse}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.podPvRoot}>
      {/* The photo owns the whole screen; controls float on top of it. */}
      <ZoomableImage key={uri} uri={uri} />

      <TouchableOpacity
        style={[styles.podPvClose, {top: insets.top + 12}]}
        hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
        onPress={onClose}
        activeOpacity={0.7}>
        <CloseIcon size={20} />
      </TouchableOpacity>

      <View style={[styles.podPvFooter, {paddingBottom: insets.bottom + 16}]}>
        <View style={styles.podPvHintPill}>
          <Zoom_in_Icon width={14} height={14} />
          <AppText style={styles.podPvHintText}>
            Pinch to zoom
          </AppText>
        </View>

        <View style={styles.podPvActions}>
          <TouchableOpacity
            style={styles.podPvRetakeBtn}
            onPress={onRetake}
            activeOpacity={0.85}>
            <Retake_Camera width={18} height={18} />
            <AppText style={styles.podPvRetakeText}>Retake Photo</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.podPvUseBtn}
            onPress={onUse}
            activeOpacity={0.85}>
            <Check_Icon width={18} height={18} />
            <AppText style={styles.podPvUseText}>Use this Photo</AppText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/* ── Pinch-to-zoom / drag image (PanResponder, no extra deps) ─────────── */
const MAX_ZOOM = 5;
const DOUBLE_TAP_ZOOM = 2.5;
const DOUBLE_TAP_MS = 280;

function ZoomableImage({uri}) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  // Mutable gesture bookkeeping — kept off React state so the responder
  // callbacks never go stale mid-gesture and no re-render fights the drag.
  const g = useRef({
    box: {w: 0, h: 0},
    scale: 1,
    baseScale: 1,
    startDistance: 0,
    pinching: false,
    tx: 0,
    ty: 0,
    baseTx: 0,
    baseTy: 0,
    lastTapAt: 0,
  }).current;

  // Keep the zoomed image's edges from being dragged inside the viewport.
  const clampPan = useCallback(() => {
    const maxX = Math.max(0, (g.box.w * (g.scale - 1)) / 2);
    const maxY = Math.max(0, (g.box.h * (g.scale - 1)) / 2);
    g.tx = Math.min(maxX, Math.max(-maxX, g.tx));
    g.ty = Math.min(maxY, Math.max(-maxY, g.ty));
  }, [g]);

  const animateTo = useCallback(
    (nextScale, nextTx, nextTy) => {
      g.scale = nextScale;
      g.baseScale = nextScale;
      g.tx = nextTx;
      g.ty = nextTy;
      g.baseTx = nextTx;
      g.baseTy = nextTy;
      Animated.parallel([
        Animated.spring(scale, {
          toValue: nextScale,
          useNativeDriver: true,
          bounciness: 0,
        }),
        Animated.spring(translateX, {
          toValue: nextTx,
          useNativeDriver: true,
          bounciness: 0,
        }),
        Animated.spring(translateY, {
          toValue: nextTy,
          useNativeDriver: true,
          bounciness: 0,
        }),
      ]).start();
    },
    [g, scale, translateX, translateY],
  );

  const settle = useCallback(() => {
    g.pinching = false;
    if (g.scale <= 1.02) {
      // Pinched all the way out — snap back to a clean fit.
      animateTo(1, 0, 0);
      return;
    }
    clampPan();
    translateX.setValue(g.tx);
    translateY.setValue(g.ty);
    g.baseScale = g.scale;
    g.baseTx = g.tx;
    g.baseTy = g.ty;
  }, [g, animateTo, clampPan, translateX, translateY]);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: e => {
        // Double-tap toggles between fit and DOUBLE_TAP_ZOOM. Pinching on a
        // touchscreen is fiddly, so this is the reliable way in and out.
        if (e.nativeEvent.touches.length > 1) return;
        const now = Date.now();
        if (now - g.lastTapAt < DOUBLE_TAP_MS) {
          g.lastTapAt = 0;
          animateTo(g.scale > 1.02 ? 1 : DOUBLE_TAP_ZOOM, 0, 0);
        } else {
          g.lastTapAt = now;
        }
      },
      onPanResponderMove: (e, gs) => {
        const touches = e.nativeEvent.touches;
        if (touches.length >= 2) {
          const [a, b] = touches;
          const d = Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);
          if (!g.pinching) {
            // First frame of the pinch — anchor the reference distance.
            g.pinching = true;
            g.startDistance = d;
            g.baseScale = g.scale;
            g.baseTx = g.tx;
            g.baseTy = g.ty;
          } else if (g.startDistance > 0) {
            const next = Math.min(
              MAX_ZOOM,
              Math.max(1, (g.baseScale * d) / g.startDistance),
            );
            g.scale = next;
            scale.setValue(next);
            clampPan();
            translateX.setValue(g.tx);
            translateY.setValue(g.ty);
          }
        } else if (!g.pinching && g.scale > 1) {
          g.tx = g.baseTx + gs.dx;
          g.ty = g.baseTy + gs.dy;
          clampPan();
          translateX.setValue(g.tx);
          translateY.setValue(g.ty);
        }
      },
      onPanResponderRelease: settle,
      onPanResponderTerminate: settle,
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  return (
    <View
      style={styles.podPvImageClip}
      onLayout={e => {
        const {width, height} = e.nativeEvent.layout;
        g.box = {w: width, h: height};
      }}
      {...responder.panHandlers}>
      <Animated.Image
        source={{uri}}
        resizeMode="contain"
        style={[
          styles.podPvImage,
          // translate before scale, so pan stays in screen pixels
          {transform: [{translateX}, {translateY}, {scale}]},
        ]}
      />
    </View>
  );
}

/* ── Small inline icons ──────────────────────────────────────────────── */
function CloseIcon({color = '#FFFFFF', size = 20}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6L18 18"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/* ── OTP step (3) ────────────────────────────────────────────────────── */
function OtpStep({otp, setOtp, complete, onVerify, onBack}) {
  const inputs = useRef([]);

  const onChange = (text, i) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    setOtp(prev => {
      const draft = [...prev];
      draft[i] = digit;
      return draft;
    });
    if (digit && i < OTP_LENGTH - 1) {
      inputs.current[i + 1]?.focus();
    }
  };

  const onKeyPress = (e, i) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  return (
    <>
      <AppText style={styles.podStepLabel}>Step 3 of 4 • Verification</AppText>
      <AppText style={styles.podTitle}>Verification One- Time Code</AppText>
      <AppText style={styles.podDesc}>
        Ask James M. at dock 4B for the 4-digit OTP sent to their registered
        number to confirm receipt.
      </AppText>

      <View style={styles.podOtpRow}>
        {otp.map((d, i) => (
          <TextInput
            key={i}
            ref={el => (inputs.current[i] = el)}
            style={[styles.podOtpBox, d && styles.podOtpBoxFilled]}
            keyboardType="number-pad"
            maxLength={1}
            value={d}
            onChangeText={t => onChange(t, i)}
            onKeyPress={e => onKeyPress(e, i)}
          />
        ))}
      </View>

      <AppText style={styles.podOtpExpiry}>Code Expires in 2.34s</AppText>
      <TouchableOpacity activeOpacity={0.7}>
        <AppText style={styles.podResend}>Resend</AppText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.podPrimaryBtn,
          !complete && styles.podPrimaryBtnDisabled,
        ]}
        disabled={!complete}
        onPress={onVerify}
        activeOpacity={0.85}>
        <AppText style={styles.podPrimaryText}>Verify</AppText>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.podSecondaryBtn}
        onPress={onBack}
        activeOpacity={0.85}>
        <AppText style={styles.podSecondaryText}>Back</AppText>
      </TouchableOpacity>
    </>
  );
}

/* ── Confirmation step (4) ───────────────────────────────────────────── */
function ConfirmStep({loadId, onDone}) {
  const rows = [
    ['Load', loadId],
    ['Delivered to', 'Destination , Dock 4b'],
    ['Delivered at', '3:38 PM · Jun 10, 2026'],
    ['Verified by', 'James M'],
    ['Proof of photos', 'Receipt, Delivered goods photo'],
    ['Distance', '234 miles'],
    ['Trip Payout', '$567'],
  ];

  return (
    <>
      <AppText style={styles.podStepLabel}>Step 4 of 4 • Confirmed</AppText>
      <AppText style={styles.podTitle}>Delivery Confirmed</AppText>
      <AppText style={styles.podDesc}>
        Load {loadId} has been fully verified and delivered to Metro
        Distribution. Your payout has been queued.
      </AppText>

      <View style={styles.podSummary}>
        {rows.map(([k, v], i) => (
          <View
            key={k}
            style={[
              styles.podSummaryRow,
              i % 2 === 1 && styles.podSummaryRowAlt,
            ]}>
            <AppText style={styles.podSummaryKey}>{k}</AppText>
            <AppText style={styles.podSummaryVal}>{v}</AppText>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.podPrimaryBtn}
        onPress={onDone}
        activeOpacity={0.85}>
        <AppText style={styles.podPrimaryText}>Ride Completed!</AppText>
      </TouchableOpacity>
    </>
  );
}
