import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import React, {useState, useRef} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import styles from './ResetPassword.styles';
import {useNavigation, useRoute} from '@react-navigation/native';
import Button from '../../component/Button/Button';
import {colors} from '../../theme/colors';
import Eye_off from '../../assets/svg_icon/eye-off.svg';
import Eye_outline from '../../assets/svg_icon/eye-outline.svg';
import TruckIcon from '../../assets/svg_icon/Frame.svg';
import StatusBar from '../../component/StatusBar/StatusBar';
import ErrorModal from '../../component/ErrorModal/ErrorModal';
import useErrorModal from '../../hooks/useErrorModal';
import AppText from '../../theme/AppText';
import {ms, vs} from '../../theme/scale';
import {
  validateNewPassword,
  acceptInvitation,
  verifyPhoneOtp,
  verifyEmailOtp,
} from '../../config/api';
import type {
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import type {AppApiError} from '../../types/api';
import type {RootStackScreenProps} from '../../types/navigation';

/** Which of the two OTP channels a handler is acting on. */
type OtpChannel = 'phone' | 'email';

// step 1 = phone / email form
// step 2 = otp verify (per channel)
// step 3 = new password
//
// The screen has two ways in, and they walk the steps in opposite orders:
//
//  * "Forgot Password" on the login screen — 1 → 2 → 3. Identify yourself,
//    prove it with a code, then choose a password.
//  * The driver-invite link — arrives with `route.params.token` and starts at
//    3, then goes to 2. The emailed token is what identifies the driver, so
//    step 1 is skipped; the password is set first (POST /auth/invitations/
//    accept), and the codes texted and emailed on the back of that call then
//    activate the account. Finishing both drops the driver on the sign-in
//    screen — accepting an invite does NOT sign them in, because the account
//    is not verified until those two codes are.
//
// The link flow only ever sets a *first* password for a newly invited driver.
// There is no emailed reset link; a driver who forgets their password takes
// the "Forgot Password" route above.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?\d{10,15}$/;
const EMPTY_OTP = ['', '', '', '', '', ''];

const ResetPassword = () => {
  const navigation = useNavigation();
  const route = useRoute<RootStackScreenProps<'ResetPassword'>['route']>();
  // Every message this screen shows goes through the one shared modal — see
  // `hooks/useErrorModal`. The invite flow is the driver's first sight of the
  // app, so a stock OS alert here is the worst place for one.
  const {modalProps, showError, showMessage, showSuccess, showWarning} =
    useErrorModal();

  // Set only when the screen was opened from an emailed link. The driver has
  // no session and never typed a code — the token stands in for both.
  const {token: linkToken, email: linkEmail} = route.params || {};
  const isLinkFlow = Boolean(linkToken);

  const [step, setStep] = useState(isLinkFlow ? 3 : 1);

  // ── Step 1 identifiers (also where the invite flow's OTPs are sent) ──
  // A link that carries the address it was mailed to seeds the email field, so
  // the email code can be confirmed even if the accept call answers with only
  // a message.
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(linkEmail || '');

  // Which channel identifiers the invite itself supplied. Settled when step 2
  // opens and not derived from the field's own contents: a block that flipped
  // from "type your number" to "code sent to 9" on the first keystroke would
  // be unusable.
  const [inviteKnows, setInviteKnows] = useState({
    phone: false,
    email: Boolean(linkEmail),
  });

  // ── Step 2 per-channel OTP ──
  const [phoneOtp, setPhoneOtp] = useState(EMPTY_OTP);
  const [emailOtp, setEmailOtp] = useState(EMPTY_OTP);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  // ── Step 3 password ──
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const phoneOtpRefs = useRef<Array<TextInput | null>>([]);
  const emailOtpRefs = useRef<Array<TextInput | null>>([]);
  const emailInputRef = useRef<TextInput | null>(null);
  const confirmPasswordRef = useRef<TextInput | null>(null);

  const hasPhone = phone.trim().length > 0;
  const hasEmail = email.trim().length > 0;

  // An invited driver must clear BOTH codes, so both blocks are on screen from
  // the moment step 2 opens — including before the accept call has said what
  // the phone number is. Forgot-password only asks about the channels the
  // driver actually filled in on step 1.
  const showPhoneBlock = isLinkFlow || hasPhone;
  const showEmailBlock = isLinkFlow || hasEmail;

  const isSendOtpDisabled = loading || (!hasPhone && !hasEmail);
  // Submit is enabled once every channel on screen has been verified.
  const isSubmitDisabled =
    loading ||
    (!showPhoneBlock && !showEmailBlock) ||
    (showPhoneBlock && !phoneVerified) ||
    (showEmailBlock && !emailVerified);
  const isResetPasswordDisabled =
    loading || !newPassword.trim() || !confirmPassword.trim();

  // ── Channel helpers (keeps the two OTP blocks in one code path) ──
  const getChannel = (channel: OtpChannel) =>
    channel === 'phone'
      ? {
          label: 'Phone Number',
          value: phone,
          setValue: setPhone,
          otp: phoneOtp,
          setOtp: setPhoneOtp,
          refs: phoneOtpRefs,
          verified: phoneVerified,
          setVerified: setPhoneVerified,
        }
      : {
          label: 'Email Address',
          value: email,
          setValue: setEmail,
          otp: emailOtp,
          setOtp: setEmailOtp,
          refs: emailOtpRefs,
          verified: emailVerified,
          setVerified: setEmailVerified,
        };

  /** True when `value` can be the identifier `channel`'s code was sent to. */
  const isChannelValueValid = (channel: OtpChannel, value: string) =>
    channel === 'phone'
      ? PHONE_REGEX.test(value.replace(/[\s()-]/g, ''))
      : EMAIL_REGEX.test(value);

  const handleOtpChange = (
    value: string,
    index: number,
    channel: OtpChannel,
  ) => {
    if (!/^\d?$/.test(value)) return;
    const c = getChannel(channel);
    if (c.verified) c.setVerified(false);
    const updated = [...c.otp];
    updated[index] = value;
    c.setOtp(updated);
    if (value && index < 5) {
      c.refs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
    channel: OtpChannel,
  ) => {
    const c = getChannel(channel);
    if (e.nativeEvent.key === 'Backspace' && !c.otp[index] && index > 0) {
      c.refs.current[index - 1]?.focus();
    }
  };

  const handleSendOtp = () => {
    const trimmedPhone = phone.trim();
    const trimmedEmail = email.trim();

    if (!trimmedPhone && !trimmedEmail) {
      showWarning('Required', 'Please enter a phone number or email address');
      return;
    }
    if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
      showWarning('Invalid Number', 'Please enter a valid phone number');
      return;
    }
    if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
      showWarning('Invalid Email', 'Please enter a valid email address');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setPhoneOtp(EMPTY_OTP);
      setEmailOtp(EMPTY_OTP);
      setPhoneVerified(false);
      setEmailVerified(false);
      setStep(2);
    }, 800);
  };

  const goToLogin = () =>
    navigation.reset({index: 0, routes: [{name: 'LoginScreen'}]});

  const handleResend = (channel: OtpChannel) => {
    const c = getChannel(channel);
    c.setOtp(EMPTY_OTP);
    c.setVerified(false);
    showMessage({
      title: 'Code Sent',
      message: `A new code has been sent to ${c.value.trim()}.`,
      closeText: 'OK',
    });
  };

  const handleVerifyChannel = async (channel: OtpChannel) => {
    const c = getChannel(channel);
    const code = c.otp.join('');
    const value = c.value.trim();

    if (code.length !== 6) {
      showWarning('Invalid Code', 'Please enter all 6 digits');
      return;
    }
    Keyboard.dismiss();

    // Forgot-password is still mocked end to end: nothing ever sent a code, so
    // there is nothing for the backend to check. Only the invite flow is wired.
    if (!isLinkFlow) {
      c.setVerified(true);
      return;
    }

    if (!value) {
      showWarning(
        'Required',
        `Please enter the ${c.label.toLowerCase()} the code was sent to`,
      );
      return;
    }
    if (!isChannelValueValid(channel, value)) {
      showWarning(
        channel === 'phone' ? 'Invalid Number' : 'Invalid Email',
        `Please enter a valid ${c.label.toLowerCase()}`,
      );
      return;
    }

    setLoading(true);
    try {
      const {message} =
        channel === 'phone'
          ? await verifyPhoneOtp({phoneNumber: value, otp: code})
          : await verifyEmailOtp({email: value, otp: code});

      c.setVerified(true);

      // Read the OTHER channel's flag — this one is being set in the same
      // breath, so its state value is still the pre-verify one.
      const otherDone =
        channel === 'phone'
          ? emailVerified || !showEmailBlock
          : phoneVerified || !showPhoneBlock;

      if (otherDone) {
        // Both codes are in, so the account is active. Accepting an invite
        // never signs the driver in — they sign in with the password they
        // just chose.
        showSuccess(message, {
          title: 'Account Verified',
          closeText: 'Sign In',
          onClose: goToLogin,
          dismissable: false,
        });
      }
    } catch (e) {
      const err = e as AppApiError;
      showError(err, {
        title: 'Verification Failed',
        message: err?.message || 'Could not verify that code. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOtp = () => {
    if (hasPhone && !phoneVerified) {
      showWarning('Verify Required', 'Please verify the code sent to your phone');
      return;
    }
    if (hasEmail && !emailVerified) {
      showWarning('Verify Required', 'Please verify the code sent to your email');
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 600);
  };

  const handleResetPassword = async () => {
    // One rule set, shared with the backend contract — see validateNewPassword.
    const check = validateNewPassword(newPassword, confirmPassword);
    if (!check.ok) {
      showWarning(check.title, check.message);
      return;
    }

    Keyboard.dismiss();

    // The OTP path is still mocked end to end; only the link path is wired to
    // the backend today.
    if (!isLinkFlow) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        showSuccess('Password reset successfully!', {
          title: 'Password Reset',
          closeText: 'Login',
          onClose: goToLogin,
          dismissable: false,
        });
      }, 1000);
      return;
    }

    setLoading(true);
    try {
      const {message, phoneNumber, email: verifiedEmail} =
        await acceptInvitation({
          token: linkToken as string,
          password: newPassword,
        });

      // The codes go out on the back of this call, and the answer names the
      // phone and email they were sent to. Seed the fields from it so the
      // driver confirms against what the backend actually used, rather than
      // typing an address that may not match the invite.
      if (phoneNumber) setPhone(phoneNumber);
      if (verifiedEmail) setEmail(verifiedEmail);
      setInviteKnows({
        phone: Boolean(phoneNumber),
        email: Boolean(verifiedEmail || linkEmail),
      });

      setPhoneOtp(EMPTY_OTP);
      setEmailOtp(EMPTY_OTP);
      setPhoneVerified(false);
      setEmailVerified(false);
      setStep(2);

      showSuccess(message, {title: 'Password Set'});
    } catch (e) {
      const err = e as AppApiError;
      // The link has already been redeemed: the account exists and has a
      // password, so there is nothing this form can do with it. Retrying only
      // fails again, and Back would land on a dead link — so OK is the only
      // way out of the alert, and it goes to sign-in.
      if (err?.invitationUsed) {
        showMessage({
          variant: 'info',
          title: 'Already Activated',
          message:
            err.message ||
            'This invite has already been used. Please sign in with your password.',
          closeText: 'OK',
          onClose: goToLogin,
          dismissable: false,
        });
        return;
      }
      showError(err, {title: 'Could Not Save'});
    } finally {
      setLoading(false);
    }
  };

  // The emailed-link flow walks its own two steps, so it gets its own copy.
  const heroTitle = isLinkFlow
    ? step === 3
      ? 'Set Your Password'
      : 'Verify Your Account'
    : step === 1
    ? 'Forgot Password'
    : step === 2
    ? 'Enter Verification Code'
    : 'Enter New Password';

  const heroSubtitle = isLinkFlow
    ? step === 3
      ? 'Welcome to MyShipr. Choose a password to finish activating your driver account.'
      : 'Enter the codes we sent to your phone and email.'
    : step === 1
    ? 'Enter the email or phone linked with your account.'
    : step === 2
    ? 'Enter the verification code'
    : 'Create a new password';

  const showPasswordForm = step === 3;

  // ── One OTP block (used for both phone and email in step 2) ──
  const renderOtpBlock = (channel: OtpChannel) => {
    const c = getChannel(channel);
    const sentTo = c.value.trim();
    // Forgot-password always knows: the driver typed the channel on step 1.
    const knowsChannel = !isLinkFlow || inviteKnows[channel];
    const isComplete = c.otp.join('').length === 6;
    const verifyDisabled = loading || c.verified || !isComplete;

    return (
      <View style={styles.otpBlock}>
        <AppText style={styles.otpSectionLabel}>{c.label}</AppText>

        {/* The invite normally tells us where each code went. When it does not
            — an accept response that is only a message — the driver types the
            channel it reached them on, because the verify endpoints are keyed
            on the number/address, not on the invite token. */}
        {knowsChannel ? (
          <AppText style={styles.otpSentText}>
            Verification code sent to{' '}
            <AppText style={styles.otpSentValue}>{sentTo}</AppText>
          </AppText>
        ) : (
          <TextInput
            placeholder={
              channel === 'phone'
                ? 'Enter your Phone Number'
                : 'Enter your Email Address'
            }
            placeholderTextColor={colors.textMuted}
            keyboardType={channel === 'phone' ? 'phone-pad' : 'email-address'}
            autoCapitalize="none"
            autoCorrect={false}
            value={c.value}
            onChangeText={c.setValue}
            style={[
              styles.input,
              styles.otpIdentifierInput,
              loading && styles.disabledInput,
            ]}
            editable={!loading}
          />
        )}

        <View style={styles.otpInlineRow}>
          <View style={styles.otpBoxRow}>
            {c.otp.map((digit, index) => (
              <TextInput
                key={`${channel}-${index}`}
                ref={ref => {
                  c.refs.current[index] = ref;
                }}
                value={digit}
                onChangeText={value => handleOtpChange(value, index, channel)}
                onKeyPress={e => handleOtpKeyPress(e, index, channel)}
                keyboardType="number-pad"
                maxLength={1}
                style={[styles.otpBoxSmall, loading && styles.disabledInput]}
                editable={!loading && !c.verified}
                returnKeyType={index === 5 ? 'done' : 'next'}
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={() => handleVerifyChannel(channel)}
            disabled={verifyDisabled}
            activeOpacity={0.8}
            style={[
              styles.verifyButton,
              verifyDisabled && styles.verifyButtonDisabled,
            ]}>
            <AppText style={styles.verifyButtonText}>
              {c.verified ? 'Verified' : 'Verify'}
            </AppText>
          </TouchableOpacity>
        </View>

        {c.verified ? (
          <View style={styles.resendRow}>
            <AppText style={styles.otpSuccessText}>
              Verified successfully
            </AppText>
          </View>
        ) : isLinkFlow ? (
          // No resend endpoint exists for an invite yet, so the flow does not
          // offer a button that could only ever pretend to work.
          <View style={styles.resendRow}>
            <AppText style={styles.resendText}>
              Didn’t received code? Ask your carrier to resend the invite.
            </AppText>
          </View>
        ) : (
          <View style={styles.resendRow}>
            <AppText style={styles.resendText}>Didn’t received code? </AppText>
            <TouchableOpacity
              onPress={() => handleResend(channel)}
              disabled={loading}
              activeOpacity={0.7}>
              <AppText style={styles.resendLink}>Resend</AppText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoiding}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? vs(6) : 0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView
          style={[styles.safe, {backgroundColor: colors.white}]}
          edges={['bottom']}>
          <StatusBar
            backgroundColor="transparent"
            barStyle="light-content"
            translucent={true}
          />
          <ScrollView
            style={[styles.scroll, {backgroundColor: colors.white}]}
            contentContainerStyle={[
              styles.container,
              {backgroundColor: colors.white},
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={Platform.OS === 'ios'}
            alwaysBounceVertical={Platform.OS === 'ios'}
            overScrollMode={Platform.OS === 'android' ? 'never' : 'auto'}
            contentInsetAdjustmentBehavior="never"
            endFillColor={colors.white}
            decelerationRate={Platform.OS === 'ios' ? 'normal' : 'fast'}>
            <View style={styles.screenShell}>
              <View style={styles.heroSection}>
                <Image
                  source={require('../../assets/Image/bg_image_login.jpg')}
                  style={styles.heroBackground}
                  resizeMode="cover"
                />
                <LinearGradient
                  colors={[
                    colors.overlayDarkStartTransparent,
                    colors.overlayDarkMidStrong,
                    colors.primary,
                  ]}
                  start={{x: 0, y: 0}}
                  end={{x: 0, y: 1}}
                  style={styles.heroOverlay}>
                  <View style={styles.heroContent}>
                    <AppText style={styles.title}>{heroTitle}</AppText>
                    <AppText style={styles.subtitle}>{heroSubtitle}</AppText>
                    <TouchableOpacity
                      style={styles.roleBadge}
                      activeOpacity={0.85}
                      accessibilityRole="button">
                      <AppText style={styles.roleBadgeText}>CARRIER</AppText>
                      <TruckIcon width={ms(20)} height={ms(20)} />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.card}>
                {/* ── STEP 1: Phone / Email ── */}
                {step === 1 && (
                  <>
                    <AppText style={styles.label}>Phone Number</AppText>
                    <TextInput
                      placeholder="Enter your Phone Number"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={phone}
                      onChangeText={setPhone}
                      returnKeyType="next"
                      onSubmitEditing={() => emailInputRef.current?.focus()}
                      style={[styles.input, loading && styles.disabledInput]}
                      editable={!loading}
                    />

                    <View style={styles.orDividerRow}>
                      <View style={styles.orDividerLine} />
                      <AppText style={styles.orDividerText}>Or</AppText>
                      <View style={styles.orDividerLine} />
                    </View>

                    <AppText style={styles.label}>Email Address</AppText>
                    <TextInput
                      ref={emailInputRef}
                      placeholder="Enter your Email Address"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={email}
                      onChangeText={setEmail}
                      returnKeyType="done"
                      onSubmitEditing={handleSendOtp}
                      style={[styles.input, loading && styles.disabledInput]}
                      editable={!loading}
                    />
                  </>
                )}

                {/* ── STEP 2: OTP Verify (per channel) ── */}
                {step === 2 && (
                  <>
                    {showPhoneBlock && renderOtpBlock('phone')}
                    {showEmailBlock && renderOtpBlock('email')}
                  </>
                )}

                {/* ── STEP 3: New Password ── */}
                {showPasswordForm && (
                  <>
                    <AppText style={styles.label}>New Password</AppText>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        placeholder="Create New Password"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry={!showNewPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        onSubmitEditing={() =>
                          confirmPasswordRef.current?.focus()
                        }
                        returnKeyType="next"
                        style={[
                          styles.input,
                          styles.passwordInput,
                          loading && styles.disabledInput,
                        ]}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        onPress={() => setShowNewPassword(p => !p)}
                        style={styles.showHideButton}
                        disabled={loading}
                        activeOpacity={0.7}>
                        {showNewPassword ? (
                          <Eye_off width={ms(24)} height={ms(24)} />
                        ) : (
                          <Eye_outline width={ms(24)} height={ms(24)} />
                        )}
                      </TouchableOpacity>
                    </View>

                    <AppText style={styles.label}>Confirm New Password</AppText>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        ref={confirmPasswordRef}
                        placeholder="Confirm New Password"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        onSubmitEditing={handleResetPassword}
                        returnKeyType="done"
                        style={[
                          styles.input,
                          styles.passwordInput,
                          loading && styles.disabledInput,
                        ]}
                        editable={!loading}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(p => !p)}
                        style={styles.showHideButton}
                        disabled={loading}
                        activeOpacity={0.7}>
                        {showConfirmPassword ? (
                          <Eye_off width={ms(24)} height={ms(24)} />
                        ) : (
                          <Eye_outline width={ms(24)} height={ms(24)} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>
          </ScrollView>

          {/* ── Primary action pinned to a fixed footer (same spot every step) ── */}
          <View style={styles.footer}>
            {loading ? (
              <View
                style={[
                  styles.primaryButton,
                  styles.footerButton,
                  styles.loadingButton,
                ]}>
                <ActivityIndicator color={colors.white} size="small" />
              </View>
            ) : step === 1 ? (
              <Button
                title="Send OTP"
                onPress={handleSendOtp}
                backgroundColor={colors.primary}
                textColor={colors.white}
                style={[
                  styles.primaryButton,
                  styles.footerButton,
                  isSendOtpDisabled && styles.disabledButton,
                ]}
                textStyle={styles.primaryButtonText}
                disabled={isSendOtpDisabled}
              />
            ) : step === 2 ? (
              // The invite flow is finished once both codes are in: its button
              // hands the driver to the sign-in screen rather than to step 3,
              // which it has already been through.
              <Button
                title={isLinkFlow ? 'Continue to Sign In' : 'Submit'}
                onPress={isLinkFlow ? goToLogin : handleSubmitOtp}
                backgroundColor={colors.primary}
                textColor={colors.white}
                style={[
                  styles.primaryButton,
                  styles.footerButton,
                  isSubmitDisabled && styles.disabledButton,
                ]}
                textStyle={styles.primaryButtonText}
                disabled={isSubmitDisabled}
              />
            ) : (
              <Button
                title="Confirm Password"
                onPress={handleResetPassword}
                backgroundColor={colors.primary}
                textColor={colors.white}
                style={[
                  styles.primaryButton,
                  styles.footerButton,
                  isResetPasswordDisabled && styles.disabledButton,
                ]}
                textStyle={styles.primaryButtonText}
                disabled={isResetPasswordDisabled}
              />
            )}
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>

      <ErrorModal {...modalProps} />
    </KeyboardAvoidingView>
  );
};

export default ResetPassword;
