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
import styles from './Login.styles';
import {useNavigation} from '@react-navigation/native';
import Button from '../../component/Button/Button';
import {colors} from '../../theme/colors';
import Eye_off from '../../assets/svg_icon/eye-off.svg';
import Eye_outline from '../../assets/svg_icon/eye-outline.svg';
import TruckIcon from '../../assets/svg_icon/truck-icon.svg';
import StatusBar from '../../component/StatusBar/StatusBar';
import AppText from '../../theme/AppText';
import {ms, vs} from '../../theme/scale';


const Login = () => {
  const navigation = useNavigation();
  const [loginMethod, setLoginMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef(null);
  const otpRefs = useRef([]);
  const otpValue = otpDigits.join('');

  const toggleShowPassword = () => {
    setShowPassword(prev => !prev);
  };

  useEffect(() => {
    if (!otpSent || otpTimer <= 0) return;
    const timerId = setTimeout(() => {
      setOtpTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearTimeout(timerId);
  }, [otpSent, otpTimer]);

  const resetOtpFlow = () => {
    setOtpDigits(['', '', '', '']);
    setOtpSent(false);
    setOtpTimer(0);
  };

  const switchLoginMethod = method => {
    setLoginMethod(method);
    setEmail('');
    setPhone('');
    setPassword('');
    resetOtpFlow();
  };

  const handleLogin = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?\d{10,15}$/;

    if (loginMethod === 'email') {
      if (!email.trim()) {
        Alert.alert('Required Field', 'Please enter your email address');
        return;
      }

      if (!emailRegex.test(email.trim())) {
        Alert.alert('Invalid Email', 'Please enter a valid email address');
        return;
      }
    } else {
      const fullPhone = `+1${phone.trim()}`;
      if (!phone.trim()) {
        Alert.alert('Required Field', 'Please enter your mobile number');
        return;
      }

      if (!phoneRegex.test(fullPhone)) {
        Alert.alert('Invalid Number', 'Please enter a valid mobile number');
        return;
      }

      if (!otpSent) {
        Alert.alert('OTP Required', 'Please request and enter the OTP');
        return;
      }

      if (!otpValue.trim() || otpValue.trim().length < 4) {
        Alert.alert('Invalid OTP', 'Please enter a valid OTP');
        return;
      }
    }

    if (loginMethod === 'email') {
      if (!password) {
        Alert.alert('Required Field', 'Please enter your password');
        return;
      }

      if (password.length < 4) {
        Alert.alert('Invalid Password', 'Password must be at least 4 characters');
        return;
      }
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

  const handleSendOtp = () => {
    const phoneRegex = /^\+?\d{10,15}$/;
    const fullPhone = `+1${phone.trim()}`;
    if (!phone.trim()) {
      Alert.alert('Required Field', 'Please enter your mobile number');
      return;
    }

    if (!phoneRegex.test(fullPhone)) {
      Alert.alert('Invalid Number', 'Please enter a valid mobile number');
      return;
    }

    if (loading) return;
    Keyboard.dismiss();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setOtpSent(true);
      setOtpDigits(['', '', '', '']);
      setOtpTimer(60);
      Alert.alert('OTP Sent', 'Please check your phone for the OTP');
    }, 800);
  };

  const handleVerifyOtp = () => {
    if (loading) return;
    if (!otpValue.trim() || otpValue.trim().length < 4) {
      Alert.alert('Invalid OTP', 'Please enter a valid OTP');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      navigation.reset({
        index: 0,
        routes: [{name: 'MainApp'}],
      });
    }, 800);
  };



  const getMobileButtonConfig = () => {
    if (!otpSent) {
      return {title: 'Send OTP', onPress: handleSendOtp};
    }

    if (otpTimer === 0 && !otpValue.trim()) {
      return {title: 'Resend OTP', onPress: handleSendOtp};
    }

    return {title: 'Verify & Login', onPress: handleVerifyOtp};
  };

  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    const nextDigits = [...otpDigits];
    nextDigits[index] = value;
    setOtpDigits(nextDigits);

    if (value && index < otpDigits.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (event, index) => {
    if (event.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };
  const handleForgotPassword = () => {
    if (loading) return;
    navigation.navigate('ForgotPassword');
  };

  const handleCreateAccount = () => {
    if (loading) return;
    navigation.navigate('CreateAccount');
  };

  const handleGoogleLogin = () => {
    if (loading) return;
    Alert.alert('Coming Soon', 'Google login will be available soon.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoiding}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : vs(20)}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.safe}>
          <StatusBar
            backgroundColor={colors.primary}
            barStyle="light-content"
            translucent={false}
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
                    <AppText style={styles.title}>Log In</AppText>
                    <AppText style={styles.subtitle}>
                      Login to continue using the app.
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

              <View
                style={styles.card}
                accessible
                accessibilityLabel="Login form">
                <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    loginMethod === 'email' && styles.tabActive,
                  ]}
                  onPress={() => switchLoginMethod('email')}
                  activeOpacity={0.8}
                  accessibilityRole="button">
                  <AppText
                    style={[
                      styles.tabText,
                      loginMethod === 'email' && styles.tabTextActive,
                    ]}>
                    Email
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    loginMethod === 'mobile' && styles.tabActive,
                  ]}
                  onPress={() => switchLoginMethod('mobile')}
                  activeOpacity={0.8}
                  accessibilityRole="button">
                  <AppText
                    style={[
                      styles.tabText,
                      loginMethod === 'mobile' && styles.tabTextActive,
                    ]}>
                    Phone Number
                  </AppText>
                </TouchableOpacity>
              </View>

              {loginMethod === 'email' ? (
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
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    returnKeyType="next"
                    style={[styles.input, loading && styles.disabledInput]}
                    accessibilityLabel="Email input"
                    editable={!loading}
                  />

                  <AppText style={styles.altLoginText}>Or Login With</AppText>

                  <AppText style={styles.label}>Phone Number</AppText>
                  <TextInput
                    placeholder="Enter your phone number"
                    placeholderTextColor={colors.placeholder || '#9CA3AF'}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={phone}
                    onChangeText={setPhone}
                    returnKeyType="next"
                    style={[styles.input, loading && styles.disabledInput]}
                    accessibilityLabel="Phone number input"
                    editable={!loading}
                  />

                  <AppText style={styles.label}>Password</AppText>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      ref={passwordRef}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.placeholder || '#9CA3AF'}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={password}
                      onChangeText={setPassword}
                      onSubmitEditing={handleLogin}
                      returnKeyType="done"
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

                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    style={styles.forgotPasswordContainer}
                    disabled={loading}
                    activeOpacity={0.7}>
                    <AppText style={styles.forgotPasswordText}>
                      Forgot Password?
                    </AppText>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <AppText style={styles.label}>Phone Number</AppText>
                  <TextInput
                    placeholder="Enter your phone number"
                    placeholderTextColor={colors.placeholder || '#9CA3AF'}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={phone}
                    onChangeText={setPhone}
                    onSubmitEditing={handleSendOtp}
                    returnKeyType="done"
                    style={[styles.input, loading && styles.disabledInput]}
                    accessibilityLabel="Mobile number input"
                    editable={!loading}
                  />

                  {otpSent && (
                    <View style={styles.otpBoxContainer}>
                      {otpDigits.map((digit, index) => (
                        <TextInput
                          key={`otp-${index}`}
                          ref={ref => {
                            otpRefs.current[index] = ref;
                          }}
                          placeholder="•"
                          placeholderTextColor={colors.placeholder || '#9CA3AF'}
                          keyboardType="number-pad"
                          autoCapitalize="none"
                          autoCorrect={false}
                          value={digit}
                          onChangeText={value => handleOtpChange(value, index)}
                          onKeyPress={event => handleOtpKeyPress(event, index)}
                          returnKeyType="done"
                          style={[
                            styles.otpBox,
                            loading && styles.disabledInput,
                          ]}
                          accessibilityLabel={`OTP digit ${index + 1}`}
                          editable={!loading}
                          maxLength={1}
                        />
                      ))}
                    </View>
                  )}

                  {otpSent && otpTimer > 0 && (
                    <AppText style={styles.otpTimerText}>
                      Resend available in {otpTimer}s
                    </AppText>
                  )}
                </>
              )}

              {loading ? (
                <View style={[styles.button, styles.loadingButton]}>
                  <ActivityIndicator
                    color={colors.text_color_button || '#fff'}
                    size="small"
                  />
                </View>
              ) : loginMethod === 'email' ? (
                <Button
                  title="Login"
                  onPress={handleLogin}
                  backgroundColor={colors.primary}
                  textColor={colors.white}
                  style={styles.primaryButton}
                  textStyle={styles.primaryButtonText}
                  disabled={loading}
                />
              ) : (
                <Button
                  title={getMobileButtonConfig().title}
                  onPress={getMobileButtonConfig().onPress}
                  backgroundColor={colors.primary}
                  textColor={colors.white}
                  style={styles.primaryButton}
                  textStyle={styles.primaryButtonText}
                  disabled={loading}
                />
              )}

                <AppText style={styles.altLoginText}>Or Login With</AppText>

                <Button
                  title="Sign In with Google"
                  onPress={handleGoogleLogin}
                  backgroundColor={colors.white}
                  textColor={colors.textOnLightStrong}
                  borderColor={colors.primary}
                  icon={require('../../assets/Image/google_icon.png')}
                  style={[styles.googleButton, loading && styles.disabledButton]}
                  textStyle={styles.googleText}
                  disabled={loading}
                />

                <View style={styles.signupRow}>
                  <AppText style={styles.signupText}>
                    Don’t have an account?
                  </AppText>
                  <TouchableOpacity
                    onPress={handleCreateAccount}
                    disabled={loading}
                    activeOpacity={0.7}>
                    <AppText style={styles.signupAction}> Sign Up</AppText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default Login;
