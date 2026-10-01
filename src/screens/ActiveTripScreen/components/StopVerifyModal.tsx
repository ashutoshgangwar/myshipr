import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Keyboard,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';
import {colors} from '../../../theme/colors';
import {ms} from '../../../theme/scale';
import Check_Icon from '../../../assets/svg_icon/check.svg';
import type {
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';

const OTP_LENGTH = 6;
// How long the "verified" card stays up before the trip moves to the next stop.
const REDIRECT_SECONDS = 2;

/**
 * Stop verification, shown after the driver confirms a milestone step:
 *   'otp'      → sheet asking for the shipper's one-time code
 *   'verified' → confirmation card, which auto-advances the trip
 *
 * Guidance is untouched by this — it only reports the stop as done.
 */
export interface StopVerifyModalProps {
  /**
   * 'idle' is the drive to the stop, with nothing on screen; 'otp' opens the
   * code sheet; 'verified' shows the confirmation. null hides it entirely.
   */
  stage?: 'idle' | 'otp' | 'verified' | null;
  title?: string;
  desc?: string;
  doneTitle?: string;
  doneText?: string;
  /**
   * The typed code, handed up to be checked against the backend. The sheet
   * stays open and stays on the code — the parent moves `stage` to 'verified'
   * only once the endpoint has accepted it.
   */
  onVerify?: (code: string) => void;
  /** The verify call is in flight: the sheet locks rather than closing. */
  verifying?: boolean;
  /** Why the last attempt was rejected — a wrong code, or the call failing. */
  error?: string | null;
  /** The driver has edited the code, so a rejection on screen is now stale. */
  onCodeChange?: () => void;
  /**
   * "Resend OTP": asks the backend to issue this stop a fresh code. The boxes
   * are cleared here — the code already typed is the one being replaced.
   */
  onResend?: () => void;
  /** The resend call is in flight: the link locks and reads "Sending…". */
  resending?: boolean;
  /**
   * The outcome of the last resend, shown under the boxes. Distinct from
   * `error`, which is why a code was rejected rather than why one did or did
   * not go out.
   */
  resendNotice?: string | null;
  /** True when `resendNotice` is a failure and should read as one. */
  resendFailed?: boolean;
  onBack?: () => void;
  onDone?: () => void;
}

export default function StopVerifyModal({
  stage = null,
  title = 'Verification One- Time Code',
  desc = 'Ask the shipper to share OTP to Start the Shipment',
  doneTitle = 'Shipment Procured',
  doneText = 'Ride verified at Pickup 1',
  onVerify,
  verifying = false,
  error = null,
  onCodeChange,
  onResend,
  resending = false,
  resendNotice = null,
  resendFailed = false,
  onBack,
  onDone,
}: StopVerifyModalProps) {
  const insets = useSafeAreaInsets();
  const inputs = useRef<Array<TextInput | null>>([]);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));

  // Each visit starts on an empty code with the first box focused.
  useEffect(() => {
    if (stage !== 'otp') return undefined;
    setOtp(Array(OTP_LENGTH).fill(''));
    const timer = setTimeout(() => inputs.current[0]?.focus(), 350);
    return () => clearTimeout(timer);
  }, [stage]);

  // Lift the sheet with the iOS keyboard the way PodModal does (Android uses
  // adjustResize). Padding, not translate, so the sheet still fills to the
  // screen edge and the map never shows through underneath it.
  const kbPadding = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (Platform.OS !== 'ios') return undefined;
    const slide = (toValue: number, duration: number) =>
      Animated.timing(kbPadding, {
        toValue,
        duration: duration || 250,
        useNativeDriver: false,
      }).start();
    const showSub = Keyboard.addListener('keyboardWillShow', e =>
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

  const onChange = useCallback(
    (text: string, i: number) => {
      const digit = text.replace(/[^0-9]/g, '').slice(-1);
      setOtp(prev => {
        const draft = [...prev];
        draft[i] = digit;
        return draft;
      });
      // A rejection describes the code that was sent, not the one being typed.
      onCodeChange?.();
      if (digit && i < OTP_LENGTH - 1) inputs.current[i + 1]?.focus();
    },
    [onCodeChange],
  );

  const onKeyPress = useCallback(
    (e: NativeSyntheticEvent<TextInputKeyPressEventData>, i: number) => {
      if (e.nativeEvent.key === 'Backspace' && !otp[i] && i > 0) {
        inputs.current[i - 1]?.focus();
      }
    },
    [otp],
  );

  const complete = otp.every(d => d !== '');

  const verify = useCallback(() => {
    if (verifying) return;
    Keyboard.dismiss();
    onVerify?.(otp.join(''));
  }, [onVerify, otp, verifying]);

  /**
   * A fresh code makes the one on screen worthless, so the boxes are emptied
   * and the focus goes back to the first — the driver is typing a new code,
   * not correcting the old one. Locked while either call is in flight: a
   * resend landing mid-verify would clear the code being checked.
   */
  const resend = useCallback(() => {
    if (resending || verifying) return;
    setOtp(Array(OTP_LENGTH).fill(''));
    onCodeChange?.();
    inputs.current[0]?.focus();
    onResend?.();
  }, [onCodeChange, onResend, resending, verifying]);

  const back = useCallback(() => {
    // Backing out mid-check would leave the trip's answer nowhere to land.
    if (verifying) return;
    Keyboard.dismiss();
    onBack?.();
  }, [onBack, verifying]);

  return (
    <>
      {/* ── One-time code sheet ── */}
      <Modal
        visible={stage === 'otp'}
        transparent
        animationType="slide"
        onRequestClose={back}>
        <View style={styles.podOverlay}>
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}>
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
            <AppText style={styles.podTitle}>{title}</AppText>
            <AppText style={styles.podDesc}>{desc}</AppText>

            <View style={styles.verifyOtpRow}>
              {otp.map((d, i) => (
                <TextInput
                  key={i}
                  ref={el => {
                    inputs.current[i] = el;
                  }}
                  style={[styles.podOtpBox, d && styles.podOtpBoxFilled]}
                  keyboardType="number-pad"
                  maxLength={1}
                  editable={!verifying}
                  value={d}
                  onChangeText={t => onChange(t, i)}
                  onKeyPress={e => onKeyPress(e, i)}
                />
              ))}
            </View>

            {Boolean(error) && (
              <AppText style={styles.verifyError}>{error}</AppText>
            )}

            {/* Whether a new code went out. Hidden while one is being asked
                for, so the line does not contradict the link above it. */}
            {!resending && Boolean(resendNotice) && (
              <AppText
                style={resendFailed ? styles.verifyError : styles.verifyNotice}>
                {resendNotice}
              </AppText>
            )}

            <TouchableOpacity
              activeOpacity={0.7}
              disabled={verifying || resending}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              onPress={resend}>
              <AppText
                style={[
                  styles.verifyResend,
                  (verifying || resending) && styles.verifyResendDisabled,
                ]}>
                {resending ? 'Sending…' : 'Resend OTP'}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.podPrimaryBtn,
                (!complete || verifying) && styles.podPrimaryBtnDisabled,
              ]}
              disabled={!complete || verifying}
              onPress={verify}
              activeOpacity={0.85}>
              {verifying ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <AppText style={styles.podPrimaryText}>Verify</AppText>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.podSecondaryBtn,
                verifying && styles.podSecondaryBtnDisabled,
              ]}
              disabled={verifying}
              onPress={back}
              activeOpacity={0.85}>
              <AppText style={styles.podSecondaryText}>Back</AppText>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* ── Verified card ── */}
      <VerifiedCard
        visible={stage === 'verified'}
        heading={doneTitle}
        text={doneText}
        onDone={onDone}
      />
    </>
  );
}

