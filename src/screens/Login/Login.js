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

import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import makeStyles from './Login.styles';
import {useNavigation} from '@react-navigation/native';
import Button from '../../component/Button/Button';
import {colors} from '../../theme/colors';
import Eye_off from '../../assets/svg_icon/eye-off.svg';
import Eye_outline from '../../assets/svg_icon/eye-outline.svg';
import TruckIcon from '../../assets/svg_icon/Frame.svg';
import StatusBar from '../../component/StatusBar/StatusBar';
import AppText from '../../theme/AppText';
import {ms, vs} from '../../theme/scale';
import React, {useState, useRef, useMemo, useEffect, useCallback} from 'react';
import BiometricLoginButton from '../../component/BiometricLoginButton/BiometricLoginButton';
import useDeviceType from '../../hooks/useDeviceType';
import {login, validateLogin, restoreSession} from '../../config/api';
import ErrorModal from '../../component/ErrorModal/ErrorModal';
import useErrorModal from '../../hooks/useErrorModal';

const Login = () => {
  const {isTablet} = useDeviceType();
  const {modalProps, showError, showMessage} = useErrorModal();
  const styles = useMemo(() => makeStyles(isTablet), [isTablet]);
  const navigation = useNavigation();
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  // Guards the state updates that follow an await, in case the user navigated
  // away (or the screen was reset) while the request was still running.
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const isLoginDisabled =
    loading || (!phone.trim() && !email.trim()) || !password.trim();

  const toggleShowPassword = () => {
    setShowPassword(prev => !prev);
  };

  // Signed in — drop Login from the stack so Back cannot return to it.
  const goToHome = useCallback(() => {
    navigation.reset({index: 0, routes: [{name: 'MainApp'}]});
  }, [navigation]);

  const handleLogin = useCallback(async () => {
    // Whichever field the user filled in is the identifier we send.
    const identifier = email.trim() || phone.trim();

    // Rules live in config/api.js; the screen only renders the verdict.
    const check = validateLogin(identifier, password);
    if (!check.ok) {
      showMessage({
        variant: 'warning',
        title: check.title,
        message: check.message,
      });
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      // login() stores the access + refresh tokens and resolves with the
      // session; anything else (bad credentials, network, a 200 without a
      // token) throws and we stay on this screen.
      const session = await login({identifier, password});
      if (!session?.accessToken) {
        throw new Error('Login failed. Please try again.');
      }

      if (!isMounted.current) return;
      goToHome();
    } catch (err) {
      if (!isMounted.current) return;
      showError(err, {
        title: 'Login Failed',
        confirmText: 'Retry',
        onConfirm: handleLogin,
      });
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [email, phone, password, showError, showMessage, goToHome]);

  // Biometrics only prove who is holding the phone — the stored session still
  // has to be valid (refreshing it if the access token expired) before we let
  // anyone into the app.
  const handleBiometricSuccess = useCallback(async () => {
    setLoading(true);
    try {
      const {authenticated, reason} = await restoreSession();
      if (!isMounted.current) return;

      if (authenticated) {
        goToHome();
        return;
      }
      showMessage({
        variant: 'warning',
        title: reason === 'offline' ? 'No Connection' : 'Login Required',
        message:
          reason === 'offline'
            ? 'Could not reach the server. Check your connection and try again.'
            : 'Your session has expired. Please log in with your password.',
      });
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [goToHome, showMessage]);

  const handleForgotPassword = () => {
    if (loading) return;
    navigation.navigate('ResetPassword');
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
            style={{backgroundColor: colors.white}}
            contentContainerStyle={[
              styles.container,
              {backgroundColor: colors.white},
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            alwaysBounceVertical={false}
            overScrollMode="never"
            contentInsetAdjustmentBehavior="never"
            endFillColor={colors.white}>
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

              <View style={styles.card} accessibilityLabel="Login form">
                <AppText style={styles.label}>Phone Number</AppText>
                <TextInput
                  placeholder="Enter your Phone Number"
                  placeholderTextColor={colors.placeholder || '#9CA3AF'}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={phone}
                  onChangeText={setPhone}
                  onSubmitEditing={() => emailRef.current?.focus()}
                  returnKeyType="next"
                  // Keep the keyboard up while focus moves to the next field
                  // (iOS otherwise dismisses and re-opens it).
                  submitBehavior="submit"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  style={[styles.input, loading && styles.disabledInput]}
                  accessibilityLabel="Phone number input"
                  editable={!loading}
                />

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <AppText style={styles.dividerText}>Or Login With</AppText>
                  <View style={styles.dividerLine} />
                </View>

                <AppText style={styles.label}>Email Address</AppText>
                <TextInput
                  ref={emailRef}
                  placeholder="Enter your Email Address"
                  placeholderTextColor={colors.placeholder || '#9CA3AF'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  returnKeyType="next"
                  submitBehavior="submit"
                  textContentType="emailAddress"
                  autoComplete="email"
                  style={[styles.input, loading && styles.disabledInput]}
                  accessibilityLabel="Email input"
                  editable={!loading}
                />

                <AppText style={styles.label}>Password</AppText>
                <View style={styles.passwordContainer}>
                  <TextInput
                    ref={passwordRef}
                    placeholder="Enter a password"
                    placeholderTextColor={colors.placeholder}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={password}
                    onChangeText={setPassword}
                    onSubmitEditing={handleLogin}
                    returnKeyType="done"
                    // Lets the iOS keychain offer the saved password here.
                    textContentType="password"
                    autoComplete="password"
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

                <View style={styles.buttonContainer}>
                  {loading ? (
                    <View style={[styles.primaryButton, styles.loadingButton]}>
                      <ActivityIndicator
                        color={colors.button_color}
                        size="small"
                      />
                    </View>
                  ) : (
                    <Button
                      title="Login"
                      onPress={handleLogin}
                      backgroundColor={colors.primary}
                      textColor={colors.white}
                      style={[
                        styles.primaryButton,
                        isLoginDisabled && styles.disabledButton,
                      ]}
                      textStyle={styles.primaryButtonText}
                      disabled={isLoginDisabled}
                    />
                  )}
                  <AppText style={styles.altLogin}>Or</AppText>
                  {/* Biometric Login Button */}
                  <BiometricLoginButton
                    buttonStyle={styles.biometricButton}
                    textStyle={styles.biometricButtonText}
                    iconColor={colors.primary}
                    loaderColor={colors.primary}
                    onSuccess={handleBiometricSuccess}
                    onError={err => {
                      if (err)
                        showError(err, {title: 'Biometric Login Failed'});
                    }}
                  />
                </View>
              </View>
            </View>
          </ScrollView>
          <ErrorModal {...modalProps} />
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default Login;
