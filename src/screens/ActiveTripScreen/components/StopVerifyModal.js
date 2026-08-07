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
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AppText from '../../../theme/AppText';
import styles from '../ActiveTripScreen.styles';
import {ms} from '../../../theme/scale';
import Check_Icon from '../../../assets/svg_icon/check.svg';

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
export default function StopVerifyModal({
  stage = null,
  title = 'Verification One- Time Code',
  desc = 'Ask the shipper to share OTP to Start the Shipment',
  doneTitle = 'Shipment Procured',
  doneText = 'Ride verified at Pickup 1',
  onVerify,
  onBack,
  onDone,
}) {
  const insets = useSafeAreaInsets();
  const inputs = useRef([]);
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
    const slide = (toValue, duration) =>
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

  const onChange = useCallback((text, i) => {
    const digit = text.replace(/[^0-9]/g, '').slice(-1);
    setOtp(prev => {
      const draft = [...prev];
      draft[i] = digit;
      return draft;
    });
    if (digit && i < OTP_LENGTH - 1) inputs.current[i + 1]?.focus();
  }, []);

  const onKeyPress = useCallback(
    (e, i) => {
      if (e.nativeEvent.key === 'Backspace' && !otp[i] && i > 0) {
        inputs.current[i - 1]?.focus();
      }
    },
    [otp],
  );

  const complete = otp.every(d => d !== '');

  const verify = useCallback(() => {
    Keyboard.dismiss();
    onVerify?.(otp.join(''));
  }, [onVerify, otp]);

  const back = useCallback(() => {
    Keyboard.dismiss();
    onBack?.();
  }, [onBack]);

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

            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
              onPress={() => setOtp(Array(OTP_LENGTH).fill(''))}>
              <AppText style={styles.verifyResend}>Resend OTP</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.podPrimaryBtn,
                !complete && styles.podPrimaryBtnDisabled,
              ]}
              disabled={!complete}
              onPress={verify}
              activeOpacity={0.85}>
              <AppText style={styles.podPrimaryText}>Verify</AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.podSecondaryBtn}
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
function VerifiedCard({visible, heading, text, onDone}) {
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
