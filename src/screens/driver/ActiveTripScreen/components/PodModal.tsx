import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  ActivityIndicator,
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
import AppText from '../../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';
import {requestCameraPermission} from '../../../../services/PermissionService';
import {usePodDocumentUpload} from '../../../../services/podDocuments';
import type {DeliveryStopTarget} from '../../../../services/podDocuments';
import {
  sendDeliveryStopOtp,
  verifyDeliveryStopOtp,
} from '../../../../config/driverApi';
import Uplode_Frame from '../../../../assets/svg_icon/Uplode_Frame.svg';
import Zoom_in_Icon from '../../../../assets/svg_icon/zoom_in_Icon.svg';
import Zoom_in_White from '../../../../assets/svg_icon/zoom-in.svg';
import Retake_Camera from '../../../../assets/svg_icon/Retake_Camera.svg';
import Check_Icon from '../../../../assets/svg_icon/check.svg';
import {IS_TABLET} from '../../../../theme/device';
import type {ErrorLike, Nullable} from '../../../../types/common';
import type {ApiErrorBody} from '../../../../types/api';
import type {AxiosError} from 'axios';
import type {
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import {colors} from '../../../../theme/colors';
/** A captured photo, as the POD steps pass it around. */
export interface CapturedPhoto {
  uri: string;
  /** When the shutter went, ISO-8601 — what the proof is stamped with. */
  takenAt?: string;
}

const TOTAL_STEPS = 4;
const OTP_LENGTH = 6;

/**
 * 4-step Proof-of-Delivery flow shown when the driver taps "End Trip":
 *   1. Photograph the signed delivery receipt
 *   2. Photograph the delivered goods
 *   3. Enter the receiver's one-time code
 *   4. Delivery confirmed summary
 */
export interface PodModalProps {
  visible?: boolean;
  onClose?: () => void;
  onComplete?: () => void;
  loadId?: string;
  /** Where the load was collected — the start of the leg being closed out. */
  fromLocation?: string;
  /** The drop this receipt is being taken at. */
  toLocation?: string;
  /**
   * The stop the paperwork is filed against. Null when the sheet is opened
   * from "End Trip" with every stop already cleared, in which case the
   * receipt is still stored but nothing has it as its proof.
   */
  stopTarget?: DeliveryStopTarget | null;
  /**
   * Which step the sheet opens on, 1-3. Anything before it is paperwork the
   * backend already holds for this stop — see `getDeliveryStopProofStatus` —
   * so the sheet skips it rather than asking for the same photo twice, and
   * the driver cannot step back into it.
   */
  initialStep?: number;
}

export default function PodModal({
  visible,
  onClose,
  onComplete,
  loadId = '#TX-8821-A',
  fromLocation = '—',
  toLocation = '—',
  stopTarget = null,
  initialStep = 1,
}: PodModalProps) {
  const insets = useSafeAreaInsets();

  // The confirmation step is the flow's own ending, never somewhere it opens.
  const startStep = Math.min(Math.max(1, Math.round(initialStep) || 1), 3);

  const [step, setStep] = useState(startStep);
  const [receiptPhoto, setReceiptPhoto] = useState<CapturedPhoto | null>(null);
  const [goodsPhoto, setGoodsPhoto] = useState<CapturedPhoto | null>(null);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));

  // Both photo steps file the same way: the shot goes to the document
  // service, and the document it stores is then registered against the stop
  // as a proof — the receipt as RECEIPT, the goods shot as POD.
  const receiptUpload = usePodDocumentUpload('receipt');
  const goodsUpload = usePodDocumentUpload('goods');

  // ── Step 3's one-time code ───────────────────────────────────────────
  // The receiver's code is checked against the very stop the two photos were
  // just filed against, so both calls are keyed on the same `stopTarget`.
  // `verifying` is the verify-otp call in flight and `verifyError` why the
  // last code was turned down; the resend trio is kept apart from them
  // because one says whether a code went *out* and the other whether a code
  // was *accepted*, and the step shows both.
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<Nullable<string>>(null);
  const [resending, setResending] = useState(false);
  const [resendNotice, setResendNotice] = useState<Nullable<string>>(null);
  const [resendFailed, setResendFailed] = useState(false);

  // Keep the sheet pinned to the bottom and grow its bottom padding to lift
  // the content above the keyboard on iOS, in sync with the system keyboard's
  // own show/hide animation. Padding (not translate) means the sheet always
  // fills down to the screen edge, so the map never shows behind it.
  // (Android uses adjustResize.)
  const kbPadding = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const slide = (toValue: number, duration: number) =>
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
    setStep(startStep);
    setReceiptPhoto(null);
    setGoodsPhoto(null);
    setOtp(Array(OTP_LENGTH).fill(''));
    setVerifying(false);
    setVerifyError(null);
    setResending(false);
    setResendNotice(null);
    setResendFailed(false);
    receiptUpload.reset();
    goodsUpload.reset();
  }, [goodsUpload, receiptUpload, startStep]);

  const close = useCallback(() => {
    reset();
    onClose?.();
  }, [reset, onClose]);

  const next = useCallback(
    () => setStep(p => Math.min(TOTAL_STEPS, p + 1)),
    [],
  );
  const back = useCallback(
    () => setStep(p => Math.max(startStep, p - 1)),
    [startStep],
  );

  /**
   * Where the sheet opens is only known once the proofs call has answered, so
   * it can change between one opening and the next. Re-seat the step each
   * time the sheet comes up — the flow is otherwise left on whichever step the
   * last stop happened to start at.
   */
  useEffect(() => {
    if (visible) setStep(startStep);
  }, [visible, startStep]);

  /** True while the sheet is on the first step it was allowed to open at. */
  const atStart = step <= startStep;

  /**
   * Step 1's primary action: store the receipt with the document service, file
   * it against the stop as that stop's proof, and only then move on to the
   * goods photo. A failure at either call keeps the driver on the step with
   * the reason under the photo — tapping again retries.
   */
  const uploadReceipt = useCallback(async () => {
    if (!receiptPhoto?.uri || receiptUpload.uploading) return;
    const filed = await receiptUpload.upload(
      receiptPhoto.uri,
      stopTarget,
      receiptPhoto.takenAt,
    );
    if (filed) next();
  }, [next, receiptPhoto, receiptUpload, stopTarget]);

  /**
   * Step 2's primary action, and the same two calls as step 1 — this photo
   * files as `truck_photo` and its proof as POD. The receiver's code is next
   * once both have landed.
   *
   * Unless there is no stop to check it against: the sheet also opens from
   * "End Trip" with every stop already cleared, and both OTP calls are keyed
   * on that stop, so step 3 has nothing to ask for and nothing to ask it of.
   * The photos are still filed; the flow goes straight to the recap.
   */
  const uploadGoods = useCallback(async () => {
    if (!goodsPhoto?.uri || goodsUpload.uploading) return;
    const filed = await goodsUpload.upload(
      goodsPhoto.uri,
      stopTarget,
      goodsPhoto.takenAt,
    );
    if (!filed) return;
    setStep(stopTarget ? 3 : TOTAL_STEPS);
  }, [goodsPhoto, goodsUpload, stopTarget]);

  const otpComplete = otp.every(d => d !== '');

  /**
   * Step 3's primary action, once both photos are filed: check the code the
   * receiver read out with
   * `POST /drivers/shipments/{shipmentId}/delivery/stops/{sequence}/verify-otp`.
   *
   * The stop only clears on a code the backend accepts, so the confirmation
   * step is reached from here and nowhere else. A `verified: false` body is a
   * turned-down code just as much as a non-2xx is, and both leave the driver
   * on the step with the reason above the button — re-entering the code and
   * tapping again retries.
   */
  const verifyOtp = useCallback(async () => {
    if (verifying) return;
    if (!stopTarget) {
      setVerifyError('This stop is missing its shipment reference.');
      return;
    }

    setVerifying(true);
    setVerifyError(null);
    try {
      const result = await verifyDeliveryStopOtp({
        ...stopTarget,
        otp: otp.join(''),
      });
      if (result?.verified === false) {
        setVerifyError(
          result?.message || 'That code could not be verified. Please try again.',
        );
        return;
      }
      next();
    } catch (e) {
      const err = e as AxiosError<ApiErrorBody> & ErrorLike;
      setVerifyError(
        err?.response?.data?.message ||
          err?.message ||
          'That code could not be verified. Please try again.',
      );
    } finally {
      setVerifying(false);
    }
  }, [next, otp, stopTarget, verifying]);

  /**
   * "Resend" on step 3 — asks the backend to issue this stop a fresh code with
   * `POST /drivers/shipments/{shipmentId}/delivery/stops/{sequence}/send-otp`.
   *
   * Nothing about the delivery moves on the back of it; all the driver gets is
   * a line saying whether a new code went out. The usual failure is the
   * backend's own resend cooldown, and its message is the useful thing to
   * show, so it is preferred over anything written here.
   */
  const resendOtp = useCallback(async () => {
    if (resending) return;
    if (!stopTarget) {
      setResendFailed(true);
      setResendNotice('This stop is missing its shipment reference.');
      return;
    }

    setResending(true);
    setResendNotice(null);
    setResendFailed(false);
    // The code on screen is the one being replaced, so the reason the last one
    // was turned down no longer describes anything.
    setVerifyError(null);
    setOtp(Array(OTP_LENGTH).fill(''));
    try {
      const result = await sendDeliveryStopOtp(stopTarget);
      setResendFailed(false);
      setResendNotice(
        result?.message ||
          (result?.sentTo ? `A new code was sent to ${result.sentTo}.` : null) ||
          'A new code has been sent.',
      );
    } catch (e) {
      const err = e as AxiosError<ApiErrorBody> & ErrorLike;
      setResendFailed(true);
      setResendNotice(
        err?.response?.data?.message ||
          err?.message ||
          'Could not send a new code. Please try again.',
      );
    } finally {
      setResending(false);
    }
  }, [resending, stopTarget]);

  return (
    <Modal
      visible={visible}
      transparent
      // animationType="slide"
    animationType="fade"
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
                  fromLocation={fromLocation}
                  toLocation={toLocation}
                  showInfo
                  photo={receiptPhoto}
                  onCapture={photo => {
                    // A fresh shot replaces whatever the last attempt said.
                    receiptUpload.reset();
                    setReceiptPhoto(photo);
                  }}
                  primaryLabel="Upload Image"
                  busyLabel="Uploading…"
                  primaryBusy={receiptUpload.uploading}
                  error={receiptUpload.error}
                  onPrimary={uploadReceipt}
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
                  onCapture={photo => {
                    // A fresh shot replaces whatever the last attempt said.
                    goodsUpload.reset();
                    setGoodsPhoto(photo);
                  }}
                  hint="Tap to photograph the delivered goods"
                  primaryLabel="Upload Image"
                  busyLabel="Uploading…"
                  primaryBusy={goodsUpload.uploading}
                  error={goodsUpload.error}
                  onPrimary={uploadGoods}
                  secondaryLabel={atStart ? 'Cancel' : 'Back'}
                  onSecondary={atStart ? close : back}
                />
              )}

              {step === 3 && (
                <OtpStep
                  otp={otp}
                  setOtp={setOtp}
                  complete={otpComplete}
                  verifying={verifying}
                  error={verifyError}
                  // A digit changing makes the last rejection stale.
                  onEdit={() => setVerifyError(null)}
                  onVerify={verifyOtp}
                  resending={resending}
                  resendNotice={resendNotice}
                  resendFailed={resendFailed}
                  onResend={resendOtp}
                  backLabel={atStart ? 'Cancel' : 'Back'}
                  onBack={atStart ? close : back}
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
function Stepper({step}: {step: number}) {
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
interface PhotoStepProps {
  label?: string;
  title?: string;
  desc?: string;
  loadId?: string;
  fromLocation?: string;
  toLocation?: string;
  showInfo?: boolean;
  photo?: CapturedPhoto | null;
  onCapture: (photo: CapturedPhoto) => void;
  hint?: string;
  primaryLabel?: string;
  /** Shown on the primary button while `primaryBusy` — its work is in flight. */
  busyLabel?: string;
  primaryBusy?: boolean;
  /** Why the last attempt at the primary action failed, shown under it. */
  error?: string | null;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

function PhotoStep({
  label,
  title,
  desc,
  loadId,
  fromLocation,
  toLocation,
  showInfo,
  photo,
  onCapture,
  hint = 'Tap to photograph the receipt',
  primaryLabel,
  busyLabel,
  primaryBusy = false,
  error = null,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: PhotoStepProps) {
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
            {/* Both ends of the leg on one line, so the driver can check the
                receipt is being taken at the right dock before shooting it. */}
            <AppText style={styles.podInfoValue} numberOfLines={1}>
              {fromLocation} → {toLocation}
            </AppText>
          </View>
          <View style={styles.podInfoCol}>
            <AppText style={styles.podInfoLabel}>Load</AppText>
            <AppText style={styles.podInfoValue} numberOfLines={1}>
              {loadId}
            </AppText>
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

      {!!error && <AppText style={styles.podError}>{error}</AppText>}

      <TouchableOpacity
        style={[
          styles.podPrimaryBtn,
          (!captured || primaryBusy) && styles.podPrimaryBtnDisabled,
        ]}
        disabled={!captured || primaryBusy}
        onPress={onPrimary}
        activeOpacity={0.85}>
        <AppText style={styles.podPrimaryText}>
          {primaryBusy ? busyLabel ?? primaryLabel : primaryLabel}
        </AppText>
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
        onSave={(uri: string) => {
          onCapture({uri, takenAt: new Date().toISOString()});
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
function CameraCaptureModal({
  visible,
  title,
  onClose,
  onSave,
}: {
  visible?: boolean;
  title?: string;
  onClose: () => void;
  /** Receives the captured photo's file:// uri. */
  onSave: (uri: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<Camera | null>(null);
  const backDevice = useCameraDevice('back');
  const frontDevice = useCameraDevice('front');
  const device = backDevice ?? frontDevice;

  const [shot, setShot] = useState<string | null>(null);
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
      console.log('POD takePhoto error:', (e as ErrorLike)?.message);
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
            isActive={Boolean(visible) && !shot}
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
function PhotoPreviewModal({
  visible,
  uri,
  ...rest
}: {
  visible?: boolean;
  uri?: string | null;
  onClose: () => void;
  onRetake: () => void;
  onUse: () => void;
}) {
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

// Tablets get roomier action icons so they stay legible next to the larger label.
const PV_ACTION_ICON = IS_TABLET ? 24 : 18;
const PV_HINT_ICON = IS_TABLET ? 20 : 14;

function PhotoPreview({
  uri,
  onClose,
  onRetake,
  onUse,
}: {
  uri: string;
  onClose: () => void;
  onRetake: () => void;
  onUse: () => void;
}) {
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
          <Zoom_in_Icon width={PV_HINT_ICON} height={PV_HINT_ICON} />
          <AppText style={styles.podPvHintText}>
            Pinch to zoom
          </AppText>
        </View>

        <View style={styles.podPvActions}>
          <TouchableOpacity
            style={styles.podPvRetakeBtn}
            onPress={onRetake}
            activeOpacity={0.85}>
            <Retake_Camera width={PV_ACTION_ICON} height={PV_ACTION_ICON} />
            <AppText style={styles.podPvRetakeText}>Retake Photo</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.podPvUseBtn}
            onPress={onUse}
            activeOpacity={0.85}>
            <Check_Icon width={PV_ACTION_ICON} height={PV_ACTION_ICON} />
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

function ZoomableImage({uri}: {uri: string}) {
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
    (nextScale: number, nextTx: number, nextTy: number) => {
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
function CloseIcon({color = colors.white, size = 20}) {
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
function OtpStep({
  otp,
  setOtp,
  complete,
  verifying = false,
  error = null,
  onEdit,
  onVerify,
  resending = false,
  resendNotice = null,
  resendFailed = false,
  onResend,
  backLabel = 'Back',
  onBack,
}: {
  otp: string[];
  setOtp: React.Dispatch<React.SetStateAction<string[]>>;
  /** True once every digit is filled in. */
  complete?: boolean;
  /** The verify-otp call is in flight — the boxes and both links are frozen. */
  verifying?: boolean;
  /** Why the last code was turned down, shown above the resend link. */
  error?: Nullable<string>;
  /** A digit changed, so whatever `error` says no longer describes the code. */
  onEdit?: () => void;
  onVerify?: () => void;
  /** The send-otp call behind "Resend" is in flight. */
  resending?: boolean;
  /** How that call went — good news or bad, per `resendFailed`. */
  resendNotice?: Nullable<string>;
  resendFailed?: boolean;
  onResend?: () => void;
  /** "Cancel" where there is no earlier step left to go back to. */
  backLabel?: string;
  onBack?: () => void;
}) {
  const inputs = useRef<Array<TextInput | null>>([]);
  const busy = verifying || resending;

  const onChange = (text: string, i: number) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    onEdit?.();
    setOtp((prev: string[]) => {
      const draft = [...prev];
      draft[i] = digit;
      return draft;
    });
    if (digit && i < OTP_LENGTH - 1) {
      inputs.current[i + 1]?.focus();
    }
  };

  const onKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    i: number,
  ) => {
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
            ref={el => {
              inputs.current[i] = el;
            }}
            style={[styles.podOtpBox, d && styles.podOtpBoxFilled]}
            keyboardType="number-pad"
            maxLength={1}
            editable={!busy}
            value={d}
            onChangeText={t => onChange(t, i)}
            onKeyPress={e => onKeyPress(e, i)}
          />
        ))}
      </View>

      {Boolean(error) && <AppText style={styles.podError}>{error}</AppText>}

      {/* Whether a new code went out. Hidden while one is being asked for, so
          the line does not contradict the link below it. */}
      {!resending && Boolean(resendNotice) && (
        <AppText style={resendFailed ? styles.podError : styles.verifyNotice}>
          {resendNotice}
        </AppText>
      )}

      <AppText style={styles.podOtpExpiry}>Code Expires in 2.34s</AppText>
      <TouchableOpacity
        activeOpacity={0.7}
        disabled={busy}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
        onPress={onResend}>
        <AppText style={styles.podResend}>
          {resending ? 'Sending…' : 'Resend'}
        </AppText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.podPrimaryBtn,
          (!complete || busy) && styles.podPrimaryBtnDisabled,
        ]}
        disabled={!complete || busy}
        onPress={onVerify}
        activeOpacity={0.85}>
        {verifying ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <AppText style={styles.podPrimaryText}>Verify</AppText>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.podSecondaryBtn}
        disabled={verifying}
        onPress={onBack}
        activeOpacity={0.85}>
        <AppText style={styles.podSecondaryText}>{backLabel}</AppText>
      </TouchableOpacity>
    </>
  );
}

/* ── Confirmation step (4) ───────────────────────────────────────────── */
function ConfirmStep({
  loadId,
  onDone,
}: {
  loadId?: string;
  onDone?: () => void;
}) {
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
