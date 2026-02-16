import {
  View,
  Text,
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
import styles from './Login.styles';
import {useNavigation} from '@react-navigation/native';
import Button from '../../component/Button/Button';
import {colors} from '../../theme/colors';
import Eye_off from '../../assets/svg_icon/eye-off.svg';
import Eye_outline from '../../assets/svg_icon/eye-outline.svg';
import StatusBar from '../../component/StatusBar/StatusBar';


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
        routes: [{name: 'CdlDriverOnboarding'}],
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

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.safe}>
          <StatusBar
            backgroundColor={colors.white}
            barStyle="dark-content"
            translucent={false}
          />
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Logo Section */}
            <View style={styles.topSection}>
              <Image
                source={require('../../assets/Image/logo.png')}
                style={styles.image}
                resizeMode="contain"
              />
            </View>

            {/* Login Card */}
            <View
              style={styles.card}
              accessible
              accessibilityLabel="Login form">
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                {loginMethod === 'email'
                  ? 'Login with your email'
                  : 'Login with your mobile number'}
              </Text>

              {/* Login Method Tabs */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    loginMethod === 'email' && styles.tabActive,
                  ]}
                  onPress={() => switchLoginMethod('email')}
                  activeOpacity={0.8}
                  accessibilityRole="button">
                  <Text
                    style={[
                      styles.tabText,
                      loginMethod === 'email' && styles.tabTextActive,
                    ]}>
                    Email
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.tab,
                    loginMethod === 'mobile' && styles.tabActive,
                  ]}
                  onPress={() => switchLoginMethod('mobile')}
                  activeOpacity={0.8}
                  accessibilityRole="button">
                  <Text
                    style={[
                      styles.tabText,
                      loginMethod === 'mobile' && styles.tabTextActive,
                    ]}>
                    Mobile
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Email or Mobile Input */}
              {loginMethod === 'email' ? (
                <>
                  <TextInput
                    placeholder="Email Address"
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

                  {/* Password Input with Toggle */}
                  <View style={styles.passwordContainer}>
                    <TextInput
                      ref={passwordRef}
                      placeholder="Password"
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
                        <Eye_off width={25} height={25} />
                      ) : (
                        <Eye_outline width={25} height={25} />
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Forgot Password */}
                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    style={styles.forgotPasswordContainer}
                    disabled={loading}
                    activeOpacity={0.7}>
                    <Text style={styles.forgotPasswordText}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.phoneInputContainer}>
                    <Text style={styles.countryCode}>+1</Text>
                    <View style={styles.countryDivider} />
                    <TextInput
                      placeholder="Mobile Number"
                      placeholderTextColor={colors.placeholder || '#9CA3AF'}
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={phone}
                      onChangeText={setPhone}
                      onSubmitEditing={handleSendOtp}
                      returnKeyType="done"
                      style={[
                        styles.phoneInput,
                        loading && styles.disabledInput,
                      ]}
                      accessibilityLabel="Mobile number input"
                      editable={!loading}
                    />
                  </View>

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
                    <Text style={styles.otpTimerText}>
                      Resend available in {otpTimer}s
                    </Text>
                  )}
                </>
              )}

              {/* Login Button */}
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
                  textColor={colors.text_color_button}
                  backgroundColor={colors.button_color}
                />
              ) : (
                <Button
                  title={getMobileButtonConfig().title}
                  onPress={getMobileButtonConfig().onPress}
                  textColor={colors.text_color_button}
                  backgroundColor={colors.button_color}
                />
              )}

              {/* OR Divider */}
              <View style={styles.orContainer}>
                <View style={styles.line} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.line} />
              </View>

              {/* Google Login Button */}
              {/* <TouchableOpacity
                style={[styles.googleButton, loading && styles.disabledButton]}
                onPress={handleGoogleLogin}
                disabled={loading}
                activeOpacity={0.8}
                accessibilityLabel="Continue with Google"
                accessibilityRole="button">
                <Image
                  source={require('../../assets/Image/google_icon.png')}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleText}>Continue with Google</Text>
              </TouchableOpacity> */}

              <Button
                title="Create Account"
                onPress={handleCreateAccount}
                textColor={colors.whi}
                backgroundColor={colors.primary}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default Login;
