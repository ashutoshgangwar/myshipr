import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import React, { useState } from 'react';
import styles from './Login.styles';
import { useNavigation } from '@react-navigation/native';
import Button from '../../component/Button/Button';
import { colors } from '../../theme/colors';

const STATIC_OTP = '123456';

const Login = () => {
  const navigation = useNavigation();
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  const sendOtp = () => {
    if (mobile.length !== 10) {
      alert('Enter valid 10 digit mobile number');
      return;
    }
    setIsOtpSent(true);
    alert(`OTP sent! Use ${STATIC_OTP}`);
  };

  const verifyOtp = () => {
    if (otp !== STATIC_OTP) {
      alert('Invalid OTP');
      return;
    }
  navigation.reset({
  index: 0,
  routes: [{ name: 'MainApp' }],
});

  };

  const handleGoogleLogin = () => {
  navigation.reset({
  index: 0,
  routes: [{ name: 'MainApp' }],
});

  };

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <Image
          source={require('../../assets/Image/logo.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Login using your mobile number</Text>

        <TextInput
          placeholder="Mobile Number"
          keyboardType="number-pad"
          maxLength={10}
          value={mobile}
          editable={!isOtpSent}
          onChangeText={setMobile}
          style={[styles.input, isOtpSent && styles.disabledInput]}
        />

        {!isOtpSent ? (
          <>
            <Button
              title="Send OTP"
              onPress={sendOtp}
              textColor={colors.text_color_button}
              backgroundColor={colors.button_color}
            />

            {/* OR divider */}
            <View style={styles.orContainer}>
              <View style={styles.line} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.line} />
            </View>

            {/* Google Login Button */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}>
              <Image
                source={require('../../assets/Image/google_icon.png')}
                style={styles.googleIcon}
              />
              <Text style={styles.googleText}>Continue with Google</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              placeholder="Enter OTP"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              style={styles.input}
            />

            <Button
              title="Verify OTP"
              onPress={verifyOtp}
              textColor={colors.text_color_button}
              backgroundColor={colors.button_color}
            />

            <Text style={styles.resendText}>
              Didn’t receive OTP? <Text style={styles.resend}>Resend</Text>
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

export default Login;
