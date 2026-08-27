import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import React, {useState, useRef, useEffect} from 'react';
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
import AppText from '../../theme/AppText';
import {ms, vs} from '../../theme/scale';
import {
  validateNewPassword,
  verifyPasswordToken,
  setPasswordWithToken,
} from '../../config/api';
import type {
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from 'react-native';
import type {AppApiError, PasswordTokenInfo} from '../../types/api';
import type {RootStackScreenProps} from '../../types/navigation';

/** Which of the two OTP channels a handler is acting on. */
type OtpChannel = 'phone' | 'email';

// step 1 = phone / email form
// step 2 = otp verify (per channel)
// step 3 = new password
//
// The screen has two ways in:
//
//  * "Forgot Password" on the login screen — walks all three steps.
//  * The driver-invite link — arrives with `route.params.token` and jumps
//    straight to step 3. The emailed token is the credential, so there is
//    nothing to verify by OTP: the token is exchanged for the account up
//    front, and again for the password on submit.
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

  // Set only when the screen was opened from an emailed link. The driver has
  // no session and never typed a code — the token stands in for both.
  const {token: linkToken} = route.params || {};
  const isLinkFlow = Boolean(linkToken);

  const [step, setStep] = useState(isLinkFlow ? 3 : 1);

  // Link lifecycle: 'checking' while the token is being exchanged for the
  // account, 'ready' once the password form can be shown, 'dead' when no
  // amount of retrying will make this token work.
  const [linkState, setLinkState] = useState(isLinkFlow ? 'checking' : 'ready');
  const [linkAccount, setLinkAccount] = useState<PasswordTokenInfo | null>(
    null,
  );
  const [linkError, setLinkError] = useState('');

  // ── Step 1 identifiers ──
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

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

  // Resolve the token before showing the form: an expired link is then caught
  // while the fields are still empty, instead of after a password is typed
  // twice — and the driver can see the invite really is addressed to them.
  useEffect(() => {
    if (!isLinkFlow) return undefined;

    let cancelled = false;
    (async () => {
      try {
        const account = await verifyPasswordToken(linkToken as string);
        if (cancelled) return;
        setLinkAccount(account);
        setLinkState('ready');
      } catch (e) {
      const err = e as AppApiError;
        if (cancelled) return;
        setLinkError(err?.message || 'This link is not valid.');
        setLinkState('dead');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLinkFlow, linkToken]);

  const phoneOtpRefs = useRef<Array<TextInput | null>>([]);
  const emailOtpRefs = useRef<Array<TextInput | null>>([]);
  const emailInputRef = useRef<TextInput | null>(null);
  const confirmPasswordRef = useRef<TextInput | null>(null);

  const hasPhone = phone.trim().length > 0;
  const hasEmail = email.trim().length > 0;

  const isSendOtpDisabled = loading || (!hasPhone && !hasEmail);
  // Submit is enabled once every provided channel has been verified.
  const isSubmitDisabled =
    loading ||
    (!hasPhone && !hasEmail) ||
    (hasPhone && !phoneVerified) ||
    (hasEmail && !emailVerified);
  const isResetPasswordDisabled =
    loading || !newPassword.trim() || !confirmPassword.trim();

  // ── Channel helpers (keeps the two OTP blocks in one code path) ──
  const getChannel = (channel: OtpChannel) =>
    channel === 'phone'
      ? {
          value: phone,
          otp: phoneOtp,
          setOtp: setPhoneOtp,
          refs: phoneOtpRefs,
          verified: phoneVerified,
          setVerified: setPhoneVerified,
        }
      : {
          value: email,
          otp: emailOtp,
          setOtp: setEmailOtp,
          refs: emailOtpRefs,
          verified: emailVerified,
          setVerified: setEmailVerified,
        };

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
      Alert.alert('Required', 'Please enter a phone number or email address');
      return;
    }
    if (trimmedPhone && !PHONE_REGEX.test(trimmedPhone)) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number');
      return;
    }
    if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
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

  const handleResend = (channel: OtpChannel) => {
    const c = getChannel(channel);
    c.setOtp(EMPTY_OTP);
    c.setVerified(false);
    Alert.alert('OTP Sent', `A new code has been sent to ${c.value.trim()}.`);
  };

  const handleVerifyChannel = (channel: OtpChannel) => {
    const c = getChannel(channel);
    if (c.otp.join('').length !== 6) {
      Alert.alert('Invalid Code', 'Please enter all 6 digits');
      return;
    }
    Keyboard.dismiss();
    c.setVerified(true);
  };

  const handleSubmitOtp = () => {
    if (hasPhone && !phoneVerified) {
      Alert.alert('Verify Required', 'Please verify the code sent to your phone');
      return;
    }
    if (hasEmail && !emailVerified) {
      Alert.alert('Verify Required', 'Please verify the code sent to your email');
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
    }, 600);
  };

  const goToLogin = () =>
    navigation.reset({index: 0, routes: [{name: 'LoginScreen'}]});

  const handleResetPassword = async () => {
    // One rule set, shared with the backend contract — see validateNewPassword.
    const check = validateNewPassword(newPassword, confirmPassword);
    if (!check.ok) {
      Alert.alert(check.title, check.message);
      return;
    }

    Keyboard.dismiss();

    // The OTP path is still mocked end to end; only the link path is wired to
    // the backend today.
    if (!isLinkFlow) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        Alert.alert('Success', 'Password reset successfully!', [
          {text: 'Login', onPress: () => navigation.navigate('LoginScreen')},
        ]);
      }, 1000);
      return;
    }

    setLoading(true);
    try {
      const {session, message} = await setPasswordWithToken({
        token: linkToken as string,
        newPassword,
      });

      // The backend answered with a session, so the driver is already signed
      // in — sending them to a login form to retype the password they chose
      // two seconds ago is the one thing this flow exists to avoid.
      if (session) {
        navigation.reset({index: 0, routes: [{name: 'MainApp'}]});
        return;
      }

      Alert.alert(
        'Account Activated',
        message,
        [{text: 'Sign In', onPress: goToLogin}],
      );
    } catch (e) {
      const err = e as AppApiError;
      // A token that died between verify and submit (expired, or used on
      // another device) must retire the form, not just show a toast.
      if (err?.linkDead) {
        setLinkError(err.message);
        setLinkState('dead');
      } else {
        Alert.alert('Could Not Save', err?.message || 'Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // The emailed-link flow has no steps to announce, so it gets its own copy.
  const heroTitle = isLinkFlow
    ? 'Set Your Password'
    : step === 1
    ? 'Forgot Password'
    : step === 2
    ? 'Enter Verification Code'
    : 'Enter New Password';

  const heroSubtitle = isLinkFlow
    ? 'Welcome to MyShipr. Choose a password to finish activating your driver account.'
    : step === 1
    ? 'Enter the email or phone linked with your account.'
    : step === 2
    ? 'Enter the verification code'
    : 'Create a new password';

  // The password fields wait for the token to check out — offering them while
  // the link may already be dead only wastes the driver's typing.
  const showPasswordForm = step === 3 && (!isLinkFlow || linkState === 'ready');

  // ── One OTP block (used for both phone and email in step 2) ──
  const renderOtpBlock = (channel: OtpChannel) => {
    const c = getChannel(channel);
    const label = channel === 'phone' ? 'Phone Number' : 'Email Address';
    const isComplete = c.otp.join('').length === 6;
    const verifyDisabled = loading || c.verified || !isComplete;

    return (
      <View style={styles.otpBlock}>
        <AppText style={styles.otpSectionLabel}>{label}</AppText>
        <AppText style={styles.otpSentText}>
          Verification code sent to{' '}
          <AppText style={styles.otpSentValue}>{c.value.trim()}</AppText>
        </AppText>

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
                    colors.surfaceDarkPrimary,
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
                      placeholderTextColor={colors.placeholder || '#9CA3AF'}
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
                      placeholderTextColor={colors.placeholder || '#9CA3AF'}
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
                    {hasPhone && renderOtpBlock('phone')}
                    {hasEmail && renderOtpBlock('email')}
                  </>
                )}

                {/* ── Emailed link: resolving the token ── */}
                {isLinkFlow && linkState === 'checking' && (
                  <View style={styles.linkStatusBlock}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <AppText style={styles.linkStatusText}>
                      Checking your link…
                    </AppText>
                  </View>
                )}

                {/* ── Emailed link: expired, already used, or never valid ── */}
                {isLinkFlow && linkState === 'dead' && (
                  <View style={styles.linkStatusBlock}>
                    <AppText style={styles.linkErrorTitle}>
                      This link no longer works
                    </AppText>
                    <AppText style={styles.linkErrorText}>{linkError}</AppText>
                  </View>
                )}

                {/* Naming the account makes it obvious the invite is theirs,
                    and catches a link forwarded to the wrong driver. */}
                {showPasswordForm &&
                isLinkFlow &&
                (linkAccount?.fullName ||
                  linkAccount?.email ||
                  linkAccount?.phoneNumber) ? (
                  <View style={styles.linkAccountBanner}>
                    <AppText style={styles.linkAccountLabel}>
                      Setting the password for
                    </AppText>
                    <AppText style={styles.linkAccountValue}>
                      {[
                        linkAccount.fullName,
                        linkAccount.email || linkAccount.phoneNumber,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </AppText>
                  </View>
                ) : null}

                {/* ── STEP 3: New Password ── */}
                {showPasswordForm && (
                  <>
                    <AppText style={styles.label}>New Password</AppText>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        placeholder="Create New Password"
                        placeholderTextColor={colors.placeholder || '#9CA3AF'}
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
                        placeholderTextColor={colors.placeholder || '#9CA3AF'}
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
            {isLinkFlow && linkState === 'dead' ? (
              <Button
                title="Back to Sign In"
                onPress={goToLogin}
                backgroundColor={colors.primary}
                textColor={colors.white}
                style={[styles.primaryButton, styles.footerButton]}
                textStyle={styles.primaryButtonText}
              />
            ) : isLinkFlow && linkState === 'checking' ? null : loading ? (
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
              <Button
                title="Submit"
                onPress={handleSubmitOtp}
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
    </KeyboardAvoidingView>
  );
};

export default ResetPassword;
