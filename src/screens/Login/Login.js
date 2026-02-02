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
import React, {useState, useRef} from 'react';
import styles from './Login.styles';
import {useNavigation} from '@react-navigation/native';
import Button from '../../component/Button/Button';
import {colors} from '../../theme/colors';
import Eye_off from '../../assets/svg_icon/eye-off.svg';
import Eye_outline from '../../assets/svg_icon/eye-outline.svg';

const Login = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef(null);

  const toggleShowPassword = () => {
    setShowPassword(prev => !prev);
  };

  const handleLogin = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!email.trim()) {
      Alert.alert('Required Field', 'Please enter your email address');
      return;
    }
    
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (!password) {
      Alert.alert('Required Field', 'Please enter your password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters');
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

  const handleGoogleLogin = () => {
    if (loading) return;
    
    setLoading(true);
    // TODO: Implement Google Auth logic
    setTimeout(() => {
      setLoading(false);
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

  const handleCreateAccount= () => {
    if (loading) return;
    navigation.navigate('CreateAccount');
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
          <View style={styles.card} accessible accessibilityLabel="Login form">
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Login with your email</Text>

            {/* Email Input */}
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
                style={[styles.input, styles.passwordInput, loading && styles.disabledInput]}
                accessibilityLabel="Password input"
                editable={!loading}
              />

              <TouchableOpacity
                onPress={toggleShowPassword}
                style={styles.showHideButton}
                disabled={loading}
                activeOpacity={0.7}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
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

            {/* Login Button */}
            {loading ? (
              <View style={[styles.button, styles.loadingButton]}>
                <ActivityIndicator color={colors.text_color_button || '#fff'} size="small" />
              </View>
            ) : (
              <Button
                title="Login"
                onPress={handleLogin}
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
            <TouchableOpacity
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
            </TouchableOpacity>
            
            <Button
                title="Create Account"
                onPress={handleCreateAccount}
                textColor={colors.whi}
                backgroundColor={colors.primary}
              />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default Login;