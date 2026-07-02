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

import DeviceInfo from 'react-native-device-info';
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
import React, { useState, useRef, useMemo } from 'react';
import BiometricLoginButton from '../../component/BiometricLoginButton/BiometricLoginButton';
import useDeviceType from '../../hooks/useDeviceType';

const Login = () => {
  const {isTablet} = useDeviceType();
  const styles = useMemo(() => makeStyles(isTablet), [isTablet]);
  const [deviceId, setDeviceId] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef(null);
  const isLoginDisabled =
    loading || !email.trim() || !password.trim();


    console.log('device name', deviceName);
    console.log('device id', deviceId);


    
    
  
  // Fetch device info only once on mount
  React.useEffect(() => {
    let mounted = true;
    const fetchDeviceInfo = async () => {
      try {
        const id = await DeviceInfo.getBrand();
        const name = await DeviceInfo.getDeviceName();
        if (mounted) {
          setDeviceId(id);
          setDeviceName(name);
        }
      } catch (e) {
        if (mounted) {
          setDeviceId('Unavailable');
          setDeviceName('Unavailable');
        }
      }
    };
    fetchDeviceInfo();
    return () => { mounted = false; };
  }, []);

  const toggleShowPassword = () => {
    setShowPassword(prev => !prev);
  };

  const handleLogin = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+?\d{10,15}$/; 

    const identifier = email.trim();

    if (!identifier) {
      Alert.alert('Required Field', 'Please enter email or mobile number');
      return;
    }

    // The single field accepts either an email or a phone number.
    const isEmail = identifier.includes('@');
    if (isEmail) {
      if (!emailRegex.test(identifier)) {
        Alert.alert('Invalid Email', 'Please enter a valid email address');
        return;
      }
    } else if (!phoneRegex.test(identifier)) {
      Alert.alert('Invalid Input', 'Please enter a valid email or mobile number');
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
        routes: [{ name: 'MainApp' }],
      });
    }, 1000);
  };
  const handleForgotPassword = () => {
    if (loading) return;
    navigation.navigate('ResetPassword');
  };

  // const handleCreateAccount = () => {
  //   if (loading) return;
  //   navigation.navigate('SignupScreen');
  // };

  // const handleGoogleLogin = () => {
  //   if (loading) return;
  //   Alert.alert('Coming Soon', 'Google login will be available soon.');
  // };

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
            contentContainerStyle={[styles.container, {backgroundColor: colors.white}]}
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

              <View
                style={styles.card}
                accessibilityLabel="Login form">
                <AppText style={styles.label}>Phone Number or Email Address</AppText>
                <TextInput
                  placeholder="Enter your phone number or email"
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
                  onSuccess={() => {
                    navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
                  }}
                  onError={(err) => {
                    if (err) Alert.alert('Biometric Login Failed', err);
                  }}
                />
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
