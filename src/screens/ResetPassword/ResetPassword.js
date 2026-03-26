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

// step 1 = email/phone form
// step 2 = otp verify
// step 3 = new password

const ResetPassword = () => {
  const navigation = useNavigation();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const otpRefs = useRef([]);
  const confirmPasswordRef = useRef(null);
  const isSendOtpDisabled = loading || (!email.trim() && !phoneNumber.trim());
  const isVerifyOtpDisabled = loading || otpVerified || otp.join('').length !== 6;
  const isResetPasswordDisabled =
    loading || !newPassword.trim() || !confirmPassword.trim();

  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    if (otpVerified) {
      setOtpVerified(false);
    }
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleSendOtp = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?\d{10,15}$/;

    if (!email.trim() && !phoneNumber.trim()) {
      Alert.alert('Required', 'Please enter email or phone number');
      return;
    }
    if (email.trim() && !emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }
    if (phoneNumber.trim() && !phoneRegex.test(phoneNumber.trim())) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOtpVerified(false);
      setOtp(['', '', '', '', '', '']);
      setStep(2);
    }, 800);
  };

  const handleResendOtp = () => {
    setOtpVerified(false);
    setOtp(['', '', '', '', '', '']);
    Alert.alert('OTP Sent', 'A new OTP has been sent.');
  };

  const handleVerifyOtp = () => {
    if (otp.join('').length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter all 6 digits');
      return;
    }
    Keyboard.dismiss();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setOtpVerified(true);
      setTimeout(() => {
        setOtpVerified(false);
        setStep(3);
      }, 3000);
    }, 800);
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
      Alert.alert('Weak Password', 'Password must include a number and a special character');
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
        {text: 'Login', onPress: () => navigation.navigate('Login')},
      ]);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoiding}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? vs(6) : 0}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView
          style={styles.safe}
          edges={Platform.OS === 'ios' ? ['bottom'] : ['top', 'bottom']}>
          <StatusBar
            backgroundColor={
              Platform.OS === 'ios' ? 'transparent' : colors.primary
            }
            barStyle="light-content"
            translucent={true}
            hidden={Platform.OS === 'ios'}
          />
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
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
                        ? 'Forgot Password?'
                        : step === 2
                        ? 'Verification Code'
                        : 'Create Password'}
                    </AppText>
                    <AppText style={styles.subtitle}>
                      {step === 1
                        ? 'Enter the email or phone linked with your account.'
                        : step === 2
                        ? 'Enter the verification code.'
                        : 'Your new password must be unique from those previously used.'}
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

                {/* ── STEP 1: Email / Phone ── */}
                {step === 1 && (
                  <>
                    <AppText style={styles.label}>Email</AppText>
                    <TextInput
                      placeholder="Enter your email"
                      placeholderTextColor={colors.placeholder || '#9CA3AF'}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={email}
                      onChangeText={setEmail}
                      returnKeyType="next"
                      style={[styles.input, loading && styles.disabledInput]}
                      editable={!loading}
                    />

                    <AppText style={styles.orText}>Or Login With</AppText>

                    <AppText style={styles.label}>Phone Number</AppText>
                    <TextInput
                      placeholder="Enter your phone number"
                      placeholderTextColor={colors.placeholder || '#9CA3AF'}
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={phoneNumber}
                      onChangeText={setPhoneNumber}
                      returnKeyType="done"
                      style={[styles.input, loading && styles.disabledInput]}
                      editable={!loading}
                    />

                    {loading ? (
                      <View style={[styles.button, styles.loadingButton]}>
                        <ActivityIndicator color={colors.white} size="small" />
                      </View>
                    ) : (
                      <Button
                        title="Send OTP"
                        onPress={handleSendOtp}
                        backgroundColor={colors.primary}
                        textColor={colors.white}
                        style={[
                          styles.primaryButton,
                          isSendOtpDisabled && styles.disabledButton,
                        ]}
                        textStyle={styles.primaryButtonText}
                        disabled={isSendOtpDisabled}
                      />
                    )}
                  </>
                )}

                {/* ── STEP 2: OTP Verify ── */}
                {step === 2 && (
                  <>
                    <AppText style={styles.otpLabel}>Enter Verification Code</AppText>
                    <View style={styles.otpBoxContainer}>
                      {otp.map((digit, index) => (
                        <TextInput
                          key={index}
                          ref={ref => {otpRefs.current[index] = ref;}}
                          value={digit}
                          onChangeText={value => handleOtpChange(value, index)}
                          onKeyPress={e => handleOtpKeyPress(e, index)}
                          keyboardType="number-pad"
                          maxLength={1}
                          style={[styles.otpBox, loading && styles.disabledInput]}
                          editable={!loading && !otpVerified}
                          returnKeyType={index === 5 ? 'done' : 'next'}
                        />
                      ))}
                    </View>

                      {otpVerified && (
                        <View style={styles.otpSuccessContainer}>
                          <AppText style={styles.otpSuccessText}>
                            OTP verified successfully
                          </AppText>
                        </View>
                      )}

                    {!otpVerified && (
                      <View style={styles.resendRow}>
                        <AppText style={styles.resendText}>
                          Didn't receive the verification code?{' '}
                        </AppText>
                        <TouchableOpacity
                          onPress={handleResendOtp}
                          disabled={loading || otpVerified}
                          activeOpacity={0.7}>
                          <AppText style={styles.resendLink}>Resend</AppText>
                        </TouchableOpacity>
                      </View>
                    )}

                    {loading ? (
                      <View style={[styles.button, styles.loadingButton]}>
                        <ActivityIndicator color={colors.white} size="small" />
                      </View>
                    ) : (
                      <Button
                        title="Verify"
                        onPress={handleVerifyOtp}
                        backgroundColor={colors.primary}
                        textColor={colors.white}
                        style={[
                          styles.primaryButton,
                          isVerifyOtpDisabled && styles.disabledButton,
                        ]}
                        textStyle={styles.primaryButtonText}
                        disabled={isVerifyOtpDisabled}
                      />
                    )}
                  </>
                )}

                {/* ── STEP 3: New Password ── */}
                {step === 3 && (
                  <>
                    <AppText style={styles.label}>New Password</AppText>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        placeholder="Enter new password"
                        placeholderTextColor={colors.placeholder || '#9CA3AF'}
                        secureTextEntry={!showNewPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                        returnKeyType="next"
                        style={[styles.input, styles.passwordInput, loading && styles.disabledInput]}
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

                    <AppText style={styles.label}>Confirm Password</AppText>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        ref={confirmPasswordRef}
                        placeholder="Confirm new password"
                        placeholderTextColor={colors.placeholder || '#9CA3AF'}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        onSubmitEditing={handleResetPassword}
                        returnKeyType="done"
                        style={[styles.input, styles.passwordInput, loading && styles.disabledInput]}
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

                    <AppText style={styles.passwordHint}>
                      Password must be at least 8 characters, including a number and a special character.
                    </AppText>

                    {loading ? (
                      <View style={[styles.button, styles.loadingButton]}>
                        <ActivityIndicator color={colors.white} size="small" />
                      </View>
                    ) : (
                      <Button
                        title="Reset Password"
                        onPress={handleResetPassword}
                        backgroundColor={colors.primary}
                        textColor={colors.white}
                        style={[
                          styles.primaryButton,
                          isResetPasswordDisabled && styles.disabledButton,
                        ]}
                        textStyle={styles.primaryButtonText}
                        disabled={isResetPasswordDisabled}
                      />
                    )}
                  </>
                )}

              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default ResetPassword;
