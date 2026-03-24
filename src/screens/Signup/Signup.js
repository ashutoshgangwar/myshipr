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
import {scale, verticalScale, moderateScale} from 'react-native-size-matters';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import styles from './Signup.styles';
import {useNavigation} from '@react-navigation/native';
import Button from '../../component/Button/Button';
import {colors} from '../../theme/colors';
import Eye_off from '../../assets/svg_icon/eye-off.svg';
import Eye_outline from '../../assets/svg_icon/eye-outline.svg';
import Refresh_Icon from '../../assets/svg_icon/Refresh.svg'
import TruckIcon from '../../assets/svg_icon/Frame.svg';
import StatusBar from '../../component/StatusBar/StatusBar';
import AppText from '../../theme/AppText';
import {ms, vs} from '../../theme/scale';

const Signup = () => {
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', '']);
  const [mobileOtp, setMobileOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState('');
  const [generatedCaptcha, setGeneratedCaptcha] = useState('4 X w r Q');
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const phoneRef = useRef(null);
  const emailOtpRefs = useRef([]);
  const mobileOtpRefs = useRef([]);

  const toggleShowPassword = () => {
    setShowPassword(prev => !prev);
  };
  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(prev => !prev);
  };

  const handleSendEmailOtp = () => {
    if (loading) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      Alert.alert('Required Field', 'Please enter email first');
      return;
    }

    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setEmailOtpSent(true);
    setEmailOtp(['', '', '', '', '', '']);
    Alert.alert('OTP Sent', 'Email OTP sent successfully.');
  };

  const handleSendMobileOtp = () => {
    if (loading) return;
    const phoneRegex = /^\+?\d{10,15}$/;

    if (!phone.trim()) {
      Alert.alert('Required Field', 'Please enter mobile number first');
      return;
    }

    if (!phoneRegex.test(phone.trim())) {
      Alert.alert('Invalid Number', 'Please enter a valid mobile number');
      return;
    }

    setMobileOtpSent(true);
    setMobileOtp(['', '', '', '', '', '']);
    Alert.alert('OTP Sent', 'Mobile OTP sent successfully.');
  };

  const handleOtpChange = (value, index, otp, setOtp, refs) => {
    if (!/^\d?$/.test(value)) return;

    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);

    if (value && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, index, otp, refs) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const refreshCaptcha = () => {
    setGeneratedCaptcha(generateCaptcha());
    setCaptcha('');
  };

  const handleLogin = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?\d{10,15}$/;

    if (!email.trim() && !phone.trim()) {
      Alert.alert('Required Field', 'Please enter email or mobile number');
      return;
    }

    if (email.trim() && !emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (phone.trim() && !phoneRegex.test(phone.trim())) {
      Alert.alert('Invalid Number', 'Please enter a valid mobile number');
      return;
    }

    if (emailOtpSent && emailOtp.join('').length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter 6-digit email OTP');
      return;
    }

    if (mobileOtpSent && mobileOtp.join('').length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter 6-digit mobile OTP');
      return;
    }

    if (!password) {
      Alert.alert('Required Field', 'Please enter your password');
      return;
    }

    if (password.length < 4) {
      Alert.alert('Invalid Password', 'Password must be at least 4 characters');
      return;
    }

    if (!confirmPassword) {
      Alert.alert('Required Field', 'Please confirm your password');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    if (!captcha.trim()) {
      Alert.alert('Required Field', 'Please enter captcha');
      return;
    }

    if (captcha.trim().toUpperCase() !== generatedCaptcha) {
      Alert.alert('Invalid Captcha', 'Captcha does not match. Please try again.');
      refreshCaptcha();
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // TODO: Replace with real authentication logic
      navigation.reset({
        index: 0,
        routes: [{name: 'CdlDriverOnboarding'}],
      });
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
                    <AppText style={styles.title}>Sign Up</AppText>
                    <AppText style={styles.subtitle}>
                      Enter your details below to continue.
                    </AppText>

                    <TouchableOpacity
                      style={styles.roleBadge}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel="Carrier role selected">
                      <AppText style={styles.roleBadgeText}>CARRIER</AppText>
                      <TruckIcon width={ms(20)} height={ms(20)} />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>

              <View style={styles.card} accessibilityLabel="Signup form">
                <AppText style={styles.label}>First Name</AppText>
                <TextInput
                  placeholder="Enter your first name"
                  placeholderTextColor={colors.placeholder || '#9CA3AF'}
                  keyboardType="default"
                  autoCapitalize="words"
                  autoCorrect={false}
                  value={firstName}
                  onChangeText={setFirstName}
                  onSubmitEditing={() => phoneRef.current?.focus()}
                  returnKeyType="next"
                  style={[styles.input, loading && styles.disabledInput]}
                  accessibilityLabel="First name input"
                  editable={!loading}
                />
                <AppText style={styles.label}>Last Name</AppText>
                <TextInput
                  placeholder="Enter your last name"
                  placeholderTextColor={colors.placeholder || '#9CA3AF'}
                  keyboardType="default"
                  autoCapitalize="words"
                  autoCorrect={false}
                  value={lastName}
                  onChangeText={setLastName}
                  onSubmitEditing={() => phoneRef.current?.focus()}
                  returnKeyType="next"
                  style={[styles.input, loading && styles.disabledInput]}
                  accessibilityLabel="Last name input"
                  editable={!loading}
                />
                <AppText style={styles.label}>Email</AppText>
                <View style={styles.optionalContainer}>
                  <TextInput
                    placeholder="Enter your email"
                    placeholderTextColor={colors.placeholder || '#9CA3AF'}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                    onSubmitEditing={() => phoneRef.current?.focus()}
                    returnKeyType="next"
                    style={[
                      styles.input,
                      styles.inlineInput,
                      loading && styles.disabledInput,
                    ]}
                    accessibilityLabel="Email input"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={handleSendEmailOtp}
                    style={styles.sendOtpButton}
                    disabled={loading}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={
                      emailOtpSent ? 'Resend email OTP' : 'Send email OTP'
                    }>
                    <AppText style={styles.sendOtpText}>
                      {emailOtpSent ? 'Resend' : 'Send OTP'}
                    </AppText>
                  </TouchableOpacity>
                </View>

                {emailOtpSent && (
                  <View style={styles.otpRow}>
                    <AppText style={styles.otpLabel}>
                      Email Verification Code
                    </AppText>
                    <View style={styles.otpBoxContainer}>
                      {emailOtp.map((digit, index) => (
                        <TextInput
                          key={`email-otp-${index}`}
                          ref={ref => {
                            emailOtpRefs.current[index] = ref;
                          }}
                          value={digit}
                          onChangeText={value =>
                            handleOtpChange(
                              value,
                              index,
                              emailOtp,
                              setEmailOtp,
                              emailOtpRefs,
                            )
                          }
                          onKeyPress={e =>
                            handleOtpKeyPress(e, index, emailOtp, emailOtpRefs)
                          }
                          keyboardType="number-pad"
                          maxLength={1}
                          style={[
                            styles.otpBox,
                            loading && styles.disabledInput,
                          ]}
                          editable={!loading}
                          returnKeyType={index === 5 ? 'done' : 'next'}
                        />
                      ))}
                    </View>
                  </View>
                )}

                <AppText style={styles.label}>Mobile Number</AppText>
                <View style={styles.optionalContainer}>
                  <TextInput
                    ref={phoneRef}
                    placeholder="Enter your mobile number"
                    placeholderTextColor={colors.placeholder || '#9CA3AF'}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={phone}
                    onChangeText={setPhone}
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    returnKeyType="next"
                    style={[
                      styles.input,
                      styles.inlineInput,
                      loading && styles.disabledInput,
                    ]}
                    accessibilityLabel="Mobile number input"
                    editable={!loading}
                  />
                  <TouchableOpacity
                    onPress={handleSendMobileOtp}
                    style={styles.sendOtpButton}
                    disabled={loading}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={
                      mobileOtpSent ? 'Resend mobile OTP' : 'Send mobile OTP'
                    }>
                    <AppText style={styles.sendOtpText}>
                      {mobileOtpSent ? 'Resend' : 'Send OTP'}
                    </AppText>
                  </TouchableOpacity>
                </View>

                {mobileOtpSent && (
                  <View style={styles.otpRow}>
                    <AppText style={styles.otpLabel}>
                      Mobile Verification Code
                    </AppText>
                    <View style={styles.otpBoxContainer}>
                      {mobileOtp.map((digit, index) => (
                        <TextInput
                          key={`mobile-otp-${index}`}
                          ref={ref => {
                            mobileOtpRefs.current[index] = ref;
                          }}
                          value={digit}
                          onChangeText={value =>
                            handleOtpChange(
                              value,
                              index,
                              mobileOtp,
                              setMobileOtp,
                              mobileOtpRefs,
                            )
                          }
                          onKeyPress={e =>
                            handleOtpKeyPress(
                              e,
                              index,
                              mobileOtp,
                              mobileOtpRefs,
                            )
                          }
                          keyboardType="number-pad"
                          maxLength={1}
                          style={[
                            styles.otpBox,
                            loading && styles.disabledInput,
                          ]}
                          editable={!loading}
                          returnKeyType={index === 5 ? 'done' : 'next'}
                        />
                      ))}
                    </View>
                  </View>
                )}

                <AppText style={styles.label}>Password</AppText>
                <View style={styles.passwordContainer}>
                  <TextInput
                    ref={passwordRef}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.placeholder}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={password}
                    onChangeText={setPassword}
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                    returnKeyType="next"
                    style={[
                      styles.input,
                      styles.passwordInput,
                      loading && styles.disabledInput,
                    ]}
                    accessibilityLabel="Password input"
                    editable={!loading}
                  />

                  <TouchableOpacity
                    onPress={toggleShowPassword}
                    style={styles.showHideButton}
                    disabled={loading}
                    activeOpacity={0.7}
                    accessibilityLabel={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    accessibilityRole="button">
                    {showPassword ? (
                      <Eye_off width={ms(24)} height={ms(24)} />
                    ) : (
                      <Eye_outline width={ms(24)} height={ms(24)} />
                    )}
                  </TouchableOpacity>
                </View>

                <AppText style={styles.label}> Confirm Password</AppText>
                <View style={styles.passwordContainer}>
                  <TextInput
                    ref={confirmPasswordRef}
                    placeholder="Confirm your password"
                    placeholderTextColor={colors.placeholder}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onSubmitEditing={handleLogin}
                    returnKeyType="done"
                    style={[
                      styles.input,
                      styles.passwordInput,
                      loading && styles.disabledInput,
                    ]}
                    accessibilityLabel="Confirm password input"
                    editable={!loading}
                  />

                  <TouchableOpacity
                    onPress={toggleShowConfirmPassword}
                    style={styles.showHideButton}
                    disabled={loading}
                    activeOpacity={0.7}
                    accessibilityLabel={
                      showConfirmPassword ? 'Hide password' : 'Show password'
                    }
                    accessibilityRole="button">
                    {showConfirmPassword ? (
                      <Eye_off width={ms(24)} height={ms(24)} />
                    ) : (
                      <Eye_outline width={ms(24)} height={ms(24)} />
                    )}
                  </TouchableOpacity>
                </View>

                <AppText style={styles.label}>Captcha</AppText>
                <View style={styles.captchaContainer}>
                  <TextInput
                    placeholder="Enter captcha"
                    placeholderTextColor={colors.placeholder || '#9CA3AF'}
                    keyboardType="default"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    value={captcha}
                    onChangeText={setCaptcha}
                    onSubmitEditing={handleLogin}
                    returnKeyType="done"
                    style={[styles.input, styles.captchaInput, loading && styles.disabledInput]}
                    accessibilityLabel="Captcha input"
                    editable={!loading}
                  />

                  <View style={styles.captchaRightContainer}>
                    <View style={styles.captchaCodeBox}>
                      <AppText style={styles.captchaCodeText}>
                        {generatedCaptcha}
                      </AppText>
                      <TouchableOpacity
                        onPress={refreshCaptcha}
                        style={styles.captchaRefreshButton}
                        disabled={loading}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel="Refresh captcha">
                            <Refresh_Icon width={moderateScale(18)} height={moderateScale(18)} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
               

                {loading ? (
                  <View style={[styles.button, styles.loadingButton]}>
                    <ActivityIndicator
                      color={colors.text_color_button || '#fff'}
                      size="small"
                    />
                  </View>
                ) : (
                  <Button
                    title="Sign Up"
                    onPress={handleLogin}
                    backgroundColor={colors.primary}
                    textColor={colors.white}
                    style={styles.primaryButton}
                    textStyle={styles.primaryButtonText}
                    disabled={loading}
                  />
                )}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default Signup;