/* ── "Shipment Procured" confirmation, dismisses itself ──────────────── */
function VerifiedCard({
  visible,
  heading,
  text,
  onDone,
}: {
  visible?: boolean;
  heading?: string;
  text?: string;
  onDone?: () => void;
}) {
  const [seconds, setSeconds] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (!visible) {
      setSeconds(REDIRECT_SECONDS);
      return undefined;
    }
    const tick = setInterval(() => setSeconds(s => s - 1), 1000);
    const finish = setTimeout(() => onDone?.(), REDIRECT_SECONDS * 1000);
    return () => {
      clearInterval(tick);
      clearTimeout(finish);
    };
  }, [visible, onDone]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.verifyDoneOverlay}>
        <View style={styles.verifyDoneCard}>
          <View style={styles.verifyDoneHeader}>
            <AppText style={styles.verifyDoneHeaderText}>{heading}</AppText>
          </View>

          <View style={styles.verifyDoneBody}>
            <View style={styles.verifyDoneBadge}>
              <Check_Icon width={ms(24)} height={ms(24)} />
            </View>
            <AppText style={styles.verifyDoneTitle}>{text}</AppText>
            <AppText style={styles.verifyDoneSub}>
              Redirecting in {Math.max(0, seconds)}s…
            </AppText>
          </View>
        </View>
      </View>
    </Modal>
  );
}
