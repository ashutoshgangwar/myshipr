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
import React, {useState, useRef} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import styles from './ResetPassword.styles';
import {useNavigation} from '@react-navigation/native';
import Button from '../../component/Button/Button';
import {colors} from '../../theme/colors';
import Eye_off from '../../assets/svg_icon/eye-off.svg';
import Eye_outline from '../../assets/svg_icon/eye-outline.svg';
import TruckIcon from '../../assets/svg_icon/Frame.svg';
import StatusBar from '../../component/StatusBar/StatusBar';
import AppText from '../../theme/AppText';
import {ms, vs} from '../../theme/scale';

// step 1 = phone / email form
// step 2 = otp verify (per channel)
// step 3 = new password

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?\d{10,15}$/;
const EMPTY_OTP = ['', '', '', '', '', ''];

const ResetPassword = () => {
  const navigation = useNavigation();

  const [step, setStep] = useState(1);

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

  const phoneOtpRefs = useRef([]);
  const emailOtpRefs = useRef([]);
  const emailInputRef = useRef(null);
  const confirmPasswordRef = useRef(null);

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
  const getChannel = channel =>
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

  const handleOtpChange = (value, index, channel) => {
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

  const handleOtpKeyPress = (e, index, channel) => {
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

  const handleResend = channel => {
    const c = getChannel(channel);
    c.setOtp(EMPTY_OTP);
    c.setVerified(false);
    Alert.alert('OTP Sent', `A new code has been sent to ${c.value.trim()}.`);
  };

  const handleVerifyChannel = channel => {
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

  const handleResetPassword = () => {
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])/;
    if (!newPassword) {
      Alert.alert('Required', 'Please enter a new password');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters');
      return;
    }
    if (!passwordRegex.test(newPassword)) {
      Alert.alert(
        'Weak Password',
        'Password must include a number and a special character',
      );
      return;
    }
    if (!confirmPassword) {
      Alert.alert('Required', 'Please confirm your password');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Password reset successfully!', [
        {text: 'Login', onPress: () => navigation.navigate('LoginScreen')},
      ]);
    }, 1000);
  };

  // ── One OTP block (used for both phone and email in step 2) ──
  const renderOtpBlock = channel => {
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
                    <AppText style={styles.title}>
                      {step === 1
                        ? 'Forgot Password'
                        : step === 2
                        ? 'Enter Verification Code'
                        : 'Enter New Password'}
                    </AppText>
                    <AppText style={styles.subtitle}>
                      {step === 1
                        ? 'Enter the email or phone linked with your account.'
                        : step === 2
                        ? 'Enter the verification code'
                        : 'Create a new password'}
                    </AppText>
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

                {/* ── STEP 3: New Password ── */}
                {step === 3 && (
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
