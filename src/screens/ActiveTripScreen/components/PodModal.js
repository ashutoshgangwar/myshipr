import React, {useState, useRef, useCallback} from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import {Camera, useCameraDevice} from 'react-native-vision-camera';
import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';
import {requestCameraPermission} from '../../../services/PermissionService';

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
  const [step, setStep] = useState(1);
  const [receiptPhoto, setReceiptPhoto] = useState(null);
  const [goodsPhoto, setGoodsPhoto] = useState(null);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));

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

  const next = useCallback(() => setStep(p => Math.min(TOTAL_STEPS, p + 1)), []);
  const back = useCallback(() => setStep(p => Math.max(1, p - 1)), []);

  const otpComplete = otp.every(d => d !== '');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}>
      <View style={styles.podOverlay}>
        <View style={styles.podSheet}>
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
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}) {
  const cameraRef = useRef(null);
  const backDevice = useCameraDevice('back');
  const frontDevice = useCameraDevice('front');
  const device = backDevice ?? frontDevice;

  const [cameraActive, setCameraActive] = useState(false);
  const [busy, setBusy] = useState(false);

  const openCamera = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const granted = await requestCameraPermission();
      if (granted) {
        onCapture(null);
        setCameraActive(true);
      }
    } finally {
      setBusy(false);
    }
  }, [busy, onCapture]);

  const capture = useCallback(async () => {
    if (busy || !cameraRef.current) return;
    setBusy(true);
    try {
      const shot = await cameraRef.current.takePhoto({flash: 'off'});
      const path = shot?.path;
      const uri = path
        ? path.startsWith('file://')
          ? path
          : `file://${path}`
        : null;
      if (uri) {
        onCapture({uri});
        setCameraActive(false);
      }
    } catch (e) {
      console.log('POD takePhoto error:', e?.message);
    } finally {
      setBusy(false);
    }
  }, [busy, onCapture]);

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
        <View style={styles.podSuccessBox}>
          <AppText style={styles.podSuccessText}>
            ✓ Image Captured Successfully
          </AppText>
          <TouchableOpacity onPress={openCamera} activeOpacity={0.7}>
            <AppText style={styles.podRetake}>Retake</AppText>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.podPhotoBox}
          activeOpacity={0.8}
          disabled={busy}
          onPress={cameraActive ? capture : openCamera}>
          <View style={styles.podRequiredBadge}>
            <AppText style={styles.podRequiredText}>Required</AppText>
          </View>

          {cameraActive && device && (
            <View style={styles.podCameraFeed} pointerEvents="none">
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

          {!cameraActive && (
            <>
              <AppText style={styles.podPhotoIcon}>⬆</AppText>
              <AppText style={styles.podPhotoHint}>
                {busy ? 'Opening camera…' : 'Tap to photograph the receipt'}
              </AppText>
            </>
          )}

          {cameraActive && <View style={styles.podShutter} />}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.podPrimaryBtn, !captured && styles.podPrimaryBtnDisabled]}
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
    </>
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
        style={[styles.podPrimaryBtn, !complete && styles.podPrimaryBtnDisabled]}
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
