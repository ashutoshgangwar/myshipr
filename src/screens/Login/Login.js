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
import styles from './Login.styles';
import {useNavigation} from '@react-navigation/native';
import Button from '../../component/Button/Button';
import {colors} from '../../theme/colors';
import Eye_off from '../../assets/svg_icon/eye-off.svg';
import Eye_outline from '../../assets/svg_icon/eye-outline.svg';
import TruckIcon from '../../assets/svg_icon/Frame.svg';
import StatusBar from '../../component/StatusBar/StatusBar';
import AppText from '../../theme/AppText';
import {ms, vs} from '../../theme/scale';

const Login = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef(null);
  const phoneRef = useRef(null);

  const toggleShowPassword = () => {
    setShowPassword(prev => !prev);
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

    if (!password) {
      Alert.alert('Required Field', 'Please enter your password');
      return;
    }

    if (password.length < 4) {
      Alert.alert('Invalid Password', 'Password must be at least 4 characters');
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
  const handleForgotPassword = () => {
    if (loading) return;
    navigation.navigate('ForgotPassword');
  };

  const handleCreateAccount = () => {
    if (loading) return;
    navigation.navigate('SignupScreen');
  };

  const handleGoogleLogin = () => {
    if (loading) return;
    Alert.alert('Coming Soon', 'Google login will be available soon.');
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
                accessibilityLabel="Login form">
                <AppText style={styles.label}>Email</AppText>
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
                  style={[styles.input, loading && styles.disabledInput]}
                  accessibilityLabel="Email input"
                  editable={!loading}
                />

                <AppText style={styles.altLoginText}>
                  Or Login with
                </AppText>

                <AppText style={styles.label}>Mobile Number</AppText>
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
                  style={[styles.input, loading && styles.disabledInput]}
                  accessibilityLabel="Mobile number input"
                  editable={!loading}
                />

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

                {loading ? (
                  <View style={[styles.button, styles.loadingButton]}>
                    <ActivityIndicator
                      color={colors.text_color_button || '#fff'}
                      size="small"
                    />
                  </View>
                ) : (
                  <Button
                    title="Login"
                    onPress={handleLogin}
                    backgroundColor={colors.primary}
                    textColor={colors.white}
                    style={styles.primaryButton}
                    textStyle={styles.primaryButtonText}
                    disabled={loading}
                  />
                )}

                <AppText style={styles.altLogin}>Or Login With</AppText>

                <Button
                  title="Sign In with Google"
                  onPress={handleGoogleLogin}
                  backgroundColor={colors.white}
                  textColor={colors.textOnLightStrong}
                  borderColor={colors.primary}
                  icon={require('../../assets/Image/google_icon.png')}
                  style={[
                    styles.googleButton,
                    loading && styles.disabledButton,
                  ]}
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
